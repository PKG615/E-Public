import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Truck, 
  CreditCard,
  Ban,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { Return } from '../../types';
import { returnService } from '../../services/api';

interface ReturnDetailModalProps {
  returnRecord: Return;
  isOpen: boolean;
  onClose: () => void;
  onCancelled?: (updatedReturn: Return) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  requested: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  approved: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  pickup_pending: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  in_transit: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  received: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  inspection: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  approved_for_refund: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  approved_for_replacement: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  refunded: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  replaced: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  rejected: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  cancelled: { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-300' },
  closed: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200' }
};

export const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  returnRecord: initialRecord,
  isOpen,
  onClose,
  onCancelled
}) => {
  const [returnRecord, setReturnRecord] = useState<Return>(initialRecord);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [showCancelPrompt, setShowCancelPrompt] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCancellable = ['requested', 'approved', 'pickup_pending'].includes(returnRecord.status);
  const statusTheme = STATUS_COLORS[returnRecord.status] || { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200' };

  const handleCancelReturn = async () => {
    try {
      setIsCancelling(true);
      setActionError(null);
      const res = await returnService.cancel(returnRecord.id, cancelReason.trim() || 'Cancelled by customer');
      if (res.success && res.data) {
        setReturnRecord(res.data);
        setShowCancelPrompt(false);
        if (onCancelled) {
          onCancelled(res.data);
        }
      } else {
        setActionError(res.message || 'Failed to cancel return');
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Server error while cancelling return');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-neutral-200 my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">
                  Return #{returnRecord.return_number}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}>
                  {returnRecord.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Resolution: <strong className="text-neutral-200 uppercase">{returnRecord.resolution_type}</strong> • Order #{returnRecord.order_number || returnRecord.order_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Rejection Notice if rejected */}
          {returnRecord.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-red-900">Return Request Not Approved</h4>
                <p className="text-xs text-red-700 mt-1">
                  Reason: {returnRecord.rejection_reason || 'Does not comply with return policy criteria.'}
                </p>
              </div>
            </div>
          )}

          {/* Cancel Confirmation Prompt */}
          {showCancelPrompt && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-900">Confirm Return Cancellation</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Are you sure you want to cancel this return request? Once cancelled, items cannot be auto-restored without submitting a new request.
                  </p>
                </div>
              </div>
              <input
                type="text"
                placeholder="Reason for cancellation (optional)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs border border-neutral-300 rounded-lg p-2 bg-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  disabled={isCancelling}
                  className="px-3 py-1.5 text-xs text-neutral-600 font-bold hover:text-neutral-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCancelReturn}
                  disabled={isCancelling}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          )}

          {/* Returned Items */}
          <div>
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
              Returned Items ({returnRecord.items?.length || 0})
            </h3>
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden">
              {returnRecord.items?.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Package className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">{item.product_name}</h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Qty: {item.quantity} • Unit Price: ₹{item.unit_price.toLocaleString('en-IN')}
                    </p>
                    {item.condition && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200 uppercase">
                        Condition: {item.condition}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs text-neutral-500 block uppercase font-medium">{item.resolution}</span>
                    <span className="text-sm font-bold text-emerald-700 block mt-0.5">
                      ₹{item.refund_amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked Refund or Replacement Info */}
          {returnRecord.refund && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span>Refund Settlement Details</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {returnRecord.refund.refund_number}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-emerald-200/60">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Amount:</span>
                  <strong className="text-emerald-900 font-bold">₹{returnRecord.refund.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Status:</span>
                  <strong className="text-emerald-900 uppercase font-bold">{returnRecord.refund.status}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Settlement Date:</span>
                  <span className="text-neutral-700">
                    {returnRecord.refund.processed_at ? new Date(returnRecord.refund.processed_at).toLocaleDateString('en-IN') : 'Pending processing'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {returnRecord.replacement && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <span>Replacement Order Details</span>
                </span>
                <span className="text-xs font-mono font-bold text-blue-800">
                  {returnRecord.replacement.replacement_number}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-blue-200/60">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Status:</span>
                  <strong className="text-blue-900 uppercase font-bold">{returnRecord.replacement.status}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Carrier:</span>
                  <span className="text-neutral-700">{returnRecord.replacement.carrier || 'Pending dispatch'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Tracking:</span>
                  <span className="font-mono text-neutral-800 font-bold">{returnRecord.replacement.tracking_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Timeline */}
          {returnRecord.status_history && returnRecord.status_history.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Return Progress & Audit Trail</span>
              </h3>
              <div className="border border-neutral-200 rounded-xl p-4 space-y-3">
                {returnRecord.status_history.map((hist, idx) => (
                  <div key={hist.id || idx} className="flex gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 uppercase">
                          {hist.new_status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(hist.created_at).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {hist.reason && (
                        <p className="text-neutral-600 text-[11px] mt-0.5">
                          {hist.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <div>
            {isCancellable && !showCancelPrompt && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel Return Request</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
