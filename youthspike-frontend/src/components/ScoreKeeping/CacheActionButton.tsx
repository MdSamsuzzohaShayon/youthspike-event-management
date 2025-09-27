import React from 'react';

interface CacheActionButtonsProps {
  onTogglePreview: () => void;
  onUpdateScore: () => void;
  onReset: () => void;
  showActionPreview: boolean;
}

export default function CacheActionButtons({
  onTogglePreview,
  onUpdateScore,
  onReset,
  showActionPreview,
}: CacheActionButtonsProps) {
  const buttonClass = "inline-block text-sm px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold shadow-md hover:bg-yellow-300 transition";
  
  if (!showActionPreview) return null;
  
  return (
    <div className="mt-6 flex justify-center items-center gap-x-2">
      <button onClick={onTogglePreview} type="button" className={buttonClass}>
        Server/Receiver
      </button>
      <button onClick={onUpdateScore} type="button" className={buttonClass}>
        Update score
      </button>
      <button onClick={onReset} className={buttonClass}>
        Reset
      </button>
    </div>
  );
}