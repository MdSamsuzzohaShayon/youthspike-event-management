import cld from '@/config/cloudinary.config'
import { ILDO, ILDOItem } from '@/types'
import { AdvancedImage } from '@cloudinary/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

const DirectorRow = ({ ldo }: { ldo: ILDOItem }) => {
    const router = useRouter();

    const handleDeleteLDO = (e: React.SyntheticEvent, ldoId: string): void => {
        e.preventDefault();
    }

    return (
        <tr >
            <td className="py-2 px-4 capitalize" >{ldo.name}</td>
            <td className="py-2 px-4 capitalize" >
                {ldo?.logo ? <AdvancedImage className="w-8" cldImg={cld.image(ldo?.logo)} /> : ''}
            </td>
            <td className="py-2 px-4 capitalize" >{ldo.director?.firstName} {ldo.director?.lastName}</td>
            <td className="py-2 px-4 lowercase" >{ldo.director?.login?.email}</td>
            <td className="py-2 px-4 capitalize flex justify-center items-center gap-2" >
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