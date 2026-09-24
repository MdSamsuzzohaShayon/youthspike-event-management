import { useLdoId } from '@/lib/LdoProvider';
import { useAppSelector } from '@/redux/hooks';
import { IMatchRelatives } from '@/types'
import { ADMIN_FRONTEND_URL } from '@/utils/keys';
import Image from 'next/image'
import Link from 'next/link';
import React from 'react'



export const MenuItems = () => {

    const {
        colMenus,
        selectedColItem,
    } = useAppSelector((state) => ({
        colMenus: state.elements.colMenus,
        selectedColItem: state.elements.selectedColItem,
    }));

    const {
        match,
        myTeam,
    } = useAppSelector((state) => ({
        match: state.matches.match,
        myTeam: state.matches.myTeam
    }));


    const { ldoIdUrl } = useLdoId();

    return (
        <div className="space-y-3">
            {/* Menu Items - Plain JSX */}
            {/* Item 1 */}
            {match.fwango && (
                <div className="border border-yellow-500/30 rounded-xl overflow-hidden">
                    <a
                        href={match.fwango}
                        className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-900 to-black-logo hover:from-yellow-500/10 hover:to-yellow-500/5 transition-all duration-200"
                    >
                        <span className="text-white font-semibold capitalize">
                            Fwango
                        </span>
                        <Image
                            width={16}
                            height={16}
                            src="/icons/right-arrow.svg"
                            alt="arrow"
                            className={`w-4 h-4 svg-white transition-transform duration-200 ${selectedColItem === colMenus[0]?.title
                                    ? "rotate-90"
                                    : ""
                                }`}
                        />
                    </a>
                </div>
            )}

            {match?.streamUrl && match?.streamUrl !== "" && (
                <div className="border border-yellow-500/30 rounded-xl overflow-hidden">
                    <a
                        href={match.streamUrl}
                        className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-900 to-black-logo hover:from-yellow-500/10 hover:to-yellow-500/5 transition-all duration-200"
                    >
                        <span className="text-white font-semibold capitalize">
                            Stream Link
                        </span>
                        <Image
                            width={16}
                            height={16}
                            src="/icons/right-arrow.svg"
                            alt="arrow"
                            className={`w-4 h-4 svg-white transition-transform duration-200 ${selectedColItem === colMenus[0]?.title
                                    ? "rotate-90"
                                    : ""
                                }`}
                        />
                    </a>
                </div>
            )}

            {/* Item 2 */}
            <div className="border border-yellow-500/30 rounded-xl overflow-hidden">
                <Link
                    href={`${ADMIN_FRONTEND_URL}/${match.event}/matches/${match._id}`}
                    className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-900 to-black-logo hover:from-yellow-500/10 hover:to-yellow-500/5 transition-all duration-200"
                >
                    <span className="text-white font-semibold capitalize">
                        Edit Match
                    </span>
                    <Image
                        width={16}
                        height={16}
                        src="/icons/right-arrow.svg"
                        alt="arrow"
                        className={`w-4 h-4 svg-white transition-transform duration-200 ${selectedColItem === colMenus[1]?.title ? "rotate-90" : ""
                            }`}
                    />
                </Link>
            </div>

            {/* Item 3 */}
            {myTeam && (
                <div className="border border-yellow-500/30 rounded-xl overflow-hidden">
                    <Link
                        // href={`${ADMIN_FRONTEND_URL}/${match.event}/teams/${myTeam._id}`}
                        href={`${ADMIN_FRONTEND_URL}/teams/${myTeam._id}/roster/${ldoIdUrl}`}
                        // http://localhost:3000/teams/68cc71225901b0a2cdc15208/roster?ldoId=68afc4b20bf9dbb4ac0f6984
                        className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-900 to-black-logo hover:from-yellow-500/10 hover:to-yellow-500/5 transition-all duration-200"
                    >
                        <span className="text-white font-semibold capitalize">
                            Edit Roster
                        </span>
                        <Image
                            width={16}
                            height={16}
                            src="/icons/right-arrow.svg"
                            alt="arrow"
                            className={`w-4 h-4 svg-white transition-transform duration-200 ${selectedColItem === colMenus[2]?.title
                                    ? "rotate-90"
                                    : ""
                                }`}
                        />
                    </Link>
                </div>
            )}

            {/* Item 4 */}
            <div className="border border-yellow-500/30 rounded-xl overflow-hidden">
                <Link
                    href={`${ADMIN_FRONTEND_URL}/`}
                    className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-900 to-black-logo hover:from-yellow-500/10 hover:to-yellow-500/5 transition-all duration-200"
                >
                    <span className="text-white font-semibold capitalize">
                        Dashboard
                    </span>
                    <Image
                        width={16}
                        height={16}
                        src="/icons/right-arrow.svg"
                        alt="arrow"
                        className={`w-4 h-4 svg-white transition-transform duration-200 ${selectedColItem === colMenus[3]?.title ? "rotate-90" : ""
                            }`}
                    />
                </Link>
            </div>

            {/* Item 5 */}
            <div className="border border-yellow-500/30 rounded-xl overflow-hidden">
                <Link
                    href={`/events/${match.event}/matches`}
                    className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-gray-900 to-black-logo hover:from-yellow-500/10 hover:to-yellow-500/5 transition-all duration-200"
                >
                    <span className="text-white font-semibold capitalize">
                        Find Matches
                    </span>
                    <Image
                        width={16}
                        height={16}
                        src="/icons/right-arrow.svg"
                        alt="arrow"
                        className={`w-4 h-4 svg-white transition-transform duration-200 ${selectedColItem === colMenus[4]?.title ? "rotate-90" : ""
                            }`}
                    />
                </Link>
            </div>
        </div>
    )
}
