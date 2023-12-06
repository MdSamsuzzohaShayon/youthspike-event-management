import React, { useEffect, useRef, useState } from 'react';
import { IFileFileProps, ITextInputProps } from '@/types';

const FileInput = (props: IFileFileProps) => {
    const fileInputEl = useRef<HTMLInputElement>(null);
    const [fileUrl, setFileUrl] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');

    /**
     * File Upload
     */
    const handleOpenImg = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!fileInputEl.current) return;
        fileInputEl.current.click();
    }

    const handleFileChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const fileEl = e.target as HTMLInputElement;
        console.log(fileEl.files, fileEl);
        if (fileEl.files && fileEl.files.length > 0) {
            setFileUrl(URL.createObjectURL(fileEl.files[0]));
            setFileName(fileEl.files[0].name);
        }

        props.handleFileChange(e);

    }


    return (
        <>
            <h4 className="capitalize w-full mt-4" >{props.lblTxt ? props.lblTxt : props.name}</h4>
            <div className={`input-group w-full flex ${props.vertical ? 'flex-col' : ''} justify-between items-center flex-wrap ${props.extraCls}`}>
                {/* <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>{fileName ? fileName : props.name}</label> */}
                <div className="w-full flex justify-between gap-2">
                    <button className={`btn-secondary h-fit flex justify-center items-center gap-2`} onClick={handleOpenImg} >{fileName ? fileName : 'File Upload'}
                        <img src='/icons/upload.svg' alt='upload' className='w-6 svg-white' />
                    </button>
                    {(fileUrl && fileUrl !== '') && <img src={fileUrl} alt='file-upload' className='w-2/6' />}
                </div>
                <input onChange={handleFileChange}
                    id={props.name} name={props.name}
                    className="hidden" ref={fileInputEl}
                    type="file"
                />
            </div>
        </>
    )
}

export default FileInput;


