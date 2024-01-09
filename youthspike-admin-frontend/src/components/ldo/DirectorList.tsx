import { ILDOItem } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import { useRouter } from 'next/navigation';
import DirectorRow from './DirectorRow';

/**
 * React component that represent a list of directors
 */
function DirectorList({ ldoList }: { ldoList: ILDOItem[] }) {

    return (
        <div className="overflow-x-auto">
            <table className="w-full bg-transparent border shadow border-b border-gray-800">
                <thead>
                    <tr className='border-b border-gray-800 hover:bg-gray-800'>
                        <th className="py-2 px-4 uppercase" >Name</th>
                        <th className="py-2 px-4 uppercase" >Logo</th>
                        <th className="py-2 px-4 uppercase" >Director</th>
                        <th className="py-2 px-4 uppercase" >Director Email</th>
                        <th className="py-2 px-4 uppercase" >Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ldoList?.map((ldo: ILDOItem, i: number) => (
                        <DirectorRow key={i} ldo={ldo} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};


export default DirectorList;