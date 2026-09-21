import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  Package, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  ExternalLink,
  ThumbsUp,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Review } from '../../types';
import { reviewService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { RatingStars } from '../../components/reviews/RatingStars';

export const CustomerReviewsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Review Modal state
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editBody, setEditBody] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const loadMyReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await reviewService.getMyReviews({ page: 1, limit: 50 });
      if (res.success && res.data) {
        setReviews(res.data.items || []);
      } else {
        setError(res.message || 'Failed to retrieve your reviews');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to load customer reviews');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadMyReviews();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadMyReviews]);

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const res = await reviewService.deleteMyReview(reviewId);
      if (res.success) {
        setSuccessMsg('Review deleted successfully');
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleStartEdit = (rev: Review) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditTitle(rev.title || '');
    setEditBody(rev.body);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    try {
      setSavingEdit(true);
      const res = await reviewService.updateMyReview(editingReview.id, {
        rating: editRating,
        title: editTitle.trim() || undefined,
        body: editBody.trim(),
      });

      if (res.success && res.data) {
        setSuccessMsg('Review updated and submitted for approval');
        setEditingReview(null);
        loadMyReviews();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update review');
    } finally {
      setSavingEdit(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="rounded-3xl border border-neutral-200 bg-white p-12 shadow-xs max-w-md mx-auto">
          <Star className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900">Sign in to view your reviews</h2>
          <p className="text-xs text-neutral-500 mt-2">
            Track and manage your verified product ratings, feedback, and helpful community votes.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            Explore Store Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div id="customer-reviews-page" className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        <span className="text-neutral-900 font-semibold">My Reviews & Ratings</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>My Reviews & Ratings</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Feedback and ratings you have shared for verified purchases and products.
          </p>
        </div>

        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          <Package className="w-3.5 h-3.5 text-neutral-500" />
          View Past Orders
        </Link>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
          <p className="mt-2 text-xs text-neutral-500">Loading your reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-200 bg-white p-12 text-center">
          <Star className="w-10 h-10 text-neutral-300 mx-auto" />
          <h3 className="mt-3 text-base font-bold text-neutral-900">You haven't written any reviews yet</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            Share your experiences on items you've purchased to assist the community and earn verified buyer badges!
          </p>
          <Link
            to="/shop"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              id={`my-review-card-${rev.id}`}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-3 transition-all hover:border-neutral-300"
            >
              {/* Product header & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-3">
                  {rev.product_image && (
                    <img
                      src={rev.product_image}
                      alt={rev.product_name || 'Product'}
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div>
                    <Link
                      to={`/product/${rev.product_slug || rev.product_id}`}
                      className="text-sm font-bold text-neutral-900 hover:underline flex items-center gap-1.5"
                    >
                      <span>{rev.product_name || `Product #${rev.product_id}`}</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RatingStars rating={rev.rating} size="sm" />
                      <span className="text-[11px] text-neutral-400">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                      {rev.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          VERIFIED PURCHASE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      rev.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rev.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : rev.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {rev.status === 'approved' ? 'Live on Store' : rev.status}
                  </span>
                </div>
              </div>

              {/* Review Content */}
              <div>
                {rev.title && <h4 className="text-xs font-bold text-neutral-900 mb-1">{rev.title}</h4>}
                <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">{rev.body}</p>
              </div>

              {/* Review Images */}
              {rev.images && rev.images.length > 0 && (
                <div className="flex gap-2">
                  {rev.images.map((img) => (
                    <img
                      key={img.id}
                      src={img.image_url}
                      alt="Review photo"
                      className="h-14 w-14 rounded-xl border border-neutral-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
                <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3 text-neutral-400" />
                  <span>{rev.helpful_count} people found this helpful</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(rev)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Edit Review</h3>
            <p className="text-xs text-neutral-500">{editingReview.product_name}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Rating</label>
                <RatingStars
                  rating={editRating}
                  size="lg"
                  interactive
                  onRatingChange={setEditRating}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs text-neutral-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Review Body</label>
                <textarea
                  rows={4}
                  required
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 p-2.5 text-xs text-neutral-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
