from rest_framework import serializers
from .models import Product, Order

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Order
        fields = ['id', 'product', 'product_id', 'order_id_chain', 'buyer_address', 'amount', 'token_address', 'status', 'created_at']
        read_only_fields = ['order_id_chain', 'buyer_address', 'status', 'created_at']
