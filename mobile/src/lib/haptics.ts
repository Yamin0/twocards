import * as Haptics from 'expo-haptics'

/* Retour haptique discret, comme dans les apps système : un léger tic quand
   une action part, une confirmation quand elle réussit, un avertissement
   quand elle est refusée. Jamais bloquant : sur un appareil sans moteur,
   l'appel échoue en silence. */

const quiet = (p: Promise<void>) => p.catch(() => {})

export const haptic = {
  tap: () => quiet(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => quiet(Haptics.selectionAsync()),
  success: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => quiet(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
}
