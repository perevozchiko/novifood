import { Suspense } from 'react';
import HomeClient, { DiarySkeleton } from './HomeClient';

export default function HomePage() {
  return (
    <Suspense fallback={<DiarySkeleton />}>
      <HomeClient />
    </Suspense>
  );
}
