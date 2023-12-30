import { IMenuArrangeProps, IMenuItem, IUser, IUserContext } from '@/types';
import React from 'react';


const MenuArrange = ({ eventId, closeMenuHandler, renderMenuItems, userMenuList, user }: IMenuArrangeProps) => {
    return (
        <div className='md:flex md:justify-between md:items-center md:h-20'>
            <div className="w-full flex md:hidden justify-end items-center">
                <button onClick={closeMenuHandler} className='close-button'>
                    <img src='/icons/close.svg' className='w-10 svg-white' alt='close' role="presentation" />
                </button>
            </div>
            <div className="league-director w-full flex justify-between items-center mb-8">
                <img src="/free-logo.svg" alt="" className="w-2/6" />
                <h1 className='text-2xl'>LDO Name</h1>
            </div>
            {eventId && (
                <div className="league mb-8 w-full">
                    <h2 className='text-xl'>League Name</h2>
                </div>
            )}
            <ul className='menu-list flex justify-start flex-col md:flex-row gap-8'>
                {renderMenuItems(eventId, userMenuList)}
                {(user && user.token && user.token !== '') && <li><button className="bg-red-700 text-red-100 font-bold p-2" onClick={handleLogout}>Logout</button></li>}
            </ul>
        </div>
    )
}

export default MenuArrange