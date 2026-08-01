import { IBadge } from '@/types'
import { CldImage } from 'next-cloudinary'
import React from 'react'
import BadgeIcon from './BadgeIcon'

interface IBadgeTableProps {
    badges: IBadge[]
}

const columns = ['Description', 'Icon'] as const

const EmptyState = ({ className = '' }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center gap-3 py-20 ${className}`}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/15 text-yellow-400/60">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="5" />
                <path d="M8.5 12.5 6 21l6-3 6 3-2.5-8.5" />
            </svg>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-600">No badges found</p>
    </div>
)

const BadgeSeal = ({
    badge,
    size = 'md',
}: {
    badge: IBadge
    size?: 'sm' | 'md'
}) => {
    const dims = size === 'md' ? 56 : 44
    const imgDims = size === 'md' ? 32 : 26

    return (
        <div
            className="group/seal relative shrink-0 rounded-full"
            style={{ width: dims, height: dims }}
        >
            {/* rotating dashed ring, dormant until hover */}
            <span className="absolute inset-0 rounded-full border border-dashed border-yellow-400/0 transition-all duration-500 group-hover/seal:border-yellow-400/50 group-hover/seal:[animation:spin_6s_linear_infinite] motion-reduce:group-hover/seal:animate-none" />
            {/* static outer ring */}
            <span className="absolute inset-[3px] rounded-full border border-white/10 bg-black/40" />
            <div className="absolute inset-[3px] flex items-center justify-center overflow-hidden rounded-full bg-gray-900 ring-1 ring-inset ring-white/5">
                {/* <CldImage
                    alt={icon}
                    width={imgDims}
                    height={imgDims}
                    className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/seal:scale-110"
                    src={icon}
                /> */}
                <BadgeIcon badge={badge} className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/seal:scale-110" />
            </div>
            {/* glow */}
            <span className="pointer-events-none absolute inset-0 rounded-full bg-yellow-400/0 blur-md transition-colors duration-500 group-hover/seal:bg-yellow-400/20" />
        </div>
    )
}

const BadgeTable = ({ badges }: IBadgeTableProps) => {
    const hasBadges = badges && badges.length > 0

    return (
        <div className="badge-table w-full">
            {/* ── Desktop table ──────────────────────────────────────────────── */}
            <div className="hidden md:block">
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900">
                    <table className="w-full border-collapse">
                        <thead className="bg-yellow-logo">
                            <tr>
                                <th className="w-16 px-6 py-4 text-left">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-900">
                                        No.
                                    </span>
                                </th>
                                <th className="px-6 py-4 text-left">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-900">
                                        Badge Name
                                    </span>
                                </th>
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        className={`px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-900 ${
                                            col === 'Icon' ? 'text-center' : 'text-left'
                                        }`}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.06]">
                            {badges.map((badge, index) => (
                                <tr
                                    key={badge._id}
                                    className="group odd:bg-white/[0.015] transition-colors hover:bg-yellow-400/[0.04]"
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-gray-600 transition-colors group-hover:text-yellow-400/70">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold tracking-wide text-white">
                                            {badge.name}
                                        </span>
                                    </td>
                                    <td className="max-w-md px-6 py-4 text-sm leading-relaxed text-gray-400">
                                        {badge.description}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <BadgeSeal badge={badge} size="sm" />
                                            
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!hasBadges && <EmptyState />}
                </div>
            </div>

            {/* ── Mobile cards ───────────────────────────────────────────────── */}
            <div className="space-y-3 md:hidden">
                {badges.map((badge, index) => (
                    <div
                        key={badge._id}
                        className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-gray-900 p-4 transition-all duration-200 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/5"
                    >
                        {/* top accent line */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

                        <div className="flex items-center gap-3">
                            <BadgeSeal badge={badge} size="md" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-gray-600">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <h2 className="truncate font-bold text-white">{badge.name}</h2>
                                </div>
                                <p className="mt-1 line-clamp-2 text-sm text-gray-400">
                                    {badge.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {!hasBadges && <EmptyState className="rounded-xl border border-white/[0.08]" />}
            </div>
        </div>
    )
}

export default BadgeTable;