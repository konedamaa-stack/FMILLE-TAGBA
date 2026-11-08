/**
 * TAGBA - Data Store & LocalStorage Persistence
 * Association Mutuelle de Solidarité et d'Entraide
 */

const STORAGE_KEY = 'TAGBA_MUTUELLE_DATA_V3';

// Nettoyage des anciennes clés legacy uniquement
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('TAGBA_MUTUELLE_DATA_V1');
    localStorage.removeItem('TAGBA_MUTUELLE_DATA_V2');
  }
} catch (e) { }

// Données initiales par défaut : 100% VIERGE
const defaultData = {
  config: {
    assocName: 'Association Mutuelle TAGBA',
    tagline: 'Union • Solidarité • Entraide Familiale',
    currency: 'FCFA',
    cotisationMensuelle: 500,
    cotisationTrimestrielle: 1500,
    cotisationEvenement: 4000,
    evenementActuel: 'Cotisation Sacrifice a Khoroko',
    activeEventId: 'evt-1793537365392',
    dateDebutCotisations: '2026-10-04',
    fondsCaisse: 0,
    year: 2026
  },
  evenements: [
    {
      id: 'evt-1793537365392',
      titre: 'Cotisation Sacrifice a Khoroko',
      montant: 4000,
      dateLimite: '2026-11-16',
      statut: 'Actif',
      description: 'Cotisation collective pour le sacrifice à Khoroko',
      createdAt: '2026-11-01'
    }
  ],
  bureau: [],
  families: [],
  members: [],
  cotisations: [],
  entraide: [],
  ceremonies: [],
  depenses: [],
  contributionsVolontaires: [],
  lastModified: 0
};

// Vérification d'intégrité de la liste des cotisations (sans blocage de membre)
function cleanExcessCotisations(cotisations) {
  if (!Array.isArray(cotisations)) return [];
  const usedIds = new Set();
  const usedRecus = new Set();
  let maxRecuNum = cotisations.length;
  for (const c of cotisations) {
    if (!c) continue;
    const m = String(c.recuNum || c.recu_num || '').match(/REC-\d+-(\d+)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > maxRecuNum) maxRecuNum = n;
    }
  }

  // Repérer les mois déjà payés par membre (Octobre / Novembre 2026) pour corriger les anciens libellés erronés "Avril 2027" / "Janvier 2028"
  const memberHasOct = new Set();
  const memberHasNov = new Set();
  for (const c of cotisations) {
    if (!c) continue;
    const mId = c.memberId || c.member_id;
    const per = String(c.periode || '').toLowerCase();
    if (per.includes('octobre 2026')) memberHasOct.add(mId);
    if (per.includes('novembre 2026')) memberHasNov.add(mId);
  }

  return cotisations.filter(c => Boolean(c)).map((c, idx) => {
    const mId = c.memberId || c.member_id || idx;
    let cid = c.id || `cot-${Date.now()}-${idx}`;
    if (usedIds.has(cid)) {
      cid = `${cid}-${String(mId).replace(/^mem-/, '')}-${c.recuNum || idx}`;
    }
    usedIds.add(cid);

    let rNum = c.recuNum || c.recu_num || `REC-2026-${String(idx + 1).padStart(3, '0')}`;
    if (usedRecus.has(rNum)) {
      maxRecuNum++;
      rNum = `REC-2026-${String(maxRecuNum).padStart(3, '0')}`;
    }
    usedRecus.add(rNum);

    let per = c.periode || '';
    const perLow = per.toLowerCase();
    if (Number(c.montant) === 500 && (perLow === 'avril 2027 (1 mois)' || perLow === 'janvier 2028 (1 mois)')) {
      if (!memberHasOct.has(mId)) {
        per = 'Octobre 2026 (1 mois)';
        memberHasOct.add(mId);
      } else if (!memberHasNov.has(mId)) {
        per = 'Novembre 2026 (1 mois)';
        memberHasNov.add(mId);
      }
    }

    if (cid !== c.id || rNum !== c.recuNum || per !== c.periode) {
      return { ...c, id: cid, recuNum: rNum, periode: per };
    }
    return c;
  });
}

if (typeof window !== 'undefined') {
  window.cleanExcessCotisations = cleanExcessCotisations;
}

