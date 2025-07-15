"use client";

import { useState } from 'react';
import Image from "next/image";
import ApiService from '@/services/api';

const ProductCard = ({ product }) => {
  const [loading, setLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);

  const handleAddToCart = async () => {
    try {
      setLoading(true);
      setOrderStatus('Creating order...');
      
      // Create order
      const order = await ApiService.createOrder(product.id);
      setOrderStatus(`Order created! ID: ${order.id}`);
      
      // Process payment
      setOrderStatus('Processing payment...');
      const payment = await ApiService.processPayment(order.id);
      
      setOrderStatus(`Payment successful! Transaction: ${payment.transaction_hash.substring(0, 10)}...`);
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setOrderStatus(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error processing order:', error);
      setOrderStatus('Error processing order. Please try again.');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setOrderStatus(null);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = () => {
    // Use image_path from backend, fallback to image_url, then placeholder
    if (product.image_path && product.image_path.startsWith('/media/')) {
      return `http://localhost:8000${product.image_path}`;
    }
    return product.image_path || product.image_url || "/placeholder.svg";
  };

  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="border rounded-lg p-4 shadow-lg">
      <div className="relative">
        <Image
          src={imageError ? "/placeholder.svg" : getImageSrc()}
          alt={product.name}
          width={300}
          height={200}
          className="w-full h-48 object-cover mb-4 rounded"
          onError={handleImageError}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </div>
      
      <h2 className="text-xl font-bold mb-2">{product.name}</h2>
      <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
      
      <div className="mt-4 flex justify-between items-center">
        <span className="text-2xl font-bold text-green-600">${product.price}</span>
        
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {loading ? 'Processing...' : 'Buy Now'}
        </button>
      </div>
      
      {orderStatus && (
        <div className={`mt-3 p-2 rounded text-sm ${
          orderStatus.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : orderStatus.includes('successful')
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {orderStatus}
        </div>
      )}
    </div>
  );
};

export default ProductCard;
