import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag } from 'lucide-react';
import { Banner } from '../../types';

interface PromoBannerSectionProps {
  title?: string;
  subtitle?: string;
  banners?: Banner[];
  config?: Record<string, any>;
}

export const PromoBannerSection: React.FC<PromoBannerSectionProps> = ({
  title,
  subtitle,
  banners = [],
  config = {}
}) => {
  if (!banners || banners.length === 0) return null;

  const banner = banners[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800 shadow-md">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={banner.image_url}
            alt={banner.alt_text || banner.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6 sm:px-10 py-10 sm:py-14 max-w-xl text-white space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Tag className="w-3.5 h-3.5" />
            <span>{banner.subtitle || 'Special Promotional Window'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            {banner.title}
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {banner.description || subtitle || 'Upgrade enterprise infrastructure with manufacturer-backed components and priority fulfillment.'}
          </p>

          <div className="pt-2">
            <Link
              to={banner.cta_url || banner.link_url || '/shop'}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2.5 rounded-lg text-xs sm:text-sm transition-colors shadow-sm"
            >
              <span>{banner.cta_label || 'View Offers'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
