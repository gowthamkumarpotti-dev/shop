import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ArrowLeft, MapPin, NavigationArrow } from '@phosphor-icons/react';
import { toast } from 'sonner';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const agentIcon = new L.DivIcon({
  html: '<div style="background:#2E5C31;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg></div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const customerIcon = new L.DivIcon({
  html: '<div style="background:#CC5A3A;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const MapFitter = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 15);
    }
  }, [positions, map]);
  return null;
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const SOCKET_PATH = '/api/socket.io';

const DriverDeliveries = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingIntervalId, setTrackingIntervalId] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [agentLocation, setAgentLocation] = useState(null);
  const [showMapForOrder, setShowMapForOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    socketRef.current = io(BACKEND_URL, { path: SOCKET_PATH });
    socketRef.current.on('connect', () => {
      console.log('Connected to socket');
      socketRef.current.emit('join_user_room', { role: 'delivery_agent' });
    });
    socketRef.current.on('new_delivery_assignment', (data) => {
      toast.success(`New delivery assigned: Order ${data.order_id.slice(0, 8)}`);
      fetchOrders();
    });
    return () => {
      if (socketRef.current?.connected) socketRef.current.disconnect();
      if (trackingIntervalId) clearInterval(trackingIntervalId);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/orders`, { withCredentials: true });
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await axios.put(`${BACKEND_URL}/api/orders/${orderId}/status`, { status }, { withCredentials: true });
      toast.success(`Delivery status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const startLocationTracking = (orderId) => {
    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
    }
    setTrackingOrderId(orderId);
    setShowMapForOrder(orderId);
    if (navigator.geolocation) {
      const updateLocation = () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setAgentLocation({ latitude: lat, longitude: lng });
            // Send via REST API as primary
            try {
              await axios.put(
                `${BACKEND_URL}/api/deliveries/${orderId}/location`,
                { latitude: lat, longitude: lng },
                { withCredentials: true }
              );
            } catch (error) {
              console.error('REST location update failed:', error);
              // Fallback: send via Socket.io directly
              if (socketRef.current?.connected) {
                socketRef.current.emit('update_location', {
                  order_id: orderId,
                  latitude: lat,
                  longitude: lng
                });
              }
            }
          },
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
        );
      };
      updateLocation();
      const intervalId = setInterval(updateLocation, 5000);
      setTrackingIntervalId(intervalId);
      toast.success('Location tracking started');
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const stopLocationTracking = () => {
    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
      setTrackingIntervalId(null);
      setTrackingOrderId(null);
      toast.info('Location tracking stopped');
    }
  };

  const openNavigation = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/driver')} className="text-[#1C241D]" data-testid="back-button">
            <ArrowLeft size={20} className="mr-2" />Back
          </Button>
          <h1 className="text-4xl font-black tracking-tighter text-[#1C241D]" style={{ fontFamily: 'Cabinet Grotesk' }}>My Deliveries</h1>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl"></div>)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#576058]">No deliveries assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const hasCustomerCoords = order.latitude && order.longitude;
              const isTracking = trackingOrderId === order.id;
              const showMap = showMapForOrder === order.id;
              const distance = (agentLocation && hasCustomerCoords)
                ? haversineDistance(agentLocation.latitude, agentLocation.longitude, order.latitude, order.longitude)
                : null;
              const mapPositions = [];
              if (agentLocation) mapPositions.push([agentLocation.latitude, agentLocation.longitude]);
              if (hasCustomerCoords) mapPositions.push([order.latitude, order.longitude]);
              const routeLine = (agentLocation && hasCustomerCoords)
                ? [[agentLocation.latitude, agentLocation.longitude], [order.latitude, order.longitude]]
                : [];
              const mapCenter = agentLocation
                ? [agentLocation.latitude, agentLocation.longitude]
                : hasCustomerCoords ? [order.latitude, order.longitude] : [20.5937, 78.9629];

              return (
              <div key={order.id} className="bg-white rounded-xl p-6 border border-[#E5E5DF]" data-testid={`delivery-${order.id}`}>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-lg text-[#1C241D] mb-2">Order #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-[#576058] mb-1">Customer: {order.customer_name}</p>
                    <p className="text-sm text-[#576058] mb-1">Phone: {order.phone}</p>
                    <p className="text-sm text-[#576058] mb-1">Address: {order.delivery_address}</p>
                    <p className="text-sm text-[#576058] mb-1">Time Slot: {order.time_slot}</p>
                    <p className="text-lg font-bold text-[#2E5C31] mt-2">₹{order.total}</p>
                    {distance !== null && (
                      <p className="text-sm font-semibold text-[#CC5A3A] mt-1" data-testid={`distance-${order.id}`}>
                        Distance: {distance < 1 ? `${(distance * 1000).toFixed(0)} m` : `${distance.toFixed(1)} km`} remaining
                      </p>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#1C241D] mb-2 block">Update Status</label>
                      <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
                        <SelectTrigger data-testid={`status-select-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {order.status === 'out_for_delivery' && (
                      <div className="space-y-2">
                        {!isTracking ? (
                          <Button onClick={() => startLocationTracking(order.id)} className="w-full bg-[#2E5C31] hover:bg-[#244A27] text-white" data-testid={`start-tracking-${order.id}`}>
                            <MapPin size={20} className="mr-2" />Start Tracking
                          </Button>
                        ) : (
                          <Button onClick={stopLocationTracking} variant="outline" className="w-full border-[#CC5A3A] text-[#CC5A3A]" data-testid={`stop-tracking-${order.id}`}>
                            Stop Tracking
                          </Button>
                        )}
                        {hasCustomerCoords && (
                          <Button onClick={() => openNavigation(order.latitude, order.longitude)} variant="outline" className="w-full border-[#2E5C31] text-[#2E5C31]" data-testid={`navigate-${order.id}`}>
                            <NavigationArrow size={20} className="mr-2" />Open in Google Maps
                          </Button>
                        )}
                        {!showMap && (
                          <Button onClick={() => setShowMapForOrder(order.id)} variant="outline" className="w-full" data-testid={`show-map-${order.id}`}>
                            <MapPin size={20} className="mr-2" />Show Map
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {showMap && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-[#E5E5DF]" style={{ height: '350px' }} data-testid={`map-${order.id}`}>
                    <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                      {agentLocation && (
                        <Marker position={[agentLocation.latitude, agentLocation.longitude]} icon={agentIcon}>
                          <Popup>Your Location</Popup>
                        </Marker>
                      )}
                      {hasCustomerCoords && (
                        <Marker position={[order.latitude, order.longitude]} icon={customerIcon}>
                          <Popup>Customer: {order.delivery_address}</Popup>
                        </Marker>
                      )}
                      {routeLine.length === 2 && (
                        <Polyline positions={routeLine} color="#2E5C31" weight={3} dashArray="8,8" />
                      )}
                      <MapFitter positions={mapPositions} />
                    </MapContainer>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDeliveries;