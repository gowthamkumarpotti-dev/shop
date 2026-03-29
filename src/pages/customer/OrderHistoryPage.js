import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Eye } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/orders`, { withCredentials: true });
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-6 text-[#1C241D]" data-testid="back-button">
          <ArrowLeft size={20} className="mr-2" />Back to Shop
        </Button>
        <h1 className="text-4xl font-black tracking-tighter text-[#1C241D] mb-8" style={{ fontFamily: 'Cabinet Grotesk' }}>Order History</h1>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl"></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#576058] mb-4">No orders yet</p>
            <Button onClick={() => navigate('/shop')} className="bg-[#2E5C31] hover:bg-[#244A27] text-white">Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm" data-testid={`order-${order.id}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#1C241D]">Order #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-[#576058]">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-[#2E5C31]" style={{ fontFamily: 'Cabinet Grotesk' }}>₹{order.total}</p>
                    <p className="text-sm font-semibold text-[#2E5C31] capitalize">{order.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  {order.products.slice(0, 3).map((product, idx) => (
                    <img key={idx} src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
                  ))}
                  {order.products.length > 3 && (
                    <div className="w-16 h-16 bg-[#E5E5DF] rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#576058]">+{order.products.length - 3}</span>
                    </div>
                  )}
                </div>
                <Button onClick={() => navigate(`/shop/track/${order.id}`)} className="w-full bg-[#2E5C31] hover:bg-[#244A27] text-white" data-testid={`track-${order.id}`}>
                  <Eye size={20} className="mr-2" />Track Order
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;