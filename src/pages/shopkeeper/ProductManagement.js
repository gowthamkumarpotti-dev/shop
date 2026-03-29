import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { ArrowLeft, Plus, Pencil, Trash } from '@phosphor-icons/react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', category: '', image: '', stock: '', description: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/products`);
      setProducts(data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`${BACKEND_URL}/api/products/${editingProduct.id}`, formData, { withCredentials: true });
        toast.success('Product updated successfully');
      } else {
        await axios.post(`${BACKEND_URL}/api/products`, formData, { withCredentials: true });
        toast.success('Product created successfully');
      }
      setDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', category: '', image: '', stock: '', description: '' });
      fetchProducts();
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({ name: product.name, price: product.price, category: product.category, image: product.image, stock: product.stock, description: product.description || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/products/${productId}`, { withCredentials: true });
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin')} className="text-[#1C241D]" data-testid="back-button">
              <ArrowLeft size={20} className="mr-2" />Back
            </Button>
            <h1 className="text-4xl font-black tracking-tighter text-[#1C241D]" style={{ fontFamily: 'Cabinet Grotesk' }}>Products</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#2E5C31] hover:bg-[#244A27] text-white" onClick={() => { setEditingProduct(null); setFormData({ name: '', price: '', category: '', image: '', stock: '', description: '' }); }} data-testid="add-product-btn">
                <Plus size={20} className="mr-2" />Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="product-name-input" />
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required data-testid="product-price-input" />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required data-testid="product-category-input" />
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input id="stock" type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required data-testid="product-stock-input" />
                </div>
                <div>
                  <Label htmlFor="image">Image URL *</Label>
                  <Input id="image" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} required data-testid="product-image-input" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} data-testid="product-description-input" />
                </div>
                <Button type="submit" className="w-full bg-[#2E5C31] hover:bg-[#244A27] text-white" data-testid="save-product-btn">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-64 rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-[#E5E5DF] overflow-hidden" data-testid={`product-${product.id}`}>
                <img src={product.image} alt={product.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-bold text-[#1C241D] mb-1">{product.name}</h3>
                  <p className="text-sm text-[#576058] mb-2">{product.category}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-black text-[#2E5C31]" style={{ fontFamily: 'Cabinet Grotesk' }}>₹{product.price}</span>
                    <span className="text-sm text-[#576058]">Stock: {product.stock}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="flex-1" data-testid={`edit-${product.id}`}>
                      <Pencil size={16} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} className="flex-1 text-[#CC5A3A] border-[#CC5A3A] hover:bg-[#CC5A3A] hover:text-white" data-testid={`delete-${product.id}`}>
                      <Trash size={16} />
                    </Button>
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

export default ProductManagement;