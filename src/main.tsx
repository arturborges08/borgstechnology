import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, NavLink, Route, Routes, useLocation, Link } from 'react-router-dom';
import { supabase } from './supabase';
import { AuthProvider, useAuth } from './session';
import './app.css';
import { Login, Signup, Forgot, ResetPassword } from './pages/auth';
import { Consent, Profile, Tasks, TaskDetail, Submissions, Wallet, Home } from './pages/collector';
import { Admin } from './pages/admin';

function Shell({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/" translate="no" aria-label="Borgs Technology"><img src="/logo-mark.svg" alt="" width="30" height="30" /><span className="word">Borgs<small>Technology</small></span></a>
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
