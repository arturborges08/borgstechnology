import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, Link } from 'react-router-dom';
import { supabase } from './supabase';
import { AuthProvider, useAuth } from './session';
import './app.css';
import { Login, Signup, Forgot, ResetPassword } from './pages/auth';
import { Consent, Profile, Tasks, TaskDetail, Submissions, Wallet, Home } from './pages/collector';
import { Admin } from './pages/admin';
import { Record } from './pages/record';

const ic = (d: string) => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v10h14V10M10 20v-6h4v6',
  tasks: 'M4 6h16M4 12h16M4 18h10',
  sent: 'M12 16V4m0 0 4 4m-4-4L8 8M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4',
  wallet: 'M4 7a2 2 0 0 1 2-2h12v4M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2ZM16 14h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6',
};
function TabBar() {
  const items: [string, string, string][] = [['/', 'Início', ICONS.home], ['/tarefas', 'Tarefas', ICONS.tasks], ['/envios', 'Envios', ICONS.sent], ['/carteira', 'Carteira', ICONS.wallet], ['/perfil', 'Perfil', ICONS.user]];
  return (
    <nav className="tabbar" aria-label="Menu principal">
      {items.map(([to, label, d]) => <NavLink key={to} to={to} end={to === '/'}>{ic(d)}<span>{label}</span></NavLink>)}
    </nav>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/" translate="no" aria-label="Borgs Technology, início"><img src="/logo-mark.svg" alt="" width="30" height="30" /><span className="word">Borgs<small>Technology</small></span></Link>
        {session && profile && (
          <nav className="nav" aria-label="Menu">
            <NavLink to="/" end>Início</NavLink>
            <NavLink to="/tarefas">Tarefas</NavLink>
            <NavLink to="/envios">Meus envios</NavLink>
            <NavLink to="/carteira">Carteira</NavLink>
            <NavLink to="/perfil">Perfil</NavLink>
            {profile.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
            <a href="#" onClick={async (e) => { e.preventDefault(); await supabase.auth.signOut(); }}>Sair</a>
          </nav>
        )}
      </header>
      <main>{children}</main>
      {session && profile && <TabBar />}
    </div>
  );
}

function Guard({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const { session, profile, consented, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <p className="muted">Carregando…</p>;
  if (!session) return <Navigate to="/entrar" replace state={{ from: loc.pathname }} />;
  if (!profile) return <div className="alert error">Não encontramos seu perfil. Saia e entre de novo; se continuar, escreva para contato@borgsstore.com.br.</div>;
  if (!consented && profile.role !== 'admin' && loc.pathname !== '/termo') return <Navigate to="/termo" replace />;
  if (admin && profile.role !== 'admin') return <Navigate to="/" replace />;
  if (profile.status === 'blocked') return <div className="alert error">Seu cadastro está bloqueado. Fale com contato@borgsstore.com.br.</div>;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <AuthProvider>
        <Shell>
          <Routes>
            <Route path="/entrar" element={<Login />} />
            <Route path="/cadastro" element={<Signup />} />
            <Route path="/recuperar" element={<Forgot />} />
            <Route path="/nova-senha" element={<ResetPassword />} />
            <Route path="/termo" element={<Guard><Consent /></Guard>} />
            <Route path="/" element={<Guard><Home /></Guard>} />
            <Route path="/tarefas" element={<Guard><Tasks /></Guard>} />
            <Route path="/tarefas/:id" element={<Guard><TaskDetail /></Guard>} />
            <Route path="/tarefas/:id/gravar" element={<Guard><Record /></Guard>} />
            <Route path="/envios" element={<Guard><Submissions /></Guard>} />
            <Route path="/carteira" element={<Guard><Wallet /></Guard>} />
            <Route path="/perfil" element={<Guard><Profile /></Guard>} />
            <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Shell>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { scope: '/app/' }).catch(() => { /* sem offline, o app segue funcionando */ }); });
}
