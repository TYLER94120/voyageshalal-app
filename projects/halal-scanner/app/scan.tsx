import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Couleurs } from "@/constants/couleurs";

export default function EcranScan() {
  const [permission, demanderPermission] = useCameraPermissions();
  const dejaScanne = useRef(false);

  if (!permission) {
    return <View style={styles.ecran} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.ecran, styles.centre]}>
        <Text style={styles.permissionEmoji}>📷</Text>
        <Text style={styles.permissionTitre}>
          La caméra sert uniquement à lire les codes-barres
        </Text>
        <Text style={styles.permissionTexte}>HalalCheck n'enregistre aucune photo.</Text>
        <TouchableOpacity style={styles.boutonPrincipal} onPress={demanderPermission}>
          <Text style={styles.boutonPrincipalTexte}>Autoriser la caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boutonSecondaire} onPress={() => router.back()}>
          <Text style={styles.boutonSecondaireTexte}>Annuler</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.ecran}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128"],
        }}
        onBarcodeScanned={({ data }) => {
          if (dejaScanne.current || !data) return;
          dejaScanne.current = true;
          router.replace(`/produit/${data}`);
        }}
      />
      <View style={styles.calque} pointerEvents="box-none">
        <Text style={styles.consigne}>Vise le code-barres du produit</Text>
        <View style={styles.viseur} />
        <TouchableOpacity style={styles.boutonAnnuler} onPress={() => router.back()}>
          <Text style={styles.boutonAnnulerTexte}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  permissionEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  permissionTitre: {
    color: Couleurs.creme,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  permissionTexte: {
    color: "rgba(253, 250, 243, 0.7)",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  boutonPrincipal: {
    backgroundColor: Couleurs.or,
    borderRadius: 20,
    minHeight: 60,
    minWidth: 260,
    alignItems: "center",
    justifyContent: "center",
  },
  boutonPrincipalTexte: {
    color: Couleurs.nuit,
    fontSize: 17,
    fontWeight: "800",
  },
  boutonSecondaire: {
    minHeight: 56,
    minWidth: 260,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  boutonSecondaireTexte: {
    color: "rgba(253, 250, 243, 0.7)",
    fontSize: 16,
    fontWeight: "600",
  },
  calque: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  consigne: {
    color: Couleurs.creme,
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(11, 26, 15, 0.75)",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 24,
  },
  viseur: {
    width: 270,
    height: 170,
    borderColor: Couleurs.or,
    borderWidth: 3,
    borderRadius: 24,
  },
  boutonAnnuler: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Couleurs.creme,
    backgroundColor: "rgba(11, 26, 15, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  boutonAnnulerTexte: {
    color: Couleurs.creme,
    fontSize: 17,
    fontWeight: "700",
  },
});
