export const commonAnimate = {
    initial: { opacity: 0 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -200 },
    transition: { delay: 0.5, ease: "easeInOut" },
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


// Variants
export const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    hover: { x: 20, transition: { duration: 0.5 } },
};

export const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
};

export const menuVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -10 },
};

export const fadeInVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};


export const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const inputVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export const buttonVariants = {
    hover: { scale: 1.05, boxShadow: '0px 4px 15px rgba(255, 255, 0, 0.4)' },
    tap: { scale: 0.95 },
};

export const toastVariants = {
    hidden: { opacity: 0, y: -30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -30, scale: 0.95 },
};

export const tableVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
