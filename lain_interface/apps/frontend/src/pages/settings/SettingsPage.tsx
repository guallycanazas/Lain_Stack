import { useTheme } from '@/hooks/useTheme'
import { Radio, Monitor, Moon, Sun, Palette, Type, Layout, Bell, Shield, Info } from 'lucide-react'

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter', family: "'Inter', system-ui, sans-serif" },
  { value: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif" },
  { value: 'jetbrains', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { value: 'playfair', label: 'Playfair Display', family: "'Playfair Display', serif" },
]

const THEMES = [
  { value: 'telecom', label: 'Telecom', desc: 'Azul oscuro profesional', preview: '#0a1929' },
  { value: 'aurora', label: 'Aurora', desc: 'Claro y profesional', preview: '#edf4fd' },
  { value: 'vibe', label: 'Vibe', desc: 'Rosa y joven', preview: '#ff4d8d' },
  { value: 'carbon', label: 'Carbon', desc: 'Verde azulado oscuro', preview: '#0f161c' },
  { value: 'modern', label: 'Modern SaaS', desc: 'Púrpura elegante', preview: '#1a1a2e' },
  { value: 'noc', label: 'Telecom NOC', desc: 'Verde terminal/dashboard', preview: '#0a0c10' },
  { value: 'cards', label: 'Drawer + Cards', desc: 'Blanco limpio', preview: '#f1f5f9' },
]

const LAYOUTS = [
  { value: 'sidebar', label: 'Sidebar Fijo', desc: 'Menú lateral tradicional fijo', icon: '▮' },
  { value: 'drawer', label: 'Drawer Collapsible', desc: 'Menú lateral que se colapsa', icon: '◀' },
  { value: 'horizontal', label: 'Nav Horizontal', desc: 'Menú en la parte superior', icon: '≡' },
]

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{ width: 36, height: 36, background: 'var(--brand-glow)' }}
        >
          <Icon size={18} style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        </div>
      </div>
      {children}
    </div>
  )
}

function ThemeCard({ theme, selected, onClick }: { theme: typeof THEMES[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 12,
        borderRadius: 12,
        border: selected ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
        background: selected ? 'var(--sidebar-active-bg)' : 'var(--bg-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'left',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '100%',
          height: 40,
          borderRadius: 8,
          background: theme.preview,
          border: '1px solid var(--border-color)',
        }}
      />
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{theme.label}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{theme.desc}</div>
      </div>
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--brand-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: 'white',
            fontWeight: 700,
          }}
        >
          ✓
        </div>
      )}
    </button>
  )
}

function LayoutCard({ layout, selected, onClick }: { layout: typeof LAYOUTS[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: 20,
        borderRadius: 12,
        border: selected ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
        background: selected ? 'var(--sidebar-active-bg)' : 'var(--bg-secondary)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ fontSize: 28 }}>{layout.icon}</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{layout.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{layout.desc}</div>
      </div>
    </button>
  )
}

export function SettingsPage() {
  const { theme, layout, themeOptions, setTheme, setLayout } = useTheme()

  return (
    <div className="animate-fadeIn" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Personaliza la apariencia y comportamiento de la plataforma</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Layout */}
        <SectionCard title="Layout" icon={Layout}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {LAYOUTS.map(l => (
              <LayoutCard
                key={l.value}
                layout={l}
                selected={layout === l.value}
                onClick={() => setLayout(l.value as any)}
              />
            ))}
          </div>
        </SectionCard>

        {/* Theme */}
        <SectionCard title="Tema de Color" icon={Palette}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, position: 'relative' }}>
            {THEMES.map(t => (
              <ThemeCard
                key={t.value}
                theme={t}
                selected={theme === t.value}
                onClick={() => setTheme(t.value as any)}
              />
            ))}
          </div>
        </SectionCard>

        {/* Typography */}
        <SectionCard title="Tipografía" icon={Type}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {FONT_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => {
                  document.body.style.fontFamily = f.family
                  localStorage.setItem('ct_font', f.value)
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  fontFamily: f.family,
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            Nota: El cambio de tipografía se aplica inmediatamente. El estilo se guarda en el navegador.
          </p>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notificaciones" icon={Bell}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Alertas críticas', desc: 'Recibir notificaciones de alertas de nivel crítico', defaultChecked: true },
              { label: 'Nuevos suscriptores', desc: 'Notificar cuando se cree un nuevo suscriptor', defaultChecked: false },
              { label: 'Cambios de estado', desc: 'Notificar cuando un suscriptor cambie de estado', defaultChecked: true },
              { label: 'Reportes diarios', desc: 'Resumen diario de actividad del laboratorio', defaultChecked: false },
            ].map((item, i) => (
              <label
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)' }}
                />
              </label>
            ))}
          </div>
        </SectionCard>

        {/* About */}
        <SectionCard title="Acerca de" icon={Info}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {[
              { label: 'Versión', value: '1.0.0' },
              { label: 'Stack', value: 'React + FastAPI' },
              { label: 'Framework UI', value: 'Tailwind CSS + shadcn/ui' },
              { label: 'Backend', value: 'FastAPI + PostgreSQL' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: 'var(--status-info-bg)', border: '1px solid var(--status-info-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--status-info)' }}>CanazasTEL Admin Platform</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
              Proyecto de Tesis — Universidad · MCC 716 / MNC 02 (Perú)
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}