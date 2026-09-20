import React from 'react';

interface VastraLogoMarkProps {
  size?: number | string;
  className?: string;
  withContainer?: boolean;
  containerClassName?: string;
  idPrefix?: string;
}

/**
 * Pure abstract brand mark for VastraAI:
 * An elegant, modern fashion-tech symbol inspired by flowing fabric drapes,
 * tailored pleat folds, and a minimalist letter 'V'.
 * Features primary modern blue (#4A6CF7) with an exquisite couture pink accent (#E98BAF).
 */
export const VastraLogoMark: React.FC<VastraLogoMarkProps> = ({
  size = 32,
  className = '',
  withContainer = false,
  containerClassName = '',
  idPrefix = 'vlm',
}) => {
  const blue1Id = `${idPrefix}-blue-1`;
  const blue2Id = `${idPrefix}-blue-2`;
  const pinkId = `${idPrefix}-pink`;

  const svgContent = (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 ${className}`}
      aria-label="VastraAI Brand Mark"
    >
      <defs>
        {/* Left flowing drape - modern blue with subtle depth */}
        <linearGradient id={blue1Id} x1="8" y1="7" x2="20" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4A6CF7" />
          <stop offset="100%" stopColor="#2D4BC5" />
        </linearGradient>

        {/* Right ascending drape - luminous soft azure blue */}
        <linearGradient id={blue2Id} x1="18" y1="30" x2="30" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3E60EC" />
          <stop offset="100%" stopColor="#6C8DFD" />
        </linearGradient>

        {/* Couture pink accent fold - refined silk lining */}
        <linearGradient id={pinkId} x1="22" y1="6" x2="30" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8A8C7" />
          <stop offset="100%" stopColor="#E98BAF" />
        </linearGradient>
      </defs>

      {/* Main Fabric Drape (Left Wing - sweeps gracefully down into the V apex) */}
      <path
        d="M 8.5 7.2 L 12.8 7.2 C 13.6 7.2 14.3 7.8 14.5 8.5 C 16 15.8 19 23 22.8 28.5 L 20.8 31.8 C 20.4 32.4 19.6 32.4 19.2 31.8 C 14 24.5 9.5 15.5 8.2 7.9 C 8.1 7.5 8.3 7.2 8.5 7.2 Z"
        fill={`url(#${blue1Id})`}
      />

      {/* Interlocking Ascending Drape (Right Wing - folds upward with negative space pleat) */}
      <path
        d="M 18.2 24.5 L 19.8 27.5 L 28.5 13 C 29 12.1 28.8 11 28 10.4 L 26.2 9.1 C 25.5 8.6 24.5 8.8 24 9.6 L 18.2 19.5 L 18.2 24.5 Z"
        fill={`url(#${blue2Id})`}
      />

      {/* Couture Silk Accent Fold (Top-right lining accent) */}
      <path
        d="M 27.5 8.5 C 26.2 7.4 24.2 7.7 23.2 9 L 20.5 12.5 C 21.3 13.1 22.3 13.3 23.2 12.8 L 27.2 9.5 C 27.6 9.1 27.7 8.7 27.5 8.5 Z"
        fill={`url(#${pinkId})`}
      />
    </svg>
  );

  if (withContainer) {
    return (
      <div
        className={`rounded-xl bg-[#FAFBFF] border border-[#D6E2FF] shadow-2xs flex items-center justify-center p-1.5 transition-all ${containerClassName}`}
      >
        {svgContent}
      </div>
    );
  }

  return svgContent;
};

interface VastraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  tagline?: string;
  taglineClassName?: string;
  className?: string;
  onClick?: () => void;
  withContainer?: boolean;
}

/**
 * Complete VastraAI Brand Logo component with wordmark.
 * - "Vastra" is visually dominant in bold slate (#20243A)
 * - "AI" is subtly emphasized in modern brand blue (#4A6CF7)
 * - Pairings adhere strictly to the clean, fashion-tech aesthetic
 */
export const VastraLogo: React.FC<VastraLogoProps> = ({
  size = 'sm',
  showTagline = false,
  tagline = 'Your Personal AI Fashion Stylist',
  taglineClassName = '',
  className = '',
  onClick,
  withContainer = true,
}) => {
  const markSizeMap = {
    sm: 26,
    md: 32,
    lg: 44,
  };

  const containerSizeMap = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl sm:text-4xl',
  };

  const taglineSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      <VastraLogoMark
        size={markSizeMap[size]}
        withContainer={withContainer}
        containerClassName={`${containerSizeMap[size]} ${onClick ? 'group-hover:border-[#4A6CF7]/50 group-hover:shadow-xs' : ''}`}
        idPrefix={`vlogo-${size}`}
      />

      <div className="flex flex-col justify-center">
        <div className={`font-display leading-tight tracking-tight flex items-baseline ${textSizes[size]}`}>
          <span className="font-extrabold text-[#20243A] tracking-[-0.03em]">Vastra</span>
          <span className="font-bold text-[#4A6CF7] tracking-[-0.01em] ml-[1.5px]">AI</span>
        </div>

        {showTagline && (
          <span
            className={`${taglineSizes[size]} text-[#5E6482] tracking-wider font-semibold uppercase block mt-0.5 leading-none ${taglineClassName}`}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
