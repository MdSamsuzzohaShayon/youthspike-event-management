import Image from "next/image";

// Sub-component: Dialog Header
const DialogHeader = ({
    onClose,
}: {
    onClose: (e: React.SyntheticEvent) => void;
}) => (
    <div className="bg-black-logo w-full p-4 text-center relative">
        <button
            onClick={onClose}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-yellow-500/20 rounded-lg transition-colors"
        >
            <Image
                width={16}
                height={16}
                src="/icons/close.svg"
                alt="close"
                className="w-4 h-4 svg-white"
            />
        </button>
        <h3 className="text-white text-lg font-bold uppercase tracking-wide">
            Match Details
        </h3>
    </div>
);


export default DialogHeader;

