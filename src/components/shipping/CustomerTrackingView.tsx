import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { CustomerTrackingData, ShipmentStatus } from '../../types';
import { orderService } from '../../services/api';

interface CustomerTrackingViewProps {
  orderId: number;
}

export const CustomerTrackingView: React.FC<CustomerTrackingViewProps> = ({ orderId }) => {
  const [trackingData, setTrackingData] = useState<CustomerTrackingData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTracking = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await orderService.getTracking(orderId);
        if (isMounted) {
          if (res.success && res.data) {
            setTrackingData(res.data);
          } else {
            setError(res.message || 'Tracking data unavailable');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Could not retrieve tracking details');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTracking();
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const handleCopyTracking = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'out_for_delivery':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'in_transit':
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'packed':
      case 'processing':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-neutral-500 font-medium">Checking delivery status with fulfillment center...</span>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-xs text-neutral-600 flex items-center gap-3">
        <Info className="w-5 h-5 text-neutral-400 shrink-0" />
        <span>{error || 'Shipment information will be registered once items are packed.'}</span>
      </div>
    );
  }

  const shipment = trackingData.shipment;
  const events = trackingData.tracking_events || [];

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              {shipment ? `Shipment #${shipment.shipment_number}` : 'Delivery Preparation'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {trackingData.status_message}
            </p>
          </div>
        </div>

        {shipment && (
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeColor(shipment.status)}`}>
              {shipment.status.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Shipment Specs Grid */}
      {shipment ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-neutral-50 rounded-xl p-4 border border-neutral-100 text-xs">
          <div>
            <span className="text-neutral-400 text-[11px] block">Carrier</span>
            <span className="font-semibold text-neutral-800 mt-0.5 block">
              {shipment.carrier || 'Internal Fulfillment Center'}
            </span>
          </div>

          <div>
            <span className="text-neutral-400 text-[11px] block">Tracking Number</span>
            {shipment.tracking_number ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-bold text-neutral-900">
                  {shipment.tracking_number}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyTracking(shipment.tracking_number!)}
                  title="Copy tracking number"
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
              <span className="text-neutral-400 italic mt-0.5 block">Pending carrier assignment</span>
            )}
          </div>

          <div>
            <span className="text-neutral-400 text-[11px] block">Shipping Method</span>
            <span className="font-semibold text-neutral-800 uppercase mt-0.5 block">
              {shipment.shipping_method}
            </span>
          </div>

          <div>
            <span className="text-neutral-400 text-[11px] block">Estimated Delivery</span>
            <span className="font-bold text-emerald-700 mt-0.5 block">
              {shipment.estimated_delivery_date ? (
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
          <p className="font-semibold">Warehouse is preparing your package.</p>
          <p className="text-amber-700 mt-1">
            Carrier pickup and tracking identifier will appear here once the warehouse seals the package.
          </p>
        </div>
      )}

      {/* Timeline Section */}
      <div>
        <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-400 mb-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Tracking Timeline</span>
        </h4>

        {events.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
            {events.map((evt, idx) => {
              const isLatest = idx === events.length - 1;
              return (
                <div key={evt.id || idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    isLatest 
                      ? 'bg-emerald-600 border-emerald-100 ring-4 ring-emerald-50' 
                      : 'bg-white border-neutral-300'
                  }`}>
                    {isLatest && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>

                  <div className="bg-neutral-50/70 border border-neutral-100 rounded-xl p-3.5 hover:bg-neutral-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-neutral-900 uppercase">
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

                    <p className="text-xs text-neutral-700 mt-1">
                      {evt.description}
                    </p>

                    {evt.location && (
                      <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-2">
                        <MapPin className="w-3 h-3 text-neutral-400" />
                        <span>{evt.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-neutral-400 italic py-2">
            No milestone events logged yet.
          </div>
        )}
      </div>

    </div>
  );
};
