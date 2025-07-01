import React, { useEffect, useRef, useState } from 'react';
import { IFileFileProps, ITextInputProps } from '@/types';
import { CldImage } from 'next-cloudinary';

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
        if (fileEl.files && fileEl.files.length > 0) {
            setFileUrl(URL.createObjectURL(fileEl.files[0]));
            setFileName(fileEl.files[0].name);
        }

        props.handleFileChange(e);

    }

    // Check default value 
    const renderImage = () => {
        let imgEl: null | HTMLImageElement | React.ReactNode = null;
        if (!fileName || fileName === '') {
            if (props.defaultValue && typeof props.defaultValue === 'string') {
                imgEl = (
                    <CldImage width={100} height={100} 
                        className='w-32 h-32 object-cover object-center'
                        src={props.defaultValue}
                        sizes="100vw"
                        alt="Description of my image"
                    />
                );
            }
        } else {
            if (fileUrl && fileUrl !== '') {
                imgEl = <img src={fileUrl} alt='file-upload' className='w-32 h-32 object-cover object-center' />;
            }
        }
        return imgEl;
    }


    return (
        <div className={`w-full ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw ? props.lw : ''}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <div className={`input-group w-full flex ${props.vertical ? 'flex-col' : ''} justify-between items-center flex-wrap`}>
                {/* <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>{fileName ? fileName : props.name}</label> */}
                <div className="w-full flex justify-between gap-2">
                    <div className='w-3/6'>
                        {renderImage()}
                    </div>
                    <div className="btn-text w-full flex flex-col w-3/6 justify-center gap-2">
                        {fileName && <p>{fileName}</p>}
                        <button className={`btn-primary w-fit h-fit flex justify-center items-center gap-2`} onClick={handleOpenImg} >File Upload
                            <img src='/icons/upload.svg' alt='upload' className='w-6 svg-black' />
                        </button>
                    </div>
                </div>
                <input onChange={handleFileChange}
                    id={props.name} name={props.name}
                    className="hidden" ref={fileInputEl}
                    type="file"
                />
            </div>
        </div>
    )
}

export default FileInput;


