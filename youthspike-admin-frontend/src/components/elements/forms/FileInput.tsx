import React, { useRef, useState } from 'react';
import { IFileFileProps } from '@/types';

const FileInput = (props: IFileFileProps) => {
  const fileInputEl = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  /**
   * File Upload
   */
  const handleOpenImg = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 👈 stop bubbling up to <dialog>
    if (!fileInputEl.current) return;
    fileInputEl.current.click();
  };

  const handleFileChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 👈 stop bubbling up
    const fileEl = e.target as HTMLInputElement;
    if (fileEl.files && fileEl.files.length > 0) {
      setFileName(fileEl.files[0].name);
    }

    props.handleFileChange(e);
  };

  return (
    <div className={`w-full flex flex-col gap-2`}>
      <label htmlFor={props.name} className={`text-sm font-semibold uppercase tracking-wide text-gray-300 w-full`}>
        {props.label || props.name}
      </label>
      <div className="flex w-full items-center">
        <div className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 p-6 text-center hover:border-yellow-400">
          <button type="button" className="text-xs text-gray-400" onClick={handleOpenImg}>
            {fileName && fileName !== '' ? fileName : 'Select a file to upload'}
          </button>
        </div>
        <input onChange={handleFileChange} id={props.name} name={props.name} className="hidden" ref={fileInputEl} type="file" />
      </div>
    </div>
  );
};

export default FileInput;
