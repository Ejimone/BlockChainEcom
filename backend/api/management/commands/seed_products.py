from django.core.management.base import BaseCommand
from api.models import Product
import os
from urllib.request import urlretrieve
from django.core.files import File

class Command(BaseCommand):
    help = 'Seeds the database with initial product data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Deleting existing products...')
        Product.objects.all().delete()

        products = [
            {
                'name': 'Laptop',
                'description': 'A high-performance laptop perfect for work and gaming.',
                'price': '1200.00',
                'image_url': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop'
            },
            {
                'name': 'Smartphone',
                'description': 'Latest model smartphone with advanced features.',
                'price': '800.00',
                'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop'
            },
            {
                'name': 'Headphones',
                'description': 'Premium noise-cancelling headphones for immersive audio.',
                'price': '250.00',
                'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop'
            },
            {
                'name': 'Smartwatch',
                'description': 'Advanced smartwatch with health tracking and notifications.',
                'price': '350.00',
                'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop'
            },
            {
                'name': 'Tablet',
                'description': 'Lightweight tablet perfect for reading and productivity.',
                'price': '600.00',
                'image_url': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop'
            },
            {
                'name': 'Wireless Mouse',
                'description': 'Ergonomic wireless mouse with precision tracking.',
                'price': '45.00',
                'image_url': 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=300&fit=crop'
            }
        ]

        self.stdout.write('Creating new products...')
        for product_data in products:
            Product.objects.create(**product_data)
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded the database with products.'))