// Gestionnaire du Store
const TAGBA_DB = {
  get: function () {
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
          parsed.evenements = Array.isArray(parsed.evenements) && parsed.evenements.length > 0
            ? parsed.evenements
            : JSON.parse(JSON.stringify(defaultData.evenements));
          parsed.lastModified = Number(parsed.lastModified || 0);

          // Nettoyage de la liste des événements : ne conserver que "Cotisation Sacrifice a Khoroko"
          if (!localStorage.getItem('tagba_events_cleaned_khoroko_v1')) {
            const khorokoEvt = (parsed.evenements || []).find(e => (e.titre || '').toLowerCase().includes('khoroko')) || {
              id: 'evt-1793537365392',
              titre: 'Cotisation Sacrifice a Khoroko',
              montant: 4000,
              dateLimite: '2026-11-16',
              statut: 'Actif',
              description: 'Cotisation collective pour le sacrifice à Khoroko',
              createdAt: '2026-11-01'
            };
            parsed.evenements = [khorokoEvt];
            if (parsed.config) {
              parsed.config.activeEventId = khorokoEvt.id;
              parsed.config.evenementActuel = khorokoEvt.titre;
              parsed.config.cotisationEvenement = khorokoEvt.montant;
            }
            parsed.lastModified = Date.now();
            try {
              localStorage.setItem('tagba_events_cleaned_khoroko_v1', 'true');
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } catch (e) { }
          }

          // Nettoyage de sécurité : dédoublonner uniquement les reçus strictement identiques (même membre, même reçu, même période et même montant)
          if (parsed.cotisations && parsed.cotisations.length > 0) {
            const seen = new Set();
            const deduplicated = [];
            for (const c of parsed.cotisations) {
              if (!c) continue;
              const mId = c.memberId || c.member_id || '';
              const recu = c.recuNum || c.recu_num || '';
              const per = (c.periode || '').trim().toLowerCase();
              const key = `${mId}_${recu}_${per}_${c.montant || 0}`;
              if (!seen.has(key)) {
                seen.add(key);
                deduplicated.push(c);
              }
            }
            if (deduplicated.length !== parsed.cotisations.length) {
              parsed.cotisations = deduplicated;
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (e) { }
            }
          }

          // Nettoyage automatique des montants des membres supprimés (intégrité relationnelle)
          if (parsed.cotisations && parsed.members) {
            const validMemberIds = new Set(parsed.members.map(m => m.id));
            const validCotisations = parsed.cotisations.filter(c => validMemberIds.has(c.memberId || c.member_id));
            if (validCotisations.length !== parsed.cotisations.length) {
              parsed.cotisations = validCotisations;
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (e) { }
            }
          }

          // Assainissement et unicité des cotisations et matricules
          if (parsed.cotisations && parsed.cotisations.length > 0) {
            parsed.cotisations = cleanExcessCotisations(parsed.cotisations);
          }

          if (Array.isArray(parsed.members) && parsed.members.length > 0) {
            const usedMats = new Set();
            let maxMat = parsed.members.length;
            for (const m of parsed.members) {
              const match = String(m.matricule || '').match(/TGB-(\d+)/i);
              if (match) {
                const n = parseInt(match[1], 10);
                if (!isNaN(n) && n > maxMat) maxMat = n;
              }
            }
            parsed.members.forEach((m, idx) => {
              let mat = m.matricule || `TGB-${String(idx + 1).padStart(3, '0')}`;
              if (usedMats.has(mat)) {
                maxMat++;
                mat = `TGB-${String(maxMat).padStart(3, '0')}`;
                m.matricule = mat;
              }
              usedMats.add(mat);
            });
          }

          // Tri alphabétique systématique de toutes les listes
          if (Array.isArray(parsed.members)) {
            parsed.members.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' }));
          }
          if (Array.isArray(parsed.families)) {
            parsed.families.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }));
          }

          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erreur lecture localStorage, utilisation données initiales', e);
    }
    // Nouvel appareil vierge : sauvegarder localement SANS déclencher de push
    this.save(defaultData, true);
    return JSON.parse(JSON.stringify(defaultData));
  },

  // Calcul du Bilan & Solde Réel en Caisse
  getCaisseFinances: function () {
    const data = this.get();
    const fondsDepart = Number(data.config.fondsCaisse || 0);

    // 1. Cotisations Événements Spécifiques (Sacrifice, etc.)
    const cotisationsEvenements = (data.cotisations || []).filter(c => {
      const t = (c.type || '').toLowerCase();
      const p = (c.periode || '').toLowerCase();
      return !!c.eventId || t.includes('venement') || t.includes('vènement') || p.includes('sacrifice');
    });
    const totalCotisationsEvenements = cotisationsEvenements.reduce((acc, c) => acc + Number(c.montant || 0), 0);

    // 2. Cotisations Mensuelles & Périodiques Ordinaires
    const cotisationsMensuelles = (data.cotisations || []).filter(c => {
      const t = (c.type || '').toLowerCase();
      const p = (c.periode || '').toLowerCase();
      const isEvt = !!c.eventId || t.includes('venement') || t.includes('vènement') || p.includes('sacrifice');
      return !isEvt;
    });
    const totalCotisationsMensuelles = cotisationsMensuelles.reduce((acc, c) => acc + Number(c.montant || 0), 0);

    // Total de toutes les cotisations
    const totalCotisationsGlobal = totalCotisationsMensuelles + totalCotisationsEvenements;

    // 3. Dons Volontaires des Membres
    const totalDonsVolontaires = (data.contributionsVolontaires || []).reduce((acc, d) => acc + Number(d.montant || 0), 0);

    // 4. Aides & Solidarité Décaissées
    const aidesDecaissees = (data.entraide || []).filter(cas => cas.statut === 'Accordé & Décaissé');
    const totalAidesDecaissees = aidesDecaissees.reduce((acc, cas) => acc + Number(cas.montantAlloue || 0), 0);

    // 5. Total des Dépenses de Caisse
    const totalDecaisseCaisse = (data.depenses || []).reduce((acc, dp) => acc + Number(dp.partCaisse || dp.montantTotal || 0), 0);
    const totalCouvertVolontaire = (data.depenses || []).reduce((acc, dp) => acc + Number(dp.partVolontaire || 0), 0);
    const totalDepensesGlobal = (data.depenses || []).reduce((acc, dp) => acc + Number(dp.montantTotal || dp.partCaisse || 0), 0);

    // Solde net de caisse
    const soldeNetCaisse = (fondsDepart + totalCotisationsGlobal + totalDonsVolontaires) - totalDecaisseCaisse;

    return {
      fondsDepart,
      totalCotisations: totalCotisationsGlobal,
      totalCotisationsMensuelles,
      totalCotisationsEvenements,
      totalDonsVolontaires,
      totalAidesDecaissees,
      totalDecaisseCaisse,
      totalCouvertVolontaire,
      totalDepensesGlobal,
      totalEntrees: totalCotisationsGlobal + totalDonsVolontaires,
      soldeNetCaisse,
      currency: data.config.currency || 'FCFA'
    };
  },

  // Dépenses de la Caisse & Événements
  addDepense: function (dep) {
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
  addContributionVolontaire: function (don) {
    const data = this.get();
    don.id = 'don-' + Date.now();
    don.recuNum = 'DON-2026-' + String(((data.contributionsVolontaires || []).length + 1)).padStart(3, '0');
    don.datePaiement = don.datePaiement || new Date().toISOString().split('T')[0];
    if (!data.contributionsVolontaires) data.contributionsVolontaires = [];
    data.contributionsVolontaires.unshift(don);
    this.save(data);
    return don;
  },

  // Gestion des Événements & Montants par membre
  addEvenement: function (evt) {
    const data = this.get();
    evt.id = evt.id || ('evt-' + Date.now());
    evt.titre = (evt.titre || 'Nouvel Événement').trim();
    evt.montant = Number(evt.montant || 5000);
    evt.statut = evt.statut || 'Actif';
    evt.dateLimite = evt.dateLimite || new Date().toISOString().split('T')[0];
    evt.createdAt = evt.createdAt || new Date().toISOString().split('T')[0];
    if (!data.evenements) data.evenements = [];
    data.evenements.unshift(evt);
    data.config.activeEventId = evt.id;
    data.config.evenementActuel = evt.titre;
    data.config.cotisationEvenement = evt.montant;
    this.save(data);
    return evt;
  },

  updateEvenement: function (id, updates) {
    const data = this.get();
    if (!data.evenements) data.evenements = [];
    let idx = data.evenements.findIndex(e => e.id === id);
    if (idx === -1 && data.evenements.length > 0) {
      idx = 0;
    }
    if (idx !== -1) {
      data.evenements[idx] = { ...data.evenements[idx], ...updates };
      if (data.config.activeEventId === id || !data.config.activeEventId) {
        if (updates.titre) data.config.evenementActuel = updates.titre;
        if (updates.montant) data.config.cotisationEvenement = Number(updates.montant);
      }
      this.save(data);
      return data.evenements[idx];
    } else {
      const newEvt = {
        id: id || ('evt-' + Date.now()),
        titre: updates.titre || 'Événement',
        montant: Number(updates.montant || 5000),
        statut: updates.statut || 'Actif',
        dateLimite: updates.dateLimite || new Date().toISOString().split('T')[0],
        ...updates
      };
      data.evenements.push(newEvt);
      data.config.activeEventId = newEvt.id;
      if (updates.titre) data.config.evenementActuel = updates.titre;
      if (updates.montant) data.config.cotisationEvenement = Number(updates.montant);
      this.save(data);
      return newEvt;
    }
  },

  deleteEvenement: function (id) {
    const data = this.get();
    if (!data.evenements) return false;
    data.evenements = data.evenements.filter(e => e.id !== id);
    if (data.config.activeEventId === id) {
      data.config.activeEventId = data.evenements[0]?.id || null;
      if (data.evenements[0]) {
        data.config.evenementActuel = data.evenements[0].titre;
        data.config.cotisationEvenement = data.evenements[0].montant;
      }
    }
    this.save(data);
    return true;
  },

  getActiveEvenement: function () {
    const data = this.get();
    const evts = data.evenements || [];
    if (evts.length === 0) {
      return {
        id: 'evt-1',
        titre: data.config?.evenementActuel || 'Cotisation Sacrifice de la Mutuelle',
        montant: Number(data.config?.cotisationEvenement || 5000),
        dateLimite: '2026-11-15',
        statut: 'Actif',
        description: 'Cotisation collective pour le sacrifice annuel'
      };
    }
    const active = evts.find(e => e.id === data.config?.activeEventId) || evts.find(e => e.statut === 'Actif') || evts[0];
    return active;
  },

  save: function (data, skipSync = false) {
    if (data && data.cotisations) {
      data.cotisations = (typeof cleanExcessCotisations === 'function') ? cleanExcessCotisations(data.cotisations) : data.cotisations;
    }
    try {
      if (!skipSync) {
        data.lastModified = Date.now();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (!skipSync && typeof window !== 'undefined' && typeof window.autoSyncWithSupabase === 'function') {
        window.autoSyncWithSupabase();
      }
      return true;
    } catch (e) {
      console.error('Erreur écriture localStorage', e);
      return false;
    }
  },

  resetToDefault: function () {
    this.save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  },

  // Utilitaires de validation & normalisation des numéros de téléphone
  normalizePhone: function (phone) {
    if (!phone) return '';
    let clean = String(phone).replace(/\D/g, '');
    if (clean.startsWith('225') && clean.length > 10) {
      clean = clean.substring(3);
    }
    if (/^0+$/.test(clean)) return '';
    return clean;
  },

  // Extraction de tous les numéros valides d'une chaîne (ex: "07... / 05...")
  extractPhones: function (phoneStr) {
    if (!phoneStr) return [];
    const parts = String(phoneStr).split(/[\/;,]+/);
    const result = [];
    for (const p of parts) {
      const norm = this.normalizePhone(p);
      if (norm && norm.length >= 8) {
        result.push(norm);
      }
    }
    return result;
  },

  // Règle d'or : 1 personne peut avoir 2 numéros, mais 2 personnes différentes ne peuvent JAMAIS avoir le même numéro
  isPhoneTaken: function (phone, excludeId = null) {
    const phonesToCheck = this.extractPhones(phone);
    if (phonesToCheck.length === 0) return null;

    const data = this.get();

    // Identifier les entités liées (ex: membre chef et son foyer familial = même personne)
    const linkedIds = new Set();
    if (excludeId) {
      linkedIds.add(excludeId);
      const mem = (data.members || []).find(m => m.id === excludeId);
      if (mem && mem.familyId) {
        linkedIds.add(mem.familyId);
      }
      const fam = (data.families || []).find(f => f.id === excludeId);
      if (fam) {
        const chefMem = (data.members || []).find(m => m.familyId === fam.id && (m.fullName === fam.chefDeFamille || m.isChef || m.is_chef));
        if (chefMem) linkedIds.add(chefMem.id);
      }
    }

    for (const norm of phonesToCheck) {
      // 1. Membres (contrôle sur phone et phone2)
      for (const m of (data.members || [])) {
        if (linkedIds.has(m.id)) continue;
        const mPhones = [...this.extractPhones(m.phone), ...this.extractPhones(m.phone2)];
        if (mPhones.includes(norm)) {
          return {
            id: m.id,
            name: m.fullName,
            phone: m.phone + (m.phone2 ? ` / ${m.phone2}` : ''),
            type: 'Membre',
            details: `Membre inscrit (${m.matricule})`
          };
        }
      }

      // 2. Chefs de Famille (contrôle sur phone et phone2)
      for (const f of (data.families || [])) {
        if (linkedIds.has(f.id)) continue;
        const fPhones = [...this.extractPhones(f.phone), ...this.extractPhones(f.phone2)];
        if (fPhones.includes(norm)) {
          return {
            id: f.id,
            name: f.chefDeFamille,
            phone: f.phone + (f.phone2 ? ` / ${f.phone2}` : ''),
            type: 'Chef de Famille',
            details: `Chef de la ${f.name}`
          };
        }
      }

      // 3. Bureau Exécutif
      for (const b of (data.bureau || [])) {
        if (linkedIds.has(b.id)) continue;
        const bPhones = [...this.extractPhones(b.phone), ...this.extractPhones(b.phone2)];
        if (bPhones.includes(norm)) {
          return {
            id: b.id,
            name: b.name,
            phone: b.phone,
            type: 'Membre du Bureau',
            details: `Poste : ${b.role}`
          };
        }
      }
    }

    return null;
  },

  // Familles
  addFamily: function (fam) {
    if (fam.phone) {
      const conflict = this.isPhoneTaken(fam.phone);
      if (conflict) {
        throw new Error(`Le numéro ${fam.phone} est déjà attribué à "${conflict.name}" (${conflict.details}). Aucun numéro de téléphone ne peut être partagé par deux personnes.`);
      }
    }
    if (fam.phone2) {
      if (this.normalizePhone(fam.phone) === this.normalizePhone(fam.phone2)) {
        throw new Error("Le numéro principal et le second numéro doivent être différents.");
      }
      const conflict2 = this.isPhoneTaken(fam.phone2);
      if (conflict2) {
        throw new Error(`Le second numéro ${fam.phone2} est déjà attribué à "${conflict2.name}" (${conflict2.details}).`);
      }
    }
    const data = this.get();
    fam.id = 'fam-' + Date.now();
    fam.code = 'FAM-' + String(data.families.length + 1).padStart(2, '0');
    fam.creationDate = new Date().toISOString().split('T')[0];
    data.families.push(fam);
    this.save(data);
    return fam;
  },

  updateFamily: function (id, updatedFields) {
    if (updatedFields.phone) {
      const conflict = this.isPhoneTaken(updatedFields.phone, id);
      if (conflict) {
        throw new Error(`Le numéro ${updatedFields.phone} est déjà attribué à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être partagé par deux personnes.`);
      }
    }
    if (updatedFields.phone2) {
      const data = this.get();
      const currentFam = (data.families || []).find(f => f.id === id);
      const p1 = updatedFields.phone || (currentFam ? currentFam.phone : '');
      if (this.normalizePhone(p1) === this.normalizePhone(updatedFields.phone2)) {
        throw new Error("Le numéro principal et le second numéro doivent être différents.");
      }
      const conflict2 = this.isPhoneTaken(updatedFields.phone2, id);
      if (conflict2) {
        throw new Error(`Le second numéro ${updatedFields.phone2} est déjà attribué à "${conflict2.name}" (${conflict2.details}).`);
      }
    }
    const data = this.get();
    const idx = (data.families || []).findIndex(f => f.id === id);
    if (idx !== -1) {
      const oldChef = data.families[idx].chefDeFamille;
      data.families[idx] = { ...data.families[idx], ...updatedFields };

      // Si le nom du chef ou ses contacts ont été modifiés, mettre également à jour le membre chef correspondant
      if (data.members) {
        const chefMem = data.members.find(m => m.familyId === id && (m.relationToChef === 'Chef de famille' || m.fullName === oldChef || m.isChef === true));
        if (chefMem) {
          if (updatedFields.chefDeFamille && updatedFields.chefDeFamille !== oldChef) chefMem.fullName = updatedFields.chefDeFamille;
          if (updatedFields.phone) chefMem.phone = updatedFields.phone;
          if (updatedFields.phone2 !== undefined) chefMem.phone2 = updatedFields.phone2;
          if (updatedFields.city) chefMem.residence = updatedFields.city;
        }
      }

      this.save(data);
      return data.families[idx];
    }
    return null;
  },

  deleteFamily: function (id) {
    const data = this.get();
    data.families = (data.families || []).filter(f => f.id !== id);
    if (data.members) {
      data.members.forEach(m => {
        if (m.familyId === id) {
          m.familyId = null;
        }
      });
    }
    this.save(data);
    return true;
  },

  // Membres
  addMember: function (mem) {
    if (mem.phone) {
      const conflict = this.isPhoneTaken(mem.phone);
      if (conflict) {
        throw new Error(`Le numéro ${mem.phone} est déjà attribué à "${conflict.name}" (${conflict.details}). Aucun numéro de téléphone ne peut être partagé par deux personnes.`);
      }
    }
    if (mem.phone2) {
      if (this.normalizePhone(mem.phone) === this.normalizePhone(mem.phone2)) {
        throw new Error("Le numéro principal et le second numéro doivent être différents pour une même personne.");
      }
      const conflict2 = this.isPhoneTaken(mem.phone2);
      if (conflict2) {
        throw new Error(`Le second numéro ${mem.phone2} est déjà attribué à "${conflict2.name}" (${conflict2.details}). Aucun numéro ne peut être partagé par deux personnes.`);
      }
    }
    const data = this.get();
    mem.id = 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const existingMats = new Set((data.members || []).map(m => m.matricule).filter(Boolean));
    let nextMat = (data.members || []).length + 1;
    for (const m of (data.members || [])) {
      const match = String(m.matricule || '').match(/TGB-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n >= nextMat) nextMat = n + 1;
      }
    }
    while (existingMats.has('TGB-' + String(nextMat).padStart(3, '0'))) {
      nextMat++;
    }
    mem.matricule = 'TGB-' + String(nextMat).padStart(3, '0');
    mem.joinDate = new Date().toISOString().split('T')[0];
    if (!mem.statutCotisation) mem.statutCotisation = 'A_JOUR';
    data.members.push(mem);
    this.save(data);
    return mem;
  },

  updateMember: function (id, updatedFields) {
    if (updatedFields.phone) {
      const conflict = this.isPhoneTaken(updatedFields.phone, id);
      if (conflict) {
        throw new Error(`Le numéro ${updatedFields.phone} est déjà attribué à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être partagé par deux personnes.`);
      }
    }
    if (updatedFields.phone2) {
      const data = this.get();
      const currentMem = (data.members || []).find(m => m.id === id);
      const p1 = updatedFields.phone || (currentMem ? currentMem.phone : '');
      if (this.normalizePhone(p1) === this.normalizePhone(updatedFields.phone2)) {
        throw new Error("Le numéro principal et le second numéro doivent être différents pour une même personne.");
      }
      const conflict2 = this.isPhoneTaken(updatedFields.phone2, id);
      if (conflict2) {
        throw new Error(`Le second numéro ${updatedFields.phone2} est déjà attribué à "${conflict2.name}" (${conflict2.details}). Aucun numéro ne peut être partagé par deux personnes.`);
      }
    }
    const data = this.get();
    const idx = data.members.findIndex(m => m.id === id);
    if (idx !== -1) {
      data.members[idx] = { ...data.members[idx], ...updatedFields };
      this.save(data);
      return data.members[idx];
    }
    return null;
  },

  deleteMember: function (id) {
    const data = this.get();
    data.members = (data.members || []).filter(m => m.id !== id);
    // Supprimer systématiquement tous les montants et cotisations du membre supprimé
    data.cotisations = (data.cotisations || []).filter(c => (c.memberId || c.member_id) !== id);
    if (data.evenements) {
      data.evenements.forEach(ev => {
        if (ev.versements) {
          ev.versements = ev.versements.filter(v => v.memberId !== id);
        }
      });
    }
    if (data.entraide) {
      data.entraide = (data.entraide || []).filter(e => e.memberId !== id);
    }
    this.save(data);
  },

  purgeOrphanCotisations: function () {
    const data = this.get();
    const activeMemberIds = new Set((data.members || []).map(m => m.id));
    const initialCount = (data.cotisations || []).length;
    data.cotisations = (data.cotisations || []).filter(c => activeMemberIds.has(c.memberId || c.member_id));
    const purged = initialCount - data.cotisations.length;
    if (purged > 0) {
      this.save(data);
    }
    return purged;
  },

  // Cotisations
  addCotisation: function (cot) {
    const data = this.get();
    if (!data.cotisations) data.cotisations = [];

    cot.id = cot.id || ('cot-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));

    if (!cot.recuNum) {
      const existingRecus = new Set(data.cotisations.map(c => c.recuNum || c.recu_num).filter(Boolean));
      let nextNum = data.cotisations.length + 1;
      for (const c of data.cotisations) {
        const r = String(c.recuNum || c.recu_num || '');
        const match = r.match(/REC-\d+-(\d+)/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num >= nextNum) {
            nextNum = num + 1;
          }
        }
      }
      while (existingRecus.has('REC-2026-' + String(nextNum).padStart(3, '0'))) {
        nextNum++;
      }
      cot.recuNum = 'REC-2026-' + String(nextNum).padStart(3, '0');
    }

    cot.datePaiement = cot.datePaiement || new Date().toISOString().split('T')[0];
    cot.statut = 'Validé';

    // Mettre à jour le statut du membre
    const mem = data.members.find(m => m.id === cot.memberId);
    if (mem) {
      mem.statutCotisation = 'A_JOUR';
    }

    data.cotisations.unshift(cot);
    this.save(data);
    return cot;
  },

  updateCotisation: function (cotId, updatedFields) {
    const data = this.get();
    const idx = (data.cotisations || []).findIndex(c => c.id === cotId);
    if (idx !== -1) {
      const oldCot = data.cotisations[idx];
      const newMontant = updatedFields.montant !== undefined ? Number(updatedFields.montant || 0) : Number(oldCot.montant || 0);

      data.cotisations[idx] = { ...oldCot, ...updatedFields, montant: newMontant };
      this.save(data);
      return data.cotisations[idx];
    }
    return null;
  },

  deleteCotisation: function (cotId) {
    const data = this.get();
    const cot = (data.cotisations || []).find(c => c.id === cotId);
    if (cot) {
      data.cotisations = data.cotisations.filter(c => c.id !== cotId);
      this.save(data);
      return true;
    }
    return false;
  },

  // Entraide
  addEntraide: function (cas) {
    const data = this.get();
    cas.id = 'cas-' + Date.now();
    cas.reference = 'CAS-2026-' + String(data.entraide.length + 1).padStart(2, '0');
    cas.dateDemande = cas.dateDemande || new Date().toISOString().split('T')[0];

    data.entraide.unshift(cas);
    this.save(data);
    return cas;
  },

  updateEntraideStatut: function (id, nouveauStatut, montantAlloue) {
    const data = this.get();
    const cas = data.entraide.find(c => c.id === id);
    if (cas) {
      const oldStatut = cas.statut;
      cas.statut = nouveauStatut;
      if (montantAlloue) cas.montantAlloue = Number(montantAlloue);

      if (nouveauStatut === 'Accordé & Décaissé' && oldStatut !== 'Accordé & Décaissé') {
        cas.dateResolution = new Date().toISOString().split('T')[0];
      }
      this.save(data);
      return cas;
    }
    return null;
  },

  // Cérémonies
  addCeremonie: function (cer) {
    const data = this.get();
    cer.id = 'cer-' + Date.now();
    if (!cer.statut) cer.statut = 'À venir';
    data.ceremonies.unshift(cer);
    this.save(data);
    return cer;
  },

  // Bureau
  addBureauMember: function (bur) {
    const data = this.get();
    bur.id = bur.id || ('bur-' + Date.now());
    bur.photoInitial = (bur.name || 'MB').trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';
    bur.level = bur.level || 3;
    if (!data.bureau) data.bureau = [];
    data.bureau.push(bur);
    this.save(data);
    return bur;
  },

  updateBureauMember: function (bureauId, name, phone, email, bio) {
    const data = this.get();
    const item = data.bureau.find(b => b.id === bureauId);
    if (item) {
      item.name = name;
      item.phone = phone;
      item.email = email;
      item.bio = bio;
      item.photoInitial = (name || 'MB').trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';
      this.save(data);
      return item;
    }
    return null;
  },

  deleteBureauMember: function (bureauId) {
    const data = this.get();
    data.bureau = (data.bureau || []).filter(b => b.id !== bureauId);
    this.save(data);
    return true;
  },

  initStatutoryBureau: function () {
    const statutoryRoles = [
      { role: 'Président', bio: 'Garant de la vision, de la cohésion et des orientations stratégiques de la Mutuelle.', level: 3, name: 'BAMBA Mamadou', email: 'mamadou.bamba@tagba.ci', photoInitial: 'BM' },
      { role: 'Vice-Président', bio: 'Assiste le Président et assure la coordination opérationnelle des commissions.', level: 3 },
      { role: 'Secrétaire Général', bio: 'En charge des procès-verbaux, courriers, archives et communication officielle.', level: 3 },
      { role: 'Vice-Secrétaire', bio: 'Appuie le Secrétaire général et gère le registre des membres et les présences.', level: 3 },
      { role: 'Trésorier Général', bio: 'Responsable de la caisse, des encaissements des cotisations et des états financiers.', level: 1 },
      { role: 'Vice-Trésorier', bio: 'Émet les reçus de versement et tient le livre journal des entrées et sorties.', level: 1 },
      { role: 'Commissaire aux Comptes', bio: 'Audite et vérifie la régularité des comptes, des reçus et des dépenses de solidarité. Pleins droits d’administration (Niveau 1).', level: 1, name: 'Drissa Ouattara', email: 'drissa.ouattara@tagba.ci', photoInitial: 'DO' },
      { role: 'Vice-Commissaire aux Comptes', bio: 'Assiste le Commissaire aux comptes lors des contrôles périodiques et inventaires.', level: 1 },
      { role: 'Conseiller 1 (Sagesse & Médiation)', bio: 'Doyen et sage, chargé du règlement pacifique des conflits et de la médiation interne.', level: 3 },
      { role: 'Conseiller 2 (Organisation & Protocole)', bio: 'Supervise la logistique, les cérémonies et la mobilisation des familles.', level: 3 },
      { role: 'Conseiller 3 (Jeunesse & Projets)', bio: 'Anime les initiatives de la jeunesse et l’insertion socioprofessionnelle.', level: 3 },
      { role: 'Porte-Parole', bio: 'Porte la voix officielle du bureau, assure les déclarations officielles et coordonne les annonces pour les cérémonies (Niveau 2).', level: 2, name: 'Salif Koné', email: 'salif.kone@tagba.ci', photoInitial: 'SK' },
      { role: 'Porte-Parole Adjoint', bio: 'Assiste le porte-parole principal et le seconde dans l’organisation et l’animation des cérémonies et assemblées.', level: 2, name: 'Yacouba Bamba', email: 'yacouba.bamba@tagba.ci', photoInitial: 'YB' }
    ];
    const data = this.get();
    data.bureau = statutoryRoles.map((r, idx) => ({
      id: 'bur-' + (idx + 1),
      role: r.role,
      name: r.name || '[Poste vacant - À désigner]',
      phone: '',
      email: r.email || '',
      bio: r.bio,
      photoInitial: r.photoInitial || 'PV',
      level: r.level
    }));
    this.save(data);
    return data.bureau;
  },

  // Configuration des montants et paramètres
  updateConfig: function (newConfig) {
    const data = this.get();
    data.config = { ...data.config, ...newConfig };
    this.save(data);
    return data.config;
  }
};
