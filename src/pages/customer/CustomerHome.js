import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ShoppingCart, MagnifyingGlass, User, SignOut, ClockClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart, getTotal, getItemCount } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/categories`);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const { data } = await axios.get(`${BACKEND_URL}/api/products`, { params });
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm" data-testid="customer-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-black tracking-tighter text-[#2E5C31]" style={{ fontFamily: 'Cabinet Grotesk' }}>
                FreshMart
              </h1>
              <div className="hidden md:flex items-center gap-2 bg-[#FAFAF7] rounded-xl px-4 py-2.5 border border-[#E5E5DF] w-96">
                <MagnifyingGlass size={20} weight="bold" className="text-[#576058]" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  data-testid="search-input"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate('/shop/orders')}
                className="text-[#1C241D] hover:bg-[#2E5C31]/10"
                data-testid="orders-button"
              >
                <ClockClockwise size={20} weight="duotone" className="mr-2" />
                Orders
              </Button>

              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative border-[#2E5C31] text-[#2E5C31] hover:bg-[#2E5C31] hover:text-white"
                    data-testid="cart-button"
                  >
                    <ShoppingCart size={20} weight="duotone" />
                    {getItemCount() > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#CC5A3A] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {getItemCount()}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg">
                  <SheetHeader>
                    <SheetTitle className="text-2xl font-bold" style={{ fontFamily: 'Cabinet Grotesk' }}>Your Cart</SheetTitle>
                  </SheetHeader>
                  <div className="mt-8 space-y-4">
                    {cart.length === 0 ? (
                      <p className="text-center text-[#576058] py-12">Your cart is empty</p>
                    ) : (
                      <>
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-4 p-4 bg-[#FAFAF7] rounded-xl" data-testid={`cart-item-${item.id}`}>
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-[#1C241D]">{item.name}</h4>
                              <p className="text-sm text-[#576058]">₹{item.price}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                                data-testid={`decrease-qty-${item.id}`}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center font-semibold">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                                data-testid={`increase-qty-${item.id}`}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-[#CC5A3A] hover:text-[#CC5A3A] hover:bg-[#CC5A3A]/10"
                              data-testid={`remove-${item.id}`}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}

                        <div className="border-t border-[#E5E5DF] pt-4 mt-6">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-[#1C241D]">Total</span>
                            <span className="text-2xl font-black text-[#2E5C31]" style={{ fontFamily: 'Cabinet Grotesk' }}>₹{getTotal().toFixed(2)}</span>
                          </div>
                          <Button
                            onClick={() => {
                              setCartOpen(false);
                              navigate('/shop/checkout');
                            }}
                            className="w-full bg-[#2E5C31] hover:bg-[#244A27] text-white py-6 rounded-xl font-semibold"
                            data-testid="checkout-button"
                          >
                            Proceed to Checkout
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-[#CC5A3A] hover:bg-[#CC5A3A]/10"
                data-testid="logout-button"
              >
                <SignOut size={20} weight="duotone" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#2E5C31]/10 via-[#FAFAF7] to-[#CC5A3A]/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-[#1C241D] mb-4" style={{ fontFamily: 'Cabinet Grotesk' }}>
              Fresh Provisions,
              <br />
              <span className="text-[#2E5C31]">Lightning Fast</span>
            </h2>
            <p className="text-lg text-[#576058] leading-relaxed">Order your daily essentials and get them delivered to your doorstep in minutes</p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-[#E5E5DF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-[#2E5C31] hover:bg-[#244A27] text-white' : 'border-[#E5E5DF] text-[#1C241D]'}
              data-testid="category-all"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 'bg-[#2E5C31] hover:bg-[#244A27] text-white' : 'border-[#E5E5DF] text-[#1C241D]'}
                data-testid={`category-${category.toLowerCase()}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="stagger-item bg-white rounded-xl border border-black/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all overflow-hidden group"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.stock < 20 && (
                      <span className="absolute top-2 right-2 bg-[#CC5A3A] text-white text-xs font-bold px-2 py-1 rounded-full">
                        Low Stock
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-[#1C241D] mb-1">{product.name}</h3>
                    <p className="text-sm text-[#576058] mb-3">{product.category}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-[#2E5C31]" style={{ fontFamily: 'Cabinet Grotesk' }}>₹{product.price}</span>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock === 0}
                        className="bg-[#2E5C31] hover:bg-[#244A27] text-white px-6"
                        data-testid={`add-to-cart-${product.id}`}
                      >
                        {product.stock === 0 ? 'Out of Stock' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CustomerHome;