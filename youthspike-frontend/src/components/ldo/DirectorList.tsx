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
        <div>
            <h2>Direstor List</h2>
            <div className="overflow-x-auto">
                <table className="w-full bg-transparent border shadow">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 capitalize" >Name</th>
                            <th className="py-2 px-4 capitalize" >Logo</th>
                            <th className="py-2 px-4 capitalize" >Director</th>
                            <th className="py-2 px-4 capitalize" >Director Email</th>
                            <th className="py-2 px-4 capitalize" >Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ldoList?.map((ldo: ILDOItem, i: number) => (
                            <DirectorRow key={i} ldo={ldo} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default DirectorList;