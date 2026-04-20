import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  onRefresh: () => void | Promise<void>;
  isRefreshing: boolean;
  lastUpdated: Date;
}

function formatRelative(from: Date, now: Date): string {
  const diffSec = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  if (diffSec < 10) return 'agora mesmo';
  if (diffSec < 60) return `há ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  return from.toLocaleString('pt-BR');
}

export function RefreshControl({ onRefresh, isRefreshing, lastUpdated }: Props) {
  const [, force] = useState(0);

  // Re-render a cada 30s para atualizar o "há X min"
  useEffect(() => {
    const id = window.setInterval(() => force(n => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-[11px] text-muted-foreground hidden sm:inline tabular-nums"
        title={lastUpdated.toLocaleString('pt-BR')}
      >
        Atualizado {formatRelative(lastUpdated, new Date())}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void onRefresh()}
        disabled={isRefreshing}
        className="h-8 gap-1.5 text-xs"
        aria-label="Atualizar dados"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
        Atualizar
      </Button>
    </div>
  );
}
