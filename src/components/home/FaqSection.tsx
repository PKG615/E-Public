import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title?: string;
  subtitle?: string;
  faqs: FaqItem[];
}

export const FaqSection: React.FC<FaqSectionProps> = ({
  title,
  subtitle,
  faqs
}) => {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id || null);

  if (!faqs || faqs.length === 0) return null;

  const toggleOpen = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-neutral-500" />
          <span>Catalog & Logistics Clarity</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
          {title || 'Frequently Asked Questions'}
        </h2>
        {subtitle && <p className="text-xs sm:text-sm text-neutral-500 mt-1">{subtitle}</p>}
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs transition-all"
            >
              <button
                onClick={() => toggleOpen(faq.id)}
                className="w-full text-left p-4 flex items-center justify-between gap-4 font-semibold text-sm text-neutral-900 hover:bg-neutral-50 transition-colors"
                aria-expanded={isOpen}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed border-t border-neutral-100 bg-neutral-50/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
