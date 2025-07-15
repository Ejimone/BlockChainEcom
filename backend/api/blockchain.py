from web3 import Web3
from django.conf import settings
from web3.exceptions import ContractLogicError

class SmartContract:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.GANACHE_URL))
        if not self.w3.is_connected():
            raise ConnectionError("Failed to connect to Ganache")

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
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            if receipt.status == 0:
                raise Exception("Transaction failed")

            # Extract orderId from the PaymentPending event
            logs = self.ecommerce_contract.events.PaymentPending().process_receipt(receipt)
            if not logs:
                raise Exception("PaymentPending event not found in transaction receipt")
            
            order_id = logs[0]['args']['orderId']
            return order_id, self.buyer_account.address

        except ContractLogicError as e:
            raise Exception(f"Smart contract error: {e}")
        except Exception as e:
            raise Exception(f"Error creating order on blockchain: {e}")

    def process_payment(self, order_id, amount_wei):
        if not self.ecommerce_contract or not self.mock_erc20_contract:
            raise Exception("Contracts not initialized")

        owner_account = self.w3.eth.account.from_key(settings.OWNER_PRIVATE_KEY)

        # 1. Mint tokens to buyer
        nonce_mint = self.w3.eth.get_transaction_count(owner_account.address)
        mint_tx = self.mock_erc20_contract.functions.transfer(
            self.buyer_account.address, amount_wei
        ).build_transaction({
            'from': owner_account.address,
            'nonce': nonce_mint,
            'gas': 2000000,
            'gasPrice': self.w3.to_wei('20', 'gwei')
        })
        signed_mint_tx = self.w3.eth.account.sign_transaction(mint_tx, private_key=owner_account.key)
        self.w3.eth.send_raw_transaction(signed_mint_tx.rawTransaction)
        self.w3.eth.wait_for_transaction_receipt(signed_mint_tx.hash)

        # 2. Approve spending
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
        self.w3.eth.send_raw_transaction(signed_approve_tx.rawTransaction)
        self.w3.eth.wait_for_transaction_receipt(signed_approve_tx.hash)

        # 3. Process payment
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
        tx_hash = self.w3.eth.send_raw_transaction(signed_payment_tx.rawTransaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        if receipt.status == 0:
            raise Exception("Payment transaction failed")
