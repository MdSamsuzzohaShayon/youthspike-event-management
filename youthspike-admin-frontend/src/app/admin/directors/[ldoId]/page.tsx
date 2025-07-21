import { getEventDirector } from '@/app/_requests/ldo';
import { notFound, redirect } from 'next/navigation';
import LDOSingleMain from '@/components/ldo/LDOSingleMain';
import { TParams } from '@/types';
import { UNAUTHORIZED } from '@/utils/constant';

interface ILDOSinglePageProps {
  params: Promise<TParams>;
}
async function LDOSinglePage({ params }: ILDOSinglePageProps) {
  const searchParams = await params;

  const ldoExist = await getEventDirector(searchParams.ldoId);
  if (!ldoExist) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 min-h-screen">
      <LDOSingleMain ldo={ldoExist} ldoId={searchParams.ldoId} />
    </div>
  );
}

export default LDOSinglePage;
