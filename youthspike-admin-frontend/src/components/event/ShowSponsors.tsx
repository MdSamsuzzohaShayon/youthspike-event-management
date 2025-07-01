import { IEventSponsorAdd } from '@/types';
import { APP_NAME } from '@/utils/keys';
import { CldImage } from 'next-cloudinary';
import React from 'react';
import Image from 'next/image';

interface IShowSponsors {
    fileList: IEventSponsorAdd[];
    handleImgRemove: (e: React.SyntheticEvent, company: string | null) => void;
    defaultSponsor: boolean;
    handleDefaultSponsor: (e: React.SyntheticEvent) => void;
}

const ShowSponsors: React.FC<IShowSponsors> = ({ fileList, handleImgRemove, defaultSponsor, handleDefaultSponsor }) => {
    
    return (
        <ul className="show-sponsors flex justify-between w-full items-center flex-wrap">
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
            {fileList.map(({ company, logo }, index) => {
                const isStringLogo = typeof logo === 'string';
                const imgSrc = isStringLogo ? logo : URL.createObjectURL(logo as File);

                return (
                    <li className="relative" key={index}>
                        <div className="w-20 static">
                            {isStringLogo ? (
                                <CldImage width={100} height={100}  src={imgSrc} alt={`Sponsor ${index + 1}`} className="w-full" />
                            ) : (
                                <Image width={100} height={100} src={imgSrc} alt={`Sponsor ${index + 1}`} className="w-full" />
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
                );
            })}
        </ul>
    );
};

export default ShowSponsors;
