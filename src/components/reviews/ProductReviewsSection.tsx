import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  ThumbsUp, 
  CheckCircle, 
  ShieldCheck, 
  Filter, 
  MessageSquare, 
  HelpCircle, 
  Camera, 
  Sparkles, 
  X, 
  ChevronDown, 
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Product, Review, ReviewAggregate, ReviewEligibility, ProductQuestion } from '../../types';
import { reviewService, qaService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { RatingStars } from './RatingStars';
import { WriteReviewModal } from './WriteReviewModal';
import { AskQuestionModal } from './AskQuestionModal';

interface ProductReviewsSectionProps {
  product: Product;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ product }) => {
  const { user } = useAuth();

  // Active Tab: Reviews or Q&A
  const [activeTab, setActiveTab] = useState<'reviews' | 'qa'>('reviews');

  // Review state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);
  const [reviewPage, setReviewPage] = useState<number>(1);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(false);

  // Filters & Sorting
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | undefined>(undefined);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful'>('newest');

  // Modals
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState<boolean>(false);
  const [isAskQuestionOpen, setIsAskQuestionOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Q&A state
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loadingQA, setLoadingQA] = useState<boolean>(false);
  const [qaPage, setQaPage] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<number | null>(null);
  const [answerDraft, setAnswerDraft] = useState<string>('');
  const [submittingAnswer, setSubmittingAnswer] = useState<boolean>(false);
  const [answerSuccessId, setAnswerSuccessId] = useState<number | null>(null);

  // Voting feedback
  const [votingReviewId, setVotingReviewId] = useState<number | null>(null);

  // Load Review Aggregate & Eligibility
  const loadAggregateAndEligibility = useCallback(async () => {
    try {
      const [aggRes, eligRes] = await Promise.all([
        reviewService.getAggregate(product.id || product.slug),
        user ? reviewService.getEligibility(product.id || product.slug) : Promise.resolve({ success: true, data: null }),
      ]);

      if (aggRes.success && aggRes.data) {
        setAggregate(aggRes.data);
      }
      if (eligRes.success && eligRes.data) {
        setEligibility(eligRes.data);
      }
    } catch (err) {
      console.error('Failed to load review aggregate/eligibility:', err);
    }
  }, [product.id, product.slug, user]);

  // Load Reviews List
  const loadReviews = useCallback(async (pageToLoad: number, append = false) => {
    try {
      setLoadingReviews(true);
      const res = await reviewService.getByProduct(product.id || product.slug, {
        page: pageToLoad,
        limit: 10,
        sort: sortOption,
        rating: selectedRatingFilter,
        verified_only: verifiedOnly,
      });

      if (res.success && res.data) {
        if (append) {
          setReviews((prev) => [...prev, ...res.data.items]);
        } else {
          setReviews(res.data.items);
        }
        setTotalReviews(res.data.total);
        setHasMoreReviews(pageToLoad * 10 < res.data.total);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, [product.id, product.slug, sortOption, selectedRatingFilter, verifiedOnly]);

  // Load Questions List
  const loadQuestions = useCallback(async (pageToLoad: number) => {
    try {
      setLoadingQA(true);
      const res = await qaService.getByProduct(product.id || product.slug, {
        page: pageToLoad,
        limit: 10,
      });
      if (res.success && res.data) {
        setQuestions(res.data.items);
        setTotalQuestions(res.data.total);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoadingQA(false);
    }
  }, [product.id, product.slug]);

  useEffect(() => {
    loadAggregateAndEligibility();
  }, [loadAggregateAndEligibility]);

  useEffect(() => {
    setReviewPage(1);
    loadReviews(1, false);
  }, [loadReviews]);

  useEffect(() => {
    if (activeTab === 'qa') {
      loadQuestions(1);
    }
  }, [activeTab, loadQuestions]);

  const handleHelpfulVote = async (reviewId: number) => {
    if (!user) {
      alert('Please log in to vote on reviews');
      return;
    }

    try {
      setVotingReviewId(reviewId);
      const res = await reviewService.voteHelpful(reviewId);
      if (res.success && res.data) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  helpful_count: res.data.helpful_count,
                  user_has_voted_helpful: res.data.voted,
                }
              : r
          )
        );
      }
    } catch (err: any) {
      console.error('Failed to toggle helpful vote:', err);
    } finally {
      setVotingReviewId(null);
    }
  };

  const handleSubmitAnswer = async (questionId: number) => {
    if (!user) {
      alert('Please log in to answer questions');
      return;
    }
    if (answerDraft.trim().length < 5) {
      alert('Answer must be at least 5 characters long');
      return;
    }

    try {
      setSubmittingAnswer(true);
      const res = await qaService.answerQuestion(questionId, {
        answer: answerDraft.trim(),
      });
      if (res.success) {
        setAnswerDraft('');
        setAnsweringQuestionId(null);
        setAnswerSuccessId(questionId);
        loadQuestions(1);
        setTimeout(() => setAnswerSuccessId(null), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleReviewSubmitted = () => {
    loadAggregateAndEligibility();
    loadReviews(1, false);
  };

  const handleQuestionSubmitted = () => {
    loadQuestions(1);
  };

  const avgRating = aggregate?.average_rating || 0.0;
  const reviewCount = aggregate?.review_count || 0;
  const ratingDist = aggregate?.rating_distribution || { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

  return (
    <div id="product-reviews-section" className="mt-16 border-t border-stone-200 pt-12">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900">
            Customer Feedback & Discussion
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            Real experiences from verified buyers and community Q&A.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 rounded-2xl bg-stone-100 p-1">
          <button
            id="tab-reviews-btn"
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'reviews'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Reviews ({reviewCount})
          </button>
          <button
            id="tab-qa-btn"
            type="button"
            onClick={() => setActiveTab('qa')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'qa'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-stone-500" />
            Questions & Answers ({totalQuestions})
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: RATINGS & REVIEWS */}
      {/* ========================================================= */}
      {activeTab === 'reviews' && (
        <div className="space-y-8">
          {/* Rating Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 rounded-3xl border border-stone-200 bg-stone-50/50 p-6 md:p-8">
            {/* Left: Overall Big Rating */}
            <div className="md:col-span-4 flex flex-col justify-center items-center md:items-start md:border-r border-stone-200 md:pr-8 text-center md:text-left">
              <div className="text-5xl font-black tracking-tight text-stone-900">
                {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
              </div>
              <div className="mt-2">
                <RatingStars rating={avgRating} size="lg" />
              </div>
              <p className="mt-2 text-xs font-medium text-stone-500">
                Based on {reviewCount} customer {reviewCount === 1 ? 'rating' : 'ratings'}
              </p>

              {/* Verified Count Pill */}
              {aggregate && aggregate.verified_purchases_count > 0 && (
                <div className="mt-4 flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{aggregate.verified_purchases_count} Verified Purchases</span>
                </div>
              )}

              {/* Write Review Trigger Button */}
              <div className="mt-6 w-full">
                <button
                  id="open-write-review-btn"
                  type="button"
                  onClick={() => {
                    if (!user) {
                      alert('Please sign in to share your product experience');
                      return;
                    }
                    setIsWriteReviewOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Write a Review
                </button>
              </div>
            </div>

            {/* Right: 5-Star Distribution Bars */}
            <div className="md:col-span-8 flex flex-col justify-center space-y-2.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = ratingDist[String(stars) as keyof typeof ratingDist] || 0;
                const percentage = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
                const isSelected = selectedRatingFilter === stars;

                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => {
                      setSelectedRatingFilter(isSelected ? undefined : stars);
                    }}
                    className={`flex items-center gap-3 w-full rounded-xl p-1.5 transition-colors text-left group ${
                      isSelected ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-1 w-14 shrink-0 text-xs font-semibold text-stone-700">
                      <span>{stars}</span>
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </div>

                    {/* Progress Bar Container */}
                    <div className="relative flex-1 h-2.5 rounded-full bg-stone-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all duration-500 group-hover:bg-amber-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="w-12 text-right shrink-0 text-xs text-stone-500 font-medium">
                      {percentage}%
                    </div>
                    <div className="w-10 text-right shrink-0 text-xs text-stone-400">
                      ({count})
                    </div>
                  </button>
                );
              })}

              {selectedRatingFilter && (
                <div className="pt-2 flex items-center justify-between text-xs text-amber-700">
                  <span>Filtered by {selectedRatingFilter}-star reviews</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRatingFilter(undefined)}
                    className="font-semibold underline hover:text-stone-900"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filtering and Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Verified Filter Toggle */}
              <button
                id="toggle-verified-reviews-btn"
                type="button"
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-all ${
                  verifiedOnly
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                <CheckCircle className={`w-3.5 h-3.5 ${verifiedOnly ? 'text-emerald-600' : 'text-stone-400'}`} />
                Verified Purchases Only
              </button>

              {/* Star Rating Quick Filter Dropdown */}
              <select
                id="rating-filter-select"
                value={selectedRatingFilter || ''}
                onChange={(e) => setSelectedRatingFilter(e.target.value ? Number(e.target.value) : undefined)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 focus:outline-none focus:border-stone-400"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars only</option>
                <option value="4">4 Stars only</option>
                <option value="3">3 Stars only</option>
                <option value="2">2 Stars only</option>
                <option value="1">1 Star only</option>
              </select>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Sort by:</span>
              <select
                id="sort-reviews-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-none focus:border-stone-400"
              >
                <option value="newest">Most Recent</option>
                <option value="most_helpful">Most Helpful</option>
                <option value="highest_rating">Highest Rating</option>
                <option value="lowest_rating">Lowest Rating</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          {loadingReviews && reviews.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" />
              <p className="mt-2 text-xs text-stone-500">Loading customer reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center rounded-3xl border border-dashed border-stone-200 bg-stone-50/50 p-8">
              <MessageSquare className="w-10 h-10 mx-auto text-stone-300" />
              <h3 className="mt-3 text-sm font-bold text-stone-800">No reviews found</h3>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                {selectedRatingFilter || verifiedOnly
                  ? 'No reviews match your current filters. Try changing or clearing filters.'
                  : 'Be the first to share your thoughts on this product!'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    alert('Please sign in to write a review');
                    return;
                  }
                  setIsWriteReviewOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800"
              >
                Write the First Review
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  id={`review-item-${rev.id}`}
                  className="rounded-2xl border border-stone-200 bg-white p-5 md:p-6 shadow-2xs transition-all hover:border-stone-300"
                >
                  {/* Top Row: User details & rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-700">
                        {rev.user_name ? rev.user_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-900">{rev.user_name}</span>
                          {rev.is_verified_purchase && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-700 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              VERIFIED PURCHASE
                            </span>
                          )}
                        </div>
                        {rev.variant_title && (
                          <span className="text-[11px] text-stone-400 block">
                            Variant: {rev.variant_title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <RatingStars rating={rev.rating} size="sm" />
                      <span className="text-[11px] text-stone-400">
                        {new Date(rev.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mt-3">
                    {rev.title && (
                      <h4 className="text-sm font-bold text-stone-900 mb-1.5">{rev.title}</h4>
                    )}
                    <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-line">
                      {rev.body}
                    </p>
                  </div>

                  {/* Review Photos Gallery */}
                  {rev.images && rev.images.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-2.5">
                      {rev.images.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setPreviewImageUrl(img.image_url)}
                          className="h-16 w-16 rounded-xl border border-stone-200 overflow-hidden bg-stone-50 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-stone-400"
                        >
                          <img
                            src={img.image_url}
                            alt={img.alt_text || 'Review photo'}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Helpful Vote Action */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      id={`helpful-btn-${rev.id}`}
                      type="button"
                      disabled={votingReviewId === rev.id}
                      onClick={() => handleHelpfulVote(rev.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        rev.user_has_voted_helpful
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-300'
                          : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${rev.user_has_voted_helpful ? 'fill-amber-500 text-amber-500' : ''}`} />
                      <span>Helpful ({rev.helpful_count})</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMoreReviews && (
                <div className="text-center pt-4">
                  <button
                    id="load-more-reviews-btn"
                    type="button"
                    onClick={() => {
                      const nextPage = reviewPage + 1;
                      setReviewPage(nextPage);
                      loadReviews(nextPage, true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Load More Reviews
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PRODUCT QUESTIONS & ANSWERS */}
      {/* ========================================================= */}
      {activeTab === 'qa' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-stone-200 bg-stone-50/50 p-6">
            <div>
              <h3 className="text-base font-bold text-stone-900">Have a question about this product?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Get answers from the store team and customers who own this product.
              </p>
            </div>
            <button
              id="open-ask-question-btn"
              type="button"
              onClick={() => {
                if (!user) {
                  alert('Please sign in to ask a question');
                  return;
                }
                setIsAskQuestionOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 shrink-0"
            >
              <HelpCircle className="w-4 h-4 text-amber-300" />
              Ask a Question
            </button>
          </div>

          {loadingQA ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" />
              <p className="mt-2 text-xs text-stone-500">Loading community Q&A...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-12 text-center rounded-3xl border border-dashed border-stone-200 bg-stone-50/50 p-8">
              <HelpCircle className="w-10 h-10 mx-auto text-stone-300" />
              <h4 className="mt-3 text-sm font-bold text-stone-800">No questions yet</h4>
              <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
                Got questions about compatibility, specs, or box contents? Ask now!
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    alert('Please sign in to ask a question');
                    return;
                  }
                  setIsAskQuestionOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800"
              >
                Post First Question
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  id={`question-card-${q.id}`}
                  className="rounded-2xl border border-stone-200 bg-white p-5 md:p-6 shadow-2xs space-y-3"
                >
                  {/* Question */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white shrink-0">
                      Q
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-stone-900 leading-snug">{q.question}</p>
                      <span className="text-[11px] text-stone-400 mt-1 block">
                        Asked by {q.user_name} • {new Date(q.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Answers */}
                  <div className="pl-9 space-y-3 pt-2">
                    {q.answers && q.answers.length > 0 ? (
                      q.answers.map((ans) => (
                        <div
                          key={ans.id}
                          className="rounded-xl border border-stone-100 bg-stone-50/80 p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shrink-0">
                              A
                            </span>
                            <span className="text-xs font-bold text-stone-800">{ans.user_name}</span>
                            {ans.is_seller_answer && (
                              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                STORE TEAM
                              </span>
                            )}
                            <span className="text-[11px] text-stone-400 ml-auto">
                              {new Date(ans.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-stone-700 pl-7">{ans.answer}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-stone-400">
                        No answers yet. Be the first to answer!
                      </p>
                    )}

                    {/* Inline Reply / Answer Box */}
                    {answeringQuestionId === q.id ? (
                      <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2">
                        <textarea
                          rows={2}
                          value={answerDraft}
                          onChange={(e) => setAnswerDraft(e.target.value)}
                          placeholder="Type your answer here..."
                          className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAnsweringQuestionId(null);
                              setAnswerDraft('');
                            }}
                            className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={submittingAnswer || !answerDraft.trim()}
                            onClick={() => handleSubmitAnswer(q.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                          >
                            {submittingAnswer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Submit Answer
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            alert('Please sign in to answer');
                            return;
                          }
                          setAnsweringQuestionId(q.id);
                        }}
                        className="text-xs font-semibold text-stone-600 hover:text-stone-900 hover:underline"
                      >
                        + Answer this question
                      </button>
                    )}

                    {answerSuccessId === q.id && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Your answer has been submitted!
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        product={product}
        eligibility={eligibility}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Ask Question Modal */}
      <AskQuestionModal
        isOpen={isAskQuestionOpen}
        onClose={() => setIsAskQuestionOpen(false)}
        product={product}
        onQuestionSubmitted={handleQuestionSubmitted}
      />

      {/* Photo Preview Lightbox */}
      {previewImageUrl && (
        <div
          id="photo-lightbox-backdrop"
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-xs cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden bg-stone-900 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 rounded-full bg-stone-800/80 p-2 text-white hover:bg-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageUrl}
              alt="Enlarged review photo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
