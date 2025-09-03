import { EArrowSize, ENDirection } from "@/types";
import Image from "next/image";

const NavArrow = ({
  direction,
  onClick,
  size = EArrowSize.MD,
  className = "",
}: {
  direction: ENDirection;
  onClick: (e: React.SyntheticEvent) => void;
  size?: EArrowSize;
  className?: string;
}) => {
  const sizeClasses = {
    [EArrowSize.SM]: "w-8 h-8",
    [EArrowSize.MD]: "w-12 h-12",
    [EArrowSize.LG]: "w-16 h-16",
  };

  return (
    <Image
      src="/icons/right-arrow.svg"
      alt={`${direction === ENDirection.PREV ? "Previous" : "Next"} Round`}
      height={40}
      width={40}
      className={`svg-white cursor-pointer hover:opacity-80 transition-opacity ${
        direction === ENDirection.PREV ? "transform rotate-180" : ""
      } ${sizeClasses[size]} ${className}`}
      onClick={onClick}
    />
  );
};

export default NavArrow;
