import { useRoutines } from '@/hooks/useRoutines';
import { RoutinePeriodTabs } from '@/components/RoutinePeriodTabs';
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
      <main>
        <RoutinePeriodTabs
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
