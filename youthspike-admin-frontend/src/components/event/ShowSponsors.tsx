import cld from '@/config/cloudinary.config';
import { IEventSponsorAdd } from '@/types';
import { APP_NAME } from '@/utils/keys';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';

interface IShowSponsors {
    fileList: IEventSponsorAdd[];
    handleImgRemove: (e: React.SyntheticEvent, company: string) => void;
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
                const imgSrc = isStringLogo ? cld.image(logo) : URL.createObjectURL(logo as File);

                return (
                    <li className="relative" key={index}>
                        <div className="w-20 static">
                            {isStringLogo ? (
                                // @ts-ignore 
                                <AdvancedImage cldImg={imgSrc} alt={`Sponsor ${index + 1}`} className="w-full" />
                            ) : (
                                // @ts-ignore 
                                <img src={imgSrc} alt={`Sponsor ${index + 1}`} className="w-full" />
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
