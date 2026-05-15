'use client'

// ─── TeamTable ────────────────────────────────────────────────────────────────
// Drop-in replacement. Logic unchanged; markup / Tailwind redesigned.

import { ITeam } from '@/types';
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';

interface ITeamTableProps {
  teams: ITeam[];
}

// ── shared pill / badge ───────────────────────────────────────────────────────
function DivisionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-yellow-300">
      {label}
    </span>
  );
}

// ── action buttons ────────────────────────────────────────────────────────────
function ActionLink({
  href,
  variant = 'outline',
  children,
}: {
  href: string;
  variant?: 'solid' | 'outline';
  children: React.ReactNode;
}) {
  const base =
    'inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400';
  const solid = 'bg-yellow-logo text-black hover:bg-yellow-300 hover:scale-105';
  const outline =
    'border border-yellow-logo text-yellow-logo hover:bg-yellow-400 hover:text-black hover:scale-105';
  return (
    <Link href={href} className={`${base} ${variant === 'solid' ? solid : outline}`}>
      {children}
    </Link>
  );
}

// ── avatar ────────────────────────────────────────────────────────────────────
function TeamAvatar({ team, size = 'sm' }: { team: ITeam; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 32 : 48;
  const cls = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
  return team.logo ? (
    <CldImage
      width={dim}
      height={dim}
      crop="fit"
      sizes="100vw"
      className={`${cls} rounded-lg object-cover ring-2`}
      alt={`${team.name} logo`}
      src={team.logo}
    />
  ) : (
    <TextImg className={`${cls} rounded-lg ring-2`} fullText={team.name} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Desktop row
// ─────────────────────────────────────────────────────────────────────────────
function TeamRow({ team, ldoIdUrl }: { team: ITeam; ldoIdUrl: string }) {
  return (
    <tr className="group border-b border-white/[0.05] transition-colors duration-150 hover:bg-white/[0.03]">
      {/* Name */}
      <td className="py-4 px-6">
        <span className="font-semibold text-white group-hover:text-yellow-400 transition-colors duration-150">
          {team.name}
        </span>
      </td>

      {/* Logo */}
      <td className="py-4 px-6">
        <TeamAvatar team={team} size="sm" />
      </td>

      {/* Division */}
      <td className="py-4 px-6 text-center">
        {team.division ? <DivisionBadge label={team.division} /> : <span className="text-gray-600">—</span>}
      </td>

      {/* Events */}
      <td className="py-4 px-6">
        <div className="flex flex-wrap gap-1 justify-center">
          {team.events.length === 0 && <span className="text-gray-600 text-xs">No events</span>}
          {team.events.map((event) => (
            <Link
              key={event?._id}
              href={`/${event?._id}/teams/${ldoIdUrl}`}
              className="inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300 transition-colors hover:border-yellow-400/40 hover:text-yellow-300"
            >
              {event?.name}
            </Link>
          ))}
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-6">
        <div className="flex items-center justify-center gap-2">
          <ActionLink href={`/teams/${team._id}/roster/${ldoIdUrl}`} variant="solid">
            View
          </ActionLink>
          <ActionLink href={`/teams/${team._id}/update/${ldoIdUrl}`} variant="outline">
            Edit
          </ActionLink>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile card
// ─────────────────────────────────────────────────────────────────────────────
function MobileCard({ team, ldoIdUrl }: { team: ITeam; ldoIdUrl: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#161616] p-4 transition-all duration-200 hover:border-yellow-400/30 hover:shadow-lg hover:shadow-yellow-400/5">
      {/* top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <TeamAvatar team={team} size="md" />
          <div className="min-w-0">
            <h2 className="truncate font-bold text-white">{team.name}</h2>
            {team.division && <DivisionBadge label={team.division} />}
          </div>
        </div>
      </div>

      {/* Events */}
      {team.events.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {team.events.map((event) => (
            <Link
              key={event?._id}
              href={`/${event?._id}/teams/${ldoIdUrl}`}
              className="inline-block rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-gray-300 hover:border-yellow-400/40 hover:text-yellow-300 transition-colors"
            >
              {event?.name}
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2 justify-end">
        <ActionLink href={`/teams/${team._id}/roster/${ldoIdUrl}`} variant="solid">
          View Roster
        </ActionLink>
        <ActionLink href={`/teams/${team._id}/update/${ldoIdUrl}`} variant="outline">
          Edit
        </ActionLink>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function TeamTable({ teams }: ITeamTableProps) {
  const { ldoIdUrl } = useLdoId();

  return (
    <div className="w-full">
      {/* ── Desktop table ──────────────────────────────────────────────── */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08]">
              {['Team Name', 'Logo', 'Division', 'Events', 'Actions'].map((col) => (
                <th
                  key={col}
                  className={`py-4 px-6 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 ${
                    col === 'Team Name' || col === 'Logo' ? 'text-left' : 'text-center'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <TeamRow key={team._id} team={team} ldoIdUrl={ldoIdUrl} />
            ))}
          </tbody>
        </table>

        {teams.length === 0 && (
          <div className="py-20 text-center text-gray-600 font-mono text-sm">No teams found</div>
        )}
      </div>

      {/* ── Mobile cards ───────────────────────────────────────────────── */}
      <div className="md:hidden space-y-3 p-4">
        {teams.map((team) => (
          <MobileCard key={team._id} team={team} ldoIdUrl={ldoIdUrl} />
        ))}
        {teams.length === 0 && (
          <div className="py-16 text-center text-gray-600 font-mono text-sm">No teams found</div>
        )}
      </div>
    </div>
  );
}