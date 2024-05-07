import { ILDOItem } from '@/types';
import DirectorRow from './DirectorRow';

/**
 * React component that represent a list of directors
 */
function DirectorList({ ldoList }: { ldoList: ILDOItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-transparent border shadow border-b border-gray-700">
        <thead>
          <tr className="border-b border-gray-700 hover:bg-gray-700">
            <th className="py-2 px-4 capitalize">Name</th>
            <th className="py-2 px-4 capitalize">Logo</th>
            <th className="py-2 px-4 capitalize">Director</th>
            <th className="py-2 px-4 capitalize">Director Email</th>
            <th className="py-2 px-4 capitalize">Actions</th>
          </tr>
        </thead>
        <tbody>{ldoList?.map((ldo: ILDOItem, i: number) => <DirectorRow key={i} ldo={ldo} />)}</tbody>
      </table>
    </div>
  );
}

export default DirectorList;
