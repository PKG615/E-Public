import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { orderService } from '../../services/api';
import { ReturnEligibilityData, ReturnItemEligibility, ReturnCreatePayload, Return } from '../../types';

interface ReturnRequestModalProps {
  orderId: number;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newReturn: Return) => void;
}

interface SelectedItemState {
  selected: boolean;
  quantity: number;
  reason: string;
  resolution: 'refund' | 'replacement';
}

const RETURN_REASONS = [
  { value: 'defective', label: 'Item is defective or not working' },
  { value: 'damaged', label: 'Item arrived damaged or broken' },
  { value: 'wrong_item', label: 'Received wrong item or size' },
  { value: 'missing_item', label: 'Item or accessories missing' },
  { value: 'not_as_expected', label: 'Item does not match description' },
  { value: 'other', label: 'Other issue' }
];

export const ReturnRequestModal: React.FC<ReturnRequestModalProps> = ({
  orderId,
  orderNumber,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [eligibility, setEligibility] = useState<ReturnEligibilityData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReturn, setSubmittedReturn] = useState<Return | null>(null);

  // Form states
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemState>>({});
  const [generalReason, setGeneralReason] = useState<string>('defective');
  const [generalResolution, setGeneralResolution] = useState<'refund' | 'replacement'>('refund');
  const [customerNote, setCustomerNote] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setSubmittedReturn(null);
    setError(null);
    setIsLoading(true);

    orderService.getReturnEligibility(orderId)
      .then((res) => {
        if (res.success && res.data) {
          setEligibility(res.data);
          // Pre-populate items
          const initialMap: Record<number, any> = {};
          res.data.items.forEach((item) => {
            initialMap[item.order_item_id] = {
              selected: item.returnable_quantity > 0,
              quantity: item.returnable_quantity > 0 ? 1 : 0,
              reason: 'defective',
              resolution: 'refund'
            };
          });
          setSelectedItems(initialMap);
        } else {
          setError(res.message || 'Unable to check return eligibility.');
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to verify return window.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handleToggleItem = (orderItemId: number) => {
    setSelectedItems((prev) => {
      const cur = prev[orderItemId];
      if (!cur) return prev;
      return {
        ...prev,
        [orderItemId]: {
          ...cur,
          selected: !cur.selected
        }
      };
    });
  };

  const handleQuantityChange = (orderItemId: number, qty: number) => {
    setSelectedItems((prev) => {
      const cur = prev[orderItemId];
      if (!cur) return prev;
      return {
        ...prev,
        [orderItemId]: {
          ...cur,
          quantity: qty
        }
      };
    });
  };

  const handleResolutionChange = (orderItemId: number, res: 'refund' | 'replacement') => {
    setSelectedItems((prev) => {
      const cur = prev[orderItemId];
      if (!cur) return prev;
      return {
        ...prev,
        [orderItemId]: {
          ...cur,
          resolution: res
        }
      };
    });
  };

  // Calculate estimated refund
  const estimatedRefund = eligibility?.items.reduce((sum, itm) => {
    const state = selectedItems[itm.order_item_id];
    if (state?.selected && state.resolution === 'refund') {
      return sum + (itm.unit_price * state.quantity);
    }
    return sum;
  }, 0) || 0;

  const activeSelectedCount = Object.values(selectedItems).filter((s: SelectedItemState) => s.selected && s.quantity > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSelectedCount === 0) {
      setError('Please select at least one item to return or replace.');
      return;
    }

    const itemsPayload = (Object.entries(selectedItems) as [string, SelectedItemState][])
      .filter(([_, val]) => val.selected && val.quantity > 0)
      .map(([itemIdStr, val]) => ({
        order_item_id: Number(itemIdStr),
        quantity: val.quantity,
        reason: val.reason || generalReason,
        resolution: val.resolution || generalResolution
      }));

    const payload: ReturnCreatePayload = {
      reason: generalReason,
      resolution_type: generalResolution,
      customer_note: customerNote.trim() || undefined,
      items: itemsPayload
    };

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await orderService.createReturn(orderId, payload);
      if (res.success && res.data) {
        setSubmittedReturn(res.data);
        onSuccess(res.data);
      } else {
        setError(res.message || 'Failed to submit return request.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Server rejected return request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-neutral-200 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Request Return or Replacement</span>
                <span className="text-[11px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded border border-neutral-700">
                  {orderNumber}
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">15-Day Policy • Official PostgreSQL Ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-neutral-500">Checking authoritative return eligibility...</p>
            </div>
          ) : submittedReturn ? (
            /* Success View */
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">Return Request Submitted!</h3>
              <p className="text-xs text-neutral-600 max-w-md mx-auto mt-1 mb-4">
                Your return request has been recorded in the database. Our warehouse inspection team will review it shortly.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 max-w-md mx-auto text-left space-y-2 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Return Number:</span>
                  <span className="font-mono font-bold text-neutral-900">{submittedReturn.return_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Resolution Preference:</span>
                  <span className="font-bold text-neutral-900 uppercase">{submittedReturn.resolution_type}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Status:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                    {submittedReturn.status}
                  </span>
                </div>
                {submittedReturn.total_refund_amount > 0 && (
                  <div className="flex justify-between text-xs pt-1 border-t border-neutral-200">
                    <span className="text-neutral-500">Estimated Refund:</span>
                    <span className="font-bold text-emerald-700">₹{submittedReturn.total_refund_amount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : !eligibility?.eligible ? (
            /* Ineligible View */
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Order Not Eligible for Return</h3>
              <p className="text-xs text-neutral-600 max-w-md mx-auto mt-2 mb-6">
                {eligibility?.reason || "This order has either passed the 15-day return window, has not yet been delivered, or all quantities have already been returned."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl hover:bg-neutral-300"
              >
                Close
              </button>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Window Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900">
                  <strong className="block font-bold">15-Day Return Window Active</strong>
                  <span>Delivered on {eligibility.delivered_at ? new Date(eligibility.delivered_at).toLocaleDateString('en-IN') : 'recently'}. You have {Math.max(0, eligibility.return_window_days - eligibility.days_since_delivery)} days remaining to request returns.</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Items List Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Select Items to Return or Replace ({eligibility.items.length})
                </label>
                <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 max-h-60 overflow-y-auto">
                  {eligibility.items.map((item) => {
                    const state = selectedItems[item.order_item_id] || {
                      selected: false,
                      quantity: 0,
                      reason: 'defective',
                      resolution: 'refund'
                    };
                    const isAvailable = item.returnable_quantity > 0;

                    return (
                      <div
                        key={item.order_item_id}
                        className={`p-3.5 flex items-center gap-3 transition-colors ${
                          !isAvailable ? 'bg-neutral-50 opacity-60' : state.selected ? 'bg-emerald-50/40' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!isAvailable}
                          checked={state.selected}
                          onChange={() => handleToggleItem(item.order_item_id)}
                          className="w-4 h-4 rounded text-emerald-600 border-neutral-300 focus:ring-emerald-500 cursor-pointer"
                        />

                        <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Package className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-neutral-900 truncate">
                            {item.product_name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                            <span>₹{item.unit_price.toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span>Purchased: {item.purchased_quantity}</span>
                            {item.previously_returned_quantity > 0 && (
                              <span className="text-amber-600 font-medium">
                                ({item.previously_returned_quantity} returned)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Resolution controls */}
                        {isAvailable ? (
                          <div className="flex items-center gap-2 shrink-0">
                            {state.selected && (
                              <>
                                <select
                                  value={state.quantity}
                                  onChange={(e) => handleQuantityChange(item.order_item_id, Number(e.target.value))}
                                  className="text-xs border border-neutral-300 rounded-lg px-2 py-1 bg-white"
                                >
                                  {Array.from({ length: item.returnable_quantity }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>
                                      Qty: {n}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={state.resolution}
                                  onChange={(e) => handleResolutionChange(item.order_item_id, e.target.value as any)}
                                  className="text-xs border border-neutral-300 rounded-lg px-2 py-1 bg-white font-medium"
                                >
                                  <option value="refund">Refund</option>
                                  <option value="replacement">Replacement</option>
                                </select>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-medium italic shrink-0">
                            Already Returned
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Primary Reason & Resolution */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Primary Reason for Return *
                  </label>
                  <select
                    value={generalReason}
                    onChange={(e) => setGeneralReason(e.target.value)}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    {RETURN_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Default Desired Resolution *
                  </label>
                  <select
                    value={generalResolution}
                    onChange={(e) => {
                      const res = e.target.value as 'refund' | 'replacement';
                      setGeneralResolution(res);
                      // Update all selected items
                      setSelectedItems((prev) => {
                        const next = { ...prev };
                        Object.keys(next).forEach((k) => {
                          next[Number(k)] = { ...next[Number(k)], resolution: res };
                        });
                        return next;
                      });
                    }}
                    className="w-full text-xs border border-neutral-300 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="refund">Full Refund to Original Payment</option>
                    <option value="replacement">Replacement (Same Product)</option>
                  </select>
                </div>
              </div>

              {/* Customer Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Additional Details / Notes (Optional)
                </label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Describe the issue or reason in detail to expedite inspection..."
                  rows={3}
                  className="w-full text-xs border border-neutral-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              {/* Financial & Resolution Summary */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">Estimated Refund Value</span>
                  <span className="text-base font-bold text-emerald-700">
                    ₹{estimatedRefund.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-neutral-500 block">Selected Items: {activeSelectedCount}</span>
                  <span className="text-[11px] text-neutral-400">Warehouse inspection required</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || activeSelectedCount === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Return Request</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
