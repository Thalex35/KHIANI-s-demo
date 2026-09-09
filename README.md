# Style Showcase

# Création d'une plateforme e-commerce de vêtements — Démo professionnelle

Je veux créer une application web e-commerce moderne et professionnelle pour une boutique de vêtements.

Cette application sera utilisée comme **démo pour présenter à un potentiel client ce qu'une véritable boutique en ligne pourrait offrir**.

L'objectif n'est pas de créer uniquement une interface visuelle. Je veux une application fonctionnelle avec une vraie séparation entre les utilisateurs et les administrateurs, une gestion des produits, des comptes clients, du panier, des commandes et des statistiques.

---

# 1. Identité et langue

L'application doit être **entièrement en français**.

Tous les textes visibles par l'utilisateur doivent être en français :

* Navigation
* Boutons
* Formulaires
* Messages d'erreur
* Messages de confirmation
* Dashboard
* Produits
* Commandes
* Filtres
* États vides
* Notifications

Utiliser une identité visuelle moderne, élégante et premium adaptée à une marque de mode.

Le design doit être propre, minimaliste, professionnel et orienté e-commerce.

Éviter l'apparence d'un simple template générique.

---

# 2. RESPONSIVE DESIGN — PRIORITÉ ABSOLUE

L'application doit être **mobile-first et entièrement responsive**.

C'est une priorité absolue.

La majorité des clients pourront consulter la boutique depuis leur smartphone.

L'application doit fonctionner parfaitement sur :

* Smartphones
* Tablettes
* Ordinateurs portables
* Desktop

Tester particulièrement :

* Navigation mobile
* Menu mobile
* Grilles de produits
* Images
* Filtres
* Recherche
* Panier
* Checkout
* Compte utilisateur
* Dashboard administrateur
* Tableaux
* Formulaires
* Modales
* Boutons
* Espacement
* Typographie

Il ne doit pas y avoir de scroll horizontal ou de composants cassés sur mobile.

Sur mobile, transformer les tableaux complexes en cartes ou layouts adaptés lorsque nécessaire.

---

# 3. STRUCTURE DU SITE

Créer les pages suivantes.

### Pages publiques

* Accueil
* Boutique
* Catégories
* Détail d'un produit
* À propos
* Contact
* Panier
* Connexion
* Inscription

### Pages utilisateur

* Mon compte
* Mon profil
* Mes commandes
* Mes favoris
* Mes informations
* Détail d'une commande

### Pages administrateur

* Dashboard
* Produits
* Ajouter un produit
* Modifier un produit
* Commandes
* Utilisateurs
* Statistiques
* Promotions
* Paramètres

---

# 4. PAGE D'ACCUEIL

Créer une homepage professionnelle de boutique de vêtements.

Inclure :

### Header

* Logo / nom de la boutique
* Accueil
* Boutique
* Catégories
* À propos
* Contact
* Recherche
* Favoris
* Compte
* Panier

Sur mobile, utiliser un menu hamburger propre.

### Hero section

Créer une grande section visuelle avec un message comme :

"Votre style. Votre identité."

Sous-titre :

"Découvrez notre nouvelle collection de vêtements."

Bouton :

"Découvrir la collection"

### Catégories

Créer des catégories visuelles :

* Hommes
* Femmes
* Enfants
* T-shirts
* Chemises
* Pantalons
* Robes
* Vestes
* Sneakers
* Accessoires

### Nouveautés

Afficher les derniers produits ajoutés.

### Produits populaires

Afficher les produits les plus populaires.

### Promotions

Créer une section pour les produits actuellement en promotion.

### Newsletter

Ajouter une section permettant à l'utilisateur de s'inscrire à une newsletter.

### Footer

Inclure :

* Navigation
* À propos
* Contact
* Réseaux sociaux
* Conditions
* Politique de confidentialité

---

# 5. BOUTIQUE / STORE

Créer une véritable page catalogue.

Afficher les produits dans une grille responsive.

Chaque produit doit afficher :

* Image principale
* Nom
* Catégorie
* Prix
* Prix avant réduction si applicable
* Prix promotionnel
* Badge "Nouveau"
* Badge "Promotion"
* Disponibilité
* Bouton favori
* Ajouter au panier
* Voir le produit

---

# 6. RECHERCHE

Créer une recherche fonctionnelle.

L'utilisateur doit pouvoir rechercher par :

* Nom du produit
* Catégorie
* Marque
* Type de vêtement

Exemples :

"T-shirt"

"Jean"

"Robe noire"

"Veste"

La recherche doit afficher les résultats dynamiquement.

Prévoir également un état lorsque aucun résultat n'est trouvé.

---

# 7. FILTRES

