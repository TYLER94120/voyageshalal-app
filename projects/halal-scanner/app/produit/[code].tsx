import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Couleurs, CouleursVerdict } from "@/constants/couleurs";
import { analyserProduit, type Verdict } from "@/lib/halal";
import { enregistrerScan } from "@/lib/historique";
import { chercherProduit, presenterIngredients, type ProduitOFF } from "@/lib/openfoodfacts";

type Etat = "chargement" | "reseau" | "introuvable" | "ok";

const TITRES: Record<Verdict["statut"], { emoji: string; label: string }> = {
  halal: { emoji: "✅", label: "HALAL" },
  douteux: { emoji: "⚠️", label: "DOUTEUX" },
  haram: { emoji: "❌", label: "HARAM" },
  inconnu: { emoji: "❓", label: "INCONNU" },
};

function sousTitre(verdict: Verdict): string {
  if (verdict.statut === "halal" && verdict.certifieHalal) return "Produit certifié halal ✓";
  if (verdict.statut === "halal" && verdict.vegan) return "Produit végane — aucun risque détecté";
  if (verdict.statut === "halal") return "Aucun ingrédient à risque détecté";
  if (verdict.statut === "douteux")
    return `${verdict.alertes.length} ingrédient${verdict.alertes.length > 1 ? "s" : ""} à vérifier`;
  if (verdict.statut === "haram") return "Ingrédient interdit détecté";
  return "Pas assez d'informations sur ce produit";
}

