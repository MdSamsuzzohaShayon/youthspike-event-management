import ShowDivisions from '@/components/event/ShowDivisions';
import { DivisionInputProps } from '@/types';
import React, { useMemo, useState } from 'react'

function DivisionInputField({name, className, defaultValue, value}: DivisionInputProps) {
  const [divisions, setDivisions] = useState(defaultValue);
    const divisionList: string[] = useMemo(()=> {
      if(!divisions || divisions === '') return [];
        return divisions.split(',');
    }, [divisions]);

    // console.log('divisionList', divisionList);
    
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
        <h4 className='capitalize text-lg font-semibold mb-1'>Divisions</h4>
          
          {/* <ShowDivisions
           update={update}
           dStr={eventState.divisions}
           prevDivisions={prevEvent && prevEvent.divisions ? prevEvent.divisions : ''}
           setEventState={setEventState}
           setUpdateEvent={setUpdateEvent}
           eventId={eventId}
           updateEvent={updateEvent}
         /> */}
         <input type="text" 
         name={name}
         onChange={(e) => setDivisions(e.target.value)}
         className="w-full p-3 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400" {...(defaultValue && { defaultValue })}
                {...(value && { value })} />

                {divisionList.length > 0 && (<ul className='w-fit flex flex-wrap gap-2'>
                    {divisionList.map((item, index) => (
                        <li key={index} className='px-4 py-2 rounded-full bg-gray-800 flex items-center justify-between'>
                            {item}
                        </li>
                    ))}
                </ul>)}
         
    </div>
  )
}

export default DivisionInputField;