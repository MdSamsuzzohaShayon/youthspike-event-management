export const commonAnimate = {
  initial: { opacity: 0, y: -200 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -200 },
  transition: { delay: 0.5 }
};

export const logoAnimate = structuredClone(commonAnimate);

export const cardAnimate ={
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { delay: 0.5 }
};



