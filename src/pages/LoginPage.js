import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ShoppingBag, Truck, Storefront } from '@phosphor-icons/react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LoginPage = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  // Forgot Password State — 3-step OTP flow
  const [forgotStep, setForgotStep] = useState(null); // null | 'email' | 'otp' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password);
        if (!result.success) {
          toast.error(result.error);
        }
      } else {
        if (!formData.name) {
          toast.error('Name is required');
          setLoading(false);
          return;
        }
        const result = await register(
          formData.email,
          formData.password,
          formData.name,
          selectedRole,
          formData.phone || null
        );
        if (!result.success) {
          toast.error(result.error);
        } else {
          toast.success('Account created successfully!');
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'customer', label: 'Customer', icon: ShoppingBag, color: '#2E5C31' },
    { value: 'delivery_agent', label: 'Delivery Agent', icon: Truck, color: '#CC5A3A' },
    { value: 'shopkeeper', label: 'Shopkeeper', icon: Storefront, color: '#D99330' }
  ];

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Please enter your email');
    setForgotLoading(true);
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { email: forgotEmail });
      toast.success(data.message || 'OTP sent to your email!');
      setForgotStep('otp');
    } catch (error) {
      toast.error('Failed to send OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpValue || otpValue.length !== 6) return toast.error('Please enter the 6-digit OTP');
    setForgotLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/verify-otp`, { email: forgotEmail, otp: otpValue });
      toast.success('OTP verified! Set your new password.');
      setForgotStep('reset');
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Invalid or expired OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) return toast.error('Password must be at least 4 characters');
    setForgotLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/reset-password`, { email: forgotEmail, new_password: newPassword });
      toast.success('Password reset successfully! You can now log in.');
      setForgotStep(null);
      setForgotEmail('');
      setOtpValue('');
      setNewPassword('');
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to reset password.');
    } finally {
      setForgotLoading(false);
    }
  };

  const cancelForgot = () => {
    setForgotStep(null);
    setForgotEmail('');
    setOtpValue('');
    setNewPassword('');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden md:block relative">
          <img
            src="https://static.prod-images.emergentagent.com/jobs/4fd685be-3c65-49b4-908d-d51d5d669920/images/dd1e78a2173f295cea0e51e4c5a77093f893c0ca19156518f2d160177323bfb3.png"
            alt="Fresh Provisions"
            className="rounded-2xl shadow-2xl w-full h-[600px] object-cover"
            data-testid="hero-image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C241D]/60 to-transparent rounded-2xl"></div>
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-2" style={{ fontFamily: 'Cabinet Grotesk' }}>
              Fresh Provisions
            </h1>
            <p className="text-lg text-white/90">Delivered to your doorstep in minutes</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-[#1C241D] mb-2" style={{ fontFamily: 'Cabinet Grotesk' }} data-testid="auth-title">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-[#576058]">Sign {isLogin ? 'in' : 'up'} to continue</p>
          </div>

          <Tabs defaultValue="login" onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="login-tab">Login</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Register</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="name" className="text-[#1C241D] font-medium">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                      className="mt-1.5"
                      data-testid="name-input"
                    />
                  </div>

                  <div>
                    <Label className="text-[#1C241D] font-medium mb-3 block">Select Role</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {roleOptions.map((role) => {
                        const Icon = role.icon;
                        return (
                          <button
                            key={role.value}
                            type="button"
                            onClick={() => setSelectedRole(role.value)}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                              selectedRole === role.value
                                ? 'border-[#2E5C31] bg-[#2E5C31]/5'
                                : 'border-[#E5E5DF] hover:border-[#2E5C31]/50'
                            }`}
                            data-testid={`role-${role.value}`}
                          >
                            <Icon size={28} weight="duotone" color={role.color} />
                            <span className="text-xs font-medium text-[#1C241D]">{role.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-[#1C241D] font-medium">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="1234567890"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1.5"
                      data-testid="phone-input"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email" className="text-[#1C241D] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1.5"
                  data-testid="email-input"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-[#1C241D] font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="mt-1.5"
                  data-testid="password-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#2E5C31] hover:bg-[#244A27] text-white font-semibold py-6 rounded-xl"
                disabled={loading}
                data-testid="submit-button"
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </Tabs>

          {isLogin && forgotStep === null && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setForgotStep('email')}
                className="text-sm text-[#2E5C31] hover:underline font-medium"
                data-testid="forgot-password-link"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {forgotStep === 'email' && (
            <form onSubmit={handleForgotPassword} className="mt-6 p-4 border border-[#E5E5DF] rounded-xl space-y-4" data-testid="forgot-password-form">
              <h3 className="font-semibold text-[#1C241D]">Reset Password</h3>
              <p className="text-sm text-[#576058]">Enter your email to receive a 6-digit OTP</p>
              <div>
                <Label htmlFor="forgot-email" className="text-[#1C241D] font-medium">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="mt-1.5"
                  data-testid="forgot-email-input"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={forgotLoading} className="flex-1 bg-[#2E5C31] hover:bg-[#244A27] text-white" data-testid="send-otp-btn">
                  {forgotLoading ? 'Sending...' : 'Send OTP'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForgot} className="flex-1" data-testid="forgot-cancel-btn">
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {forgotStep === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="mt-6 p-4 border border-[#E5E5DF] rounded-xl space-y-4" data-testid="otp-verify-form">
              <h3 className="font-semibold text-[#1C241D]">Enter OTP</h3>
              <p className="text-sm text-[#576058]">A 6-digit code has been sent to <strong>{forgotEmail}</strong></p>
              <div>
                <Label htmlFor="otp-input" className="text-[#1C241D] font-medium">OTP Code</Label>
                <Input
                  id="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="mt-1.5 text-center text-2xl tracking-[0.5em] font-bold"
                  data-testid="otp-input"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={forgotLoading || otpValue.length !== 6} className="flex-1 bg-[#2E5C31] hover:bg-[#244A27] text-white" data-testid="verify-otp-btn">
                  {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForgot} className="flex-1" data-testid="otp-cancel-btn">
                  Cancel
                </Button>
              </div>
              <button type="button" onClick={handleForgotPassword} className="text-sm text-[#2E5C31] hover:underline w-full text-center" data-testid="resend-otp-btn">
                Resend OTP
              </button>
            </form>
          )}

          {forgotStep === 'reset' && (
            <form onSubmit={handleResetPassword} className="mt-6 p-4 border border-[#E5E5DF] rounded-xl space-y-4" data-testid="reset-password-form">
              <h3 className="font-semibold text-[#1C241D]">Set New Password</h3>
              <p className="text-sm text-[#576058]">OTP verified for <strong>{forgotEmail}</strong></p>
              <div>
                <Label htmlFor="new-password" className="text-[#1C241D] font-medium">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-1.5"
                  data-testid="new-password-input"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={forgotLoading} className="flex-1 bg-[#2E5C31] hover:bg-[#244A27] text-white" data-testid="reset-submit-btn">
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForgot} className="flex-1" data-testid="reset-cancel-btn">
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {isLogin && forgotStep === null && (
            <div className="mt-4 text-center">
              <p className="text-sm text-[#576058]">
                <span className="font-medium">Test Admin:</span> admin@shop.com / admin123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;