import { IEventSponsorAdd } from '@/types';
import { APP_NAME } from '@/utils/keys';
import { CldImage } from 'next-cloudinary';
import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';

interface IShowSponsors {
  fileList: IEventSponsorAdd[];
  handleImgRemove: (e: React.SyntheticEvent, company: string | null) => void;
  defaultSponsor: boolean;
  handleDefaultSponsor: (e: React.SyntheticEvent) => void;
}

const ShowSponsors: React.FC<IShowSponsors> = ({ fileList, handleImgRemove, defaultSponsor, handleDefaultSponsor }) => {
  // Store generated object URLs in a ref to avoid re-renders
  const objectUrlsRef = useRef<Map<File, string>>(new Map());

  // Generate image sources (memoized for performance)
  const sponsorsWithUrls = useMemo(() => {
    return fileList.map(({ company, logo }) => {
      if (typeof logo === 'string') {
        return { company, src: logo, isCloudinary: true };
      }
      if (logo instanceof File) {
        // Reuse existing URL if available
        if (!objectUrlsRef.current.has(logo)) {
          objectUrlsRef.current.set(logo, URL.createObjectURL(logo));
        }
        return { company, src: objectUrlsRef.current.get(logo)!, isCloudinary: false };
      }
      return null;
    }).filter(Boolean) as { company: string; src: string; isCloudinary: boolean }[];
  }, [fileList]);

  // Cleanup all object URLs when component unmounts or fileList changes
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, [fileList]);

  return (
    <ul className="w-full show-sponsors flex justify-between w-full items-center flex-wrap">
      {/* Default Sponsor */}
      {defaultSponsor && (
        <li className="relative">
          <div className="w-20 static">
            <img src="/free-logo.png" alt={APP_NAME} className="w-full" />
            <p>{APP_NAME}</p>
          </div>
          <img
            src="/icons/close.svg"
            className="absolute top-1 right-1 w-6 h-6 rounded-full svg-white"
            role="presentation"
            onClick={handleDefaultSponsor}
          />
        </li>
      )}

      {/* Sponsor List */}
      {sponsorsWithUrls.map(({ company, src, isCloudinary }, index) => (
        <li className="relative" key={index}>
          <div className="w-20 static">
            {isCloudinary ? (
              <CldImage crop="fit" width={100} height={100} src={src} alt={`Sponsor ${index + 1}`} className="w-full" />
            ) : (
              <Image width={100} height={100} src={src} alt={`Sponsor ${index + 1}`} className="w-full" />
            )}
            <p>{company}</p>
          </div>
          <img
            src="/icons/close.svg"
            className="absolute top-1 right-1 w-6 h-6 rounded-full svg-white"
            role="presentation"
            onClick={(e) => handleImgRemove(e, company)}
          />
        </li>
      ))}
    </ul>
  );
};

export default ShowSponsors;
