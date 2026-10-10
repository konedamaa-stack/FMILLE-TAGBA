/**
 * TAGBA - Supabase Cloud Synchronization & Client
 * Projet : quxnhuelshtaflsxedoi
 */

const TAGBA_SUPABASE_CONFIG = {
  url: 'https://quxnhuelshtaflsxedoi.supabase.co',
  key: 'sb_publishable_NFs2E7MMw6AsBalV6dMJ5Q_IkZvRWdK',
  projectRef: 'quxnhuelshtaflsxedoi',
  sqlEditorUrl: 'https://supabase.com/dashboard/project/quxnhuelshtaflsxedoi/sql/new'
};

let tagbaSupabaseClient = null;

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

// Test de connectivité avec le Cloud Supabase
async function testSupabaseCloudConnection() {
  const statusBadge = document.getElementById('supabaseStatusBadge');
  const detailsEl = document.getElementById('supabaseStatusDetails');

  if (statusBadge) {
    statusBadge.className = 'badge badge-warning';
    statusBadge.textContent = '⏳ Test en cours...';
  }

  const client = getSupabaseClient();
  if (!client) {
    if (statusBadge) {
      statusBadge.className = 'badge badge-danger';
      statusBadge.textContent = '❌ SDK Supabase non chargé';
    }
    return false;
  }

  try {
    const { data, error } = await client.from('members').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === 'PGRST205' || (error.message && error.message.includes('Could not find the table'))) {
        if (statusBadge) {
          statusBadge.className = 'badge badge-warning';
          statusBadge.textContent = '⚠️ Connecté (Tables à créer)';
        }
        if (detailsEl) {
          detailsEl.innerHTML = `
            <span style="color: var(--amber-400);">Projet actif et connecté !</span><br>
            Les tables n'ont pas encore été créées dans la base de données.<br>
            <button class="btn btn-sm btn-gold" style="margin-top: 8px;" onclick="openSupabaseSQLEditor()">
              📋 Ouvrir SQL Editor Supabase & Créer les Tables
            </button>
          `;
        }
        return true;
      } else {
        throw error;
      }
    }

    // Tables existantes et accessibles !
    if (statusBadge) {
      statusBadge.className = 'badge badge-success';
      statusBadge.textContent = '🟢 Connecté & Synchronisé';
    }
    if (detailsEl) {
      detailsEl.innerHTML = `<span style="color: var(--emerald-400);">Connexion au Cloud Supabase 100% opérationnelle. Données accessibles en temps réel.</span>`;
    }
    showToast('🟢 Connecté avec succès au Cloud Supabase !');
    return true;
  } catch (err) {
    console.error('Erreur Supabase:', err);
    if (statusBadge) {
      statusBadge.className = 'badge badge-danger';
      statusBadge.textContent = '❌ Erreur de Connexion';
    }
    if (detailsEl) {
      detailsEl.textContent = err.message || 'Erreur de connexion à Supabase';
    }
    return false;
  }
}

