/**
 * TAGBA - Supabase Cloud Synchronization, Realtime & Client
 * Projet : quxnhuelshtaflsxedoi
 */

const TAGBA_SUPABASE_CONFIG = {
  url: 'https://quxnhuelshtaflsxedoi.supabase.co',
  key: 'sb_publishable_NFs2E7MMw6AsBalV6dMJ5Q_IkZvRWdK',
  projectRef: 'quxnhuelshtaflsxedoi',
  sqlEditorUrl: 'https://supabase.com/dashboard/project/quxnhuelshtaflsxedoi/sql/new'
};

let tagbaSupabaseClient = null;
let tagbaRealtimeChannel = null;
let isSyncingToCloud = false;
let isPullingFromCloud = false;
let autoSyncTimer = null;

function getSupabaseClient() {
  if (tagbaSupabaseClient) return tagbaSupabaseClient;
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    tagbaSupabaseClient = window.supabase.createClient(
      TAGBA_SUPABASE_CONFIG.url,
      TAGBA_SUPABASE_CONFIG.key
    );
  }
  return tagbaSupabaseClient;
}

// Mise à jour visuelle du badge de statut
function updateSyncStatusBadge(status, customText = '') {
  const statusBadge = document.getElementById('supabaseStatusBadge');
  const detailsEl = document.getElementById('supabaseStatusDetails');

  if (statusBadge) {
    if (status === 'connected') {
      statusBadge.className = 'badge badge-success';
      statusBadge.innerHTML = '🟢 Cloud Temps Réel Actif';
      statusBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      statusBadge.style.borderColor = 'rgba(16, 185, 129, 0.5)';
      statusBadge.style.color = 'var(--emerald-400)';
    } else if (status === 'syncing') {
      statusBadge.className = 'badge badge-warning';
      statusBadge.innerHTML = '⏳ Synchronisation...';
      statusBadge.style.background = 'rgba(245, 158, 11, 0.2)';
      statusBadge.style.borderColor = 'rgba(245, 158, 11, 0.5)';
      statusBadge.style.color = 'var(--amber-400)';
    } else if (status === 'offline') {
      statusBadge.className = 'badge badge-danger';
      statusBadge.innerHTML = '🔴 Hors-Ligne (Stockage Local)';
      statusBadge.style.background = 'rgba(239, 68, 68, 0.2)';
      statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      statusBadge.style.color = 'var(--rose-400)';
    } else if (status === 'error') {
      statusBadge.className = 'badge badge-danger';
      statusBadge.innerHTML = '⚠️ Erreur Cloud';
    }
  }

  if (detailsEl && customText) {
    detailsEl.innerHTML = customText;
  }
}

// Configuration du canal Realtime Supabase (Postgres Changes + Broadcast instantané)
function setupSupabaseRealtime() {
  const client = getSupabaseClient();
  if (!client || tagbaRealtimeChannel) return;

  try {
    tagbaRealtimeChannel = client.channel('tagba-live-sync-v1', {
      config: { broadcast: { self: false } }
    });

    // 1. Réception instantanée d'un broadcast émis par un autre appareil (PC, téléphone, etc.)
    tagbaRealtimeChannel.on('broadcast', { event: 'tagba_data_changed' }, (payload) => {
      console.log('⚡ [Realtime] Notification de mise à jour reçue d’un autre appareil :', payload);
      pullAllDataFromSupabase(true, true);
    });

    // 2. Réception directe des mutations Postgres
    tagbaRealtimeChannel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      console.log('⚡ [Realtime] Événement base Postgres détecté :', payload);
      pullAllDataFromSupabase(true, true);
    });

    tagbaRealtimeChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('⚡ [Realtime] Connecté au canal temps réel Supabase !');
        updateSyncStatusBadge('connected');
      }
    });
  } catch (err) {
    console.warn('[Realtime] Erreur initialisation :', err);
  }
}

