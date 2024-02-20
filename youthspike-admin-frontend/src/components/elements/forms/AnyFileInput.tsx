import React, { useEffect, useRef, useState } from 'react';
import { IAnyFileFileProps, IFileFileProps, ITextInputProps } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';

const AnyFileInput = (props: IAnyFileFileProps) => {
    const fileInputEl = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string>('');

    /**
     * File Upload
     */
    const handleFileChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const fileEl = e.target as HTMLInputElement;
        if (fileEl.files && fileEl.files.length > 0) {
            setFileName(fileEl.files[0].name);
        }

        props.handleFileChange(e);

    }


    return (
        <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : ''} justify-between items-center flex-wrap`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>{fileName ? fileName : props.name}</label>
            {/* <button className="form-control" type='button' onClick={handleOpen}>Upload</button> */}
            <input type="file" name="sponsor" id="sponsor" className='form-control' ref={fileInputEl} onChange={handleFileChange} />
        </div>
    );
}

export default AnyFileInput;


