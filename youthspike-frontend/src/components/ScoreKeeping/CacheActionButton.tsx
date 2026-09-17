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
  const buttonClass = "btn-info";
  
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