// Émission d'un broadcast à tous les autres appareils connectés
function broadcastDataChanged() {
  if (tagbaRealtimeChannel) {
    tagbaRealtimeChannel.send({
      type: 'broadcast',
      event: 'tagba_data_changed',
      payload: { timestamp: Date.now() }
    }).catch(err => console.warn('[Realtime] Erreur envoi broadcast:', err));
  }
}

// Déclenchement automatique de la synchronisation (Debounced)
window.autoSyncWithSupabase = function() {
  if (!navigator.onLine) {
    updateSyncStatusBadge('offline');
    return;
  }
  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    pushAllDataToSupabase(true);
  }, 400);
};

// Suppression directe d'enregistrements spécifiques dans les tables Supabase
async function deleteMemberFromSupabase(memberId) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('members').delete().eq('id', memberId);
  } catch (err) {
    console.warn('[Supabase] Erreur suppression membre:', err);
  }
}

async function deleteFamilyFromSupabase(familyId) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('families').delete().eq('id', familyId);
  } catch (err) {
    console.warn('[Supabase] Erreur suppression famille:', err);
  }
}

async function deleteBureauMemberFromSupabase(burId) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('bureau').delete().eq('id', burId);
  } catch (err) {
    console.warn('[Supabase] Erreur suppression bureau:', err);
  }
}

async function deleteCotisationFromSupabase(cotId) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('cotisations').delete().eq('id', cotId);
  } catch (err) {
    console.warn('[Supabase] Erreur suppression cotisation:', err);
  }
}

async function deleteEntraideFromSupabase(casId) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('entraide').delete().eq('id', casId);
  } catch (err) {
    console.warn('[Supabase] Erreur suppression entraide:', err);
  }
}

async function deleteCeremonieFromSupabase(cerId) {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('ceremonies').delete().eq('id', cerId);
  } catch (err) {
    console.warn('[Supabase] Erreur suppression ceremonie:', err);
  }
}

// Test de connectivité ou ouverture du panneau de synchronisation
async function testSupabaseCloudConnection(testOnly = false) {
  if (!testOnly && typeof openModal === 'function' && document.getElementById('modalCloudSync')) {
    openModal('modalCloudSync');
    return true;
  }

  updateSyncStatusBadge('syncing');
  const detailsEl = document.getElementById('supabaseStatusDetails');

  const client = getSupabaseClient();
  if (!client) {
    updateSyncStatusBadge('error');
    if (detailsEl) detailsEl.textContent = 'SDK Supabase non chargé';
    return false;
  }

  try {
    const { error } = await client.from('app_config').select('key').limit(1);
    if (error && error.code === 'PGRST205') {
      updateSyncStatusBadge('warning');
      if (detailsEl) {
        detailsEl.innerHTML = `
          <span style="color: var(--amber-400);">Projet connecté, tables à créer.</span><br>
          <button class="btn btn-sm btn-gold" style="margin-top: 8px;" onclick="openSupabaseSQLEditor()">
            📋 Ouvrir SQL Editor Supabase & Créer les Tables
          </button>
        `;
      }
      return true;
    }
    updateSyncStatusBadge('connected');
    if (detailsEl) {
      detailsEl.innerHTML = `<span style="color: var(--emerald-400);">Connexion au Cloud Supabase 100% opérationnelle. Données synchronisées en direct.</span>`;
    }
    showToast('🟢 Connecté avec succès au Cloud Supabase !');
    return true;
  } catch (err) {
    console.error('Erreur test Supabase:', err);
    updateSyncStatusBadge('error');
    if (detailsEl) detailsEl.textContent = err.message || 'Erreur de connexion';
    return false;
  }
}

