import React, { useEffect, useState } from 'react';
import { PublicHomepageResponse, PublicHomepageSection } from '../../types';
import { api } from '../../services/api';
import { HeroBannerSection } from '../../components/home/HeroBannerSection';
import { CategoryGridSection } from '../../components/home/CategoryGridSection';
import { ProductGridSection } from '../../components/home/ProductGridSection';
import { PromoBannerSection } from '../../components/home/PromoBannerSection';
import { BrandsSection } from '../../components/home/BrandsSection';
import { CollectionSection } from '../../components/home/CollectionSection';
import { TrustInfoSection } from '../../components/home/TrustInfoSection';
import { FaqSection } from '../../components/home/FaqSection';
import { NewsletterSection } from '../../components/home/NewsletterSection';
import { Loader2, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [data, setData] = useState<PublicHomepageResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomepage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.home.get();
      if (res.success && res.data) {
        setData(res.data);
        // Synchronize SEO title and meta description dynamically
        if (res.data.seo) {
          if (res.data.seo.title) {
            document.title = res.data.seo.title;
          }
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && res.data.seo.meta_description) {
            metaDesc.setAttribute('content', res.data.seo.meta_description);
          }
        }
      } else {
        setError(res.message || 'Unable to retrieve homepage data.');
      }
    } catch (err: any) {
      console.error('Failed to load dynamic customer homepage:', err);
      setError(err.response?.data?.detail || 'Failed to connect to FastAPI backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomepage();
  }, []);

  // 1. Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-12 pb-16 pt-4 animate-pulse">
        {/* Hero Skeleton */}
        <div className="mx-4 sm:mx-8 h-80 sm:h-96 rounded-2xl bg-neutral-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-xs font-mono tracking-wider uppercase">Loading Live Storefront Architecture...</span>
          </div>
        </div>

        {/* Categories Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-6 w-48 bg-neutral-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="h-44 bg-neutral-200 rounded-xl"></div>
            <div className="h-44 bg-neutral-200 rounded-xl"></div>
            <div className="h-44 bg-neutral-200 rounded-xl"></div>
          </div>
        </div>

        {/* Products Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-6 w-56 bg-neutral-200 rounded"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-72 bg-neutral-200 rounded-xl"></div>
            <div className="h-72 bg-neutral-200 rounded-xl"></div>
            <div className="h-72 bg-neutral-200 rounded-xl"></div>
            <div className="h-72 bg-neutral-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error Fallback with Retry
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-20 p-8 bg-white border border-red-200 rounded-2xl shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-neutral-900">Unable to Load Storefront Layout</h2>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {error || 'The homepage configuration could not be retrieved from PostgreSQL.'}
        </p>
        <button
          onClick={fetchHomepage}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // 3. Dynamic Section Dispatcher
  const renderSection = (section: PublicHomepageSection) => {
    const secType = section.section_type.toUpperCase();
    const d = section.data || {};

    switch (secType) {
      case 'HERO_BANNER':
        return (
          <HeroBannerSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            banners={d.banners || []}
          />
        );

      case 'CATEGORY_GRID':
      case 'FEATURED_CATEGORIES':
        return (
          <CategoryGridSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            categories={d.categories || []}
          />
        );

      case 'FEATURED_PRODUCTS':
        return (
          <ProductGridSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            products={d.products || []}
            badgeLabel="Featured"
            viewAllUrl="/shop?featured=true"
          />
        );

      case 'NEW_ARRIVALS':
        return (
          <ProductGridSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            products={d.products || []}
            badgeLabel="New Arrival"
            viewAllUrl="/shop?sort=newest"
          />
        );

      case 'BEST_SELLERS':
        return (
          <ProductGridSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            products={d.products || []}
            badgeLabel="Best Seller"
            viewAllUrl="/shop?sort=rating"
          />
        );

      case 'TRENDING_PRODUCTS':
        return (
          <ProductGridSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            products={d.products || []}
            badgeLabel="Trending"
            viewAllUrl="/shop?trending=true"
          />
        );

      case 'PROMOTIONAL_BANNER':
        return (
          <PromoBannerSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            banners={d.banners || []}
            config={section.configuration}
          />
        );

      case 'OFFER':
        return (
          <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-amber-500 text-neutral-950 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <span className="bg-neutral-950 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {d.offer_badge || 'Limited Time'}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold">{d.offer_title || section.title}</h3>
                <p className="text-xs sm:text-sm font-medium text-neutral-900">{d.discount_text}</p>
              </div>
              <a
                href={d.cta_url || '/shop'}
                className="bg-neutral-950 hover:bg-neutral-900 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors shrink-0"
              >
                {d.cta_label || 'Claim Deal'}
              </a>
            </div>
          </section>
        );

      case 'BRANDS':
        return (
          <BrandsSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            brands={d.brands || []}
          />
        );

      case 'COLLECTION':
        return (
          <CollectionSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            collection={d.collection || null}
          />
        );

      case 'TRUST_INFO':
        return (
          <TrustInfoSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            items={d.items || []}
          />
        );

      case 'FAQ':
        return (
          <FaqSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            faqs={d.faqs || []}
          />
        );

      case 'NEWSLETTER':
        return (
          <NewsletterSection
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            placeholder={d.placeholder}
            buttonText={d.button_text}
            disclaimer={d.disclaimer}
          />
        );

      case 'CUSTOM_CONTENT':
        return (
          <section key={section.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold text-neutral-900 mb-2">{section.title}</h2>
              {section.subtitle && <p className="text-xs text-neutral-500 mb-4">{section.subtitle}</p>}
              <div
                className="prose prose-sm text-neutral-700 max-w-none text-xs leading-relaxed"
                dangerouslySetInnerHTML={{ __html: d.custom_html || section.description || '' }}
              />
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-12 pb-16 pt-4">
      {/* Render all sections in sort_order */}
      {data.sections.map((section) => renderSection(section))}
    </div>
  );
};
