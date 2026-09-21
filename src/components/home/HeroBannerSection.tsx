import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '../../types';

interface HeroBannerSectionProps {
  title?: string;
  subtitle?: string;
  banners: Banner[];
}

export const HeroBannerSection: React.FC<HeroBannerSectionProps> = ({
  title,
  subtitle,
  banners
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(0);

  // Auto-rotate hero banners every 6 seconds if multiple
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) {
    return (
      <section className="relative bg-neutral-950 text-white py-16 px-4 text-center rounded-2xl mx-4 sm:mx-8">
        <h1 className="text-3xl font-extrabold">{title || 'Enterprise Hardware Catalog'}</h1>
        <p className="text-neutral-400 mt-2 text-sm max-w-md mx-auto">
          {subtitle || 'Authorized components with real-time warehouse inventory availability.'}
        </p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 mt-6 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-5 py-2.5 rounded-lg text-xs"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    );
  }

  const currentBanner = banners[activeIdx];

  return (
    <section className="relative bg-neutral-950 text-white overflow-hidden rounded-2xl mx-4 sm:mx-8 shadow-xl border border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-20 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* Left Text Block */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{currentBanner.subtitle || title || 'Flagship Hardware Series'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {currentBanner.title}
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 max-w-lg leading-relaxed">
            {currentBanner.description || subtitle || 'Engineered for seamless productivity, refined ergonomics, and enterprise-grade performance.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to={currentBanner.cta_url || currentBanner.link_url || '/shop'}
              className="bg-white hover:bg-neutral-100 text-neutral-950 px-6 py-3 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <span>{currentBanner.cta_label || 'Explore Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/shop"
              className="bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 px-5 py-3 rounded-lg font-semibold text-xs sm:text-sm transition-colors"
            >
              View Full Catalog
            </Link>
          </div>

          {/* Dots Indicator */}
          {banners.length > 1 && (
            <div className="flex items-center gap-2 pt-4">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeIdx === idx ? 'w-8 bg-emerald-400' : 'w-2 bg-neutral-700 hover:bg-neutral-600'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Image Showcase */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md aspect-4/3 rounded-xl overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900 group">
            <picture>
              {currentBanner.mobile_image_url && (
                <source media="(max-width: 640px)" srcSet={currentBanner.mobile_image_url} />
              )}
              <img
                src={currentBanner.image_url}
                alt={currentBanner.alt_text || currentBanner.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </picture>

            {/* Subtle Controls */}
            {banners.length > 1 && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/50 backdrop-blur-xs p-1 rounded-lg">
                <button
                  onClick={() => setActiveIdx((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="p-1 text-white hover:text-emerald-400"
                  aria-label="Previous Banner"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono px-1">
                  {activeIdx + 1}/{banners.length}
                </span>
                <button
                  onClick={() => setActiveIdx((prev) => (prev + 1) % banners.length)}
                  className="p-1 text-white hover:text-emerald-400"
                  aria-label="Next Banner"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
