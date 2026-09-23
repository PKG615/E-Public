import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Truck, 
  Package, 
  CreditCard, 
  User, 
  MapPin, 
  AlertTriangle, 
  Eye, 
  ChevronRight,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { Order, OrderStatus, Shipment } from '../../types';
import { adminOrderService, shippingService } from '../../services/api';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [page, setPage] = useState<number>(1);

  // Modal / Detail View
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [statusReason, setStatusReason] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Shipment state for selected order
  const [orderShipment, setOrderShipment] = useState<Shipment | null>(null);
  const [isShipmentLoading, setIsShipmentLoading] = useState<boolean>(false);
  const [showCreateShipment, setShowCreateShipment] = useState<boolean>(false);
  const [shipmentCarrier, setShipmentCarrier] = useState<string>('Delhivery');
  const [shipmentMethod, setShipmentMethod] = useState<string>('standard');
  const [shipmentTrackingNum, setShipmentTrackingNum] = useState<string>('');
  const [isCreatingShipment, setIsCreatingShipment] = useState<boolean>(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page,
        page_size: 50,
      };

      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }
      if (selectedPaymentStatus !== 'all') {
        params.payment_status = selectedPaymentStatus;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await adminOrderService.list(params);
      if (res.success && res.data) {
        setOrders(res.data.items || []);
        setTotalCount(res.data.total || 0);
      } else {
        setError(res.message || 'Failed to load orders');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to communicate with admin orders endpoint');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedStatus, selectedPaymentStatus, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const loadOrderShipment = async (orderId: number) => {
    try {
      setIsShipmentLoading(true);
      setOrderShipment(null);
      const res = await shippingService.getByOrderId(orderId);
      if (res.success && res.data) {
        setOrderShipment(res.data);
      }
    } catch {
      // Order may not have shipment yet
      setOrderShipment(null);
    } finally {
      setIsShipmentLoading(false);
    }
  };

  const handleOpenDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusReason('');
    setStatusNotes('');
    setUpdateError(null);
    setShowCreateShipment(false);
    setShipmentError(null);
    setShipmentTrackingNum('');
    loadOrderShipment(order.id);
  };

  const handleCreateShipment = async () => {
    if (!selectedOrder) return;
    try {
      setIsCreatingShipment(true);
      setShipmentError(null);

      const res = await shippingService.createForOrder(selectedOrder.id, {
        carrier: shipmentCarrier.trim() || undefined,
        shipping_method: shipmentMethod || 'standard',
        tracking_number: shipmentTrackingNum.trim() || undefined,
      });

      if (res.success && res.data) {
        setOrderShipment(res.data);
        setShowCreateShipment(false);
        // Refresh orders to reflect 'processing' / 'packed' status if synced
        fetchOrders();
      } else {
        setShipmentError(res.message || 'Failed to create shipment');
      }
    } catch (err: any) {
      setShipmentError(err.response?.data?.message || 'Error creating shipment record');
    } finally {
      setIsCreatingShipment(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      setIsUpdatingStatus(true);
      setUpdateError(null);

      const res = await adminOrderService.updateStatus(
        selectedOrder.id,
        newStatus,
        statusReason.trim() || undefined,
        statusNotes.trim() || undefined
      );

      if (res.success && res.data) {
        setSelectedOrder(res.data);
        // Refresh table list
        fetchOrders();
      } else {
        setUpdateError(res.message || 'Failed to update status');
      }
    } catch (err: any) {
      setUpdateError(err.response?.data?.message || 'Error updating order status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Metrics
  const totalPaidRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((acc, o) => acc + o.total_amount, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
  const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Delivered</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3" />
            <span>Shipped</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Package className="w-3 h-3" />
            <span>Processing</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Confirmed</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            <span>Cancelled</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-neutral-700" />
            <span>Customer Orders Management</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time orders with atomic inventory reservation and audit logging.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-700 transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
          <span>Refresh Database</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Total Orders</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1">{totalCount}</div>
          <span className="text-[11px] text-neutral-500">Total lifetime orders in database</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Paid Volume</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{totalPaidRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Authoritatively settled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Pending / Actionable</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{pendingOrdersCount}</div>
          <span className="text-[11px] text-amber-600 font-medium">Awaiting packaging or dispatch</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Delivered</span>
          <div className="text-2xl font-extrabold text-neutral-900 mt-1">{deliveredOrdersCount}</div>
          <span className="text-[11px] text-neutral-500">Fulfilled to customer</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <span>Payment:</span>
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500">Querying orders table...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-medium text-neutral-600">No orders found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {orders.map((order) => {
                  const date = new Date(order.created_at);
                  return (
                    <tr key={order.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-neutral-900">
                        {order.order_number}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="block text-[10px] text-neutral-400">
                          {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-neutral-800 block">
                          {order.customer_name || 'Customer'}
                        </span>
                        <span className="text-[11px] text-neutral-400 block truncate max-w-[150px]">
                          {order.customer_email || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-700">
                        <span className="font-bold">{order.items?.length || 0}</span> item(s)
                      </td>
                      <td className="px-5 py-4 font-extrabold text-neutral-900">
                        ₹{order.total_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold uppercase text-[10px] text-neutral-600 block">
                          {order.payment_method}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-0.5 ${
                          order.payment_status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleOpenDetailModal(order)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manage Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-neutral-900">
                    Order #{selectedOrder.order_number}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Placed {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Status Transition Control Card */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-2 uppercase tracking-wider text-neutral-500">
                <Clock className="w-4 h-4 text-neutral-700" />
                <span>Transition Order Status</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Select New Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled (Restores Inventory)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Reason / Tracking Note</label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="e.g. Courier tracking #AWB8820, or Cancel reason"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {newStatus === 'cancelled' && selectedOrder.status !== 'cancelled' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    Warning: Cancelling this order will authoritatively release and restore inventory back into the PostgreSQL stock.
                  </span>
                </div>
              )}

              {updateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {updateError}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={isUpdatingStatus || newStatus === selectedOrder.status}
                  onClick={handleUpdateStatus}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
                >
                  {isUpdatingStatus ? 'Executing Transition...' : 'Update Status in PostgreSQL'}
                </button>
              </div>
            </div>

            {/* Fulfillment & Shipment Section */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                <h5 className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Fulfillment & Delivery Shipment</span>
                </h5>

                {!orderShipment && selectedOrder.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => setShowCreateShipment(!showCreateShipment)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {showCreateShipment ? 'Cancel' : '+ Create Shipment'}
                  </button>
                )}
              </div>

              {isShipmentLoading ? (
                <div className="py-2 text-xs text-neutral-500 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading fulfillment records...</span>
                </div>
              ) : orderShipment ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 rounded-xl p-3 border border-neutral-100 text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Shipment #</span>
                    <span className="font-mono font-bold text-neutral-900 mt-0.5 block">{orderShipment.shipment_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Status</span>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                      {orderShipment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Carrier</span>
                    <span className="font-semibold text-neutral-800 mt-0.5 block">{orderShipment.carrier || 'Internal Fulfillment'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase block">Tracking #</span>
                    <span className="font-mono font-bold text-neutral-900 mt-0.5 block">{orderShipment.tracking_number || 'Pending'}</span>
                  </div>
                </div>
              ) : showCreateShipment ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3">
                  <h6 className="text-xs font-bold text-neutral-900">New Shipment Dispatch</h6>
                  {shipmentError && (
                    <div className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                      {shipmentError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Carrier</label>
                      <input
                        type="text"
                        value={shipmentCarrier}
                        onChange={(e) => setShipmentCarrier(e.target.value)}
                        placeholder="e.g. Blue Dart, Delhivery"
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Shipping Method</label>
                      <select
                        value={shipmentMethod}
                        onChange={(e) => setShipmentMethod(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                      >
                        <option value="standard">Standard</option>
                        <option value="express">Express</option>
                        <option value="priority">Priority</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-700 block mb-1">Tracking Number (AWB)</label>
                      <input
                        type="text"
                        value={shipmentTrackingNum}
                        onChange={(e) => setShipmentTrackingNum(e.target.value)}
                        placeholder="e.g. TRK-8829103"
                        className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateShipment(false)}
                      className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateShipment}
                      disabled={isCreatingShipment}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {isCreatingShipment && <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      <span>Dispatch Shipment</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 italic py-1 flex items-center justify-between">
                  <span>No shipment created for this order yet.</span>
                  {selectedOrder.status !== 'cancelled' && (
                    <span className="text-[11px] text-neutral-400">
                      Use "+ Create Shipment" above to register fulfillment.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
                <h5 className="font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Customer Profile</span>
                </h5>
                <p className="font-bold text-neutral-800">{selectedOrder.customer_name || 'Customer'}</p>
                <p className="text-neutral-500">{selectedOrder.customer_email || 'No email provided'}</p>
                <p className="text-neutral-500 mt-2">
                  Payment: <strong className="uppercase text-neutral-800">{selectedOrder.payment_method}</strong> ({selectedOrder.payment_status})
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs">
                <h5 className="font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Delivery Address</span>
                </h5>
                <p className="font-bold text-neutral-800">{selectedOrder.shipping_address?.full_name}</p>
                <p className="text-neutral-600">{selectedOrder.shipping_address?.address_line1}</p>
                <p className="text-neutral-600">
                  {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.postal_code}
                </p>
                <p className="text-neutral-500 mt-1">Phone: {selectedOrder.shipping_address?.phone}</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200 text-xs font-bold text-neutral-700">
                Ordered Products ({selectedOrder.items?.length || 0})
              </div>
              <div className="divide-y divide-neutral-100 p-4">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <h6 className="font-bold text-neutral-900">{item.product_name}</h6>
                      {item.variant_title && (
                        <span className="text-[11px] text-neutral-500 block">Variant: {item.variant_title}</span>
                      )}
                      <span className="text-[10px] text-neutral-400 font-mono">SKU: {item.sku}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-500 block">
                        ₹{item.unit_price.toLocaleString('en-IN')} × {item.quantity}
                      </span>
                      <span className="font-bold text-neutral-900 block">
                        ₹{item.line_total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="bg-neutral-50 p-4 rounded-2xl text-xs space-y-1.5 border border-neutral-200">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>GST Tax</span>
                <span>₹{selectedOrder.tax_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span>₹{selectedOrder.shipping_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-extrabold text-sm text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Grand Total</span>
                <span>₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Status History Audit Trail */}
            {selectedOrder.status_history && selectedOrder.status_history.length > 0 && (
              <div className="border-t border-neutral-100 pt-4">
                <h5 className="text-xs font-bold text-neutral-900 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Audit History</span>
                </h5>
                <div className="space-y-2">
                  {selectedOrder.status_history.map((hist, idx) => (
                    <div key={hist.id || idx} className="text-[11px] p-2 bg-neutral-50 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-bold uppercase text-neutral-800">{hist.new_status}</span>
                        <span className="text-neutral-500 ml-2">by {hist.changed_by}</span>
                        {hist.reason && <span className="text-neutral-600 italic ml-2">"{hist.reason}"</span>}
                      </div>
                      <span className="text-neutral-400">
                        {new Date(hist.created_at).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
