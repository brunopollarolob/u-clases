import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
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
            Este documento es una política informativa base para U-clases y puede requerir revisión legal
            profesional antes de su publicación comercial definitiva.
          </p>
        </div>

        <article className="prose prose-neutral max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-8">Política de Privacidad</h1>

          <p className="text-muted-foreground mb-8">
            <strong>Última actualización:</strong> {lastUpdated}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Responsable del tratamiento</h2>
            <p className="text-foreground/90">
              U-clases es una plataforma para conectar estudiantes y tutores de la FCFM (Universidad de Chile)
              en el contexto de clases particulares. Para consultas de privacidad, puedes escribir a
              <a href="mailto:privacy@u-clases.cl" className="text-primary hover:text-primary/80"> privacy@u-clases.cl</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Datos que recopilamos</h2>
            <p className="text-foreground/90 mb-4">Podemos recopilar las siguientes categorías de datos:</p>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Datos de cuenta: correo, nombre y credenciales de autenticación.</li>
              <li>Datos de perfil: teléfono, año académico, estado de egreso y foto de perfil (si la subes).</li>
              <li>Datos de uso: solicitudes de clase, estados, reseñas y actividad dentro de la plataforma.</li>
              <li>Datos técnicos: logs operativos, dirección IP aproximada, navegador y eventos básicos de rendimiento.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Finalidades del tratamiento</h2>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Crear y mantener cuentas de usuario.</li>
              <li>Permitir búsqueda de tutores, gestión de solicitudes y publicación de reseñas.</li>
              <li>Aplicar medidas de seguridad y prevención de abuso (por ejemplo, rate limiting).</li>
              <li>Mejorar la experiencia del producto y su estabilidad.</li>
              <li>Cumplir obligaciones legales aplicables.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Base legal</h2>
            <p className="text-foreground/90">
              Tratamos datos para la ejecución del servicio solicitado por la persona usuaria, para intereses
              legítimos vinculados a seguridad y mejora del producto, y cuando corresponda por consentimiento
              (por ejemplo, para cookies no esenciales o comunicaciones no operativas).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Almacenamiento y seguridad</h2>
            <p className="text-foreground/90 mb-4">
              Utilizamos infraestructura de terceros para autenticación, base de datos y almacenamiento,
              incluyendo Supabase. Implementamos controles técnicos razonables para proteger la información,
              como control de acceso, políticas de base de datos (RLS) y monitoreo básico.
            </p>
            <p className="text-foreground/90">
              Ningún sistema es 100% invulnerable, por lo que no podemos garantizar seguridad absoluta.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Comparticion de datos</h2>
            <p className="text-foreground/90 mb-4">No vendemos datos personales. Solo compartimos datos cuando:</p>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Es necesario para operar el servicio con proveedores técnicos (por ejemplo, hosting o autenticación).</li>
              <li>Existe obligación legal o requerimiento de autoridad competente.</li>
              <li>Es necesario para prevenir fraude, abuso o incidentes de seguridad.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies y tecnologías similares</h2>
            <p className="text-foreground/90 mb-4">Usamos cookies esenciales para:</p>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Inicio de sesión y continuidad de sesión.</li>
              <li>Seguridad y protección de formularios.</li>
              <li>Funcionamiento básico de la aplicación.</li>
            </ul>
            <p className="text-foreground/90">
              Podemos utilizar analítica de uso agregada para mejorar el producto. Puedes gestionar cookies en tu navegador.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Retención de datos</h2>
            <p className="text-foreground/90">
              Conservamos los datos mientras exista una cuenta activa o mientras sean necesarios para las finalidades
              descritas en esta política. Cuando corresponde, eliminamos o anonimizamos datos de manera segura.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Derechos de las personas usuarias</h2>
            <p className="text-foreground/90 mb-4">Puedes solicitar, según la normativa aplicable:</p>
            <ul className="list-disc pl-6 text-foreground/90 space-y-1">
              <li>Acceso a tus datos personales.</li>
              <li>Rectificación de datos inexactos.</li>
              <li>Eliminación de tu cuenta y datos asociados.</li>
              <li>Portabilidad u oposición al tratamiento en ciertos casos.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Menores de edad</h2>
            <p className="text-foreground/90">
              U-clases está orientada a la comunidad universitaria. Si detectamos tratamiento indebido de datos
              de menores sin autorización correspondiente, aplicaremos medidas de bloqueo o eliminación según proceda.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Cambios en esta politica</h2>
            <p className="text-foreground/90">
              Podemos actualizar esta política para reflejar cambios legales o de producto.
              Publicaremos la nueva versión en esta página con su fecha de actualización.
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contacto</h2>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-foreground/90">
              <p>Email privacidad: <a href="mailto:privacy@u-clases.cl" className="text-primary hover:text-primary/80">privacy@u-clases.cl</a></p>
              <p>Email general: <a href="mailto:contacto@u-clases.cl" className="text-primary hover:text-primary/80">contacto@u-clases.cl</a></p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
} 