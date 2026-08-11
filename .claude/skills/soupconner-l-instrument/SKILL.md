---
name: soupconner-l-instrument
description: >
  Ce qui arrive quand c'est l'OUTIL DE MESURE qui fabrique le defaut, et pas le
  site. A utiliser des qu'une mesure automatique rend un chiffre spectaculaire :
  « 29 pages mortes », « 383 titres casses », « 23 defauts sur 42 », « le site ne
  repond plus », « la moitie des liens sont morts ». Declenche aussi sur : robot,
  sonde, balayage, crawl, audit automatique, ronde, moniteur, verification en
  masse, timeout, delai depasse, poignee de main SSL, 403, 429, connexion
  reinitialisee, « ca marchait tout a l'heure », « le test passe mais le site
  echoue », « le test echoue mais le site marche ». Si tu t'appretes a envoyer
  quelqu'un reparer sur la foi d'un rapport automatique, lis ceci d'abord.
---

# Soupçonner l'instrument

`mesurer-avant-daffirmer` dit : ne parle pas sans avoir mesuré.
Cette compétence-ci dit la suite, et elle est moins évidente :

> **Une mesure automatique est un programme. Un programme a des défauts.
> Le premier suspect d'un chiffre spectaculaire, c'est l'instrument.**

## Pourquoi cette compétence existe

Le 10 août 2026, **quatre fois dans la même journée**, un robot de l'empire a
annoncé un défaut qui n'existait pas. Deux agents différents, sans se
concerter, ont buté sur le même mur.

| Ce que le robot annonçait | La vérité |
|---|---|
| 29 pages mortes sur gohalaltravel.com | le robot avait saturé l'hébergeur en 1737 requêtes |
| 5 liens morts | 3 étaient des coupures passagères ou un `&amp;` mal décodé |
| 8 pages muettes (poignée de main SSL) | l'hébergeur limitait le débit après 1751 requêtes |
| 23 défauts sur 42 dans le scanner | la sonde passait les codes E par le mauvais canal |

**À chaque fois, le rapport était faux dans le sens le plus coûteux : il
envoyait quelqu'un réparer ce qui marchait déjà.**

Et à chaque fois, le signal était le même : un chiffre plus gros que ce à quoi
on s'attendait.

## Les quatre signatures d'un instrument qui ment

### 1. L'erreur n'a pas de code

Une page vraiment cassée rend **404** ou **500**. Un instrument qui déraille
rend `timeout`, `connection reset`, `SSL handshake failed`, `URLError` — des
échecs de TRANSPORT, pas des réponses du site.

> **Règle : pas de code HTTP = pas de verdict.** Le site n'a rien dit ; on ne
> sait pas, et « je ne sais pas » n'est pas « c'est cassé ».

### 2. Le défaut arrive en grappe, et à la fin

Un vrai défaut est réparti au hasard dans le catalogue. Un défaut fabriqué par
la charge apparaît **groupé**, et **dans la queue du balayage** — quand
l'hébergeur a commencé à fermer la porte.

> Si les pages « mortes » sont les dernières visitées, ce n'est pas le site.

### 3. Le chiffre change quand on change la façon de mesurer

Le test décisif, et il est gratuit : **refais la mesure autrement.** Plus
lentement, sur un seul site, une page à la fois. Si le chiffre s'effondre, il
venait de l'instrument.

> 1751 pages à 6 en parallèle : 8 pages mortes.
> 867 pages, un domaine, calmement : **zéro.**

### 4. L'instrument mesure le FICHIER, le visiteur reçoit autre chose

Les trois premières signatures parlent de pannes. Celle-ci est pire, parce
qu'elle ne ressemble pas à une panne : l'instrument fonctionne parfaitement,
il mesure simplement la mauvaise chose. Aucun `timeout`, aucune grappe, et le
chiffre reste **stable** quand on refait la mesure — puisque le défaut est
dans la définition, pas dans la mesure.

Dans la source d'une page, une apostrophe s'écrit `&#x27;` et une esperluette
`&amp;`. Un titre de 57 caractères en compte donc 62 dans le fichier.

> **11 août — 160 titres « coupés par Google ». 104 ne l'étaient pas.**
> Un ordre de mission était déjà parti vers l'agent VoyagesHalal.
> Même faute, un jour plus tôt, dans le robot des liens : `&amp;` non décodé
> faisait déclarer morts des liens parfaitement valides.

Ce piège vit partout où l'on compte : entités HTML, espaces insécables,
émojis (plusieurs octets, un seul caractère à l'écran), balises laissées dans
le texte, accents décomposés.

> **Règle : mesure toujours ce que le visiteur reçoit, jamais ce que le
> fichier contient.** Décode d'abord, compte ensuite.

Et le réflexe qui va avec, parce que corriger un faux positif rend souvent
aveugle : **le test qui verrouille la correction doit contenir un vrai cas
positif.** `test-ronde.py` vérifie que les 3 faux titres se taisent — et
qu'un titre réellement trop long est toujours vu.

## Ce qu'on fait, dans l'ordre

1. **Ne rien annoncer.** Ni à Mohamed, ni à un autre agent. Un rapport faux
   coûte un cycle d'agent ; un rapport faux transmis en coûte deux.
2. **Recontrôler le défaut grave, seul, sans parallélisme, avec plus de
   patience.** C'est trente secondes.
3. **Si ça répond au contrôle calme : ce n'est pas une panne, c'est une
   instabilité sous charge.** Vraie information, mais autre information — et
   elle ne se répare pas pareil.
4. **Corriger l'instrument, pas seulement le rapport.** Un robot qui a menti
   une fois mentira demain.
5. **Écrire ce qu'on a retiré.** Quand on a annoncé cinq défauts et qu'il n'en
   reste que deux, on dit les trois qu'on retire. Sinon l'autre agent les
   cherche.

## Les corrections qui marchent

**Confirmer avant de conclure.** Tout défaut « grave » est recontrôlé une fois,
séquentiellement, avec un délai plus long, AVANT d'être écrit.

**Taper moins fort quand on regarde tout.** Un balayage complet passe à 2
requêtes en parallèle avec une pause entre chaque. Il dure plus longtemps.
*Un balayage rapide qui ment ne sert à rien.*

**Décoder ce qu'on lit.** Une adresse extraite d'une page HTML porte ses
entités : `&amp;` n'est pas `&`. Un robot qui ne décode pas demande une adresse
que personne n'a jamais publiée.

**Ne jamais dupliquer ce qu'on teste.** Le même jour, une liste de mots existait
en deux exemplaires — un dans le site, un dans le test. La copie du site a été
corrigée, pas celle du test : **le test a continué de passer en mesurant une
liste que plus personne n'utilisait.**
*Un test qui ne mesure pas ce qui tourne est pire qu'aucun test : il rassure.*
Le fichier vit à un seul endroit, et les deux l'importent.

## La phrase à retenir

> **Quand un comptage rend un chiffre étonnant, soupçonne d'abord le comptage.**
> Elle vaut contre soi avant de valoir contre les autres — et c'est justement
> quand le chiffre nous arrange qu'il faut la sortir.
