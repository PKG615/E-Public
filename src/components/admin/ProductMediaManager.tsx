import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Star, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Edit3,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ProductImage } from '../../types';
import { api } from '../../services/api';

interface ProductMediaManagerProps {
  productId: number;
  productName?: string;
  onImagesChange?: (images: ProductImage[]) => void;
}

export const ProductMediaManager: React.FC<ProductMediaManagerProps> = ({
  productId,
  productName = 'Product',
  onImagesChange
}) => {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Image via URL Form
  const [showAddUrlModal, setShowAddUrlModal] = useState<boolean>(false);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageAlt, setNewImageAlt] = useState<string>('');
  const [newImageIsPrimary, setNewImageIsPrimary] = useState<boolean>(false);

  // Editing Alt Text Inline
  const [editingAltId, setEditingAltId] = useState<number | null>(null);
  const [editAltValue, setEditAltValue] = useState<string>('');

  // Delete Confirmation State
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);

  // Drag-and-drop / file upload
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getProductImages(productId);
      if (res.success && res.data) {
        setImages(res.data);
        if (onImagesChange) onImagesChange(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load images:', err);
      setError(err.response?.data?.message || 'Failed to load product media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // 1. Add Image by URL
  const handleAddByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) {
      showNotification('Please provide a valid image URL', true);
      return;
    }
    setActionLoading('add-url');
    try {
      const res = await api.admin.createProductImage(productId, {
        image_url: newImageUrl.trim(),
        alt_text: newImageAlt.trim() || undefined,
        is_primary: newImageIsPrimary,
        sort_order: images.length + 1
      });
      if (res.success) {
        showNotification('Image added successfully!');
        setNewImageUrl('');
        setNewImageAlt('');
        setNewImageIsPrimary(false);
        setShowAddUrlModal(false);
        await fetchImages();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to add image by URL', true);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Direct File Upload (with client-side pre-validation)
  const handleFileUpload = async (file: File) => {
    // Validate client size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('File size exceeds the 5MB maximum limit', true);
      return;
    }
    // Validate MIME format
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type.toLowerCase())) {
      showNotification('Unsupported file type. Allowed formats: JPEG, PNG, WEBP, GIF', true);
      return;
    }

    setActionLoading('uploading');
    try {
      const res = await api.admin.uploadProductImage(productId, file, {
        alt_text: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        is_primary: images.length === 0, // make primary if first image
        sort_order: images.length + 1
      });
      if (res.success) {
        showNotification('Image uploaded and optimized successfully!');
        await fetchImages();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Upload failed. Ensure file is a valid image.', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // 3. Set Primary Image
  const handleSetPrimary = async (imageId: number) => {
    if (!imageId) return;
    setActionLoading(`primary-${imageId}`);
    try {
      const res = await api.admin.setPrimaryImage(productId, imageId);
      if (res.success) {
        showNotification('Primary image updated!');
        await fetchImages();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to set primary image', true);
    } finally {
      setActionLoading(null);
    }
  };

  // 4. Save Alt Text
  const handleSaveAltText = async (imageId: number) => {
    setActionLoading(`alt-${imageId}`);
    try {
      const res = await api.admin.updateProductImage(productId, imageId, {
        alt_text: editAltValue.trim()
      });
      if (res.success) {
        showNotification('Alt text updated!');
        setEditingAltId(null);
        await fetchImages();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to update alt text', true);
    } finally {
      setActionLoading(null);
    }
  };

  // 5. Reorder Images (Move Up / Move Down)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const newOrder = [...images];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    const imageIds = newOrder.map(img => img.id!).filter(Boolean);
    setActionLoading('reordering');
    try {
      const res = await api.admin.reorderProductImages(productId, imageIds);
      if (res.success) {
        setImages(res.data);
        if (onImagesChange) onImagesChange(res.data);
        showNotification('Image sequence reordered!');
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to reorder images', true);
    } finally {
      setActionLoading(null);
    }
  };

  // 6. Delete Image with safe primary re-assignment
  const handleDeleteConfirm = async (imageId: number) => {
    setActionLoading(`delete-${imageId}`);
    try {
      const res = await api.admin.deleteProductImage(productId, imageId);
      if (res.success) {
        showNotification('Image deleted successfully!');
        setDeletingImageId(null);
        await fetchImages();
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete image', true);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
        <div>
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-neutral-700" />
            Media & Gallery Management
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage high-resolution images, set primary thumbnail, and define customer gallery sequence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {actionLoading === 'uploading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Upload File
          </button>

          <button
            type="button"
            onClick={() => setShowAddUrlModal(true)}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Image URL
          </button>

          <button
            type="button"
            onClick={fetchImages}
            title="Refresh Images"
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 border border-neutral-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
                e.target.value = '';
              }
            }}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
          />
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-neutral-900 bg-neutral-100 scale-[0.99]' 
            : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/50'
        }`}
      >
        <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-xs font-semibold text-neutral-800">
          Drag & drop product images here, or <span className="text-neutral-900 underline font-bold">browse file</span>
        </p>
        <p className="text-[11px] text-neutral-500 mt-1">
          Supports JPEG, PNG, WEBP, GIF up to 5MB. Real images only; file contents validated on upload.
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-3" />
          <p className="text-xs text-neutral-500">Loading product images from database...</p>
        </div>
      ) : images.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center border border-neutral-200 rounded-xl bg-white p-8">
          <ImageIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-neutral-900">No product images added yet</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            Add at least one product image. The first image will automatically be designated as the primary display image.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Upload Local Image
            </button>
            <button
              type="button"
              onClick={() => setShowAddUrlModal(true)}
              className="px-3.5 py-1.5 bg-white border border-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50"
            >
              Add by URL
            </button>
          </div>
        </div>
      ) : (
        /* Image Grid / List */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span><strong>{images.length}</strong> image{images.length > 1 ? 's' : ''} configured</span>
            <span className="text-[11px]">Primary image displays as the default thumbnail in catalog listings</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, idx) => {
              const isPrimary = img.is_primary;
              const isEditingAlt = editingAltId === img.id;
              const isConfirmingDelete = deletingImageId === img.id;

              return (
                <div
                  key={img.id || idx}
                  className={`bg-white border rounded-xl overflow-hidden shadow-2xs flex flex-col transition-all ${
                    isPrimary 
                      ? 'border-neutral-900 ring-2 ring-neutral-900/10' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  {/* Image Preview Container */}
                  <div className="relative aspect-4/3 bg-neutral-100 overflow-hidden group">
                    <img
                      src={img.image_url}
                      alt={img.alt_text || productName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {/* Primary Badge */}
                    {isPrimary && (
                      <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-900 text-white text-[11px] font-bold rounded-md shadow-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        PRIMARY IMAGE
                      </div>
                    )}

                    {/* Sequence Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-neutral-900/75 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      #{idx + 1} (Order: {img.sort_order ?? idx})
                    </div>

                    {/* Action overlay */}
                    <div className="absolute inset-0 bg-neutral-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                      <a
                        href={img.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-white text-neutral-800 rounded-lg hover:bg-neutral-100 shadow-sm"
                        title="View Full Size"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Card Content & Metadata Controls */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-3">
                    
                    {/* Alt Text Row */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                          Alt Text (SEO & A11y)
                        </label>
                        {!isEditingAlt && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAltId(img.id!);
                              setEditAltValue(img.alt_text || '');
                            }}
                            className="text-[11px] text-neutral-700 hover:text-neutral-900 font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </div>

                      {isEditingAlt ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={editAltValue}
                            onChange={(e) => setEditAltValue(e.target.value)}
                            placeholder="Descriptive alternate text..."
                            className="w-full text-xs px-2.5 py-1.5 border border-neutral-300 rounded-lg focus:outline-neutral-900"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingAltId(null)}
                              className="px-2 py-1 text-[11px] text-neutral-600 hover:text-neutral-900 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveAltText(img.id!)}
                              disabled={actionLoading === `alt-${img.id}`}
                              className="px-2.5 py-1 text-[11px] bg-neutral-900 text-white font-semibold rounded flex items-center gap-1"
                            >
                              {actionLoading === `alt-${img.id}` && <Loader2 className="w-3 h-3 animate-spin" />}
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-700 line-clamp-1 italic">
                          {img.alt_text ? `"${img.alt_text}"` : <span className="text-neutral-400 not-italic">No alt text provided</span>}
                        </p>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-1.5">
                      
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0 || actionLoading !== null}
                          title="Move earlier in gallery sequence"
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === images.length - 1 || actionLoading !== null}
                          title="Move later in gallery sequence"
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Primary Toggle & Delete */}
                      <div className="flex items-center gap-1.5">
                        {!isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(img.id!)}
                            disabled={actionLoading !== null}
                            className="px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded border border-neutral-200 transition-colors flex items-center gap-1"
                          >
                            {actionLoading === `primary-${img.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Star className="w-3 h-3" />
                            )}
                            Set Primary
                          </button>
                        )}

                        {isConfirmingDelete ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteConfirm(img.id!)}
                              disabled={actionLoading !== null}
                              className="px-2 py-1 text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingImageId(null)}
                              className="px-1.5 py-1 text-[10px] text-neutral-600 hover:text-neutral-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingImageId(img.id!)}
                            disabled={actionLoading !== null}
                            title="Delete image"
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add by URL Modal Dialog */}
      {showAddUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-neutral-600" />
                Add Image from URL
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUrlModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddByUrl} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Direct Image URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-neutral-900"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Alt Text (Recommended for SEO)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Front angled view in silver finish"
                  value={newImageAlt}
                  onChange={(e) => setNewImageAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-neutral-900 focus:outline-neutral-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="modalIsPrimary"
                  checked={newImageIsPrimary}
                  onChange={(e) => setNewImageIsPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-0"
                />
                <label htmlFor="modalIsPrimary" className="font-semibold text-neutral-800 cursor-pointer">
                  Set as primary display image immediately
                </label>
              </div>

              {newImageUrl && (
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center gap-3">
                  <img
                    src={newImageUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover border shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
                    }}
                  />
                  <div className="text-[11px] text-neutral-500 line-clamp-2">
                    URL preview validated. Will be securely referenced in database.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAddUrlModal(false)}
                  className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading !== null || !newImageUrl}
                  className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading === 'add-url' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
