import { StatusBar } from 'expo-status-bar'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { CardShadow, Light } from '@/constants/theme'
import { initials, type ReservationStatus } from '@/lib/venue-data'

/* Briques des écrans clairs de l'établissement. */

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      {children}
    </SafeAreaView>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'accent' | 'warning' | 'success'
}) {
  const color =
    tone === 'accent'
      ? Light.accent
      : tone === 'warning'
        ? Light.warning
        : tone === 'success'
          ? Light.success
          : Light.ink
  return (
    <View style={[styles.card, styles.kpi]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? <Text style={styles.kpiHint}>{hint}</Text> : null}
    </View>
  )
}

const STATUS: Record<ReservationStatus, { label: string; fg: string; bg: string }> = {
  'en attente': { label: 'En attente', fg: Light.warning, bg: Light.warningSoft },
  confirmée: { label: 'Confirmée', fg: Light.success, bg: Light.successSoft },
  annulée: { label: 'Refusée', fg: Light.danger, bg: Light.dangerSoft },
  'no-show': { label: 'No-show', fg: Light.muted, bg: Light.line },
}

export function StatusPill({ status }: { status: ReservationStatus }) {
  const s = STATUS[status]
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.pillText, { color: s.fg }]}>{s.label}</Text>
    </View>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials(name) || '?'}</Text>
    </View>
  )
}

export function Chip({
  label,
  count,
  active,
  onPress,
}: {
  label: string
  count?: number
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityState={{ selected: active }}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
        {count !== undefined && count > 0 ? ` ${count}` : ''}
      </Text>
    </Pressable>
  )
}

export function Button({
  label,
  onPress,
  tone = 'accent',
  small,
  icon,
  style,
}: {
  label: string
  onPress: () => void
  tone?: 'accent' | 'success' | 'danger' | 'ghost'
  small?: boolean
  icon?: ReactNode
  style?: ViewStyle
}) {
  const bg =
    tone === 'accent'
      ? Light.accent
      : tone === 'success'
        ? Light.success
        : tone === 'danger'
          ? Light.dangerSoft
          : Light.bg
  const fg = tone === 'danger' ? Light.danger : tone === 'ghost' ? Light.ink : '#FFFFFF'
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: pressed ? 0.75 : 1 },
        style,
      ]}>
      {icon}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: fg }]}>{label}</Text>
    </Pressable>
  )
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Light.bg,
  },
  card: {
    backgroundColor: Light.card,
    borderRadius: 18,
    padding: 16,
    ...CardShadow,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.2,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: Light.accent,
  },
  kpi: {
    flex: 1,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Light.muted,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  kpiHint: {
    fontSize: 11,
    color: Light.faint,
    marginTop: 2,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  avatar: {
    backgroundColor: Light.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
    color: Light.accent,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: Light.card,
    borderWidth: 1,
    borderColor: Light.line,
  },
  chipActive: {
    backgroundColor: Light.ink,
    borderColor: Light.ink,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Light.muted,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonSmall: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  buttonTextSmall: {
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: Light.muted,
    textAlign: 'center',
  },
})
