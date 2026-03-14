'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth/auth-provider';
import { config } from '@/lib/config';
import { SPECIALIZATION_OPTIONS } from '@/lib/academic-profile';

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const isSignup = mode === 'signup';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    isGraduated: false,
    academicYear: '',
    specialization: '',
  });

  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isSignup && signupStep === 1) {
      if (!formData.email.trim() || !formData.password.trim()) {
        setError('Debes indicar correo y contrasena para continuar.');
        return;
      }

      if (formData.password.length < config.auth.passwordMinLength) {
        setError(`La contrasena debe tener al menos ${config.auth.passwordMinLength} caracteres.`);
        return;
      }

      setSignupStep(2);
      return;
    }

    if (pending) return;
    setPending(true);

    try {
      if (isSignup && !formData.isGraduated && !formData.academicYear.trim()) {
        setError('Debes indicar tu ano academico si aun no estas titulado/a.');
        setPending(false);
        return;
      }

      if (isSignup && !formData.specialization) {
        setError('Debes seleccionar tu especialidad.');
        setPending(false);
        return;
      }

      const result = mode === 'signin'
        ? await signIn(formData.email, formData.password)
        : await signUp({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
            phone: formData.phone,
            isGraduated: formData.isGraduated,
            academicYear: formData.isGraduated
              ? null
              : formData.academicYear
                ? Number(formData.academicYear)
                : null,
            specialization: formData.specialization,
          });

      if (!result.success) {
        setError(result.error || 'Ocurrio un error.');
        return;
      }

      if (isSignup && 'requiresConfirmation' in result && result.requiresConfirmation) {
        setSuccess('Cuenta creada. Revisa tu correo para confirmar tu cuenta antes de iniciar sesion.');
        return;
      }

      window.location.href = redirect ? `/${redirect}` : '/app';
    } catch {
      setError('Ocurrio un error inesperado.');
    } finally {
      setPending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (googleLoading) return;

    setGoogleLoading(true);
    setError('');

    try {
      const googleRedirectPath = isSignup ? 'app/profile?complete=1' : redirect || 'app';
      const result = await signInWithGoogle(googleRedirectPath);

      if (!result.success) {
        setError(result.error || 'No se pudo iniciar sesion con Google.');
        setGoogleLoading(false);
      }
    } catch {
      setError('Ocurrio un error inesperado.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden gradient-bg-subtle">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-1/4 h-96 w-96 animate-float rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 h-80 w-80 animate-float rounded-full bg-gradient-to-tr from-primary/15 to-primary/10 blur-3xl delay-200" />
      </div>

      <div className="relative flex min-h-screen">
        <div className="relative hidden overflow-hidden gradient-bg lg:flex lg:w-1/2">
          <div className="absolute inset-0 gradient-bg opacity-90" />
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full bg-gradient-to-br from-background/5 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 py-16 text-primary-foreground animate-slide-up">
            <div className="mb-8">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-background/20 backdrop-blur-sm animate-scale-in">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="mb-4 text-4xl font-bold text-foreground animate-fade-in delay-100">U-clases en Beauchef</h1>
              <p className="text-xl leading-relaxed text-primary-foreground/80 animate-fade-in delay-200">
                Plataforma para encontrar y ofrecer clases particulares dentro de la FCFM.
              </p>
            </div>

            <div className="space-y-4 animate-fade-in delay-300">
              <div className="flex items-center">
                <div className="mr-3 h-2 w-2 rounded-full bg-primary-foreground" />
                <span className="text-primary-foreground/80">Busqueda por ramos</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 h-2 w-2 rounded-full bg-primary-foreground" />
                <span className="text-primary-foreground/80">Solicitudes y estados de clases</span>
              </div>
              <div className="flex items-center">
                <div className="mr-3 h-2 w-2 rounded-full bg-primary-foreground" />
                <span className="text-primary-foreground/80">Reseñas verificadas y contacto directo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-md animate-slide-up delay-100">
            <div className="mb-8">
              <Link
                href="/"
                className="group inline-flex items-center text-sm text-gray-600 transition-colors hover:text-primary hover-scale"
                style={{ transitionDuration: 'var(--duration-fast)' }}
              >
                <ArrowLeft
                  className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
                  style={{ transitionDuration: 'var(--duration-fast)' }}
                />
                Volver al inicio
              </Link>
            </div>

            <div className="mb-8 animate-fade-in delay-200">
              <div className="mb-6 flex items-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-lg hover-scale">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {mode === 'signin' ? 'Bienvenido/a de vuelta' : signupStep === 1 ? 'Crear cuenta' : 'Datos personales'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {mode === 'signin'
                      ? 'Inicia sesion para continuar a U-clases'
                      : signupStep === 1
                        ? 'Paso 1 de 2: acceso de cuenta'
                        : 'Paso 2 de 2: completa tu perfil'}
                  </p>
                </div>
              </div>

              {isSignup ? (
                <div className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  Paso {signupStep} de 2
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in delay-300">
              {isSignup && signupStep === 2 ? (
                <>
                  <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                    <p>
                      Correo de cuenta: <span className="font-medium text-foreground">{formData.email}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      Editar correo o contrasena
                    </button>
                  </div>

                  <div>
                    <Label htmlFor="fullName" className="font-medium text-gray-700">Nombre completo</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                      className="mt-1 h-12 rounded-xl border-gray-200 hover-scale focus:border-primary focus:ring-primary"
                      placeholder="Ingresa tu nombre"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="font-medium text-gray-700">Teléfono / WhatsApp</Label>
                    <Input
                      id="phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="mt-1 h-12 rounded-xl border-gray-200 hover-scale focus:border-primary focus:ring-primary"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
                    <div>
                      <Label htmlFor="specialization" className="font-medium text-gray-700">Especialidad</Label>
                      <select
                        id="specialization"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        required
                        className="mt-1 h-12 w-full rounded-xl border border-gray-200 bg-transparent px-3 text-sm outline-none hover-scale focus:border-primary focus:ring-primary"
                      >
                        <option value="">Selecciona tu especialidad</option>
                        {SPECIALIZATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={formData.isGraduated}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isGraduated: e.target.checked,
                            academicYear: e.target.checked ? '' : formData.academicYear,
                          })
                        }
                      />
                      Titulado/a (ya no cursas pregrado en la facultad)
                    </label>

                    {!formData.isGraduated ? (
                      <div>
                        <Label htmlFor="academicYear" className="font-medium text-gray-700">Año académico actual</Label>
                        <Input
                          id="academicYear"
                          type="number"
                          min={1}
                          max={10}
                          value={formData.academicYear}
                          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                          required
                          className="mt-1 h-12 rounded-xl border-gray-200 hover-scale focus:border-primary focus:ring-primary"
                          placeholder="Ej: 3"
                        />
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="email" className="font-medium text-gray-700">Correo electronico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-1 h-12 rounded-xl border-gray-200 hover-scale focus:border-primary focus:ring-primary"
                      placeholder="Ingresa tu correo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="font-medium text-gray-700">Contrasena</Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="h-12 rounded-xl border-gray-200 pr-12 hover-scale focus:border-primary focus:ring-primary"
                        placeholder="Ingresa tu contrasena"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 transition-colors hover:text-gray-600 hover-scale"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {isSignup ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Debe tener al menos {config.auth.passwordMinLength} caracteres, incluyendo mayuscula, minuscula, numero y caracter especial (!@#$%^&*)
                      </p>
                    ) : null}
                  </div>
                </>
              )}

              {error ? (
                <div className="animate-scale-in rounded-xl border border-destructive bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              ) : null}

              {success ? (
                <div className="animate-scale-in rounded-xl border border-success bg-success/10 p-3">
                  <p className="text-sm text-success">{success}</p>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={pending}
                className="h-12 w-full rounded-xl font-semibold text-primary-foreground shadow-lg transition-all gradient-bg hover-lift hover:from-primary/90 hover:to-primary/80 hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100 disabled:hover:translate-y-0"
                style={{ transitionDuration: 'var(--duration-fast)' }}
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {mode === 'signin' ? 'Iniciando sesion...' : signupStep === 1 ? 'Validando...' : 'Creando cuenta...'}
                  </>
                ) : mode === 'signin' ? (
                  'Iniciar sesion'
                ) : signupStep === 1 ? (
                  'Continuar'
                ) : (
                  'Crear cuenta'
                )}
              </Button>

              {isSignup && signupStep === 2 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setError('');
                    setSignupStep(1);
                  }}
                >
                  Volver al paso 1
                </Button>
              ) : null}
            </form>

            {!isSignup || signupStep === 1 ? (
              <>
                <div className="my-8 animate-fade-in delay-400">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 text-gray-500 gradient-bg-subtle">o continua con</span>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || pending}
                  className="mb-6 h-12 w-full rounded-xl border-2 border-gray-200 bg-white font-semibold text-gray-700 transition-all hover-scale hover:border-gray-300 hover:bg-gray-50 hover:shadow-md disabled:opacity-70 animate-fade-in delay-500"
                  style={{ transitionDuration: 'var(--duration-fast)' }}
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Conectando con Google...
                    </>
                  ) : (
                    <>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      {isSignup ? 'Registrarme con Google' : 'Continuar con Google'}
                    </>
                  )}
                </Button>

                {isSignup ? (
                  <p className="-mt-3 mb-6 text-center text-xs text-muted-foreground">
                    Si te registras con Google, luego te pediremos completar teléfono y datos académicos.
                  </p>
                ) : null}
              </>
            ) : null}

            <div className="mt-6 animate-fade-in delay-600 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === 'signin' ? 'No tienes cuenta?' : 'Ya tienes cuenta?'}{' '}
                <Link
                  href={mode === 'signin' ? '/sign-up' : '/sign-in'}
                  className="font-semibold text-primary transition-opacity hover:opacity-80 hover-scale"
                  style={{ transitionDuration: 'var(--duration-fast)' }}
                >
                  {mode === 'signin' ? 'Registrate' : 'Inicia sesion'}
                </Link>
              </p>
            </div>

            <div className="mt-8 animate-fade-in delay-700 text-center">
              <p className="text-xs text-muted-foreground">Protegido con autenticacion segura y cifrado estandar.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
