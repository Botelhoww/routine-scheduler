import { useRoutines } from '@/hooks/useRoutines';
import { RoutinePeriodList } from '@/components/RoutinePeriodList';
import { AppHeader } from '@/components/AppHeader';

export default function Index() {
  const { getByPeriod, addRoutine, updateRoutine, deleteRoutine, startReprocessing, resetStatus } = useRoutines();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-[1400px] mx-auto px-4 py-6 pt-[88px]">
        <RoutinePeriodList
          getByPeriod={getByPeriod}
          onUpdate={updateRoutine}
          onDelete={deleteRoutine}
          onStart={startReprocessing}
          onReset={resetStatus}
          onAdd={addRoutine}
        />
      </main>
    </div>
  );
}
