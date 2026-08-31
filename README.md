# 🔥 WUTA — Boutique de charbon en ligne

> **Du charbon de qualité, livré chez vous.**

WUTA est une plateforme e-commerce dédiée à la vente de charbon et à sa livraison à domicile.

L'application permet aux clients de consulter les produits disponibles, filtrer le catalogue, ajouter des articles à leur panier et passer une commande en ligne.

Un espace d'administration permet au vendeur de gérer les produits, les stocks, les commandes, les livraisons et les statistiques commerciales.

---

## 🖼️ Aperçu

> Ajoutez ici les captures d'écran de la boutique et du tableau de bord administrateur.

---

## ✨ Fonctionnalités

### 🛒 Boutique

* Catalogue de produits
* Filtrage par catégorie
* Panier persistant
* Gestion des quantités
* Vérification du stock en temps réel
* Commande en ligne
* Paiement à la livraison
* Adresse de livraison
* Géolocalisation facultative
* Interface responsive adaptée au mobile

### 📦 Produits

Les produits peuvent être organisés par catégorie :

* 🏠 Ménage
* 🔥 Grillade
* 🏭 Industriel
* 🌱 Écologique

Chaque produit peut contenir :

* Nom
* Description
* Prix
* Format / poids
* Catégorie
* Image
* Stock disponible

### 🚚 Livraison

Lors de la commande, le client peut :

* renseigner son adresse ;
* ajouter un point de repère ;
* placer sa position sur une carte ;
* utiliser la géolocalisation de son appareil.

L'administration dispose d'une carte permettant de visualiser les commandes localisées et d'ouvrir directement un itinéraire.

---

## 👨‍💼 Espace administrateur

L'espace `/admin` permet de gérer l'activité commerciale de WUTA.

### Tableau de bord

* Nombre de commandes
* Chiffre d'affaires
* Panier moyen
* Produits les plus vendus
* Commandes récentes
* Produits en stock faible
* Produits en rupture

### Gestion des produits

* Ajouter un produit
* Modifier un produit
* Supprimer un produit
* Modifier le prix
* Modifier le stock
* Ajouter une photo
* Consulter la disponibilité

### Gestion des commandes

Chaque commande possède un identifiant unique :

```text
WUTA-2026-00124
```

Les commandes peuvent être classées selon leur statut :

```text
En attente
Livraison
Livrée
Annulée
```

### Gestion de l'équipe

WUTA prend en charge plusieurs comptes administrateurs.

#### `super_admin`

Accès complet à la plateforme :

* gestion des produits ;
* gestion du stock ;
* gestion des commandes ;
* statistiques ;
* gestion des membres de l'équipe.

#### `gestionnaire`

Peut :

* gérer les produits ;
* gérer le stock ;
* gérer les commandes.

Il ne peut pas gérer les comptes administrateurs.

Le système empêche également la suppression de son propre compte et du dernier `super_admin`.

---

## 📊 Statistiques

Le tableau de bord fournit notamment :

* chiffre d'affaires par période ;
* nombre de commandes ;
* panier moyen ;
* produits les plus vendus ;
* performances par catégorie.

Les commandes annulées ne sont pas prises en compte dans le chiffre d'affaires.

---

## 🔐 Sécurité

La sécurité fait partie intégrante de l'architecture de WUTA.

* Les mots de passe sont hachés avec `bcrypt`
* Les sessions utilisent des cookies `httpOnly`
* Les sessions sont signées avec JWT
* Les routes d'administration sont protégées côté serveur
* Les secrets sont stockés dans `.env.local`
* Aucun identifiant ou mot de passe n'est présent dans le code source
* `.env.local` est exclu du dépôt Git

### Variables d'environnement

```env
ADMIN_EMAIL=vous@votredomaine.com
ADMIN_PASSWORD=choisissez-un-mot-de-passe-fort
JWT_SECRET=une-longue-chaine-aleatoire
```

Pour générer un secret :

```bash
openssl rand -base64 48
```

---

## 🧱 Stack technique

