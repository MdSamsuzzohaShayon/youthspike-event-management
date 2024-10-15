import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

interface IMenuItem {
  icon: string;
  text: string;
  link: string;
  // eslint-disable-next-line no-unused-vars
  setOpenMenu: (isOpen: boolean) => void;
}

function MenuItem({ icon, text, link, setOpenMenu }: IMenuItem) {

  const pageRedirect = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setOpenMenu(false);
  };

  return (
    <li className="text-2xl capitalize" role="presentation" onClick={pageRedirect}>
      <Link href={link} className="flex justify-start items-center">
        <span>
          <Image height={20} width={20} src={icon} alt={text} className="w-6 svg-white mr-6" />
        </span>
        {text}
      </Link>
    </li>
  );
}

export default MenuItem;
