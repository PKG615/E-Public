import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Truck, 
  RotateCcw, 
  Heart, 
  Star, 
  HelpCircle, 
  Tag, 
  LifeBuoy, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  ChevronRight, 
  ExternalLink,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { AccountDashboard, User } from '../../../types';
import { accountService } from '../../../services/api';

interface OverviewTabProps {
  onNavigateTab: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ onNavigateTab }) => {
  const [dashboard, setDashboard] = useState<AccountDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await accountService.getDashboard();
        if (res.data) {
          setDashboard(res.data);
        }
      } catch (err) {
        console.error('Failed to load account dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-16 text-center bg-white rounded-xl border border-neutral-200">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-neutral-500">Aggregating account activity...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
        <p className="text-xs text-neutral-500">Unable to load dashboard data. Please reload page.</p>
      </div>
    );
  }

  const { stats } = dashboard;

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Profile Welcome & Progress Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            {dashboard.avatar_url ? (
              <img 
                src={dashboard.avatar_url} 
                alt={dashboard.customer_name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-2xl flex items-center justify-center border border-emerald-300">
                {dashboard.customer_name ? dashboard.customer_name[0].toUpperCase() : 'U'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900">
                  Welcome back, {dashboard.customer_name}!
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {dashboard.email} {dashboard.phone && `• ${dashboard.phone}`}
              </p>
              <p className="text-[11px] text-neutral-400 mt-1">
                Enterprise Member since {new Date(dashboard.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('profile')}
              className="px-4 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={() => onNavigateTab('support')}
              className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Get Support</span>
            </button>
          </div>
        </div>

        {/* Profile Completion Meter */}
        <div className="pt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-neutral-700">Profile Completion Status</span>
            <span className="font-extrabold text-emerald-600">{dashboard.profile_completion_percent}%</span>
          </div>
          
          <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500 rounded-full"
              style={{ width: `${dashboard.profile_completion_percent}%` }}
            />
          </div>

          {dashboard.profile_completion_items.some(i => !i.completed) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-neutral-400">Complete these for full account privileges:</span>
              {dashboard.profile_completion_items.filter(i => !i.completed).map(item => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.key === 'phone' || item.key === 'avatar') onNavigateTab('profile');
                    if (item.key === 'address') onNavigateTab('addresses');
                  }}
                  className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors"
                >
                  + Add {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'My Orders', value: stats.orders_count, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50', link: 'orders' },
          { label: 'In-Transit', value: stats.active_shipments_count, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50', link: 'orders' },
          { label: 'Open Tickets', value: stats.open_tickets_count, icon: LifeBuoy, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'support' },
          { label: 'Unread Alerts', value: stats.unread_notifications_count, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'notifications' },
          { label: 'Wishlist', value: stats.wishlist_count, icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50', route: '/wishlist' },
          { label: 'Reviews', value: stats.reviews_count, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50/80', route: '/reviews' },
          { label: 'My Q&A', value: stats.questions_count, icon: HelpCircle, color: 'text-purple-600', bg: 'bg-purple-50', tab: 'questions' },
          { label: 'Coupons', value: stats.available_coupons_count, icon: Tag, color: 'text-teal-600', bg: 'bg-teal-50', tab: 'coupons' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx}
              onClick={() => {
                if (kpi.tab) onNavigateTab(kpi.tab);
                else if (kpi.link) onNavigateTab(kpi.link);
              }}
              className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
            >
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  {kpi.label}
                </span>
                <span className="text-xl font-extrabold text-neutral-900 mt-0.5 block">
                  {kpi.value}
                </span>
              </div>
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid: Recent Orders & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Orders Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-neutral-700" />
                <h3 className="font-bold text-neutral-900 text-sm">Recent Orders</h3>
              </div>
              <button
                onClick={() => onNavigateTab('orders')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dashboard.recent_orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No orders placed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recent_orders.map(order => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="p-3.5 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-neutral-800">
                          {order.order_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full uppercase bg-neutral-100 text-neutral-700">
                          {order.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        {order.items_count} {order.items_count === 1 ? 'item' : 'items'} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-xs text-neutral-900 block">
                        ₹{order.total_amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center justify-end gap-0.5 mt-0.5">
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-neutral-100">
            <Link
              to="/shop"
              className="text-xs font-bold text-neutral-700 hover:text-neutral-900 flex items-center justify-center gap-1.5 py-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <span>Explore New Arrivals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Notifications & Support Tickets Card */}
        <div className="space-y-6">
          
          {/* Recent Notifications */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-neutral-700" />
                <h3 className="font-bold text-neutral-900 text-sm">Recent Notifications</h3>
              </div>
              <button
                onClick={() => onNavigateTab('notifications')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>View Inbox</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dashboard.recent_notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                No new notifications.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dashboard.recent_notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => onNavigateTab('notifications')}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                      !notif.is_read 
                        ? 'bg-neutral-50 border-neutral-300' 
                        : 'bg-white border-neutral-100 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-neutral-900 truncate">{notif.title}</span>
                      {!notif.is_read && <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Support Tickets */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-neutral-700" />
                <h3 className="font-bold text-neutral-900 text-sm">Active Support Tickets</h3>
              </div>
              <button
                onClick={() => onNavigateTab('support')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>All Tickets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {dashboard.open_tickets.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                No active tickets. Everything is running smoothly!
              </div>
            ) : (
              <div className="space-y-2.5">
                {dashboard.open_tickets.map(tkt => (
                  <div
                    key={tkt.id}
                    onClick={() => onNavigateTab('support')}
                    className="p-3 rounded-lg border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-neutral-700">{tkt.ticket_number}</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {tkt.status}
                      </span>
                    </div>
                    <p className="font-semibold text-neutral-900 line-clamp-1 mt-1">{tkt.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
