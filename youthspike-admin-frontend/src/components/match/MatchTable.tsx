'use client';

import { IMatchExpRel } from '@/types';
import { CldImage } from 'next-cloudinary';
import React from 'react';
import TextImg from '../elements/TextImg';
import Link from 'next/link';
import { LDO_ID } from '@/utils/constant';
import { readDate } from '@/utils/datetime';
import useLdoUrl from '@/hooks/useLdoUrl';
import { useLdoId } from '@/lib/LdoProvider';

interface IMatchTableProps {
  matches: IMatchExpRel[];
}

export default function MatchTable({ matches }: IMatchTableProps) {
  const { ldoIdUrl } = useLdoId();
  return (
    <div className="w-full">
      {/* ────────────────────────── Desktop (table) ────────────────────────── */}
      <div className="hidden md:block">
        <table className="w-full border-collapse rounded-lg overflow-hidden">
          <thead className="bg-yellow-400 text-black text-sm uppercase tracking-wide">
            <tr>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Team A</th>
              <th className="py-3 px-4 text-left">Team B</th>
              <th className="py-3 px-4 text-center">Division</th>
              <th className="py-3 px-4 text-center">Nets</th>
              <th className="py-3 px-4 text-center">Rounds</th>
              <th className="py-3 px-4 text-center">Location</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800 bg-gray-900 text-white">
            {matches.map((m) => (
              <tr key={m._id} className="hover:bg-gray-800 transition">
                {/* Date */}
                <td className="py-4 px-4 whitespace-nowrap font-medium">{readDate(m.date)}</td>

                {/* Team A */}
                <td className="py-4 px-4 flex items-center gap-3">
                  {m.teamA.logo ? (
                    <CldImage src={m.teamA.logo} alt={`${m.teamA.name} logo`} width={40} height={40} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <TextImg className="w-8 h-8 rounded-full" fullText={m.teamA.name} />
                  )}
                  <span>{m.teamA.name}</span>
                </td>

                {/* Team B */}
                <td className="py-4 px-4 flex items-center gap-3">
                  {m.teamB.logo ? (
                    <CldImage src={m.teamB.logo} alt={`${m.teamB.name} logo`} width={40} height={40} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <TextImg className="w-8 h-8 rounded-full" fullText={m.teamB.name} />
                  )}
                  <span>{m.teamB.name}</span>
                </td>

                {/* Other meta */}
                <td className="py-4 px-4 text-center">{m.division}</td>
                <td className="py-4 px-4 text-center">{m.numberOfNets}</td>
                <td className="py-4 px-4 text-center">{m.numberOfRounds}</td>
                <td className="py-4 px-4 text-center">{m.location}</td>

                {/* Action */}
                <td className="py-4 px-4 text-center">
                  <Link
                    // @ts-ignore
                    href={`/${m.event._id}/matches/${m._id}/${ldoIdUrl}`}
                    className="inline-block bg-yellow-400 text-black font-semibold px-4 py-2 rounded-md hover:bg-yellow-500 transition"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ─────────────────────────── Mobile (cards) ────────────────────────── */}
      <div className="space-y-4 md:hidden">
        {matches.map((m) => (
          <div key={m._id} className="bg-gray-900 text-white rounded-xl shadow-md p-4 space-y-3">
            {/* Date */}
            <div className="text-sm font-semibold text-yellow-400">{readDate(m.date)}</div>

            {/* Teams */}
            <div className="flex items-center justify-between gap-4">
              {/* Team A */}
              <div className="flex items-center gap-2">
                {m.teamA.logo ? (
                  <CldImage src={m.teamA.logo} alt={`${m.teamA.name} logo`} width={40} height={40} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <TextImg className="w-8 h-8 rounded-full" fullText={m.teamA.name} />
                )}
                <span>{m.teamA.name}</span>
              </div>

              {/* VS separator */}
              <span className="text-yellow-400 font-bold">vs</span>

              {/* Team B */}
              <div className="flex items-center gap-2">
                {m.teamB.logo ? (
                  <CldImage src={m.teamB.logo} alt={`${m.teamB.name} logo`} width={40} height={40} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <TextImg className="w-8 h-8 rounded-full" fullText={m.teamB.name} />
                )}
                <span>{m.teamB.name}</span>
              </div>
            </div>

            {/* Meta grid */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex flex-col">
                <dt className="text-yellow-400 font-semibold">Division</dt>
                <dd>{m.division}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-yellow-400 font-semibold">Location</dt>
                <dd>{m.location}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-yellow-400 font-semibold">Nets</dt>
                <dd>{m.numberOfNets}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-yellow-400 font-semibold">Rounds</dt>
                <dd>{m.numberOfRounds}</dd>
              </div>
            </dl>

            {/* Description */}
            {m.description && <p className="text-xs leading-snug text-gray-300">{m.description}</p>}

            {/* Action */}
            <div className="text-right">
              <Link
                // @ts-ignore
                href={`/${m.event._id}/matches/${m._id}/?${LDO_ID}=${m.event?.ldo?._id || ''}`}
                className="inline-block bg-yellow-400 text-black font-semibold px-3 py-1.5 rounded-md hover:bg-yellow-500 transition"
              >
                Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
