import React from 'react';
import Navigation from '@/Components/Layout/Navigation';
import Footer from '@/Components/Layout/Footer';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-background text-white selection:bg-accent-primary">
            <Navigation />
            <main>{children}</main>
            <Footer />

            {/* Chatbot Portal - Placeholder for phase 4 */}
            <div id="chatbot-portal" />
        </div>
    );
}
