import { notFound } from 'next/navigation';
import Link from 'next/link';
import { GET_SYSTEM_DETAILS_RAW } from '@/graphql/director';
import { BACKEND_URL } from '@/utils/keys';

async function fetchSystemDetails() {
  // const token = getCookie('token');
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Authorization: `Bearer ${token}`, // Ensure API token is stored securely
    },
    body: JSON.stringify({
      query: GET_SYSTEM_DETAILS_RAW,
    }),
    cache: 'no-store', // Adjust caching as needed
  });

  const { data } = await res.json();
  if (!data?.getSystemDetails?.data) notFound();
  
  const { ldos, events, players, matches, teams } = data.getSystemDetails.data;
  return [ldos, events, players, matches, teams];
}

export default async function AdminPage() {
  const [ldos, events, players, matches, teams] = await fetchSystemDetails();



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
