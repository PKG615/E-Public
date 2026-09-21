import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  ChevronRight, 
  Package, 
  Truck, 
  Tag, 
  LifeBuoy, 
  Star,
  Clock
} from 'lucide-react';
import { NotificationItem } from '../../types';
import { notificationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const NotificationBellPopover: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    if (!user) return;
    try {
      const res = await notificationService.getUnreadCount();
      if (res.data) {
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // ignore
    }
  };

  const fetchRecentNotifications = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await notificationService.list({ page: 1, page_size: 5 });
      if (res.data) {
        setNotifications(res.data.items || []);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s background poll
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // ignore
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-3.5 h-3.5 text-indigo-600" />;
      case 'shipment':
      case 'delivery':
        return <Truck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'promotion':
        return <Tag className="w-3.5 h-3.5 text-purple-600" />;
      case 'support':
        return <LifeBuoy className="w-3.5 h-3.5 text-blue-600" />;
      case 'review':
        return <Star className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-neutral-600" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        id="header-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          
          {/* Popover Header */}
          <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-neutral-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-neutral-400">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">No notifications yet.</div>
            ) : (
              notifications.map(item => {
                const dateStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/account?tab=notifications');
                    }}
                    className={`p-3.5 hover:bg-neutral-50 cursor-pointer transition-colors flex items-start gap-3 ${
                      !item.is_read ? 'bg-neutral-50/70' : 'bg-white'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs truncate ${!item.is_read ? 'font-bold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 shrink-0">{dateStr}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                        {item.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50/60 flex items-center justify-center">
            <Link
              to="/account?tab=notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-neutral-800 hover:text-neutral-900 flex items-center gap-1"
            >
              <span>View All Notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      )}
    </div>
  );
};
