import React, { useState } from 'react';
import { X, HelpCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Product } from '../../types';
import { qaService } from '../../services/api';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onQuestionSubmitted: () => void;
}

export const AskQuestionModal: React.FC<AskQuestionModalProps> = ({
  isOpen,
  onClose,
  product,
  onQuestionSubmitted,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (question.trim().length < 10) {
      setErrorMessage('Question must be at least 10 characters long');
      return;
    }

    try {
      setSubmitting(true);
      const res = await qaService.askQuestion(product.id || product.slug, {
        question: question.trim(),
        variant_id: selectedVariantId,
      });

      if (res.success) {
        setSuccessMessage('Your question has been posted! Sellers and community members can now answer it.');
        setTimeout(() => {
          onQuestionSubmitted();
          onClose();
        }, 1500);
      } else {
        setErrorMessage(res.message || 'Failed to submit question');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error submitting question';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="ask-question-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-xs">
      <div
        id="ask-question-modal-card"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all"
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">Ask a Question</h2>
              <p className="text-xs text-stone-500">{product.name}</p>
            </div>
          </div>
          <button
            id="close-question-modal-btn"
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 border border-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {product.variants && product.variants.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                Specific Variant (Optional)
              </label>
              <select
                id="question-variant-select"
                value={selectedVariantId || ''}
                onChange={(e) => setSelectedVariantId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-sm text-stone-800 focus:border-stone-400 focus:bg-white focus:outline-none"
              >
                <option value="">About Entire Product</option>
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.sku})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Your Question <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="question-text-input"
              rows={4}
              required
              minLength={10}
              maxLength={500}
              placeholder="e.g. Does this package include the wall charger and USB-C braided cable?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:bg-white focus:outline-none"
            />
            <div className="flex justify-between text-[11px] text-stone-400 mt-1">
              <span>Must be clear and relevant to product specifications</span>
              <span>{question.length} / 500</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
            <button
              id="cancel-question-btn"
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              id="submit-question-btn"
              type="submit"
              disabled={submitting || !!successMessage}
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Submit Question'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
