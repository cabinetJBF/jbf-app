# Cahier des charges — Outil interne de gestion de cabinet pénaliste

## 1. Contexte et objectif

Outil web interne pour un cabinet d'avocats pénalistes, partagé entre les associés. L'objectif est d'avoir un outil **simple** (priorité absolue) pour gérer les dossiers, les audiences, les notes, les rappels et le suivi des honoraires dus.

Cet outil ne remplace pas un logiciel de comptabilité ou de facturation : il sert à **suivre** les encaissements et alerter sur les échéances.

## 2. Stack technique

- **Hébergement** : Netlify (compte payant déjà existant)
- **Base de données** : Netlify DB (Neon Postgres)
- **Frontend** : à proposer (React recommandé pour la simplicité)
- **Authentification** : Netlify Identity ou équivalent — un compte par associé
- **Envoi d'emails** : pour les rappels d'audiences et d'échéances (Resend, SendGrid ou équivalent)
- **Tâches planifiées** : Netlify Scheduled Functions pour les rappels automatiques

## 3. Contraintes de confidentialité

- Données soumises au secret professionnel de l'avocat
- Hébergement en Europe obligatoire (RGPD)
- Chiffrement des données au repos
- Journalisation des connexions (qui s'est connecté, quand)
- Tous les associés ont accès à tous les dossiers (pas de cloisonnement par dossier)

## 4. Entités et structure des données

### 4.1 Client

| Champ | Type | Obligatoire |
|---|---|---|
| id | identifiant | auto |
| nom | texte | oui |
| prenom | texte | oui |
| telephone | texte | oui |
| email | texte | non |
| alertes | texte court | non (ex : "paie en retard", "client difficile") |
| date_creation | date | auto |

**Relations** : un client peut avoir plusieurs dossiers.

### 4.2 Dossier

| Champ | Type | Obligatoire |
|---|---|---|
| id | identifiant | auto |
| numero_dossier | texte | oui (ex : 2026-042) |
| client_id | lien vers client | oui |
| type_procedure | menu déroulant | oui |
| juridiction | texte | oui |
| associe_responsable | lien vers utilisateur | oui |
| statut | "en cours" / "clôturé" | oui |
| description | texte long libre | non |
| montant_convenu | nombre (€) | non |
| date_creation | date | auto |

**Valeurs du menu "type_procedure"** :
- Garde à vue
- Instruction
- Correctionnelle
- Criminelle
- Comparution immédiate
- Appel
- Cassation
- Autre

**Calculs automatiques par dossier** :
- Montant encaissé = somme des encaissements du dossier
- Reste dû = montant_convenu − montant encaissé

### 4.3 Audience

| Champ | Type | Obligatoire |
|---|---|---|
| id | identifiant | auto |
| dossier_id | lien vers dossier | oui |
| date_heure | date + heure | oui |
| notes | texte long libre | non |

**Rappels automatiques** : pour chaque audience, envoyer un email à l'associé responsable du dossier ET afficher une notification dans l'app :
- 7 jours avant
- 3 jours avant
- la veille

### 4.4 Note

| Champ | Type | Obligatoire |
|---|---|---|
| id | identifiant | auto |
| dossier_id | lien vers dossier | oui |
| auteur | lien vers utilisateur | auto |
| date_creation | datetime | auto |
| contenu | texte long | oui |

Les notes sont **immuables** (pas d'édition/suppression après création) pour garder une trace fiable. Affichage en fil chronologique.

### 4.5 Rappel ponctuel (to-do par dossier)

| Champ | Type | Obligatoire |
|---|---|---|
| id | identifiant | auto |
| dossier_id | lien vers dossier | oui |
| titre | texte | oui (ex : "Déposer conclusions") |
| date_echeance | date | oui |
| termine | booléen | défaut false |
| createur | lien vers utilisateur | auto |

**Notifications** :
- Email à tout le cabinet à J-3 et le jour J
- Notification dans l'app le jour J
- Tous les associés voient tous les rappels (pas de filtre personnel)

### 4.6 Encaissement (honoraires perçus)

| Champ | Type | Obligatoire |
|---|---|---|
| id | identifiant | auto |
| dossier_id | lien vers dossier | oui |
| date | date | oui |
| montant | nombre (€) | oui |
| libelle | texte | non (ex : "Acompte", "Solde") |

### 4.7 Utilisateur (associé)

| Champ | Type |
|---|---|
| id | identifiant |
| nom | texte |
| prenom | texte |
| email | texte (login) |
| mot_de_passe | hash |

## 5. Écrans de l'application

### 5.1 Tableau de bord (page d'accueil après connexion)

Vue synthétique en haut de la page :
- **Mes audiences à venir** (7 prochains jours) avec lien direct vers le dossier
- **Rappels du jour et à venir** (tous associés confondus, prochains 7 jours)
- **Honoraires en attente** : montant total restant à percevoir tous dossiers confondus, avec lien vers le détail

### 5.2 Onglet "Clients"

- Liste de tous les clients avec recherche par nom/prénom/téléphone
- Bouton "+ Nouveau client"
- Au clic sur un client → fiche client

**Fiche client** :
- Coordonnées (modifiables)
- Zone "Alertes" éditable
- Liste de tous ses dossiers (en cours en haut, clôturés en bas)
- Récap financier global : total convenu / total encaissé / reste dû tous dossiers confondus

### 5.3 Onglet "Dossiers"

- Liste de tous les dossiers avec recherche et filtres (par associé, par statut, par type de procédure)
- Bouton "+ Nouveau dossier" (avec sélection ou création du client)
- Au clic sur un dossier → fiche dossier

**Fiche dossier** :
- En-tête avec infos clés (numéro, client cliquable, type, juridiction, associé)
- Statut éditable (en cours / clôturé)
- 4 onglets internes :
  - **Aperçu** : description, dates clés
  - **Audiences** : liste chronologique, bouton "+ Nouvelle audience"
  - **Notes** : fil chronologique, bouton "+ Ajouter une note"
  - **Honoraires** : montant convenu, liste des encaissements, reste dû, bouton "+ Ajouter encaissement"
  - **Rappels** : liste des rappels du dossier, bouton "+ Nouveau rappel"

### 5.4 Onglet "Agenda"

- Vue calendrier mensuelle/hebdomadaire avec toutes les audiences et tous les rappels
- Filtrable par associé
- Au clic sur un événement → ouvre le dossier concerné

### 5.5 Onglet "Honoraires"

- Tableau de bord global : liste des dossiers ayant un reste dû > 0
- Trié du plus gros au plus petit reste dû
- Colonnes : Client, Dossier, Convenu, Encaissé, Reste dû, Associé responsable
- Export Excel possible (à terme)

## 6. Règles métier importantes

1. **Suppression d'un client** : interdite tant qu'il a des dossiers associés. Archivage possible.
2. **Suppression d'un dossier** : confirmation obligatoire, log de l'action.
3. **Format du numéro de dossier** : libre mais suggérer le format ANNÉE-NUMÉRO (ex : 2026-042) avec auto-incrément optionnel.
4. **Authentification** : session de 12h, déconnexion automatique au-delà.
5. **Toutes les dates et heures** sont en heure de Paris.

## 7. Priorités de développement (ordre conseillé)

**Phase 1 — Cœur fonctionnel** :
1. Authentification des associés
2. Gestion des clients (CRUD)
3. Gestion des dossiers (CRUD) + lien client
4. Notes par dossier

**Phase 2 — Calendrier et rappels** :
5. Gestion des audiences
6. Rappels automatiques par email (7j/3j/veille)
7. Rappels ponctuels par dossier
8. Vue Agenda

**Phase 3 — Honoraires** :
9. Encaissements par dossier
10. Récap financier client
11. Tableau de bord global honoraires

**Phase 4 — Polissage** :
12. Tableau de bord d'accueil
13. Recherches et filtres avancés
14. Export Excel

## 8. Ce qui n'est PAS dans le scope

Pour rester simple, ces fonctionnalités sont **explicitement exclues** :
- Génération de factures (géré par logiciel comptable externe)
- TVA et calculs fiscaux
- Signature électronique
- Stockage de pièces du dossier (PDF, photos...)
- Gestion des intervenants tiers (co-prévenus, avocats adverses, experts)
- Confidentialité par dossier (tous les associés voient tout)
- CRM, marketing, prospection
- Time tracking détaillé
