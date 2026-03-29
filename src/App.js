import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Toaster } from './components/ui/sonner';

// Auth Pages
import LoginPage from './pages/LoginPage';

// Customer Pages
import CustomerHome from './pages/customer/CustomerHome';
import ProductsPage from './pages/customer/ProductsPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';

// Shopkeeper Pages
import ShopkeeperDashboard from './pages/shopkeeper/ShopkeeperDashboard';
import ProductManagement from './pages/shopkeeper/ProductManagement';
import OrderManagement from './pages/shopkeeper/OrderManagement';

// Delivery Agent Pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverDeliveries from './pages/driver/DriverDeliveries';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5C31]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E5C31]"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Auth Route */}
      <Route path="/" element={!user ? <LoginPage /> : <Navigate to={`/${user.role === 'customer' ? 'shop' : user.role === 'shopkeeper' ? 'admin' : 'driver'}`} replace />} />

      {/* Customer Routes */}
      <Route path="/shop" element={<ProtectedRoute allowedRoles={['customer']}><CustomerHome /></ProtectedRoute>} />
      <Route path="/shop/products" element={<ProtectedRoute allowedRoles={['customer']}><ProductsPage /></ProtectedRoute>} />
      <Route path="/shop/checkout" element={<ProtectedRoute allowedRoles={['customer']}><CheckoutPage /></ProtectedRoute>} />
      <Route path="/shop/orders" element={<ProtectedRoute allowedRoles={['customer']}><OrderHistoryPage /></ProtectedRoute>} />
      <Route path="/shop/track/:orderId" element={<ProtectedRoute allowedRoles={['customer']}><OrderTrackingPage /></ProtectedRoute>} />

      {/* Shopkeeper Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ShopkeeperDashboard /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute allowedRoles={['shopkeeper']}><ProductManagement /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute allowedRoles={['shopkeeper']}><OrderManagement /></ProtectedRoute>} />

      {/* Delivery Agent Routes */}
      <Route path="/driver" element={<ProtectedRoute allowedRoles={['delivery_agent']}><DriverDashboard /></ProtectedRoute>} />
      <Route path="/driver/deliveries" element={<ProtectedRoute allowedRoles={['delivery_agent']}><DriverDeliveries /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
