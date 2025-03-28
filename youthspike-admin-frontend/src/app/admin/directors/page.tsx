import { getEventDirectors } from '@/app/_requests/ldo';
import DirectorsMain from '@/components/directors/DirectorsMain';

async function DirectorPage() {

  const eventDirectors = await getEventDirectors();


  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <h1 className='my-4 text-center'>Directors</h1>
      <DirectorsMain ldoList={eventDirectors} />
    </div>
  )
}

export default DirectorPage;