import React, { useState } from 'react';
import { Brawler } from '../types/game.js';

interface BrawlerAvatarProps {
  brawler: Brawler;
  size?: 'sm' | 'md' | 'lg' | 'cell';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-11 h-11 text-xs',
  lg: 'w-16 h-16 text-sm',
  cell: 'w-full h-full text-sm',
};

/** Official Brawl Stars portrait with a bold display monogram fallback. */
export const BrawlerAvatar: React.FC<BrawlerAvatarProps> = React.memo(({
  brawler,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative flex items-center justify-center select-none shrink-0 ${SIZE_MAP[size]} ${className}`}
    >
      {!imgError ? (
        <img
          src={brawler.imageUrl}
          alt={brawler.name}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain drop-shadow-[0_2px_0_rgba(11,19,43,0.35)]"
        />
      ) : (
        <span className="font-display text-base uppercase tracking-wide text-brawl-navy">
          {brawler.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
});
