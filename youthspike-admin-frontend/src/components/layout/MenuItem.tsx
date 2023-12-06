import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

interface IMenuItem {
    icon: string;
    text: string;
    link: string;
    setOpenMenu: (isOpen: boolean) => void;
}

function MenuItem({ icon, text, link, setOpenMenu }: IMenuItem) {
    const router = useRouter();

    const pageRedirect = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setOpenMenu(false);
    }
    
    return (
        <li className='text-2xl' onClick={pageRedirect} >
            <Link href={link} className="flex justify-start items-center">
                <span><img src={icon} alt={text} className='w-6 svg-white mr-6' /></span>
                {text}
            </Link>
        </li>
    );
}

export default MenuItem;