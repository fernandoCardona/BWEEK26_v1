import React, { useState } from 'react';
import axios from 'axios';

export default function Widget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    try {
      const res = await axios.post('/chatbot/message', { message: userMsg.content });
      const botMsg = { role: 'assistant', content: res.data.echo || 'ok' };
      setMessages((m) => [...m, botMsg]);
    } catch {
      const botMsg = { role: 'assistant', content: 'Error' };
      setMessages((m) => [...m, botMsg]);
    }
  };
  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 rounded-full px-6 py-3 bg-accent-primary text-white font-bold shadow-lg"
      >
        Chat
      </button>
      {open && (
        <div className="fixed bottom-20 right-6 w-96 glass-card p-4">
          <div className="h-64 overflow-y-auto space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <span className="inline-block px-3 py-2 rounded-xl bg-white/10">{m.content}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
              placeholder="Escribe un mensaje"
            />
            <button onClick={send} className="btn-primary px-4 py-2">Enviar</button>
          </div>
        </div>
      )}
    </>
  );
}
