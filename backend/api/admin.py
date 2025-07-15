from django.contrib import admin, messages
from .models import Product, Order
from .blockchain import SmartContract
from web3 import Web3

@admin.action(description='Create sale for selected products')
def create_sale(modeladmin, request, queryset):
    try:
        sc = SmartContract()
        for product in queryset:
            amount_wei = Web3.to_wei(product.price, 'ether')
            token_address = sc.mock_erc20_contract.address

            order_id_chain, buyer_address = sc.create_order(amount_wei, token_address)

            Order.objects.create(
                product=product,
                order_id_chain=order_id_chain,
                buyer_address=buyer_address,
                amount=product.price,
                token_address=token_address,
                status='Pending'
            )
        messages.success(request, f'{len(queryset)} sales created successfully.')
    except Exception as e:
        messages.error(request, f'Error creating sales: {e}')

@admin.action(description='Process payment for selected orders')
def process_payment(modeladmin, request, queryset):
    try:
        sc = SmartContract()
        for order in queryset:
            if order.status == 'Pending':
                amount_wei = Web3.to_wei(order.amount, 'ether')
                sc.process_payment(order.order_id_chain, amount_wei)
                order.status = 'Completed'
                order.save()
        messages.success(request, f'{len(queryset)} payments processed successfully.')
    except Exception as e:
        messages.error(request, f'Error processing payments: {e}')

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'description')
    actions = [create_sale]

class OrderAdmin(admin.ModelAdmin):
    list_display = ('product', 'order_id_chain', 'buyer_address', 'amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('product__name', 'buyer_address')
    actions = [process_payment]

admin.site.register(Product, ProductAdmin)
admin.site.register(Order, OrderAdmin)
