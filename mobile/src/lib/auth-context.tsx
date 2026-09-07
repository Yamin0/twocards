import type { Session } from '@supabase/supabase-js'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { roleHome, type Role, type TabRole } from '@/lib/site'
import { supabase } from '@/lib/supabase'

type AuthState = {
  session: Session | null
  loading: boolean
  role: Role
  /* Jeu d'onglets : un établissement d'activité ou de service n'a pas les
     mêmes que restaurant ou club. */
  tabRole: TabRole
  home: string
  fullName: string | null
  venueName: string | null
}

const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  role: 'etablissement',
  tabRole: 'etablissement',
  home: roleHome.etablissement,
  fullName: null,
  venueName: null,
})

/* Même lecture que le site : app_metadata prime (non modifiable côté client),
   is_admin ouvre tous les espaces, défaut établissement. */
function roleOf(session: Session | null): Role {
  const user = session?.user
  if (!user) return 'etablissement'
  if (user.app_metadata?.is_admin === true) return 'admin'
  const raw = (user.app_metadata?.role ?? user.user_metadata?.role) as
    | string
    | undefined
  if (raw === 'hotel' || raw === 'concierge' || raw === 'admin') return raw
  return 'etablissement'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const role = roleOf(session)
  const meta = session?.user.user_metadata ?? {}
  const venueType = meta.venue_type as string | undefined
  const tabRole: TabRole =
    role === 'etablissement' && (venueType === 'activite' || venueType === 'service')
      ? 'activite'
      : role

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        role,
        tabRole,
        home: roleHome[role],
        fullName: (meta.full_name as string | undefined) ?? null,
        venueName: (meta.venue_name as string | undefined) ?? null,
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
