import { IEventPageProps } from '@/types';
import UserMenuList from '@/components/layout/UserMenuList';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getAllGroups } from '@/app/_requests/groups';
import { notFound } from 'next/navigation';
import { divisionsToOptionList } from '@/utils/helper';
import GroupAddSidebar from '@/components/group/GroupAddSidebar';



async function GroupsPage({ params }: IEventPageProps) {

    const eventGroups = await getAllGroups(params.eventId);

    if (!eventGroups) {
      notFound();
    }


    const groupList = eventGroups?.groups || [];
    const divisionList = divisionsToOptionList(eventGroups.divisions) || [];
    

    return (
        <div className="min-h-screen container mx-auto px-6 text-center flex flex-col">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Event Groups</h1>
            {/* Event Menu Start */}
            <div className="event-and-menu p-8 rounded-lg shadow-lg">
            <CurrentEvent currEvent={eventGroups} />
                <div className="navigator mt-8">
                    <UserMenuList eventId={params.eventId} />
                </div>
            </div>
            {/* Event Menu End */}

            <main className="container mx-auto py-10 flex flex-col lg:flex-row gap-10">
                {/* Sidebar */}
                <GroupAddSidebar divisionList={divisionList} eventId={params.eventId} groupList={groupList} />
            </main>
        </div>
    );
}

export default GroupsPage;
