/* eslint-disable react/require-default-props */
import React from 'react';

interface ITextImg {
  className: string;
  fullText?: string;
  fText?: string;
  lText?: string;
  txtCls?: string;
  style?: React.CSSProperties;
}

function TextImg({ className, fullText, fText, lText, txtCls, style }: ITextImg) {
  const initFromFull = (ft: string) => {
    let initial = `${ft[0]}${ft[ft.length - 1]}`;
    if (ft.trim().includes(' ')) {
      initial = '';
      const wl = ft.split(' '); // wl = word list

      for (let i = 0; i < wl.length; i += 1) {
        if (wl[i].trim() !== '') {
          initial += wl[i][0];
        }
      }
    }
    return initial;
  };

  return (
    <div className={`text-black bg-yellow-logo flex justify-center items-center  ${className}`} style={style}>
      <p className={`uppercase ${txtCls || ''}`}>{fullText ? initFromFull(fullText) : fText && lText && `${fText[0]}${lText[0]}`}</p>
    </div>
  );
}

export default TextImg;
