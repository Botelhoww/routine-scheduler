import { RefreshCcw, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const mockUser = { name: 'João Silva', initials: 'JS', role: 'Analista de TI' };

export function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm h-16">
      <div className="container max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2">
            <RefreshCcw className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-foreground">Reprocessamento de Rotinas</h1>
              <Badge className="bg-success text-success-foreground text-[10px] px-2 py-0.5">PRODUÇÃO</Badge>
            </div>
            <div className="flex items-center gap-0">
              <p className="text-xs text-muted-foreground">BSG – Société Générale</p>
              <span className="mx-2 text-xs text-muted-foreground">·</span>
              <p className="text-xs text-muted-foreground">Banco de Investimentos — Painel Administrativo</p>
            </div>
          </div>
        </div>
        <div className="border-t-2 border-success absolute bottom-0 left-0 right-0" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">{mockUser.name}</p>
            <p className="text-xs text-muted-foreground">{mockUser.role}</p>
          </div>
          <Avatar className="h-9 w-9 bg-primary text-primary-foreground">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{mockUser.initials}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
