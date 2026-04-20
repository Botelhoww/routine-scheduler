import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import sgLogo from '@/assets/societe-generale-logo.png';

const mockUser = { name: 'Vinicius Awada', initials: 'VA', role: 'Analista de TI' };

export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-[100] bg-white border-b flex items-center justify-between"
      style={{ height: '56px', paddingLeft: '24px', paddingRight: '24px', borderBottomColor: '#E0E0E0' }}
    >
      {/* Lado esquerdo: logo + separador + nome do portal */}
      <div className="flex items-center">
        <img
          src={sgLogo}
          alt="Société Générale"
          style={{ height: '32px', objectFit: 'contain' }}
        />
        <div
          aria-hidden="true"
          style={{
            width: '1px',
            height: '32px',
            backgroundColor: '#E0E0E0',
            marginLeft: '16px',
            marginRight: '16px',
          }}
        />
        <span
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: '#1a1a1a',
            lineHeight: 1,
          }}
        >
          Reprocessamento de Rotinas
        </span>
      </div>

      {/* Lado direito: badge + usuário + logout */}
      <div className="flex items-center gap-3">
        <Badge
          className="text-[10px] px-2 py-0.5 text-white hover:opacity-90"
          style={{ backgroundColor: '#E30613' }}
        >
          PRODUÇÃO
        </Badge>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium leading-tight" style={{ color: '#1a1a1a' }}>{mockUser.name}</p>
          <p className="text-xs text-muted-foreground leading-tight">{mockUser.role}</p>
        </div>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
            {mockUser.initials}
          </AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
