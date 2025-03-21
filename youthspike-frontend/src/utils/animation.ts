export const commonAnimate = {
  initial: { opacity: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -200 },
  transition: { delay: 0.5, ease: 'easeInOut' },
};





export const menuBackdropVariants = {
  visible: { opacity: 1, transition: { duration: 0.3 } },
  hidden: { opacity: 0, transition: { duration: 0.3 } },
};

export const menuVariants = {
  hidden: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
  visible: { x: '0', opacity: 1, transition: { duration: 0.3 } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.3 } },
};

// Variants for animations
export const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, when: 'beforeChildren', staggerChildren: 0.2 } },
};

export const itemVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  hover: { x: 20, transition: { duration: 0.5 } },
};

export const hoverVariants = {
  hover: { scale: 1.1, transition: { type: 'spring', stiffness: 300 } },
};

export const buttonVariants = {
  hover: { scale: 1.1, transition: { type: 'spring', stiffness: 300 } },
};

// Framer Motion Animation Variants
export const toastVariants = {
  hidden: { opacity: 0, y: -30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -30, scale: 0.95 },
};


export const tableVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const rowVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: () => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.1 },
  }),
};

// Animation variants
export const netCardVariant = {
  enterFromRight: {
    opacity: 0,
    x: 300,
  },
  enterFromLeft: {
    opacity: 0,
    x: -300,
  },
  center: {
    opacity: 1,
    x: 0,
  },
  exitToRight: {
    opacity: 0,
    x: 300,
  },
  exitToLeft: {
    opacity: 0,
    x: -300,
  },
};