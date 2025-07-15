"use client";

import { useState, useEffect } from 'react';
import LoadingSpinner from "@/components/LoadingSpinner";
import ApiService from '@/services/api';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await ApiService.getOrders();
        setOrders(data);
      } catch (err) {
        setError('Failed to fetch orders. Please make sure the backend is running.');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="xl" text="Loading orders..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Order History</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Order History</h1>
      
      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No orders found.</p>
          <a href="/" className="text-blue-500 hover:text-blue-700 mt-2 inline-block">
            Start shopping
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{order.product.name}</h3>
                  <p className="text-gray-600">Order ID: {order.id}</p>
                  <p className="text-gray-600">Blockchain ID: {order.order_id_chain}</p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <p className="text-2xl font-bold text-green-600 mt-2">${order.amount}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <img
                  src={order.product.image_path || order.product.image_url || "/placeholder.svg"}
                  alt={order.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="text-gray-700">{order.product.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Ordered on: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>Buyer: {order.buyer_address}</p>
                <p>Token: {order.token_address}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
