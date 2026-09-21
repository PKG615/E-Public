import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { Order, CustomerTrackingData, ShipmentStatus } from '../../types';
import { orderService } from '../../services/api';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [trackingData, setTrackingData] = useState<CustomerTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadTrackingPageData = async () => {
      if (!orderId) return;
      try {
        setIsLoading(true);
        setError(null);

        const id = parseInt(orderId, 10);
        if (isNaN(id)) {
          throw new Error('Invalid order ID');
        }

        // Parallel fetch order and tracking data
        const [orderRes, trackingRes] = await Promise.all([
          orderService.getById(id),
          orderService.getTracking(id)
        ]);

        if (isMounted) {
          if (orderRes.success && orderRes.data) {
            setOrder(orderRes.data);
          } else {
            setError(orderRes.message || 'Failed to retrieve order');
            return;
          }

          if (trackingRes.success && trackingRes.data) {
            setTrackingData(trackingRes.data);
          } else {
            // Tracking might not be created yet, which is a valid state
            setTrackingData(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Unable to fetch order tracking');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTrackingPageData();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleCopyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3.5 h-3.5" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'in_transit':
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5" />
            <span>{status.replace('_', ' ')}</span>
          </span>
        );
      case 'packed':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <Package className="w-3.5 h-3.5" />
            <span>{status}</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Delivery Attempt Failed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200">
            <Clock className="w-3.5 h-3.5" />
            <span>{status || 'Pending Fulfillment'}</span>
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-sm font-bold text-neutral-800">Connecting to Fulfillment Logistics...</h2>
        <p className="text-xs text-neutral-500 mt-1">Retrieving authoritative shipment and tracking events from PostgreSQL.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-neutral-900">Tracking Information Unavailable</h2>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          {error || 'Unable to locate order records. Please confirm your order number.'}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Orders</span>
        </Link>
      </div>
    );
  }

  const shipment = trackingData?.shipment;
  const events = trackingData?.tracking_events || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/orders" className="hover:text-neutral-900 transition-colors">
          My Orders
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <Link to={`/orders/${order.id}`} className="hover:text-neutral-900 transition-colors">
          Order #{order.order_number}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="font-semibold text-neutral-900">Package Tracking</span>
      </div>

      {/* Hero Tracking Card */}
      <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                {shipment ? `Shipment #${shipment.shipment_number}` : `Order #${order.order_number}`}
              </h1>
              {getStatusBadge(shipment?.status || order.status)}
            </div>
            <p className="text-xs text-neutral-500">
              {trackingData?.status_message || 'Order confirmed. Awaiting warehouse packaging.'}
            </p>
          </div>

          <Link
            to={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Order Details</span>
          </Link>
        </div>

        {/* Shipment Details Grid */}
        {shipment ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-neutral-50 rounded-2xl p-4 sm:p-5 border border-neutral-100 text-xs">
            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">Logistics Carrier</span>
              <span className="font-bold text-neutral-800 mt-1 block">
                {shipment.carrier || 'Internal Fulfillment Center'}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">Tracking Number (AWB)</span>
              {shipment.tracking_number ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
                    {shipment.tracking_number}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyTracking(shipment.tracking_number!)}
                    title="Copy tracking code"
                    className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded transition-colors"
                  >
                    {copiedTracking ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-neutral-400 italic mt-1 block">Pending carrier assignment</span>
              )}
            </div>

            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">Shipping Service</span>
              <span className="font-bold text-neutral-800 uppercase mt-1 block">
                {shipment.shipping_method}
              </span>
            </div>

            <div>
              <span className="text-neutral-400 text-[11px] block font-medium">
                {shipment.status === 'delivered' ? 'Delivered On' : 'Estimated Delivery'}
              </span>
              <span className="font-black text-emerald-700 mt-1 block text-sm">
                {shipment.status === 'delivered' && shipment.delivered_at ? (
                  new Date(shipment.delivered_at).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })
                ) : shipment.estimated_delivery_date ? (
                  new Date(shipment.estimated_delivery_date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })
                ) : (
                  'Calculation in progress'
                )}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-1">
            <h4 className="font-bold text-sm text-amber-950">Shipment is being prepared.</h4>
            <p className="text-amber-800">
              Our fulfillment team is currently picking and packing your items. Live courier assignment and tracking milestones will appear here as soon as the package is dispatched.
            </p>
          </div>
        )}

        {/* Milestone Timeline */}
        <div className="pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Milestone History ({events.length})</span>
          </h3>

          {events.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {events.map((evt, idx) => {
                const isLatest = idx === events.length - 1;
                return (
                  <div key={evt.id || idx} className="relative group">
                    <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      isLatest 
                        ? 'bg-emerald-600 border-emerald-100 ring-4 ring-emerald-50' 
                        : 'bg-white border-neutral-300'
                    }`}>
                      {isLatest && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>

                    <div className="bg-neutral-50/80 border border-neutral-100 rounded-2xl p-4 hover:bg-neutral-50 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-neutral-900 uppercase tracking-wide">
                          {evt.status.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {new Date(evt.event_time).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-700 mt-1.5 leading-relaxed">
                        {evt.description}
                      </p>

                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-2 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{evt.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-neutral-400 italic py-4 bg-neutral-50 rounded-xl text-center">
              No courier scan events registered yet.
            </div>
          )}
        </div>
      </div>

      {/* Secondary Cards: Delivery Address Snapshot & Ordered Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Historical Delivery Address Snapshot */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-3">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>Delivery Destination Address</span>
          </div>

          {order.shipping_address ? (
            <div className="text-xs text-neutral-600 space-y-1">
              <p className="font-bold text-neutral-900">
                {order.shipping_address.full_name}
              </p>
              <p>{order.shipping_address.address_line1}</p>
              {order.shipping_address.address_line2 && (
                <p>{order.shipping_address.address_line2}</p>
              )}
              <p>
                {order.shipping_address.city}, {order.shipping_address.state} — {order.shipping_address.postal_code}
              </p>
              <p>{order.shipping_address.country}</p>
              <p className="text-neutral-500 font-mono mt-2">
                Contact: {order.shipping_address.phone}
              </p>
              <div className="pt-2 text-[11px] text-neutral-400 italic">
                * Historical snapshot recorded at order checkout.
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 italic">Address snapshot unavailable.</p>
          )}
        </div>

        {/* Package Contents Summary */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Package Contents ({order.items?.length || 0} items)</span>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-900">
              ₹{order.total_amount?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto">
            {order.items?.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-neutral-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
                <span className="font-mono font-medium text-neutral-700 shrink-0">
                  ₹{(item.total_price || item.unit_price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
