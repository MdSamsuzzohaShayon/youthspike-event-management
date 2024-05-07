import { ILDOItem } from '@/types';
import DirectorRow from './DirectorRow';
import { useMutation } from '@apollo/client';
import { DELETE_DIRECTOR } from '@/graphql/director';
import { useRef, useState } from 'react';
import Image from 'next/image';

/**
 * React component that represent a list of directors
 */
interface IDirectorListProps{
    ldoList: ILDOItem[];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    referchFunc?: ()=> void;
}
function DirectorList({ ldoList, setIsLoading, referchFunc }: IDirectorListProps) {
    const [ldoIdToDelete, setLdoIdToDelete] = useState<string | null>(null);

    const [deleteDirector, { data }] = useMutation(DELETE_DIRECTOR);

    const dialogEl = useRef<HTMLDialogElement | null>(null);

    const handleDeleteLDO = (e: React.SyntheticEvent, ldoId: string) => {
        e.preventDefault();

        if (ldoId) {
            setLdoIdToDelete(ldoId);
            if (dialogEl.current) dialogEl.current.showModal();
        }
    }

    const handleCancel = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLdoIdToDelete(null);
        if (dialogEl.current) dialogEl.current.close();
    }

    const handleConfirmDelete = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (ldoIdToDelete) {
            try {
                setIsLoading(true);
                await deleteDirector({ variables: { dId: ldoIdToDelete } });
                setLdoIdToDelete(null);
                if (dialogEl.current) dialogEl.current.close();
                if(referchFunc) await referchFunc();
            } catch (error) {
                console.log(error);

            }finally{
                setIsLoading(false);
            }
        }
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full bg-transparent border shadow border-b border-gray-800">
                <thead>
                    <tr className='border-b border-gray-800 hover:bg-gray-800'>
                        <th className="py-2 px-4 uppercase" >Name</th>
                        <th className="py-2 px-4 uppercase" >Logo</th>
                        <th className="py-2 px-4 uppercase" >Director</th>
                        <th className="py-2 px-4 uppercase" >Director Email</th>
                        <th className="py-2 px-4 uppercase" >Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ldoList?.map((ldo: ILDOItem, i: number) => (
                        <DirectorRow key={i} ldo={ldo} handleDeleteLDO={handleDeleteLDO} />
                    ))}
                </tbody>
            </table>
            <dialog ref={dialogEl} className='w-5/6 mt-4 items-center '>
                <div className="dialog-wrapper flex flex-col justify-between gap-y-4">
                <div className="w-full flex justify-end">
                    <Image height={20} width={20} src="/icons/close.svg" alt='close-icon' role='presentation' onClick={handleCancel} className='w-6 h-6 svg-white' />
                </div>
                <h1>Are sure you want to delete the LDO?</h1>
                <div className="btn-group w-full flex gap-x-2">
                    <button className="btn-primary" onClick={handleConfirmDelete}>Yes</button>
                    <button className="btn-danger" type='button' onClick={handleCancel} >Cancel</button>
                </div>
                </div>
            </dialog>
        </div>
    );
};


export default DirectorList;