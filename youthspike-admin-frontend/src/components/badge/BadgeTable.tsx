import { IBadge } from '@/types'
import { useState } from 'react'

interface IBadgeTableProps {
    badges: IBadge[]
}

const EmptyState = ({ className = '' }: { className?: string }) => (
    <div className={`relative flex flex-col items-center justify-center gap-4 py-16 overflow-hidden ${className}`}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-yellow-400/5 animate-pulse" />
        
        {/* Decorative circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-yellow-400/10 animate-ping" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-yellow-400/5" />
        
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-yellow-400/30 bg-black/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-400/10 to-transparent" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-yellow-400/80">
                <circle cx="12" cy="8" r="5" />
                <path d="M8.5 12.5 6 21l6-3 6 3-2.5-8.5" />
            </svg>
        </div>
        
        <div className="relative text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-yellow-400/70 mb-1">No badges found</p>
          <p className="text-xs text-gray-600">Earn badges by completing challenges</p>
        </div>
    </div>
)

const BadgeCard = ({ badge, index }: { badge: IBadge; index: number }) => {
    const [isHovered, setIsHovered] = useState(false)
    
    return (
        <div
            className="group relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.5s ease-out forwards',
                opacity: 0
            }}
        >
            {/* Card container with glass morphism effect */}
            <div className="relative flex items-center gap-2 p-2">
                
                {/* Icon with gradient ring */}
                <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300" />
                    <img 
                        className="relative h-14 w-14 object-cover transition-all duration-300 group-hover:scale-105" 
                        src={badge.icon} 
                        alt={badge.name}
                        loading="lazy"
                    />
                </div>
                
                {/* Badge information */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-yellow-400 transition-colors duration-300">
                            {badge.name}
                        </h4>
                        <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-yellow-400/80 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                            {badge.badgeFor}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2 group-hover:text-gray-300 transition-colors duration-300">
                        {badge.description}
                    </p>
                </div>
                
                {/* Arrow indicator */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400/0 via-yellow-400/5 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
            {/* Add keyframe animations */}
            <style jsx>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
            
            <div className="flex flex-col gap-3">
                {badges.map((badge, index) => (
                    <BadgeCard key={badge._id} badge={badge} index={index} />
                ))}
            </div>
            
        </div>
    )
}

export default BadgeTable