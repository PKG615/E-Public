import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  ShoppingBag,
  RefreshCw,
  Info,
  Smartphone,
  Building2,
  Banknote,
  Lock,
  ChevronRight
} from 'lucide-react';
import { Address, AddressCreatePayload, CheckoutPreviewResponse, PaymentMethod } from '../../types';
import { addressService, checkoutService, orderService } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { AddressCard } from '../../components/customer/AddressCard';
import { AddressModal } from '../../components/customer/AddressModal';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, items, totalItemsCount, fetchCart } = useCart();

  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(true);

  // Authoritative Preview State
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Address Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  // Flow State
  const [currentStep, setCurrentStep] = useState<'address' | 'payment'>('address');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Card Inputs
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8892');
  const [cardHolder, setCardHolder] = useState(user?.full_name || 'Cardholder Name');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('•••');

  // UPI Input
  const [upiId, setUpiId] = useState('user@okhdfcbank');

  // Netbanking Select
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Load addresses
  const loadAddresses = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoadingAddresses(false);
      return;
    }
    try {
      setIsLoadingAddresses(true);
      const res = await addressService.list();
      if (res.success && res.data) {
        setAddresses(res.data);
        const defaultAddr = res.data.find((a) => a.is_default) || res.data[0];
        if (defaultAddr && !selectedAddressId) {
          setSelectedAddressId(defaultAddr.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch addresses:', err);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [isAuthenticated, selectedAddressId]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Request authoritative preview when address is selected
  const fetchCheckoutPreview = useCallback(async (addressId: number) => {
    try {
      setIsLoadingPreview(true);
      setPreviewError(null);
      const res = await checkoutService.preview(addressId);
      if (res.success && res.data) {
        setPreview(res.data);
      } else {
        setPreviewError(res.message || 'Failed to generate checkout preview');
      }
    } catch (err: any) {
      setPreviewError(err.response?.data?.message || err.message || 'Checkout validation failed');
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAddressId) {
      fetchCheckoutPreview(selectedAddressId);
    }
  }, [selectedAddressId, fetchCheckoutPreview]);

  const handleSaveAddress = async (payload: AddressCreatePayload, addressId?: number): Promise<boolean> => {
    try {
      if (addressId) {
        const res = await addressService.update(addressId, payload);
        if (res.success && res.data) {
          setAddresses((prev) => prev.map((a) => (a.id === addressId ? res.data! : a)));
          return true;
        }
      } else {
        const res = await addressService.create(payload);
        if (res.success && res.data) {
          setAddresses((prev) => [...prev, res.data!]);
          setSelectedAddressId(res.data.id);
          return true;
        }
      }
      return false;
    } catch (err: any) {
      console.error('Failed to save address:', err);
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setOrderError('Please select a delivery address');
      return;
    }

    if (preview && !preview.valid) {
      setOrderError('Cannot place order due to stock or checkout validation errors.');
      return;
    }

    try {
      setIsPlacingOrder(true);
      setOrderError(null);

      const idempotencyKey = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const res = await orderService.create({
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        payment_provider: 'standard',
        notes: orderNotes.trim() || undefined,
        idempotency_key: idempotencyKey
      });

      if (res.success && res.data) {
        // Clear cart state in context
        await fetchCart();

        // Redirect to order confirmation page
        navigate(`/order-confirmation/${res.data.id}`, {
          state: { order: res.data }
        });
      } else {
        setOrderError(res.message || 'Failed to finalize order. Please try again.');
      }
    } catch (err: any) {
      setOrderError(
        err.response?.data?.message || err.message || 'An error occurred while processing order.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Sign in to Checkout</h2>
        <p className="text-xs text-neutral-500 mt-2 mb-6">
          Access your stored addresses and authoritative pricing engine by logging in.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <span>Continue Browsing</span>
        </Link>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Your Cart is Empty</h2>
        <p className="text-xs text-neutral-500 mt-2 mb-6">
          Add items to your cart before proceeding to checkout.
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explore Catalog</span>
        </Link>
      </div>
    );
  }

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Checkout Flow Breadcrumbs & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <Link to="/cart" className="hover:text-neutral-700 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cart</span>
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold">Authoritative Checkout</span>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight">
            Checkout & Order Placement
          </h1>
        </div>

        {/* 2-Step Pill Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setCurrentStep('address')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentStep === 'address'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Delivery Address</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />

          <button
            onClick={() => {
              if (selectedAddressId && preview?.valid) {
                setCurrentStep('payment');
              }
            }}
            disabled={!selectedAddressId || !preview?.valid}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currentStep === 'payment'
                ? 'bg-white text-neutral-900 shadow-2xs'
                : 'text-neutral-400 disabled:cursor-not-allowed'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-800 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Payment & Review</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (8 cols): Address & Payment Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* STEP 1: Address Selection */}
          {currentStep === 'address' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-700" />
                    <span>Select Shipping Destination</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Taxes, regional shipping, and inventory reservation depend authoritatively on your chosen address.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddressToEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-neutral-500">Loading delivery addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-neutral-200 rounded-2xl">
                  <MapPin className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <h3 className="text-xs font-bold text-neutral-800">No Addresses Saved Yet</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">
                    Please provide your delivery details to compute authoritative tax and shipping.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressToEdit(null);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-neutral-900 text-white rounded-xl hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Delivery Address</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => setSelectedAddressId(address.id)}
                      className="cursor-pointer"
                    >
                      <AddressCard
                        address={address}
                        isSelected={selectedAddressId === address.id}
                        onSelect={(id) => setSelectedAddressId(id)}
                        onEdit={(addr) => {
                          setAddressToEdit(addr);
                          setIsModalOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Next Step Button */}
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                <Link to="/cart" className="text-xs font-semibold text-neutral-600 hover:text-neutral-900">
                  Return to Cart
                </Link>

                <button
                  type="button"
                  disabled={!selectedAddressId || !preview?.valid || isLoadingPreview}
                  onClick={() => setCurrentStep('payment')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Payment Method Selection */}
          {currentStep === 'payment' && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-neutral-700" />
                    <span>Select Payment Method</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Choose your preferred payment gateway. Transactions are end-to-end encrypted and verified.
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep('address')}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Change Address
                </button>
              </div>

              {/* Payment Methods Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'card', label: 'Card Payment', icon: CreditCard, subtitle: 'Visa / MC / RuPay' },
                  { id: 'upi', label: 'Instant UPI', icon: Smartphone, subtitle: 'GPay / PhonePe' },
                  { id: 'netbanking', label: 'Net Banking', icon: Building2, subtitle: 'All Major Banks' },
                  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, subtitle: 'Pay upon delivery' },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                          : 'border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-white' : 'text-neutral-600'}`} />
                      <div className="font-bold text-xs leading-tight">{pm.label}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                        {pm.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sub-form based on selected payment method */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800">Card Credentials</span>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                        <Lock className="w-3 h-3" />
                        <span>256-bit Bank Grade Encryption</span>
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">Expiry</label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-neutral-600 block mb-1">CVV</label>
                            <input
                              type="password"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'upi' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-neutral-800 block">Unified Payments Interface (UPI)</span>
                    <label className="text-[11px] font-semibold text-neutral-600 block">Virtual Payment Address (VPA)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@bank"
                        className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-mono text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                      <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Supports Google Pay, BHIM, PhonePe, Paytm, and all banking UPI applications.
                    </p>
                  </div>
                )}

                {paymentMethod === 'netbanking' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-neutral-800 block">Internet Banking</span>
                    <label className="text-[11px] font-semibold text-neutral-600 block">Select Your Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    >
                      <option>HDFC Bank</option>
                      <option>State Bank of India (SBI)</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra Bank</option>
                      <option>Punjab National Bank</option>
                    </select>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Cash on Delivery</span>
                    </div>
                    <p className="text-xs text-neutral-600">
                      Pay easily in cash or UPI QR scan when your shipment arrives at your doorstep.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Delivery Notes / Special Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Leave with security guard, call before delivery..."
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Error Banner */}
              {orderError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}
            </div>
          )}

          {/* Cart Item Snapshot Review */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-400">
                Cart Items ({preview?.items?.length || items.length})
              </h3>
              <Link to="/cart" className="text-xs font-semibold text-neutral-600 hover:text-neutral-900">
                Edit Cart
              </Link>
            </div>

            <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto pr-1">
              {(preview?.items || items).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-neutral-100 border border-neutral-200 shrink-0"
                    />
                    <div className="text-xs">
                      <h4 className="font-bold text-neutral-900 truncate max-w-xs">{item.product.name}</h4>
                      {item.variant && (
                        <p className="text-[11px] text-neutral-500">Option: {item.variant.title}</p>
                      )}
                      <p className="text-[11px] text-neutral-400">
                        Qty: {item.quantity} • ₹{item.unit_price.toLocaleString('en-IN')} each
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-neutral-900 shrink-0">
                    ₹{item.line_subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Financial Breakdown & Place Order CTA */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs sticky top-24 space-y-6">
            
            <h2 className="text-sm font-bold text-neutral-900 pb-3 border-b border-neutral-100">
              Payment Summary
            </h2>

            {/* Selected Address Glance */}
            {selectedAddress && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-800">Delivering To:</span>
                  <button
                    onClick={() => setCurrentStep('address')}
                    className="text-[11px] text-neutral-500 hover:text-neutral-900 underline font-medium"
                  >
                    Change
                  </button>
                </div>
                <p className="font-semibold text-neutral-900">{selectedAddress.full_name}</p>
                <p className="text-neutral-500 text-[11px] truncate">
                  {selectedAddress.address_line1}, {selectedAddress.city} - {selectedAddress.postal_code}
                </p>
              </div>
            )}

            {/* Financial Breakdown */}
            <div className="space-y-3 text-xs border-b border-neutral-100 pb-4">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-neutral-900">
                  ₹{(preview?.subtotal ?? cart?.subtotal ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              {(preview?.discount ?? cart?.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Product Savings</span>
                  <span>-₹{(preview?.discount ?? cart?.discount ?? 0).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-neutral-600">
                <span>Applicable GST Tax</span>
                <span className="font-semibold text-neutral-900">
                  ₹{(preview?.tax ?? cart?.tax ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between text-neutral-600">
                <span>Delivery & Handling</span>
                <span className="font-semibold text-neutral-900">
                  {(preview?.shipping ?? cart?.shipping ?? 0) === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[11px]">Free</span>
                  ) : (
                    `₹${(preview?.shipping ?? cart?.shipping ?? 0).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>

            {/* Final Total */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-sm font-extrabold text-neutral-900 block">Total Payable</span>
                <span className="text-[10px] text-neutral-400">Includes all duties & GST</span>
              </div>
              <span className="text-2xl font-extrabold text-neutral-900 tracking-tight">
                ₹{(preview?.total ?? cart?.total ?? 0).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Final Action Button */}
            <div className="space-y-3 pt-2">
              {currentStep === 'address' ? (
                <button
                  type="button"
                  disabled={!selectedAddressId || !preview?.valid || isLoadingPreview}
                  onClick={() => setCurrentStep('payment')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <span>Continue to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isPlacingOrder || !selectedAddressId || !preview?.valid}
                  onClick={handlePlaceOrder}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  {isPlacingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing & Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Place Order & Pay ₹{(preview?.total ?? cart?.total ?? 0).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              )}

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-around text-[11px] text-neutral-500 font-medium">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Express Courier</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secure Checkout</span>
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
        addressToEdit={addressToEdit}
      />
    </div>
  );
};
