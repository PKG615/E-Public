import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

interface NewsletterSectionProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  disclaimer?: string;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  title,
  subtitle,
  placeholder = 'Enter corporate email address...',
  buttonText = 'Subscribe to Briefs',
  disclaimer = 'Unsubscribe at any time. We strictly safeguard enterprise contact details.'
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid corporate email address.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.home.subscribeNewsletter(email);
      if (res.success) {
        setSuccessMsg(res.data?.message || 'Successfully subscribed to catalog briefs!');
        setEmail('');
      } else {
        setErrorMsg(res.message || 'Subscription could not be processed.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Subscription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 border border-neutral-800 rounded-2xl p-8 sm:p-12 text-white shadow-xl">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-semibold">
            <Mail className="w-3.5 h-3.5" />
            <span>Corporate Hardware Drops</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {title || 'Subscribe for Exclusive Technical Briefs'}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto">
            {subtitle || 'Receive advance notice of restocks, enterprise quantity tiers, and firmware notifications.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={placeholder}
              className="flex-1 bg-neutral-800/90 border border-neutral-700 text-white placeholder-neutral-500 text-xs sm:text-sm rounded-lg px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shrink-0 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                <>
                  <span>{buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {successMsg && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-[11px] text-neutral-400 pt-2">{disclaimer}</p>
        </div>
      </div>
    </section>
  );
};
