const VSBadge = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-14 h-14 text-xl",
    lg: "w-16 h-16 text-2xl",
  };

  return (
    <div
      className={`bg-gradient-to-br from-yellow-400 to-yellow-500 text-black font-bold rounded-full flex items-center justify-center mx-auto shadow-lg ${sizeClasses[size]}`}
    >
      VS
    </div>
  );
};

export default VSBadge;