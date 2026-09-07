import { StyleSheet, Text, View } from 'react-native'

import { Light } from '@/constants/theme'

/* Histogramme minimal : des barres arrondies, la dernière en accent plein,
   les autres en accent pâle — le regard va au présent. */
export function BarChart({
  data,
  height = 120,
}: {
  data: { key: string; label: string; value: number }[]
  height?: number
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <View style={[styles.wrap, { height: height + 22 }]}>
      {data.map((d, i) => {
        const last = i === data.length - 1
        const h = Math.max(6, (d.value / max) * height)
        return (
          <View key={d.key} style={styles.col}>
            <View style={[styles.track, { height }]}>
              <View
                style={[
                  styles.bar,
                  { height: h, backgroundColor: last ? Light.accent : Light.accentSoft },
                ]}
              />
            </View>
            <Text style={[styles.label, last && styles.labelLast]}>{d.label}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  track: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '70%',
    maxWidth: 28,
    borderRadius: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Light.faint,
  },
  labelLast: {
    color: Light.accent,
  },
})
