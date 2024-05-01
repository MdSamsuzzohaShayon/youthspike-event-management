import { useUser } from '@/lib/UserProvider';
import { IEvent, IOption, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import SelectInput from '../elements/forms/SelectInput';
import { useMutation } from '@apollo/client';
import { DELETE_TEAM, MOVE_TEAM } from '@/graphql/teams';
import useClickOutside from '../../../hooks/useClickOutside';
import { useRouter } from 'next/navigation';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import TextImg from '../elements/TextImg';
import Image from 'next/image';
import { SEND_CREDENTIALS } from '@/graphql/event';

interface TeamCardProps {
    eventId: string;
    team: ITeam;
    eventList: IEvent[];
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    fefetchFunc?: () => Promise<void>;
}

interface ITeamMove {
    event: string;
    division: string;
}

function TeamCard({ team, eventId, eventList, setIsLoading, fefetchFunc }: TeamCardProps) {
    const user = useUser();
    const router = useRouter();

    const actionEl = useRef<null | HTMLUListElement>(null);

    const [actionOpen, setActionOpen] = useState<boolean>(false);
    const [openMoveTeam, setOpenMoveTeam] = useState<boolean>(false);
    const [eventOptions, setEventOptions] = useState<IOption[]>([]);
    const [divisionOptions, setDivisionOptions] = useState<IOption[]>([]);

    const [moveTeam, setMoveTeam] = useState<ITeamMove>({ event: '', division: '' });
    const [moveTeamMutation, { loading, data }] = useMutation(MOVE_TEAM);
    const [deleteTeam, { loading: dLoading, data: dData }] = useMutation(DELETE_TEAM);
    const [sendCredentials] = useMutation(SEND_CREDENTIALS);

    useClickOutside(actionEl, () => {
        setActionOpen(false);
    });


    /**
     * Handle Events
     */
    const selectEventInputChange = (e: React.SyntheticEvent) => {
        const inputEl = e.target as HTMLSelectElement;
        setMoveTeam((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
        if (inputEl.value === '') {
            setDivisionOptions([]);
        } else {
            const findEvent = eventList.find((e) => e._id === inputEl.value);
            if (findEvent) {
                console.log(findEvent);
                const divs = findEvent.divisions.split(',');
                const dl: IOption[] = [];
                for (let i = 0; i < divs.length; i++) {
                    if (divs[i].trim().toLowerCase() !== '') {
                        dl.push({ text: divs[i].trim().toLowerCase(), value: divs[i].trim() })
                    }
                }
                setDivisionOptions(dl);
            }
        }
    }

    const selectInputChange = (e: React.SyntheticEvent) => {
        const inputEl = e.target as HTMLSelectElement;
        setMoveTeam((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }

    const handleOpenAction = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setActionOpen(prevState => !prevState);
    }

    const handleOpenMoveTeam = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // Fetch team by team Id
        setActionOpen((prevState) => !prevState);
        setOpenMoveTeam(prevState => !prevState);
    }

    const handleSendCredential = async (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // Send captain credentials to the captain and co captain credentials to co captain
        try {
            setIsLoading(true);
            const res = await sendCredentials({ variables: { eventId, teamId } });
            if (fefetchFunc) await fefetchFunc();

        } catch (error) {
            console.log(error);

        } finally {
            setIsLoading(false);
        }
    }

    const handleEditTeam = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // Fetch team by team Id
        router.push(`/${eventId}/teams/${teamId}/update`);
    }

    const handleDeleteTeam = async (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        try {
            const dRes = await deleteTeam({ variables: { teamId } });
            console.log(dRes);

            if (fefetchFunc) await fefetchFunc();
        } catch (error) {
            console.log(error);

        }
    }

    const handleMakeInactive = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // Fetch team by team Id
        setOpenMoveTeam(prevState => !prevState);
    }

    const handleMoveTeam = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            if (moveTeam.event === '' || moveTeam.division === '') {
                console.log(moveTeam);
            } else {
                const moveTeamRes = await moveTeamMutation({ variables: { eventId: moveTeam.event, division: moveTeam.division, teamId: team._id } });
                console.log(moveTeamRes);

            }
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }


    useEffect(() => {
        if (eventList && eventList.length > 0) {
            const newEventList = eventList
                .filter(e => e._id !== eventId)
                .map(e => ({ text: e.name, value: e._id }));
            setEventOptions(newEventList);
        }
    }, [eventList]);




    return (
        <div className="team-card w-full">
            <div className="w-full  p-2 bg-gray-700 flex items-start justify-between relative rounded-lg">
                <ul ref={actionEl} className={`${actionOpen ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 right-3 z-10 rounded-lg`}>
                    <li role="presentation" onClick={(e) => handleEditTeam(e, team._id)} className='flex justify-start items-center gap-x-2' >
                        <span><Image width={20} height={20} src='/icons/edit.svg' alt='Edit-icon' className='svg-white' /></span>Edit</li>
                    <li role="presentation" onClick={(e) => handleOpenMoveTeam(e, team._id)} className='flex justify-start items-center gap-x-2' >
                        <span><Image width={20} height={20} src='/icons/move.svg' alt='Edit-icon' className='svg-white' /></span> Move Team</li>
                    <li role="presentation" onClick={(e) => handleSendCredential(e, team._id)} className='flex justify-start items-center gap-x-2' >
                        <span><Image width={20} height={20} src='/icons/send-email.svg' alt='Edit-icon' className='svg-white' /></span> {team?.sendCredentials ? "Resend Credential" : "Send Credential"}</li>
                    <li role="presentation" onClick={(e) => handleDeleteTeam(e, team._id)} className='flex justify-start items-center gap-x-2' >
                        <span><Image width={20} height={20} src='/icons/delete.svg' alt='Edit-icon' className='svg-white' /></span> Delete</li>
                    {/* <li role="presentation" onClick={(e) => handleMakeInactive(e, team._id)} className='flex justify-start items-center gap-x-2' >
                        <span><Image width={20} height={20} src='/icons/edit.svg' alt='Edit-icon' className='svg-white' /></span>Make Inactive</li> */}
                </ul>
                <div className="w-1/12 flex justify-center items-center flex-col gap-2">
                    <input type="checkbox" name="select-item" id="league-item" />
                    <p className='w-8 h-8 rounded-full bg-yellow-logo flex justify-center items-center text-gray-900'>{team.num}</p>
                </div>
                <div className="w-5/12">

                    <Link href={`/${eventId}/teams/${team._id}`}>
                        <div className="brand flex gap-1 items-center">
                            {team.logo
                                ? (<div className='advanced-img w-12'>
                                    <AdvancedImage cldImg={cld.image(team.logo)} alt={team.name} className="w-full" />
                                </div>) : <TextImg className='w-12 h-12' fullText={team.name} />}
                            <h3 className='leading-none text-lg font-bold capitalize'>{team.name}</h3>
                        </div>
                        {/* <p>2-1 Record</p> */}
                    </Link>
                </div>
                <div className="w-5/12">
                    <Link href={`/${eventId}/teams/${team._id}`}>
                        {team.captain && (
                            <div className="brand flex gap-1">
                                {team.captain?.profile
                                    ? <div className='advanced-img w-12 h-12 rounded-full border-2 border-yellow-logo'><AdvancedImage cldImg={cld.image(team.captain?.profile)} alt={team.captain.firstName} className="w-full" /></div>
                                    : <TextImg className='w-12 h-12 border-2 border-yellow-logo' fText={team.captain.firstName} lText={team.captain.lastName} />}

                                <div className="caption flex flex-col">
                                    <p className='uppercase text-xs'>Captain</p>
                                    <h3 className='leading-none text-lg font-bold'>{team.captain?.firstName + " " + team.captain?.lastName}</h3>
                                </div>
                            </div>
                        )}
                        {/* <p className='flex'><span><img src="/icons/telephone.svg" alt="telephone" className='w-6 svg-white' /></span>222-222-2222</p> */}
                        <p className='flex gap-1'>Active players <span className='flex items-center justify-center w-6 h-6 rounded-full bg-gray-900'>{team?.players?.length}</span></p>
                    </Link>
                </div>
                <div className="w-1/12">
                    <img src="/icons/dots-vertical.svg" alt="dots-vertical" role="presentation" onClick={handleOpenAction} className="w-6 svg-white" />
                </div>
            </div>
            {openMoveTeam && user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
                <div className="move-team w-full p-2 bg-gray-800 flex flex-col items-start justify-end relative">
                    <button className="close" onClick={(e) => setOpenMoveTeam(false)}><img src="/icons/close.svg" alt="" className="w-6 h-6 svg-white" /></button>
                    <form className="w-full" onSubmit={handleMoveTeam}>
                        <SelectInput handleSelect={selectEventInputChange} vertical name='event' optionList={eventOptions} />
                        <SelectInput handleSelect={selectInputChange} vertical name='division' optionList={divisionOptions} />
                        <button className="btn-info mt-4" type='submit'>Move</button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default TeamCard;