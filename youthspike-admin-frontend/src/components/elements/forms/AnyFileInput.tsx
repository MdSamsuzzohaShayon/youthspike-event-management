import React, { useRef, useState } from 'react';
import { IAnyFileFileProps } from '@/types';

function AnyFileInput({ name, lw, vertical, handleFileChange }: IAnyFileFileProps) {
  const fileInputEl = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  /**
   * File Upload
   */
  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fileEl = e.target as HTMLInputElement;
    if (fileEl.files && fileEl.files.length > 0) {
      setFileName(fileEl.files[0].name);
    }

    handleFileChange(e);
  };

  return (
    <div className={`input-group mt-4 w-full flex ${vertical ? 'flex-col' : ''} justify-between items-center flex-wrap`}>
      <label htmlFor={name} className={`capitalize ${vertical ? 'w-full' : ''} ${lw}`}>
        {fileName || name}
      </label>
      {/* <button className="form-control" type='button' onClick={handleOpen}>Upload</button> */}
      <input type="file" name="sponsor" id="sponsor" className="form-control" ref={fileInputEl} onChange={handleInputChange} />
    </div>
  );
}

export default AnyFileInput;
