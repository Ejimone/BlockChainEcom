from web3 import Web3
from django.conf import settings
from web3.exceptions import ContractLogicError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartContract:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.GANACHE_URL))
        if not self.w3.is_connected():
            raise ConnectionError("Failed to connect to Ganache")

        self.owner_account = self.w3.eth.account.from_key(settings.OWNER_PRIVATE_KEY)
        self.buyer_account = self.w3.eth.account.from_key(settings.BUYER_PRIVATE_KEY)

        self.ecommerce_contract = self._get_contract(
            settings.ECOMMERCE_CONTRACT_ADDRESS,
            settings.ECOMMERCE_CONTRACT_ABI
        )
        self.mock_erc20_contract = self._get_contract(
            settings.MOCK_ERC20_CONTRACT_ADDRESS,
            settings.MOCK_ERC20_CONTRACT_ABI
        )

    def _get_contract(self, address, abi):
        if not address or not abi:
            return None
        return self.w3.eth.contract(address=address, abi=abi)

    def create_order(self, amount_wei, token_address):
        """
        Create an order on the blockchain
        """
        if not self.ecommerce_contract:
            raise Exception("E-commerce contract not initialized")

        nonce = self.w3.eth.get_transaction_count(self.buyer_account.address)
        tx_data = {
            'from': self.buyer_account.address,
            'nonce': nonce,
            'gas': 2000000,
            'gasPrice': self.w3.to_wei('20', 'gwei')
        }

        try:
            tx = self.ecommerce_contract.functions.createOrder(
                amount_wei,
                token_address
            ).build_transaction(tx_data)

            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.buyer_account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            if receipt.status == 0:
                raise Exception("Transaction failed")

            # Extract orderId from the PaymentPending event
            logs = self.ecommerce_contract.events.PaymentPending().process_receipt(receipt)
            if not logs:
                raise Exception("PaymentPending event not found in transaction receipt")
            
            order_id = logs[0]['args']['orderId']
            logger.info(f"Order created successfully with ID: {order_id}")
            return order_id, self.buyer_account.address

        except ContractLogicError as e:
            raise Exception(f"Smart contract error: {e}")
        except Exception as e:
            raise Exception(f"Error creating order on blockchain: {e}")

    def process_payment(self, order_id, amount_wei):
        """
        Process payment for an order
        """
        if not self.ecommerce_contract or not self.mock_erc20_contract:
            raise Exception("Contracts not initialized")

        logger.info(f"Starting payment process for order {order_id}")

        try:
            # 1. Mint tokens to buyer (owner transfers tokens to buyer)
            logger.info(f"Minting {Web3.from_wei(amount_wei, 'ether')} tokens to buyer...")
            nonce_mint = self.w3.eth.get_transaction_count(self.owner_account.address)
            mint_tx = self.mock_erc20_contract.functions.transfer(
                self.buyer_account.address, amount_wei
            ).build_transaction({
                'from': self.owner_account.address,
                'nonce': nonce_mint,
                'gas': 2000000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })
            signed_mint_tx = self.w3.eth.account.sign_transaction(mint_tx, private_key=self.owner_account.key)
            mint_tx_hash = self.w3.eth.send_raw_transaction(signed_mint_tx.raw_transaction)
            mint_receipt = self.w3.eth.wait_for_transaction_receipt(mint_tx_hash)
            
            if mint_receipt.status == 0:
                raise Exception("Token minting failed")
            
            logger.info("Tokens minted successfully")

            # 2. Approve spending
            logger.info("Approving contract to spend tokens...")
            nonce_approve = self.w3.eth.get_transaction_count(self.buyer_account.address)
            approve_tx = self.mock_erc20_contract.functions.approve(
                self.ecommerce_contract.address, amount_wei
            ).build_transaction({
                'from': self.buyer_account.address,
                'nonce': nonce_approve,
                'gas': 2000000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })
            signed_approve_tx = self.w3.eth.account.sign_transaction(approve_tx, private_key=self.buyer_account.key)
            approve_tx_hash = self.w3.eth.send_raw_transaction(signed_approve_tx.raw_transaction)
            approve_receipt = self.w3.eth.wait_for_transaction_receipt(approve_tx_hash)
            
            if approve_receipt.status == 0:
                raise Exception("Token approval failed")
            
            logger.info("Token approval successful")

            # 3. Process payment
            logger.info("Processing payment...")
            nonce_payment = self.w3.eth.get_transaction_count(self.buyer_account.address)
            payment_tx = self.ecommerce_contract.functions.processTokenPayment(
                order_id
            ).build_transaction({
                'from': self.buyer_account.address,
                'nonce': nonce_payment,
                'gas': 2000000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })
            signed_payment_tx = self.w3.eth.account.sign_transaction(payment_tx, private_key=self.buyer_account.key)
            payment_tx_hash = self.w3.eth.send_raw_transaction(signed_payment_tx.raw_transaction)
            payment_receipt = self.w3.eth.wait_for_transaction_receipt(payment_tx_hash)

            if payment_receipt.status == 0:
                raise Exception("Payment transaction failed")

            logger.info(f"Payment processed successfully for order {order_id}")
            return payment_tx_hash

        except ContractLogicError as e:
            raise Exception(f"Smart contract error during payment: {e}")
        except Exception as e:
            raise Exception(f"Error processing payment: {e}")

    def get_order_status(self, order_id):
        """
        Get order status from blockchain
        """
        if not self.ecommerce_contract:
            raise Exception("E-commerce contract not initialized")

        try:
            order = self.ecommerce_contract.functions.getOrder(order_id).call()
            return {
                'buyer': order[0],
                'amount': order[1],
                'status': order[2],
                'timestamp': order[3],
                'payment_token': order[4],
                'is_token_payment': order[5]
            }
        except Exception as e:
            raise Exception(f"Error getting order status: {e}")

    def get_buyer_balance(self):
        """
        Get buyer's token balance
        """
        if not self.mock_erc20_contract:
            raise Exception("ERC20 contract not initialized")

        try:
            balance = self.mock_erc20_contract.functions.balanceOf(self.buyer_account.address).call()
            return Web3.from_wei(balance, 'ether')
        except Exception as e:
            raise Exception(f"Error getting buyer balance: {e}")

    def get_contract_balance(self):
        """
        Get contract's token balance
        """
        if not self.mock_erc20_contract or not self.ecommerce_contract:
            raise Exception("Contracts not initialized")

        try:
            balance = self.mock_erc20_contract.functions.balanceOf(self.ecommerce_contract.address).call()
            return Web3.from_wei(balance, 'ether')
        except Exception as e:
            raise Exception(f"Error getting contract balance: {e}")

    def cancel_order(self, order_id):
        """
        Cancel an order
        """
        if not self.ecommerce_contract:
            raise Exception("E-commerce contract not initialized")

        try:
            nonce = self.w3.eth.get_transaction_count(self.buyer_account.address)
            tx = self.ecommerce_contract.functions.cancelOrders([order_id]).build_transaction({
                'from': self.buyer_account.address,
                'nonce': nonce,
                'gas': 2000000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.buyer_account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 0:
                raise Exception("Order cancellation failed")
            
            logger.info(f"Order {order_id} cancelled successfully")
            return tx_hash
            
        except Exception as e:
            raise Exception(f"Error cancelling order: {e}")

    def initiate_refund(self, order_id):
        """
        Initiate a refund for an order
        """
        if not self.ecommerce_contract:
            raise Exception("E-commerce contract not initialized")

        try:
            nonce = self.w3.eth.get_transaction_count(self.buyer_account.address)
            tx = self.ecommerce_contract.functions.initiateRefund(order_id).build_transaction({
                'from': self.buyer_account.address,
                'nonce': nonce,
                'gas': 2000000,
                'gasPrice': self.w3.to_wei('20', 'gwei')
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.buyer_account.key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 0:
                raise Exception("Refund initiation failed")
            
            logger.info(f"Refund initiated for order {order_id}")
            return tx_hash
            
        except Exception as e:
            raise Exception(f"Error initiating refund: {e}")

    def get_connection_info(self):
        """
        Get connection information for debugging
        """
        return {
            'is_connected': self.w3.is_connected(),
            'chain_id': self.w3.eth.chain_id,
            'latest_block': self.w3.eth.block_number,
            'owner_address': self.owner_account.address,
            'buyer_address': self.buyer_account.address,
            'ecommerce_contract_address': self.ecommerce_contract.address if self.ecommerce_contract else None,
            'mock_erc20_contract_address': self.mock_erc20_contract.address if self.mock_erc20_contract else None
        }
