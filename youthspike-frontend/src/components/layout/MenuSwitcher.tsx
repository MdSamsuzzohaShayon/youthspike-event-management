'use client';

import { IAccessCode } from '@/types';
import AdminMenu from './AdminMenu';
import PublicMenu from './PublicMenu';
import { useUser } from '@/lib/UserProvider';


interface IMenuSwitcherProps{
  accessCodeList: IAccessCode[];
}
function MenuSwitcher({accessCodeList}: IMenuSwitcherProps) {

  const {info, token} = useUser();


  return <div className="MenuSwitcher">
    {token ? <AdminMenu info={info} token={token} /> : <PublicMenu accessCodeList={accessCodeList} />}
  </div>;
}

export default MenuSwitcher;
