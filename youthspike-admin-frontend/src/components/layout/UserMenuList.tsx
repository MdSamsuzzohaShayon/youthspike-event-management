import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useLdoId } from '@/lib/LdoProvider';
import { useUser } from '@/lib/UserProvider';
import { IUserContext, UserRole } from '@/types/user';
import { getUserFromCookie } from '@/utils/cookie';

const listVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

function UserMenuList({ eventId }: { eventId: string }) {

  const { ldoIdUrl } = useLdoId();
  const user = useUser();


  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={listVariants}
      className="menu-list flex flex-wrap justify-center gap-x-4"
    >
      {(user?.info?.role === UserRole.director || user?.info?.role === UserRole.admin) && (
        <motion.li
          variants={itemVariants} className="capitalize text-center text-sm md:text-base"
        >
          <Link href="/" className="text-blue-500 hover:text-blue-700 transition-colors" > Home </Link>
        </motion.li>
      )}

      {eventId && <>
        <motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href={`/${eventId}/settings/${ldoIdUrl}`} className="text-blue-500 hover:text-blue-700 transition-colors" > Settings </Link></motion.li>
        {(user?.info?.role === UserRole.director || user?.info?.role === UserRole.admin) && (<>
          <motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href={`/${eventId}/teams/${ldoIdUrl}`} className="text-blue-500 hover:text-blue-700 transition-colors" > Teams </Link></motion.li>
          <motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href={`/${eventId}/groups/${ldoIdUrl}`} className="text-blue-500 hover:text-blue-700 transition-colors" > Groups </Link></motion.li>
        </>)}
        <motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href={`/${eventId}/players/${ldoIdUrl}`} className="text-blue-500 hover:text-blue-700 transition-colors" > Players </Link></motion.li>
        <motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href={`/${eventId}/matches/${ldoIdUrl}`} className="text-blue-500 hover:text-blue-700 transition-colors" > Matches </Link></motion.li>
      </>}
      {user?.info?.role === UserRole.director && (<motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href="/account" className="text-blue-500 hover:text-blue-700 transition-colors" > Account </Link></motion.li>)}

      {user?.info?.role === UserRole.admin && (<>
        <motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href="/admin" className="text-blue-500 hover:text-blue-700 transition-colors" > Admin </Link></motion.li>
        <motion.li variants={itemVariants} className="capitalize text-center text-sm md:text-base"><Link href="/admin/directors" className="text-blue-500 hover:text-blue-700 transition-colors" > LDOs </Link></motion.li>
      </>
      )}
    </motion.ul>
  );
}

export default UserMenuList;