Ajouter des filtres fonctionnels.

Filtres :

### Catégorie

* Hommes
* Femmes
* Enfants
* Accessoires

### Type

* T-shirt
* Chemise
* Jean
* Pantalon
* Robe
* Jupe
* Veste
* Sweatshirt
* Pull
* Sneakers
* Accessoires

### Taille

* XS
* S
* M
* L
* XL
* XXL

### Couleur

* Noir
* Blanc
* Rouge
* Bleu
* Vert
* Beige
* Gris
* Rose

### Prix

Permettre de filtrer par gamme de prix.

### Disponibilité

* En stock
* Rupture de stock

### Tri

* Nouveautés
* Plus populaires
* Prix croissant
* Prix décroissant

Les filtres doivent pouvoir être combinés.

---

# 8. PRODUIT

Créer une page détaillée pour chaque produit.

Exemple :

## T-shirt Essential Premium

Prix :

39,99 €

Prix promotionnel :

29,99 €

Afficher :

* Grande image
* Galerie d'images
* Nom
* Description
* Prix
* Ancien prix
* Réduction
* Catégorie
* Marque
* Disponibilité
* Tailles
* Couleurs
* Quantité
* Ajouter au panier
* Ajouter aux favoris

Ajouter également :

### Informations produit

* Matière
* Composition
* Coupe
* Entretien
* Pays de fabrication

### Produits similaires

Afficher des produits similaires sous la fiche.

---

# 9. VARIANTES — IMPORTANT

Les vêtements doivent supporter différentes variantes.

Un produit peut avoir :

### Tailles

XS, S, M, L, XL, XXL

### Couleurs

Noir, Blanc, Bleu, Rouge, Beige, etc.

Le stock doit pouvoir être géré **par variante**.

Exemple :

T-shirt Essential Premium

| Variante  | Stock |
| --------- | ----: |
| Noir / S  |     5 |
| Noir / M  |     8 |
| Noir / L  |     3 |
| Blanc / M |     6 |
| Blanc / L |     2 |

L'utilisateur doit sélectionner la taille et la couleur avant de pouvoir ajouter le produit au panier.

Afficher clairement lorsqu'une variante est épuisée.

---

# 10. FAVORIS

Créer un système de favoris.

L'utilisateur connecté peut cliquer sur ❤️ pour enregistrer un produit.

Créer une page :

**Mes favoris**

Les favoris doivent être associés au compte de l'utilisateur et persister après déconnexion/reconnexion.

Un utilisateur non connecté qui essaie d'ajouter un produit aux favoris doit être invité à se connecter ou à créer un compte.

---

# 11. COMPTE UTILISATEUR

Les utilisateurs doivent pouvoir créer leur propre compte.

### Inscription

Champs :

* Prénom
* Nom
* Email
* Mot de passe
* Confirmation du mot de passe

### Connexion

Permettre aux utilisateurs existants de se connecter.

### Profil

Permettre de modifier :

* Nom
* Prénom
* Email
* Téléphone
* Adresse
* Informations de livraison

### Mon compte

Afficher un dashboard personnel avec :

* Bienvenue
* Nombre de commandes
* Commandes récentes
* Produits favoris
* Informations personnelles

---

# 12. COMMANDES

Créer un système de commandes fonctionnel.

L'utilisateur doit pouvoir :

1. Ajouter des produits au panier
2. Vérifier son panier
3. Modifier les quantités
4. Sélectionner les variantes
5. Entrer ses informations
6. Vérifier le résumé
7. Confirmer la commande

Une fois la commande créée, elle doit apparaître dans :

**Mon compte → Mes commandes**

Chaque commande doit afficher :

* Numéro de commande
* Date
* Produits
* Tailles
* Couleurs
* Quantités
* Prix
* Total
* Statut

Statuts :

* En attente
* Confirmée
* En préparation
* Expédiée
* Livrée
* Annulée

---

# 13. PANIER

Créer un panier entièrement fonctionnel.

L'utilisateur doit pouvoir :

* Ajouter un produit
* Sélectionner taille/couleur
* Modifier la quantité
* Supprimer un produit
* Voir le sous-total
* Voir les réductions
* Voir le total
* Continuer ses achats
* Passer la commande

Empêcher l'utilisateur d'ajouter une quantité supérieure au stock disponible.

---

# 14. PAIEMENT

Pour cette démo, ne pas intégrer obligatoirement un vrai système de paiement si aucune passerelle n'est configurée.

Créer plutôt une architecture prête à accueillir plus tard :

* Carte bancaire
* MonCash
* NatCash
* PayPal
* Autres moyens de paiement

