import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  CreditCard, 
  ArrowRight, 
  ShoppingBag,
  ExternalLink,
  Copy,
  Printer,
  Calendar
} from 'lucide-react';
import { Order } from '../../types';
import { orderService } from '../../services/api';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const initialOrder = (location.state as { order?: Order })?.order;

  const [order, setOrder] = useState<Order | null>(initialOrder || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialOrder);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!order && orderId) {
      setIsLoading(true);
      orderService.getById(Number(orderId))
        .then((res) => {
          if (res.success && res.data) {
            setOrder(res.data);
          } else {
            setError(res.message || 'Order not found');
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'Failed to load order details');
        })
        .finally(() => setIsLoading(false));
    }
  }, [orderId, order]);

  const handleCopyOrderNumber = () => {
    if (order?.order_number) {
      navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-neutral-800">Finalizing your order...</h2>
        <p className="text-sm text-neutral-500 mt-1">Fetching confirmation details from server</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Order Not Found</h2>
        <p className="text-sm text-neutral-600 mt-2 mb-6">{error || "Could not retrieve order details."}</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Return to Store</span>
        </Link>
      </div>
    );
  }

  // Calculate estimated delivery: 3 to 5 business days from order placement
  const placedDate = order.placed_at ? new Date(order.placed_at) : new Date(order.created_at);
  const estMin = new Date(placedDate);
  estMin.setDate(estMin.getDate() + 3);
  const estMax = new Date(placedDate);
  estMax.setDate(estMax.getDate() + 5);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Banner Card */}
      <div className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-10 shadow-xs text-center relative overflow-hidden mb-8">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-50 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full mb-2 border border-emerald-200">
          Order Confirmed & Authoritatively Recorded
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Thank you for your purchase!
        </h1>
        <p className="text-sm text-neutral-600 mt-2 max-w-lg mx-auto">
          We have received your order. An email confirmation has been sent to{' '}
          <strong className="text-neutral-900">{order.customer_email || 'your registered account'}</strong>.
        </p>

        {/* Order Identifier & Copy */}
        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 bg-neutral-50 border border-neutral-200/80 px-4 py-2.5 rounded-2xl">
          <span className="text-xs text-neutral-500 font-medium">Order Reference:</span>
          <span className="text-sm font-mono font-bold text-neutral-900 tracking-wider">
            {order.order_number}
          </span>
          <button
            onClick={handleCopyOrderNumber}
            className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
            title="Copy order number"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copied && <span className="text-[11px] text-emerald-600 font-semibold">Copied!</span>}
        </div>

        {/* Quick Delivery Estimate */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-600 font-medium">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span>
            Estimated Delivery: <strong>{estMin.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - {estMax.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Order Items & Delivery Address */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Items Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-neutral-700" />
                <span>Ordered Items ({order.items?.length || 0})</span>
              </h2>
              <span className="text-xs text-neutral-500">
                Status: <strong className="uppercase text-emerald-700">{order.status}</strong>
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-xl bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-neutral-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-neutral-900 truncate">
                      {item.product_name}
                    </h3>
                    {item.variant_title && (
                      <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                        Variant: {item.variant_title}
                      </p>
                    )}
                    <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      SKU: {item.sku}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-neutral-500 block">
                      ₹{item.unit_price.toLocaleString('en-IN')} × {item.quantity}
                    </span>
                    <span className="text-sm font-bold text-neutral-900 block mt-0.5">
                      ₹{item.line_total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Delivery Address */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-neutral-700" />
                <span>Shipping Address</span>
              </h3>
              <p className="text-xs font-bold text-neutral-800">{order.shipping_address?.full_name}</p>
              <p className="text-xs text-neutral-600 mt-1">{order.shipping_address?.address_line1}</p>
              {order.shipping_address?.address_line2 && (
                <p className="text-xs text-neutral-600">{order.shipping_address.address_line2}</p>
              )}
              <p className="text-xs text-neutral-600">
                {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                Phone: <strong className="text-neutral-700">{order.shipping_address?.phone}</strong>
              </p>
            </div>

            {/* Payment Details */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-neutral-700" />
                <span>Payment Summary</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Method</span>
                  <span className="font-bold uppercase text-neutral-900">{order.payment_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Payment Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    order.payment_status === 'paid' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {order.payment_status}
                  </span>
                </div>
                {order.payments && order.payments[0]?.provider_payment_id && (
                  <div className="flex justify-between pt-1 border-t border-neutral-100">
                    <span className="text-neutral-400 text-[11px]">Transaction Ref</span>
                    <span className="font-mono text-[11px] text-neutral-700">
                      {order.payments[0].provider_payment_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right Col: Price Breakdown & Actions */}
        <div className="space-y-6">
          
          {/* Price Breakdown */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4">
              Order Breakdown
            </h3>

            <div className="space-y-2.5 text-xs text-neutral-600 border-b border-neutral-100 pb-4">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-neutral-900">₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Product Savings</span>
                  <span>-₹{order.discount_amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST Tax (Included)</span>
                <span className="font-semibold text-neutral-900">₹{order.tax_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-neutral-900">
                  {order.shipping_amount === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[10px]">Free</span>
                  ) : (
                    `₹${order.shipping_amount.toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-baseline pt-4">
              <span className="text-sm font-extrabold text-neutral-900">Total Paid</span>
              <span className="text-xl font-extrabold text-neutral-900">
                ₹{order.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3">
            <Link
              to={`/orders/${order.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
            >
              <Truck className="w-4 h-4" />
              <span>Track Order Details</span>
            </Link>

            <Link
              to="/orders"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-bold rounded-xl transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>View All Orders</span>
            </Link>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-neutral-500 hover:text-neutral-800 text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
