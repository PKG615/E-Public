import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User as UserIcon, 
  Bell, 
  LifeBuoy, 
  Package, 
  RotateCcw, 
  Star, 
  HelpCircle, 
  Tag, 
  MapPin, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { OverviewTab } from '../../components/customer/account/OverviewTab';
import { ProfileTab } from '../../components/customer/account/ProfileTab';
import { NotificationsTab } from '../../components/customer/account/NotificationsTab';
import { SupportTab } from '../../components/customer/account/SupportTab';
import { QuestionsTab } from '../../components/customer/account/QuestionsTab';
import { CouponsTab } from '../../components/customer/account/CouponsTab';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read tab from query string or default to overview
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleSelectTab = (tabId: string) => {
    if (tabId === 'orders') {
      navigate('/orders');
      return;
    }
    if (tabId === 'returns') {
      navigate('/returns');
      return;
    }
    if (tabId === 'reviews') {
      navigate('/reviews');
      return;
    }
    if (tabId === 'addresses') {
      navigate('/addresses');
      return;
    }
    setActiveTab(tabId);
    navigate(`/account?tab=${tabId}`);
  };

  const navItems = [
    { id: 'overview', label: 'Overview & Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile & Security', icon: UserIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'support', label: 'Customer Support', icon: LifeBuoy, badge: openTicketsCount > 0 ? openTicketsCount : undefined },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
    { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
    { id: 'questions', label: 'Product Q&A', icon: HelpCircle },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'coupons', label: 'Coupons & Rewards', icon: Tag },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
        <button onClick={() => navigate('/')} className="hover:text-neutral-900 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-bold text-neutral-900">Customer Account Portal</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="capitalize text-emerald-600 font-semibold">{activeTab}</span>
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-8">
        
        {/* Left Sidebar Nav */}
        <aside className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs">
          
          {/* User mini profile */}
          <div className="p-3 mb-4 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center gap-3">
            {user?.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.full_name} 
                className="w-10 h-10 rounded-full object-cover border border-emerald-400"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs text-neutral-900 block truncate">{user?.full_name || 'Customer'}</span>
              <span className="text-[10px] text-neutral-400 block truncate">{user?.email}</span>
            </div>
          </div>

          <div className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-100">
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 w-full min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab onNavigateTab={handleSelectTab} />
          )}

          {activeTab === 'profile' && (
            <ProfileTab 
              user={user} 
              onProfileUpdated={() => {
                // optionally refetch or trigger context update
              }} 
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab 
              onUnreadCountChange={setUnreadCount} 
            />
          )}

          {activeTab === 'support' && (
            <SupportTab 
              onTicketCountChange={setOpenTicketsCount} 
            />
          )}

          {activeTab === 'questions' && (
            <QuestionsTab />
          )}

          {activeTab === 'coupons' && (
            <CouponsTab />
          )}
        </main>

      </div>

    </div>
  );
};
