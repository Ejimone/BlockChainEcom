from rest_framework import serializers
from .models import Product, Order

class ProductSerializer(serializers.ModelSerializer):
    image_path = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'image', 'image_url', 'image_path']

class OrderSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = Order
        fields = ['id', 'product', 'product_id', 'order_id_chain', 'buyer_address', 'amount', 'token_address', 'status', 'created_at']
        read_only_fields = ['order_id_chain', 'buyer_address', 'amount', 'token_address', 'status', 'created_at']
