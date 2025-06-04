// components/KeepPlayerCard.tsx
import { AdvancedImage } from '@cloudinary/react';
import Image from 'next/image';
import React from 'react';
import TextImg from '@/components/elements/TextImg';
import cld from '@/config/cloudinary.config';
import { IPlayer } from '@/types';

interface KeepPlayerCardProps {
  player?: IPlayer;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const KeepPlayerCard: React.FC<KeepPlayerCardProps> = ({ player, size = 'md', onClick, className = '' }) => {
  const sizes = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-xl ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {player ? (
        player.profile ? (
          <AdvancedImage cldImg={cld.image(player.profile)} className="w-full h-full rounded-xl" />
        ) : (
          <TextImg 
            className="w-full h-full rounded-xl" 
            fText={player.firstName} 
            lText={player.lastName} 
          />
        )
      ) : (
        <Image 
          src="/icons/plus.svg" 
          width={size === 'sm' ? 30 : 50} 
          height={size === 'sm' ? 30 : 50} 
          className="invert" 
          alt="Add player" 
        />
      )}
    </div>
  );
};

export default KeepPlayerCard;