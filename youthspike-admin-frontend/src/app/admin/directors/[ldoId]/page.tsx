import { getEventDirector } from '@/app/_requests/ldo';
import { notFound } from 'next/navigation';
import LDOSingleMain from '@/components/ldo/LDOSingleMain';

async function LDOSingle({ params }: { params: { ldoId: string } }) {

  const ldoExist = await getEventDirector(params.ldoId);
  if(!ldoExist){
    notFound();
  }

  console.log({ldo: ldoExist});
  
  

  return (
    <div className='container mx-auto px-4 min-h-screen'>
      <LDOSingleMain ldo={ldoExist} ldoId={params.ldoId}  />
    </div>
  )
}


export default LDOSingle;