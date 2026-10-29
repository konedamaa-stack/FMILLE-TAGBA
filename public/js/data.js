/**
 * TAGBA - Data Store & LocalStorage Persistence
 * Association Mutuelle de Solidarité et d'Entraide
 */

const STORAGE_KEY = 'TAGBA_MUTUELLE_DATA_V3';

// Purge automatique intégrale de tout ancien cache LocalStorage
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('TAGBA_MUTUELLE_DATA_V1');
    localStorage.removeItem('TAGBA_MUTUELLE_DATA_V2');
    localStorage.removeItem('TAGBA_MUTUELLE_DATA_V3');
  }
} catch (e) {}

// Données initiales par défaut : 100% VIERGE
const defaultData = {
  config: {
    assocName: 'Association Mutuelle TAGBA',
    tagline: 'Union • Solidarité • Entraide Familiale',
    currency: 'FCFA',
    cotisationMensuelle: 5000,
    cotisationTrimestrielle: 15000,
    dateDebutCotisations: '2026-10-04',
    fondsCaisse: 0,
    year: 2026
  },
  bureau: [],
  families: [],
  members: [],
  cotisations: [],
  entraide: [],
  ceremonies: [],
  depenses: [],
  contributionsVolontaires: []
};

// Gestionnaire du Store
const TAGBA_DB = {
  get: function() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.config = { ...defaultData.config, ...(parsed.config || {}) };
          parsed.families = Array.isArray(parsed.families) ? parsed.families : [];
          parsed.members = Array.isArray(parsed.members) ? parsed.members : [];
          parsed.bureau = Array.isArray(parsed.bureau) ? parsed.bureau : [];
          parsed.cotisations = Array.isArray(parsed.cotisations) ? parsed.cotisations : [];
          parsed.entraide = Array.isArray(parsed.entraide) ? parsed.entraide : [];
          parsed.ceremonies = Array.isArray(parsed.ceremonies) ? parsed.ceremonies : [];
          parsed.depenses = Array.isArray(parsed.depenses) ? parsed.depenses : [];
          parsed.contributionsVolontaires = Array.isArray(parsed.contributionsVolontaires) ? parsed.contributionsVolontaires : [];
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture localStorage, utilisation données initiales', e);
    }
    this.save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  },

  // Calcul du Bilan & Solde Réel en Caisse
  getCaisseFinances: function() {
    const data = this.get();
    const fondsDepart = Number(data.config.fondsCaisse || 0);
    const totalCotisations = (data.cotisations || []).reduce((acc, c) => acc + Number(c.montant || 0), 0);
    const totalDonsVolontaires = (data.contributionsVolontaires || []).reduce((acc, d) => acc + Number(d.montant || 0), 0);
    
    // Total des dépenses décaissées de la Caisse
    const totalDecaisseCaisse = (data.depenses || []).reduce((acc, dp) => acc + Number(dp.partCaisse || 0), 0);
    // Total des dépenses couvertes par dons volontaires
    const totalCouvertVolontaire = (data.depenses || []).reduce((acc, dp) => acc + Number(dp.partVolontaire || 0), 0);
    const totalDepensesGlobal = (data.depenses || []).reduce((acc, dp) => acc + Number(dp.montantTotal || 0), 0);

    const soldeNetCaisse = (fondsDepart + totalCotisations + totalDonsVolontaires) - totalDecaisseCaisse;

    return {
      fondsDepart,
      totalCotisations,
      totalDonsVolontaires,
      totalEntrees: totalCotisations + totalDonsVolontaires,
      totalDecaisseCaisse,
      totalCouvertVolontaire,
      totalDepensesGlobal,
      soldeNetCaisse,
      currency: data.config.currency || 'FCFA'
    };
  },

  // Dépenses de la Caisse & Événements
  addDepense: function(dep) {
    const data = this.get();
    dep.id = 'dep-' + Date.now();
    dep.recuNum = 'DEP-2026-' + String(((data.depenses || []).length + 1)).padStart(3, '0');
    dep.datePaiement = dep.datePaiement || new Date().toISOString().split('T')[0];
    if (!data.depenses) data.depenses = [];
    data.depenses.unshift(dep);
    this.save(data);
    return dep;
  },

  // Contributions & Dons Volontaires
  addContributionVolontaire: function(don) {
    const data = this.get();
    don.id = 'don-' + Date.now();
    don.recuNum = 'DON-2026-' + String(((data.contributionsVolontaires || []).length + 1)).padStart(3, '0');
    don.datePaiement = don.datePaiement || new Date().toISOString().split('T')[0];
    if (!data.contributionsVolontaires) data.contributionsVolontaires = [];
    data.contributionsVolontaires.unshift(don);
    this.save(data);
    return don;
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
