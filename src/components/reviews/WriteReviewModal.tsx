import React, { useState } from 'react';
import { X, Star, Upload, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Product, ProductVariant, ReviewEligibility } from '../../types';
import { reviewService } from '../../services/api';
import { RatingStars } from './RatingStars';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  eligibility: ReviewEligibility | null;
  onReviewSubmitted: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  isOpen,
  onClose,
  product,
  eligibility,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(undefined);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    if (images.length >= 5) {
      setErrorMessage('Maximum 5 images allowed per review');
      return;
    }
    if (!newImageUrl.startsWith('http://') && !newImageUrl.startsWith('https://')) {
      setErrorMessage('Please enter a valid HTTP/HTTPS image URL');
      return;
    }
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
    setErrorMessage(null);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a star rating between 1 and 5');
      return;
    }

    if (body.trim().length < 10) {
      setErrorMessage('Review text must be at least 10 characters long');
      return;
    }

    try {
      setSubmitting(true);
      const res = await reviewService.create(product.id || product.slug, {
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        variant_id: selectedVariantId,
        images: images.length > 0 ? images : undefined,
      });

      if (res.success) {
        setSuccessMessage('Thank you! Your review has been submitted for moderation.');
        setTimeout(() => {
          onReviewSubmitted();
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Failed to submit review');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error submitting review';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="write-review-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div
        id="write-review-modal-card"
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900">Write a Review</h2>
            <p className="text-xs text-stone-500 mt-0.5">{product.name}</p>
          </div>
          <button
            id="close-review-modal-btn"
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verified Purchase Status Banner */}
        {eligibility?.is_verified_eligible ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Verified Purchase:</strong> Your order history qualifies your review for the exclusive <strong>Verified Purchase</strong> badge!
            </span>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs text-stone-600 border border-stone-200">
            <AlertCircle className="w-4 h-4 text-stone-400 shrink-0" />
            <span>
              Writing as standard customer. (Orders must be confirmed or delivered to obtain a Verified Purchase badge).
            </span>
          </div>
        )}

        {/* Alert Notifications */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Overall Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <RatingStars
                rating={rating}
                size="xl"
                interactive
                onRatingChange={setRating}
              />
              <span className="text-sm font-bold text-amber-600">
                {rating === 5 && '5.0 — Excellent!'}
                {rating === 4 && '4.0 — Very Good'}
                {rating === 3 && '3.0 — Average'}
                {rating === 2 && '2.0 — Below Average'}
                {rating === 1 && '1.0 — Poor'}
              </span>
            </div>
          </div>

          {/* Variant selection if available */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Variant Reviewed (Optional)
              </label>
              <select
                id="review-variant-select"
                value={selectedVariantId || ''}
                onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm text-stone-800 focus:border-stone-400 focus:bg-white focus:outline-none"
              >
                <option value="">All / General Product</option>
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.sku})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Review Headline / Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Review Headline (Optional)
            </label>
            <input
              id="review-title-input"
              type="text"
              maxLength={120}
              placeholder="e.g., Exceeded my expectations in battery and performance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Review Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Detailed Experience <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="review-body-textarea"
              rows={4}
              required
              minLength={10}
              maxLength={2000}
              placeholder="What did you like or dislike? How does it perform in daily usage?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
            />
            <div className="flex justify-between text-[11px] text-stone-400 mt-1">
              <span>Minimum 10 characters</span>
              <span>{body.length} / 2000</span>
            </div>
          </div>

          {/* Photo Attachments */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
              Add Photos (Up to 5)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="review-image-url-input"
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
                />
              </div>
              <button
                id="add-review-image-btn"
                type="button"
                onClick={handleAddImage}
                disabled={images.length >= 5 || !newImageUrl.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                Add Image
              </button>
            </div>

            {/* Attached Images Preview */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-xl border border-stone-200 overflow-hidden bg-stone-100">
                    <img
                      src={imgUrl}
                      alt={`Review preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 flex items-center justify-center bg-stone-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
            <button
              id="cancel-review-btn"
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              id="submit-review-btn"
              type="submit"
              disabled={submitting || !!successMessage}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Post Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
