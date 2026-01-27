import React, { useCallback, useState } from 'react';
import Navigation from '@/Components/Layout/Navigation';
import Footer from '@/Components/Layout/Footer';
import LegalModal from '@/Components/Layout/LegalModal';

export default function Layout({ children }) {
    const [legalOpen, setLegalOpen] = useState(null);
    const openLegal = useCallback((key) => setLegalOpen(key), []);
    const closeLegal = useCallback(() => setLegalOpen(null), []);

    return (
        <div className="min-h-screen bg-background text-white selection:bg-accent-primary flex flex-col">
            <Navigation onOpenLegal={openLegal} />
            <main className="flex-1">{children}</main>
            <Footer onOpenLegal={openLegal} />
            <LegalModal openKey={legalOpen} onClose={closeLegal} />

            {/* Chatbot Portal - Placeholder for phase 4 */}
            <div id="chatbot-portal" />
        </div>
    );
}
