import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Package, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  AlertCircle, 
  Plus, 
  Edit, 
  Send,
  User,
  Hash,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy
} from 'lucide-react';
import { Shipment, ShipmentStatus, ShipmentTrackingEvent } from '../../types';
import { shippingService, adminOrderService } from '../../services/api';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'packed', 'shipped', 'cancelled'],
  processing: ['packed', 'shipped', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['in_transit', 'out_for_delivery', 'delivered', 'failed'],
  in_transit: ['out_for_delivery', 'delivered', 'failed'],
  out_for_delivery: ['delivered', 'failed'],
  failed: ['out_for_delivery', 'shipped', 'cancelled'],
  delivered: [],
  cancelled: []
};

export const AdminShipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  // Detail Modal
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);

  // Status Update Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [statusLocation, setStatusLocation] = useState<string>('');
  const [statusDescription, setStatusDescription] = useState<string>('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Carrier / Tracking Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editCarrier, setEditCarrier] = useState<string>('');
  const [editTrackingNum, setEditTrackingNum] = useState<string>('');
  const [editMethod, setEditMethod] = useState<string>('standard');
  const [editEta, setEditEta] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Add Tracking Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventStatus, setEventStatus] = useState<string>('in_transit');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState<boolean>(false);
  const [eventError, setEventError] = useState<string | null>(null);

  const fetchShipments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page,
        page_size: 50,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (carrierFilter !== 'all') {
        params.carrier = carrierFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await shippingService.list(params);
      if (res.success && res.data) {
        setShipments(res.data.items || []);
        setTotalCount(res.data.total || 0);
      } else {
        setError(res.message || 'Failed to load shipments');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to communicate with shipments endpoint');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, carrierFilter, searchQuery]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const loadShipmentDetail = async (shipmentId: number) => {
    try {
      setIsDetailLoading(true);
      const res = await shippingService.getById(shipmentId);
      if (res.success && res.data) {
        setSelectedShipment(res.data);
      }
    } catch (err: any) {
      console.error("Error fetching shipment details:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleOpenDetail = (shp: Shipment) => {
    setSelectedShipment(shp);
    loadShipmentDetail(shp.id);
  };

  const handleOpenStatusModal = (shp: Shipment) => {
    setSelectedShipment(shp);
    const allowed = ALLOWED_TRANSITIONS[shp.status] || [];
    setTargetStatus(allowed.length > 0 ? allowed[0] : '');
    setStatusLocation('');
    setStatusDescription('');
    setStatusError(null);
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatus = async () => {
    if (!selectedShipment || !targetStatus) return;
    try {
      setIsSubmittingStatus(true);
      setStatusError(null);

      const res = await shippingService.updateStatus(selectedShipment.id, {
        status: targetStatus as ShipmentStatus,
        location: statusLocation.trim() || undefined,
        description: statusDescription.trim() || undefined,
      });

      if (res.success) {
        setIsStatusModalOpen(false);
        await fetchShipments();
        if (selectedShipment) {
          loadShipmentDetail(selectedShipment.id);
        }
      } else {
        setStatusError(res.message || 'Status transition failed');
      }
    } catch (err: any) {
      setStatusError(err.response?.data?.message || 'Failed to execute status transition');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleOpenEditModal = (shp: Shipment) => {
    setSelectedShipment(shp);
    setEditCarrier(shp.carrier || '');
    setEditTrackingNum(shp.tracking_number || '');
    setEditMethod(shp.shipping_method || 'standard');
    setEditEta(shp.estimated_delivery_date ? shp.estimated_delivery_date.split('T')[0] : '');
    setEditNotes(shp.notes || '');
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedShipment) return;
    try {
      setIsSubmittingEdit(true);
      setEditError(null);

      const res = await shippingService.update(selectedShipment.id, {
        carrier: editCarrier.trim() || undefined,
        tracking_number: editTrackingNum.trim() || undefined,
        shipping_method: editMethod || 'standard',
        estimated_delivery_date: editEta ? new Date(editEta).toISOString() : undefined,
        notes: editNotes.trim() || undefined,
      });

      if (res.success) {
        setIsEditModalOpen(false);
        await fetchShipments();
        if (selectedShipment) {
          loadShipmentDetail(selectedShipment.id);
        }
      } else {
        setEditError(res.message || 'Update failed');
      }
    } catch (err: any) {
      setEditError(err.response?.data?.message || 'Failed to update shipment details');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleOpenEventModal = (shp: Shipment) => {
    setSelectedShipment(shp);
    setEventStatus(shp.status || 'in_transit');
    setEventLocation('');
    setEventDescription('');
    setEventError(null);
    setIsEventModalOpen(true);
  };

  const handleSubmitEvent = async () => {
    if (!selectedShipment || !eventDescription.trim()) {
      setEventError('Description is required');
      return;
    }
    try {
      setIsSubmittingEvent(true);
      setEventError(null);

      const res = await shippingService.addTrackingEvent(selectedShipment.id, {
        status: eventStatus,
        location: eventLocation.trim() || undefined,
        description: eventDescription.trim(),
        source: 'admin'
      });

      if (res.success) {
        setIsEventModalOpen(false);
        await fetchShipments();
        if (selectedShipment) {
          loadShipmentDetail(selectedShipment.id);
        }
      } else {
        setEventError(res.message || 'Failed to add tracking event');
      }
    } catch (err: any) {
      setEventError(err.response?.data?.message || 'Failed to add tracking event');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'out_for_delivery':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Out for Delivery</span>;
      case 'in_transit':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">In Transit</span>;
      case 'shipped':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">Shipped</span>;
      case 'packed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Packed</span>;
      case 'processing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200">Processing</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">Pending</span>;
      case 'failed':
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">{status}</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">{status}</span>;
    }
  };

  // Metrics count
  const metrics = {
    total: totalCount,
    inTransit: shipments.filter(s => ['shipped', 'in_transit'].includes(s.status)).length,
    outForDelivery: shipments.filter(s => s.status === 'out_for_delivery').length,
    delivered: shipments.filter(s => s.status === 'delivered').length
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-neutral-200 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Shipping & Delivery Management
            </h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
              Checkpoint 12
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Authoritative shipment dispatch, courier tracking order synchronization.
          </p>
        </div>

        <button
          onClick={fetchShipments}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Shipments</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Total Active Shipments</span>
          <span className="text-2xl font-black text-neutral-900 mt-1 block">{metrics.total}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">In Transit</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">{metrics.inTransit}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Out For Delivery</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">{metrics.outForDelivery}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Delivered</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{metrics.delivered}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by shipment #, tracking #, order #, or customer..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-neutral-500">Querying shipments...</p>
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-16 text-center">
            <Truck className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">No Shipments Found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Shipments are created when customer orders are fulfilled. You can create shipments directly from the Orders tab.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Shipment #</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Carrier / Tracking</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Estimated ETA</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {shipments.map((shp) => (
                  <tr key={shp.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-neutral-900">
                      {shp.shipment_number}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-neutral-800">
                        #{shp.order_number || `Order #${shp.order_id}`}
                      </span>
                      <span className="text-[11px] text-neutral-400 block">
                        {shp.items_count || 1} items
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-neutral-800 block truncate max-w-[150px]">
                        {shp.customer_name || 'Customer'}
                      </span>
                      <span className="text-[11px] text-neutral-400 block truncate max-w-[150px]">
                        {shp.customer_email || ''}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-neutral-800 block">
                        {shp.carrier || 'Internal Fulfillment'}
                      </span>
                      {shp.tracking_number ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                            {shp.tracking_number}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">
                          Pending assignment
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {getStatusBadge(shp.status)}
                    </td>

                    <td className="px-4 py-3.5 text-neutral-600">
                      {shp.estimated_delivery_date ? (
                        new Date(shp.estimated_delivery_date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenDetail(shp)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="View details & tracking history"
                      >
                        <Clock className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenStatusModal(shp)}
                        disabled={(ALLOWED_TRANSITIONS[shp.status] || []).length === 0}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30"
                        title="Transition status"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(shp)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit carrier & tracking info"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleOpenEventModal(shp)}
                        className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Add milestone event"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Shipment Details Slide-over / Modal */}
      {selectedShipment && !isStatusModalOpen && !isEditModalOpen && !isEventModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Shipment #{selectedShipment.shipment_number}
                </h3>
                <p className="text-xs text-neutral-500">
                  Linked Order: #{selectedShipment.order_number || selectedShipment.order_id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenStatusModal(selectedShipment)}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold"
                >
                  Update Status
                </button>
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status and Carrier Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-neutral-50 rounded-xl p-4 border border-neutral-100 text-xs">
                <div>
                  <span className="text-neutral-400 text-[11px] block">Current Status</span>
                  <span className="mt-1 block">{getStatusBadge(selectedShipment.status)}</span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Carrier</span>
                  <span className="font-semibold text-neutral-800 mt-1 block">
                    {selectedShipment.carrier || 'Internal Fulfillment'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Tracking Number</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-mono font-bold text-neutral-900">
                      {selectedShipment.tracking_number || 'None'}
                    </span>
                    {selectedShipment.tracking_number && (
                      <button
                        onClick={() => handleCopy(selectedShipment.tracking_number!)}
                        className="text-neutral-400 hover:text-neutral-700 p-0.5"
                      >
                        {copiedTracking ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block">Estimated Delivery</span>
                  <span className="font-bold text-emerald-700 mt-1 block">
                    {selectedShipment.estimated_delivery_date ? (
                      new Date(selectedShipment.estimated_delivery_date).toLocaleDateString('en-IN')
                    ) : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Customer & Fulfillment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 rounded-xl p-4 border border-neutral-100 text-xs">
                <div>
                  <span className="text-neutral-400 text-[11px] block font-medium">Customer Information</span>
                  <span className="font-bold text-neutral-800 mt-1 block">
                    {selectedShipment.customer_name || 'Valued Customer'}
                  </span>
                  {selectedShipment.customer_email && (
                    <span className="text-neutral-500 text-[11px] block">
                      {selectedShipment.customer_email}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-neutral-400 text-[11px] block font-medium">Method & Fee</span>
                  <span className="font-bold text-neutral-800 uppercase mt-1 block">
                    {selectedShipment.shipping_method} Service
                  </span>
                  <span className="text-neutral-500 text-[11px] block font-mono">
                    Shipping Charge: ₹{selectedShipment.shipping_cost?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              {/* Milestones Timeline */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Tracking Events Log ({selectedShipment.tracking_events?.length || 0})</span>
                  </h4>
                  <button
                    onClick={() => handleOpenEventModal(selectedShipment)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone Event</span>
                  </button>
                </div>

                <div className="border border-neutral-100 rounded-xl p-4 divide-y divide-neutral-100 space-y-3">
                  {selectedShipment.tracking_events && selectedShipment.tracking_events.length > 0 ? (
                    selectedShipment.tracking_events.map((evt, idx) => (
                      <div key={evt.id || idx} className="pt-3 first:pt-0 flex gap-3 text-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900 uppercase">
                              {evt.status.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-neutral-400 font-mono">
                              {new Date(evt.event_time).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className="text-neutral-600 mt-0.5">{evt.description}</p>
                          {evt.location && (
                            <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{evt.location}</span>
                              <span className="mx-1">•</span>
                              <span>Source: {evt.source}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 italic">No tracking events recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition Modal */}
      {isStatusModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                Transition Shipment Status
              </h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {statusError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            <div className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              Current status: <strong className="uppercase text-neutral-900">{selectedShipment.status}</strong>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Target Status
              </label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {(ALLOWED_TRANSITIONS[selectedShipment.status] || []).map((st) => (
                  <option key={st} value={st}>
                    {st.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Location (Optional)
              </label>
              <input
                type="text"
                value={statusLocation}
                onChange={(e) => setStatusLocation(e.target.value)}
                placeholder="e.g. Mumbai Sorting Hub, Local Courier Station"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Custom Description / Note (Optional)
              </label>
              <textarea
                rows={2}
                value={statusDescription}
                onChange={(e) => setStatusDescription(e.target.value)}
                placeholder="Leave blank to use authoritative default milestone text..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-800">
              <strong>Order Synchronization:</strong> Transitioning to <span className="font-bold font-mono">shipped</span> or <span className="font-bold font-mono">delivered</span> will automatically update the linked order status and audit log.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitStatus}
                disabled={isSubmittingStatus || !targetStatus}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingStatus && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Confirm Transition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Carrier & Tracking Modal */}
      {isEditModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                Edit Carrier & Tracking
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Courier Carrier
              </label>
              <input
                type="text"
                value={editCarrier}
                onChange={(e) => setEditCarrier(e.target.value)}
                placeholder="e.g. Blue Dart, Delhivery, FedEx, DTDC"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Tracking Number (AWB)
              </label>
              <input
                type="text"
                value={editTrackingNum}
                onChange={(e) => setEditTrackingNum(e.target.value)}
                placeholder="Enter real AWB / consignment identifier"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Shipping Method
              </label>
              <select
                value={editMethod}
                onChange={(e) => setEditMethod(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="standard">Standard Delivery</option>
                <option value="express">Express Delivery</option>
                <option value="priority">Priority Same-Day</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Estimated Delivery Date
              </label>
              <input
                type="date"
                value={editEta}
                onChange={(e) => setEditEta(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Internal Warehouse Notes
              </label>
              <textarea
                rows={2}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Special handling or dispatch instructions..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEdit}
                disabled={isSubmittingEdit}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingEdit && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Event Modal */}
      {isEventModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">
                Log Tracking Milestone Event
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {eventError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{eventError}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Milestone Status Tag
              </label>
              <select
                value={eventStatus}
                onChange={(e) => setEventStatus(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="processing">Processing at Facility</option>
                <option value="packed">Packed</option>
                <option value="shipped">Dispatched from Hub</option>
                <option value="in_transit">In Transit to Destination</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Delivery Attempt Failed</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Location
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Delhi Cargo Hub, Bangalore North Station"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Event Description *
              </label>
              <textarea
                rows={3}
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Detailed event note..."
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitEvent}
                disabled={isSubmittingEvent}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingEvent && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <span>Log Event</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
