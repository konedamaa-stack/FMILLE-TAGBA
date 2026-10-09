# 🌟 Mutuelle TAGBA - Application SaaS de Solidarité & Entraide

Plateforme Web moderne et responsive dédiée à la gestion intégrale de l'**Association Mutuelle TAGBA**.

---

## 🏛️ 1. Composition du Bureau Exécutif (11 Postes Officiels)
Conformément aux directives, les **11 postes officiels** sont intégrés :
1. **Président** : Représentation légale, vision et arbitrage.
2. **Vice-Président** : Coordination générale et suppléance.
3. **Secrétaire Général** : Registres, correspondances et procès-verbaux.
4. **Vice-Secrétaire** : Secrétariat de séance et registre des membres.
5. **Trésorier Général** : Caisse centrale, perception et ordonnancement.
6. **Vice-Trésorier** : Émission des reçus officiels et livre de caisse.
7. **Commissaire aux Comptes** : Audit financier et contrôle de régularité.
8. **Vice-Commissaire aux Comptes** : Assistance au contrôle et inventaires.
9. **Conseiller 1 (Sagesse & Médiation)** : Doyen, réconciliation et médiation.
10. **Conseiller 2 (Organisation & Protocole)** : Logistique et délégations cérémonies.
11. **Conseiller 3 (Jeunesse & Projets)** : Dynamisation et insertion des jeunes.

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
