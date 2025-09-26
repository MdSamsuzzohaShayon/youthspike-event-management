import { IOption } from '@/types';
import React from 'react';

interface IEventFilterDialogProps {
  filterListEl: React.RefObject<HTMLDialogElement | null>;
  itemList: IOption[];
  onSelectItem: (e: React.SyntheticEvent, itemId: number) => void;
  onClose: (e: React.SyntheticEvent) => void;
}

function EventFilterDialog({ filterListEl, itemList, onSelectItem, onClose }: IEventFilterDialogProps) {
  return (
    <dialog ref={filterListEl} className="modal-dialog">
      <img src="/icons/close.svg" alt="close" className="w-6 svg-black" role="presentation" onClick={onClose} />
      {itemList.map((item) => (
        <p key={item.id} role="presentation" onClick={(e) => onSelectItem(e, item.id)}>
          {item.text}
        </p>
      ))}
    </dialog>
  );
}

export default EventFilterDialog;
