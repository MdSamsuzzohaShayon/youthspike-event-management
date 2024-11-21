import React from 'react';
import { ITextInputProps } from '@/types';
import { motion } from 'framer-motion';

const TextareaInput = (props: ITextInputProps) => {
  const dv = props.defaultValue || '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`input-group mt-4 w-full flex ${props.vertical ? 'flex-col' : ''} items-start gap-2 ${props.extraCls}`}
    >
      <label
        htmlFor={props.name}
        className={`capitalize font-medium ${props.vertical ? 'w-full' : props.lw}`}
      >
        {props.lblTxt || props.name}
      </label>
      <textarea
        onChange={props.handleInputChange}
        id={props.name}
        name={props.name}
        className="form-control border border-gray-300 rounded-lg py-2 px-4 w-full"
        defaultValue={dv}
        required={props.required}
      />
    </motion.div>
  );
};

export default TextareaInput;
