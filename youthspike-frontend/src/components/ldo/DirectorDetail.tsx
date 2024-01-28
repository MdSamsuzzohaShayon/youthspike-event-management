import cld from '@/config/cloudinary.config'
import { ILDO, ILDOItem } from '@/types'
import { AdvancedImage } from '@cloudinary/react'
import React from 'react'

function DirectorDetail({ ldo }: { ldo: ILDO }) {
    return (
        <div className='w-full flex flex-col items-center justify-center gap-2'>
            <h2 className='mb-4'>{ldo.name}</h2>
            {ldo.logo ? <AdvancedImage className="w-16" cldImg={cld.image(ldo.logo)} /> : <img src="/free-logo.svg" alt="plus" className="w-16" /> }
            <p className='capitalize'>Director: {ldo.director?.firstName} {ldo.director?.lastName}</p>
            <p>Email: {ldo.director?.email}</p>
        </div>
    )
}

export default DirectorDetail