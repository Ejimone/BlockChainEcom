from django.core.management.base import BaseCommand
from api.models import Product, Order
from api.blockchain import SmartContract
from web3 import Web3
import time

class Command(BaseCommand):
    help = 'Test the payment functionality end-to-end'

    def add_arguments(self, parser):
        parser.add_argument(
            '--product-id',
            type=int,
            default=1,
            help='Product ID to create order for'
        )

    def handle(self, *args, **options):
        product_id = options['product_id']
        
        try:
            # Get product
            product = Product.objects.get(id=product_id)
            self.stdout.write(f'Testing payment for product: {product.name} (${product.price})')
            
            # Initialize blockchain connection
            sc = SmartContract()
            info = sc.get_connection_info()
            self.stdout.write(f'Connected to blockchain (Chain ID: {info["chain_id"]})')
            
            # Create order
            self.stdout.write('Creating order...')
            amount_wei = Web3.to_wei(product.price, 'ether')
            token_address = sc.mock_erc20_contract.address
            
            order_id_chain, buyer_address = sc.create_order(amount_wei, token_address)
            
            # Save order to database
            order = Order.objects.create(
                product=product,
                order_id_chain=order_id_chain,
                buyer_address=buyer_address,
                amount=product.price,
                token_address=token_address
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Order created: ID {order.id}, Chain ID {order_id_chain}')
            )
            
            # Process payment
            self.stdout.write('Processing payment...')
            tx_hash = sc.process_payment(order_id_chain, amount_wei)
            
            # Update order status
            order.status = 'Paid'
            order.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Payment processed successfully!')
            )
            self.stdout.write(f'Transaction hash: {tx_hash.hex()}')
            
            # Get final status
            blockchain_order = sc.get_order_status(order_id_chain)
            self.stdout.write(f'Final order status: {blockchain_order["status"]}')
            
            # Get balances
            buyer_balance = sc.get_buyer_balance()
            contract_balance = sc.get_contract_balance()
            
            self.stdout.write(f'Buyer balance: {buyer_balance} ETH')
            self.stdout.write(f'Contract balance: {contract_balance} ETH')
            
        except Product.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'Product with ID {product_id} not found')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error: {str(e)}')
            )
