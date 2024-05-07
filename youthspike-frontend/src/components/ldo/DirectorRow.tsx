import cld from '@/config/cloudinary.config';
import { ILDOItem } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import Link from 'next/link';
import React from 'react';

function DirectorRow({ ldo }: { ldo: ILDOItem }) {
  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800 hover:bg-gray-700">
      <td className="py-2 px-4 capitalize">{ldo.name}</td>
      <td className="py-2 px-4 capitalize">{ldo?.logo ? <AdvancedImage className="w-8" cldImg={cld.image(ldo?.logo)} /> : ''}</td>
      <td className="py-2 px-4 capitalize break-words">
        {ldo.director?.firstName} {ldo.director?.lastName}
      </td>
      <td className="py-2 px-4 lowercase">{ldo.director?.email}</td>
      <td className="py-2 px-4 capitalize flex justify-center items-center gap-2">
        <Link href={`/ldos/${ldo._id}`} className="btn-info flex justify-center items-center">
          Details
        </Link>
      </td>
    </tr>
  );
}

export default DirectorRow;
