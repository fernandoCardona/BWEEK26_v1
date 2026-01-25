import React from 'react';
import Layout from '@/Layouts/Layout';
import { motion } from 'framer-motion';

export default function Page({ category, slug, title, text, images }) {
  return (
    <Layout>
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">
            {title}
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card">
              <div className="prose prose-invert max-w-none">
                {text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
            <div className="glass-card">
              <div className="grid grid-cols-2 gap-3">
                {images.map((src, i) => (
                  <motion.img
                    key={i}
                    src={src}
                    className="w-full h-32 object-cover rounded-xl border border-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
