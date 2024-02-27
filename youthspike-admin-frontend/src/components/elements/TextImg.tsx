import React from 'react';

interface ITextImg{
    className: string;
    fullText?: string;
    fText?: string;
    lText?: string;
    txtCls?: string;
}

function TextImg({className, fullText, fText, lText, txtCls}: ITextImg) {

  return (
    <div className={`text-white bg-yellow-500 flex justify-center items-center rounded-full ${className}`} >
        <p className={`uppercase ${txtCls ? txtCls : ''}`}>
            {fullText 
            ? `${fullText[0]}${fullText[fullText.length - 1]}`
            : (fText && lText && `${fText[0]}${lText[0]}`)}
        </p>
    </div>
  )
}

export default TextImg