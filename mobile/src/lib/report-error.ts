import * as Application from 'expo-application'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

import { supabase } from '@/lib/supabase'

/* Journal des erreurs, dans la table app_errors.

   Tout message d'erreur montré à l'utilisateur et tout plantage d'écran y
   sont consignés avec l'appareil, la version du système et le build : ce
   qu'un testeur a vu devient lisible sans capture d'écran. L'envoi ne doit
   jamais gêner l'app : pas d'attente, pas d'exception, et au plus un envoi
   identique toutes les trente secondes pour ne pas inonder la table. */

type Kind = 'crash' | 'message' | 'unhandled'

const recent = new Map<string, number>()

const cut = (s: string | undefined | null, max: number) => (s ? s.slice(0, max) : null)

export function reportError(kind: Kind, message: string, context?: string, stack?: string) {
  try {
    const key = `${kind}|${context ?? ''}|${message}`
    const now = Date.now()
    const last = recent.get(key)
    if (last && now - last < 30000) return
    recent.set(key, now)

    const row = {
      kind,
      message: cut(message, 2000) ?? 'inconnu',
      context: cut(context, 200),
      stack: cut(stack, 8000),
      platform: Platform.OS,
      os_version: cut(`${Device.osName ?? ''} ${Device.osVersion ?? ''}`.trim(), 40),
      device: cut(Device.modelName ?? Device.deviceType?.toString() ?? null, 80),
      app_version: cut(`${Application.nativeApplicationVersion ?? '?'} (${Application.nativeBuildVersion ?? '?'})`, 40),
    }
    void supabase
      .from('app_errors')
      .insert(row)
      .then(
        () => {},
        () => {}
      )
  } catch {
    /* Le journal ne doit jamais faire planter l'app. */
  }
}

/* Plantages hors écran (promesses, minuteries) : consignés, puis confiés au
   gestionnaire d'origine pour garder le comportement normal. */
let installed = false
export function installGlobalErrorReporter() {
  if (installed) return
  installed = true
  const g = globalThis as unknown as {
    ErrorUtils?: {
      getGlobalHandler: () => (error: unknown, isFatal?: boolean) => void
      setGlobalHandler: (h: (error: unknown, isFatal?: boolean) => void) => void
    }
  }
  const utils = g.ErrorUtils
  if (!utils) return
  const previous = utils.getGlobalHandler()
  utils.setGlobalHandler((error, isFatal) => {
    const e = error instanceof Error ? error : new Error(String(error))
    reportError(isFatal ? 'crash' : 'unhandled', e.message, isFatal ? 'fatal' : 'global', e.stack)
    previous(error, isFatal)
  })
}
