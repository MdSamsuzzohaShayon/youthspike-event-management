import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSystemDetails } from '../_requests/system';

export default async function AdminPage() {
  const systemDetail = await getSystemDetails();

  if (!systemDetail) notFound();

  const { ldos, events, players, matches, teams } = systemDetail;

  const cards = [
    { title: 'Directors', count: ldos, href: '/directors' },
    { title: 'Events', count: events, href: '/events' },
    { title: 'Players', count: players, href: '/players' },
    { title: 'Matches', count: matches, href: '/matches' },
    { title: 'Teams', count: teams, href: '/teams' },
  ];

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <div className="text-center mt-6">
        <h1 className="text-4xl md:text-5xl font-bold text-yellow-logo mb-8">
          ASL - Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
          {cards.map(({ title, count, href }) => (
            <Link
              key={title}
              href={href}
              className="bg-gray-800 hover:bg-yellow-500 hover:text-black transition-colors duration-300 rounded-xl p-6 shadow-lg flex flex-col justify-between items-center"
            >
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-3xl font-bold">{count}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
