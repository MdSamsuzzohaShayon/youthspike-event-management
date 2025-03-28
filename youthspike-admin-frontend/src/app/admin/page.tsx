import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSystemDetails } from '../_requests/system';


export default async function AdminPage() {
  const systemDetail = await getSystemDetails()

  if (!systemDetail) notFound();
    
  const { ldos, events, players, matches, teams } = systemDetail;



  return (
    <div className="container mx-auto px-4 min-h-screen">
      <h1 className="mt-4 text-center">ASL - Admin</h1>
      <div className="boxes flex justify-center items-center flex-wrap w-full gap-2 mt-4">
        <Link
          href={`/admin/directors`}
          className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center"
        >
          <h4>Directors</h4>
          <p>{ldos}</p>
        </Link>
        <>
          <Link
            href={`/admin/events`}
            className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center"
          >
            <h4>Events</h4>
            <p>{events}</p>
          </Link>
          <Link
            href={`/admin/players`}
            className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center"
          >
            <h4>Players</h4>
            <p>{players}</p>
          </Link>
          <Link
            href={`/admin/matches`}
            className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center"
          >
            <h4>Matches</h4>
            <p>{matches}</p>
          </Link>
          <Link
            href={`/admin/teams`}
            className="box box-1 w-3/12 bg-gray-800 px-2 md:px-4 py-2 rounded-lg text-center"
          >
            <h4>Teams</h4>
            <p>{teams}</p>
          </Link>
        </>
      </div>
    </div>
  );
}
