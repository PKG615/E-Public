import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showValue?: boolean;
  showCount?: boolean;
  count?: number;
  className?: string;
  id?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
  showCount = false,
  count = 0,
  className = '',
  id,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const currentRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div id={id} className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starNumber = index + 1;
          const isFilled = currentRating >= starNumber;
          const isHalf = !isFilled && currentRating >= starNumber - 0.5;

          return (
            <button
              key={starNumber}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange?.(starNumber)}
              onMouseEnter={() => interactive && setHoverRating(starNumber)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`p-0.5 transition-transform ${
                interactive ? 'cursor-pointer hover:scale-110 focus:outline-none' : 'cursor-default'
              }`}
              aria-label={`${starNumber} of ${maxStars} stars`}
            >
              <Star
                className={`${starSizes[size]} transition-colors ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalf
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-stone-300 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-stone-800">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
        </span>
      )}

      {showCount && (
        <span className="text-xs font-normal text-stone-500">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};
