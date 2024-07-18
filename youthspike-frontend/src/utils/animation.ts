export const commonAnimate = {
  initial: { opacity: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -200 },
  transition: { delay: 0.5, ease: 'easeInOut' },
};

export const logoAnimate = {
  initial: { ...commonAnimate.initial, y: -200 },
  animate: { ...commonAnimate.animate, y: 0 },
  exit: { ...commonAnimate.exit, y: -200 },
  transition: { ...commonAnimate.transition },
};

export const cardAnimate = {
  initial: { ...commonAnimate.initial, scale: 0.8 },
  animate: { ...commonAnimate.animate, scale: 1 },
  exit: { ...commonAnimate.exit, scale: 0 },
  transition: { ...commonAnimate.transition },
};

export const headingAnimate = {
  initial: { ...commonAnimate.initial, y: -200 },
  animate: { ...commonAnimate.animate, y: 0 },
  exit: { ...commonAnimate.exit, y: -200 },
  transition: { ...commonAnimate.transition },
};

export const msgAnimate = {
  initial: { ...commonAnimate.initial, y: -200 },
  animate: { ...commonAnimate.animate, y: 0 },
  exit: { ...commonAnimate.exit, y: -200 },
  transition: { ...commonAnimate.transition },
};

export const menuAnimate = {
  initial: { ...commonAnimate.initial, x: -200 },
  animate: { ...commonAnimate.animate, x: 0 },
  exit: { ...commonAnimate.exit, x: -200 },
  transition: { ...commonAnimate.transition, delay: 0 },
};

export const liAnimate = {
  initial: { ...commonAnimate.initial, x: -50 },
  animate: { ...commonAnimate.animate, x: 0 },
  exit: { ...commonAnimate.exit, x: -50 },
  transition: { ...commonAnimate.transition, delay: 0.7 },
};
