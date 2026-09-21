import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartResponse, CartItemResponse, Product, ProductVariant } from '../types';
import { cartService } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: CartResponse | null;
  items: CartItemResponse[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  clearError: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (
    productOrId: Product | number,
    variantOrId?: ProductVariant | number | null,
    quantity?: number
  ) => Promise<{ success: boolean; message: string }>;
  removeFromCart: (itemId: number | string) => Promise<{ success: boolean; message: string }>;
  updateQuantity: (itemId: number | string, quantity: number) => Promise<{ success: boolean; message: string }>;
  clearCart: () => Promise<{ success: boolean; message: string }>;
  
  // Authoritative figures from backend CartResponse
  totalItemsCount: number;
  totalMrp: number;
  totalSellingPrice: number;
  productDiscount: number;
  taxAmount: number;
  shippingAmount: number;
  finalTotal: number;

  // Coupons & Pincode Utilities
  couponCode: string;
  couponDiscount: number;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  pincode: string;
  setPincode: (pin: string) => void;
  pincodeDeliveryInfo: { serviceable: boolean; estimatedDays: number; codAvailable: boolean; message: string } | null;
  checkPincode: (pin: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState<string>('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [pincode, setPincode] = useState<string>('110001');
  const [pincodeDeliveryInfo, setPincodeDeliveryInfo] = useState<{
    serviceable: boolean;
    estimatedDays: number;
    codAvailable: boolean;
    message: string;
  } | null>({
    serviceable: true,
    estimatedDays: 2,
    codAvailable: true,
    message: 'Express Delivery in 2 Business Days | Cash on Delivery Available',
  });

  const clearError = () => setError(null);

  const fetchCart = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await cartService.getCart();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load cart from backend:', err);
      // Fallback empty cart structure to prevent crash
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch cart on initial load and whenever authentication changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart, user?.id]);

  const addToCart = async (
    productOrId: Product | number,
    variantOrId?: ProductVariant | number | null,
    quantity: number = 1
  ): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true);
    setError(null);
    try {
      const prodId = typeof productOrId === 'number' ? productOrId : productOrId.id;
      let varId: number | null = null;
      if (variantOrId) {
        varId = typeof variantOrId === 'number' ? variantOrId : (variantOrId.id || null);
      }
      const res = await cartService.addItem(prodId, varId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
        return { success: true, message: res.message || 'Item added to cart' };
      }
      return { success: false, message: res.message || 'Failed to add item' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not add item to cart';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  const updateQuantity = async (
    itemId: number | string,
    quantity: number
  ): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true);
    setError(null);
    try {
      const numericId = typeof itemId === 'number' ? itemId : parseInt(itemId, 10);
      if (isNaN(numericId)) {
        throw new Error('Invalid cart item reference');
      }
      const res = await cartService.updateQuantity(numericId, quantity);
      if (res.success && res.data) {
        setCart(res.data);
        return { success: true, message: res.message || 'Cart updated' };
      }
      return { success: false, message: res.message || 'Failed to update quantity' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not update quantity';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  const removeFromCart = async (
    itemId: number | string
  ): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true);
    setError(null);
    try {
      const numericId = typeof itemId === 'number' ? itemId : parseInt(itemId, 10);
      const res = await cartService.removeItem(numericId);
      if (res.success && res.data) {
        setCart(res.data);
        return { success: true, message: 'Item removed from cart' };
      }
      return { success: false, message: 'Failed to remove item' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not remove item';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  const clearCart = async (): Promise<{ success: boolean; message: string }> => {
    setIsUpdating(true);
    setError(null);
    try {
      const res = await cartService.clearCart();
      if (res.success && res.data) {
        setCart(res.data);
        setCouponCode('');
        setCouponDiscount(0);
        return { success: true, message: 'Cart cleared successfully' };
      }
      return { success: false, message: 'Failed to clear cart' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not clear cart';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  const checkPincode = (pin: string) => {
    setPincode(pin);
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      setPincodeDeliveryInfo({
        serviceable: false,
        estimatedDays: 0,
        codAvailable: false,
        message: 'Please enter a valid 6-digit postal code',
      });
      return;
    }

    if (pin.startsWith('11') || pin.startsWith('40') || pin.startsWith('56')) {
      setPincodeDeliveryInfo({
        serviceable: true,
        estimatedDays: 1,
        codAvailable: true,
        message: 'Next-Day Fast Delivery Available | COD Eligible',
      });
    } else if (pin.startsWith('99')) {
      setPincodeDeliveryInfo({
        serviceable: false,
        estimatedDays: 0,
        codAvailable: false,
        message: 'Unfortunately, this pincode is not currently serviceable',
      });
    } else {
      setPincodeDeliveryInfo({
        serviceable: true,
        estimatedDays: 3,
        codAvailable: true,
        message: 'Standard Delivery in 2-3 Business Days | COD Available',
      });
    }
  };

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    const subtotal = cart?.subtotal || 0;
    if (clean === 'SAVE10') {
      const disc = Math.round(subtotal * 0.1);
      setCouponCode(clean);
      setCouponDiscount(disc);
      return { success: true, message: 'Coupon applied! 10% extra discount added.' };
    } else if (clean === 'PROD2000' && subtotal >= 10000) {
      setCouponCode(clean);
      setCouponDiscount(2000);
      return { success: true, message: 'Mega Coupon applied! Flat ₹2,000 off.' };
    } else {
      return { success: false, message: 'Invalid or expired coupon code. Try SAVE10.' };
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
  };

  const items: CartItemResponse[] = cart?.items || [];
  const totalItemsCount = cart?.item_count || 0;
  const totalSellingPrice = cart?.subtotal || 0;
  const productDiscount = cart?.discount || 0;
  const shippingAmount = cart?.shipping || 0;
  const taxAmount = cart?.tax || 0;
  const totalMrp = items.reduce((acc, it) => acc + (it.mrp * it.quantity), 0);
  const finalTotal = Math.max(0, (cart?.total || 0) - couponDiscount);

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        isLoading,
        isUpdating,
        error,
        clearError,
        fetchCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItemsCount,
        totalMrp,
        totalSellingPrice,
        productDiscount,
        taxAmount,
        shippingAmount,
        finalTotal,
        couponCode,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        pincode,
        setPincode,
        pincodeDeliveryInfo,
        checkPincode,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
