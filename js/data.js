/**
 * TAGBA - Data Store & LocalStorage Persistence
 * Association Mutuelle de Solidarité et d'Entraide
 */

const STORAGE_KEY = 'TAGBA_MUTUELLE_DATA_V1';

// Données initiales par défaut complètes
const defaultData = {
  config: {
    assocName: 'Association Mutuelle TAGBA',
    tagline: 'Union • Solidarité • Entraide Familiale',
    currency: 'FCFA',
    cotisationMensuelle: 5000,
    cotisationTrimestrielle: 15000,
    fondsCaisse: 1450000,
    year: 2026
  },

  // Les 11 Postes du Bureau Exécutif demandés par l'utilisateur
  bureau: [
    {
      id: 'bur-1',
      role: 'Président',
      roleCategory: 'leadership',
      name: 'Ibrahim Koné',
      phone: '+225 07 08 12 34 56',
      email: 'president@tagba-mutuelle.org',
      familyId: 'fam-1',
      bio: 'Garant de la vision, de la cohésion et des orientations stratégiques de la Mutuelle.',
      photoInitial: 'IK'
    },
    {
      id: 'bur-2',
      role: 'Vice-Président',
      roleCategory: 'leadership',
      name: 'Moussa Traoré',
      phone: '+225 05 45 67 89 01',
      email: 'vice-president@tagba-mutuelle.org',
      familyId: 'fam-2',
      bio: 'Assiste le Président et assure la coordination opérationnelle des commissions.',
      photoInitial: 'MT'
    },
    {
      id: 'bur-3',
      role: 'Secrétaire Général',
      roleCategory: 'secretariat',
      name: 'Aminata Bamba',
      phone: '+225 01 23 45 67 89',
      email: 'secretaire@tagba-mutuelle.org',
      familyId: 'fam-3',
      bio: 'En charge des procès-verbaux, courriers, archives et communication officielle.',
      photoInitial: 'AB'
    },
    {
      id: 'bur-4',
      role: 'Vice-Secrétaire',
      roleCategory: 'secretariat',
      name: 'Fatou Cissé',
      phone: '+225 07 11 22 33 44',
      email: 'vice-secretaire@tagba-mutuelle.org',
      familyId: 'fam-1',
      bio: 'Appuie le Secrétaire général et gère le registre des membres et les présences.',
      photoInitial: 'FC'
    },
    {
      id: 'bur-5',
      role: 'Trésorier Général',
      roleCategory: 'finances',
      name: 'Seydou Coulibaly',
      phone: '+225 05 55 66 77 88',
      email: 'tresorier@tagba-mutuelle.org',
      familyId: 'fam-4',
      bio: 'Responsable de la caisse, des encaissements des cotisations et des états financiers.',
      photoInitial: 'SC'
    },
    {
      id: 'bur-6',
      role: 'Vice-Trésorier',
      roleCategory: 'finances',
      name: 'Kadiatou Touré',
      phone: '+225 01 99 88 77 66',
      email: 'vice-tresorier@tagba-mutuelle.org',
      familyId: 'fam-2',
      bio: 'Émet les reçus de versement et tient le livre journal des entrées et sorties.',
      photoInitial: 'KT'
    },
    {
      id: 'bur-7',
      role: 'Commissaire aux Comptes',
      roleCategory: 'controle',
      name: 'Drissa Ouattara',
      phone: '+225 07 44 33 22 11',
      email: 'commissaire1@tagba-mutuelle.org',
      familyId: 'fam-3',
      bio: 'Audite et vérifie la régularité des comptes, des reçus et des dépenses de solidarité.',
      photoInitial: 'DO'
    },
    {
      id: 'bur-8',
      role: 'Vice-Commissaire aux Comptes',
      roleCategory: 'controle',
      name: 'Bakary Soro',
      phone: '+225 05 12 34 56 78',
      email: 'commissaire2@tagba-mutuelle.org',
      familyId: 'fam-4',
      bio: 'Assiste le Commissaire aux comptes lors des contrôles périodiques et inventaires.',
      photoInitial: 'BS'
    },
    {
      id: 'bur-9',
      role: 'Conseiller 1 (Sagesse & Médiation)',
      roleCategory: 'conseil',
      name: 'El Hadj Amadou Koné',
      phone: '+225 07 01 02 03 04',
      email: 'conseiller1@tagba-mutuelle.org',
      familyId: 'fam-1',
      bio: 'Doyen et sage, chargé du règlement pacifique des conflits et de la médiation interne.',
      photoInitial: 'AK'
    },
    {
      id: 'bur-10',
      role: 'Conseiller 2 (Organisation & Protocole)',
      roleCategory: 'conseil',
      name: 'Mariam Diabaté',
      phone: '+225 01 05 06 07 08',
      email: 'conseiller2@tagba-mutuelle.org',
      familyId: 'fam-3',
      bio: 'Supervise la logistique, les cérémonies et la mobilisation des familles.',
      photoInitial: 'MD'
    },
    {
      id: 'bur-11',
      role: 'Conseiller 3 (Jeunesse & Projets)',
      roleCategory: 'conseil',
      name: 'Oumar Sangaré',
      phone: '+225 05 09 10 11 12',
      email: 'conseiller3@tagba-mutuelle.org',
      familyId: 'fam-2',
      bio: 'Anime les initiatives de la jeunesse et l’insertion socioprofessionnelle.',
      photoInitial: 'OS'
    },
    {
      id: 'bur-12',
      role: 'Porte-Parole',
      roleCategory: 'communication',
      name: 'Salif Koné',
      phone: '+225 07 77 88 99 00',
      email: 'porte-parole@tagba-mutuelle.org',
      familyId: 'fam-1',
      bio: 'Porte la voix officielle du bureau, assure les déclarations officielles et coordonne les annonces pour les cérémonies.',
      photoInitial: 'SK'
    },
    {
      id: 'bur-13',
      role: 'Porte-Parole Adjoint',
      roleCategory: 'communication',
      name: 'Yacouba Bamba',
      phone: '+225 05 33 22 11 00',
      email: 'porte-parole-adjoint@tagba-mutuelle.org',
      familyId: 'fam-3',
      bio: 'Assiste le porte-parole principal et le seconde dans l’organisation et l’animation des cérémonies et assemblées.',
      photoInitial: 'YB'
    }
  ],

  // Familles (Chaque membre est rattaché à un chef de famille)
  families: [
    {
      id: 'fam-1',
      code: 'FAM-01',
      name: 'Grande Famille Koné',
      chefDeFamille: 'El Hadj Amadou Koné',
      phone: '+225 07 01 02 03 04',
      city: 'Abidjan / Cocody',
      notes: 'Famille fondatrice de la mutuelle.',
      creationDate: '2024-01-15'
    },
    {
      id: 'fam-2',
      code: 'FAM-02',
      name: 'Famille Traoré & Alliés',
      chefDeFamille: 'Moussa Traoré',
      phone: '+225 05 45 67 89 01',
      city: 'Abidjan / Yopougon',
      notes: 'Branche active dans les festivités et l’entraide.',
      creationDate: '2024-02-10'
    },
    {
      id: 'fam-3',
      code: 'FAM-03',
      name: 'Famille Bamba - Diabaté',
      chefDeFamille: 'Lassina Bamba',
      phone: '+225 01 23 45 67 89',
      city: 'Bouaké / Commerce',
      notes: 'Représentation régionale centre.',
      creationDate: '2024-03-01'
    },
    {
      id: 'fam-4',
      code: 'FAM-04',
      name: 'Famille Coulibaly - Soro',
      chefDeFamille: 'Seydou Coulibaly',
      phone: '+225 05 55 66 77 88',
      city: 'Korhogo / Kôkô',
      notes: 'Famille du grand nord très engagée dans les cotisations.',
      creationDate: '2024-04-12'
    }
  ],

  // Tous les membres rattachés à un chef de famille
  members: [
    {
      id: 'mem-101',
      matricule: 'TGB-001',
      fullName: 'Ibrahim Koné',
      gender: 'M',
      familyId: 'fam-1',
      relationToChef: 'Fils aîné',
      phone: '+225 07 08 12 34 56',
      profession: 'Ingénieur Télécoms',
      residence: 'Cocody Riviera 3',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Président',
      joinDate: '2024-01-15'
    },
    {
      id: 'mem-102',
      matricule: 'TGB-002',
      fullName: 'El Hadj Amadou Koné',
      gender: 'M',
      familyId: 'fam-1',
      relationToChef: 'Chef de Famille',
      phone: '+225 07 01 02 03 04',
      profession: 'Patriarche / Retraité',
      residence: 'Cocody Danga',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Conseiller 1',
      joinDate: '2024-01-15'
    },
    {
      id: 'mem-103',
      matricule: 'TGB-003',
      fullName: 'Fatou Cissé épse Koné',
      gender: 'F',
      familyId: 'fam-1',
      relationToChef: 'Belle-fille',
      phone: '+225 07 11 22 33 44',
      profession: 'Comptable',
      residence: 'Cocody Riviera 3',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Vice-Secrétaire',
      joinDate: '2024-01-20'
    },
    {
      id: 'mem-104',
      matricule: 'TGB-004',
      fullName: 'Salimata Koné',
      gender: 'F',
      familyId: 'fam-1',
      relationToChef: 'Fille',
      phone: '+225 07 33 44 55 66',
      profession: 'Étudiante Master',
      residence: 'Cocody',
      statutCotisation: 'PARTIEL',
      bureauRole: null,
      joinDate: '2024-05-10'
    },
    {
      id: 'mem-105',
      matricule: 'TGB-005',
      fullName: 'Moussa Traoré',
      gender: 'M',
      familyId: 'fam-2',
      relationToChef: 'Chef de Famille',
      phone: '+225 05 45 67 89 01',
      profession: 'Chef d’Entreprise Logistique',
      residence: 'Yopougon Niangon',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Vice-Président',
      joinDate: '2024-02-10'
    },
    {
      id: 'mem-106',
      matricule: 'TGB-006',
      fullName: 'Kadiatou Touré épse Traoré',
      gender: 'F',
      familyId: 'fam-2',
      relationToChef: 'Épouse',
      phone: '+225 01 99 88 77 66',
      profession: 'Pharmacienne',
      residence: 'Yopougon',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Vice-Trésorier',
      joinDate: '2024-02-10'
    },
    {
      id: 'mem-107',
      matricule: 'TGB-007',
      fullName: 'Oumar Sangaré',
      gender: 'M',
      familyId: 'fam-2',
      relationToChef: 'Neveu',
      phone: '+225 05 09 10 11 12',
      profession: 'Architecte d’intérieur',
      residence: 'Marcory Zone 4',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Conseiller 3',
      joinDate: '2024-02-15'
    },
    {
      id: 'mem-108',
      matricule: 'TGB-008',
      fullName: 'Lassina Bamba',
      gender: 'M',
      familyId: 'fam-3',
      relationToChef: 'Chef de Famille',
      phone: '+225 01 44 55 66 77',
      profession: 'Cadre Bancaire',
      residence: 'Bouaké Ahougnanssou',
      statutCotisation: 'A_JOUR',
      bureauRole: null,
      joinDate: '2024-03-01'
    },
    {
      id: 'mem-109',
      matricule: 'TGB-009',
      fullName: 'Aminata Bamba',
      gender: 'F',
      familyId: 'fam-3',
      relationToChef: 'Fille',
      phone: '+225 01 23 45 67 89',
      profession: 'Juriste d’affaires',
      residence: 'Abidjan / Plateau',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Secrétaire Général',
      joinDate: '2024-03-01'
    },
    {
      id: 'mem-110',
      matricule: 'TGB-010',
      fullName: 'Mariam Diabaté',
      gender: 'F',
      familyId: 'fam-3',
      relationToChef: 'Nièce',
      phone: '+225 01 05 06 07 08',
      profession: 'Commerçante / Event planner',
      residence: 'Bouaké',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Conseiller 2',
      joinDate: '2024-03-05'
    },
    {
      id: 'mem-111',
      matricule: 'TGB-011',
      fullName: 'Drissa Ouattara',
      gender: 'M',
      familyId: 'fam-3',
      relationToChef: 'Cousin',
      phone: '+225 07 44 33 22 11',
      profession: 'Auditeur Financier',
      residence: 'Abidjan / Angré',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Commissaire aux Comptes',
      joinDate: '2024-03-10'
    },
    {
      id: 'mem-112',
      matricule: 'TGB-012',
      fullName: 'Seydou Coulibaly',
      gender: 'M',
      familyId: 'fam-4',
      relationToChef: 'Chef de Famille',
      phone: '+225 05 55 66 77 88',
      profession: 'Inspecteur du Trésor',
      residence: 'Korhogo / Kôkô',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Trésorier Général',
      joinDate: '2024-04-12'
    },
    {
      id: 'mem-113',
      matricule: 'TGB-013',
      fullName: 'Bakary Soro',
      gender: 'M',
      familyId: 'fam-4',
      relationToChef: 'Frère cadet',
      phone: '+225 05 12 34 56 78',
      profession: 'Gestionnaire de stocks',
      residence: 'Korhogo',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Vice-Commissaire aux Comptes',
      joinDate: '2024-04-12'
    },
    {
      id: 'mem-114',
      matricule: 'TGB-014',
      fullName: 'Fanta Coulibaly',
      gender: 'F',
      familyId: 'fam-4',
      relationToChef: 'Fille',
      phone: '+225 05 88 99 00 11',
      profession: 'Enseignante',
      residence: 'Ferkessédougou',
      statutCotisation: 'EN_RETARD',
      bureauRole: null,
      joinDate: '2024-06-01'
    },
    {
      id: 'mem-115',
      matricule: 'TGB-015',
      fullName: 'Salif Koné',
      gender: 'M',
      familyId: 'fam-1',
      relationToChef: 'Cousin',
      phone: '+225 07 77 88 99 00',
      profession: 'Journaliste / Communicateur',
      residence: 'Abidjan / Cocody',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Porte-Parole',
      joinDate: '2024-01-15'
    },
    {
      id: 'mem-116',
      matricule: 'TGB-016',
      fullName: 'Yacouba Bamba',
      gender: 'M',
      familyId: 'fam-3',
      relationToChef: 'Frère cadet',
      phone: '+225 05 33 22 11 00',
      profession: 'Animateur Culturel',
      residence: 'Bouaké / Commerce',
      statutCotisation: 'A_JOUR',
      bureauRole: 'Porte-Parole Adjoint',
      joinDate: '2024-03-01'
    }
  ],

  // Versements & Cotisations (Mensuel ou Trimestriel)
  cotisations: [
    {
      id: 'cot-1',
      recuNum: 'REC-2026-001',
      memberId: 'mem-101',
      memberName: 'Ibrahim Koné',
      familyId: 'fam-1',
      periode: 'T1 2026 (Trimestriel)',
      type: 'Trimestriel',
      montant: 15000,
      modePaiement: 'Orange Money',
      datePaiement: '2026-01-05',
      statut: 'Validé',
      agent: 'Seydou Coulibaly (Trésorier)'
    },
    {
      id: 'cot-2',
      recuNum: 'REC-2026-002',
      memberId: 'mem-105',
      memberName: 'Moussa Traoré',
      familyId: 'fam-2',
      periode: 'T1 2026 (Trimestriel)',
      type: 'Trimestriel',
      montant: 15000,
      modePaiement: 'Wave',
      datePaiement: '2026-01-08',
      statut: 'Validé',
      agent: 'Seydou Coulibaly (Trésorier)'
    },
    {
      id: 'cot-3',
      recuNum: 'REC-2026-003',
      memberId: 'mem-109',
      memberName: 'Aminata Bamba',
      familyId: 'fam-3',
      periode: 'Janvier 2026',
      type: 'Mensuel',
      montant: 5000,
      modePaiement: 'Virement bancaire',
      datePaiement: '2026-01-10',
      statut: 'Validé',
      agent: 'Kadiatou Touré (Vice-Trésorier)'
    },
    {
      id: 'cot-4',
      recuNum: 'REC-2026-004',
      memberId: 'mem-112',
      memberName: 'Seydou Coulibaly',
      familyId: 'fam-4',
      periode: 'T1 2026 (Trimestriel)',
      type: 'Trimestriel',
      montant: 15000,
      modePaiement: 'Espèces',
      datePaiement: '2026-01-12',
      statut: 'Validé',
      agent: 'Kadiatou Touré (Vice-Trésorier)'
    },
    {
      id: 'cot-5',
      recuNum: 'REC-2026-005',
      memberId: 'mem-106',
      memberName: 'Kadiatou Touré',
      familyId: 'fam-2',
      periode: 'Janvier 2026',
      type: 'Mensuel',
      montant: 5000,
      modePaiement: 'Wave',
      datePaiement: '2026-01-15',
      statut: 'Validé',
      agent: 'Seydou Coulibaly (Trésorier)'
    },
    {
      id: 'cot-6',
      recuNum: 'REC-2026-006',
      memberId: 'mem-107',
      memberName: 'Oumar Sangaré',
      familyId: 'fam-2',
      periode: 'Février 2026',
      type: 'Mensuel',
      montant: 5000,
      modePaiement: 'Orange Money',
      datePaiement: '2026-02-02',
      statut: 'Validé',
      agent: 'Kadiatou Touré (Vice-Trésorier)'
    }
  ],

  // S'occuper des Problèmes des Membres (Fonds de solidarité & Entraide)
  entraide: [
    {
      id: 'cas-1',
      reference: 'CAS-2026-01',
      memberId: 'mem-114',
      memberName: 'Fanta Coulibaly',
      familyId: 'fam-4',
      nature: 'Hospitalisation / Urgence Médicale',
      description: 'Prise en charge chirurgicale d’urgence suite à un accident domestique.',
      montantAlloue: 100000,
      statut: 'Accordé & Décaissé',
      dateDemande: '2026-01-18',
      dateResolution: '2026-01-20',
      decisionPar: 'Bureau Exécutif (Président & Trésorier)'
    },
    {
      id: 'cas-2',
      reference: 'CAS-2026-02',
      memberId: 'mem-104',
      memberName: 'Salimata Koné',
      familyId: 'fam-1',
      nature: 'Bourse d’appui aux études',
      description: 'Aide ponctuelle pour frais d’inscription au concours de fin de cycle.',
      montantAlloue: 50000,
      statut: 'En cours d’examen',
      dateDemande: '2026-02-01',
      dateResolution: null,
      decisionPar: 'Commission Sociale'
    }
  ],

  // Participer aux Cérémonies (Mariages, Décès, Baptêmes, Réunions)
  ceremonies: [
    {
      id: 'cer-1',
      titre: 'Mariage coutumier et civil d’Oumar Sangaré',
      type: 'Mariage',
      familyId: 'fam-2',
      organisateur: 'Famille Traoré & Sangaré',
      date: '2026-04-18',
      lieu: 'Salle des Fêtes de la Mairie de Marcory, Abidjan',
      enveloppeSoutien: 150000,
      delegationBureau: 'Ibrahim Koné (Président), Aminata Bamba (Secrétaire), Mariam Diabaté (Conseiller 2)',
      statut: 'À venir',
      description: 'Présence officielle d’une délégation de 10 personnes représentant la mutuelle.'
    },
    {
      id: 'cer-2',
      titre: 'Baptême du nouveau-né de Fatou Cissé & Ibrahim Koné',
      type: 'Baptême / Naissance',
      familyId: 'fam-1',
      organisateur: 'Famille Koné',
      date: '2026-03-14',
      lieu: 'Résidence Famille Koné, Cocody Riviera 3',
      enveloppeSoutien: 75000,
      delegationBureau: 'Moussa Traoré (Vice-Président), Seydou Coulibaly (Trésorier)',
      statut: 'À venir',
      description: 'Cérémonie de prière et de communion familiale.'
    },
    {
      id: 'cer-3',
      titre: 'Assemblée Générale Annuelle TAGBA 2025',
      type: 'Assemblée Générale',
      familyId: null,
      organisateur: 'Bureau Exécutif',
      date: '2025-12-20',
      lieu: 'Espace Événementiel Cocody',
      enveloppeSoutien: 250000,
      delegationBureau: 'Tous les membres du Bureau Exécutif',
      statut: 'Passé',
      description: 'Bilan moral et financier 2025, approbation du budget 2026.'
    }
  ]
};

