import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/* ─── Langues de l'app ───────────────────────────────────────────────────
   Deux langues, comme sur le site : le français (langue d'origine) et
   l'anglais. Par défaut, la langue du téléphone : un appareil réglé en
   français affiche l'app en français, tout autre en anglais. Un choix fait
   dans les Paramètres est gardé sur le téléphone et prime ensuite.

   Les textes sont écrits côte à côte dans le code : `t("Bonjour", "Hello")`,
   comme sur le site. Les pages du site ouvertes dans l'app reçoivent la
   même langue (`?lang=` ajouté à l'adresse, voir `withLang`). */

export type Locale = 'fr' | 'en'
export type Translate = <T>(fr: T, en: T) => T

const STORAGE_KEY = 'tc-lang'

export function isLocale(v: unknown): v is Locale {
  return v === 'fr' || v === 'en'
}

/* Langue du téléphone, lue par Intl (aucun module natif nécessaire). */
export function deviceLocale(): Locale {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale ?? ''
    return tag.toLowerCase().startsWith('fr') ? 'fr' : 'en'
  } catch {
    return 'fr'
  }
}

/* Code BCP 47 pour Intl / toLocaleString : "fr-FR" ou "en-GB". */
export function intlLocale(locale: Locale) {
  return locale === 'en' ? 'en-GB' : 'fr-FR'
}

export function makeT(locale: Locale): Translate {
  return (fr, en) => (locale === 'en' ? en : fr)
}

/* Langue courante hors de React (fonctions utilitaires, écran d'erreur
   global, canal de notifications Android). Tenue à jour par le provider. */
let current: Locale = deviceLocale()
export const getLocale = () => current
export const getT = (): Translate => makeT(current)

/* Ajoute `lang=` à une adresse ou un chemin du site : le proxy du site pose
   le cookie de langue puis redirige sans le paramètre. */
export function withLang(url: string, locale: Locale) {
  const hash = url.indexOf('#')
  const base = hash >= 0 ? url.slice(0, hash) : url
  const frag = hash >= 0 ? url.slice(hash) : ''
  const cleaned = base.replace(/([?&])lang=[^&]*(&|$)/, (_m, p1: string, p2: string) => (p2 ? p1 : ''))
  const sep = cleaned.includes('?') ? (cleaned.endsWith('?') || cleaned.endsWith('&') ? '' : '&') : '?'
  return `${cleaned}${sep}lang=${locale}${frag}`
}

type LocaleState = {
  locale: Locale
  /* Vrai quand la langue a été choisie dans l'app plutôt que suivie. */
  chosen: boolean
  setLocale: (l: Locale | null) => void
}

const LocaleContext = createContext<LocaleState | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ locale: Locale; chosen: boolean }>(() => ({
    locale: current,
    chosen: false,
  }))

  /* Choix enregistré lors d'un précédent lancement. */
  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (cancelled || !isLocale(saved)) return
        current = saved
        setState({ locale: saved, chosen: true })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  /* null : revenir à la langue du téléphone. */
  const setLocale = useCallback((l: Locale | null) => {
    const next = l ?? deviceLocale()
    current = next
    setState({ locale: next, chosen: l !== null })
    const write = l ? AsyncStorage.setItem(STORAGE_KEY, l) : AsyncStorage.removeItem(STORAGE_KEY)
    write.catch(() => {})
  }, [])

  const value = useMemo(() => ({ ...state, setLocale }), [state, setLocale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/* Hors du provider (écran d'erreur racine), on retombe sur la langue
   courante du module. */
export function useLocale(): Locale {
  return useContext(LocaleContext)?.locale ?? current
}

export function useIntlLocale() {
  return intlLocale(useLocale())
}

export function useT(): Translate {
  const locale = useLocale()
  return useMemo(() => makeT(locale), [locale])
}

export function useLocaleChoice() {
  const ctx = useContext(LocaleContext)
  return {
    locale: ctx?.locale ?? current,
    chosen: ctx?.chosen ?? false,
    setLocale: ctx?.setLocale ?? (() => {}),
  }
}
