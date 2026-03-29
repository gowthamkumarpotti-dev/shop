import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Package, CheckCircle, Truck } from '@phosphor-icons/react';
import { toast } from 'sonner';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const deliveryAgentIcon = new L.DivIcon({
  html: `<div style="background:#CC5A3A;width:30px;height:30px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const SOCKET_PATH = '/api/socket.io';

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const pollRef = useRef(null);
  const [order, setOrder] = useState(null);
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    socketRef.current = io(BACKEND_URL, { path: SOCKET_PATH, transports: ['websocket', 'polling'] });
    socketRef.current.on('connect', () => {
      console.log('Connected to socket');
      socketRef.current.emit('join_order_room', { order_id: orderId });
    });
    socketRef.current.on('order_status_update', (data) => {
      if (data.order_id === orderId) {
        toast.info(`Order status: ${data.status}`);
        fetchOrder();
      }
    });
    socketRef.current.on('delivery_location_update', (data) => {
      if (data.order_id === orderId) {
        setDeliveryLocation({ latitude: data.latitude, longitude: data.longitude });
      }
    });

    // Polling fallback: refetch order every 8 seconds for location
    pollRef.current = setInterval(() => {
      fetchOrder();
    }, 8000);

    return () => {
      if (socketRef.current?.connected) socketRef.current.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/orders/${orderId}`, { withCredentials: true });
      setOrder(data);
      if (data.delivery_location) {
        setDeliveryLocation(data.delivery_location);
      }
    } catch (error) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5C31]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1C241D] mb-4">Order not found</h2>
          <Button onClick={() => navigate('/shop/orders')} className="bg-[#2E5C31] hover:bg-[#244A27] text-white">View Orders</Button>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { key: 'placed', label: 'Order Placed', icon: Package },
    { key: 'accepted', label: 'Accepted', icon: CheckCircle },
    { key: 'packed', label: 'Packed', icon: Package },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
  const defaultCenter = order.latitude && order.longitude ? [order.latitude, order.longitude] : [20.5937, 78.9629];
  const mapCenter = deliveryLocation ? [deliveryLocation.latitude, deliveryLocation.longitude] : defaultCenter;

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate('/shop/orders')} className="mb-6 text-[#1C241D]" data-testid="back-button">
          <ArrowLeft size={20} className="mr-2" />Back to Orders
        </Button>
        <h1 className="text-4xl font-black tracking-tighter text-[#1C241D] mb-8" style={{ fontFamily: 'Cabinet Grotesk' }}>Track Order</h1>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-[#1C241D] mb-4">Order #{order.id.slice(0, 8)}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#576058]">Status</span>
                  <span className="font-semibold text-[#2E5C31] capitalize">{order.status.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#576058]">Total</span>
                  <span className="font-semibold text-[#1C241D]">₹{order.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#576058]">Time Slot</span>
                  <span className="font-semibold text-[#1C241D]">{order.time_slot}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-lg text-[#1C241D] mb-4">Order Status</h3>
              <div className="space-y-4">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index <= currentStepIndex;
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-[#2E5C31] text-white' : 'bg-[#E5E5DF] text-[#576058]'}`}>
                        <Icon size={20} weight="duotone" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isActive ? 'text-[#1C241D]' : 'text-[#576058]'}`}>{step.label}</p>
                        {order.status_history && order.status_history.find(h => h.status === step.key) && (
                          <p className="text-xs text-[#576058]">{new Date(order.status_history.find(h => h.status === step.key).timestamp).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl p-6 shadow-sm h-[600px]" data-testid="live-tracking-map">
              <h3 className="font-bold text-lg text-[#1C241D] mb-4">Live Tracking</h3>
              <div className="h-[500px] rounded-xl overflow-hidden">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                  {order.latitude && order.longitude && (
                    <Marker position={[order.latitude, order.longitude]}>
                      <Popup>Delivery Address</Popup>
                    </Marker>
                  )}
                  {deliveryLocation && (
                    <Marker position={[deliveryLocation.latitude, deliveryLocation.longitude]} icon={deliveryAgentIcon}>
                      <Popup>Delivery Agent</Popup>
                    </Marker>
                  )}
                  <MapUpdater center={mapCenter} />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;