import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, 
  Package, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Order, Return, ReturnEligibilityData } from '../../types';
import { orderService, returnService } from '../../services/api';
import { ReturnRequestModal } from './ReturnRequestModal';
import { ReturnDetailModal } from './ReturnDetailModal';

interface OrderReturnsCardProps {
  order: Order;
  onReturnUpdated?: () => void;
}

export const OrderReturnsCard: React.FC<OrderReturnsCardProps> = ({ order, onReturnUpdated }) => {
  const [eligibility, setEligibility] = useState<ReturnEligibilityData | null>(null);
  const [orderReturns, setOrderReturns] = useState<Return[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);

  const loadEligibilityAndReturns = useCallback(async () => {
    if (order.status !== 'delivered') {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [elRes, returnsRes] = await Promise.all([
        orderService.getReturnEligibility(order.id),
        returnService.list({ page: 1, page_size: 50 })
      ]);

      if (elRes.success && elRes.data) {
        setEligibility(elRes.data);
      }

      if (returnsRes.success && returnsRes.data) {
        const filtered = returnsRes.data.items.filter((r) => r.order_id === order.id);
        setOrderReturns(filtered);
      }
    } catch (err) {
      console.error('Error loading return details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [order.id, order.status]);

  useEffect(() => {
    loadEligibilityAndReturns();
  }, [loadEligibilityAndReturns]);

  const handleReturnSuccess = (newReturn: Return) => {
    setOrderReturns((prev) => [newReturn, ...prev]);
    loadEligibilityAndReturns();
    if (onReturnUpdated) onReturnUpdated();
  };

  const handleReturnCancelled = (updated: Return) => {
    setOrderReturns((prev) => prev.map((r) => r.id === updated.id ? updated : r));
    loadEligibilityAndReturns();
    if (onReturnUpdated) onReturnUpdated();
  };

  const isDelivered = order.status === 'delivered';
  const hasRemainingEligible = eligibility?.eligible && eligibility.items.some((i) => i.returnable_quantity > 0);

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
        <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-emerald-600" />
          <span>Returns & Replacements</span>
        </h3>
        <span className="text-[11px] text-neutral-400 font-medium">
          15-Day Policy
        </span>
      </div>

      {!isDelivered ? (
        <div className="bg-neutral-50 rounded-xl p-4 flex items-start gap-3 border border-neutral-200/60">
          <ShieldCheck className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
          <div className="text-xs text-neutral-600">
            <span className="font-bold text-neutral-800 block">Returns unlock upon confirmed delivery</span>
            <span>Once your shipment arrives, you can submit return or replacement requests for up to 15 days directly from this portal.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Returns List */}
          {orderReturns.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                Requests for this Order ({orderReturns.length})
              </span>
              <div className="space-y-2">
                {orderReturns.map((ret) => (
                  <div
                    key={ret.id}
                    onClick={() => setSelectedReturn(ret)}
                    className="border border-neutral-200 hover:border-emerald-500 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all hover:shadow-xs group bg-neutral-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-neutral-900">
                            {ret.return_number}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full uppercase bg-white border border-neutral-200 text-neutral-700">
                            {ret.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {ret.total_items_count} item(s) • Resolution: <strong className="uppercase text-neutral-700">{ret.resolution_type}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTA Banner */}
          {hasRemainingEligible ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Need to return or exchange an item?</span>
                <span className="text-[11px] text-emerald-700">
                  {eligibility?.return_window_days ? `${Math.max(0, eligibility.return_window_days - eligibility.days_since_delivery)} days remaining in return window.` : 'Authoritative return window active.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Return / Replacement</span>
              </button>
            </div>
          ) : orderReturns.length === 0 ? (
            <div className="text-xs text-neutral-500 py-2">
              All items from this order have either been processed or have exceeded the 15-day return window.
            </div>
          ) : null}
        </div>
      )}

      {/* Return Request Modal */}
      {isRequestModalOpen && (
        <ReturnRequestModal
          orderId={order.id}
          orderNumber={order.order_number}
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={handleReturnSuccess}
        />
      )}

      {/* Return Detail Modal */}
      {selectedReturn && (
        <ReturnDetailModal
          returnRecord={selectedReturn}
          isOpen={Boolean(selectedReturn)}
          onClose={() => setSelectedReturn(null)}
          onCancelled={handleReturnCancelled}
        />
      )}
    </div>
  );
};
