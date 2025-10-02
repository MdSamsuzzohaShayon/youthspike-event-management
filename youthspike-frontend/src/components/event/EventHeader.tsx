'use client'

import { useLdoId } from "@/lib/LdoProvider";
import { IEvent } from "@/types";
import { itemVariants } from "@/utils/animation";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const EventHeader = ({
  event,
}: {
  event: IEvent;
}) => {

  const {ldoIdUrl} = useLdoId();
  return (
  <motion.div
    className="text-center w-full flex flex-col items-center mb-6"
    variants={itemVariants}
  >
    <Link href={`/${ldoIdUrl}`}>
      <Image
        height={100}
        width={100}
        src="/free-logo.png"
        alt="youthspike-logo"
        className="w-48"
      />
    </Link>
    <h1 className="text-xl md:text-2xl font-bold mt-2">{event.name}</h1>
  </motion.div>
  );
};

export default EventHeader;