// Envoi complet des données locales vers Supabase (Push)
async function pushAllDataToSupabase(silent = false) {
  if (isSyncingToCloud) return;
  const client = getSupabaseClient();
  if (!client) {
    if (!silent) showToast('SDK Supabase introuvable', 'error');
    return;
  }

  isSyncingToCloud = true;
  if (!silent) showToast('⏳ Synchronisation vers Supabase en cours...', 'info');
  updateSyncStatusBadge('syncing');

  const localData = TAGBA_DB.get();
  localData.lastModified = Date.now();

  try {
    // 1. Sauvegarde intégrale absolue dans app_config (Source unique de vérité atomique)
    const { error: errFull } = await client.from('app_config').upsert([
      {
        key: 'tagba_full_data',
        value: localData,
        updated_at: new Date().toISOString()
      },
      {
        key: 'main_config',
        value: localData.config || {},
        updated_at: new Date().toISOString()
      }
    ]);
    if (errFull) throw errFull;

    // 2. Synchronisation parallèle des tables relationnelles
    const promises = [];

    if (localData.families && localData.families.length > 0) {
      const famRows = localData.families.map(f => ({
        id: f.id,
        code: f.code || 'FAM',
        name: f.name,
        chef_de_famille: f.chefDeFamille,
        phone: f.phone || '',
        city: f.city || '',
        notes: f.notes || ''
      }));
      promises.push(client.from('families').upsert(famRows));
    }

    if (localData.members && localData.members.length > 0) {
      const memRows = localData.members.map(m => ({
        id: m.id,
        matricule: m.matricule,
        full_name: m.fullName,
        family_id: m.familyId || null,
        is_chef: Boolean(m.is_chef),
        relation_to_chef: m.relationToChef || 'Membre',
        phone: m.phone || '',
        profession: m.profession || '',
        residence: m.residence || '',
        statut_cotisation: m.statutCotisation || 'A_JOUR'
      }));
      promises.push(client.from('members').upsert(memRows));
    }

    if (localData.bureau && localData.bureau.length > 0) {
      const burRows = localData.bureau.map(b => ({
        id: b.id,
        role: b.role,
        name: b.name,
        phone: b.phone || '',
        email: b.email || '',
        bio: b.bio || '',
        photo_initial: b.photoInitial || 'MB',
        level: b.level || 3
      }));
      promises.push(client.from('bureau').upsert(burRows));
    }

    if (localData.cotisations && localData.cotisations.length > 0) {
      const cotRows = localData.cotisations.map(c => ({
        id: c.id,
        recu_num: c.recuNum,
        member_id: c.memberId || null,
        member_name: c.memberName || '',
        family_id: c.familyId || null,
        type: c.type || 'Mensuel',
        periode: c.periode || '',
        montant: Number(c.montant || 0),
        mode_paiement: c.modePaiement || 'Espèces',
        date_paiement: c.datePaiement,
        agent: c.agent || '',
        payeur_chef: c.payeurChef || '',
        batch_ref: c.batchRef || null
      }));
      promises.push(client.from('cotisations').upsert(cotRows));
    }

    if (localData.entraide && localData.entraide.length > 0) {
      const entRows = localData.entraide.map(e => ({
        id: e.id,
        reference: e.reference,
        member_id: e.memberId || null,
        member_name: e.memberName || '',
        nature: e.nature,
        description: e.description || '',
        montant_alloue: Number(e.montantAlloue || 0),
        statut: e.statut,
        date_resolution: e.dateResolution || null
      }));
      promises.push(client.from('entraide').upsert(entRows));
    }

    if (localData.ceremonies && localData.ceremonies.length > 0) {
      const cerRows = localData.ceremonies.map(c => ({
        id: c.id,
        titre: c.titre,
        type: c.type,
        family_id: c.familyId || null,
        organisateur: c.organisateur || '',
        date: c.date,
        lieu: c.lieu || '',
        enveloppe_soutien: Number(c.enveloppeSoutien || 0),
        delegation_bureau: c.delegationBureau || '',
        description: c.description || '',
        statut: c.statut || 'À venir'
      }));
      promises.push(client.from('ceremonies').upsert(cerRows));
    }

    if (localData.depenses && localData.depenses.length > 0) {
      try {
        const depRows = localData.depenses.map(d => ({
          id: d.id,
          recu_num: d.recuNum,
          titre: d.titre,
          categorie: d.categorie,
          cible_type: d.cibleType,
          cible_id: d.cibleId,
          cible_titre: d.cibleTitre,
          beneficiaire: d.beneficiaire,
          montant_total: Number(d.montantTotal || 0),
          part_caisse: Number(d.partCaisse || 0),
          part_volontaire: Number(d.partVolontaire || 0),
          date_paiement: d.datePaiement,
          mode_paiement: d.modePaiement,
          justificatif: d.justificatif,
          valide_par: d.validePar
        }));
        promises.push(client.from('depenses').upsert(depRows));
      } catch (_) {}
    }

    if (localData.contributionsVolontaires && localData.contributionsVolontaires.length > 0) {
      try {
        const donRows = localData.contributionsVolontaires.map(don => ({
          id: don.id,
          recu_num: don.recuNum,
          member_id: don.memberId || null,
          member_name: don.memberName,
          family_id: don.familyId || null,
          family_chef: don.familyChef,
          cible_type: don.cibleType,
          cible_id: don.cibleId,
          cible_titre: don.cibleTitre,
          montant: Number(don.montant || 0),
          mode_paiement: don.modePaiement,
          date_paiement: don.datePaiement,
          note: don.note,
          agent: don.agent
        }));
        promises.push(client.from('contributions_volontaires').upsert(donRows));
      } catch (_) {}
    }

    await Promise.allSettled(promises);

    // 3. Diffuser l'alerte à tous les autres appareils en temps réel
    broadcastDataChanged();

    updateSyncStatusBadge('connected');
    if (!silent) showToast('☁️ Toutes les données ont été synchronisées vers Supabase !');
  } catch (err) {
    console.error('Erreur push Supabase:', err);
    updateSyncStatusBadge('error');
    if (!silent) showToast(`Erreur lors de la synchronisation : ${err.message}`, 'error');
  } finally {
    isSyncingToCloud = false;
  }
}

