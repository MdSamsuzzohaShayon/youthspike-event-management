// ===================== Shared UI Components =====================
interface ITabButtonProps {
    active: boolean;
    label: string;
    onClick: () => void;
}

function TabButton({ active, label, onClick }: ITabButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active
                ? 'border-yellow-500 text-yellow-500'
                : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`}
        >
            {label}
        </button>
    );
}


export default TabButton;