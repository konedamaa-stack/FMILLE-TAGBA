-- ============================================================
-- MUTUELLE TAGBA - SCHEMA COMPLET SUPABASE
-- Projet: quxnhuelshtaflsxedoi (https://quxnhuelshtaflsxedoi.supabase.co)
-- ============================================================

-- 1. Table: families (Foyers & Chefs de Famille)
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

-- 2. Table: members (Membres adhérents)
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

-- 3. Table: bureau (Les 13 Postes Officiels du Bureau)
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

-- 4. Table: cotisations (Versements & Encaissements)
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

-- 5. Table: entraide (Solidarité & Cas Sociaux)
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

-- 6. Table: ceremonies (Cérémonies & Événements)
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

-- 7. Table: app_config (Paramètres généraux)
CREATE TABLE IF NOT EXISTS public.app_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ACTIVATION DU ROW LEVEL SECURITY (RLS) & POLITIQUES OUVERTES
-- ============================================================
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bureau ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entraide ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ceremonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Politiques publiques pour lecture et écriture via le client (anon)
CREATE POLICY "Allow public read-write families" ON public.families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write members" ON public.members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write bureau" ON public.bureau FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write cotisations" ON public.cotisations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write entraide" ON public.entraide FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write ceremonies" ON public.ceremonies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);
