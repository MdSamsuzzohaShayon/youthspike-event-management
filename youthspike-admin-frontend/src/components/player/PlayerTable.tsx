'use client';

import { IPlayerExpRel } from '@/types';
import { CldImage } from 'next-cloudinary';
import React from 'react';
import TextImg from '../elements/TextImg';
import Link from 'next/link';
import { LDO_ID } from '@/utils/constant';

interface IPlayerTableProps {
  players: IPlayerExpRel[];
}

export default function PlayerTable({ players }: IPlayerTableProps) {
  return (
    <div className="w-full">
      {/* ─────────────── CARDS (xs only) ─────────────── */}
      <div className="space-y-4">
        {players.map((p) => (
          <div key={p._id} className="bg-gray-900 text-white rounded-xl shadow-md p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              {p.profile ? (
                <CldImage crop="fit" src={p.profile} alt={`${p.firstName} ${p.lastName} avatar`} width={48} height={48} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <TextImg className="w-12 h-12 rounded-full" fullText={`${p.firstName} ${p.lastName}`} />
              )}
              <div>
                <h2 className="text-lg font-bold">
                  {p.firstName} {p.lastName}
                </h2>
                <p className="text-xs text-yellow-400">{p.division}</p>
              </div>
            </div>

            {/* Teams */}
            {p.teams?.length && (
              <div>
                <h3 className="text-xs font-semibold text-yellow-400">Teams</h3>
                <ul className="flex flex-wrap gap-2 mt-1">
                  {p.teams.map((t) => (
                    <li key={t._id} className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded-md">
                      {t.logo ? (
                        <CldImage crop="fit" src={t.logo} alt={`${t.name} logo`} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <TextImg className="w-5 h-5 rounded-full" fullText={t.name} />
                      )}
                      {t.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Events */}
            {p.events?.length && (
              <div>
                <h3 className="text-xs font-semibold text-yellow-400">Events</h3>
                <ul className="flex flex-wrap gap-2 mt-1">
                  {p.events.map((e) => (
                    <li key={e._id} className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded-md">
                      {e.logo ? (
                        <CldImage crop="fit" src={e.logo} alt={`${e.name} logo`} width={20} height={20} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <TextImg className="w-5 h-5 rounded-full" fullText={e.name} />
                      )}
                      {e.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action */}
            {p.events?.[0] && (
              <div className="text-right">
                <Link
                  // @ts-ignore
                  href={`/${p.events[0]._id}/players/${p._id}/?${LDO_ID}=${p.events[0]?.ldo?._id || ''}`}
                  className="inline-block bg-yellow-400 text-black font-semibold px-3 py-1.5 rounded-md hover:bg-yellow-500 transition"
                >
                  Details
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
