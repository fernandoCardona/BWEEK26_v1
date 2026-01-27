import React from 'react';
import { FiX } from 'react-icons/fi';
import useLockBodyScroll from '@/hooks/useLockBodyScroll';

const contentByKey = {
    privacy: {
        title: 'Política de Privacidad',
        sections: [
            {
                title: '1. Responsable del tratamiento',
                body: 'Bears Sitges Week (en adelante, “BSW”) gestiona este sitio web y los servicios asociados (eventos, entradas, ecommerce y atención al usuario).',
            },
            {
                title: '2. Datos que recopilamos',
                body: 'Podemos recopilar datos de cuenta (nombre, email, contraseña), datos de perfil (teléfono, dirección, ciudad, país), información de compras y tickets, así como datos técnicos (IP, navegador, logs) para seguridad y funcionamiento.',
            },
            {
                title: '3. Finalidades',
                body: 'Usamos los datos para: crear y administrar tu cuenta, procesar compras y tickets, enviar comunicaciones relacionadas (confirmaciones, incidencias), prevenir fraude/abusos, y mejorar la experiencia del sitio.',
            },
            {
                title: '4. Base legal',
                body: 'Tratamos datos en base a la ejecución de un contrato (servicios de ecommerce/tickets), el cumplimiento de obligaciones legales y el interés legítimo en seguridad y prevención de abusos. Cuando aplique, pediremos consentimiento.',
            },
            {
                title: '5. Conservación',
                body: 'Conservamos los datos el tiempo necesario para la prestación del servicio, obligaciones legales y resolución de reclamaciones. Puedes solicitar eliminación de tu cuenta, salvo obligaciones de conservación.',
            },
            {
                title: '6. Derechos',
                body: 'Puedes ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad. También puedes gestionar tu perfil desde “Settings”.',
            },
        ],
    },
    cookies: {
        title: 'Política de Cookies',
        sections: [
            {
                title: '1. Qué son las cookies',
                body: 'Las cookies son pequeños archivos que se guardan en tu dispositivo para recordar preferencias y mejorar la experiencia de navegación.',
            },
            {
                title: '2. Cookies que usamos',
                body: 'Usamos cookies técnicas necesarias (sesión, seguridad, CSRF), y opcionalmente cookies de analítica/mejora cuando estén habilitadas. En el checkout y acceso a cuenta, las cookies técnicas son necesarias para funcionar.',
            },
            {
                title: '3. Cómo gestionar cookies',
                body: 'Puedes gestionar o bloquear cookies desde la configuración de tu navegador. Ten en cuenta que bloquear cookies esenciales puede impedir el acceso, compras o gestión de tickets.',
            },
        ],
    },
    terms: {
        title: 'Términos y Condiciones',
        sections: [
            {
                title: '1. Uso del sitio',
                body: 'Al utilizar este sitio aceptas estos términos. Debes proporcionar información veraz y no realizar usos abusivos (fuerza bruta, scraping no autorizado, explotación de vulnerabilidades).',
            },
            {
                title: '2. Cuenta',
                body: 'Eres responsable de mantener la confidencialidad de tus credenciales. Podemos suspender cuentas ante indicios de abuso o actividad fraudulenta.',
            },
            {
                title: '3. Ecommerce y tickets',
                body: 'Las compras pueden estar sujetas a disponibilidad y validaciones. Las entradas/tickets y productos pueden tener políticas específicas de cancelación, reembolso o cambios, indicadas durante el proceso de compra.',
            },
            {
                title: '4. Responsabilidad',
                body: 'BSW trabaja para mantener el sitio disponible y seguro, pero no garantiza ausencia total de interrupciones. En ningún caso la responsabilidad excederá el importe pagado por el servicio afectado, cuando aplique.',
            },
            {
                title: '5. Cambios',
                body: 'Podemos actualizar estos términos para reflejar mejoras del servicio o cambios legales. Publicaremos la versión vigente en este sitio.',
            },
        ],
    },
};

export default function LegalModal({ openKey, onClose }) {
    const open = !!openKey;
    useLockBodyScroll(open);

    if (!openKey) return null;

    const content = contentByKey[openKey] ?? contentByKey.privacy;

    return (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm px-6 py-10 overflow-y-auto" onMouseDown={onClose} role="dialog" aria-modal="true">
            <div className="max-w-3xl mx-auto" onMouseDown={(e) => e.stopPropagation()}>
                <div className="glass-card border border-white/15 bg-black/85 p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                                <span className="text-gradient">{content.title}</span>
                            </h2>
                            <p className="text-sm text-gray-400 mt-2">Contenido informativo genérico. Ajustable a requisitos legales finales.</p>
                        </div>
                        <button type="button" className="icon-btn icon-btn-gradient" aria-label="Cerrar" onClick={onClose}>
                            <FiX size={20} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {content.sections.map((s) => (
                            <section key={s.title} className="space-y-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-300">{s.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{s.body}</p>
                            </section>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                        <button type="button" className="btn-secondary px-6 py-3 text-sm" onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

