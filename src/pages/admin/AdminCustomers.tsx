import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Eye, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft,
  Clock,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  Ticket
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminCustomerListItem, AdminCustomerDetail } from '../../types';

interface AdminCustomersProps {
  onNavigateToTab: (tab: any) => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({ onNavigateToTab }) => {
  const [customers, setCustomers] = useState<AdminCustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<AdminCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getCustomers({
        search: search.trim() || undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: sortBy
      });
      if (res.success && res.data) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const loadCustomerDetail = async (id: number) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    try {
      const res = await api.admin.getCustomerById(id);
      if (res.success && res.data) {
        setCustomerDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (customer: AdminCustomerListItem) => {
    if (!window.confirm(`Are you sure you want to ${customer.is_active ? 'deactivate' : 'activate'} ${customer.full_name}?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.admin.updateCustomerStatus(customer.id, {
        is_active: !customer.is_active
      });
      if (res.success) {
        setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, is_active: !customer.is_active } : c));
        if (customerDetail && customerDetail.id === customer.id) {
          setCustomerDetail({ ...customerDetail, is_active: !customer.is_active });
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Customer Management</h2>
            <p className="text-xs text-neutral-500">Live customer records, order aggregations, and account status control</p>
          </div>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Customer Detail Modal / View */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-sm">
                  {customerDetail?.full_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{customerDetail?.full_name || 'Loading...'}</h3>
                  <p className="text-xs text-neutral-500 flex items-center gap-2">
                    <span>{customerDetail?.email}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px]">ID #{customerDetail?.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedCustomerId(null); setCustomerDetail(null); }}
                className="text-neutral-400 hover:text-neutral-900 text-sm font-semibold p-1"
              >
                ✕ Close
              </button>
            </div>

            {detailLoading || !customerDetail ? (
              <div className="py-12 flex justify-center items-center">
                <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metrics ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase">Total Spent</span>
                    <p className="text-lg font-bold text-neutral-900">₹{customerDetail.total_spent.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase">Orders Placed</span>
                    <p className="text-lg font-bold text-neutral-900">{customerDetail.order_count}</p>
                  </div>
                  <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase">Wishlist Items</span>
                    <p className="text-lg font-bold text-neutral-900">{customerDetail.wishlist_count}</p>
                  </div>
                  <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
                    <span className="text-[11px] font-semibold text-neutral-500 uppercase">Reviews / Tickets</span>
                    <p className="text-lg font-bold text-neutral-900">{customerDetail.reviews_count} / {customerDetail.support_tickets.length}</p>
                  </div>
                </div>

                {/* Account Details & Status */}
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Account Credentials & Status</h4>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${customerDetail.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {customerDetail.is_active ? 'Active Account' : 'Suspended Account'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-700">
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Phone</span>
                      <span className="font-semibold">{customerDetail.phone || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Role</span>
                      <span className="font-mono font-semibold uppercase">{customerDetail.role}</span>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px] uppercase">Registered On</span>
                      <span>{new Date(customerDetail.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Addresses */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Saved Delivery Addresses ({customerDetail.addresses.length})</span>
                  </h4>
                  {customerDetail.addresses.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No saved addresses on file.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {customerDetail.addresses.map(a => (
                        <div key={a.id} className="p-3 bg-white border border-neutral-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-900">{a.full_name} ({a.address_type})</span>
                            {a.is_default && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-neutral-600">{a.address_line1} {a.address_line2}</p>
                          <p className="text-neutral-500">{a.city}, {a.state} - {a.postal_code}</p>
                          <p className="text-neutral-500">Phone: {a.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Recent Customer Orders ({customerDetail.recent_orders.length})</span>
                  </h4>
                  {customerDetail.recent_orders.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No orders placed yet.</p>
                  ) : (
                    <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden bg-white">
                      {customerDetail.recent_orders.map(o => (
                        <div key={o.id} className="p-3 flex items-center justify-between text-xs hover:bg-neutral-50">
                          <div>
                            <span className="font-bold text-neutral-900">{o.order_number}</span>
                            <span className="text-neutral-400 text-[11px] block">{o.created_at} • {o.items_count} items</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-neutral-900 block">₹{o.total_amount.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                              {o.status} ({o.payment_status})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Support Tickets */}
                {customerDetail.support_tickets.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Customer Support History</span>
                    </h4>
                    <div className="space-y-2">
                      {customerDetail.support_tickets.map(t => (
                        <div key={t.id} className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-neutral-900">#{t.ticket_number} - {t.subject}</span>
                            <p className="text-[11px] text-neutral-400">{t.created_at}</p>
                          </div>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-neutral-200 text-neutral-800">
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer by name, email, or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Suspended</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl font-semibold text-neutral-700"
          >
            <option value="created_at_desc">Newest First</option>
            <option value="orders_desc">Top Spender (Orders)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="created_at_asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-neutral-400">
            <RefreshCw className="w-7 h-7 animate-spin mb-2" />
            <p className="text-xs font-semibold">Querying Customer Records...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-neutral-500">
            <Users className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
            <p className="text-sm font-bold text-neutral-800">No Customers Found</p>
            <p className="text-xs text-neutral-400 mt-1">Try adjusting search filters or parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700">
              <thead className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {c.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-neutral-900">{c.full_name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono">ID #{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-neutral-800 flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-neutral-400" />
                        <span>{c.email}</span>
                      </p>
                      {c.phone && (
                        <p className="text-neutral-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{c.phone}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {c.is_active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        <span>{c.is_active ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-neutral-900">
                      {c.order_count}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-neutral-900">
                      ₹{c.total_spent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 text-[11px]">
                      {new Date(c.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => loadCustomerDetail(c.id)}
                          className="flex items-center gap-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold px-2.5 py-1 rounded-lg text-xs transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Profile</span>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          title={c.is_active ? 'Suspend Account' : 'Activate Account'}
                          className={`p-1 rounded-lg text-xs transition-colors ${
                            c.is_active 
                              ? 'text-rose-600 hover:bg-rose-50' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {c.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
