# Sons d'adhan

Ce dossier accueille les fichiers audio de l'appel à la prière utilisés par les
notifications locales (`expo-notifications`).

Par défaut, l'app utilise le **son de notification système** (`ADHAN_SOUND = 'default'`
dans `lib/notifications.ts`). Pour faire jouer un véritable adhan :

1. Déposez ici un fichier audio court, p. ex. `adhan.wav`
   (format recommandé : WAV/AIFF/CAF ; iOS limite la durée du son d'une
   notification à ~30 secondes — utilisez un extrait, pas l'adhan complet).
2. Déclarez-le dans `app.json`, plugin `expo-notifications` :

   ```json
   [
     "expo-notifications",
     {
       "color": "#0b1a0f",
       "sounds": ["./assets/sounds/adhan.wav"]
     }
   ]
   ```

3. Dans `lib/notifications.ts`, remplacez :

   ```ts
   const ADHAN_SOUND: string | boolean = 'default';
   ```

   par le nom du fichier (sans le chemin) :

   ```ts
   const ADHAN_SOUND: string | boolean = 'adhan.wav';
   ```

4. Reconstruisez l'app (`npx expo prebuild` puis build natif) — le son
   personnalisé doit être embarqué dans le bundle natif, il n'est pas
   téléchargeable à chaud (OTA).

5. **Android — important** : le son d'un canal de notification est figé à sa
   création et **immuable** ensuite. Sur les installations existantes (où le
   canal `adhan` a déjà été créé avec le son par défaut), changer `ADHAN_SOUND`
   ne suffit pas. Il faut soit **incrémenter l'identifiant du canal**
   (`ADHAN_CHANNEL = 'adhan-v2'` dans `lib/notifications.ts`), soit appeler
   `Notifications.deleteNotificationChannelAsync('adhan')` avant de le recréer,
   pour que le nouveau son soit pris en compte.

> Pour un adhan **complet** joué app fermée (au-delà de la limite ~30 s du son
> de notification), il faut une lecture audio en arrière-plan dédiée
> (`expo-av` + tâche/foreground service) — hors périmètre des notifications
> locales simples.
