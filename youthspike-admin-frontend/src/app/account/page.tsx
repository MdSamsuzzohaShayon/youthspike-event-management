import { Suspense } from 'react';
import Loader from '@/components/elements/Loader';
import AccountMain from '@/components/user/AccountMain';

export default function AccountPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AccountMain />
    </Suspense>
  );
}
