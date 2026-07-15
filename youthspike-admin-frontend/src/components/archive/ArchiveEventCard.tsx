import { IArchiveEventCount, IEvent } from '@/types'
import { CldImage } from 'next-cloudinary';
import TextImg from '../elements/TextImg';
import Image from 'next/image';
import { readDate } from '@/utils/datetime';

interface IArchiveEventCardProps {
  event: IArchiveEventCount;
  onRestoreEvent: (eventId: string) => void;
}
function ArchiveEventCard({ event, onRestoreEvent }: IArchiveEventCardProps) {
  return (
    <div
      key={event._id}
      className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black transition-all duration-300 hover:-translate-y-1 hover:border-yellow-500/40 hover:shadow-2xl hover:shadow-yellow-500/10"
    >
      {/* Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      {/* Top */}
      <div className="flex items-start justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-800">
            {event.logo ? (
              <CldImage
                src={event.logo}
                alt={event.name}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <TextImg
                className="h-full w-full"
                fullText={event.name}
              />
            )}
          </div>

          <div>
            <h3 className="line-clamp-2 text-lg font-semibold transition-colors group-hover:text-yellow-400">
              {event.name}
            </h3>

            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">
              Archived Event
            </p>
          </div>
        </div>

        <button
          className="rounded-lg p-2 transition-colors hover:bg-zinc-800"
          aria-label="Event options"
        >
          <Image
            src="/icons/dots-vertical.svg"
            alt="Options"
            width={20}
            height={20}
            className="svg-white"
          />
        </button>
      </div>

      <div className="px-4 py-4 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            {
              label: "Templates",
              value: event.relatedCounts.templates,
            },
            {
              label: "Matches",
              value: event.relatedCounts.matches,
            },
            {
              label: "Groups",
              value: event.relatedCounts.groups,
            },
            {
              label: "Sponsors",
              value: event.relatedCounts.sponsors,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="
          group relative overflow-hidden rounded-xl
          border border-zinc-800
          bg-gradient-to-br from-zinc-900 via-zinc-900 to-black
          px-3 py-3
          transition-all duration-300
          hover:-translate-y-0.5
          hover:border-yellow-500/40
          hover:shadow-lg hover:shadow-yellow-500/10
        "
            >
              {/* Hover glow */}
              <div
                className="
            absolute inset-0
            bg-gradient-to-br
            from-yellow-400/10
            via-transparent
            to-transparent
            opacity-0
            transition-opacity duration-300
            group-hover:opacity-100
          "
              />

              <div className="relative flex flex-col items-center">
                {/* Number */}
                <span
                  className="
              text-lg font-bold leading-none
              text-white
              transition-colors duration-300
              group-hover:text-yellow-400
              sm:text-xl
            "
                >
                  {item.value}
                </span>

                {/* Decorative line */}
                <div
                  className="
              my-2 h-px w-8
              bg-gradient-to-r
              from-transparent
              via-yellow-500/70
              to-transparent
              transition-all duration-300
              group-hover:w-10
            "
                />

                {/* Label */}
                <span
                  className="
              text-[10px]
              font-medium
              uppercase
              tracking-[0.18em]
              text-zinc-500
              sm:text-xs
            "
                >
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-zinc-800" />

      {/* Body */}
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Start</span>
          <span>{readDate(event.startDate)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">End</span>
          <span>{readDate(event.endDate)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/50 px-6 py-4">
        <span className="text-xs font-medium uppercase tracking-wider text-yellow-400">
          Archived
        </span>

        <button onClick={(e) => onRestoreEvent(event._id)} type='button' className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-400 transition-all duration-200 hover:bg-yellow-500 hover:text-black">
          Restore
        </button>
      </div>
    </div>
  )
}

export default ArchiveEventCard