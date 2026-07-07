# Son d'adhan

L'app est configurée pour jouer un **vrai adhan** aux heures de prière :
`lib/notifications.ts` référence `adhan.mp3` et le plugin `expo-notifications`
(`app.json`) l'embarque au moment du build.

## ⚠️ Fichier requis AVANT tout `eas build`

Placer ici un fichier nommé **exactement** :

```
assets/sounds/adhan.mp3
```

Sans lui, le build ÉCHOUE (le plugin doit copier ce fichier dans l'app).

## Recommandations
- **Durée ~1 minute max** (un extrait : takbir + premières phrases). iOS coupe
  le son d'une notification à ~30 s ; Android joue plus long, mais un adhan
  complet de 4 min n'est pas adapté à une notification.
- Format MP3. (Pour un autre format, renommer ici + dans `app.json` +
  `ADHAN_SOUND` dans `lib/notifications.ts`.)
- Utiliser un enregistrement dont on a le droit d'usage.

## Après ajout du fichier
```
eas build --profile preview --platform android
```
Le son est un asset natif → **mise à jour complète, pas OTA**. Les canaux
Android étant immuables une fois créés, le canal est déjà versionné
(`adhan-v3`) pour que le nouveau son soit pris en compte sur les téléphones
ayant une ancienne installation.

> Pour un adhan **complet** joué app fermée (au-delà de la limite ~30 s du son
> de notification iOS), il faudrait une lecture audio en arrière-plan dédiée
> (`expo-av` + foreground service) — hors périmètre des notifications locales.
