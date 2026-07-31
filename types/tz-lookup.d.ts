declare module 'tz-lookup' {
  /** Fuseau IANA (ex. « Europe/Paris ») pour des coordonnées. Lève si hors limites. */
  export default function tzLookup(latitude: number, longitude: number): string;
}