// Gestionnaire du Store
const TAGBA_DB = {
  get: function() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.config) parsed.config = {};
        parsed.config = { ...defaultData.config, ...parsed.config };
        if (!parsed.families) parsed.families = defaultData.families;
        if (!parsed.members) {
          parsed.members = defaultData.members;
        } else {
          defaultData.members.forEach(dm => {
            if (!parsed.members.some(m => m.id === dm.id)) parsed.members.push(dm);
          });
        }
        if (!parsed.bureau) {
          parsed.bureau = defaultData.bureau;
        } else {
          defaultData.bureau.forEach(db => {
            if (!parsed.bureau.some(b => b.id === db.id)) parsed.bureau.push(db);
          });
        }
        if (!parsed.cotisations) parsed.cotisations = defaultData.cotisations;
        if (!parsed.entraide) parsed.entraide = defaultData.entraide;
        if (!parsed.ceremonies) parsed.ceremonies = defaultData.ceremonies;
        return parsed;
      }
    } catch (e) {
      console.warn('Erreur lecture localStorage, utilisation données initiales', e);
    }
    this.save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  },

  save: function(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Erreur écriture localStorage', e);
      return false;
    }
  },

  resetToDefault: function() {
    this.save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  },

  // Familles
  addFamily: function(fam) {
    const data = this.get();
    fam.id = 'fam-' + Date.now();
    fam.code = 'FAM-' + String(data.families.length + 1).padStart(2, '0');
    fam.creationDate = new Date().toISOString().split('T')[0];
    data.families.push(fam);
    this.save(data);
    return fam;
  },

  // Membres
  addMember: function(mem) {
    const data = this.get();
    mem.id = 'mem-' + Date.now();
    mem.matricule = 'TGB-' + String(data.members.length + 1).padStart(3, '0');
    mem.joinDate = new Date().toISOString().split('T')[0];
    if (!mem.statutCotisation) mem.statutCotisation = 'A_JOUR';
    data.members.push(mem);
    this.save(data);
    return mem;
  },

  updateMember: function(id, updatedFields) {
    const data = this.get();
    const idx = data.members.findIndex(m => m.id === id);
    if (idx !== -1) {
      data.members[idx] = { ...data.members[idx], ...updatedFields };
      this.save(data);
      return data.members[idx];
    }
    return null;
  },

  deleteMember: function(id) {
    const data = this.get();
    data.members = data.members.filter(m => m.id !== id);
    this.save(data);
  },

  // Cotisations
  addCotisation: function(cot) {
    const data = this.get();
    cot.id = 'cot-' + Date.now();
    cot.recuNum = 'REC-2026-' + String(data.cotisations.length + 1).padStart(3, '0');
    cot.datePaiement = cot.datePaiement || new Date().toISOString().split('T')[0];
    cot.statut = 'Validé';
    
    // Mettre à jour la caisse
    data.config.fondsCaisse += Number(cot.montant || 0);

    // Mettre à jour le statut du membre
    const mem = data.members.find(m => m.id === cot.memberId);
    if (mem) {
      mem.statutCotisation = 'A_JOUR';
    }

    data.cotisations.unshift(cot);
    this.save(data);
    return cot;
  },

  // Entraide
  addEntraide: function(cas) {
    const data = this.get();
    cas.id = 'cas-' + Date.now();
    cas.reference = 'CAS-2026-' + String(data.entraide.length + 1).padStart(2, '0');
    cas.dateDemande = cas.dateDemande || new Date().toISOString().split('T')[0];
    
    // Si déjà validé/accordé, déduire de la caisse
    if (cas.statut === 'Accordé & Décaissé') {
      data.config.fondsCaisse -= Number(cas.montantAlloue || 0);
    }
    
    data.entraide.unshift(cas);
    this.save(data);
    return cas;
  },

  updateEntraideStatut: function(id, nouveauStatut, montantAlloue) {
    const data = this.get();
    const cas = data.entraide.find(c => c.id === id);
    if (cas) {
      const oldStatut = cas.statut;
      cas.statut = nouveauStatut;
      if (montantAlloue) cas.montantAlloue = Number(montantAlloue);
      
      if (nouveauStatut === 'Accordé & Décaissé' && oldStatut !== 'Accordé & Décaissé') {
        data.config.fondsCaisse -= Number(cas.montantAlloue || 0);
        cas.dateResolution = new Date().toISOString().split('T')[0];
      }
      this.save(data);
      return cas;
    }
    return null;
  },

  // Cérémonies
  addCeremonie: function(cer) {
    const data = this.get();
    cer.id = 'cer-' + Date.now();
    if (!cer.statut) cer.statut = 'À venir';
    data.ceremonies.unshift(cer);
    this.save(data);
    return cer;
  },

  // Bureau
  updateBureauMember: function(bureauId, name, phone, email, bio) {
    const data = this.get();
    const item = data.bureau.find(b => b.id === bureauId);
    if (item) {
      item.name = name;
      item.phone = phone;
      item.email = email;
      item.bio = bio;
      item.photoInitial = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      this.save(data);
      return item;
    }
    return null;
  },

  // Configuration des montants et paramètres
  updateConfig: function(newConfig) {
    const data = this.get();
    data.config = { ...data.config, ...newConfig };
    this.save(data);
    return data.config;
  }
};
