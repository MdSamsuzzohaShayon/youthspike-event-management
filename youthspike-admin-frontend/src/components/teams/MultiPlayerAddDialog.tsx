import { IOption } from '@/types';
import React from 'react';
import MultiPlayerAdd from '../player/MultiPlayerAdd';


interface IMultiPlayerAddDialogProps{
    importerEl: React.RefObject<HTMLDialogElement | null>; 
    eventId: string; 
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>; 
    divisionList:  IOption[]
}

function MultiPlayerAddDialog({importerEl, eventId, setIsLoading, divisionList}: IMultiPlayerAddDialogProps) {

  return (
    <dialog ref={importerEl} className="modal-dialog">
        <div className="p-4">
          <div className="flex justify-end">
            <button 
              type="button" 
              className="bg-transparent text-white" 
              onClick={() => importerEl.current?.close()}
            >
              ✖
            </button>
          </div>
          <MultiPlayerAdd 
            eventId={eventId} 
            setIsLoading={setIsLoading} 
            closeDialog={() => importerEl.current?.close()} 
            divisionList={divisionList} 
          />
        </div>
      </dialog>
  )
}

export default MultiPlayerAddDialog;