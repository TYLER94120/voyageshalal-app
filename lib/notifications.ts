// ─────────────────────────────────────────────────────────────────────────────
// Notifications « Adhan » : appels à la prière programmés localement. Les
// notifications locales se déclenchent même application fermée.
//
// Note audio : pour faire jouer un véritable adhan (et non le son de
// notification par défaut), ajoutez un fichier dans assets/sounds/ et déclarez
// le plugin expo-notifications avec `sounds`, puis remplacez ADHAN_SOUND par le
// nom du fichier (voir assets/sounds/README.md). iOS limite le son d'une
// notification à ~30 s.
// ─────────────────────────────────────────────────────────────────────────────

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { type MadhabKey } from './prayer';
import { type AdhanPrayer } from './notificationSettings';
import { buildSchedule } from './adhanSchedule';
import { buildPersistentContent } from './persistentNotif';

export { buildSchedule } from './adhanSchedule';

// Les canaux Android sont IMMUABLES une fois créés → on versionne les ids pour
// appliquer les nouveaux réglages (son, écran verrouillé) sur les téléphones
// où l'ancienne version existait déjà. v3 = vrai son d'adhan embarqué.
export const ADHAN_CHANNEL = 'adhan-v3';
// Notification « horaires épinglés » : canal silencieux + id fixe (remplaçable).
export const PERSISTENT_CHANNEL = 'prayer-persistent-v2';
export const PERSISTENT_ID = 'prayer-persistent';
const OLD_CHANNELS = ['adhan', 'adhan-v2', 'prayer-persistent'];

async function dropOldChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  for (const id of OLD_CHANNELS) {
    try {
      await Notifications.deleteNotificationChannelAsync(id);
    } catch {
      // canal absent
    }
  }
}
// Vrai adhan embarqué : assets/sounds/adhan.mp3, déclaré dans le plugin
// expo-notifications (app.json). Nécessite un build complet (pas OTA) — le
// fichier doit exister dans assets/sounds/ au moment du build.
const ADHAN_SOUND: string | boolean = 'adhan.mp3';

let handlerConfigured = false;

/** À appeler au démarrage : affiche alerte + son quand l'app est au premier plan. */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await dropOldChannels();
  await Notifications.setNotificationChannelAsync(ADHAN_CHANNEL, {
    name: 'Adhan — appels à la prière',
    // MAX + son + vibration : l'appel doit s'entendre, même écran verrouillé.
    importance: Notifications.AndroidImportance.MAX,
    sound: typeof ADHAN_SOUND === 'string' ? ADHAN_SOUND : 'default',
    vibrationPattern: [0, 400, 250, 400, 250, 400],
    enableVibrate: true,
    lightColor: '#c9a84c',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export async function cancelAdhan(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export interface RescheduleParams {
  enabled: boolean;
  latitude: number;
  longitude: number;
  methodKey: string;
  madhab: MadhabKey;
  prayers: Record<AdhanPrayer, boolean>;
  now?: Date;
}

export type RescheduleResult =
  | { status: 'off'; count: 0 }
  | { status: 'denied'; count: 0 }
  | { status: 'scheduled'; count: number };

/** Reprogramme toutes les notifications adhan selon les réglages courants. */
export async function rescheduleAdhan(params: RescheduleParams): Promise<RescheduleResult> {
  await cancelAdhan();
  if (!params.enabled) return { status: 'off', count: 0 };

  const granted = await requestNotificationPermission();
  if (!granted) return { status: 'denied', count: 0 };

  await ensureAndroidChannel();

  const now = params.now ?? new Date();
  const items = buildSchedule(
    params.latitude,
    params.longitude,
    now,
    params.methodKey,
    params.madhab,
    params.prayers,
  );

  for (const item of items) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🕌 ${item.label}`,
        body: `C'est l'heure de la prière (${item.label}).`,
        sound: ADHAN_SOUND,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        channelId: ADHAN_CHANNEL,
        date: item.date,
      },
    });
  }
  return { status: 'scheduled', count: items.length };
}

// ─── Horaires épinglés (notification permanente) ─────────────────────────────

async function ensurePersistentChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await dropOldChannels();
  await Notifications.setNotificationChannelAsync(PERSISTENT_CHANNEL, {
    name: 'Horaires de prière (épinglés)',
    // DEFAULT (sans son) : reste visible sur l'ÉCRAN VERROUILLÉ, contrairement
    // à LOW qui peut être replié/masqué selon les constructeurs.
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
    showBadge: false,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export interface PersistentParams {
  enabled: boolean;
  latitude: number;
  longitude: number;
  methodKey: string;
  madhab: MadhabKey;
  now?: Date;
}

export type PersistentResult = 'ok' | 'off' | 'denied' | 'error';

/**
 * Met à jour (ou retire) la notification permanente des horaires. Sticky sur
 * Android (non balayable). Se rafraîchit à chaque appel (mêmes id → remplace) :
 * l'app la reposte à l'ouverture pour rester à jour. iOS n'a pas de permanent →
 * on affiche une notification simple (best-effort). Ne lève jamais : retourne
 * un statut pour que l'UI puisse EXPLIQUER un échec (permission, erreur).
 */
export async function updatePersistentNotification(params: PersistentParams): Promise<PersistentResult> {
  // Toujours retirer l'épingle précédente (affichée et/ou programmée).
  try {
    await Notifications.dismissNotificationAsync(PERSISTENT_ID);
  } catch {
    // rien à retirer
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(PERSISTENT_ID);
  } catch {
    // rien à annuler
  }
  if (!params.enabled) return 'off';

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return 'denied';
    await ensurePersistentChannel();

    const { title, subtitle, body } = buildPersistentContent(
      params.latitude,
      params.longitude,
      params.now ?? new Date(),
      params.methodKey,
      params.madhab,
    );

    await Notifications.scheduleNotificationAsync({
      identifier: PERSISTENT_ID,
      content: {
        title,
        subtitle,
        body,
        color: '#c9a84c',
        sound: false,
        sticky: Platform.OS === 'android', // ongoing : non balayable
        autoDismiss: false,
      },
      // { channelId } = livraison immédiate sur le canal silencieux (Android).
      trigger: Platform.OS === 'android' ? { channelId: PERSISTENT_CHANNEL } : null,
    });
    return 'ok';
  } catch (err) {
    console.warn('[notif] épingle échec', err);
    return 'error';
  }
}
