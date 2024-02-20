import { IEventSponsorAdd } from '@/types';
import React from 'react'

function ShowSponsors({ fileList }: { fileList: IEventSponsorAdd[] }) {
    const imgElList: React.ReactNode[] = []
    for (let i = 0; i < fileList.length; i += 1) {
        let imgEl = null;
        if (typeof fileList[i] === "string") {
            // const imgUrl = fileList[i] as string; // Need to update
            // imgEl = <AdvancedImage className="w-20 static" cldImg={cld.image(imgUrl)} />;
        } else {
            const imgFile = fileList[i].logo as File;
            imgEl = (
                <div className="w-20 static" >
                    <img
                        src={URL.createObjectURL(imgFile)}
                        alt={`Sponsor ${i + 1}`}
                        className="w-full"
                        key={imgFile.name + '' + i}
                    />
                    <p>{fileList[i].company}</p>
                </div>
            );
        }
        const liEl = (
            <li className='relative' key={i}>
                {imgEl}
                <img src='/icons/close.svg' className='absolute top-1 right-1 w-6 h-6 rounded-full svg-white'
                    role="presentation"
                    // @ts-ignore 
                    onClick={e => handleImgRemove(e, typeof fileList[i] === "string" ? fileList[i] : fileList[i].company)}
                />
            </li>
        );
        imgElList.push(liEl);
    }

    return (<ul className="show-sponsors flex justify-between w-full items-center flex-wrap">{imgElList}</ul>);
}

export default ShowSponsors;