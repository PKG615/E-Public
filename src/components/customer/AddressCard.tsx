import React from 'react';
import { Home, Briefcase, MoreHorizontal, CheckCircle2, Edit3, Trash2, Star } from 'lucide-react';
import { Address } from '../../types';

interface AddressCardProps {
  address: Address;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  selectable?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  selectable = false,
}) => {
  const isDefault = address.is_default;
  const addressType = address.address_type?.toLowerCase() || 'home';

  const renderIcon = () => {
    switch (addressType) {
      case 'work':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'other':
        return <MoreHorizontal className="w-3.5 h-3.5" />;
      default:
        return <Home className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      onClick={selectable && onSelect ? onSelect : undefined}
      className={`relative p-5 rounded-2xl border transition-all ${
        selectable ? 'cursor-pointer' : ''
      } ${
        isSelected
          ? 'border-neutral-900 bg-neutral-50/70 ring-2 ring-neutral-900 shadow-xs'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-xs'
      }`}
    >
      {/* Top badges & actions */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-800 capitalize">
            {renderIcon()}
            <span>{addressType}</span>
          </span>

          {isDefault && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              <span>Default Address</span>
            </span>
          )}
        </div>

        {selectable && isSelected && (
          <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {/* Recipient Details */}
      <div className="space-y-1 text-xs">
        <p className="font-bold text-neutral-900 text-sm">{address.full_name}</p>
        <p className="text-neutral-600 font-medium">
          {address.address_line1 || address.street}
          {address.address_line2 ? `, ${address.address_line2}` : ''}
        </p>
        {address.landmark && (
          <p className="text-neutral-500 italic">Landmark: {address.landmark}</p>
        )}
        <p className="text-neutral-800 font-semibold">
          {address.city}, {address.state} - <span className="font-bold">{address.postal_code}</span>
        </p>
        <p className="text-neutral-500 pt-1">
          Phone: <span className="font-semibold text-neutral-800">{address.phone}</span>
        </p>
      </div>

      {/* Footer Controls */}
      <div 
        className="flex items-center justify-between pt-4 mt-4 border-t border-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          {!isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              className="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 hover:underline"
            >
              <Star className="w-3 h-3" />
              <span>Set as Default</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
            title="Edit address"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs flex items-center gap-1 font-medium"
            title="Delete address"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
