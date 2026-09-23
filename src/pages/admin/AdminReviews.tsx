import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  XCircle,
  EyeOff,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Loader2,
  ArrowUpDown,
  ExternalLink,
  MessageCircleQuestion
} from 'lucide-react';
import { Review, ProductQuestion, ProductAnswer, ReviewStatus } from '../../types';
import { adminReviewService, adminQAService } from '../../services/api';
import { RatingStars } from '../../components/reviews/RatingStars';

export const AdminReviews: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reviews' | 'questions'>('reviews');

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [reviewTotal, setReviewTotal] = useState<number>(0);
  const [reviewPage, setReviewPage] = useState<number>(1);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | undefined>(undefined);
  const [reviewSearch, setReviewSearch] = useState<string>('');

  // Questions state
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [questionTotal, setQuestionTotal] = useState<number>(0);
  const [questionPage, setQuestionPage] = useState<number>(1);
  const [questionStatusFilter, setQuestionStatusFilter] = useState<string>('all');

  // Answering modal/inline
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [sellerAnswerText, setSellerAnswerText] = useState<string>('');
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);

  // Status feedback
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 4000);
    }
  };

  // Load reviews
  const loadReviews = useCallback(async (page: number) => {
    try {
      setLoadingReviews(true);
      const res = await adminReviewService.list({
        page,
        limit: 15,
        status: reviewStatusFilter !== 'all' ? reviewStatusFilter : undefined,
        rating: reviewRatingFilter,
        search: reviewSearch.trim() || undefined,
      });

      if (res.success && res.data) {
        setReviews(res.data.items);
        setReviewTotal(res.data.total);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to fetch reviews', true);
    } finally {
      setLoadingReviews(false);
    }
  }, [reviewStatusFilter, reviewRatingFilter, reviewSearch]);

  // Load questions
  const loadQuestions = useCallback(async (page: number) => {
    try {
      setLoadingQuestions(true);
      const res = await adminQAService.listQuestions({
        page,
        limit: 15,
        status: questionStatusFilter !== 'all' ? questionStatusFilter : undefined,
      });

      if (res.success && res.data) {
        setQuestions(res.data.items);
        setQuestionTotal(res.data.total);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to fetch questions', true);
    } finally {
      setLoadingQuestions(false);
    }
  }, [questionStatusFilter]);

  useEffect(() => {
    setReviewPage(1);
    loadReviews(1);
  }, [loadReviews]);

  useEffect(() => {
    if (activeTab === 'questions') {
      setQuestionPage(1);
      loadQuestions(1);
    }
  }, [activeTab, loadQuestions]);

  // Review Actions
  const handleApproveReview = async (id: number) => {
    try {
      setProcessingId(id);
      const res = await adminReviewService.approve(id);
      if (res.success) {
        showNotification(`Review #${id} has been APPROVED and is now live.`);
        loadReviews(reviewPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to approve review', true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectReview = async (id: number) => {
    try {
      setProcessingId(id);
      const res = await adminReviewService.reject(id);
      if (res.success) {
        showNotification(`Review #${id} has been REJECTED.`);
        loadReviews(reviewPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to reject review', true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleHideReview = async (id: number) => {
    try {
      setProcessingId(id);
      const res = await adminReviewService.hide(id);
      if (res.success) {
        showNotification(`Review #${id} is now HIDDEN from storefront.`);
        loadReviews(reviewPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to hide review', true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm(`Permanently delete review #${id}? This action cannot be undone.`)) return;

    try {
      setProcessingId(id);
      const res = await adminReviewService.delete(id);
      if (res.success) {
        showNotification(`Review #${id} permanently deleted.`);
        loadReviews(reviewPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete review', true);
    } finally {
      setProcessingId(null);
    }
  };

  // Question Actions
  const handleApproveQuestion = async (id: number) => {
    try {
      setProcessingId(id);
      const res = await adminQAService.approveQuestion(id);
      if (res.success) {
        showNotification(`Question #${id} APPROVED.`);
        loadQuestions(questionPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to approve question', true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectQuestion = async (id: number) => {
    try {
      setProcessingId(id);
      const res = await adminQAService.rejectQuestion(id);
      if (res.success) {
        showNotification(`Question #${id} REJECTED.`);
        loadQuestions(questionPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to reject question', true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm(`Permanently delete question #${id} and all its answers?`)) return;

    try {
      setProcessingId(id);
      const res = await adminQAService.deleteQuestion(id);
      if (res.success) {
        showNotification(`Question #${id} deleted.`);
        loadQuestions(questionPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to delete question', true);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePostSellerAnswer = async (questionId: number) => {
    if (!sellerAnswerText.trim()) return;

    try {
      setSubmittingAnswer(true);
      const res = await adminQAService.answerQuestion(questionId, {
        answer: sellerAnswerText.trim(),
      });
      if (res.success) {
        showNotification(`Official store answer published for Question #${questionId}`);
        setSellerAnswerText('');
        setSelectedQuestionId(null);
        loadQuestions(questionPage);
      }
    } catch (err: any) {
      showNotification(err.response?.data?.message || 'Failed to post answer', true);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  return (
    <div id="admin-reviews-page" className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900">
                Reviews, Ratings & Product Q&A Moderation
              </h1>
              <p className="text-xs text-neutral-500">
                Manage customer feedback, verified purchase badges, and official seller responses.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center rounded-2xl bg-neutral-200/70 p-1">
          <button
            id="admin-tab-reviews-btn"
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'reviews'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            Reviews ({reviewTotal})
          </button>
          <button
            id="admin-tab-questions-btn"
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'questions'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
            Questions & Answers ({questionTotal})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800 border border-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 1: REVIEWS MODERATION                             */}
      {/* ========================================================= */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {/* Status Filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400 font-semibold uppercase">Status:</span>
                <select
                  id="admin-review-status-select"
                  value={reviewStatusFilter}
                  onChange={(e) => setReviewStatusFilter(e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved (Live)</option>
                  <option value="rejected">Rejected</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400 font-semibold uppercase">Rating:</span>
                <select
                  id="admin-review-rating-select"
                  value={reviewRatingFilter || ''}
                  onChange={(e) => setReviewRatingFilter(e.target.value ? Number(e.target.value) : undefined)}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-400"
                >
                  <option value="">All Stars</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Search text */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  id="admin-review-search-input"
                  type="text"
                  placeholder="Search by product, user, or review text..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-8 pr-3 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-neutral-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setReviewStatusFilter('all');
                setReviewRatingFilter(undefined);
                setReviewSearch('');
              }}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 self-end sm:self-center"
            >
              Reset Filters
            </button>
          </div>

          {/* Reviews Table / List */}
          {loadingReviews ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
              <p className="mt-2 text-xs text-neutral-500">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-neutral-200 p-6">
              <MessageSquare className="w-8 h-8 mx-auto text-neutral-300" />
              <h3 className="mt-2 text-sm font-bold text-neutral-800">No reviews found</h3>
              <p className="text-xs text-neutral-500 mt-1">No customer reviews match your active filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  id={`admin-review-row-${rev.id}`}
                  className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 transition-all hover:border-neutral-300"
                >
                  {/* Top info line */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700">
                        {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-900">{rev.user_name}</span>
                          {rev.is_verified_purchase && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              VERIFIED PURCHASE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Product: <strong className="text-neutral-700">{rev.product_name || `ID #${rev.product_id}`}</strong>
                          {rev.order_id && ` • Order #${rev.order_id}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <RatingStars rating={rev.rating} size="sm" showValue />

                      {/* Status Pill */}
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
                        {rev.status}
                      </span>
                    </div>
                  </div>

                  {/* Review Title & Body */}
                  <div>
                    {rev.title && <h4 className="text-xs font-bold text-neutral-900 mb-1">{rev.title}</h4>}
                    <p className="text-xs leading-relaxed text-neutral-600 whitespace-pre-line">{rev.body}</p>
                  </div>

                  {/* Images preview if any */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="flex gap-2 pt-1">
                      {rev.images.map((img) => (
                        <a
                          key={img.id}
                          href={img.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-14 w-14 rounded-xl border border-neutral-200 overflow-hidden bg-neutral-100 block group"
                        >
                          <img
                            src={img.image_url}
                            alt="Customer photo"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Bottom Action Controls */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400">
                      Submitted: {new Date(rev.created_at).toLocaleString()} • Helpful Votes: {rev.helpful_count}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {rev.status !== 'approved' && (
                        <button
                          id={`approve-review-btn-${rev.id}`}
                          type="button"
                          disabled={processingId === rev.id}
                          onClick={() => handleApproveReview(rev.id)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </button>
                      )}

                      {rev.status !== 'rejected' && (
                        <button
                          id={`reject-review-btn-${rev.id}`}
                          type="button"
                          disabled={processingId === rev.id}
                          onClick={() => handleRejectReview(rev.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}

                      {rev.status !== 'hidden' && (
                        <button
                          id={`hide-review-btn-${rev.id}`}
                          type="button"
                          disabled={processingId === rev.id}
                          onClick={() => handleHideReview(rev.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          Hide
                        </button>
                      )}

                      <button
                        id={`delete-review-btn-${rev.id}`}
                        type="button"
                        disabled={processingId === rev.id}
                        onClick={() => handleDeleteReview(rev.id)}
                        className="rounded-xl p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTION 2: PRODUCT Q&A MODERATION & ANSWERING             */}
      {/* ========================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Questions Filter Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-semibold uppercase">Status:</span>
              <select
                id="admin-question-status-select"
                value={questionStatusFilter}
                onChange={(e) => setQuestionStatusFilter(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:border-neutral-400"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved (Live)</option>
                <option value="rejected">Rejected</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setQuestionStatusFilter('all')}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
            >
              Reset Filters
            </button>
          </div>

          {loadingQuestions ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-neutral-200">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
              <p className="mt-2 text-xs text-neutral-500">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-neutral-200 p-6">
              <HelpCircle className="w-8 h-8 mx-auto text-neutral-300" />
              <h3 className="mt-2 text-sm font-bold text-neutral-800">No questions found</h3>
              <p className="text-xs text-neutral-500 mt-1">No community questions match the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  id={`admin-question-card-${q.id}`}
                  className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900">Asked by {q.user_name}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            q.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Product: <strong className="text-neutral-700">{q.product_name || `ID #${q.product_id}`}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {q.status !== 'approved' && (
                        <button
                          type="button"
                          disabled={processingId === q.id}
                          onClick={() => handleApproveQuestion(q.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      )}
                      {q.status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={processingId === q.id}
                          onClick={() => handleRejectQuestion(q.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={processingId === q.id}
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="rounded-xl p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question body */}
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white shrink-0 mt-0.5">
                      Q
                    </span>
                    <p className="text-xs font-bold text-neutral-900">{q.question}</p>
                  </div>

                  {/* Existing answers */}
                  <div className="pl-7 space-y-2">
                    {q.answers && q.answers.length > 0 ? (
                      q.answers.map((ans) => (
                        <div key={ans.id} className="rounded-xl bg-neutral-50 p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-neutral-800">{ans.user_name}</span>
                              {ans.is_seller_answer && (
                                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                                  OFFICIAL SELLER
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-neutral-400">
                              {new Date(ans.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-neutral-700">{ans.answer}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] italic text-neutral-400">No answers recorded yet.</p>
                    )}

                    {/* Official Store Reply Box */}
                    {selectedQuestionId === q.id ? (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                          <MessageCircleQuestion className="w-4 h-4 text-amber-600" />
                          <span>Publish Official Seller Answer</span>
                        </div>
                        <textarea
                          rows={3}
                          value={sellerAnswerText}
                          onChange={(e) => setSellerAnswerText(e.target.value)}
                          placeholder="Type authoritative response from the store team..."
                          className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-800 focus:outline-none focus:border-amber-400"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedQuestionId(null);
                              setSellerAnswerText('');
                            }}
                            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submittingAnswer || !sellerAnswerText.trim()}
                            onClick={() => handlePostSellerAnswer(q.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                          >
                            {submittingAnswer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Publish Answer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuestionId(q.id);
                          setSellerAnswerText('');
                        }}
                        className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                      >
                        + Post Official Seller Answer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
