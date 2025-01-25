import { IEvent, IUserContext } from "@/types";
import { ISOToReadableDate } from "@/utils/helper";
import { AdvancedImage } from "@cloudinary/react";
import React, { useMemo } from "react";
import { useUser } from "@/lib/UserProvider";
import { UserRole } from "@/types/user";
import Image from "next/image";
import cld from "@/config/cloudinary.config";

const EventDetail = ({ currEvent }: { currEvent: IEvent }) => {
  const user = useUser();

  const displayLogo: React.ReactNode = useMemo(() => {
    let logoEl = (
      <Image
        width={128}
        height={128}
        alt="default-logo"
        src="/free-logo.png"
        className="w-32 h-32 rounded-full object-center object-cover border-4 border-yellow-400"
      />
    );
    if (user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain) {
      if (user?.info?.teamLogo) {
        logoEl = (
          <AdvancedImage
            cldImg={cld.image(user.info.teamLogo)}
            className="w-32 h-32 rounded-full object-center object-cover border-4 border-yellow-400"
            alt="event-logo"
          />
        );
      }
    } else if (user.info?.role === UserRole.admin || user.info?.role === UserRole.director) {
      if (currEvent?.logo) {
        logoEl = (
          <AdvancedImage
            cldImg={cld.image(currEvent.logo)}
            className="w-32 h-32 rounded-full object-center object-cover border-4 border-yellow-400"
            alt="event-logo"
          />
        );
      }
    }
    return <React.Fragment>{logoEl}</React.Fragment>;
  }, [user, currEvent]);

  return (
    <div className="flex items-center justify-center py-6 px-0 md:px-6">
      <div className="relative bg-gray-800 rounded-3xl shadow-2xl overflow-visible w-full max-w-3xl flex flex-col items-center gap-6 py-10 px-0">
        {/* Background Gradient */}
        <div className="absolute inset-0 z-0 bg-gradient-to-tr from-yellow-500/10 to-gray-800/10 opacity-80"></div>

        {/* Floating Logo */}
        <div className="relative z-10 -mt-24 p-4 bg-gray-800 rounded-full shadow-lg">
          {displayLogo}
        </div>

        {/* Event Title */}
        <h1 className="relative z-10 text-2xl md:text-4xl font-extrabold text-center tracking-wide text-white">
          {currEvent.name}
        </h1>

        {/* Team Name with Badge */}
        {(user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain) && ( <div className="team-name relative z-10 flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
          <span className="bg-yellow-500 text-black text-sm md:text-base px-3 py-1 rounded-full shadow">
            Featured Team
          </span>
          <h3 className="text-lg md:text-xl font-medium text-yellow-400">{ user.info?.team }</h3>
        </div>)}


        {/* Divider */}
        <div className="relative z-10 w-10 h-1 bg-yellow-400 rounded-full"></div>

        {/* Location and Event Date */}
        <div className="relative z-10 grid grid-cols-1 gap-4 text-gray-300 text-sm md:text-base w-full">
          {/* Location */}
          <div className="flex items-center justify-center gap-3">
            <Image
              width={20}
              height={20}
              alt="location-icon"
              className="w-6 h-6 svg-white object-fit object-cover"
              src="/icons/location.svg"
            />
            <p className="font-medium text-center md:text-left">{currEvent.location}</p>
          </div>

          {/* Event Date */}
          <div className="flex items-center justify-center gap-3">
            <Image
              width={20}
              height={20}
              alt="clock-icon"
              className="w-6 h-6 svg-white object-fit object-cover"
              src="/icons/clock.svg"
            />
            <p className="font-medium text-center md:text-left">
              {ISOToReadableDate(currEvent.startDate)} - {ISOToReadableDate(currEvent.endDate)}
            </p>
          </div>
        </div>

        {/* Decorative Rings */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-yellow-500/20 rounded-full blur-3xl z-0"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-yellow-500/30 rounded-full blur-2xl z-0"></div>
      </div>
    </div>
  );
};

export default EventDetail;