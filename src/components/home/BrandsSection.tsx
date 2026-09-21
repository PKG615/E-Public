import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface BrandItem {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url: string;
  website_url?: string;
}

interface BrandsSectionProps {
  title: string;
  subtitle?: string;
  brands: BrandItem[];
}

export const BrandsSection: React.FC<BrandsSectionProps> = ({
  title,
  subtitle,
  brands
}) => {
  if (!brands || brands.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h2>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Direct Manufacturer Warranties</span>
            </div>
          </div>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        <Link
          to="/shop"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          <span>All brands</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            to={`/shop?brand=${b.slug}`}
            className="group bg-white border border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-neutral-300 transition-all"
          >
            <div className="w-16 h-16 rounded-lg bg-neutral-50 p-2 flex items-center justify-center overflow-hidden mb-2">
              <img
                src={b.logo_url}
                alt={b.name}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
              />
            </div>
            <span className="text-xs font-bold text-neutral-800 group-hover:text-emerald-700 transition-colors">
              {b.name}
            </span>
            <span className="text-[10px] text-neutral-400 mt-0.5">Authorized Partner</span>
          </Link>
        ))}
      </div>
    </section>
  );
};