// Envoi complet des données locales vers Supabase (Push)
async function pushAllDataToSupabase(silent = false) {
  const client = getSupabaseClient();
  if (!client) {
    if (!silent) showToast('SDK Supabase introuvable', 'error');
    return;
  }

  if (!silent) showToast('⏳ Synchronisation vers Supabase en cours...', 'info');
  const localData = TAGBA_DB.get();

  try {
    // 1. Families
    if (localData.families && localData.families.length > 0) {
      const famRows = localData.families.map(f => ({
        id: f.id,
        code: f.code || 'FAM',
        name: f.name,
        chef_de_famille: f.chefDeFamille,
        phone: f.phone,
        city: f.city,
        notes: f.notes
      }));
      const { error: errFam } = await client.from('families').upsert(famRows);
      if (errFam) throw errFam;
    }

    // 2. Members
    if (localData.members && localData.members.length > 0) {
      const memRows = localData.members.map(m => ({
        id: m.id,
        matricule: m.matricule,
        full_name: m.fullName,
        family_id: m.familyId,
        is_chef: Boolean(m.isChef),
        relation_to_chef: m.relationToChef,
        phone: m.phone,
        profession: m.profession,
        residence: m.residence,
        statut_cotisation: m.statutCotisation
      }));
      const { error: errMem } = await client.from('members').upsert(memRows);
      if (errMem) throw errMem;
    }

    // 3. Bureau
    if (localData.bureau && localData.bureau.length > 0) {
      const burRows = localData.bureau.map(b => ({
        id: b.id,
        role: b.role,
        name: b.name,
        phone: b.phone,
        email: b.email,
        bio: b.bio,
        photo_initial: b.photoInitial,
        level: b.level || 3
      }));
      const { error: errBur } = await client.from('bureau').upsert(burRows);
      if (errBur) throw errBur;
    }

    // 4. Cotisations
    if (localData.cotisations && localData.cotisations.length > 0) {
      const cotRows = localData.cotisations.map(c => ({
        id: c.id,
        recu_num: c.recuNum,
        member_id: c.memberId,
        member_name: c.memberName,
        family_id: c.familyId,
        type: c.type,
        periode: c.periode,
        montant: Number(c.montant || 0),
        mode_paiement: c.modePaiement,
        date_paiement: c.datePaiement,
        agent: c.agent,
        payeur_chef: c.payeurChef,
        batch_ref: c.batchRef || null
      }));
      const { error: errCot } = await client.from('cotisations').upsert(cotRows);
      if (errCot) throw errCot;
    }

    // 5. Entraide
    if (localData.entraide && localData.entraide.length > 0) {
      const entRows = localData.entraide.map(e => ({
        id: e.id,
        reference: e.reference,
        member_id: e.memberId,
        member_name: e.memberName,
        nature: e.nature,
        description: e.description,
        montant_alloue: Number(e.montantAlloue || 0),
        statut: e.statut,
        date_resolution: e.dateResolution || null
      }));
      const { error: errEnt } = await client.from('entraide').upsert(entRows);
      if (errEnt) throw errEnt;
    }

    // 6. Cérémonies
    if (localData.ceremonies && localData.ceremonies.length > 0) {
      const cerRows = localData.ceremonies.map(c => ({
        id: c.id,
        titre: c.titre,
        type: c.type,
        family_id: c.familyId,
        organisateur: c.organisateur,
        date: c.date,
        lieu: c.lieu,
        enveloppe_soutien: Number(c.enveloppeSoutien || 0),
        delegation_bureau: c.delegationBureau,
        description: c.description,
        statut: c.statut
      }));
      const { error: errCer } = await client.from('ceremonies').upsert(cerRows);
      if (errCer) throw errCer;
    }

    // 7. Dépenses
    if (localData.depenses && localData.depenses.length > 0) {
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
      const { error: errDep } = await client.from('depenses').upsert(depRows);
      if (errDep) throw errDep;
    }

    // 8. Contributions Volontaires (Dons nominatifs)
    if (localData.contributionsVolontaires && localData.contributionsVolontaires.length > 0) {
      const donRows = localData.contributionsVolontaires.map(don => ({
        id: don.id,
        recu_num: don.recuNum,
        member_id: don.memberId,
        member_name: don.memberName,
        family_id: don.familyId,
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
      const { error: errDon } = await client.from('contributions_volontaires').upsert(donRows);
      if (errDon) throw errDon;
    }

    // 9. Config
    if (localData.config) {
      await client.from('app_config').upsert({
        key: 'main_config',
        value: localData.config,
        updated_at: new Date().toISOString()
      });
    }

    showToast('☁️ Toutes les données ont été synchronisées avec succès vers Supabase !');
    testSupabaseCloudConnection();
  } catch (err) {
    console.error('Erreur synchronisation push:', err);
    if (err.code === 'PGRST205' || (err.message && err.message.includes('Could not find the table'))) {
      showToast('⚠️ Les tables n’existent pas encore sur Supabase. Cliquez sur "Ouvrir SQL Editor" pour les créer.', 'warning');
    } else {
      showToast(`Erreur lors de la synchronisation : ${err.message}`, 'error');
    }
  }
}

// Récupération des données depuis Supabase vers le local (Pull)
async function pullAllDataFromSupabase(silent = false) {
  const client = getSupabaseClient();
  if (!client) {
    if (!silent) showToast('SDK Supabase introuvable', 'error');
    return;
  }

  if (!silent) showToast('⏳ Téléchargement depuis Supabase en cours...', 'info');

  try {
    const [famRes, memRes, burRes, cotRes, entRes, cerRes, depRes, donRes, cfgRes] = await Promise.all([
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

    if (famRes.error) throw famRes.error;

    const currentLocal = TAGBA_DB.get();

    const cloudData = {
      config: cfgRes.data && cfgRes.data.value ? cfgRes.data.value : currentLocal.config,
      bureau: burRes.data && burRes.data.length > 0 ? burRes.data.map(b => ({
        id: b.id,
        role: b.role,
        name: b.name,
        phone: b.phone,
        email: b.email,
        bio: b.bio,
        photoInitial: b.photo_initial,
        level: b.level
      })) : currentLocal.bureau,
      families: famRes.data ? famRes.data.map(f => ({
        id: f.id,
        code: f.code,
        name: f.name,
        chefDeFamille: f.chef_de_famille,
        phone: f.phone,
        city: f.city,
        notes: f.notes
      })) : [],
      members: memRes.data ? memRes.data.map(m => ({
        id: m.id,
        matricule: m.matricule,
        fullName: m.full_name,
        familyId: m.family_id,
        isChef: m.is_chef,
        relationToChef: m.relation_to_chef,
        phone: m.phone,
        profession: m.profession,
        residence: m.residence,
        statutCotisation: m.statut_cotisation
      })) : [],
      cotisations: cotRes.data ? cotRes.data.map(c => ({
        id: c.id,
        recuNum: c.recu_num,
        memberId: c.member_id,
        memberName: c.member_name,
        familyId: c.family_id,
        type: c.type,
        periode: c.periode,
        montant: Number(c.montant),
        modePaiement: c.mode_paiement,
        datePaiement: c.date_paiement,
        agent: c.agent,
        payeurChef: c.payeur_chef,
        batchRef: c.batch_ref
      })) : [],
      entraide: entRes.data ? entRes.data.map(e => ({
        id: e.id,
        reference: e.reference,
        memberId: e.member_id,
        memberName: e.member_name,
        nature: e.nature,
        description: e.description,
        montantAlloue: Number(e.montant_alloue),
        statut: e.statut,
        dateResolution: e.date_resolution
      })) : [],
      ceremonies: cerRes.data ? cerRes.data.map(c => ({
        id: c.id,
        titre: c.titre,
        type: c.type,
        familyId: c.family_id,
        organisateur: c.organisateur,
        date: c.date,
        lieu: c.lieu,
        enveloppeSoutien: Number(c.enveloppe_soutien),
        delegationBureau: c.delegation_bureau,
        description: c.description,
        statut: c.statut
      })) : [],
      depenses: depRes.data ? depRes.data.map(d => ({
        id: d.id,
        recuNum: d.recu_num,
        titre: d.titre,
        categorie: d.categorie,
        cibleType: d.cible_type,
        cibleId: d.cible_id,
        cibleTitre: d.cible_titre,
        beneficiaire: d.beneficiaire,
        montantTotal: Number(d.montant_total),
        partCaisse: Number(d.part_caisse),
        partVolontaire: Number(d.part_volontaire),
        datePaiement: d.date_paiement,
        modePaiement: d.mode_paiement,
        justificatif: d.justificatif,
        validePar: d.valide_par
      })) : (currentLocal.depenses || []),
      contributionsVolontaires: donRes.data ? donRes.data.map(don => ({
        id: don.id,
        recuNum: don.recu_num,
        memberId: don.member_id,
        memberName: don.member_name,
        familyId: don.family_id,
        familyChef: don.family_chef,
        cibleType: don.cible_type,
        cibleId: don.cible_id,
        cibleTitre: don.cible_titre,
        montant: Number(don.montant),
        modePaiement: don.mode_paiement,
        datePaiement: don.date_paiement,
        note: don.note,
        agent: don.agent
      })) : (currentLocal.contributionsVolontaires || [])
    };

    // Mettre à jour en local seulement si le Cloud contient des données
    if ((memRes.data && memRes.data.length > 0) || (famRes.data && famRes.data.length > 0)) {
      TAGBA_DB.save(cloudData);
      renderAllViews();
      loadConfigForm();
      if (!silent) showToast('✅ Données mises à jour avec succès depuis le Cloud Supabase !');
    } else {
      if (!silent) showToast('ℹ️ Le Cloud Supabase est vide ou les tables ne contiennent pas encore de données.', 'info');
    }
  } catch (err) {
    console.error('Erreur pull Supabase:', err);
    if (!silent) showToast(`Erreur de récupération : ${err.message}`, 'error');
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

  navigator.clipboard.writeText(sql).then(() => {
    showToast('📋 Script SQL copié dans le presse-papier ! Collez-le dans l’éditeur SQL Supabase.');
  }).catch(() => {
    showToast('Erreur lors de la copie du script', 'error');
  });
}

// ============================================================
// AUTO-SYNCHRONISATION AU CHARGEMENT DE L'APPLICATION
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (navigator.onLine && typeof pullAllDataFromSupabase === 'function') {
      pullAllDataFromSupabase(true);
    }
  }, 1000);
});