Pour la démo, permettre de terminer une commande avec un mode de paiement fictif/test et enregistrer correctement la commande.

---

# 15. ADMIN — AUTHENTIFICATION ET RÔLE

Créer deux rôles principaux :

### USER

Un utilisateur normal peut :

* Parcourir la boutique
* Rechercher
* Filtrer
* Voir les produits
* Ajouter au panier
* Ajouter aux favoris
* Créer une commande
* Voir ses commandes
* Modifier son profil

### ADMIN

L'administrateur peut :

* Accéder au dashboard
* Ajouter des produits
* Modifier des produits
* Supprimer des produits
* Gérer les stocks
* Gérer les variantes
* Gérer les commandes
* Voir les utilisateurs
* Voir les statistiques
* Créer des promotions
* Modifier les informations de la boutique

Un utilisateur normal ne doit jamais pouvoir accéder aux fonctionnalités administrateur simplement en entrant manuellement l'URL du dashboard.

Les routes et actions administrateur doivent être protégées.

---

# 16. ADMIN DASHBOARD

Créer un dashboard administrateur professionnel.

Afficher des statistiques sous forme de cartes et graphiques.

### Statistiques principales

* Nombre total d'utilisateurs
* Utilisateurs actifs
* Utilisateurs inactifs
* Nombre total de produits
* Produits en stock
* Produits en rupture
* Nombre de commandes
* Nombre de produits vendus
* Chiffre d'affaires
* Produits ajoutés au panier
* Produits ajoutés aux favoris

### Statistiques de ventes

Afficher :

* Ventes aujourd'hui
* Ventes cette semaine
* Ventes ce mois
* Ventes totales

Créer des graphiques pour visualiser les ventes.

---

# 17. ACTIVITÉ DES UTILISATEURS

L'admin doit pouvoir voir l'activité générale des utilisateurs.

Afficher par exemple :

* Utilisateurs inscrits
* Utilisateurs actifs
* Dernière connexion
* Nombre de commandes
* Nombre de produits ajoutés au panier
* Nombre de favoris

Ne pas exposer inutilement des informations privées.

---

# 18. GESTION DES PRODUITS — ADMIN

L'administrateur doit pouvoir créer complètement un nouveau produit.

Le formulaire "Ajouter un produit" doit contenir au minimum :

### Informations générales

* Nom du produit
* Description
* Catégorie
* Sous-catégorie
* Marque
* Prix
* Prix promotionnel
* Statut

### Images

* Image principale / cover
* Images supplémentaires
* Galerie

### Variantes

* Tailles disponibles
* Couleurs disponibles
* Stock par taille/couleur

### Informations supplémentaires

* Matière
* Composition
* Coupe
* Instructions d'entretien
* Référence/SKU

### Options

* Nouveau produit
* Produit en vedette
* En promotion
* Actif/Inactif

Lorsque l'admin publie un nouveau produit, il doit devenir **visible pour les utilisateurs en temps réel**, sans avoir besoin de modifier manuellement le frontend.

---

# 19. MODIFICATION DES PRODUITS

L'admin doit pouvoir modifier n'importe quel produit existant.

Il doit pouvoir changer :

* Nom
* Description
* Prix
* Promotion
* Images
* Catégorie
* Tailles
* Couleurs
* Stock
* Statut
* Badge nouveau
* Produit en vedette

Les changements doivent apparaître côté client sans devoir reconstruire manuellement les pages produits.

---

# 20. GESTION DES COMMANDES

Créer une page admin :

**Commandes**

Afficher :

* Numéro
* Client
* Date
* Produits
* Quantité
* Total
* Statut

L'admin peut ouvrir une commande et modifier son statut.

Les changements doivent être visibles par le client dans :

**Mon compte → Mes commandes**

---

# 21. GESTION DES UTILISATEURS

Créer une page admin :

**Utilisateurs**

Afficher :

* Nom
* Email
* Date d'inscription
* Nombre de commandes
* Statut
* Dernière activité

Permettre à l'admin de consulter le profil général d'un utilisateur.

---

# 22. PROMOTIONS

Ajouter une fonctionnalité permettant à l'admin de gérer les promotions.

L'admin doit pouvoir :

* Définir une réduction
* Choisir un pourcentage
* Définir un prix promotionnel
* Activer/désactiver une promotion

Afficher automatiquement les produits en promotion sur le storefront.

---

# 23. PRODUITS POPULAIRES

Le système doit pouvoir identifier les produits populaires à partir de données telles que :

* Nombre de vues
* Ajouts au panier
* Favoris
* Achats

Afficher les produits les plus populaires sur la homepage.

---

# 24. DONNÉES DE DÉMONSTRATION

