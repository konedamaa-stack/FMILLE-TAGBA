# 🌟 Mutuelle TAGBA - Application SaaS de Solidarité & Entraide

Plateforme Web moderne et responsive dédiée à la gestion intégrale de l'**Association Mutuelle TAGBA**.

---

## 🏛️ 1. Composition du Bureau Exécutif (13 Postes Officiels)
Conformément aux statuts mis à jour, les **13 postes officiels** sont intégrés :
1. **Président** : Représentation légale, vision et arbitrage (Consultation en Lecture Seule).
2. **Vice-Président** : Coordination générale et suppléance.
3. **Secrétaire Général** : Registres, correspondances et procès-verbaux.
4. **Vice-Secrétaire** : Secrétariat de séance et registre des membres.
5. **Trésorier Général** : Caisse centrale, perception et ordonnancement.
6. **Vice-Trésorier** : Émission des reçus officiels et livre de caisse.
7. **Commissaire aux Comptes** : Audit financier, tous les droits d'écriture et de modification (Niveau 1).
8. **Vice-Commissaire aux Comptes** : Assistance au contrôle, audit et plein pouvoir d'administration.
9. **Conseiller 1 (Sagesse & Médiation)** : Doyen, réconciliation et médiation.
10. **Conseiller 2 (Organisation & Protocole)** : Logistique et accueil.
11. **Conseiller 3 (Jeunesse & Projets)** : Dynamisation et insertion des jeunes.
12. **Porte-Parole** : Voix officielle, allocutions et rôle exclusif de gestion des cérémonies (Niveau 2).
13. **Porte-Parole Adjoint** : Relaie la communication officielle et co-gestion des cérémonies.

---

## 🔐 2. Page de Connexion & Sécurité à 3 Niveaux (RBAC)
Système de gestion des droits d'accès strict :
- **Niveau 1 — Commissaire aux Comptes (et son Adjoint)** : **Plein Pouvoir** (Écrire, modifier, supprimer, cotisations, aides, membres, configuration).
- **Niveau 2 — Porte-Parole (et son Adjoint)** : **Gestion des Cérémonies** (Créer et organiser les événements, lecture seule sur tout le reste).
- **Niveau 3 — Autres Membres & Président du Bureau** : **Lecture Seule Stricte** (Même le Président est en consultation seule).
- **Connexion rapide** : Basculement de rôle en 1 clic ou formulaire avec code PIN pour tester chaque profil.

---

## 👨‍👩‍👧‍👦 2. Identification & Regroupement par Chef de Famille
- **Principe fondamental** : *Chaque membre est rattaché à un chef de famille.*
- **👑 Vue Groupée par Chef de Famille (Nouveau)** :
  - Chaque chef de famille dispose d'un espace dédié avec son avatar couronné, ses coordonnées, sa ville de résidence et le nom officiel de la branche familiale.
  - **Métriques par foyer** : Nombre de membres rattachés, total des cotisations versées par la famille, pourcentage de régularité (à jour / retard).
  - **Registre des membres rattachés** : Tableau complet listant chaque membre du foyer avec son matricule, son lien de parenté exact avec le chef (Chef lui-même, Épouse, Fils, Fille, Frère, Neveu, etc.), contact, profession et statut de cotisation.
  - **Bouton `+ Rattacher Membre` direct** : Pré-sélectionne automatiquement ce chef de famille dans le formulaire d'inscription.
  - **Bouton `🖨️ Fiche de Famille`** : Génère une fiche officielle prête à l'impression ou à l'exportation avec les signatures du Chef de Famille et du Bureau Exécutif.
- **Modes d'affichage commutables** :
  - `👑 Vue par Chef de Famille (Groupée)`
  - `📋 Annuaire Global (Tableau filtrable)`
  - `🌳 Cartes Rapides des Foyers`
- **Filtres instantanés** : Recherche en direct par nom de membre, profession ou filtrage direct par chef de famille.

---

## 💳 3. Versements & Cotisations
- **Options de versement** :
  - **Mensuel** : 5 000 FCFA / mois
  - **Trimestriel** : 15 000 FCFA / trimestre
- **Reçus Officiels Numérotés** : Chaque paiement génère un reçu imprimable avec en-tête, montant en FCFA, mode de règlement (Wave, Orange Money, Espèces, Virement), et signature de la Trésorerie.

---

## 🤝 4. Entraide & Cas Sociaux ("S'occuper des problèmes des membres")
- Prise en charge des urgences médicales, hospitalisations, sinistres, deuils.
- Circuit de validation : examen par le Bureau, validation, décaissement automatique depuis la caisse de solidarité.

---

## 🎉 5. Cérémonies Familiales ("Participe aux cérémonies")
- Planification des événements (Mariages, Baptêmes, Obsèques, Assemblées Générales).
- Mandat des délégations officielles représentant la Mutuelle.
- Allocation des enveloppes de soutien financier.

---

## 📜 6. Statuts & Règlement Intérieur
- Document juridique complet intégré et imprimable (Titre I à Titre VIII).

---

## ⚙️ 7. Sauvegarde & Paramètres (Configuration des Montants)
- **Définition du montant mensuel par défaut** : Possibilité de modifier à tout moment le montant de la cotisation mensuelle (ex: 5 000 FCFA, 10 000 FCFA, etc.).
- **Calcul automatique du montant trimestriel** : Bouton d'assistance pour calculer automatiquement `3 × le montant mensuel`.
- **Choix de la devise** : Prise en charge des devises (FCFA, EUR, USD, GNF, CAD...).
- **Propagation instantanée** : Le montant configuré est automatiquement pré-rempli dans les formulaires d'encaissement de versement, mis à jour sur les barèmes officiels et appliqué aux reçus.
- **Sauvegarde & Restauration** : Exportation de la base complète en JSON et réinitialisation sécurisée.

---

## 🚀 Comment lancer l'application en local
1. Ouvrez un terminal dans le dossier `TAGBA`.
2. Lancez le serveur avec l'une des commandes au choix :
   ```bash
   python -m http.server 3000
   ```
   ou
   ```bash
   npm start
   ```
3. Ouvrez votre navigateur sur : [http://localhost:3000](http://localhost:3000)
