import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from '@/lib/auth-context'
import { SITE_URL } from '@/lib/site'
import { supabase } from '@/lib/supabase'

/* Session *web* des WebViews, distincte de la session native.

   Cycle : connexion native → on demande à la fonction « mobile-session » un
   jeton à usage unique → la première WebView affichée (« propriétaire »)
   charge /auth/mobile?token_hash=…&next=… sur le site, qui pose les cookies
   et redirige → elle signale « prête » → les autres onglets chargent leur
   page directement, les cookies étant partagés entre WebViews. */

type State = {
  user: string | null
  attempt: number
  tokenHash: string | null
  ready: boolean
  error: string | null
  owner: string | null
}

const initial = (user: string | null): State => ({
  user,
  attempt: 0,
  tokenHash: null,
  ready: false,
  error: null,
  owner: null,
})

type WebSessionState = {
  ready: boolean
  error: string | null
  owner: string | null
  /* La première WebView à s'enregistrer devient propriétaire du jeton. */
  register: (key: string) => void
  unregister: (key: string) => void
  /* URL de la passerelle pour le propriétaire, null tant que le jeton
     n'est pas arrivé. */
  bridgeUrl: (next: string) => string | null
  markReady: () => void
  retry: () => void
  loggedOut: () => void
}

const WebSessionContext = createContext<WebSessionState | null>(null)

export function WebSessionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null

  const [state, setState] = useState<State>(() => initial(userId))

  /* Nouvel utilisateur (connexion, déconnexion) : tout repart de zéro. */
  if (state.user !== userId) {
    setState(initial(userId))
  }

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase.functions
      .invoke<{ token_hash?: string; error?: string }>('mobile-session')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data?.token_hash) {
          setState((s) => ({
            ...s,
            error:
              data?.error ??
              "Impossible d'ouvrir votre espace. Vérifiez votre connexion et réessayez.",
          }))
          return
        }
        setState((s) => ({ ...s, tokenHash: data.token_hash ?? null }))
      })
    return () => {
      cancelled = true
    }
  }, [userId, state.attempt])

  const register = useCallback((key: string) => {
    setState((s) => (s.owner || s.ready ? s : { ...s, owner: key }))
  }, [])

  const unregister = useCallback((key: string) => {
    setState((s) => (s.owner === key && !s.ready ? { ...s, owner: null } : s))
  }, [])

  const { tokenHash } = state
  const bridgeUrl = useCallback(
    (next: string) =>
      tokenHash
        ? `${SITE_URL}/auth/mobile?token_hash=${encodeURIComponent(
            tokenHash
          )}&next=${encodeURIComponent(next)}`
        : null,
    [tokenHash]
  )

  const markReady = useCallback(
    () => setState((s) => (s.ready ? s : { ...s, ready: true })),
    []
  )

  const retry = useCallback(
    () =>
      setState((s) => ({
        ...s,
        attempt: s.attempt + 1,
        tokenHash: null,
        ready: false,
        error: null,
      })),
    []
  )

  const loggedOut = useCallback(() => {
    supabase.auth.signOut()
  }, [])

  return (
    <WebSessionContext.Provider
      value={{
        ready: state.ready,
        error: state.error,
        owner: state.owner,
        register,
        unregister,
        bridgeUrl,
        markReady,
        retry,
        loggedOut,
      }}>
      {children}
    </WebSessionContext.Provider>
  )
}

export function useWebSession() {
  const ctx = useContext(WebSessionContext)
  if (!ctx) throw new Error('useWebSession hors de WebSessionProvider')
  return ctx
}
