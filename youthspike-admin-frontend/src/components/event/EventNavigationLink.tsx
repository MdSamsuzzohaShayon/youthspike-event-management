import { UserRole, UserRoleFlags } from "@/types";
import { FRONTEND_URL } from "@/utils/keys";
import { LayoutGrid, Mail, Medal, Settings, Shield, Star, Swords, Users, Users2 } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";


interface NavigationItem {
    label: string;
    href: string;
    shouldShow: boolean;
    icon: React.ReactNode;
}






const getNavigationItems = (
    eventId: string,
    ldoIdUrl: string,
    userRoleFlags: UserRoleFlags,
    teamId: string | null
): NavigationItem[] => {
    const { isPlayer, isAdmin, isCaptain, isCoCaptain, isAdminOrDirector, isDirector } = userRoleFlags;
    const isRegularUser = isPlayer || isCaptain || isCoCaptain;
    const rosterPath = (isCaptain || isCoCaptain) && teamId
        ? `/teams/${teamId}/roster/${ldoIdUrl}`
        : `/${eventId}/players/${ldoIdUrl}`;

    return [
        {
            label: 'Settings',
            href: `/${eventId}/settings/${ldoIdUrl}`,
            shouldShow: true,
            icon: <Settings className="w-3 h-3" />,
        },
        {
            label: 'Teams',
            href: `/${eventId}/teams/${ldoIdUrl}`,
            shouldShow: !isRegularUser,
            icon: <Users2 className="w-3 h-3" />,
        },
        {
            label: 'Groups',
            href: `/${eventId}/groups/${ldoIdUrl}`,
            shouldShow: !isRegularUser,
            icon: <LayoutGrid className="w-3 h-3" />,
        },
        {
            label: 'Standings',
            href: `${FRONTEND_URL}/events/${eventId}/teams/${ldoIdUrl}`,
            shouldShow: !isPlayer,
            icon: <Medal className="w-3 h-3" />,
        },
        {
            label: 'Roster',
            href: rosterPath,
            shouldShow: true,
            icon: <Users className="w-3 h-3" />,
        },
        {
            label: 'Account',
            href: '/account',
            shouldShow: isDirector,
            icon: <Shield className="w-3 h-3" />,
        },
        {
            label: 'Templates',
            href: `/${eventId}/templates/${ldoIdUrl}`,
            shouldShow: isAdminOrDirector,
            icon: <Mail className="w-3 h-3" />,
        },
        {
            label: 'Matches',
            href: `/${eventId}/matches/${ldoIdUrl}`,
            shouldShow: true,
            icon: <Swords className="w-3 h-3" />,
        },
        {
            label: 'LDOs',
            href: '/admin/directors',
            shouldShow: isAdmin,
            icon: <Star className="w-3 h-3" />,
        },
    ];
};

const NavigationLink: React.FC<{ href: string; label: string; icon: React.ReactNode }> = ({
    href,
    label,
    icon
}) => (
    <Link href={href} className="group relative block">
        <div className="relative px-2.5 py-1.5 flex items-center gap-1.5">
            <span className="text-gray-500 group-hover:text-yellow-400 transition-colors duration-300">
                {icon}
            </span>
            <span className="text-[11px] font-medium text-gray-400 group-hover:text-white transition-all duration-300 whitespace-nowrap">
                {label}
            </span>
        </div>
    </Link>
);


const EventNavigationLink: React.FC<{
    eventId: string;
    ldoIdUrl: string;
    userRoleFlags: UserRoleFlags;
    teamId: string | null;
}> = ({ eventId, ldoIdUrl, userRoleFlags, teamId }) => {
    const navigationItems = useMemo(
        () => getNavigationItems(eventId, ldoIdUrl, userRoleFlags, teamId),
        [eventId, ldoIdUrl, userRoleFlags, teamId]
    );

    const visibleItems = useMemo(
        () => navigationItems.filter(item => item.shouldShow),
        [navigationItems]
    );

    if (visibleItems.length === 0) {
        return null;
    }

    console.log({eventId});
    

    return (
        <nav className="px-2 py-1">
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
                {visibleItems.map((item) => (
                    <div key={item.label} className="flex-shrink-0">
                        <NavigationLink
                            href={item.href}
                            label={item.label}
                            icon={item.icon}
                        />
                    </div>
                ))}
            </div>
        </nav>
    );
};


export default EventNavigationLink;