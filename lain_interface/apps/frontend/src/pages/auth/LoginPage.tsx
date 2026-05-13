/**
 * Login Page — professional dark telecom UI.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/api/endpoints'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import toast from 'react-hot-toast'
import { Radio, Lock, User, Eye, EyeOff, Wifi, Activity, Palette, Mail, UserPlus } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'Ingrese su usuario'),
  password: z.string().min(1, 'Ingrese su contraseña'),
})

const registerSchema = z.object({
  full_name: z.string().min(2, 'Ingrese su nombre completo'),
  username: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Solo letras, números, guión, punto o _'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  confirm_password: z.string().min(1, 'Confirme su contraseña'),
}).refine((data) => data.password === data.confirm_password, {
  path: ['confirm_password'],
  message: 'Las contraseñas no coinciden',
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

function getThemeName(label: string) {
  return label.replace(/\s*\(.*\)$/, '')
}

export function LoginPage() {
  const { login } = useAuth()
  const { theme, themeOptions: options, setTheme } = useTheme()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerSignup,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    try {
      await login(values.username, values.password)
      toast.success('Bienvenido al laboratorio LTE/IMS')
      navigate('/dashboard')
    } catch {
      toast.error('Credenciales inválidas')
    } finally {
      setIsLoading(false)
    }
  }

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true)
    try {
      await authApi.register({
        full_name: values.full_name,
        username: values.username,
        email: values.email,
        password: values.password,
      })
      toast.success('Cuenta creada como Visualizador')
      await login(values.username, values.password)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'No se pudo crear la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--login-shell-gradient)' }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(var(--border-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-color) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glowing orbs */}
      <div
        className="absolute top-1/4 left-1/4 rounded-full pointer-events-none"
        style={{ width: 300, height: 300, background: 'var(--login-orb-primary)', filter: 'blur(40px)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 rounded-full pointer-events-none"
        style={{ width: 200, height: 200, background: 'var(--login-orb-secondary)', filter: 'blur(30px)' }}
      />

      {/* ── Login card ──────────────────────────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-md animate-fadeIn"
        style={{
          background: 'var(--login-card-gradient)',
          border: '1px solid var(--border-color)',
          borderRadius: 20,
          padding: '40px 36px',
          boxShadow: 'var(--login-card-shadow)',
        }}
      >
        <div className="flex justify-end mb-3">
          <div
            className="flex items-center gap-2 px-2 py-1 rounded-lg"
            style={{
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
            }}
          >
            <Palette size={12} style={{ color: 'var(--brand-primary)' }} />
            <div className="theme-palette" role="radiogroup" aria-label="Seleccionar tema">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`theme-chip ${theme === option.value ? 'active' : ''}`}
                  onClick={() => setTheme(option.value)}
                  role="radio"
                  aria-checked={theme === option.value}
                  title={option.label}
                >
                  <span className="theme-dots" aria-hidden>
                    {option.preview.map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </span>
                  <span>{getThemeName(option.label)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: 56,
                height: 56,
                background: 'var(--logo-gradient)',
                boxShadow: '0 8px 24px var(--logo-shadow)',
              }}
            >
              <Radio size={26} color="white" />
            </div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--login-title)', letterSpacing: '-0.3px', marginBottom: 4 }}>
            CanazasTEL
          </h1>
          <p style={{ fontSize: 12, color: 'var(--brand-primary)', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Admin Platform
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            LTE/4G · IMS · VoLTE Laboratory
          </p>
        </div>

        {/* Status indicator */}
        <div
          className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg"
          style={{
            background: 'var(--login-status-bg)',
            border: '1px solid var(--login-status-border)',
          }}
        >
          <div className="status-dot status-dot-up" style={{ animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11, color: 'var(--status-up)', fontWeight: 500 }}>
            {mode === 'login' ? 'Sistema operativo — LTE Lab v1.0' : 'Registro abierto — rol inicial: Visualizador'}
          </span>
          <Activity size={11} style={{ color: 'var(--status-up)', marginLeft: 'auto' }} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            type="button"
            className="btn"
            style={{
              justifyContent: 'center',
              background: mode === 'login' ? 'var(--sidebar-active-bg)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: mode === 'login' ? 'var(--brand-light)' : 'var(--text-secondary)',
            }}
            onClick={() => setMode('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className="btn"
            style={{
              justifyContent: 'center',
              background: mode === 'register' ? 'var(--sidebar-active-bg)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: mode === 'register' ? 'var(--brand-light)' : 'var(--text-secondary)',
            }}
            onClick={() => {
              setMode('register')
              resetRegisterForm()
            }}
          >
            Crear cuenta
          </button>
        </div>

        {/* Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="label">Usuario</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  {...registerLogin('username')}
                  className="input"
                  style={{ paddingLeft: 36 }}
                  placeholder="admin"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {loginErrors.username && (
                <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{loginErrors.username.message}</p>
              )}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  {...registerLogin('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {loginErrors.password && (
                <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{loginErrors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center mt-2"
              style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loader" style={{ width: 16, height: 16 }} />
              ) : (
                <>
                  <Wifi size={15} />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="label">Nombre completo</label>
              <div className="relative">
                <UserPlus size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  {...registerSignup('full_name')}
                  className="input"
                  style={{ paddingLeft: 36 }}
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  autoFocus
                />
              </div>
              {registerErrors.full_name && (
                <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{registerErrors.full_name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Usuario</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...registerSignup('username')}
                    className="input"
                    style={{ paddingLeft: 36 }}
                    placeholder="joven_123"
                    autoComplete="username"
                  />
                </div>
                {registerErrors.username && (
                  <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{registerErrors.username.message}</p>
                )}
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...registerSignup('email')}
                    className="input"
                    type="email"
                    style={{ paddingLeft: 36 }}
                    placeholder="correo@demo.com"
                    autoComplete="email"
                  />
                </div>
                {registerErrors.email && (
                  <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{registerErrors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...registerSignup('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                    placeholder="Min. 8 + Mayús. + Número"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {registerErrors.password && (
                  <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{registerErrors.password.message}</p>
                )}
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input
                    {...registerSignup('confirm_password')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input"
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {registerErrors.confirm_password && (
                  <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }}>{registerErrors.confirm_password.message}</p>
                )}
              </div>
            </div>

            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Tu cuenta se crea como <strong>Visualizador</strong>. Un administrador puede subirte de rango.
            </p>

            <button
              type="submit"
              className="btn btn-primary w-full justify-center mt-1"
              style={{ padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 10 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loader" style={{ width: 16, height: 16 }} />
              ) : (
                <>
                  <UserPlus size={15} />
                  Crear cuenta
                </>
              )}
            </button>
          </form>
        )}

        {/* Demo credentials hint */}
        {mode === 'login' && (
          <div
            className="mt-5 p-3 rounded-lg"
            style={{
              background: 'var(--login-demo-bg)',
              border: '1px solid var(--login-demo-border)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Credenciales demo
            </p>
            <div className="flex flex-col gap-1">
              {[
                { user: 'admin', pass: 'Admin1234!' },
                { user: 'operator', pass: 'Oper1234!' },
                { user: 'viewer', pass: 'View1234!' },
              ].map(c => (
                <div key={c.user} className="flex justify-between" style={{ fontSize: 11 }}>
                  <span className="mono" style={{ color: 'var(--brand-primary)' }}>{c.user}</span>
                  <span className="mono" style={{ color: 'var(--text-secondary)' }}>{c.pass}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p style={{ fontSize: 10, color: 'var(--login-footer)', textAlign: 'center', marginTop: 20 }}>
          © 2026 CanazasTEL Lab Platform · Thesis Project · MCC 716 / MNC 02
        </p>
      </div>
    </div>
  )
}
