import cld from '@/config/cloudinary.config';
import { ILDO, ILDOItem } from '@/types';
import { useMutation } from '@apollo/client';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

const DirectorRow = ({ ldo }: { ldo: ILDOItem }) => {

    return (
        <tr >
            <td className="py-2 px-4 capitalize" >{ldo.name}</td>
            <td className="py-2 px-4 capitalize" >
                {ldo?.logo ? <AdvancedImage className="w-8" cldImg={cld.image(ldo?.logo)} /> : ''}
            </td>
            <td className="py-2 px-4 capitalize break-words" >{ldo.director?.firstName} {ldo.director?.lastName}</td>
            <td className="py-2 px-4 lowercase" >{ldo.director?.email}</td>
            <td className="py-2 px-4 capitalize flex justify-center items-center gap-2" >
                <Link href={`/ldos/${ldo._id}`}>
                    <img src='/icons/event.svg' alt='edit' className='w-6 svg-white' />
                </Link>
            </td>
        </tr>
    )
}

export default DirectorRow