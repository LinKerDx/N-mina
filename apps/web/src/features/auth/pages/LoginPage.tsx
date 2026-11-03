import { esquemaLogin, moneda } from '@nomina360/core';
import { Boton, Campo, MensajeError } from '@nomina360/ui';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  animarEntradaLogin,
  animarParallax,
  animarSalidaLogin,
  detenerAnimaciones,
  sacudir,
  type ReferenciasLogin,
} from '@/features/auth/animaciones/login';
import { useSesion } from '@/features/auth/contexto/SesionContexto';
import { mensajeDeError } from '@/shared/lib/errores';

const CUENTAS_DEMO = [
  { rol: 'Administración', email: 'admin@nomina360.mx' },
  { rol: 'Recursos Humanos', email: 'rh@nomina360.mx' },
  { rol: 'Producción', email: 'produccion@nomina360.mx' },
  { rol: 'Finanzas', email: 'admin.finanzas@nomina360.mx' },
];

export function LoginPage() {
  const { iniciar, usuario, cargando } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const contenedorRef = useRef<HTMLDivElement>(null);
  const formularioRef = useRef<HTMLDivElement>(null);
  const tarjetaRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const cuadroParallax = useRef<number | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mostrarCuentas, setMostrarCuentas] = useState(false);

  useEffect(() => {
    const raiz = contenedorRef.current;
    if (!raiz) {
      return;
    }

    const referencias: ReferenciasLogin = {
      panelMarca: raiz.querySelector<HTMLElement>('[data-anim="marca"]'),
      formulario: raiz.querySelector<HTMLElement>('[data-anim="formulario"]'),
      orbes: Array.from(raiz.querySelectorAll<HTMLElement>('[data-orbe]')),
      tarjetas: Array.from(raiz.querySelectorAll<HTMLElement>('[data-tarjeta]')),
      chips: Array.from(raiz.querySelectorAll<HTMLElement>('[data-chip]')),
      contadores: Array.from(raiz.querySelectorAll<HTMLElement>('[data-contador]')),
    };

    const instancias = animarEntradaLogin(referencias);
    return () => detenerAnimaciones(instancias);
  }, []);

  useEffect(() => {
    return () => {
      if (cuadroParallax.current !== null) {
        cancelAnimationFrame(cuadroParallax.current);
      }
    };
  }, []);

  function manejarPuntero(evento: React.PointerEvent<HTMLDivElement>) {
    if (evento.pointerType !== 'mouse') {
      return;
    }
    const { currentTarget, clientX, clientY } = evento;
    const caja = currentTarget.getBoundingClientRect();
    const x = (clientX - caja.left) / caja.width - 0.5;
    const y = (clientY - caja.top) / caja.height - 0.5;

    if (cuadroParallax.current !== null) {
      cancelAnimationFrame(cuadroParallax.current);
    }
    cuadroParallax.current = requestAnimationFrame(() => {
      animarParallax(parallaxRef.current, x, y);
    });
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    const resultado = esquemaLogin.safeParse({ email, password });
    if (!resultado.success) {
      const nuevos: Record<string, string> = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0];
        if (typeof campo === 'string' && !nuevos[campo]) {
          nuevos[campo] = problema.message;
        }
      }
      setErrores(nuevos);
      sacudir(tarjetaRef.current);
      return;
    }

    setErrores({});
    setEnviando(true);
    try {
      await iniciar(resultado.data);
      await animarSalidaLogin(formularioRef.current);
      const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? '/tablero';
      navegar(destino, { replace: true });
    } catch (excepcion) {
      setErrorGeneral(mensajeDeError(excepcion));
      sacudir(tarjetaRef.current);
    } finally {
      setEnviando(false);
    }
  }

  function usarCuenta(cuentaEmail: string) {
    setEmail(cuentaEmail);
    setPassword('Nomina360!');
    setErrores({});
    setErrorGeneral(null);
  }

  if (!cargando && usuario) {
    return <Navigate to="/tablero" replace />;
  }

  return (
    <div
      ref={contenedorRef}
      onPointerMove={manejarPuntero}
      className="relative min-h-screen overflow-hidden bg-ink-950"
    >
      <div className="rejilla-fondo pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          data-orbe
          className="absolute -left-24 top-[-10%] size-[34rem] rounded-full bg-brand-500/25 blur-[120px]"
        />
        <div
          data-orbe
          className="absolute right-[-12%] top-[18%] size-[30rem] rounded-full bg-acento/25 blur-[130px]"
        />
        <div
          data-orbe
          className="absolute bottom-[-18%] left-[38%] size-[26rem] rounded-full bg-sky-500/20 blur-[120px]"
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl items-center gap-14 px-6 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <section data-anim="marca" className="hidden lg:block">
          <div ref={parallaxRef}>
            <div className="flex items-center gap-3">
              <LogoNomina />
              <span className="text-sm font-semibold tracking-[0.18em] text-slate-300">
                NÓMINA360
              </span>
            </div>

            <h1 className="mt-10 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight">
              <span className="texto-degradado">Cada área con su base,</span>
              <br />
              <span className="text-white">una sola nómina bajo control.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-400">
              Microservicios por área, periodos con cálculo de ISR e IMSS, horas extra aprobadas
              desde producción y presupuesto conciliado en tiempo real.
            </p>

            <div className="mt-8 flex flex-wrap gap-2.5">
              {['RH', 'Producción', 'Administración', 'Multi-base de datos'].map((texto) => (
                <span
                  key={texto}
                  data-chip
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300"
                >
                  {texto}
                </span>
              ))}
            </div>

            <div className="relative mt-14 h-[19rem]">
              <article
                data-tarjeta
                className="absolute left-0 top-0 w-64 rounded-2xl border border-white/10 bg-ink-800/80 p-4 shadow-tarjeta backdrop-blur"
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400">
                  <span>Nómina enero</span>
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-semibold text-brand-300">
                    Calculada
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{moneda(1042380)}</p>
                <div className="mt-3 flex items-end gap-1">
                  {[38, 52, 44, 61, 72, 58, 84, 76].map((altura, indice) => (
                    <span
                      key={indice}
                      className="w-2 rounded-sm bg-gradient-to-t from-brand-500/30 to-brand-400"
                      style={{ height: `${altura * 0.5}px` }}
                    />
                  ))}
                </div>
              </article>

              <article
                data-tarjeta
                className="absolute right-2 top-24 w-56 rounded-2xl border border-white/10 bg-ink-800/85 p-4 shadow-tarjeta backdrop-blur"
              >
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Empleados activos</p>
                <p
                  data-contador="128"
                  data-sufijo=""
                  className="mt-2 text-3xl font-semibold text-white"
                >
                  128
                </p>
                <p className="mt-1 text-xs text-brand-300">+6 este mes</p>
              </article>

              <article
                data-tarjeta
                className="absolute bottom-0 left-16 w-60 rounded-2xl border border-white/10 bg-ink-800/85 p-4 shadow-tarjeta backdrop-blur"
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400">
                  <span>Presupuesto ejercido</span>
                  <span className="text-slate-200">62%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-brand-500 to-acento" />
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Nómina + IMSS · enero <span className="text-slate-200">$1.04M</span>
                </p>
              </article>
            </div>
          </div>
        </section>

        <section ref={formularioRef} data-anim="formulario" className="w-full">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoNomina />
            <span className="text-sm font-semibold tracking-[0.18em] text-slate-300">
              NÓMINA360
            </span>
          </div>

          <div
            ref={tarjetaRef}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-800/70 p-7 shadow-brillo backdrop-blur-2xl sm:p-9"
          >
            <div className="pointer-events-none absolute -right-20 -top-24 size-56 rounded-full bg-brand-500/20 blur-3xl" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-300">
                Acceso al sistema
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Inicia sesión</h2>
              <p className="mt-1.5 text-sm text-slate-400">
                Usa tu cuenta corporativa para entrar al panel de nómina.
              </p>

              <form className="mt-7 space-y-4" onSubmit={manejarEnvio} noValidate>
                <Campo
                  etiqueta="Correo corporativo"
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="nombre@nomina360.mx"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  error={errores.email}
                />

                <div className="relative">
                  <Campo
                    etiqueta="Contraseña"
                    type={mostrarPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(evento) => setPassword(evento.target.value)}
                    error={errores.password}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((visible) => !visible)}
                    className="absolute right-3 top-[2.1rem] rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:text-white"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {mostrarPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>

                {errorGeneral ? <MensajeError>{errorGeneral}</MensajeError> : null}

                <Boton
                  type="submit"
                  tamano="lg"
                  className="w-full"
                  cargando={enviando}
                  disabled={enviando}
                >
                  {enviando ? 'Verificando…' : 'Entrar a Nómina360'}
                </Boton>
              </form>

              <div className="mt-6 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarCuentas((valor) => !valor)}
                  className="text-xs font-medium text-slate-400 transition hover:text-brand-300"
                >
                  {mostrarCuentas ? 'Ocultar cuentas de demostración' : 'Ver cuentas de demostración'}
                </button>

                {mostrarCuentas ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {CUENTAS_DEMO.map((cuenta) => (
                      <button
                        key={cuenta.email}
                        type="button"
                        onClick={() => usarCuenta(cuenta.email)}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left transition hover:border-brand-400/40 hover:bg-brand-500/10"
                      >
                        <span className="block text-[11px] uppercase tracking-wider text-slate-400">
                          {cuenta.rol}
                        </span>
                        <span className="block truncate text-xs text-slate-200">{cuenta.email}</span>
                      </button>
                    ))}
                  </div>
                ) : null}

                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                  Contraseña de demostración: <span className="text-slate-300">Nomina360!</span>.
                  Cambia los usuarios semilla antes de usar datos reales.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            © {new Date().getFullYear()} Nómina360 · Sesión protegida con JWT y refresh rotativo.
          </p>
        </section>
      </div>
    </div>
  );
}

function LogoNomina() {
  return (
    <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-ink-950 shadow-brillo">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
        <path
          d="M4 18V7.5c0-.9 1.1-1.4 1.8-.8L12 12l6.2-5.3c.7-.6 1.8-.1 1.8.8V18"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
