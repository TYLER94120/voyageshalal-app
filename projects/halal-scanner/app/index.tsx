import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Couleurs, CouleursVerdict } from "@/constants/couleurs";
import { listerScans, type ScanEnregistre } from "@/lib/historique";

const EMOJIS: Record<ScanEnregistre["statut"], string> = {
  halal: "✅",
  douteux: "⚠️",
  haram: "❌",
  inconnu: "❓",
};

export default function Accueil() {
  const [scans, setScans] = useState<ScanEnregistre[]>([]);
  const [codeManuel, setCodeManuel] = useState("");

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      listerScans().then((s) => {
        if (actif) setScans(s);
      });
      return () => {
        actif = false;
      };
    }, [])
  );

  const codeValide = codeManuel.trim().length >= 8;

  const verifierCodeManuel = () => {
    if (codeValide) router.push(`/produit/${codeManuel.trim()}`);
  };

  return (
    <SafeAreaView style={styles.ecran} edges={["top", "left", "right"]}>
      <FlatList
        data={scans}
        keyExtractor={(s) => s.code}
        contentContainerStyle={styles.contenu}
        ListHeaderComponent={
          <View>
            <Text style={styles.logo}>HalalCheck ✓</Text>
            <Text style={styles.slogan}>Scanne un produit. Sache s'il est halal.</Text>

            <TouchableOpacity
              style={styles.boutonScanner}
              onPress={() => router.push("/scan")}
              accessibilityLabel="Scanner un produit avec la caméra"
            >
              <Text style={styles.boutonScannerTexte}>📷  Scanner un produit</Text>
            </TouchableOpacity>

            <Text style={styles.ou}>ou saisis le code-barres</Text>

            <View style={styles.ligneSaisie}>
              <TextInput
                style={styles.saisie}
                value={codeManuel}
                onChangeText={setCodeManuel}
                placeholder="Ex : 3017620422003"
                placeholderTextColor="rgba(253, 250, 243, 0.4)"
                keyboardType="number-pad"
                returnKeyType="done"
                onSubmitEditing={verifierCodeManuel}
              />
              <TouchableOpacity
                style={[styles.boutonVerifier, !codeValide && styles.boutonInactif]}
                onPress={verifierCodeManuel}
                disabled={!codeValide}
              >
                <Text style={styles.boutonVerifierTexte}>Vérifier</Text>
              </TouchableOpacity>
            </View>

            {scans.length > 0 && <Text style={styles.titreSection}>Derniers scans</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.ligneScan}
            onPress={() => router.push(`/produit/${item.code}`)}
          >
            <Text style={styles.scanEmoji}>{EMOJIS[item.statut]}</Text>
            <View style={styles.scanInfos}>
              <Text style={styles.scanNom} numberOfLines={1}>
                {item.nom}
              </Text>
              <Text style={styles.scanCode}>{item.code}</Text>
            </View>
            <View style={[styles.pastille, { backgroundColor: CouleursVerdict[item.statut] }]} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Tes scans apparaîtront ici.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Couleurs.nuit,
  },
  contenu: {
    padding: 24,
    paddingBottom: 48,
  },
  logo: {
    color: Couleurs.creme,
    fontSize: 34,
    fontWeight: "800",
    marginTop: 16,
  },
  slogan: {
    color: "rgba(253, 250, 243, 0.75)",
    fontSize: 17,
    marginTop: 8,
    marginBottom: 32,
  },
  boutonScanner: {
    backgroundColor: Couleurs.or,
    borderRadius: 20,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonScannerTexte: {
    color: Couleurs.nuit,
    fontSize: 19,
    fontWeight: "800",
  },
  ou: {
    color: "rgba(253, 250, 243, 0.55)",
    fontSize: 14,
    textAlign: "center",
    marginVertical: 16,
  },
  ligneSaisie: {
    flexDirection: "row",
    gap: 12,
  },
  saisie: {
    flex: 1,
    backgroundColor: Couleurs.foret,
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 16,
    color: Couleurs.creme,
    fontSize: 16,
  },
  boutonVerifier: {
    backgroundColor: Couleurs.foret,
    borderColor: Couleurs.or,
    borderWidth: 1.5,
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonInactif: {
    opacity: 0.4,
  },
  boutonVerifierTexte: {
    color: Couleurs.or,
    fontSize: 16,
    fontWeight: "700",
  },
  titreSection: {
    color: Couleurs.creme,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 36,
    marginBottom: 12,
  },
  ligneScan: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Couleurs.foret,
    borderRadius: 16,
    minHeight: 64,
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 12,
  },
  scanEmoji: {
    fontSize: 22,
  },
  scanInfos: {
    flex: 1,
  },
  scanNom: {
    color: Couleurs.creme,
    fontSize: 16,
    fontWeight: "600",
  },
  scanCode: {
    color: "rgba(253, 250, 243, 0.55)",
    fontSize: 14,
    marginTop: 2,
  },
  pastille: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
  vide: {
    color: "rgba(253, 250, 243, 0.45)",
    fontSize: 15,
    textAlign: "center",
    marginTop: 32,
  },
});
