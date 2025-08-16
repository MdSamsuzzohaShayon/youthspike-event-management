import React, { useRef, useState } from 'react';
import { IEventSponsorAdd } from '@/types';
import Image from 'next/image';
import InputField from '../elements/forms/InputField';
import FileInput from '../elements/forms/FileInput';

interface SponsorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sponsor: IEventSponsorAdd) => void;
}

export default function SponsorDialog({ isOpen, onClose, onSave }: SponsorDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currSponsor, setCurrSponsor] = useState<IEventSponsorAdd>({ logo: null, company: null });

  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrSponsor(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setCurrSponsor(prev => ({ ...prev, logo: e.target.files![0] }));
  };

  const handleOk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currSponsor.company || !currSponsor.logo) {
      return false;
    }
    onSave(currSponsor);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} className="w-5/6" open={isOpen}>
      <div className="relative flex w-full flex-col rounded-2xl bg-gray-800 text-white">
        <button 
          type="button" 
          aria-label="Close" 
          className="absolute right-4 top-4 rounded-full p-1 transition-colors hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          onClick={onClose}
        >
          <Image width={20} height={20} src="/icons/close.svg" alt="close-icon" className="h-6 w-6 svg-white opacity-60" role="presentation" />
        </button>

        <div className="space-y-6 px-8 py-10">
          <InputField 
            type="text" 
            handleInputChange={handleFileNameChange} 
            name="company" 
            required 
            placeholder="e. g. Microsoft" 
          />

          <FileInput 
            handleFileChange={handleFileChange} 
            name="sponsorLogo" 
            vertical 
            lblTxt="Sponsor Logo" 
          />

          <button type="submit" className="w-full btn-info" onClick={handleOk}>
            Save Sponsor
          </button>
        </div>
      </div>
    </dialog>
  );
}