'use client'

import { ITeam } from '@/types';
import { CldImage } from 'next-cloudinary';
import React from 'react';
import TextImg from '../elements/TextImg';
import Link from 'next/link';
import useLdoUrl from '@/hooks/useLdoUrl';
import { LDO_ID } from '@/utils/constant';

interface ITeamTableProps {
  teams: ITeam[];
}

export default function TeamTable({ teams }: ITeamTableProps) {

  return (
    <div className="w-full">
      {/* Desktop Table Layout */}
      <div className="hidden md:block">
        <table className="w-full border-collapse rounded-lg overflow-hidden">
          <thead className="bg-yellow-400 text-black">
            <tr>
              <th className="py-4 px-6 text-left">Team Name</th>
              <th className="py-4 px-6 text-left">Logo</th>
              <th className="py-4 px-6 text-center">Division</th>
              <th className="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900 text-white">
            {teams.map((team) => (
              <tr key={team._id} className="hover:bg-gray-800 transition">
                <td className="py-4 px-6 font-medium">{team.name}</td>
                <td className="py-4 px-6">
                  {team.logo ? (
                    <CldImage
                      width={100}
                      height={100}
                      className="w-8 h-8 object-cover rounded-full"
                      sizes="100vw"
                      alt={`${team.name} logo`}
                      src={team.logo}
                    />
                  ) : (
                    <TextImg className="w-8 h-8 rounded-full" fullText={team.name} />
                  )}
                </td>
                <td className="py-4 px-6 text-center">{team.division}</td>
                <td className="py-4 px-6 text-center">
                  <Link
                  // @ts-ignore
                    href={`/${team.event._id}/teams/${team._id}/?${LDO_ID}=${team.event?.ldo?._id || ''}`}
                    className="bg-yellow-400 text-black font-semibold px-4 py-2 rounded-md hover:bg-yellow-500 transition"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-4">
        {teams.map((team) => (
          <div
            key={team._id}
            className="bg-gray-900 text-white rounded-xl shadow-md p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{team.name}</h2>
              {team.logo ? (
                <CldImage
                  width={50}
                  height={50}
                  className="w-10 h-10 object-cover rounded-full"
                  sizes="100vw"
                  alt={`${team.name} logo`}
                  src={team.logo}
                />
              ) : (
                <TextImg className="w-10 h-10 rounded-full" fullText={team.name} />
              )}
            </div>
            <p className="text-sm">
              <span className="font-semibold text-yellow-400">Division:</span> {team.division}
            </p>
            <div className="text-right">
              <Link
                // @ts-ignore
                href={`/${team.event._id}/teams/${team._id}/?${LDO_ID}=${team.event?.ldo?._id || ''}`}
                className="inline-block bg-yellow-400 text-black font-semibold px-3 py-1.5 rounded-md hover:bg-yellow-500 transition"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
