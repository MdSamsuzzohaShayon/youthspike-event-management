import React from 'react';
import { IMenuItem } from '@/types';
import MenuItem from './MenuItem';
import { getCookie } from '../../utils/cookie';
import { ADMIN_FRONTEND_URL } from '../../utils/keys';
import { getEvent } from '../../utils/localStorage';
import { adminMenuList } from '../../utils/staticData';

interface IMenuItemListProps {
  eventId: null | string;
  userMenuList: IMenuItem[];
  // eslint-disable-next-line no-unused-vars
  onClickMenuItem: (e: React.SyntheticEvent, id: string) => void;
}
const MenuItemList = ({ eventId, userMenuList, onClickMenuItem }: IMenuItemListProps) => {
  const newEventId = eventId || getEvent();

  let itemList = userMenuList;
  const instantToken = getCookie('token');
  if (instantToken && newEventId) {
    itemList = [...userMenuList, ...adminMenuList];
  }
  const menuItems: React.ReactNode[] = [];
  for (let i = 0; i < itemList.length; i += 1) {
    let newLink: string = itemList[i].link;
    if (newEventId && instantToken && itemList[i].admin) newLink = `${ADMIN_FRONTEND_URL}/${newEventId}/${itemList[i].link}`;
    menuItems.push(<MenuItem setOpenMenu={setOpenMenu} key={itemList[i].id} icon={`/icons/${itemList[i].imgName}.svg`} text={itemList[i].text} link={newLink} />);
  }

  return menuItems;
};


export default MenuItemList;
