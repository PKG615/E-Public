import React, { useState } from 'react';
import { 
  User as UserIcon, 
  ShieldCheck, 
  KeyRound, 
  Camera, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Lock
} from 'lucide-react';
import { User, UserProfileUpdatePayload, PasswordChangePayload } from '../../../types';
import { accountService } from '../../../services/api';

interface ProfileTabProps {
  user: User | null;
  onProfileUpdated: (updatedUser: User) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user, onProfileUpdated }) => {
  // Profile update form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMsg(null);

    try {
      const payload: UserProfileUpdatePayload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      };

      const res = await accountService.updateProfile(payload);
      if (res.data) {
        onProfileUpdated(res.data);
        setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err: any) {
      setProfileMsg({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to update profile. Please try again.' 
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters long' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMsg(null);

    try {
      const payload: PasswordChangePayload = {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      };

      const res = await accountService.changePassword(payload);
      setPasswordMsg({ type: 'success', text: res.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ 
        type: 'error', 
        text: err.response?.data?.detail || 'Failed to change password. Verify your current password.' 
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formattedDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Active Member';

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Account Identity Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={user?.full_name || 'Avatar'} 
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 font-bold text-2xl flex items-center justify-center border-2 border-emerald-500/30">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" title="Active">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900">{user?.full_name || 'Customer'}</h2>
              {user?.is_verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500 mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {user?.email}
            </p>
            <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              Member since {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-xs">
          <div>
            <span className="text-neutral-400 block text-[11px]">Account Type</span>
            <span className="font-semibold text-neutral-800 uppercase tracking-wide">{user?.role || 'Customer'}</span>
          </div>
          <div className="w-px h-8 bg-neutral-200 mx-2" />
          <div>
            <span className="text-neutral-400 block text-[11px]">Security Level</span>
            <span className="font-semibold text-emerald-600">Standard Protected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Information Form */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <UserIcon className="w-5 h-5 text-neutral-700" />
            <h3 className="font-bold text-neutral-900">Personal Information</h3>
          </div>

          {profileMsg && (
            <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              profileMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                placeholder="Rahul Sharma"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Email Address
              </label>
              <input 
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Email is tied to your login identity and cannot be edited.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </span>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Avatar Image URL
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                  <Camera className="w-4 h-4" />
                </span>
                <input 
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Paste a public image link for your avatar preview.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
            <KeyRound className="w-5 h-5 text-neutral-700" />
            <h3 className="font-bold text-neutral-900">Security & Password</h3>
          </div>

          {passwordMsg && (
            <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-shadow"
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100 text-[11px] text-neutral-500 space-y-1">
              <p className="font-semibold text-neutral-700">Password Guidelines:</p>
              <p>• Minimum 8 characters long</p>
              <p>• Use a combination of uppercase letters, numbers and symbols for strong protection</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
