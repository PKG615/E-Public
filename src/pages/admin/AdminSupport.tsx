import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Filter, 
  ShieldCheck, 
  Lock,
  User,
  AlertTriangle
} from 'lucide-react';
import { SupportTicket, SupportTicketDetail, SupportMessage } from '../../types';
import { adminSupportService } from '../../services/api';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Selected Ticket Modal State
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [ticketDetail, setTicketDetail] = useState<SupportTicketDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await adminSupportService.listTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        page: 1,
        page_size: 50
      });
      if (res.data) {
        setTickets(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load admin support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter]);

  const handleOpenDetail = async (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setIsLoadingDetail(true);
    try {
      const res = await adminSupportService.getTicket(ticketId);
      if (res.data) {
        setTicketDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to load ticket details:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicketId) return;
    setIsUpdatingStatus(true);
    try {
      const res = await adminSupportService.updateStatus(selectedTicketId, newStatus);
      if (res.data && ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          status: res.data.status
        });
        setTickets(prev => prev.map(t => t.id === selectedTicketId ? { ...t, status: res.data.status } : t));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !adminMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      const res = await adminSupportService.replyTicket(
        selectedTicketId,
        adminMessage.trim(),
        isInternalNote
      );
      if (res.data && ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          messages: [...ticketDetail.messages, res.data]
        });
        setAdminMessage('');
        setIsInternalNote(false);
      }
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">OPEN</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">IN PROGRESS</span>;
      case 'waiting_for_customer':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">WAITING ON CUSTOMER</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RESOLVED</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 uppercase">{status}</span>;
    }
  };

  return (
    <div className="flex-1 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-amber-600" />
            <span>Support Tickets & Helpdesk</span>
          </h1>
          <p className="text-xs text-neutral-500">
            Monitor customer inquiries, assign resolutions, and manage ticket SLAs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-3 py-1.5 rounded-lg">
            {total} {total === 1 ? 'Total Ticket' : 'Total Tickets'}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-400" />
          <span className="font-bold text-neutral-700">Filter By:</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-neutral-500 font-medium">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-medium text-neutral-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_for_customer">Waiting on Customer</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-neutral-500 font-medium">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-white font-medium text-neutral-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="order">Orders & Tracking</option>
            <option value="delivery">Delivery</option>
            <option value="payment">Payment</option>
            <option value="return">Returns & Refunds</option>
            <option value="product">Product Specs</option>
            <option value="account">Account</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-500">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-neutral-400">
            No support tickets match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 font-semibold">
                <tr>
                  <th className="p-3.5">Ticket #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Subject & Preview</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {tickets.map(t => (
                  <tr key={t.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-neutral-900">
                      {t.ticket_number}
                    </td>
                    <td className="p-3.5 font-medium text-neutral-800">
                      User #{t.user_id}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <span className="font-bold text-neutral-900 block truncate">{t.subject}</span>
                      <span className="text-[11px] text-neutral-500 truncate block">{t.description}</span>
                    </td>
                    <td className="p-3.5 capitalize text-neutral-600">
                      {t.category}
                    </td>
                    <td className="p-3.5 capitalize font-semibold">
                      <span className={
                        t.priority === 'urgent' ? 'text-red-600' :
                        t.priority === 'high' ? 'text-amber-600' : 'text-neutral-700'
                      }>
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="p-3.5 text-neutral-400 text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleOpenDetail(t.id)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-neutral-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between bg-neutral-50">
              {ticketDetail ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {ticketDetail.ticket_number}
                    </span>
                    {getStatusBadge(ticketDetail.status)}
                    <span className="text-[11px] text-neutral-500 capitalize bg-white px-2 py-0.5 rounded border border-neutral-200">
                      Category: {ticketDetail.category}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      Customer: {ticketDetail.customer_name} ({ticketDetail.customer_email})
                    </span>
                  </div>
                  <h3 className="font-bold text-neutral-900 text-base">{ticketDetail.subject}</h3>
                </div>
              ) : (
                <div className="h-10 w-48 bg-neutral-200 animate-pulse rounded" />
              )}

              <button 
                onClick={() => {
                  setSelectedTicketId(null);
                  setTicketDetail(null);
                }}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Selector Bar */}
            {ticketDetail && (
              <div className="px-6 py-2.5 bg-neutral-100/70 border-b border-neutral-200 flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-700">Update Ticket Workflow Status:</span>
                <div className="flex items-center gap-1.5">
                  {(['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'] as const).map(st => (
                    <button
                      key={st}
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange(st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-colors ${
                        ticketDetail.status === st
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white text-neutral-600 hover:bg-neutral-200 border border-neutral-200'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingDetail ? (
                <div className="p-8 text-center text-xs text-neutral-400">Loading conversation history...</div>
              ) : ticketDetail?.messages ? (
                ticketDetail.messages.map((msg, idx) => {
                  const isInternal = msg.is_internal;
                  const isCustomer = msg.sender_role === 'customer';

                  return (
                    <div 
                      key={msg.id || idx}
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        isInternal 
                          ? 'bg-amber-50/70 border-amber-200' 
                          : isCustomer 
                            ? 'bg-blue-50/50 border-blue-100' 
                            : 'bg-emerald-50/50 border-emerald-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{msg.sender_name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isInternal
                              ? 'bg-amber-200 text-amber-900'
                              : isCustomer
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isInternal ? 'INTERNAL NOTE (STAFF ONLY)' : msg.sender_role}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-neutral-800 leading-relaxed pt-1">
                        {msg.message}
                      </p>
                    </div>
                  );
                })
              ) : null}
            </div>

            {/* Admin Reply & Internal Note Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                  <input 
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Internal Staff Note (Customer will NOT see this note)</span>
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder={isInternalNote ? "Write an internal team note..." : "Type reply to customer..."}
                  className={`flex-1 text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-2 ${
                    isInternalNote 
                      ? 'border-amber-300 focus:ring-amber-500 bg-amber-50/30' 
                      : 'border-neutral-300 focus:ring-neutral-900'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isSendingMessage || !adminMessage.trim()}
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                    isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-neutral-900 hover:bg-neutral-800'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isInternalNote ? 'Save Note' : 'Send to Customer'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
