import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { IMenuItem } from '@/types';
import { getUserFromCookie } from '@/utils/cookie';
import { getEventIdFromPath, rearrangeMenu } from '@/utils/helper';
import { initialUserMenuList } from '@/utils/staticData';
import { useLdoId } from '@/lib/LdoProvider';

const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

function UserMenuList({ eventId }: { eventId: string }) {
  const pathname = usePathname();
  const { ldoIdUrl } = useLdoId();
  const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);

  useEffect(() => {
    const userDetail = getUserFromCookie();
    const eventPath = getEventIdFromPath(pathname);
    const menuItems = rearrangeMenu(userDetail, eventPath).map((mi) => ({
      ...mi,
      link: mi.id === 5 ? mi.link : `/${eventId}/${mi.link}/${ldoIdUrl}`,
    }));
    setUserMenuList(menuItems);
  }, [pathname]);

  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={listVariants}
      className="menu-list flex flex-wrap justify-center gap-4"
    >
      {userMenuList.map((item) => (
        <motion.li
          key={item.id}
          variants={itemVariants}
          className="capitalize text-center text-sm md:text-base"
        >
          <Link
            href={item.link}
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            {item.text}
          </Link>
        </motion.li>
      ))}
    </motion.ul>
  );
}

export default UserMenuList;
