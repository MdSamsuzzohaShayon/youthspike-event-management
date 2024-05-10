import React, { useEffect, useRef, useState } from 'react';
import { IFileFileProps, ITextInputProps } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';

import 'react-image-crop/dist/ReactCrop.css'
import ReactCrop, { type Crop } from 'react-image-crop';
import croppedImage from '@/utils/croppedImage';

const CROPPABLE_IMAGE_HEIGHT = 300; // px

interface IImageSize {
    height: number;
    width: number;
}

const ImageInput = (props: IFileFileProps) => {
    const imageInputEl = useRef<HTMLInputElement>(null);
    const [fileUrl, setFileUrl] = useState<string>('');
    const [orginalImg, setOrginalImg] = useState<File | null>(null)
    const [fileName, setFileName] = useState<string>('');
    const [crop, setCrop] = useState<Crop>({
        unit: 'px', // Can be 'px' or '%'
        x: 25,
        y: 25,
        width: 100,
        height: 150
    });
    const dialogEl = useRef<HTMLDialogElement>(null);

    const openDialog = () => {
        if (dialogEl.current) dialogEl.current.showModal();
    }
    const closeDialog = () => {
        if (dialogEl.current) dialogEl.current.close();
    }



    /**
     * File Upload
     */
    const handleOpenImg = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!imageInputEl.current) return;
        imageInputEl.current.click();
    }

    const handleFileChange = (e: React.SyntheticEvent) => {
        e.preventDefault();
        const inputEl = e.target as HTMLInputElement;
        if (inputEl.files && inputEl.files.length > 0) {
            setFileUrl(URL.createObjectURL(inputEl.files[0]));
            setFileName(inputEl.files[0].name);
            props.handleFileChange({ uploadedImage: inputEl.files[0] });
            setOrginalImg(inputEl.files[0]);
            openDialog();
        }
    }


    // ===== Chop handle =====
    const handleCropSuccess = async (e: React.SyntheticEvent) => {
        const imgToCrop = document.getElementById("img-to-crop");
        // console.log({ height: imgToCrop?.clientHeight, width: imgToCrop?.clientWidth });
        // const oid = await orginalDimensions(orginalImg);
        // console.log(oid);
        

        if (crop) {
            console.log({ crop });

            const ci = await croppedImage(fileUrl, crop, fileName);
            setFileUrl(URL.createObjectURL(ci));
        }
        closeDialog();

    }

    const handleCropCancel = async (e: React.SyntheticEvent) => {
        closeDialog();
    }

    const handleCropChange = async (c: Crop) => {
        setCrop(c);
        if (c.width && c.height) {
            const croppedImageUrl = await croppedImage(fileUrl, c, fileName);
            props.handleFileChange({ uploadedImage: croppedImageUrl });
        }

    }

    // Check default value 
    const renderImage = () => {
        let imgEl: null | HTMLImageElement | React.ReactNode = null;
        if (!fileName || fileName === '') {
            if (props.defaultValue && typeof props.defaultValue === 'string') {
                imgEl = <AdvancedImage className='w-full object-cover object-center' cldImg={cld.image(props.defaultValue)} />
            }
        } else {
            if (fileUrl && fileUrl !== '') {
                imgEl = <img src={fileUrl} alt='file-upload' className='w-full' />
            }
        }
        return imgEl;
    }


    return (
        <div className={`w-full ${props.extraCls}`}>
            <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw ? props.lw : ''}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
            <div className={`input-group w-full flex ${props.vertical ? 'flex-col' : ''} justify-between items-center flex-wrap`}>
                <div className="w-full flex justify-between gap-2">
                    <div className='w-3/6'>
                        {renderImage()}

                    </div>
                    <div className="btn-text w-full flex flex-col w-3/6 justify-center gap-2">
                        {fileName && <p>{fileName}</p>}
                        <button className={`btn-secondary h-fit flex justify-center items-center gap-2`} onClick={handleOpenImg} >File Upload
                            <img src='/icons/upload.svg' alt='upload' className='w-6 svg-white' />
                        </button>
                    </div>
                </div>
                <input onChange={handleFileChange}
                    id={props.name} name={props.name}
                    className="hidden" ref={imageInputEl}
                    type="file"
                />
            </div>

            <dialog ref={dialogEl} className='w-5/6'>
                <div className="w-full flex justify-center items-center flex-col gap-y-2">
                    <ReactCrop crop={crop} onChange={handleCropChange}><img id='img-to-crop' src={fileUrl} alt='file-upload w-full' /></ReactCrop>
                    <div className="button-groups flex gap-x-2">
                        <button className="btn-primary" type='button' onClick={handleCropSuccess}>Ok</button>
                        <button className="btn-danger" type='button' onClick={handleCropCancel}>Cancel</button>
                    </div>
                </div>
            </dialog>
        </div>
    )
}

export default ImageInput;