Créer suffisamment de mock data pour que la boutique ne soit jamais vide.

Créer au minimum **30 produits réalistes**.

Exemples :

* T-shirt Essential Premium
* T-shirt Oversize Urban
* Chemise Oxford Classic
* Jean Slim Denim
* Jean Straight Fit
* Pantalon Cargo Urban
* Robe Élégance
* Robe Casual
* Veste Denim
* Veste Bomber
* Sweatshirt Classic
* Hoodie Premium
* Pull Knit
* Jupe Plissée
* Short Casual
* Sneakers Urban
* Casquette Classic
* Sac à main
* Ceinture Premium
* Lunettes de soleil

Utiliser différentes :

* Tailles
* Couleurs
* Catégories
* Prix
* Stocks
* Promotions

Utiliser des images de démonstration appropriées aux produits.

---

# 25. COMPTE DEMO USER

Créer un compte utilisateur de démonstration fonctionnel.

Email :

[demo.user@example.com](mailto:demo.user@example.com)

Mot de passe :

DemoUser123!

Ce compte doit avoir des données de démonstration :

* Quelques favoris
* Au moins une commande
* Quelques produits dans l'historique

---

# 26. COMPTE DEMO ADMIN

Créer un compte administrateur fonctionnel.

Email :

[demo.admin@example.com](mailto:demo.admin@example.com)

Mot de passe :

DemoAdmin123!

Ce compte doit pouvoir accéder au dashboard administrateur et à toutes les fonctionnalités admin.

Si la plateforme d'authentification ne permet pas de créer automatiquement ces comptes, expliquer clairement comment les créer.

---

# 27. PERSISTANCE DES DONNÉES

Les informations importantes ne doivent pas être uniquement stockées dans des variables frontend temporaires.

Persister correctement :

* Comptes utilisateurs
* Rôles
* Produits
* Variantes
* Stocks
* Favoris
* Paniers lorsque pertinent
* Commandes
* Promotions
* Statistiques

Si le projet possède déjà un backend ou une base de données, l'inspecter et le réutiliser.

---

# 28. TEMPS RÉEL

Lorsqu'un administrateur ajoute ou modifie un produit, les utilisateurs doivent pouvoir voir les changements sans que le frontend soit codé manuellement à chaque fois.

Exemple :

Admin ajoute :

**Nouvelle Robe Élégance — 59,99 €**

Après publication, elle doit apparaître automatiquement dans :

* Boutique
* Nouveautés
* Recherche
* Catégorie correspondante

selon ses paramètres.

---

# 29. UX / UI

Ajouter les états nécessaires :

* Loading
* Empty state
* Error state
* Success message
* Confirmation avant suppression
* Produit ajouté au panier
* Produit ajouté aux favoris
* Commande réussie
* Produit indisponible

Créer une expérience fluide et professionnelle.

---

# 30. TEST FINAL

Avant de considérer le projet terminé, tester complètement :

### USER

* Inscription
* Connexion
* Déconnexion
* Modification du profil
* Recherche
* Filtres
* Consultation produit
* Sélection taille/couleur
* Favoris
* Panier
* Commande
* Historique des commandes

### ADMIN

* Connexion admin
* Dashboard
* Statistiques
* Ajout produit
* Upload cover/images
* Variantes
* Stock
* Modification produit
* Suppression produit
* Promotion
* Commandes
* Modification du statut d'une commande
* Consultation utilisateurs

### TEST DE SYNCHRONISATION

Ajouter un nouveau produit depuis l'admin puis vérifier qu'il apparaît correctement côté utilisateur.

### TEST RESPONSIVE

Tester toutes les fonctionnalités principales sur :

* Mobile
* Tablet
* Desktop

Corriger tous les problèmes de layout avant de terminer.

---

# OBJECTIF FINAL

Le résultat doit ressembler à une **véritable boutique de vêtements en ligne**, pas à une simple maquette.

Le parcours principal doit être :

**Visiteur → découvre la boutique → recherche un vêtement → filtre → consulte le produit → choisit taille/couleur → crée son compte → ajoute aux favoris ou au panier → passe une commande → retrouve sa commande dans son compte.**

Et côté vendeur :

**Admin → se connecte → consulte les statistiques → ajoute un nouveau vêtement → définit nom, prix, images, tailles, couleurs et stock → publie → le produit devient immédiatement disponible dans la boutique → admin suit les commandes et les ventes.**

La priorité absolue est :

**1. Fonctionnalité réelle
2. Responsive mobile
3. Gestion User/Admin
4. Persistance des données
5. Expérience e-commerce professionnelle
6. Design élégant et moderne**

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f72a04d4-dcdc-452b-b422-124e8cf3a6fa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
