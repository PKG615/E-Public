import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  User as UserIcon, 
  ShieldCheck, 
  ChevronDown, 
  X, 
  ExternalLink, 
  Heart, 
  ArrowLeftRight, 
  Package, 
  RotateCcw, 
  Star,
  Bell,
  LifeBuoy,
  HelpCircle,
  Tag,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlistCompare } from '../../context/WishlistCompareContext';
import { SearchWithSuggestions } from './SearchWithSuggestions';
import { NotificationBellPopover } from './NotificationBellPopover';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalItemsCount, pincode, checkPincode, pincodeDeliveryInfo } = useCart();
  const { wishlistCount, compareCount } = useWishlistCompare();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [tempPincode, setTempPincode] = useState(pincode);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkPincode(tempPincode);
    setShowPincodeModal(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      {/* Top Banner Bar */}
      

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 sm:gap-6">
          
          {/* Logo & Pincode */}
          <div className="flex items-center gap-4 lg:gap-6 shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-lg tracking-wider group-hover:bg-neutral-800 transition-colors">
                N
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-neutral-900 block leading-tight">
                  Apna<span className="text-emerald-600">.</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 block -mt-1">
                  Enterprise
                </span>
              </div>
            </Link>

            {/* Pincode selector button (Section 13) */}
            <button
              id="header-pincode-trigger"
              onClick={() => setShowPincodeModal(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1.5 rounded-md transition-colors"
              title="Change Delivery Location"
            >
              <MapPin className="w-3.5 h-3.5 text-neutral-500" />
              <div className="text-left">
                <span className="text-[10px] text-neutral-400 block leading-none">Deliver to</span>
                <span className="font-semibold text-neutral-800 leading-tight block">{pincode}</span>
              </div>
              <ChevronDown className="w-3 h-3 text-neutral-400 ml-0.5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <SearchWithSuggestions />
          </div>

          {/* Right Action Icons: User, Cart, Admin Switch */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            
            {/* User Dropdown */}
            <div className="relative">
              <button
                id="header-user-dropdown-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-700 transition-colors text-xs font-medium"
              >
                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-700 font-semibold">
                  {user?.full_name ? user.full_name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="hidden lg:block text-left">
                  <span className="text-[10px] text-neutral-400 block leading-none">Account</span>
                  <span className="font-semibold text-neutral-900 block truncate max-w-[100px]">
                    {user?.full_name?.split(' ')[0] || 'Sign In'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showUserMenu && (
                <div 
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 text-sm animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="font-semibold text-neutral-900">{user?.full_name || 'Guest User'}</p>
                    <p className="text-xs text-neutral-500 truncate">{user?.email || 'Not logged in'}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 text-neutral-700">
                      Role: <span className="font-bold uppercase">{user?.role || 'Customer'}</span>
                    </div>
                  </div>

                  <div className="py-1 max-h-96 overflow-y-auto">
                    <Link
                      to="/account"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-900 flex items-center gap-2 text-xs font-bold"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Account Dashboard</span>
                    </Link>
                    <Link
                      to="/account?tab=profile"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Profile & Security</span>
                    </Link>
                    <Link
                      to="/account?tab=notifications"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <Bell className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Notifications & Alerts</span>
                    </Link>
                    <Link
                      to="/account?tab=support"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <LifeBuoy className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Customer Support</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <Package className="w-3.5 h-3.5 text-neutral-500" />
                      <span>My Orders</span>
                    </Link>
                    <Link
                      to="/returns"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Returns & Refunds</span>
                    </Link>
                    <Link
                      to="/reviews"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <Star className="w-3.5 h-3.5 text-neutral-500" />
                      <span>My Reviews & Ratings</span>
                    </Link>
                    <Link
                      to="/account?tab=questions"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Product Q&A</span>
                    </Link>
                    <Link
                      to="/account?tab=coupons"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <Tag className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Coupons & Rewards</span>
                    </Link>
                    <Link
                      to="/addresses"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full text-left px-4 py-2 hover:bg-neutral-50 text-neutral-700 flex items-center gap-2 text-xs font-medium"
                    >
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Delivery Addresses</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* In-App Notification Bell Popover */}
            <NotificationBellPopover />

            {/* Compare Link & Counter */}
            

            {/* Wishlist Link & Counter */}
            <Link
              to="/wishlist"
              id="header-wishlist-btn"
              className="relative p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors flex items-center gap-1.5"
              title="View Saved Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'text-rose-600 fill-rose-600' : 'text-neutral-700'}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {wishlistCount}
                </span>
              )}
              <span className="hidden md:inline text-xs font-semibold text-neutral-800">
                Wishlist
              </span>
            </Link>

            {/* Cart Icon & Counter */}
            <Link
              to="/cart"
              id="header-cart-btn"
              className="relative p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 transition-colors flex items-center gap-2"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5 text-neutral-800" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {totalItemsCount}
                </span>
              )}
              <span className="hidden sm:inline text-xs font-semibold text-neutral-800">
                Cart
              </span>
            </Link>

          </div>
        </div>
      </div>

      {/* Pincode Modal */}
      {showPincodeModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-neutral-900">Choose Delivery Location</h3>
              </div>
              <button 
                onClick={() => setShowPincodeModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePincodeSubmit} className="mt-4">
              <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
                Enter your 6-digit delivery pincode to check instant shipping time, courier delivery slots, and Cash on Delivery availability.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={tempPincode}
                  onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 110001"
                  className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-sm font-semibold tracking-wider text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
                <button
                  type="submit"
                  className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Verify
                </button>
              </div>

              {pincodeDeliveryInfo && (
                <div className="mt-3 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs">
                  <p className={`font-semibold ${pincodeDeliveryInfo.serviceable ? 'text-emerald-700' : 'text-red-600'}`}>
                    {pincodeDeliveryInfo.serviceable ? '✓ Serviceable Location' : '✗ Service Unavailable'}
                  </p>
                  <p className="text-neutral-600 mt-0.5">{pincodeDeliveryInfo.message}</p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
