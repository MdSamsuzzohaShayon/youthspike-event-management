import React, { useEffect, useState } from 'react';
import { ISelectInputProps } from '@/types';

const SelectInput = (props: ISelectInputProps) => {
  const selectStyle: React.CSSProperties = {};
  const [selectedValue, setSelectedValue] = useState<string>('');

  useEffect(() => {
    if (props.defaultValue !== undefined && selectedValue !== props.defaultValue.toString()) {
      setSelectedValue(props.defaultValue.toString());
    }
  }, [props.defaultValue, selectedValue]);

  if (!props.rw) selectStyle.width = '19%';

  return (
    <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : 'flex-row'} justify-between items-center ${props.extraCls}`}>
      {props.lblTxt && <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>{props.lblTxt ? props.lblTxt : props.name}</label>}

      <select
        onChange={props.handleSelect}
        name={props.name}
        id={props.name}
        className={`form-control capitalize  ${props.vertical ? 'w-full' : ''} ${props.rw} max-w-full`}
        style={!props.vertical ? selectStyle : {}}
        defaultValue={props.defaultValue?.toString()}  // Use props.defaultValue directly
      >
        <option value="" className='bg-gray-400 text-gray-700'>Select {props.name}</option>
        {props.optionList.map((o, i) => (
          <option value={o.value} key={i} className='bg-white text-gray-900'>{o.text ? o.text : o.value}</option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;