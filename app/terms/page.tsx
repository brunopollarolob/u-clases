import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfServicePage() {
  const lastUpdated = '14 de marzo de 2026';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary/80 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 mb-8 text-amber-900">
          <p className="text-sm">
            Este documento es una versión base de términos y condiciones para u-clases y puede requerir
            revisión legal profesional antes de su versión final.
          </p>
        </div>

        <article className="prose prose-neutral max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Términos y Condiciones</h1>

          <p className="text-muted-foreground mb-8">
            <strong>Última actualización:</strong> {lastUpdated}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceptación de los términos</h2>
            <p className="text-foreground/90">
              Al registrarte o utilizar u-clases, aceptas estos Términos y Condiciones y nuestra Política de
              Privacidad. Si no estás de acuerdo, no debes utilizar la plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Descripción del servicio</h2>
            <p className="text-foreground/90 mb-4">
              u-clases es una plataforma de intermediación para la comunidad de la FCFM que permite:
            </p>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Publicar perfiles de tutor y ramos ofrecidos.</li>
              <li>Buscar tutores por ramo y criterios disponibles.</li>
              <li>Gestionar solicitudes de clase entre estudiantes y tutores.</li>
              <li>Publicar y visualizar reseñas una vez completada una clase.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Alcance actual (v1)</h2>
            <p className="text-foreground/90">
              El alcance principal de la versión actual es gestión de clases (tutores, estudiantes,
              solicitudes, reseñas y notificaciones). Los pagos no forman parte del flujo crítico de v1.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Registro y cuentas</h2>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Debes entregar información veraz y mantenerla actualizada.</li>
              <li>Eres responsable de la confidencialidad de tus credenciales.</li>
              <li>No debes compartir tu cuenta con terceros.</li>
              <li>Podemos suspender cuentas ante uso indebido o fraude.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Reglas para tutores y estudiantes</h2>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Las solicitudes deben representar intención real de contratar una clase.</li>
              <li>Los tutores deben publicar información clara y no engañosa.</li>
              <li>El contacto debe usarse solo para fines académicos vinculados a clases.</li>
              <li>No se permite suplantación, spam o acoso.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Reseñas y reputación</h2>
            <p className="text-foreground/90 mb-4">
              El sistema de reputación busca reflejar experiencias reales.
            </p>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Solo se pueden dejar reseñas cuando una solicitud fue marcada como completada.</li>
              <li>Las reseñas deben ser honestas, pertinentes y respetuosas.</li>
              <li>Podemos moderar o remover contenido que infrinja estas reglas.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Contenidos prohibidos</h2>
            <p className="text-foreground/90 mb-4">No está permitido publicar contenido que:</p>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Sea ilegal, difamatorio, discriminatorio o amenazante.</li>
              <li>Vulnere derechos de terceros o propiedad intelectual.</li>
              <li>Incluya malware, phishing o cualquier actividad maliciosa.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Disponibilidad del servicio</h2>
            <p className="text-foreground/90">
              Hacemos esfuerzos razonables para mantener la plataforma disponible, pero no garantizamos
              continuidad absoluta ni ausencia total de errores o interrupciones.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Responsabilidad</h2>
            <p className="text-foreground/90">
              u-clases actúa como plataforma de intermediación y no garantiza resultados académicos,
              acuerdos económicos ni desempeño de tutores o estudiantes fuera de la aplicación.
              Cada usuario es responsable de sus decisiones y acuerdos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Propiedad intelectual</h2>
            <p className="text-foreground/90">
              El software, marca, interfaces y contenidos propios de la plataforma están protegidos por
              normativa aplicable. No está permitido copiar, distribuir o explotar comercialmente el
              contenido sin autorización.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Suspensión y término de cuenta</h2>
            <p className="text-foreground/90">
              Podemos suspender o cerrar cuentas ante incumplimientos graves de estos términos, intentos de
              fraude o riesgos de seguridad para la comunidad.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Cambios en los términos</h2>
            <p className="text-foreground/90">
              Podemos modificar estos términos para reflejar cambios legales o funcionales del producto.
              Publicaremos la versión actualizada con su fecha de vigencia en esta página.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contacto</h2>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-foreground/90">
              <p>Email legal: <a href="mailto:legal@u-clases.cl" className="text-primary hover:text-primary/80">legal@u-clases.cl</a></p>
              <p>Email general: <a href="mailto:contacto@u-clases.cl" className="text-primary hover:text-primary/80">contacto@u-clases.cl</a></p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
} 