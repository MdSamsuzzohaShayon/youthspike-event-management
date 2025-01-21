import React, { useEffect, useState } from 'react';
import { ISelectInputProps } from '@/types';
import { motion } from 'framer-motion';
import { liAnimate } from '@/utils/animation';

const { initial: iInitial, animate: iAnimate, exit: iExit, transition: iTransition } = liAnimate;

const SelectInput = (props: ISelectInputProps) => {
  const selectStyle: React.CSSProperties = {};

  if (!props.rw) selectStyle.width = '19%';

  return (
    <div className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : 'flex-row'} justify-between items-center ${props.extraCls}`}>
      {props.lblTxt && (
        <label htmlFor={props.name} className={`capitalize ${props.vertical ? 'w-full' : ''} ${props.lw}`}>
          {props.lblTxt ? props.lblTxt : props.name}
        </label>
      )}

      <select
        onChange={props.handleSelect}
        name={props.name}
        id={props.name}
        className={`form-control capitalize ${props.vertical ? 'w-full' : ''} ${props.rw}`}
        style={!props.vertical ? selectStyle : {}}
        {...(props.defaultValue ? { defaultValue: props.defaultValue } : {})}
        {...(props.value ? { value: props.value } : {})}
      >
        <motion.option
          initial={iInitial}
          animate={iAnimate}
          exit={iExit}
          transition={iTransition}
          value=""
          className="bg-gray-400 text-gray-700"
        >
          Select {props.name}
        </motion.option>
        {props.optionList.map((o, i) => (
          <motion.option
            initial={iInitial}
            animate={iAnimate}
            exit={iExit}
            transition={iTransition}
            value={o.value}
            // style={{opacity: 1, transform: "none", width: "100%", whiteSpace: "normal", wordWrap: 'break-word', overflowWrap: "anywhere",}}
            key={i}
            className="bg-white text-gray-900 capitalize"
          >
            {o.text ? o.text : o.value}
          </motion.option>
        ))}
      </select>
    </div>
  );
};

export default SelectInput;
