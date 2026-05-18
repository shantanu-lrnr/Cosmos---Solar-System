import dynamic from 'next/dynamic';
import Loader from '@/components/ui/Loader';

const Experience = dynamic(() => import('@/components/Experience'), {
  ssr: false,
  loading: () => <Loader />,
});

export default function Page() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-cosmos-bg">
      <Experience />
    </main>
  );
}
