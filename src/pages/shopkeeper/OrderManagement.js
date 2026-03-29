import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const SOCKET_PATH = '/api/socket.io';

const OrderManagement = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchAgents();
    socketRef.current = io(BACKEND_URL, { path: SOCKET_PATH });
    socketRef.current.on('connect', () => {
      console.log('Connected to socket');
      socketRef.current.emit('join_user_room', { role: 'shopkeeper' });
    });
    socketRef.current.on('new_order', (data) => {
      toast.info(`New order from ${data.customer_name}`);
      fetchOrders();
    });
    return () => {
      if (socketRef.current?.connected) socketRef.current.disconnect();
    };
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

  const fetchAgents = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/delivery-agents`, { withCredentials: true });
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await axios.put(`${BACKEND_URL}/api/orders/${orderId}/status`, { status }, { withCredentials: true });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleAssignAgent = async (orderId, agentId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/orders/${orderId}/assign`, { agent_id: agentId }, { withCredentials: true });
      toast.success('Delivery agent assigned');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to assign agent');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/admin')} className="text-[#1C241D]" data-testid="back-button">
            <ArrowLeft size={20} className="mr-2" />Back
          </Button>
          <h1 className="text-4xl font-black tracking-tighter text-[#1C241D]" style={{ fontFamily: 'Cabinet Grotesk' }}>Order Management</h1>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl"></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#576058]">No orders yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-6 border border-[#E5E5DF]" data-testid={`order-${order.id}`}>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-lg text-[#1C241D] mb-2">Order #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-[#576058] mb-1">Customer: {order.customer_name}</p>
                    <p className="text-sm text-[#576058] mb-1">Phone: {order.phone}</p>
                    <p className="text-sm text-[#576058] mb-1">Address: {order.delivery_address}</p>
                    <p className="text-sm text-[#576058] mb-1">Time Slot: {order.time_slot}</p>
                    <p className="text-lg font-bold text-[#2E5C31] mt-2">₹{order.total}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-[#1C241D] mb-2 block">Order Status</Label>
                    <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                      <SelectTrigger data-testid={`status-select-${order.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placed">Placed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-[#1C241D] mb-2 block">Assign Delivery Agent</Label>
                    {order.delivery_agent_name ? (
                      <p className="text-sm font-semibold text-[#2E5C31]">Assigned to: {order.delivery_agent_name}</p>
                    ) : (
                      <Select onValueChange={(value) => handleAssignAgent(order.id, value)}>
                        <SelectTrigger data-testid={`agent-select-${order.id}`}>
                          <SelectValue placeholder="Select agent" />
                        </SelectTrigger>
                        <SelectContent>
                          {agents.map((agent) => (
                            <SelectItem key={agent._id} value={agent._id}>{agent.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[#E5E5DF]">
                  <p className="text-sm font-medium text-[#1C241D] mb-2">Items:</p>
                  <div className="flex gap-2 flex-wrap">
                    {order.products.map((product, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-[#FAFAF7] rounded-lg p-2">
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        <div>
                          <p className="text-xs font-semibold text-[#1C241D]">{product.name}</p>
                          <p className="text-xs text-[#576058]">Qty: {product.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Label = ({ children, className }) => <label className={className}>{children}</label>;

export default OrderManagement;