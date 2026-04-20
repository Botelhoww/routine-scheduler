import { useRoutines } from '@/hooks/useRoutines';
import { RoutinePeriodList } from '@/components/RoutinePeriodList';
import { AppHeader } from '@/components/AppHeader';

export default function Index() {
  const {
    routines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    startReprocessing,
    resetStatus,
    refresh,
    isRefreshing,
    lastUpdated,
  } = useRoutines();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-[1400px] mx-auto px-4 pb-6">
        <RoutinePeriodList
          routines={routines}
          onUpdate={updateRoutine}
          onDelete={deleteRoutine}
          onStart={startReprocessing}
          onReset={resetStatus}
          onAdd={addRoutine}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
        />
      </main>
    </div>
  );
}
