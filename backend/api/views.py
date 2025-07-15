from rest_framework import generics, status
from rest_framework.response import Response
from .models import Product, Order
from .serializers import ProductSerializer, OrderSerializer
from .blockchain import SmartContract
from web3 import Web3

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

            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
