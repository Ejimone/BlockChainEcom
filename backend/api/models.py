from django.db import models

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField()

    def __str__(self):
        return self.name

class Order(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    order_id_chain = models.BigIntegerField(unique=True, help_text="Order ID from the blockchain")
    buyer_address = models.CharField(max_length=42)
    amount = models.DecimalField(max_digits=20, decimal_places=2)
    token_address = models.CharField(max_length=42)
    status = models.CharField(max_length=20, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.order_id_chain} for {self.product.name}"
