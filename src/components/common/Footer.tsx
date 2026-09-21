import React from 'react';
import { ShieldCheck, Truck, RefreshCw, Headphones, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
      {/* Trust Badges Row */}
      <div className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 text-emerald-400 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Free Express Shipping</h4>
                <p className="text-xs text-neutral-400">On all eligible orders over ₹999</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 text-emerald-400 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Hassle-Free Returns</h4>
                <p className="text-xs text-neutral-400">7-day seamless doorstep pickup</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">100% Secure Payments</h4>
                <p className="text-xs text-neutral-400">Encrypted 256-bit SSL checkout</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 text-emerald-400 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">24/7 Priority Support</h4>
                <p className="text-xs text-neutral-400">Dedicated assistance via chat & phone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded bg-white text-neutral-900 flex items-center justify-center font-bold text-base">
                N
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                Apna<span className="text-emerald-500">.</span> COMMERCE
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed mb-4">
             Have a question about an order, product, delivery, or return? Our support team is ready to help.
            </p>
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full-Stack Contract Synchronized</span>
            </div> */}
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Shop Categories</h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><a href="/shop?category=electronics" className="hover:text-white transition-colors">Electronics & Audio</a></li>
              <li><a href="/shop?category=mobiles-tablets" className="hover:text-white transition-colors">Mobiles & Tablets</a></li>
              <li><a href="/shop?category=laptops-computers" className="hover:text-white transition-colors">Laptops & Workstations</a></li>
              <li><a href="/shop?category=fashion" className="hover:text-white transition-colors">Men's & Women's Fashion</a></li>
              <li><a href="/shop?category=home-living" className="hover:text-white transition-colors">Home & Modern Decor</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Customer Service</h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><a href="#" className="hover:text-white transition-colors">Track Order Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping & Delivery Rates</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Returns & Refund Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Warranty Claim Process</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center & FAQs</a></li>
            </ul>
          </div>

          {/* <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">System Blueprint</h5>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><span className="text-neutral-500">Backend:</span> FastAPI 0.110</li>
              <li><span className="text-neutral-500">ORM:</span> SQLAlchemy 2.0</li>
              <li><span className="text-neutral-500">Database:</span> PostgreSQL / Alembic</li>
              <li><span className="text-neutral-500">Auth:</span> JWT Bearer + Refresh</li>
              <li><span className="text-neutral-500">Architecture:</span> Section 19 Locked</li>
            </ul>
          </div> */}

        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© 2026 Apna Commerce Platform. Built strictly following production e-commerce practices.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-neutral-400 cursor-pointer">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
