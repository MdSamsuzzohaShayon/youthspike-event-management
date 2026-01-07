import { IError, IEvent, IEventExpRel, IResponse } from '@/types';
import React, { useEffect, useState } from 'react';
import InputField from '../elements/forms/InputField';
import DateInput from '../elements/forms/DateInput';
import { useMutation } from '@apollo/client/react';
import { CLONE_EVENT } from '@/graphql/event';
import { useRouter } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';

interface ICloneEventData extends IResponse {
  data?: IEventExpRel;
}

interface IProps {
  event: null | IEvent;
  copyEventEl: React.RefObject<HTMLDialogElement | null>;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>; // Setting action error
}
function CloneEventDialog({ copyEventEl, event, setActErr }: IProps) {
  // Hook
  const [cloneEvent] = useMutation<{ cloneEvent: ICloneEventData }>(CLONE_EVENT);
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();

  // Local State
  const [partialEvent, setPartialEvent] = useState<null | Partial<IEvent>>(null);

  // Event handlers
  const handleDateChange = (name: string, value: string) => {
    setPartialEvent((prev) => ({ ...prev, [name]: value }));
  };


  const handleInputChange=(e: React.SyntheticEvent)=>{
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setPartialEvent((prev)=> ({...prev, [inputEl.name]: inputEl.value}));
  }

  const handleCopyEvent = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!event) {
      console.error('Event not found!');
      return;
    }
    const eventResponse = await cloneEvent({ variables: { eventId: event?._id, updateInput:  partialEvent} });

    if (eventResponse.data?.cloneEvent.success !== true) {
      console.error(eventResponse);
      setActErr({ code: eventResponse.data?.cloneEvent.code, message: eventResponse.data?.cloneEvent.message, success: false });
      copyEventEl.current?.close();
      return;
    }
    // return router.push(`/${eventResponse?.data?.cloneEvent?.data?._id || ""}/settings/${ldoIdUrl}`);
    router.push(`/${ldoIdUrl}`);
  };



  return (
    <dialog ref={copyEventEl} className="modal-dialog">
      <div className="p-4 flex flex-col gap-y-2">
        <h3>Selected Event: {event?.name}</h3>
        <form onSubmit={handleCopyEvent} className='flex flex-col gap-y-6'>
          <InputField name="name" type="text" defaultValue={event?.name || ''} handleInputChange={handleInputChange} />
          <InputField name="description" type="textarea"  defaultValue={event?.description || ''} />
          <InputField name="location" type="text"  defaultValue={event?.location || ''} />
          <DateInput label="Start Date" name="startDate" handleDateChange={handleDateChange} defaultValue={event?.startDate} required={true} />
          <DateInput label="End Date" name="endDate" handleDateChange={handleDateChange} defaultValue={event?.endDate} required={true} />
          <div className="btn-group flex flex gap-x-2">
            <button type="submit" className="btn-info">
              Copy
            </button>
            <button type="button" className="btn-danger" onClick={()=> copyEventEl.current?.close()}>
              cancel
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

export default CloneEventDialog;
