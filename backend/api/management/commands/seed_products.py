from django.core.management.base import BaseCommand
from api.models import Product

class Command(BaseCommand):
    help = 'Seeds the database with initial product data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Deleting existing products...')
        Product.objects.all().delete()

        products = [
            {
                'name': 'Laptop',
                'description': 'A high-performance laptop.',
                'price': '1200.00',
                'image_url': 'https://via.placeholder.com/150'
            },
            {
                'name': 'Smartphone',
                'description': 'A latest model smartphone.',
                'price': '800.00',
                'image_url': 'https://via.placeholder.com/150'
            },
            {
                'name': 'Headphones',
                'description': 'Noise-cancelling headphones.',
                'price': '250.00',
                'image_url': 'https://via.placeholder.com/150'
            }
        ]

        self.stdout.write('Creating new products...')
        for product_data in products:
            Product.objects.create(**product_data)
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with products.'))
