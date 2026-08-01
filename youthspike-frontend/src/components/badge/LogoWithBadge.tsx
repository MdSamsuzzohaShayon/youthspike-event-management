import React from 'react';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
import { IBadge } from '@/types';
import BadgeIcon from './BadgeIcon';

interface LogoWithBadgeProps {
    logo?: string | null;
    teamName: string;
    badge?: IBadge | null;

    /**
     * Tailwind size classes
     * Example:
     * w-12 h-12
     * w-14 h-14
     * w-20 h-20
     */
    size?: string;

    /**
     * Badge size
     */
    badgeSize?: string;
}

export default function LogoWithBadge({
    logo,
    teamName,
    badge,
    size = 'w-14 h-14',
    badgeSize = 'w-6 h-6',
}: LogoWithBadgeProps) {
    return (
        <div
            className={`
        relative
        inline-flex
        shrink-0
        group
      `}
        >

            {/* Yellow glow */}
            <div
                className={`
          absolute
          inset-0
          rounded-2xl
          blur-md
          opacity-0
          group-hover:opacity-100
          transition-all
          duration-300
        `}
            />

            {/* Logo */}
            <div
                className={`
          relative
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          shadow-lg
          transition-all
          duration-300
          group-hover:scale-105
          group-hover:shadow-yellow-400/20
          ${size}
        `}
            >
                {logo ? (
                    <CldImage
                        src={logo}
                        alt={teamName}
                        width={200}
                        height={200}
                        crop="fit"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <TextImg
                        fullText={teamName}
                        className="w-full h-full"
                    />
                )}
            </div>

            {/* Badge */}
            {badge && (
                <div
                    className={`
            absolute
            -bottom-1
            -right-1
            rounded-full
            bg-gradient-to-br
            from-yellow-300
            via-yellow-400
            to-yellow-600
            p-[2px]
            shadow-lg
            shadow-yellow-500/40
            transition-all
            duration-300
            group-hover:scale-110
          `}
                >
                    <div
                        className={`
              rounded-full
              bg-black
              overflow-hidden
              border
              border-white/80
              ${badgeSize}
            `}
                    >
                        <BadgeIcon badge={badge} className="w-full h-full object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
}