import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './bootstrap';

// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
});

const appName = import.meta.env.VITE_APP_NAME || 'Bears Week 2026';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#ff6b35',
    },
});
