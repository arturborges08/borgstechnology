import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { TERMS_VERSION } from './config';

export type Profile = {
  id: string; full_name: string; phone: string | null; city: string | null; state: string | null;
  device: string | null; pix_key: string | null; role: 'contributor' | 'admin'; status: 'pending' | 'approved' | 'blocked';
};
type Ctx = { session: any; profile: Profile | null; consented: boolean; loading: boolean; refresh: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ session: null, profile: null, consented: false, loading: true, refresh: async () => {} });
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (s: any) => {
    if (!s) { setProfile(null); setConsented(false); setLoading(false); return; }
    const uid = s.user.id;
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('consents').select('id').eq('user_id', uid).eq('terms_version', TERMS_VERSION).maybeSingle(),
    ]);
    setProfile(p as Profile | null); setConsented(!!c); setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); load(data.session); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setTimeout(() => load(s), 0); });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const refresh = useCallback(async () => { await load(session); }, [load, session]);
  return <AuthCtx.Provider value={{ session, profile, consented, loading, refresh }}>{children}</AuthCtx.Provider>;
}

