import cld from '@/config/cloudinary.config';
import { IEventSponsorAdd } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react'

interface IShowSponsors {
    fileList: IEventSponsorAdd[];
    handleImgRemove: (e: React.SyntheticEvent, company: string) => void;
}

function ShowSponsors({ fileList, handleImgRemove }: IShowSponsors) {
    const imgElList: React.ReactNode[] = []
    for (let i = 0; i < fileList.length; i += 1) {
        let imgEl = null;

        
        const imgFile = fileList[i].logo as File;
        imgEl = (
            <div className="w-20 static" >
                {typeof imgFile === "string"
                    ? <AdvancedImage cldImg={cld.image(imgFile)} alt={`Sponsor ${i + 1}`} className="w-full" key={imgFile + '' + i} />
                    : (<img  src={URL.createObjectURL(imgFile)} alt={`Sponsor ${i + 1}`} className="w-full" key={imgFile.name + '' + i} />)}

                <p>{fileList[i].company}</p>
            </div>
        );

        const liEl = (
            <li className='relative' key={i}>
                {imgEl}
                <img src='/icons/close.svg' className='absolute top-1 right-1 w-6 h-6 rounded-full svg-white'
                    role="presentation"
                    onClick={e => handleImgRemove(e, typeof fileList[i] === "string" ? fileList[i].toString() : fileList[i].company)}
                />
            </li>
        );
        imgElList.push(liEl);
    }

    return (<ul className="show-sponsors flex justify-between w-full items-center flex-wrap">{imgElList}</ul>);
}

export default ShowSponsors;