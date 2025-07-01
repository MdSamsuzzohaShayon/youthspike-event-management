import UserMenuList from '@/components/layout/UserMenuList';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getAllGroups } from '@/app/_requests/groups';
import { notFound } from 'next/navigation';
import { divisionsToOptionList } from '@/utils/helper';
import GroupAddSidebar from '@/components/group/GroupAddSidebar';
import { TParams } from '@/types';


interface IGroupsPageProps{
    params: TParams;
}

async function GroupsPage({ params }: IGroupsPageProps) {
    const pathParams = await params;

    const eventGroups = await getAllGroups(pathParams.eventId);

    if (!eventGroups) {
      notFound();
    }


    const groupList = eventGroups?.groups || [];
    const divisionList = divisionsToOptionList(eventGroups.divisions) || [];
    

    return (
        <div className="min-h-screen container mx-auto px-6 text-center flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Event Groups</h1>
            {/* Event Menu Start */}
            <div className="event-and-menu">
            <CurrentEvent currEvent={eventGroups} />
                <div className="navigator mt-8">
                    <UserMenuList eventId={pathParams.eventId} />
                </div>
            </div>
            {/* Event Menu End */}

            <main className="container mx-auto py-10 flex flex-col lg:flex-row gap-10">
                {/* Sidebar */}
                <GroupAddSidebar divisionList={divisionList} eventId={pathParams.eventId} groupList={groupList} />
            </main>
        </div>
    );
}

export default GroupsPage;
