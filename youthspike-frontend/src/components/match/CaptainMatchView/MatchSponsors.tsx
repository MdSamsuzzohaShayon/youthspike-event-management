import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { APP_NAME } from "@/utils/keys";

export interface IEventSponsor {
  _id: string;
  company: string;
  logo: string;
}

interface IMatchSponsorsProps {
  sponsors: IEventSponsor[];
}

/**
 * Pre-match sponsor strip. The platform's own sponsor entry renders from a
 * local asset; every other sponsor's logo is served through Cloudinary.
 */
function MatchSponsors({ sponsors }: IMatchSponsorsProps) {
  if (sponsors.length === 0) return null;

  return (
    <div className="sponsors w-full py-4 mx-auto bg-black-logo text-white rounded-lg shadow-md">
      <div className="container px-4 mx-auto">
        <h2 className="text-lg font-semibold">Sponsors</h2>
        <div className="flex items-center justify-between md:justify-start flex-wrap w-full gap-4">
          {sponsors.map((sponsor) =>
            sponsor.company === APP_NAME ? (
              <Image
                key={sponsor._id}
                src={`/${sponsor.logo}`}
                width={40}
                height={40}
                alt="default-logo"
                className="w-20"
              />
            ) : (
              <CldImage
                key={sponsor._id}
                alt={sponsor.company}
                width={100}
                height={100}
                className="w-20"
                crop="fit"
                src={sponsor.logo}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchSponsors;