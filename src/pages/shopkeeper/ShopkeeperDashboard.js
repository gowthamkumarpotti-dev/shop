import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Package, ShoppingCart, Truck, SignOut } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ShopkeeperDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: 0, active_deliveries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/stats/dashboard`, { withCredentials: true });
      setStats(data);
    } catch (error) {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  const statCards = [
    { label: 'Total Orders', value: stats.total_orders, icon: ShoppingCart, color: '#2E5C31' },
    { label: 'Total Revenue', value: `₹${stats.total_revenue.toFixed(2)}`, icon: Package, color: '#D99330' },
    { label: 'Active Deliveries', value: stats.active_deliveries, icon: Truck, color: '#CC5A3A' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <header className="bg-white border-b border-[#E5E5DF] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter text-[#2E5C31]" style={{ fontFamily: 'Cabinet Grotesk' }}>Admin Dashboard</h1>
          <Button variant="ghost" onClick={handleLogout} className="text-[#CC5A3A] hover:bg-[#CC5A3A]/10" data-testid="logout-button">
            <SignOut size={20} weight="duotone" className="mr-2" />Logout
          </Button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 border border-[#E5E5DF]" data-testid={`stat-${stat.label.toLowerCase().replace(' ', '-')}`}>
                <div className="flex items-center justify-between mb-4">
                  <Icon size={32} weight="duotone" style={{ color: stat.color }} />
                </div>
                <p className="text-sm text-[#576058] mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-[#1C241D]" style={{ fontFamily: 'Cabinet Grotesk' }}>{loading ? '...' : stat.value}</p>
              </div>
            );
          })}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Button onClick={() => navigate('/admin/products')} className="h-32 bg-[#2E5C31] hover:bg-[#244A27] text-white text-xl font-bold" data-testid="manage-products-btn">
            <Package size={32} className="mr-3" />Manage Products
          </Button>
          <Button onClick={() => navigate('/admin/orders')} className="h-32 bg-[#CC5A3A] hover:bg-[#A84A2F] text-white text-xl font-bold" data-testid="manage-orders-btn">
            <ShoppingCart size={32} className="mr-3" />Manage Orders
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShopkeeperDashboard;