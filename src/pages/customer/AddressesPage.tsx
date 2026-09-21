import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, ArrowLeft, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { Address, AddressCreatePayload } from '../../types';
import { addressService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AddressCard } from '../../components/customer/AddressCard';
import { AddressModal } from '../../components/customer/AddressModal';

export const AddressesPage: React.FC = () => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);

  const loadAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await addressService.list();
      if (res.success && res.data) {
        setAddresses(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleOpenAdd = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setAddressToEdit(addr);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (payload: AddressCreatePayload, addressId?: number): Promise<boolean> => {
    try {
      if (addressId) {
        const res = await addressService.update(addressId, payload);
        if (res.success) {
          setFeedbackMsg({ type: 'success', text: 'Address updated successfully' });
          await loadAddresses();
          return true;
        }
      } else {
        const res = await addressService.create(payload);
        if (res.success) {
          setFeedbackMsg({ type: 'success', text: 'New address added successfully' });
          await loadAddresses();
          return true;
        }
      }
      return false;
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save address' });
      return false;
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await addressService.delete(addressId);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Address deleted' });
        await loadAddresses();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete address' });
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      const res = await addressService.setDefault(addressId);
      if (res.success) {
        setFeedbackMsg({ type: 'success', text: 'Default delivery address updated' });
        await loadAddresses();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || 'Failed to set default address' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to="/cart" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cart</span>
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-neutral-900" />
            <span>Delivery Addresses</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Manage your saved shipping addresses for fast and secure order checkout
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-neutral-400 mx-auto" />
          <p className="text-xs font-medium text-neutral-500">Loading delivery addresses...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-xs font-bold text-red-700">{error}</p>
          <button
            onClick={loadAddresses}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl"
          >
            Retry
          </button>
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-dashed border-neutral-300 p-8">
          <div className="w-14 h-14 bg-neutral-100 rounded-full flex items-center justify-center mx-auto text-neutral-400">
            <MapPin className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">No Saved Addresses Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Add your home, office, or other delivery locations to speed up checkout on your orders.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Address</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => handleOpenEdit(addr)}
              onDelete={() => handleDeleteAddress(addr.id)}
              onSetDefault={() => handleSetDefault(addr.id)}
            />
          ))}
        </div>
      )}

      {/* Delivery Guarantee Info */}
      <div className="mt-12 p-5 bg-neutral-100/70 rounded-2xl border border-neutral-200 flex items-start gap-3.5 text-xs text-neutral-600">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-neutral-900 mb-0.5">Authoritative PostgreSQL Address Storage</p>
          <p>
            Your delivery addresses are encrypted and persisted securely in PostgreSQL. Each order checkout recalculates tax and shipping authoritative rules based on your selected address.
          </p>
        </div>
      </div>

      {/* Modal */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
        addressToEdit={addressToEdit}
      />
    </div>
  );
};
