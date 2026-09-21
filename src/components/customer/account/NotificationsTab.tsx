import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  SlidersHorizontal, 
  Package, 
  Truck, 
  Tag, 
  LifeBuoy, 
  Star, 
  ShieldAlert, 
  RotateCcw,
  X,
  Save,
  Clock,
  ExternalLink
} from 'lucide-react';
import { NotificationItem, NotificationPreferences } from '../../../types';
import { notificationService } from '../../../services/api';

interface NotificationsTabProps {
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'order' | 'promotion' | 'support'>('all');

  // Preferences Modal
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const isReadParam = activeFilter === 'unread' ? false : undefined;
      const res = await notificationService.list({
        is_read: isReadParam,
        page: 1,
        page_size: 50
      });
      if (res.data) {
        setNotifications(res.data.items || []);
        setTotal(res.data.total || 0);
        setUnreadCount(res.data.unread_count || 0);
        if (onUnreadCountChange) {
          onUnreadCountChange(res.data.unread_count || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await notificationService.getPreferences();
      if (res.data) {
        setPreferences(res.data);
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeFilter]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      const nextUnread = Math.max(0, unreadCount - 1);
      setUnreadCount(nextUnread);
      if (onUnreadCountChange) onUnreadCountChange(nextUnread);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;
    setIsSavingPreferences(true);
    setPrefSaveSuccess(false);
    try {
      const res = await notificationService.updatePreferences(preferences);
      if (res.data) {
        setPreferences(res.data);
        setPrefSaveSuccess(true);
        setTimeout(() => setPrefSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-indigo-600" />;
      case 'shipment':
      case 'delivery':
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case 'return':
      case 'refund':
        return <RotateCcw className="w-4 h-4 text-amber-600" />;
      case 'promotion':
        return <Tag className="w-4 h-4 text-purple-600" />;
      case 'support':
        return <LifeBuoy className="w-4 h-4 text-blue-600" />;
      case 'review':
        return <Star className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-indigo-50 border-indigo-100';
      case 'shipment':
      case 'delivery':
        return 'bg-emerald-50 border-emerald-100';
      case 'return':
      case 'refund':
        return 'bg-amber-50 border-amber-100';
      case 'promotion':
        return 'bg-purple-50 border-purple-100';
      case 'support':
        return 'bg-blue-50 border-blue-100';
      case 'review':
        return 'bg-amber-50/70 border-amber-100';
      default:
        return 'bg-neutral-50 border-neutral-200';
    }
  };

  const getTargetLink = (item: NotificationItem) => {
    if (item.reference_type === 'order' && item.reference_id) {
      return `/orders/${item.reference_id}`;
    }
    if (item.reference_type === 'ticket' && item.reference_id) {
      return `/account?tab=support`;
    }
    if (item.reference_type === 'coupon') {
      return `/account?tab=coupons`;
    }
    if (item.reference_type === 'return') {
      return `/returns`;
    }
    if (item.reference_type === 'review') {
      return `/reviews`;
    }
    return null;
  };

  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'order') {
      return item.type === 'order' || item.type === 'shipment' || item.type === 'delivery';
    }
    if (activeFilter === 'promotion') {
      return item.type === 'promotion';
    }
    if (activeFilter === 'support') {
      return item.type === 'support';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Notification Center</h2>
            <p className="text-xs text-neutral-500">
              {unreadCount > 0 ? `${unreadCount} unread alerts requiring attention` : 'All alerts are up to date'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={() => {
              fetchPreferences();
              setShowPreferences(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: `All (${notifications.length})` },
          { id: 'unread', label: `Unread (${unreadCount})` },
          { id: 'order', label: 'Orders & Shipping' },
          { id: 'promotion', label: 'Promotions' },
          { id: 'support', label: 'Support & Tickets' },
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

      {/* Notifications List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <Bell className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">No notifications found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            You are all caught up! Important order shipments, customer support messages, and exclusive promotions will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map(item => {
            const targetLink = getTargetLink(item);
            const dateStr = new Date(item.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={item.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  !item.is_read 
                    ? 'bg-white border-neutral-300 shadow-sm' 
                    : 'bg-neutral-50/60 border-neutral-200 text-neutral-600'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${getNotificationBg(item.type)}`}>
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${!item.is_read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" title="Unread" />
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>

                      {targetLink && (
                        <Link 
                          to={targetLink}
                          className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      title="Mark as read"
                      className="p-1.5 text-neutral-400 hover:text-emerald-600 rounded-md hover:bg-neutral-100 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Delete notification"
                    className="p-1.5 text-neutral-400 hover:text-red-600 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && preferences && (
        <div className="fixed inset-0 z-50 bg-neutral-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-neutral-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-900 text-base">Notification Preferences</h3>
                <p className="text-xs text-neutral-500">Choose which alerts you wish to receive</p>
              </div>
              <button 
                onClick={() => setShowPreferences(false)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {prefSaveSuccess && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Preferences saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSavePreferences} className="p-6 space-y-6">
              {/* Alert Categories */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Topic Subscriptions
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg hover:bg-neutral-50 border border-neutral-200">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Order Confirmations & Invoices</span>
                      <span className="text-[11px] text-neutral-500">Updates about new orders, payments, and invoices</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={preferences.order_updates}
                      onChange={(e) => setPreferences({ ...preferences, order_updates: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg hover:bg-neutral-50 border border-neutral-200">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Shipping & Courier Tracking</span>
                      <span className="text-[11px] text-neutral-500">Live dispatch, out for delivery, and courier tracking</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={preferences.shipment_updates}
                      onChange={(e) => setPreferences({ ...preferences, shipment_updates: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg hover:bg-neutral-50 border border-neutral-200">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Returns & Refund Progress</span>
                      <span className="text-[11px] text-neutral-500">Pickup status, warehouse inspection, and bank refunds</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={preferences.return_refund_updates}
                      onChange={(e) => setPreferences({ ...preferences, return_refund_updates: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-lg hover:bg-neutral-50 border border-neutral-200">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Promotions, Discounts & Flash Sales</span>
                      <span className="text-[11px] text-neutral-500">Exclusive coupon codes, price drops, and member rewards</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={preferences.promotional_updates}
                      onChange={(e) => setPreferences({ ...preferences, promotional_updates: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Channels */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                  Delivery Channels
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">Email Alerts</span>
                      <span className="text-[10px] text-neutral-500">Sent to verified email</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={preferences.email_notifications}
                      onChange={(e) => setPreferences({ ...preferences, email_notifications: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50">
                    <div>
                      <span className="text-xs font-bold text-neutral-800 block">In-App Inbox</span>
                      <span className="text-[10px] text-neutral-500">Platform notification bell</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={preferences.in_app_notifications}
                      onChange={(e) => setPreferences({ ...preferences, in_app_notifications: e.target.checked })}
                      className="w-4 h-4 text-neutral-900 rounded focus:ring-neutral-900 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPreferences}
                  className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingPreferences ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
