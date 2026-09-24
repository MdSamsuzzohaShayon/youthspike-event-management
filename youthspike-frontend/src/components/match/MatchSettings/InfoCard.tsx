// Sub-component: Info Card
const InfoCard = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={`bg-gradient-to-br from-gray-900 to-black-logo border border-yellow-500/30 rounded-xl p-4 shadow-lg ${className}`}
    >
        {children}
    </div>
);

export default InfoCard;