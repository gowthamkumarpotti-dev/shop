import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, MapPin } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    delivery_address: '',
    phone: user?.phone || '',
    time_slot: '',
    latitude: null,
    longitude: null
  });

  const timeSlots = ['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '1:00 PM - 3:00 PM', '3:00 PM - 5:00 PM', '5:00 PM - 7:00 PM', '7:00 PM - 9:00 PM'];

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      toast.info('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({ ...formData, latitude: position.coords.latitude, longitude: position.coords.longitude });
          toast.success('Location captured!');
        },
        () => toast.error('Failed to get location.')
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return toast.error('Your cart is empty!');
    if (!formData.time_slot) return toast.error('Please select a delivery time slot');
    setLoading(true);
    try {
      const orderData = {
        products: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity, image: item.image })),
        delivery_address: formData.delivery_address,
        phone: formData.phone,
        time_slot: formData.time_slot,
        total: getTotal(),
        latitude: formData.latitude,
        longitude: formData.longitude
      };
      const { data } = await axios.post(`${BACKEND_URL}/api/orders`, orderData, { withCredentials: true });
      toast.success('Order placed successfully!');
      clearCart();
      navigate(`/shop/track/${data.id}`);
    } catch (error) {
      toast.error('Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1C241D] mb-4" style={{ fontFamily: 'Cabinet Grotesk' }}>Your cart is empty</h2>
          <Button onClick={() => navigate('/shop')} className="bg-[#2E5C31] hover:bg-[#244A27] text-white">Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => navigate('/shop')} className="mb-6 text-[#1C241D]" data-testid="back-button">
          <ArrowLeft size={20} className="mr-2" />Back to Shop
        </Button>
        <h1 className="text-4xl font-black tracking-tighter text-[#1C241D] mb-8" style={{ fontFamily: 'Cabinet Grotesk' }}>Checkout</h1>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-6">
              <div>
                <Label htmlFor="address" className="text-[#1C241D] font-medium">Delivery Address *</Label>
                <Textarea id="address" placeholder="Enter your complete address" value={formData.delivery_address} onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })} required rows={3} className="mt-1.5" data-testid="address-input" />
              </div>
              <Button type="button" variant="outline" onClick={handleGetLocation} className="w-full border-[#2E5C31] text-[#2E5C31] hover:bg-[#2E5C31] hover:text-white" data-testid="get-location-button">
                <MapPin size={20} className="mr-2" />Get Current Location
              </Button>
              <div>
                <Label htmlFor="phone" className="text-[#1C241D] font-medium">Phone Number *</Label>
                <Input id="phone" type="tel" placeholder="1234567890" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="mt-1.5" data-testid="phone-input" />
              </div>
              <div>
                <Label htmlFor="time-slot" className="text-[#1C241D] font-medium">Delivery Time Slot *</Label>
                <Select value={formData.time_slot} onValueChange={(value) => setFormData({ ...formData, time_slot: value })}>
                  <SelectTrigger className="mt-1.5" data-testid="timeslot-select">
                    <SelectValue placeholder="Select a time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (<SelectItem key={slot} value={slot}>{slot}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-[#EBE8E0] rounded-xl p-4">
                <h3 className="font-semibold text-[#1C241D] mb-2">Payment Method</h3>
                <p className="text-sm text-[#576058]">Cash on Delivery (COD)</p>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#2E5C31] hover:bg-[#244A27] text-white py-6 rounded-xl font-semibold" data-testid="place-order-button">
                {loading ? 'Placing Order...' : 'Place Order'}
              </Button>
            </form>
          </div>
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-8 shadow-sm sticky top-8">
              <h2 className="text-2xl font-bold text-[#1C241D] mb-6" style={{ fontFamily: 'Cabinet Grotesk' }}>Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-[#1C241D]">{item.name}</p>
                      <p className="text-xs text-[#576058]">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-[#1C241D]">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E5E5DF] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#576058]">Subtotal</span>
                  <span className="text-[#1C241D] font-medium">₹{getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#576058]">Delivery Fee</span>
                  <span className="text-[#2E5C31] font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#E5E5DF]">
                  <span className="text-[#1C241D]">Total</span>
                  <span className="text-[#2E5C31]" style={{ fontFamily: 'Cabinet Grotesk' }}>₹{getTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;