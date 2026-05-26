import { IEvent } from '@/types';
import { readDate } from '@/utils/datetime';
import Link from 'next/link';
import React from 'react';

interface IEventWrapperProps {
    event: IEvent | null;
}


function EventWrapper({ event }: IEventWrapperProps) {

    return (
        <div>      {/* Event Wrapper Start */}
            <div className="relative overflow-hidden rounded-2xl border border-yellow-400/15 bg-gradient-to-br from-black via-zinc-950 to-black px-4 py-3 md:px-6 md:py-4 shadow-[0_0_40px_rgba(250,204,21,0.06)]">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.14),transparent_30%)] pointer-events-none" />
                <div className="absolute -top-10 right-0 h-32 w-32 rounded-full bg-yellow-400/10 blur-3xl" />

                <div className="relative z-10 flex items-center justify-between gap-4">

                    {/* Left Content */}
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Logo */}
                        <Link href="/" className="group shrink-0">
                            <div className="relative rounded-xl border border-yellow-400/20 bg-white/5 p-2 backdrop-blur-md transition-all duration-300 group-hover:border-yellow-300/40 group-hover:bg-white/10">
                                <img
                                    alt="YouthSpike Logo"
                                    width="100"
                                    height="100"
                                    className="w-14 md:w-16 object-contain transition-transform duration-300 group-hover:scale-105"
                                    src="/free-logo.png"
                                />
                            </div>
                        </Link>

                        {/* Event Info */}
                        <div className="min-w-0">
                            {/* Badge */}
                            <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] md:text-xs font-medium text-yellow-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                LIVE EVENT
                            </div>

                            {/* Title */}
                            <h1 className="truncate text-lg md:text-2xl font-black tracking-tight text-white leading-tight">
                                {event?.name || "2025 PRO LEAGUE"}
                            </h1>

                            {/* Date */}
                            <p className="mt-1 text-xs md:text-sm font-medium text-yellow-300">
                                {readDate(event?.startDate as string)} —{" "}
                                {readDate(event?.endDate as string)}
                            </p>

                            {/* Description */}
                            {event?.description && (
                                <p className="mt-1 line-clamp-1 md:line-clamp-2 text-xs md:text-sm text-zinc-400">
                                    {event.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Accent */}
                    <div className="hidden md:flex items-center">
                        <div className="h-16 w-[2px] rounded-full bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-60" />
                    </div>
                </div>
            </div>
            {/* Event Wrapper End */}</div>
    )
}

export default EventWrapper