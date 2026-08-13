# Les polices, servies depuis notre domaine

## Pourquoi elles sont ici

Les quatre pages chargeaient DM Sans et Playfair Display depuis
`fonts.googleapis.com` et `fonts.gstatic.com`. Mesuré le 13 août 2026 : **4
pages sur 4**, et **le mot « Google » n'apparaissait nulle part dans les
mentions légales** — les trois occurrences trouvées étaient les balises
`<link>` du `<head>` elles-mêmes.

Autrement dit : l'adresse IP de chaque visiteur partait chez un tiers à chaque
ouverture de page, alors que la page « mentions légales » déclare
soigneusement GitHub Pages, Open Food Facts et HalalGPT.

Même décision que pour le lecteur de codes-barres ZXing, et pour les mêmes
raisons : on sert le fichier nous-mêmes.

Ce que ça change, mesuré :

| | avant | après |
|---|---|---|
| hôtes tiers contactés à l'ouverture | 2 | **0** |
| polices disponibles hors ligne | non | oui |

## Provenance

Récupérées depuis npm, pas depuis un site : `@fontsource/dm-sans@5` et
`@fontsource/playfair-display@5`, qui reconditionnent les fichiers officiels
de Google Fonts. Sous-ensemble **latin**, graisse **normale** uniquement — les
italiques ne sont utilisées nulle part sur le site.

Empreintes SHA-256 :

```
4ab51eb2cd7305d177187908d6397474d4520663f6c6e572feb0a64f4fa80006  dm-sans-latin-400-normal.woff2
6bb2b2645ba5eeaecf56322c543fa3a75b87b927977b9c03b1dabc4205089120  dm-sans-latin-600-normal.woff2
35c5efa0e5daa52ee5c6500f5be354bf751fb65c4e49e1d6806c6eb5883e8fe9  dm-sans-latin-700-normal.woff2
094c859b70f10e1e010d293381f5cd032ef9929380e2dca97d12a574c2ef5c0a  dm-sans-latin-800-normal.woff2
d61c2ddffc7ab3a5dc2fe3e1f5eb94d776ca4d0b00ac1eeb7f12344066e1cac9  dm-sans-latin-900-normal.woff2
576ff9c33a472cc36e3975f24811db2234b0a10872939b04c0ba9b915e9c2b3f  playfair-display-latin-800-normal.woff2
2772c56b28bec10f310634732b0554dd6cced8ad0f723bbdf73f6abc53829ad0  playfair-display-latin-900-normal.woff2
```

## Licence

SIL Open Font License 1.1 pour les deux familles — voir `LICENSE-dm-sans.txt`
et `LICENSE-playfair-display.txt`. Elle autorise explicitement de servir les
fichiers depuis son propre domaine.

## Poids, et pourquoi ce n'est pas 148 Ko imposés à tout le monde

Les sept fichiers pèsent 148 Ko au total, mais un navigateur ne télécharge que
les graisses qu'il **affiche** réellement. Une page qui n'emploie pas
Playfair 900 ne le demande jamais. C'est aussi la raison pour laquelle ils ne
sont **pas** dans la liste pré-chargée du service worker : ils entrent dans le
cache à la première utilisation réelle, comme le lecteur ZXing.

## Mettre à jour

```
npm i @fontsource/dm-sans@5 @fontsource/playfair-display@5
cp node_modules/@fontsource/dm-sans/files/dm-sans-latin-{400,600,700,800,900}-normal.woff2 .
cp node_modules/@fontsource/playfair-display/files/playfair-display-latin-{800,900}-normal.woff2 .
sha256sum *.woff2      # puis recopier les empreintes ci-dessus
```

`npm run verif:chiffres` refuse de passer si une page nomme un fichier de
police absent du dossier.
