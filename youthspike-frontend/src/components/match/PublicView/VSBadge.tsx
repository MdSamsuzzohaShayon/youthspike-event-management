const VSBadge = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-12 h-12 text-lg",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <div
      className={`bg-yellow-400 text-black font-bold rounded-full flex items-center justify-center mx-auto ${sizeClasses[size]}`}
    >
      VS
    </div>
  );
};

export default VSBadge;
