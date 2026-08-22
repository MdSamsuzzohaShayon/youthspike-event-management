import { ILDO, ILDOItem } from '@/types';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import TextImg from '../elements/TextImg';
import { LDO_ID } from '@/utils/constant';
import SessionStorageService from '@/utils/SessionStorageService';
import routerService from '@/lib/router-service';

interface IDeleteRowProps{
    ldo: ILDO;
    handleDeleteLDO: (e: React.SyntheticEvent, ldoId: string)=> void;
}

const DirectorRow = ({ ldo, handleDeleteLDO }: IDeleteRowProps) => {
    
    const handleRedirect=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        SessionStorageService.setItem(LDO_ID, ldo._id);
        routerService.push(`/?${LDO_ID}=${ldo._id}`);
    }

    return (
        <tr className="odd:bg-gray-800 even:bg-gray-700 hover:bg-gray-600 transition-all">
            <td className="py-2 px-3 sticky left-0 bg-inherit min-w-[120px] max-w-[120px] z-10">
                {ldo.name}
            </td>
            <td className="py-3 px-3">
                {ldo?.logo ? (
                    <CldImage 
                        crop="fit" 
                        width={40} 
                        height={40} 
                        alt="Ldo Logo" 
                        className="w-16 h-16 rounded-md object-cover" 
                        src={ldo?.logo} 
                    />
                ) : (
                    <TextImg className='w-16 h-16 rounded-md' fullText={ldo.name} />
                )}
            </td>
            <td className="py-3 px-3 break-words capitalize text-gray-200">
                {ldo.director?.firstName} {ldo.director?.lastName}
            </td>
            <td className="py-3 px-3 lowercase text-gray-300">
                {ldo.phone}
            </td>
            <td className="py-3 px-3 lowercase text-gray-300">
                {ldo.director?.email}
            </td>
            <td className="py-3 px-3">
                <div className="flex justify-center items-center gap-3">
                    <Link 
                        href="#" 
                        onClick={handleRedirect}
                        className="hover:opacity-80 transition-opacity"
                    >
                        <Image 
                            height={20} 
                            width={20} 
                            src='/icons/event.svg' 
                            alt='event' 
                            className='w-5 h-5 svg-white' 
                        />
                    </Link>
                    <Link 
                        href={`/admin/directors/${ldo._id}`}
                        className="hover:opacity-80 transition-opacity"
                    >
                        <Image 
                            height={20} 
                            width={20} 
                            src='/icons/edit.svg' 
                            alt='edit' 
                            className='w-5 h-5 svg-white' 
                        />
                    </Link>
                    <button 
                        onClick={(e) => handleDeleteLDO(e, ldo?._id)}
                        className="hover:opacity-80 transition-opacity"
                    >
                        <Image 
                            height={20} 
                            width={20} 
                            src='/icons/delete.svg' 
                            alt='delete' 
                            className='w-5 h-5 svg-white' 
                        />
                    </button>
                </div>
            </td>
        </tr>
    )
}

export default DirectorRow