// Récupération des données depuis Supabase vers le local (Pull)
async function pullAllDataFromSupabase(silent = false, force = false) {
  if (isPullingFromCloud || isSyncingToCloud) return;
  const client = getSupabaseClient();
  if (!client) {
    if (!silent) showToast('SDK Supabase introuvable', 'error');
    return;
  }

  isPullingFromCloud = true;
  if (!silent) showToast('⏳ Téléchargement depuis Supabase en cours...', 'info');

  try {
    const localData = TAGBA_DB.get();
    const localHasData = (localData.members && localData.members.length > 0) ||
                         (localData.families && localData.families.length > 0) ||
                         (localData.cotisations && localData.cotisations.length > 0);
    const localLastModified = Number(localData.lastModified || 0);

    // 1. Lire le snapshot atomique tagba_full_data dans app_config
    const { data: fullCfg, error: errFull } = await client.from('app_config').select('*').eq('key', 'tagba_full_data').maybeSingle();

    if (!errFull && fullCfg && fullCfg.value) {
      const cloudSnap = fullCfg.value;
      const cloudUpdatedAt = fullCfg.updated_at ? new Date(fullCfg.updated_at).getTime() : 0;
      const cloudHasData = (cloudSnap.members && cloudSnap.members.length > 0) ||
                           (cloudSnap.families && cloudSnap.families.length > 0) ||
                           (cloudSnap.cotisations && cloudSnap.cotisations.length > 0) ||
                           (cloudSnap.bureau && cloudSnap.bureau.length > 0);

      // CAS A : Le Cloud est vierge, mais cet appareil local a des données réelles -> Auto-Push vers le Cloud !
      if (!force && localHasData && !cloudHasData) {
        console.log('[Supabase Sync] Données locales présentes alors que le Cloud est vierge -> Synchronisation push prioritaire');
        isPullingFromCloud = false;
        await pushAllDataToSupabase(true);
        return;
      }

      // CAS B : Le Cloud possède des données valides
      if (cloudHasData) {
        // Si forcé, ou si le Cloud est plus récent, ou si l'appareil local est vierge
        if (force || cloudUpdatedAt >= localLastModified || !localHasData) {
          console.log('[Supabase Sync] Application du snapshot Cloud le plus récent');
          TAGBA_DB.save(cloudSnap, true); // skipSync = true évite la boucle d'écho
          renderAllViews();
          loadConfigForm();
          updateSyncStatusBadge('connected');
          if (!silent) showToast('✅ Données mises à jour avec succès depuis le Cloud Supabase !');
          isPullingFromCloud = false;
          return;
        }
      }
    }

    // 2. Fallback : Interroger les tables individuelles si tagba_full_data n'est pas encore initialisé
    const [famRes, memRes, burRes, cotRes, entRes, cerRes, depRes, donRes, cfgRes] = await Promise.allSettled([
      client.from('families').select('*'),
      client.from('members').select('*'),
      client.from('bureau').select('*'),
      client.from('cotisations').select('*'),
      client.from('entraide').select('*'),
      client.from('ceremonies').select('*'),
      client.from('depenses').select('*'),
      client.from('contributions_volontaires').select('*'),
      client.from('app_config').select('*').eq('key', 'main_config').maybeSingle()
    ]);

    const famData = famRes.status === 'fulfilled' && famRes.value.data ? famRes.value.data : [];
    const memData = memRes.status === 'fulfilled' && memRes.value.data ? memRes.value.data : [];
    const burData = burRes.status === 'fulfilled' && burRes.value.data ? burRes.value.data : [];
    const cotData = cotRes.status === 'fulfilled' && cotRes.value.data ? cotRes.value.data : [];
    const entData = entRes.status === 'fulfilled' && entRes.value.data ? entRes.value.data : [];
    const cerData = cerRes.status === 'fulfilled' && cerRes.value.data ? cerRes.value.data : [];
    const depData = depRes.status === 'fulfilled' && depRes.value.data ? depRes.value.data : [];
    const donData = donRes.status === 'fulfilled' && donRes.value.data ? donRes.value.data : [];
    const cfgData = cfgRes.status === 'fulfilled' && cfgRes.value.data && cfgRes.value.data.value ? cfgRes.value.data.value : null;

    const relationalHasData = famData.length > 0 || memData.length > 0 || burData.length > 0 || cotData.length > 0;

    if (relationalHasData || force) {
      const reconstructedData = {
        config: cfgData || localData.config,
        bureau: burData.length > 0 ? burData.map(b => ({
          id: b.id,
          role: b.role,
          name: b.name,
          phone: b.phone || '',
          email: b.email || '',
          bio: b.bio || '',
          photoInitial: b.photo_initial || 'MB',
          level: b.level || 3
        })) : localData.bureau,
        families: famData.length > 0 ? famData.map(f => ({
          id: f.id,
          code: f.code || 'FAM',
          name: f.name,
          chefDeFamille: f.chef_de_famille || 'Chef de famille',
          phone: f.phone || '',
          city: f.city || '',
          notes: f.notes || ''
        })) : localData.families,
        members: memData.length > 0 ? memData.map(m => ({
          id: m.id,
          matricule: m.matricule,
          fullName: m.full_name,
          familyId: m.family_id,
          isChef: Boolean(m.is_chef),
          relationToChef: m.relation_to_chef || 'Membre',
          phone: m.phone || '',
          profession: m.profession || '',
          residence: m.residence || '',
          statutCotisation: m.statut_cotisation || 'A_JOUR'
        })) : localData.members,
        cotisations: cotData.length > 0 ? cotData.map(c => ({
          id: c.id,
          recuNum: c.recu_num,
          memberId: c.member_id,
          memberName: c.member_name,
          familyId: c.family_id,
          type: c.type,
          periode: c.periode,
          montant: Number(c.montant || 0),
          modePaiement: c.mode_paiement,
          datePaiement: c.date_paiement,
          agent: c.agent,
          payeurChef: c.payeur_chef,
          batchRef: c.batch_ref
        })) : localData.cotisations,
        entraide: entData.length > 0 ? entData.map(e => ({
          id: e.id,
          reference: e.reference,
          memberId: e.member_id,
          memberName: e.member_name,
          nature: e.nature,
          description: e.description,
          montantAlloue: Number(e.montant_alloue || 0),
          statut: e.statut,
          dateResolution: e.date_resolution
        })) : localData.entraide,
        ceremonies: cerData.length > 0 ? cerData.map(c => ({
          id: c.id,
          titre: c.titre,
          type: c.type,
          familyId: c.family_id,
          organisateur: c.organisateur,
          date: c.date,
          lieu: c.lieu,
          enveloppeSoutien: Number(c.enveloppe_soutien || 0),
          delegationBureau: c.delegation_bureau,
          description: c.description,
          statut: c.statut
        })) : localData.ceremonies,
        depenses: depData.length > 0 ? depData.map(d => ({
          id: d.id,
          recuNum: d.recu_num,
          titre: d.titre,
          categorie: d.categorie,
          cibleType: d.cible_type,
          cibleId: d.cible_id,
          cibleTitre: d.cible_titre,
          beneficiaire: d.beneficiaire,
          montantTotal: Number(d.montant_total || 0),
          partCaisse: Number(d.part_caisse || 0),
          partVolontaire: Number(d.part_volontaire || 0),
          datePaiement: d.date_paiement,
          modePaiement: d.mode_paiement,
          justificatif: d.justificatif,
          validePar: d.valide_par
        })) : (localData.depenses || []),
        contributionsVolontaires: donData.length > 0 ? donData.map(don => ({
          id: don.id,
          recuNum: don.recu_num,
          memberId: don.member_id,
          memberName: don.member_name,
          familyId: don.family_id,
          familyChef: don.family_chef,
          cibleType: don.cible_type,
          cibleId: don.cible_id,
          cibleTitre: don.cible_titre,
          montant: Number(don.montant || 0),
          modePaiement: don.mode_paiement,
          datePaiement: don.date_paiement,
          note: don.note,
          agent: don.agent
        })) : (localData.contributionsVolontaires || [])
      };

      TAGBA_DB.save(reconstructedData, true);
      renderAllViews();
      loadConfigForm();
      updateSyncStatusBadge('connected');
      if (!silent) showToast('✅ Données mises à jour avec succès depuis le Cloud Supabase !');
    } else {
      if (!silent) showToast('ℹ️ Le Cloud Supabase est actuellement vierge.', 'info');
    }
  } catch (err) {
    console.error('Erreur pull Supabase:', err);
    updateSyncStatusBadge('error');
    if (!silent) showToast(`Erreur de récupération : ${err.message}`, 'error');
  } finally {
    isPullingFromCloud = false;
  }
}

