const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.97 },
};


export { itemVariants, cardVariants };
