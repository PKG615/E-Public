import React, { useState, useEffect } from 'react';
import { 
  LifeBuoy, 
  Plus, 
  MessageSquare, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight,
  ShieldCheck,
  Tag,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { SupportTicket, SupportTicketDetail, SupportMessage, SupportTicketCreatePayload } from '../../../types';
import { supportService } from '../../../services/api';

interface SupportTabProps {
  onTicketCountChange?: (openCount: number) => void;
}

export const SupportTab: React.FC<SupportTabProps> = ({ onTicketCountChange }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'closed'>('all');

  // New Ticket Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('order');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Selected Ticket Detail / Thread Modal State
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [ticketDetail, setTicketDetail] = useState<SupportTicketDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const statusParam = activeFilter === 'all' ? undefined : activeFilter === 'open' ? 'open' : 'closed';
      const res = await supportService.listTickets({
        status: statusParam,
        page: 1,
        page_size: 50
      });
      if (res.data) {
        setTickets(res.data.items || []);
        setTotal(res.data.total || 0);
        const openCount = (res.data.items || []).filter(
          t => t.status === 'open' || t.status === 'in_progress' || t.status === 'waiting_for_customer'
        ).length;
        if (onTicketCountChange) onTicketCountChange(openCount);
      }
    } catch (err) {
      console.error('Failed to fetch support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeFilter]);

  const handleOpenDetail = async (ticketId: number) => {
    setSelectedTicketId(ticketId);
    setIsLoadingDetail(true);
    try {
      const res = await supportService.getTicket(ticketId);
      if (res.data) {
        setTicketDetail(res.data);
      }
    } catch (err) {
      console.error('Failed to load ticket detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setCreateError('Please provide both a subject and a description');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const payload: SupportTicketCreatePayload = {
        subject: subject.trim(),
        category,
        priority,
        description: description.trim()
      };

      const res = await supportService.createTicket(payload);
      if (res.data) {
        setShowCreateModal(false);
        setSubject('');
        setDescription('');
        fetchTickets();
        handleOpenDetail(res.data.id);
      }
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create support ticket.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyMessage.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await supportService.replyTicket(selectedTicketId, replyMessage.trim());
      if (res.data && ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          messages: [...ticketDetail.messages, res.data]
        });
        setReplyMessage('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;
    try {
      const res = await supportService.closeTicket(selectedTicketId);
      if (res.data && ticketDetail) {
        setTicketDetail({
          ...ticketDetail,
          status: 'closed'
        });
        fetchTickets();
      }
    } catch (err) {
      console.error('Failed to close ticket:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">OPEN</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">IN PROGRESS</span>;
      case 'waiting_for_customer':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">WAITING ON YOU</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RESOLVED</span>;
      case 'closed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">CLOSED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 uppercase">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Urgent</span>;
      case 'high':
        return <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> High</span>;
      case 'medium':
        return <span className="text-[10px] font-medium text-blue-600">Medium</span>;
      default:
        return <span className="text-[10px] font-medium text-neutral-500">Low</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Support Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Nexus Customer Support</h2>
            <p className="text-xs text-neutral-500">
              Need assistance with orders, shipping, returns, or technical specs? We are here to help.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Support Ticket</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `All Tickets (${tickets.length})` },
          { id: 'open', label: 'Active / Open' },
          { id: 'closed', label: 'Closed & Resolved' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeFilter === tab.id
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ticket List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500">Loading support tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <LifeBuoy className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">No support tickets found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Have a question or encountering an issue with your order? Our support team responds quickly to all inquiries.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Open First Ticket</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const dateStr = new Date(ticket.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div 
                key={ticket.id}
                onClick={() => handleOpenDetail(ticket.id)}
                className="p-4 bg-white hover:bg-neutral-50/70 border border-neutral-200 hover:border-neutral-300 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                      {ticket.ticket_number}
                    </span>
                    {getStatusBadge(ticket.status)}
                    <span className="text-[11px] text-neutral-500 capitalize bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                      {ticket.category}
                    </span>
                    {getPriorityBadge(ticket.priority)}
                  </div>

                  <h3 className="text-sm font-bold text-neutral-900 truncate">
                    {ticket.subject}
                  </h3>

                  <p className="text-xs text-neutral-500 line-clamp-1">
                    {ticket.description}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Opened {dateStr}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-neutral-600">
                      <MessageSquare className="w-3 h-3 text-neutral-400" />
                      {ticket.message_count} {ticket.message_count === 1 ? 'message' : 'messages'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline text-xs font-semibold text-emerald-600">View Thread</span>
                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Conversation Modal */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-neutral-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between gap-4 bg-neutral-50">
              {ticketDetail ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-neutral-800 bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {ticketDetail.ticket_number}
                    </span>
                    {getStatusBadge(ticketDetail.status)}
                    <span className="text-[11px] font-medium text-neutral-600 capitalize bg-white px-2 py-0.5 rounded border border-neutral-200">
                      {ticketDetail.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-neutral-900 text-base">{ticketDetail.subject}</h3>
                </div>
              ) : (
                <div className="h-10 w-48 bg-neutral-200 animate-pulse rounded" />
              )}

              <div className="flex items-center gap-2">
                {ticketDetail && ticketDetail.status !== 'closed' && (
                  <button
                    onClick={handleCloseTicket}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition-colors"
                  >
                    Close Ticket
                  </button>
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
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingDetail ? (
                <div className="p-8 text-center text-xs text-neutral-400">Loading conversation...</div>
              ) : ticketDetail?.messages ? (
                ticketDetail.messages.map((msg, idx) => {
                  const isCustomer = msg.sender_role === 'customer';
                  const timeStr = new Date(msg.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={msg.id || idx}
                      className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-neutral-400">
                        <span className="font-semibold text-neutral-700">
                          {isCustomer ? 'You' : msg.sender_name || 'Nexus Support'}
                        </span>
                        {!isCustomer && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            SUPPORT
                          </span>
                        )}
                        <span>•</span>
                        <span>{timeStr}</span>
                      </div>

                      <div className={`p-3.5 rounded-2xl max-w-lg text-xs leading-relaxed ${
                        isCustomer 
                          ? 'bg-neutral-900 text-white rounded-br-xs' 
                          : 'bg-neutral-100 text-neutral-800 rounded-bl-xs border border-neutral-200'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              ) : null}
            </div>

            {/* Reply Input Form */}
            {ticketDetail?.status === 'closed' ? (
              <div className="p-4 bg-neutral-100 border-t border-neutral-200 text-center text-xs text-neutral-500 font-medium">
                This support ticket has been closed. If you need additional assistance, please open a new ticket.
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="p-4 border-t border-neutral-200 bg-white flex items-center gap-2">
                <input 
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your response to the support agent..."
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyMessage.trim()}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 text-base">Raise a Support Ticket</h3>
                <p className="text-xs text-neutral-500">Our customer care staff will respond directly</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Subject / Summary <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  placeholder="e.g. Question about order tracking delay"
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="order">Orders & Tracking</option>
                    <option value="delivery">Courier Delivery</option>
                    <option value="payment">Payment & Invoicing</option>
                    <option value="return">Returns & Refunds</option>
                    <option value="product">Product & Warranty</option>
                    <option value="account">Account & Security</option>
                    <option value="general">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description of Issue <span className="text-red-500">*</span>
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={4}
                  placeholder="Please describe your query or problem in detail. Include order IDs or tracking numbers if applicable."
                  className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{isCreating ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
