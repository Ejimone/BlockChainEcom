from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer
from .blockchain import SmartContract
from web3 import Web3
from django.shortcuts import get_object_or_404
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductList(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class OrderCreate(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product']
        amount = product.price

        try:
            sc = SmartContract()
            amount_wei = Web3.to_wei(amount, 'ether')
            token_address = sc.mock_erc20_contract.address

            order_id_chain, buyer_address = sc.create_order(amount_wei, token_address)

            order = serializer.save(
                order_id_chain=order_id_chain,
                buyer_address=buyer_address,
                amount=amount,
                token_address=token_address
            )

            response_data = {
                'id': order.id,
                'order_id_chain': order_id_chain,
                'buyer_address': buyer_address,
                'amount': float(amount),
                'token_address': token_address,
                'status': order.status,
                'product': ProductSerializer(product).data,
                'created_at': order.created_at
            }

            headers = self.get_success_headers(serializer.data)
            return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProcessPaymentView(APIView):
    """
    Process payment for a specific order using Ganache blockchain
    """
    def post(self, request, order_id):
        try:
            # Get the order from database
            order = get_object_or_404(Order, id=order_id)
            
            if order.status != 'Pending':
                return Response(
                    {"error": f"Cannot process payment. Order status is '{order.status}'. Only pending orders can be processed."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize smart contract connection
            sc = SmartContract()
            
            # Convert amount to Wei
            amount_wei = Web3.to_wei(order.amount, 'ether')
            
            logger.info(f"Processing payment for order {order.id} (blockchain ID: {order.order_id_chain})")
            
            # Process payment on blockchain
            tx_hash = sc.process_payment(order.order_id_chain, amount_wei)
            
            # Update order status
            order.status = 'Paid'
            order.save()
            
            logger.info(f"Payment processed successfully for order {order.id}")
            
            return Response({
                'message': 'Payment processed successfully',
                'transaction_hash': tx_hash.hex(),
                'order_id': order.id,
                'order_id_chain': order.order_id_chain,
                'status': order.status
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error processing payment for order {order_id}: {str(e)}")
            return Response(
                {"error": f"Payment processing failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class OrderStatusView(APIView):
    """
    Get the status of a specific order
    """
    def get(self, request, order_id):
        try:
            # Get the order from database
            order = get_object_or_404(Order, id=order_id)
            
            # Initialize smart contract connection
            sc = SmartContract()
            
            # Get order status from blockchain
            blockchain_order = sc.get_order_status(order.order_id_chain)
            
            # Map blockchain status to readable format
            status_map = {
                0: 'Pending',
                1: 'Paid',
                2: 'Refunded',
                3: 'Cancelled'
            }
            
            blockchain_status = status_map.get(blockchain_order['status'], 'Unknown')
            
            # Update local database if status changed
            if order.status != blockchain_status:
                order.status = blockchain_status
                order.save()
            
            return Response({
                'order_id': order.id,
                'order_id_chain': order.order_id_chain,
                'status': order.status,
                'blockchain_status': blockchain_status,
                'amount': float(order.amount),
                'buyer_address': order.buyer_address,
                'token_address': order.token_address,
                'product': ProductSerializer(order.product).data,
                'created_at': order.created_at
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error getting order status for order {order_id}: {str(e)}")
            return Response(
                {"error": f"Failed to get order status: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class OrderListView(generics.ListAPIView):
    """
    List all orders
    """
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

class CancelOrderView(APIView):
    """
    Cancel a specific order
    """
    def post(self, request, order_id):
        try:
            # Get the order from database
            order = get_object_or_404(Order, id=order_id)
            
            if order.status != 'Pending':
                return Response(
                    {"error": f"Cannot cancel order. Order status is '{order.status}'. Only pending orders can be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize smart contract connection
            sc = SmartContract()
            
            logger.info(f"Cancelling order {order.id} (blockchain ID: {order.order_id_chain})")
            
            # Cancel order on blockchain
            tx_hash = sc.cancel_order(order.order_id_chain)
            
            # Update order status
            order.status = 'Cancelled'
            order.save()
            
            logger.info(f"Order {order.id} cancelled successfully")
            
            return Response({
                'message': 'Order cancelled successfully',
                'transaction_hash': tx_hash.hex(),
                'order_id': order.id,
                'order_id_chain': order.order_id_chain,
                'status': order.status
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error cancelling order {order_id}: {str(e)}")
            return Response(
                {"error": f"Order cancellation failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class RefundOrderView(APIView):
    """
    Initiate refund for a specific order
    """
    def post(self, request, order_id):
        try:
            # Get the order from database
            order = get_object_or_404(Order, id=order_id)
            
            if order.status != 'Paid':
                return Response(
                    {"error": f"Cannot refund order. Order status is '{order.status}'. Only paid orders can be refunded."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize smart contract connection
            sc = SmartContract()
            
            logger.info(f"Initiating refund for order {order.id} (blockchain ID: {order.order_id_chain})")
            
            # Initiate refund on blockchain
            tx_hash = sc.initiate_refund(order.order_id_chain)
            
            # Update order status
            order.status = 'Refunded'
            order.save()
            
            logger.info(f"Refund initiated for order {order.id}")
            
            return Response({
                'message': 'Refund initiated successfully',
                'transaction_hash': tx_hash.hex(),
                'order_id': order.id,
                'order_id_chain': order.order_id_chain,
                'status': order.status
            }, status=status.HTTP_200_OK)
            
        except Order.DoesNotExist:
            return Response(
                {"error": "Order not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error initiating refund for order {order_id}: {str(e)}")
            return Response(
                {"error": f"Refund initiation failed: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

class BlockchainInfoView(APIView):
    """
    Get blockchain connection information for debugging
    """
    def get(self, request):
        try:
            sc = SmartContract()
            info = sc.get_connection_info()
            
            # Add balance information
            info['buyer_balance'] = float(sc.get_buyer_balance())
            info['contract_balance'] = float(sc.get_contract_balance())
            
            return Response(info, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting blockchain info: {str(e)}")
            return Response(
                {"error": f"Failed to get blockchain info: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
