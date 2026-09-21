import React from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Headphones, 
  CreditCard, 
  Lock, 
  Award, 
  CheckCircle2,
  LucideIcon 
} from 'lucide-react';

interface TrustItem {
  id: number;
  icon: string;
  title: string;
  content: string;
  url?: string;
}

interface TrustInfoSectionProps {
  title?: string;
  subtitle?: string;
  items: TrustItem[];
}

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck,
  Truck,
  Headphones,
  CreditCard,
  Lock,
  Award,
  CheckCircle2
};

export const TrustInfoSection: React.FC<TrustInfoSectionProps> = ({
  title,
  subtitle,
  items
}) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 text-white">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-xl font-bold tracking-tight text-white">{title || 'The Enterprise Standard'}</h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => {
            const Icon = iconMap[item.icon] || ShieldCheck;
            return (
              <div
                key={item.id}
                className="bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-4 flex flex-col items-center text-center hover:bg-neutral-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                <p className="text-xs text-neutral-300 leading-relaxed">{item.content}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
