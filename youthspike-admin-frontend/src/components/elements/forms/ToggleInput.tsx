import { IToggleInputProps } from '@/types';
import React from 'react';



const ToggleInput = (props: IToggleInputProps) => {
  const dv = props.value ? props.value : false;
  return (
    <div className={`input-item mt-4 ${props.extraCls} ${props.widthCls ? props.widthCls : 'w-full'} flex justify-between items-center`}>
      <label htmlFor={props.name} className={`capitalize ${props.lw ? props.lw : ''}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
      <div className={`border border-yellow-400 ${dv === true ? 'bg-yellow-400' : 'bg-transparent'} outline-none px-2 rounded-full h-10 w-20 text-center flex items-center justify-between`}>
        {dv && <span>Off</span>}
        <button type="button" className='w-7 h-7 bg-gray-100 rounded-full' onClick={e=>props.handleValueChange(e, props.name)} ></button>
        {!dv && <span>On</span>}
      </div>
    </div>
  )
}

export default ToggleInput;