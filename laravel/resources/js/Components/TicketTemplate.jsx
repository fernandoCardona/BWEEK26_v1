import React from 'react';

export default function TicketTemplate({ ticket, event, user }) {
    const name = event?.name || 'Evento';
    const subtitle = [event?.event_date, event?.address].filter(Boolean).join(' | ');

    return (
        <div className="max-w-sm mx-auto my-10 bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200">
            <div className="bg-black p-6 text-white relative">
                <div className="absolute top-0 right-0 m-4 bg-yellow-400 text-black text-[10px] font-bold px-2 py-1 rounded">
                    PREMIUM ACCESS
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">{name}</h1>
                {event?.parent_name ? <p className="text-gray-300 text-xs mt-2 font-mono">{event.parent_name}</p> : null}
                <p className="text-gray-400 text-xs mt-2 font-mono">{subtitle}</p>
            </div>

            <div className="p-8 flex flex-col items-center bg-white relative">
                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-full shadow-inner"></div>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-100 rounded-full shadow-inner"></div>

                <div className="w-full mb-6 border-b border-dashed border-gray-200 pb-6 text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Asistente</p>
                    <p className="text-lg font-bold text-gray-900">{user?.name || '—'}</p>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-white p-4 rounded-xl border border-gray-100 shadow-sm" dangerouslySetInnerHTML={{ __html: ticket?.qr_svg || '' }} />
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-mono text-gray-400">{String(ticket?.id || '').toUpperCase()}</p>
                    <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest border border-green-100">
                        Válido para 1 Persona
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                <p className="text-[9px] text-gray-400 leading-tight">
                    Este ticket es único y personal. Al ser escaneado por primera vez quedará invalidado para accesos posteriores.
                </p>
            </div>
        </div>
    );
}

