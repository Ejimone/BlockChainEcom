from django.urls import path
from .views import ProductList, OrderCreate

urlpatterns = [
    path('products/', ProductList.as_view(), name='product-list'),
    path('orders/', OrderCreate.as_view(), name='order-create'),
]
