import { IBadge } from '@/types'
import { CldImage } from 'next-cloudinary'
import React from 'react'
import BadgeIcon from './BadgeIcon'

interface IBadgeTableProps {
    badges: IBadge[]
}

const EmptyState = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-1.5 py-6 ${className}`}>
        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/15 text-yellow-400/60">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="5" />
                <path d="M8.5 12.5 6 21l6-3 6 3-2.5-8.5" />
            </svg>
        </div>
        <p className="font-mono text-[7px] uppercase tracking-[0.1em] text-gray-600">No badges found</p>
    </div>
)

const BadgeSeal = ({
    badge,
    rank,
}: {
    badge: IBadge
    rank?: number
}) => {
    const dims = 24

    return (
        <div
            className="group/seal relative shrink-0 rounded-full"
            style={{ width: dims, height: dims }}
        >
            {/* rotating dashed ring, dormant until hover */}
            <span className="absolute inset-0 rounded-full border border-dashed border-yellow-400/0 transition-all duration-500 group-hover/seal:border-yellow-400/50 group-hover/seal:[animation:spin_6s_linear_infinite] motion-reduce:group-hover/seal:animate-none" />
            {/* static outer ring */}
            <span className="absolute inset-[1px] rounded-full border border-white/10 bg-black/40" />
            <div className="absolute inset-[1px] flex items-center justify-center overflow-hidden rounded-full bg-gray-900 ring-1 ring-inset ring-white/5">
                <BadgeIcon badge={badge} className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/seal:scale-110" />
            </div>
            {/* glow */}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-yellow-400/0 blur-[2px] transition-colors duration-500 group-hover/seal:bg-yellow-400/20" />
            
            {/* Rank indicator */}
            {rank !== undefined && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-yellow-400 text-[6px] font-bold text-black">
                    {rank}
                </span>
            )}
        </div>
    )
}

const BadgeCard = ({ badge, index }: { badge: IBadge; index: number }) => {
    const isTopThree = index < 3
    
    return (
        <div className="group relative flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-gray-900/80 p-1 transition-all duration-300 hover:border-yellow-400/30 hover:bg-gray-900 hover:shadow-sm hover:shadow-yellow-400/5">
            {/* Left accent bar for top 3 */}
            {isTopThree && (
                <div className={`absolute left-0 top-0 h-full w-0.5 rounded-l-md ${
                    index === 0 ? 'bg-yellow-400' : 
                    index === 1 ? 'bg-yellow-400/60' : 
                    'bg-yellow-400/30'
                }`} />
            )}
            
            {/* Rank number */}
            <div className="flex w-3.5 shrink-0 flex-col items-center">
                <span className={`font-mono text-[8px] font-bold leading-none ${
                    index === 0 ? 'text-yellow-400' : 
                    index < 3 ? 'text-yellow-400/70' : 
                    'text-gray-600'
                }`}>
                    {String(index + 1).padStart(2, '0')}
                </span>
                {isTopThree && (
                    <span className="mt-0.5 text-yellow-400/70">
                        <svg width="5" height="5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2-6-4.8-6 4.8L8.8 14l-6-4.8h7.6z" />
                        </svg>
                    </span>
                )}
            </div>
            
            {/* Badge seal */}
            <BadgeSeal badge={badge} rank={index + 1} />
            
            {/* Badge info */}
            <div className="min-w-0 flex-1">
                <div className="truncate text-[9px] font-medium leading-none text-white transition-colors group-hover:text-yellow-400">
                    {badge.name}
                </div>
                <div className="mt-0.5 line-clamdiv-1 text-[7px] leading-none text-gray-400">
                    {badge.description}
                </div>
            </div>
            
            {/* Visual indicator */}
            <div className="flex shrink-0 items-center">
                <svg 
                    className="text-gray-600 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-yellow-400/70" 
                    width="7" 
                    height="7" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                >
                    <path d="M9 18l6-6-6-6" />
                </svg>
            </div>
        </div>
    )
}

const BadgeTable = ({ badges }: IBadgeTableProps) => {
    const hasBadges = badges && badges.length > 0

    if (!hasBadges) {
        return <EmptyState />
    }

    return (
        <div className="badge-table w-full">
            {/* Grid layout - even more items per row due to ultra-compact size */}
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {badges.map((badge, index) => (
                    <BadgeCard key={badge._id} badge={badge} index={index} />
                ))}
            </div>
        </div>
    )
}

export default BadgeTable