// Ouvrir directement l'éditeur SQL de Supabase dans le navigateur
function openSupabaseSQLEditor() {
  window.open(TAGBA_SUPABASE_CONFIG.sqlEditorUrl, '_blank');
}

// Copier le script SQL dans le presse-papier
function copySupabaseSQLScript() {
  const sql = `-- ============================================================
-- MUTUELLE TAGBA - SCHEMA COMPLET SUPABASE
-- Projet: quxnhuelshtaflsxedoi (https://quxnhuelshtaflsxedoi.supabase.co)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.families (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    chef_de_famille TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    matricule TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    family_id TEXT REFERENCES public.families(id) ON DELETE SET NULL,
    is_chef BOOLEAN DEFAULT FALSE,
    relation_to_chef TEXT DEFAULT 'Membre',
    phone TEXT,
    profession TEXT,
    residence TEXT,
    statut_cotisation TEXT DEFAULT 'A_JOUR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bureau (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    bio TEXT,
    photo_initial TEXT,
    level INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cotisations (
    id TEXT PRIMARY KEY,
    recu_num TEXT UNIQUE NOT NULL,
    member_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
    member_name TEXT NOT NULL,
    family_id TEXT REFERENCES public.families(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    periode TEXT NOT NULL,
    montant NUMERIC NOT NULL,
    mode_paiement TEXT NOT NULL,
    date_paiement DATE NOT NULL,
    agent TEXT,
    payeur_chef TEXT,
    batch_ref TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.entraide (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    member_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
    member_name TEXT NOT NULL,
    nature TEXT NOT NULL,
    description TEXT,
    montant_alloue NUMERIC NOT NULL,
    statut TEXT DEFAULT 'En attente d''examen',
    date_resolution DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ceremonies (
    id TEXT PRIMARY KEY,
    titre TEXT NOT NULL,
    type TEXT NOT NULL,
    family_id TEXT REFERENCES public.families(id) ON DELETE SET NULL,
    organisateur TEXT NOT NULL,
    date DATE NOT NULL,
    lieu TEXT NOT NULL,
    enveloppe_soutien NUMERIC DEFAULT 0,
    delegation_bureau TEXT,
    description TEXT,
    statut TEXT DEFAULT 'À venir',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.depenses (
    id TEXT PRIMARY KEY,
    recu_num TEXT,
    titre TEXT NOT NULL,
    categorie TEXT NOT NULL,
    cible_type TEXT,
    cible_id TEXT,
    cible_titre TEXT,
    beneficiaire TEXT NOT NULL,
    montant_total NUMERIC NOT NULL,
    part_caisse NUMERIC DEFAULT 0,
    part_volontaire NUMERIC DEFAULT 0,
    date_paiement DATE NOT NULL,
    mode_paiement TEXT,
    justificatif TEXT,
    valide_par TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contributions_volontaires (
    id TEXT PRIMARY KEY,
    recu_num TEXT,
    member_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
    member_name TEXT NOT NULL,
    family_id TEXT REFERENCES public.families(id) ON DELETE SET NULL,
    family_chef TEXT,
    cible_type TEXT NOT NULL,
    cible_id TEXT,
    cible_titre TEXT,
    montant NUMERIC NOT NULL,
    mode_paiement TEXT,
    date_paiement DATE NOT NULL,
    note TEXT,
    agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bureau ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entraide ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceremonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions_volontaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write families" ON public.families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write bureau" ON public.bureau FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write cotisations" ON public.cotisations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write entraide" ON public.entraide FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write ceremonies" ON public.ceremonies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write depenses" ON public.depenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write contributions_volontaires" ON public.contributions_volontaires FOR ALL USING (true) WITH CHECK (true);
`;

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(sql).then(() => {
      showToast('📋 Script SQL copié dans le presse-papier ! Collez-le dans l’éditeur SQL Supabase.');
    }).catch(() => fallbackCopy(sql));
  } else {
    fallbackCopy(sql);
  }

  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) {
        showToast('📋 Script SQL copié dans le presse-papier !');
      } else {
        showToast('Veuillez copier manuellement le script', 'warning');
      }
    } catch(err) {
      showToast('Veuillez copier manuellement le script', 'warning');
    }
  }
}

// ============================================================
// ÉVÉNEMENTS D'AUTO-SYNCHRONISATION MULTI-APPAREILS & MOBILES
// ============================================================

// 1. Initialisation au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
  setupSupabaseRealtime();
  setTimeout(() => {
    if (navigator.onLine) {
      pullAllDataFromSupabase(true);
    }
  }, 350);
});

// 2. Synchronisation automatique lorsque le téléphone est déverrouillé ou l'onglet redevient actif
window.addEventListener('visibilitychange', () => {
  if (!document.hidden && navigator.onLine) {
    console.log('[TAGBA Sync] Écran réactivé -> Vérification des données Cloud...');
    setupSupabaseRealtime();
    pullAllDataFromSupabase(true);
  }
});

// 3. Synchronisation quand la fenêtre reprend le focus
window.addEventListener('focus', () => {
  if (navigator.onLine) {
    setupSupabaseRealtime();
    pullAllDataFromSupabase(true);
  }
});

// 4. Synchronisation automatique au retour d'une connexion internet
window.addEventListener('online', () => {
  updateSyncStatusBadge('connected');
  setupSupabaseRealtime();
  pullAllDataFromSupabase(true);
});

window.addEventListener('offline', () => {
  updateSyncStatusBadge('offline');
});
