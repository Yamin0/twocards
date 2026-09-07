import Feather from '@expo/vector-icons/Feather'
import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ComponentProps, ReactNode } from 'react'
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { CardShadow, Light } from '@/constants/theme'
import { initials, type ReservationStatus } from '@/lib/venue-data'

/* Briques des écrans clairs. Icônes en traits (Feather), jamais d'emoji :
   même trait, même taille, même gris, quel que soit le téléphone. */

export type IconName = ComponentProps<typeof Feather>['name']

export function Icon({
  name,
  size = 18,
  color = Light.ink,
}: {
  name: IconName
  size?: number
  color?: string
}) {
  return <Feather name={name} size={size} color={color} />
}

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      {children}
    </SafeAreaView>
  )
}

/* Écran empilé par-dessus les onglets : barre de titre, retour, contenu. */
export function StackScreen({
  title,
  subtitle,
  right,
  children,
  scroll = true,
  contentStyle,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
  scroll?: boolean
  contentStyle?: StyleProp<ViewStyle>
}) {
  const router = useRouter()
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <StatusBar style="dark" />
      <View style={styles.bar}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/hub'))}
          hitSlop={10}
          style={styles.barSide}
          accessibilityLabel="Retour">
          <Icon name="chevron-left" size={26} color={Light.ink} />
        </Pressable>
        <View style={styles.barCenter}>
          <Text style={styles.barTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.barSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.barSide, styles.barRight]}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.stackContent, contentStyle]}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.stackFill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
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

/* Ligne de liste : icône dans une pastille, libellé, sous-titre, chevron. */
export function ListRow({
  icon,
  label,
  hint,
  right,
  onPress,
  first,
  tone = 'default',
}: {
  icon?: IconName
  label: string
  hint?: string
  right?: ReactNode
  onPress?: () => void
  first?: boolean
  tone?: 'default' | 'danger'
}) {
  const ink = tone === 'danger' ? Light.danger : Light.ink
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, !first && styles.rowBorder, pressed && styles.pressed]}>
      {icon && (
        <View style={styles.rowIcon}>
          <Icon name={icon} size={17} color={tone === 'danger' ? Light.danger : Light.accent} />
        </View>
      )}
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: ink }]} numberOfLines={1}>
          {label}
        </Text>
        {hint ? (
          <Text style={styles.rowHint} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron-right" size={18} color={Light.faint} /> : null)}
    </Pressable>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'default',
  onPress,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'accent' | 'warning' | 'success'
  /* Chaque chiffre mène quelque part : la liste qu'il résume. */
  onPress?: () => void
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
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, styles.kpi, pressed && styles.pressed]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.kpiHint}>{hint ?? (onPress ? 'Voir' : ' ')}</Text>
    </Pressable>
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

export function Pill({ label, tone = 'muted' }: { label: string; tone?: 'muted' | 'accent' | 'success' | 'warning' }) {
  const map = {
    muted: { fg: Light.muted, bg: Light.line },
    accent: { fg: Light.accent, bg: Light.accentSoft },
    success: { fg: Light.success, bg: Light.successSoft },
    warning: { fg: Light.warning, bg: Light.warningSoft },
  }[tone]
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Text style={[styles.pillText, { color: map.fg }]}>{label}</Text>
    </View>
  )
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
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

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <View style={styles.segment}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.segmentItem, value === o.value && styles.segmentActive]}>
          <Text style={[styles.segmentText, value === o.value && styles.segmentTextActive]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function Button({
  label,
  onPress,
  tone = 'accent',
  small,
  icon,
  style,
  disabled,
}: {
  label: string
  onPress: () => void
  tone?: 'accent' | 'success' | 'danger' | 'ghost'
  small?: boolean
  icon?: IconName
  style?: StyleProp<ViewStyle>
  disabled?: boolean
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
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.75 : 1 },
        style,
      ]}>
      {icon && <Icon name={icon} size={small ? 14 : 16} color={fg} />}
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: fg }]}>{label}</Text>
    </Pressable>
  )
}

export function Empty({ icon, title, body }: { icon?: IconName; title: string; body: string }) {
  return (
    <View style={styles.empty}>
      {icon && (
        <View style={styles.emptyIcon}>
          <Icon name={icon} size={22} color={Light.accent} />
        </View>
      )}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  )
}

export const inputStyle = {
  height: 46,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: Light.line,
  backgroundColor: Light.card,
  paddingHorizontal: 14,
  fontSize: 15,
  color: Light.ink,
} as const

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Light.bg,
  },
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  barSide: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barRight: {
    alignItems: 'flex-end',
    width: 'auto',
    minWidth: 44,
    paddingRight: 6,
  },
  barCenter: {
    flex: 1,
    alignItems: 'center',
  },
  barTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Light.ink,
    letterSpacing: -0.2,
  },
  barSubtitle: {
    fontSize: 12,
    color: Light.muted,
  },
  stackContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  stackFill: {
    flex: 1,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: Light.line,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Light.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowHint: {
    fontSize: 12,
    color: Light.muted,
  },
  kpi: {
    flex: 1,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
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
  segment: {
    flexDirection: 'row',
    backgroundColor: Light.bg,
    borderRadius: 10,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segmentItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: Light.card,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Light.muted,
  },
  segmentTextActive: {
    color: Light.ink,
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
    gap: 6,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Light.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Light.ink,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 19,
    color: Light.muted,
    textAlign: 'center',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Light.muted,
    marginLeft: 2,
  },
  fieldHint: {
    fontSize: 11,
    color: Light.faint,
    marginLeft: 2,
  },
})
