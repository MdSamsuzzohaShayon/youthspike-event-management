import cld from '@/config/cloudinary.config'
import { DELETE_DIRECTOR } from '@/graphql/director'
import { ILDO, ILDOItem } from '@/types'
import { useMutation } from '@apollo/client'
import { AdvancedImage } from '@cloudinary/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

interface IDeleteRowProps{
    ldo: ILDOItem;
    handleDeleteLDO: (e: React.SyntheticEvent, ldoId: string)=> void;
}
const DirectorRow = ({ ldo, handleDeleteLDO }: IDeleteRowProps) => {
    

    return (
        <tr className='border-b border-gray-800 hover:bg-gray-800'  >
            <td className="py-2 px-4 capitalize" >{ldo.name}</td>
            <td className="py-2 px-4 capitalize" >
                {ldo?.logo ? <AdvancedImage className="w-8" cldImg={cld.image(ldo?.logo)} /> : ''}
            </td>
            <td className="py-2 px-4 capitalize break-words" >{ldo.director?.firstName} {ldo.director?.lastName}</td>
            <td className="py-2 px-4 lowercase" >{ldo.director?.email}</td>
            <td className="py-2 px-4 lowercase" >{ldo.num}</td>
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