import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated'

import { Icon, type IconName } from '@/components/venue/ui'
import { BottomTabInset, Light } from '@/constants/theme'

/* Un mot de confirmation en bas de l'écran, qui s'efface seul. Quand
   l'action se défait, le toast porte un bouton « Annuler » : refuser une
   réservation par erreur ne coûte alors qu'un geste. */

export type Toast = {
  message: string
  tone?: 'default' | 'success' | 'danger'
  action?: { label: string; onPress: () => void }
  duration?: number
}

type Api = { show: (t: Toast) => void; hide: () => void }

const ToastContext = createContext<Api>({ show: () => {}, hide: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<(Toast & { key: number }) | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seq = useRef(0)

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setCurrent(null)
  }, [])

  const show = useCallback(
    (t: Toast) => {
      if (timer.current) clearTimeout(timer.current)
      seq.current += 1
      setCurrent({ ...t, key: seq.current })
      timer.current = setTimeout(hide, t.duration ?? (t.action ? 5000 : 2600))
    },
    [hide]
  )

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const api = useMemo(() => ({ show, hide }), [show, hide])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current && <ToastView toast={current} onHide={hide} />}
    </ToastContext.Provider>
  )
}

const ICONS: Record<NonNullable<Toast['tone']>, IconName> = {
  default: 'info',
  success: 'check-circle',
  danger: 'alert-circle',
}

function ToastView({ toast, onHide }: { toast: Toast & { key: number }; onHide: () => void }) {
  const insets = useSafeAreaInsets()
  const tone = toast.tone ?? 'default'
  const iconColor = tone === 'success' ? '#6EE7B7' : tone === 'danger' ? '#FCA5A5' : 'rgba(255,255,255,0.7)'
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + BottomTabInset + 12 }]}>
      <Animated.View key={toast.key} entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(180)} style={styles.toast}>
        <Icon name={ICONS[tone]} size={16} color={iconColor} />
        <Text style={styles.text} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.action && (
          <Pressable
            onPress={() => {
              toast.action?.onPress()
              onHide()
            }}
            hitSlop={8}
            style={styles.action}>
            <Text style={styles.actionText}>{toast.action.label}</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 900,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 520,
    width: '100%',
    backgroundColor: Light.ink,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 19,
  },
  action: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
