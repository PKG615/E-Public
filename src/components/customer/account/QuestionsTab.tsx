import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  MessageSquare 
} from 'lucide-react';
import { CustomerQuestionItem } from '../../../types';
import { accountService } from '../../../services/api';

export const QuestionsTab: React.FC = () => {
  const [questions, setQuestions] = useState<CustomerQuestionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await accountService.getQuestions();
      if (res.data) {
        setQuestions(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await accountService.deleteQuestion(questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-neutral-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">My Product Questions & Answers</h2>
            <p className="text-xs text-neutral-500">
              Review inquiries you have posted on catalog products and answers from official sellers
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 bg-neutral-100 rounded-lg text-neutral-700">
          {total} {total === 1 ? 'Question' : 'Questions'}
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-500">Loading your questions...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
          <HelpCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-neutral-800">No product questions yet</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            When browsing products, you can ask questions regarding compatibility, features, or warranty. Answers will appear here!
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <span>Explore Products</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map(q => {
            const dateStr = new Date(q.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div 
                key={q.id}
                className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4 hover:border-neutral-300 transition-colors"
              >
                {/* Product Header */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    {q.product_image ? (
                      <img 
                        src={q.product_image} 
                        alt={q.product_name} 
                        className="w-12 h-12 rounded-lg object-cover border border-neutral-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <Link 
                        to={`/products/${q.product_slug}`}
                        className="font-bold text-sm text-neutral-900 hover:text-emerald-600 transition-colors flex items-center gap-1"
                      >
                        <span>{q.product_name}</span>
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Asked on {dateStr}
                        </span>
                        <span>•</span>
                        <span className={`font-semibold capitalize ${
                          q.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {q.status === 'approved' ? 'Published' : 'Pending Moderation'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(q.id)}
                    title="Delete Question"
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Question */}
                <div className="text-xs bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="font-bold text-neutral-900 block mb-1">Your Question:</span>
                  <p className="text-neutral-700 leading-relaxed">{q.question}</p>
                </div>

                {/* Answers */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Answers ({q.answers.length})</span>
                  </h4>

                  {q.answers.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">
                      Awaiting response from verified sellers or community members.
                    </p>
                  ) : (
                    q.answers.map(ans => (
                      <div key={ans.id} className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 font-bold text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            {ans.is_seller_answer ? 'Verified Seller' : 'Nexus Community'}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(ans.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-neutral-700 leading-relaxed pt-0.5">
                          {ans.answer}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
