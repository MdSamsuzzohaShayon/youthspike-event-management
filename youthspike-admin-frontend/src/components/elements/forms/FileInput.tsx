import React, { useEffect, useRef, useState } from 'react';
import { IFileFileProps, ITextInputProps } from '@/types';
import { CldImage } from 'next-cloudinary';

const FileInput = (props: IFileFileProps) => {
  const fileInputEl = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  /**
   * File Upload
   */
  const handleOpenImg = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!fileInputEl.current) return;
    fileInputEl.current.click();
  };

  const handleFileChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fileEl = e.target as HTMLInputElement;
    if (fileEl.files && fileEl.files.length > 0) {
      setFileName(fileEl.files[0].name);
    }

    props.handleFileChange(e);
  };



  return (
    <div className={`w-full flex flex-col gap-2 ${props.extraCls}`}>
      <label htmlFor={props.name} className={`text-sm font-semibold uppercase tracking-wide text-gray-300 ${props.vertical ? 'w-full' : ''} ${props.lw ? props.lw : ''}`}>
        {props.lblTxt ? props.lblTxt : props.name}
      </label>
      <div className="flex w-full items-center">
        <div className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 p-6 text-center hover:border-yellow-400">
          <p className="text-xs text-gray-400" role="presentation" onClick={handleOpenImg}>{(fileName && fileName !== '') ? fileName : 'Select a file to upload'}</p>
        </div>
        <input onChange={handleFileChange} id={props.name} name={props.name} className="hidden" ref={fileInputEl} type="file" />
      </div>
    </div>
  );
};

export default FileInput;