import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Package, 
  MapPin, 
  CreditCard, 
  Truck, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  ChevronRight, 
  ExternalLink,
  Boxes,
  Eye,
  Check,
  Ban,
  FileText,
  DollarSign
} from 'lucide-react';
import { 
  Return, 
  ReturnStatus, 
  Refund, 
  RefundStatus, 
  Replacement, 
  ReplacementStatus,
  ReturnCondition,
  ReturnApprovePayload,
  ReturnRejectPayload,
  ReturnInspectPayload,
  ReturnStatusUpdatePayload,
  RefundProcessPayload,
  ReplacementStatusUpdatePayload
} from '../../types';
import { 
  adminReturnService, 
  adminRefundService, 
  adminReplacementService 
} from '../../services/api';

const STATUS_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  requested: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  approved: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  pickup_pending: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  picked_up: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  in_transit: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  received: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  inspection: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  approved_for_refund: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  refund_processing: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  refunded: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  replacement_processing: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  replacement_shipped: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  replacement_delivered: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  replaced: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
  rejected: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  cancelled: { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-300' },
  closed: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-neutral-200' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  failed: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  shipped: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' }
};

export const AdminReturns: React.FC = () => {
  // Main Navigation Tabs
  const [activeConsoleTab, setActiveConsoleTab] = useState<'returns' | 'refunds' | 'replacements'>('returns');

  // Returns state
  const [returns, setReturns] = useState<Return[]>([]);
  const [totalReturns, setTotalReturns] = useState<number>(0);
  const [isLoadingReturns, setIsLoadingReturns] = useState<boolean>(true);
  const [returnsStatusFilter, setReturnsStatusFilter] = useState<string>('all');
  const [returnsResolutionFilter, setReturnsResolutionFilter] = useState<string>('all');
  const [returnsSearch, setReturnsSearch] = useState<string>('');

  // Refunds state
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [totalRefunds, setTotalRefunds] = useState<number>(0);
  const [isLoadingRefunds, setIsLoadingRefunds] = useState<boolean>(false);
  const [refundsStatusFilter, setRefundsStatusFilter] = useState<string>('all');
  const [refundsSearch, setRefundsSearch] = useState<string>('');

  // Replacements state
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [totalReplacements, setTotalReplacements] = useState<number>(0);
  const [isLoadingReplacements, setIsLoadingReplacements] = useState<boolean>(false);
  const [replacementsStatusFilter, setReplacementsStatusFilter] = useState<string>('all');
  const [replacementsSearch, setReplacementsSearch] = useState<string>('');

  // Selection & Modals
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Specific Action Modals
  const [approveModalReturn, setApproveModalReturn] = useState<Return | null>(null);
  const [approveCarrier, setApproveCarrier] = useState<string>('BlueDart');
  const [approveTracking, setApproveTracking] = useState<string>('');
  const [approveNote, setApproveNote] = useState<string>('');

  const [rejectModalReturn, setRejectModalReturn] = useState<Return | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectNote, setRejectNote] = useState<string>('');

  const [inspectModalReturn, setInspectModalReturn] = useState<Return | null>(null);
  const [inspectCondition, setInspectCondition] = useState<ReturnCondition>('resellable');
  const [inspectRestock, setInspectRestock] = useState<boolean>(true);
  const [inspectNote, setInspectNote] = useState<string>('');

  const [statusModalReturn, setStatusModalReturn] = useState<Return | null>(null);
  const [statusTarget, setStatusTarget] = useState<string>('');
  const [statusReason, setStatusReason] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string>('');

  const [processRefundModal, setProcessRefundModal] = useState<Refund | null>(null);
  const [refundProviderTxId, setRefundProviderTxId] = useState<string>('');
  const [refundNotes, setRefundNotes] = useState<string>('');

  const [updateReplacementModal, setUpdateReplacementModal] = useState<Replacement | null>(null);
  const [replacementTargetStatus, setReplacementTargetStatus] = useState<ReplacementStatus>('processing');
  const [replacementCarrier, setReplacementCarrier] = useState<string>('Delhivery');
  const [replacementTracking, setReplacementTracking] = useState<string>('');
  const [replacementNotes, setReplacementNotes] = useState<string>('');

  // 1. Fetch Returns
  const fetchReturns = useCallback(async () => {
    try {
      setIsLoadingReturns(true);
      setActionError(null);
      const res = await adminReturnService.list({
        status: returnsStatusFilter !== 'all' ? returnsStatusFilter : undefined,
        resolution_type: returnsResolutionFilter !== 'all' ? returnsResolutionFilter : undefined,
        search: returnsSearch.trim() || undefined,
        page: 1,
        page_size: 50
      });
      if (res.success && res.data) {
        setReturns(res.data.items || []);
        setTotalReturns(res.data.total || 0);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to load returns list');
    } finally {
      setIsLoadingReturns(false);
    }
  }, [returnsStatusFilter, returnsResolutionFilter, returnsSearch]);

  // 2. Fetch Refunds
  const fetchRefunds = useCallback(async () => {
    try {
      setIsLoadingRefunds(true);
      setActionError(null);
      const res = await adminRefundService.list({
        status: refundsStatusFilter !== 'all' ? refundsStatusFilter : undefined,
        search: refundsSearch.trim() || undefined,
        page: 1,
        page_size: 50
      });
      if (res.success && res.data) {
        setRefunds(res.data.items || []);
        setTotalRefunds(res.data.total || 0);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to load refunds list');
    } finally {
      setIsLoadingRefunds(false);
    }
  }, [refundsStatusFilter, refundsSearch]);

  // 3. Fetch Replacements
  const fetchReplacements = useCallback(async () => {
    try {
      setIsLoadingReplacements(true);
      setActionError(null);
      const res = await adminReplacementService.list({
        status: replacementsStatusFilter !== 'all' ? replacementsStatusFilter : undefined,
        search: replacementsSearch.trim() || undefined,
        page: 1,
        page_size: 50
      });
      if (res.success && res.data) {
        setReplacements(res.data.items || []);
        setTotalReplacements(res.data.total || 0);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to load replacements list');
    } finally {
      setIsLoadingReplacements(false);
    }
  }, [replacementsStatusFilter, replacementsSearch]);

  // Initial & Tab triggers
  useEffect(() => {
    if (activeConsoleTab === 'returns') {
      fetchReturns();
    } else if (activeConsoleTab === 'refunds') {
      fetchRefunds();
    } else if (activeConsoleTab === 'replacements') {
      fetchReplacements();
    }
  }, [activeConsoleTab, fetchReturns, fetchRefunds, fetchReplacements]);

  // Handler: Approve Return
  const handleApproveReturn = async () => {
    if (!approveModalReturn) return;
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const payload: ReturnApprovePayload = {
        pickup_carrier: approveCarrier.trim() || undefined,
        pickup_tracking_number: approveTracking.trim() || undefined,
        admin_note: approveNote.trim() || undefined
      };
      const res = await adminReturnService.approve(approveModalReturn.id, payload);
      if (res.success) {
        setActionSuccess(`Return #${approveModalReturn.return_number} approved successfully`);
        setApproveModalReturn(null);
        fetchReturns();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to approve return');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Reject Return
  const handleRejectReturn = async () => {
    if (!rejectModalReturn) return;
    if (!rejectionReason.trim()) {
      setActionError('Rejection reason is mandatory.');
      return;
    }
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const payload: ReturnRejectPayload = {
        rejection_reason: rejectionReason.trim(),
        admin_note: rejectNote.trim() || undefined
      };
      const res = await adminReturnService.reject(rejectModalReturn.id, payload);
      if (res.success) {
        setActionSuccess(`Return #${rejectModalReturn.return_number} rejected`);
        setRejectModalReturn(null);
        fetchReturns();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to reject return');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Inspect & Restock
  const handleInspectReturn = async () => {
    if (!inspectModalReturn) return;
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const payload: ReturnInspectPayload = {
        condition: inspectCondition,
        inspection_note: inspectNote.trim() || undefined,
        restock: inspectRestock
      };
      const res = await adminReturnService.inspect(inspectModalReturn.id, payload);
      if (res.success) {
        setActionSuccess(`Return #${inspectModalReturn.return_number} inspected! ${inspectRestock ? 'Authoritative inventory restocked.' : ''}`);
        setInspectModalReturn(null);
        fetchReturns();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Warehouse inspection submission failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Status Transition
  const handleStatusTransition = async () => {
    if (!statusModalReturn || !statusTarget) return;
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const payload: ReturnStatusUpdatePayload = {
        status: statusTarget as ReturnStatus,
        reason: statusReason.trim() || undefined,
        admin_note: statusNote.trim() || undefined
      };
      const res = await adminReturnService.updateStatus(statusModalReturn.id, payload);
      if (res.success) {
        setActionSuccess(`Status transitioned to ${statusTarget}`);
        setStatusModalReturn(null);
        fetchReturns();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Status transition failed');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Create Refund Record
  const handleCreateRefundRecord = async (ret: Return) => {
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const res = await adminReturnService.createRefund(ret.id, {
        amount: ret.total_refund_amount,
        reason: `Refund for return ${ret.return_number}`
      });
      if (res.success) {
        setActionSuccess(`Refund record ${res.data.refund_number} generated for Return ${ret.return_number}`);
        fetchReturns();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create refund record');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Create Replacement Record
  const handleCreateReplacementRecord = async (ret: Return) => {
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const res = await adminReturnService.createReplacement(ret.id);
      if (res.success) {
        setActionSuccess(`Replacement order ${res.data.replacement_number} initiated`);
        fetchReturns();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to initiate replacement');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Process & Settle Refund
  const handleProcessRefund = async () => {
    if (!processRefundModal) return;
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const payload: RefundProcessPayload = {
        provider_refund_id: refundProviderTxId.trim() || undefined,
        notes: refundNotes.trim() || undefined
      };
      const res = await adminRefundService.process(processRefundModal.id, payload);
      if (res.success) {
        setActionSuccess(`Refund #${processRefundModal.refund_number} settled & completed in ledger`);
        setProcessRefundModal(null);
        fetchRefunds();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to settle refund');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handler: Update Replacement Status
  const handleUpdateReplacementStatus = async () => {
    if (!updateReplacementModal) return;
    try {
      setIsProcessingAction(true);
      setActionError(null);
      const payload: ReplacementStatusUpdatePayload = {
        status: replacementTargetStatus,
        notes: replacementNotes.trim() || undefined
      };
      const res = await adminReplacementService.updateStatus(updateReplacementModal.id, payload);
      if (res.success) {
        setActionSuccess(`Replacement #${updateReplacementModal.replacement_number} updated to ${replacementTargetStatus}`);
        setUpdateReplacementModal(null);
        fetchReplacements();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update replacement status');
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <span>Returns & Refunds Operations</span>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                Checkpoint 13
              </span>
            </h1>
            <p className="text-xs text-neutral-500">
              Authoritative return eligibility, warehouse inspections, inventory restocks, and refund settlements.
            </p>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            onClick={() => setActiveConsoleTab('returns')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'returns'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Returns ({totalReturns})</span>
          </button>
          <button
            onClick={() => setActiveConsoleTab('refunds')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'refunds'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Refunds ({totalRefunds})</span>
          </button>
          <button
            onClick={() => setActiveConsoleTab('replacements')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeConsoleTab === 'replacements'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Replacements ({totalReplacements})</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-500 font-bold hover:text-red-800">Dismiss</button>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 font-bold hover:text-emerald-900">Dismiss</button>
        </div>
      )}

      {/* TAB 1: RETURNS LIFECYCLE */}
      {activeConsoleTab === 'returns' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search return # or customer..."
                  value={returnsSearch}
                  onChange={(e) => setReturnsSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900 w-56"
                />
              </div>

              <select
                value={returnsStatusFilter}
                onChange={(e) => setReturnsStatusFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-xl px-3 py-1.5 bg-white font-medium text-neutral-700"
              >
                <option value="all">All Return Statuses</option>
                <option value="requested">Requested (Pending Approval)</option>
                <option value="approved">Approved</option>
                <option value="pickup_pending">Pickup Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="received">Received at Warehouse</option>
                <option value="inspection">Under Inspection</option>
                <option value="approved_for_refund">Approved for Refund</option>
                <option value="refund_processing">Refund Processing</option>
                <option value="refunded">Refunded (Settled)</option>
                <option value="replacement_processing">Replacement Processing</option>
                <option value="replacement_shipped">Replacement Shipped</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={returnsResolutionFilter}
                onChange={(e) => setReturnsResolutionFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-xl px-3 py-1.5 bg-white font-medium text-neutral-700"
              >
                <option value="all">All Resolutions</option>
                <option value="refund">Refund</option>
                <option value="replacement">Replacement</option>
              </select>
            </div>

            <button
              onClick={fetchReturns}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              title="Refresh Returns"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingReturns ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table */}
          {isLoadingReturns ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-neutral-500">Querying PostgreSQL return records...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No return records found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Return #</th>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Resolution</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {returns.map((ret) => {
                    const badge = STATUS_BADGES[ret.status] || { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200' };
                    return (
                      <tr key={ret.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                          {ret.return_number}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-600">
                          {ret.order_number || `#${ret.order_id}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-neutral-900 block">{ret.customer_name || 'Customer'}</span>
                          <span className="text-[11px] text-neutral-400 block">{ret.customer_email}</span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {ret.total_items_count} item(s)
                        </td>
                        <td className="px-4 py-3 font-bold text-neutral-900">
                          ₹{ret.total_refund_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                            {ret.resolution_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badge.bg} ${badge.text} ${badge.border}`}>
                            {ret.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Review Drawer */}
                            <button
                              type="button"
                              onClick={() => setSelectedReturn(ret)}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" />
                              <span>View</span>
                            </button>

                            {/* Approve (if requested) */}
                            {ret.status === 'requested' && (
                              <button
                                type="button"
                                onClick={() => setApproveModalReturn(ret)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Approve
                              </button>
                            )}

                            {/* Reject (if requested or approved) */}
                            {['requested', 'approved'].includes(ret.status) && (
                              <button
                                type="button"
                                onClick={() => setRejectModalReturn(ret)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Reject
                              </button>
                            )}

                            {/* Transition Status */}
                            {['approved', 'pickup_pending', 'picked_up', 'in_transit'].includes(ret.status) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setStatusModalReturn(ret);
                                  if (ret.status === 'approved') setStatusTarget('pickup_pending');
                                  else if (ret.status === 'pickup_pending') setStatusTarget('picked_up');
                                  else if (ret.status === 'picked_up') setStatusTarget('received');
                                  else setStatusTarget('received');
                                }}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Advance
                              </button>
                            )}

                            {/* Warehouse Inspect & Restock */}
                            {['received', 'inspection'].includes(ret.status) && (
                              <button
                                type="button"
                                onClick={() => setInspectModalReturn(ret)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                <Boxes className="w-3.5 h-3.5" />
                                <span>Inspect & Restock</span>
                              </button>
                            )}

                            {/* Create Refund if approved_for_refund and no refund record */}
                            {ret.status === 'approved_for_refund' && !ret.refund && (
                              <button
                                type="button"
                                onClick={() => handleCreateRefundRecord(ret)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Create Refund
                              </button>
                            )}

                            {/* Create Replacement if approved_for_replacement and no replacement record */}
                            {ret.status === 'approved_for_replacement' && !ret.replacement && (
                              <button
                                type="button"
                                onClick={() => handleCreateReplacementRecord(ret)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Start Replacement
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: REFUNDS CONSOLE */}
      {activeConsoleTab === 'refunds' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search refund # or customer..."
                  value={refundsSearch}
                  onChange={(e) => setRefundsSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900 w-56"
                />
              </div>

              <select
                value={refundsStatusFilter}
                onChange={(e) => setRefundsStatusFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-xl px-3 py-1.5 bg-white font-medium text-neutral-700"
              >
                <option value="all">All Refund Statuses</option>
                <option value="requested">Requested</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed (Settled)</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={fetchRefunds}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRefunds ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingRefunds ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-neutral-500">Querying PostgreSQL refund ledger...</p>
            </div>
          ) : refunds.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No refund records found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Refund #</th>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Return #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Payment Provider</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {refunds.map((ref) => {
                    const badge = STATUS_BADGES[ref.status] || { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200' };
                    return (
                      <tr key={ref.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                          {ref.refund_number}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-600">
                          {ref.order_number || `#${ref.order_id}`}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-700">
                          {ref.return_number || (ref.return_id ? `RET-${ref.return_id}` : 'Direct')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-neutral-900 block">{ref.customer_name || 'Customer'}</span>
                          <span className="text-[11px] text-neutral-400 block">{ref.customer_email}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700">
                          ₹{ref.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 uppercase">
                          {ref.payment_provider || 'Gateway'} • {ref.payment_method || 'Online'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badge.bg} ${badge.text} ${badge.border}`}>
                            {ref.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {['requested', 'processing'].includes(ref.status) ? (
                            <button
                              type="button"
                              onClick={() => {
                                setProcessRefundModal(ref);
                                setRefundProviderTxId(`REF-TX-${Date.now().toString().slice(-6)}`);
                              }}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                            >
                              Settle & Complete
                            </button>
                          ) : (
                            <span className="text-[11px] text-neutral-400 font-medium italic">
                              Settled {ref.processed_at ? new Date(ref.processed_at).toLocaleDateString('en-IN') : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: REPLACEMENTS CONSOLE */}
      {activeConsoleTab === 'replacements' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs space-y-4">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search replacement # or customer..."
                  value={replacementsSearch}
                  onChange={(e) => setReplacementsSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-neutral-900 w-56"
                />
              </div>

              <select
                value={replacementsStatusFilter}
                onChange={(e) => setReplacementsStatusFilter(e.target.value)}
                className="text-xs border border-neutral-200 rounded-xl px-3 py-1.5 bg-white font-medium text-neutral-700"
              >
                <option value="all">All Replacement Statuses</option>
                <option value="requested">Requested</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing (Stock Allocated)</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              onClick={fetchReplacements}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingReplacements ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingReplacements ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-neutral-500">Querying replacement fulfillment pipeline...</p>
            </div>
          ) : replacements.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No replacement orders found.
            </div>
          ) : (
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold border-b border-neutral-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Replacement #</th>
                    <th className="px-4 py-3">Return #</th>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Carrier / Tracking</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium">
                  {replacements.map((rep) => {
                    const badge = STATUS_BADGES[rep.status] || { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200' };
                    return (
                      <tr key={rep.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                          {rep.replacement_number}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-700">
                          {rep.return_number || (rep.return_id ? `RET-${rep.return_id}` : 'N/A')}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-600">
                          {rep.order_number || `#${rep.order_id}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-neutral-900 block">{rep.customer_name || 'Customer'}</span>
                          <span className="text-[11px] text-neutral-400 block">{rep.customer_email}</span>
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {rep.items?.length || 0} item(s)
                        </td>
                        <td className="px-4 py-3">
                          {rep.carrier || rep.tracking_number ? (
                            <div>
                              <span className="font-bold text-neutral-800 block">{rep.carrier}</span>
                              <span className="font-mono text-[11px] text-neutral-500 block">{rep.tracking_number}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badge.bg} ${badge.text} ${badge.border}`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {rep.status !== 'completed' && rep.status !== 'cancelled' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setUpdateReplacementModal(rep);
                                if (rep.status === 'requested') setReplacementTargetStatus('approved');
                                else if (rep.status === 'approved') setReplacementTargetStatus('processing');
                                else if (rep.status === 'processing') setReplacementTargetStatus('shipped');
                                else if (rep.status === 'shipped') setReplacementTargetStatus('delivered');
                                else setReplacementTargetStatus('completed');
                              }}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                            >
                              Update Status
                            </button>
                          ) : (
                            <span className="text-[11px] text-neutral-400 font-medium italic">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* DETAIL DRAWER / MODAL FOR RETURN */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-neutral-200 my-8">
            <div className="px-6 py-4 bg-neutral-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Return Record: {selectedReturn.return_number}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedReturn.status.replace(/_/g, ' ')}
                  </span>
                </h2>
                <p className="text-[11px] text-neutral-400">
                  Order #{selectedReturn.order_number || selectedReturn.order_id} • Customer: {selectedReturn.customer_name} ({selectedReturn.customer_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Return Items Breakdown */}
              <div>
                <h3 className="font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Requested Items ({selectedReturn.items?.length || 0})
                </h3>
                <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden">
                  {selectedReturn.items?.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-neutral-900 block">{item.product_name}</span>
                        <span className="text-[11px] text-neutral-500 block">SKU: {item.sku} • Qty: {item.quantity}</span>
                        {item.condition && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 uppercase">
                            Condition: {item.condition} {item.restocked ? '• Restocked to Stock' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-neutral-500 uppercase block">{item.resolution}</span>
                        <span className="font-bold text-emerald-700 block">₹{item.refund_amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Notes */}
              {selectedReturn.customer_note && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
                  <span className="font-bold text-neutral-700 block mb-1">Customer Note:</span>
                  <p className="text-neutral-600 italic">{selectedReturn.customer_note}</p>
                </div>
              )}

              {/* Admin Note */}
              {selectedReturn.admin_note && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="font-bold text-amber-900 block mb-1">Admin / Inspection Notes:</span>
                  <p className="text-amber-800 whitespace-pre-wrap">{selectedReturn.admin_note}</p>
                </div>
              )}

              {/* Audit Trail */}
              {selectedReturn.status_history && selectedReturn.status_history.length > 0 && (
                <div>
                  <h3 className="font-bold text-neutral-800 uppercase tracking-wider mb-2">Audit History</h3>
                  <div className="border border-neutral-200 rounded-xl p-3 space-y-2">
                    {selectedReturn.status_history.map((h, i) => (
                      <div key={h.id || i} className="flex justify-between text-[11px]">
                        <div>
                          <strong className="text-neutral-900 uppercase">{h.new_status.replace(/_/g, ' ')}</strong>
                          <span className="text-neutral-500 ml-2">by {h.changed_by}</span>
                          {h.reason && <p className="text-neutral-400 mt-0.5 italic">{h.reason}</p>}
                        </div>
                        <span className="text-neutral-400">{new Date(h.created_at).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedReturn(null)}
                className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE RETURN MODAL */}
      {approveModalReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600" />
              <span>Approve Return Request #{approveModalReturn.return_number}</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Confirm approval of return request. You may optionally designate a reverse-logistics pickup courier and tracking number.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Pickup Carrier</label>
                <input
                  type="text"
                  value={approveCarrier}
                  onChange={(e) => setApproveCarrier(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white"
                  placeholder="e.g. BlueDart, Delhivery"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Pickup Tracking Number</label>
                <input
                  type="text"
                  value={approveTracking}
                  onChange={(e) => setApproveTracking(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white"
                  placeholder="e.g. BD-REV-987654"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Admin Approval Note</label>
                <textarea
                  value={approveNote}
                  onChange={(e) => setApproveNote(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white resize-none"
                  rows={2}
                  placeholder="Instructions for pickup or customer..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalReturn(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveReturn}
                disabled={isProcessingAction}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isProcessingAction ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT RETURN MODAL */}
      {rejectModalReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-600" />
              <span>Reject Return Request #{rejectModalReturn.return_number}</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Please provide the official rejection reason. This will be recorded in the audit history and displayed to the customer.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Rejection Reason *</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white"
                  placeholder="e.g. Return window expired, physical damage not covered, tag missing"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Additional Admin Note</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white resize-none"
                  rows={2}
                  placeholder="Internal audit note..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalReturn(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectReturn}
                disabled={isProcessingAction}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT & RESTOCK MODAL */}
      {inspectModalReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" />
              <span>Warehouse Inspection #{inspectModalReturn.return_number}</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Inspect physical package condition. Selecting "Restock to Inventory" will authoritatively restore on-hand and available quantities in PostgreSQL and record an `InventoryTransaction`.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Observed Physical Condition *</label>
                <select
                  value={inspectCondition}
                  onChange={(e) => setInspectCondition(e.target.value as ReturnCondition)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white"
                >
                  <option value="resellable">Resellable (Pristine / Like New)</option>
                  <option value="unopened">Unopened (Factory Sealed)</option>
                  <option value="damaged">Damaged (Unfit for Resale)</option>
                  <option value="defective">Defective (Factory Hardware Defect)</option>
                  <option value="missing_parts">Missing Parts / Incomplete</option>
                </select>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="inspectRestockCb"
                  checked={inspectRestock}
                  onChange={(e) => setInspectRestock(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-neutral-300 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                />
                <label htmlFor="inspectRestockCb" className="cursor-pointer text-emerald-900">
                  <strong className="block font-bold">Restock to PostgreSQL Inventory</strong>
                  <span className="text-[11px] text-emerald-700 block mt-0.5">
                    Increments `on_hand_quantity` and `available_quantity` in `Inventory` table and generates a `return_restock` ledger transaction.
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Inspection Notes</label>
                <textarea
                  value={inspectNote}
                  onChange={(e) => setInspectNote(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white resize-none"
                  rows={2}
                  placeholder="Warehouse bay #, inspector initials, seals verified..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectModalReturn(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInspectReturn}
                disabled={isProcessingAction}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isProcessingAction ? 'Submitting...' : 'Complete Inspection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS TRANSITION MODAL */}
      {statusModalReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-600" />
              <span>Advance Status #{statusModalReturn.return_number}</span>
            </h3>
            <p className="text-xs text-neutral-500">
              Current status is <strong className="uppercase">{statusModalReturn.status}</strong>. Select the next valid stage in the return pipeline.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Target Status *</label>
                <select
                  value={statusTarget}
                  onChange={(e) => setStatusTarget(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white font-medium"
                >
                  <option value="pickup_pending">Pickup Pending</option>
                  <option value="picked_up">Picked Up (Courier In Possession)</option>
                  <option value="received">Received (Warehouse Intake)</option>
                  <option value="inspection">Inspection</option>
                  <option value="approved_for_refund">Approved for Refund</option>
                  <option value="refunded">Refunded</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Stage milestone note..."
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalReturn(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusTransition}
                disabled={isProcessingAction}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isProcessingAction ? 'Transitioning...' : 'Apply Transition'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROCESS REFUND MODAL */}
      {processRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Settle Refund #{processRefundModal.refund_number}</span>
            </h3>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950">
              <div className="flex justify-between">
                <span>Refund Amount:</span>
                <strong className="font-bold text-base text-emerald-800">₹{processRefundModal.amount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between mt-1 text-[11px] text-emerald-700">
                <span>Payment Method:</span>
                <span className="uppercase font-bold">{processRefundModal.payment_method || 'Online'}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Gateway Provider Reference ID</label>
                <input
                  type="text"
                  value={refundProviderTxId}
                  onChange={(e) => setRefundProviderTxId(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white font-mono"
                  placeholder="e.g. rfnd_123456789"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Settlement Notes</label>
                <textarea
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white resize-none"
                  rows={2}
                  placeholder="Processed via gateway payout API..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProcessRefundModal(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={isProcessingAction}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isProcessingAction ? 'Settling...' : 'Confirm Settle & Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE REPLACEMENT MODAL */}
      {updateReplacementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Update Replacement #{updateReplacementModal.replacement_number}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Status Lifecycle *</label>
                <select
                  value={replacementTargetStatus}
                  onChange={(e) => setReplacementTargetStatus(e.target.value as ReplacementStatus)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white font-medium"
                >
                  <option value="approved">Approved</option>
                  <option value="processing">Processing (Stock Allocated)</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed (Return Closed)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {replacementTargetStatus === 'shipped' && (
                <>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Dispatch Courier</label>
                    <input
                      type="text"
                      value={replacementCarrier}
                      onChange={(e) => setReplacementCarrier(e.target.value)}
                      className="w-full border border-neutral-300 rounded-xl p-2 bg-white"
                      placeholder="e.g. Delhivery, BlueDart"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-neutral-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      value={replacementTracking}
                      onChange={(e) => setReplacementTracking(e.target.value)}
                      className="w-full border border-neutral-300 rounded-xl p-2 bg-white font-mono"
                      placeholder="e.g. REP-TRK-776655"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Notes</label>
                <textarea
                  value={replacementNotes}
                  onChange={(e) => setReplacementNotes(e.target.value)}
                  className="w-full border border-neutral-300 rounded-xl p-2 bg-white resize-none"
                  rows={2}
                  placeholder="Fulfillment status update..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUpdateReplacementModal(null)}
                disabled={isProcessingAction}
                className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateReplacementStatus}
                disabled={isProcessingAction}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {isProcessingAction ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
