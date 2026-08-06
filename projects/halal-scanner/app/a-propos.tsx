import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Couleurs } from "@/constants/couleurs";

const ETAPES = [
  {
    emoji: "🏷",
    titre: "1. Label halal ?",
    texte:
      "Si le produit porte un label halal officiel (AVS, ARGML…), il est affiché HALAL — certifié.",
  },
  {
    emoji: "❌",
    titre: "2. Ingrédient interdit ?",
    texte: "Porc et dérivés, alcool, gélatine non certifiée → le produit passe en HARAM.",
  },
  {
    emoji: "⚠️",
    titre: "3. Origine incertaine ?",
    texte:
      "Additifs d'origine animale possible (E471, E120…), viande sans certification, présure… → DOUTEUX, avec l'explication de chaque ingrédient signalé.",
  },
  {
    emoji: "✅",
    titre: "4. Rien détecté ?",
    texte:
      "Aucun ingrédient à risque → HALAL. Et si la liste d'ingrédients est absente de la base → INCONNU, on ne devine jamais.",
  },
];

export default function APropos() {
  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <Text style={styles.titre}>D'où viennent les données ?</Text>
      <Text style={styles.paragraphe}>
        HalalCheck s'appuie sur Open Food Facts, la plus grande base alimentaire du monde :
        collaborative, ouverte et gratuite. Chaque scan interroge la fiche du produit
        (ingrédients, additifs, labels) en temps réel.
      </Text>

      <Text style={styles.titre}>Comment le verdict est décidé ?</Text>
      {ETAPES.map((etape) => (
        <View key={etape.titre} style={styles.carte}>
          <Text style={styles.carteEmoji}>{etape.emoji}</Text>
          <View style={styles.carteTextes}>
            <Text style={styles.carteTitre}>{etape.titre}</Text>
            <Text style={styles.carteTexte}>{etape.texte}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.titre}>Nos limites, en toute transparence</Text>
      <Text style={styles.paragraphe}>
        L'analyse est automatique et indicative. Les recettes changent, les bases de données
        peuvent être incomplètes, et certains avis divergent entre savants. En cas de doute,
        la certification imprimée sur l'emballage prime toujours, et HalalCheck ne remplace
        jamais un avis religieux.
      </Text>

      <Text style={styles.version}>HalalCheck v0.1 — écosystème VoyagesHalal</Text>
    </ScrollView>
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
  titre: {
    color: Couleurs.creme,
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 16,
  },
  paragraphe: {
    color: "rgba(253, 250, 243, 0.78)",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  carte: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: Couleurs.foret,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  carteEmoji: {
    fontSize: 24,
  },
  carteTextes: {
    flex: 1,
  },
  carteTitre: {
    color: Couleurs.or,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  carteTexte: {
    color: "rgba(253, 250, 243, 0.85)",
    fontSize: 15,
    lineHeight: 21,
  },
  version: {
    color: "rgba(253, 250, 243, 0.45)",
    fontSize: 14,
    textAlign: "center",
    marginTop: 28,
  },
});
