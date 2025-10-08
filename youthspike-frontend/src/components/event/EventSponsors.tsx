import { itemVariants } from '@/utils/animation';
import { imgW } from '@/utils/constant';
import { APP_NAME } from '@/utils/keys';
import { motion } from 'motion/react';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import React from 'react'

const EventSponsors = ({ sponsors, userToken }: { sponsors: any[]; userToken: string | null; }) => {
    if (userToken || !sponsors?.length) return null;
    
    return (
      <motion.div className="mb-4 md:mb-6" variants={itemVariants}>
        <h3 className="mb-2 md:mb-4 text-md md:text-lg font-semibold text-center">Sponsors</h3>
        <div className="flex gap-2 md:gap-4 flex-wrap justify-center">
          <div className="w-12 md:w-20" key="default-logo">
            <Image
              width={imgW.xs}
              height={imgW.xs}
              src="/free-logo.png"
              alt={`${APP_NAME}-logo`}
            />
          </div>
          {sponsors.map((sponsor) => (
            <CldImage
              key={sponsor._id}
              alt={sponsor.company}
              width="200"
              height="200"
              crop="scale"
              className="w-12 md:w-20"
              src={sponsor.logo.toString()}
            />
          ))}
        </div>
      </motion.div>
    );
  };

export default EventSponsors