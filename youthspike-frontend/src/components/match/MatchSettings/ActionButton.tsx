// Sub-component: Action Button
const ActionButton = ({
    onClick,
    children,
    variant = "primary",
}: {
    onClick: (e: React.SyntheticEvent) => void;
    children: React.ReactNode;
    variant?: "primary" | "secondary";
}) => (
    <button
        onClick={onClick}
        className={`
        px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 active:scale-95
        ${variant === "primary"
                ? "bg-yellow-500 text-black-logo hover:bg-yellow-400 shadow-lg hover:shadow-yellow-500/25"
                : "bg-gray-700 text-white hover:bg-gray-600 border border-yellow-500/30"
            }
      `}
    >
        {children}
    </button>
);


export default ActionButton;