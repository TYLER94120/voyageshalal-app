import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StatutVerdict } from "./halal";

export interface ScanEnregistre {
  code: string;
  nom: string;
  statut: StatutVerdict;
  date: string;
}

const CLE = "halalcheck.scans";
const MAX_SCANS = 20;

export async function listerScans(): Promise<ScanEnregistre[]> {
  try {
    const brut = await AsyncStorage.getItem(CLE);
    if (!brut) return [];
    const donnees = JSON.parse(brut);
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    return [];
  }
}

export async function enregistrerScan(scan: ScanEnregistre): Promise<void> {
  try {
    const existants = await listerScans();
    const sansDoublon = existants.filter((s) => s.code !== scan.code);
    const nouveaux = [scan, ...sansDoublon].slice(0, MAX_SCANS);
    await AsyncStorage.setItem(CLE, JSON.stringify(nouveaux));
  } catch {
    // L'historique est un confort — on n'interrompt jamais l'utilisateur pour ça.
  }
}
