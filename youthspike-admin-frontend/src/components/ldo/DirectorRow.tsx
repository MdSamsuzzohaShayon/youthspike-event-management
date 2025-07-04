import { ILDOItem } from '@/types';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import React from 'react';

interface IDeleteRowProps{
    ldo: ILDOItem;
    handleDeleteLDO: (e: React.SyntheticEvent, ldoId: string)=> void;
}
const DirectorRow = ({ ldo, handleDeleteLDO }: IDeleteRowProps) => {
    

    return (
        <tr className='hover:bg-gray-900 transition'  >
            <td className="py-4 px-6" >{ldo.name}</td>
            <td className="py-4 px-6" >
                {ldo?.logo ? <CldImage width={100} height={100} alt="Ldo Logo" className="w-8" src={ldo?.logo} /> : ''}
            </td>
            <td className="py-4 px-6 break-words" >{ldo.director?.firstName} {ldo.director?.lastName}</td>
            <td className="py-4 px-6 lowercase" >{ldo.phone}</td>
            <td className="py-4 px-6 lowercase" >{ldo.director?.email}</td>
            <td className="py-4 px-6 flex justify-center items-center gap-2" >
                <Link href={`/?ldoId=${ldo._id}`}>
                    <img src='/icons/event.svg' alt='edit' className='w-6 svg-white' />
                </Link>
                <Link href={`/admin/directors/${ldo._id}`}>
                    <img src='/icons/edit.svg' alt='edit' className='w-6 svg-white' />
                </Link>
                <button onClick={(e) => handleDeleteLDO(e, ldo?._id)} >
                    <img src='/icons/delete.svg' alt='delete' className='w-6 svg-white' />
                </button>
            </td>
        </tr>
    )
}

export default DirectorRow