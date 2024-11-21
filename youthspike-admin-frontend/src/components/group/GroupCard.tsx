import { useLdoId } from '@/lib/LdoProvider';
import { IGroup, IGroupExpRel } from '@/types';
import { imgSize } from '@/utils/style';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';

interface IGroupCardProps {
    group: IGroupExpRel;
}

function GroupCard({ group }: IGroupCardProps) {
    const { ldoIdUrl } = useLdoId();
    const [actionOpen, setActionOpen] = useState<boolean>(false);
    const params = useParams();

    const handleChangeStatus = (e: React.SyntheticEvent, isActive: boolean, groupId: string) => {
        e.preventDefault();
    };

    const handleDelete = (e: React.SyntheticEvent, groupId: string) => {
        e.preventDefault();
    };

    const handleMoveGroupBox = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    return (
        <div className="w-full bg-gray-900 text-white rounded-md shadow-md p-4 flex justify-between items-center gap-4">
            <div>
                <h3 className="text-lg font-semibold">{group.name}</h3>
                <p className="text-sm">Division: {group.division}</p>
                <p className="text-sm">Rule: {group.rule.toString().replaceAll(/_/g, " ")}</p>
                <p className={`text-sm ${group.active ? 'text-green-400' : 'text-red-400'}`}>
                    Status: {group.active ? 'Active' : 'Inactive'}
                </p>
                <p className="text-sm text-gray-400">Teams: {group.teams.length}</p>
            </div>

            {/* Operations Menu */}
            <div className="relative">
                <Image
                    width={imgSize.logo}
                    height={imgSize.logo}
                    src="/icons/dots-vertical.svg"
                    alt="options"
                    className="w-6 svg-white cursor-pointer"
                    onClick={(e) => setActionOpen(!actionOpen)}
                />
                {actionOpen && (
                    <ul className="absolute z-10 right-0 top-8 w-40 bg-gray-800 text-gray-200 rounded-md shadow-md">
                        <li className="hover:bg-gray-700 px-4 py-2 cursor-pointer">
                            <Link href={`/${params.eventId}/groups/${group._id}/update/${ldoIdUrl}`}>Edit</Link>
                        </li>
                        <li
                            onClick={handleMoveGroupBox}
                            className="hover:bg-gray-700 px-4 py-2 cursor-pointer"
                        >
                            Move Group
                        </li>
                        <li
                            onClick={(e) => handleChangeStatus(e, !group.active, group._id)}
                            className="hover:bg-gray-700 px-4 py-2 cursor-pointer"
                        >
                            {group.active ? 'Make Inactive' : 'Make Active'}
                        </li>
                        <li
                            onClick={(e) => handleDelete(e, group._id)}
                            className="hover:bg-red-600 px-4 py-2 cursor-pointer"
                        >
                            Delete
                        </li>
                    </ul>
                )}
            </div>
        </div>
    );
}

export default GroupCard;