| Technologie   | Utilisation                  |
| ------------- | ---------------------------- |
| Next.js       | Application web              |
| React         | Interface utilisateur        |
| JavaScript    | Logique applicative          |
| SQLite        | Base de données             |
| JWT           | Authentification             |
| bcrypt        | Sécurité des mots de passe |
| Leaflet       | Cartographie                 |
| OpenStreetMap | Données cartographiques     |
| CSS           | Interface utilisateur        |

---

## 📁 Architecture

```text
wuta-charbon/
│
├── app/
│   ├── page.js
│   ├── admin/
│   │   └── page.js
│   │
│   └── api/
│       ├── products/
│       ├── orders/
│       └── auth/
│
├── components/
│   ├── Shop.js
│   └── Admin.js
│
├── lib/
│   ├── db.js
│   ├── auth.js
│   └── requireAdmin.js
│
├── scripts/
│   └── seed.js
│
├── data/
│   └── wuta.db
│
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Installation

### Prérequis

* Node.js 18 ou supérieur
* npm
* Git

### Installation

```bash
git clone <URL_DU_REPOSITORY>

cd wuta-charbon

npm install
```

Copiez ensuite le fichier d'environnement :

```bash
cp .env.example .env.local
```

Puis renseignez :

```env
ADMIN_EMAIL=vous@votredomaine.com
ADMIN_PASSWORD=choisissez-un-mot-de-passe-fort
JWT_SECRET=une-longue-chaine-aleatoire
```

Initialisez le compte administrateur et les données de départ :

```bash
npm run seed
```

Lancez le serveur :

```bash
npm run dev
```

### URLs

Boutique :

```text
http://localhost:3000
```

Administration :

```text
http://localhost:3000/admin
```

---

## 🌍 Déploiement

WUTA utilise actuellement une base SQLite stockée dans :

```text
data/wuta.db
```

L'hébergement choisi doit donc disposer d'un stockage persistant.

### Solutions possibles

* VPS
* Railway avec stockage persistant
* Render avec stockage persistant

Pour une infrastructure plus importante, SQLite pourra être remplacé par PostgreSQL.

---

## 💳 Paiement

La version actuelle utilise :

> **Paiement à la livraison**

Une future version pourra intégrer le paiement Mobile Money avec des solutions adaptées au marché ouest-africain.

Exemples :

* Airtel Money
* Moov Money
* CinetPay
* Kkiapay
* PawaPay

Les clés API devront toujours être stockées dans les variables d'environnement.

---

## 📸 Images des produits

WUTA permet d'utiliser une véritable photo pour chaque produit.

Pour obtenir un rendu professionnel :

* utiliser une bonne luminosité ;
* conserver un fond simple ;
* utiliser un cadrage identique ;
* optimiser les images pour le web ;
* utiliser des photos réelles des sacs.

Une photo réelle renforce fortement la confiance du client.

---

## 📈 Roadmap

### Version 1 — Boutique

* [X] Catalogue
* [X] Panier
* [X] Commande
* [X] Paiement à la livraison
* [X] Gestion du stock
* [X] Espace administrateur
* [X] Gestion des rôles
* [X] Géolocalisation

### Version 2 — Communication

* [ ] Notifications WhatsApp
* [ ] Notifications SMS
* [ ] Confirmation automatique des commandes

### Version 3 — Paiement

* [ ] Airtel Money
* [ ] Moov Money
* [ ] Paiement en ligne
* [ ] Confirmation automatique du paiement

### Version 4 — Livraison

* [ ] Gestion des livreurs
* [ ] Attribution des commandes
* [ ] Suivi de livraison
* [ ] Historique des livraisons

### Version 5 — Analyse

* [ ] Export Excel
* [ ] Export PDF
* [ ] Rapports commerciaux
* [ ] Analyse des ventes
* [ ] Analyse de rentabilité

---

## 🎯 Vision

WUTA a pour ambition de moderniser progressivement la vente et la livraison de charbon grâce à une plateforme simple, accessible et adaptée au commerce local.

L'objectif est de faire évoluer la boutique vers une véritable solution de gestion commerciale intégrant progressivement :

**vente → stock → commandes → paiement → livraison → analyse**

---

## 👨‍💻 Projet

Projet développé avec **Next.js** et conçu pour évoluer progressivement vers une architecture plus robuste et des fonctionnalités commerciales avancées.

> **WUTA — Du charbon de qualité, simplement. 🔥**
