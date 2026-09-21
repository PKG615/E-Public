import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MapPin, 
  CreditCard, 
  Printer, 
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { orderService } from '../../services/api';
import { CustomerTrackingView } from '../../components/shipping/CustomerTrackingView';
import { OrderReturnsCard } from '../../components/returns/OrderReturnsCard';

export const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await orderService.getById(Number(orderId));
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.message || 'Order not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve order');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-neutral-500">Retrieving order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">Order Not Found</h2>
        <p className="text-xs text-neutral-600 mt-2 mb-6">{error || "Could not retrieve order details."}</p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    const idx = steps.findIndex((s) => s.key === status);
    return idx !== -1 ? idx : 0;
  };

  const currentStepIdx = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="w-9 h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
                Order #{order.order_number}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                isCancelled 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : order.status === 'delivered'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isCancelled && (
            <Link
              to={`/orders/${order.id}/tracking`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors border border-emerald-200"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Full Tracking Page</span>
            </Link>
          )}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-700 transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-500" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Tracking Stepper (if not cancelled) */}
      {!isCancelled ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs mb-8">
          <h2 className="text-xs font-bold text-neutral-900 mb-6 uppercase tracking-wider text-neutral-400">
            Fulfillment Progress
          </h2>

          <div className="relative">
            {/* Progress line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-200 -z-0">
              <div
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{
                  width: `${(currentStepIdx / (steps.length - 1)) * 100}%`
                }}
              />
            </div>

            {/* Stepper nodes */}
            <div className="relative z-10 flex justify-between">
              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border-2 border-neutral-300 text-neutral-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium ${
                        isCurrent
                          ? 'text-neutral-900 font-bold'
                          : isPassed
                          ? 'text-emerald-700'
                          : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">This order has been cancelled</h3>
            <p className="text-xs text-red-700 mt-0.5">
              All reserved inventory units were authoritatively restored to PostgreSQL stock.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Items & Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Items & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Real-time Shipping & Delivery Tracking */}
          {!isCancelled && (
            <CustomerTrackingView orderId={order.id} />
          )}

          {/* Items Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4">
              Items Ordered ({order.items?.length || 0})
            </h3>

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
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {item.product_name}
                    </h4>
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

          {/* Customer Returns & Replacements Section */}
          <OrderReturnsCard order={order} onReturnUpdated={loadOrder} />

          {/* Status Change Audit Trail */}
          {order.status_history && order.status_history.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
              <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-600" />
                <span>Status Audit Trail (PostgreSQL order_status_history)</span>
              </h3>

              <div className="space-y-4">
                {order.status_history.map((hist, idx) => (
                  <div key={hist.id || idx} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 uppercase">
                          {hist.new_status}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(hist.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-neutral-500 text-[11px] mt-0.5">
                        Action by: <strong className="text-neutral-700">{hist.changed_by}</strong>
                        {hist.reason && <span> • Reason: "{hist.reason}"</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Col: Address, Payment & Financial Summary */}
        <div className="space-y-6">
          
          {/* Shipping Address */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3 mb-3">
              <MapPin className="w-4 h-4 text-neutral-700" />
              <span>Delivery Address</span>
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
              Contact: <strong className="text-neutral-700">{order.shipping_address?.phone}</strong>
            </p>
          </div>

          {/* Payment Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3 mb-3">
              <CreditCard className="w-4 h-4 text-neutral-700" />
              <span>Payment Details</span>
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

          {/* Order Financials */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3 mb-4">
              Financial Summary
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
              <span className="text-sm font-extrabold text-neutral-900">Grand Total</span>
              <span className="text-xl font-extrabold text-neutral-900">
                ₹{order.total_amount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
