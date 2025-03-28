import { IEventAdd } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import TextInput from '../elements/forms/TextInput';
import { ApolloClient, useApolloClient, useMutation } from '@apollo/client';
import { GET_AN_EVENT, UPDATE_EVENT } from '@/graphql/event';
import { clickedInside } from '@/utils/helper';
import useClickOutside from '../../hooks/useClickOutside';
import InputField from '../elements/forms/InputField';


interface IShowDivisionsProps {
    update: boolean;
    dStr: string;
    prevDivisions: string;
    eventId: string | null;
    updateEvent: Partial<IEventAdd>;
    setEventState: React.Dispatch<React.SetStateAction<IEventAdd>>;
    setUpdateEvent: React.Dispatch<React.SetStateAction<Partial<IEventAdd>>>;
}


function ShowDivisions({ update, dStr, prevDivisions, eventId, updateEvent, setEventState, setUpdateEvent }: IShowDivisionsProps) {
    const [eventUpdate, { error: euErr }] = useMutation(UPDATE_EVENT);

    const addDivisionDialogEl = useRef<HTMLDialogElement | null>(null);
    const [updatedDivisions, setUpdatedDivisions] = useState(prevDivisions);
    const [originalItem, setOriginalItem] = useState<string | null>(null);
    const [addNew, setAddNew] = useState<boolean>(false);


    useClickOutside(addDivisionDialogEl, () => {
        if (addDivisionDialogEl.current) {
            addDivisionDialogEl.current.close();
        }
        setOriginalItem(null);
    });

    const refreshServer = async (newDivisions: string) => {
        const inputData = { ...updateEvent, divisions: newDivisions };
        const mutationVariables = {
            sponsorsInput: [],
            input: inputData,
            eventId
        };
        await eventUpdate({ variables: mutationVariables });
        // client.refetchQueries({
        //     include: [GET_A_EVENT],
        // });
    }

    const handleCutDivision = async (e: React.SyntheticEvent, item: string) => {
        e.preventDefault();
        if (!eventId) return;

        // Hit to backend

        const prevDivList = prevDivisions.split(',');
        const findTargetIndex = prevDivList.findIndex((d) => d.trim().toLowerCase() === item.trim().toLowerCase());
        if (findTargetIndex !== -1) {
            prevDivList.splice(findTargetIndex, 1);
        }
        const newDivisions = prevDivList.map(str => str.trim()).join(', ');
        setEventState((prevState) => ({ ...prevState, divisions: newDivisions }));
        if (update) {
            setUpdateEvent((prevState) => ({ ...prevState, divisions: newDivisions }));
        }

        setUpdatedDivisions(newDivisions);
        await refreshServer(newDivisions);

    }

    const handleInputChange = (e: React.SyntheticEvent) => {
        e.preventDefault();

        const inputEl = e.target as HTMLInputElement;
        let divisions = `${prevDivisions}, ${inputEl.value.trim()}`, updateDivs = `${prevDivisions}, ${inputEl.value.trim()}`;
        if (!addNew && originalItem) {
            // If it is updating make sure to have prev word with current work
            // Make word format like prev_new_u
            // find current work in new and prev
            const prevDivList = prevDivisions.split(',');
            const updateDivList = [...prevDivList];
            const prevItemIndex = prevDivList.findIndex((d) => d.trim().toLowerCase().includes(originalItem.trim().toLowerCase()));
            if (prevItemIndex !== -1) {
                let os = prevDivList[prevItemIndex].trim(), ns = inputEl.value.trim();
                if (prevDivList[prevItemIndex].includes('_')) {
                    os = prevDivList[prevItemIndex].split('_')[0].trim();
                }
                const formattedStr = `${os}_${ns}_u`;
                prevDivList[prevItemIndex] = inputEl.value.trim();
                updateDivList[prevItemIndex] = formattedStr;
            }
            divisions = prevDivList.map(str => str.trim()).join(', ');
            updateDivs = updateDivList.map(str => str.trim()).join(', ');
        }
        setEventState((prevState) => ({ ...prevState, divisions }));
        if (update) {
            setUpdateEvent((prevState) => ({ ...prevState, divisions: updateDivs }));
        }
        setUpdatedDivisions(updateDivs);
    }



    const handleAddDivision = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        // Make request to backend
        await refreshServer(updatedDivisions);

        if (addDivisionDialogEl.current) {
            addDivisionDialogEl.current.close();
        }
        setOriginalItem(null);
    }



    /**
     * Show and Close Modals
     */
    const handleShowEditDivision = (e: React.SyntheticEvent, item: string) => {
        e.preventDefault();

        setAddNew(false);
        if (addDivisionDialogEl.current) {
            addDivisionDialogEl.current.showModal();
        }

        const inputEl = document.getElementById("division-new");
        if (inputEl) {
            const inputElFound = inputEl as HTMLInputElement;
            inputElFound.value = item;
            setOriginalItem(item);
        }

    }

    const handleShowAddDivision = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setAddNew(true);
        if (addDivisionDialogEl.current) {
            addDivisionDialogEl.current.showModal();
        }

        const inputEl = document.getElementById("division-new");
        if (inputEl) {
            const inputElFound = inputEl as HTMLInputElement;
            inputElFound.value = "";
        }
    }

    const handleCloseModal = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (addDivisionDialogEl.current) {
            addDivisionDialogEl.current.close();
        }
        setOriginalItem(null);
    }


    if (!dStr.includes(',')) return <ul>{dStr}</ul>;
    const dList: string[] = dStr.split(',');
    const listEl: React.ReactNode[] = [];
    for (let i = 0; i < dList.length; i += 1) {
        if (dList[i].trim() !== '') {
            listEl.push(<li className='px-4 py-2 rounded-full bg-gray-800 flex items-center justify-between' key={dList[i] + '-' + i}>
                {dList[i]}
                {update && (
                    <React.Fragment>
                        <img className='w-4 h-4 svg-white ml-2' role="presentation" onClick={(e) => handleShowEditDivision(e, dList[i])} src='/icons/edit.svg' />
                        <img className='w-4 h-4 svg-white ml-2' role="presentation" onClick={(e) => handleCutDivision(e, dList[i])} src='/icons/close.svg' />
                    </React.Fragment>
                )}
            </li>);
        }
    }



    return <ul className='flex gap-1 flex-wrap mt-2'>
        {/* New division add start  */}
        <dialog ref={addDivisionDialogEl} className='w-4/6 bg-gray-800 text-gray-100 h-2/6 p-2' >
            <img src='/icons/close.svg' role="presentation" onClick={handleCloseModal} className='svg-white mt-2' />
            <InputField type='text' handleInputChange={handleInputChange} name='division-new' label={addNew ? "Add Division" : "Update Division"} required={false} />
            <button className='btn-info mt-4 text-center' onClick={handleAddDivision}>Ok</button>
        </dialog>
        {/* New division add end  */}

        {listEl}

        {update && (
            <li className='px-4 py-2 rounded-full bg-yellow-logo text-black flex items-center justify-between' role="presentation" onClick={handleShowAddDivision} >
                Add New
                <img className='w-4 h-4 svg-black ml-2' src='/icons/plus.svg' />
            </li>
        )}
    </ul>
}

export default ShowDivisions;