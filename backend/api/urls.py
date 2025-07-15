from django.urls import path
from .views import (
    ProductList, 
    OrderCreate, 
    ProcessPaymentView, 
    OrderStatusView, 
    OrderListView,
    CancelOrderView,
    RefundOrderView,
    BlockchainInfoView
)

urlpatterns = [
    path('products/', ProductList.as_view(), name='product-list'),
    path('orders/', OrderCreate.as_view(), name='order-create'),
    path('orders/list/', OrderListView.as_view(), name='order-list'),
    path('orders/<int:order_id>/payment/', ProcessPaymentView.as_view(), name='process-payment'),
    path('orders/<int:order_id>/status/', OrderStatusView.as_view(), name='order-status'),
    path('orders/<int:order_id>/cancel/', CancelOrderView.as_view(), name='cancel-order'),
    path('orders/<int:order_id>/refund/', RefundOrderView.as_view(), name='refund-order'),
    path('blockchain/info/', BlockchainInfoView.as_view(), name='blockchain-info'),
]
