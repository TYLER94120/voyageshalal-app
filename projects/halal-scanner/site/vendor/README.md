# Bibliothèques livrées avec le site

## `zxing-0.21.3.min.js`

Lecteur de codes-barres, utilisé **uniquement** par les navigateurs qui n'ont
pas de `BarcodeDetector` natif — Safari sur iPhone et Firefox. Chrome et Edge
n'y touchent jamais.

- Paquet : `@zxing/library@0.21.3`, fichier `umd/index.min.js` (328 Ko)
- Licence : Apache 2.0 — le texte complet est dans `LICENSE-zxing.txt`
- Obtenu par `npm pack @zxing/library@0.21.3`, qui vérifie l'empreinte du
  paquet auprès du registre. Empreinte du fichier livré (SHA-256) :
  `d7cc8f69dd70bdcf3ac00c9ae572bf2a…`

### Pourquoi il est ici et plus sur unpkg.com

Il était chargé depuis `unpkg.com`. Trois raisons de l'avoir rapatrié :

1. **Hors ligne, aucun iPhone ne pouvait scanner** — même à la dixième visite,
   puisque le fichier n'était pas servi par notre domaine et n'entrait donc
   jamais dans le cache du site.
2. **Le jour où unpkg tombe ou est bloqué** (réseau d'entreprise, pays qui
   filtre), plus aucun iPhone ne scanne, sans que nous en sachions rien.
3. **Chaque scan sur iPhone montrait l'adresse IP du visiteur à un tiers**,
   alors que la page mentions légales promet que rien ne part ailleurs que
   vers les bases produits et le service de lecture d'étiquette.

### Pour le mettre à jour

```
npm pack @zxing/library@<version>
tar xzf zxing-library-<version>.tgz package/umd/index.min.js package/LICENSE
```

Puis renommer le fichier avec sa version, corriger `BIBLIOTHEQUE_CODES` dans
`scan.html`, et relancer `npm run sonde:iphone` — elle vérifie que la lecture
démarre vraiment et qu'aucun message n'accuse la personne entre-temps.
