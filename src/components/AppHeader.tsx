import { UserCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import sgLogo from '@/assets/societe-generale-logo.png';

const mockUser = { name: 'Vinicius Awada', role: 'Analista de TI' };

export function AppHeader() {
  return (
    <header
      className="sticky top-0 z-[100] bg-white flex items-center justify-between"
      style={{
        height: '56px',
        paddingLeft: '24px',
        paddingRight: '24px',
        borderBottom: '1px solid #E8E8E8',
      }}
    >
      {/* Lado esquerdo: logo + separador + nome do portal */}
      <div className="flex items-center">
        <img
          src={sgLogo}
          alt="Société Générale"
          style={{ height: '36px', objectFit: 'contain' }}
        />
        <div
          aria-hidden="true"
          style={{
            width: '1px',
            height: '28px',
            backgroundColor: '#E0E0E0',
            margin: '0 16px',
          }}
        />
        <div className="flex flex-col justify-center" style={{ lineHeight: 1.2 }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
            Reprocessamento de Rotinas
          </span>
          <span style={{ fontSize: '11px', fontWeight: 400, color: '#888888' }}>
            Banco de Investimentos
          </span>
        </div>
      </div>

      {/* Centro: badge PRODUÇÃO */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Badge
          className="text-white hover:opacity-90 border-0"
          style={{
            backgroundColor: '#E30613',
            fontSize: '10px',
            fontWeight: 600,
            borderRadius: '4px',
            padding: '2px 8px',
            letterSpacing: '0.04em',
          }}
        >
          PRODUÇÃO
        </Badge>
      </div>

      {/* Lado direito: avatar + usuário */}
      <div className="flex items-center gap-2">
        <UserCircle2
          strokeWidth={1.5}
          style={{ width: '28px', height: '28px', color: '#1a1a1a' }}
        />
        <div className="flex flex-col text-left" style={{ lineHeight: 1.2 }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1a1a' }}>
            {mockUser.name}
          </span>
          <span style={{ fontSize: '11px', color: '#888888' }}>{mockUser.role}</span>
          <button
            type="button"
            className="text-left transition-colors"
            style={{ fontSize: '11px', color: '#888888', lineHeight: 1.2 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#E30613')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