export default function EcranProduit() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [etat, setEtat] = useState<Etat>("chargement");
  const [produit, setProduit] = useState<ProduitOFF | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    let annule = false;
    setEtat("chargement");
    (async () => {
      try {
        const p = await chercherProduit(String(code));
        if (annule) return;
        if (!p) {
          setEtat("introuvable");
          return;
        }
        const v = analyserProduit({
          ingredientsTexte: p.ingredientsTexte,
          additifs: p.additifs,
          labels: p.labels,
        });
        setProduit(p);
        setVerdict(v);
        setEtat("ok");
        enregistrerScan({
          code: p.code,
          nom: p.nom ?? `Produit ${p.code}`,
          statut: v.statut,
          date: new Date().toISOString(),
        });
      } catch {
        if (!annule) setEtat("reseau");
      }
    })();
    return () => {
      annule = true;
    };
  }, [code, essai]);

  if (etat === "chargement") {
    return (
      <View style={[styles.ecran, styles.centre]}>
        <ActivityIndicator size="large" color={Couleurs.or} />
        <Text style={styles.texteChargement}>Analyse en cours…</Text>
      </View>
    );
  }

  if (etat === "reseau") {
    return (
      <View style={[styles.ecran, styles.centre]}>
        <Text style={styles.grosEmoji}>📡</Text>
        <Text style={styles.titreEtat}>Pas de connexion</Text>
        <Text style={styles.texteEtat}>Vérifie ton réseau et réessaie.</Text>
        <TouchableOpacity style={styles.boutonPrincipal} onPress={() => setEssai((e) => e + 1)}>
          <Text style={styles.boutonPrincipalTexte}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (etat === "introuvable") {
    return (
      <View style={[styles.ecran, styles.centre]}>
        <Text style={styles.grosEmoji}>🔍</Text>
        <Text style={styles.titreEtat}>Produit introuvable</Text>
        <Text style={styles.texteEtat}>
          Ce produit n'est pas encore dans la base Open Food Facts.
        </Text>
        <TouchableOpacity style={styles.boutonPrincipal} onPress={() => router.replace("/scan")}>
          <Text style={styles.boutonPrincipalTexte}>📷  Scanner un autre produit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!produit || !verdict) return null;

  const titre = TITRES[verdict.statut];
  const blocIngredients = presenterIngredients(produit.ingredientsTexte);

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      {produit.imageUrl ? (
        <Image source={{ uri: produit.imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imageAbsente]}>
          <Text style={styles.imageAbsenteEmoji}>🛒</Text>
        </View>
      )}

      <Text style={styles.nom}>{produit.nom ?? `Produit ${produit.code}`}</Text>
      {produit.marque ? <Text style={styles.marque}>{produit.marque}</Text> : null}

      <View style={[styles.carteVerdict, { backgroundColor: CouleursVerdict[verdict.statut] }]}>
        <Text style={styles.verdictEmoji}>{titre.emoji}</Text>
        <Text style={styles.verdictLabel}>{titre.label}</Text>
        <Text style={styles.verdictSousTitre}>{sousTitre(verdict)}</Text>
      </View>

      {verdict.alertes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.titreSection}>Ingrédients signalés</Text>
          {verdict.alertes.map((alerte) => (
            <View key={alerte.element} style={styles.carteAlerte}>
              <Text style={styles.alerteElement}>
                {alerte.niveau === "haram" ? "❌" : "⚠️"}  {alerte.element}
              </Text>
              <Text style={styles.alerteRaison}>{alerte.raison}</Text>
            </View>
          ))}
        </View>
      )}

      {blocIngredients ? (
        <View style={styles.section}>
          <Text style={styles.titreSection}>{blocIngredients.titre}</Text>
          <Text style={styles.ingredients}>{blocIngredients.texte}</Text>
        </View>
      ) : null}

      <Text style={styles.avertissement}>
        Analyse automatique à titre indicatif, basée sur les données Open Food Facts. En cas de
        doute, réfère-toi à la certification (AVS, ARGML…) sur l'emballage.
      </Text>

      <TouchableOpacity style={styles.boutonPrincipal} onPress={() => router.replace("/scan")}>
        <Text style={styles.boutonPrincipalTexte}>📷  Scanner un autre produit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: Couleurs.nuit,
  },
  centre: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  contenu: {
    padding: 24,
    paddingBottom: 48,
  },
  texteChargement: {
    color: "rgba(253, 250, 243, 0.7)",
    fontSize: 16,
    marginTop: 16,
  },
  grosEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  titreEtat: {
    color: Couleurs.creme,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  texteEtat: {
    color: "rgba(253, 250, 243, 0.7)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  image: {
    height: 190,
    borderRadius: 16,
    backgroundColor: Couleurs.creme,
    marginBottom: 20,
  },
  imageAbsente: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Couleurs.foret,
  },
  imageAbsenteEmoji: {
    fontSize: 46,
  },
  nom: {
    color: Couleurs.creme,
    fontSize: 23,
    fontWeight: "800",
  },
  marque: {
    color: "rgba(253, 250, 243, 0.65)",
    fontSize: 16,
    marginTop: 4,
  },
  carteVerdict: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
  },
  verdictEmoji: {
    fontSize: 40,
  },
  verdictLabel: {
    color: Couleurs.creme,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 6,
  },
  verdictSousTitre: {
    color: "rgba(253, 250, 243, 0.9)",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  section: {
    marginTop: 28,
  },
  titreSection: {
    color: Couleurs.creme,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 12,
  },
  carteAlerte: {
    backgroundColor: Couleurs.foret,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  alerteElement: {
    color: Couleurs.creme,
    fontSize: 16,
    fontWeight: "700",
  },
  alerteRaison: {
    color: "rgba(253, 250, 243, 0.75)",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  ingredients: {
    color: "rgba(253, 250, 243, 0.75)",
    fontSize: 14,
    lineHeight: 21,
  },
  avertissement: {
    color: "rgba(253, 250, 243, 0.5)",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 28,
    marginBottom: 20,
  },
  boutonPrincipal: {
    backgroundColor: Couleurs.or,
    borderRadius: 20,
    minHeight: 64,
    minWidth: 240,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  boutonPrincipalTexte: {
    color: Couleurs.nuit,
    fontSize: 18,
    fontWeight: "800",
  },
});
