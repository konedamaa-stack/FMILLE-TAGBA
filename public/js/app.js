// Contrôle en direct et instantané de l'unicité des numéros de téléphone
function checkPhoneLiveFeedback(inputEl, errorDivId, excludeId = null, siblingInputId = null) {
  if (!inputEl) return true;
  const errorEl = document.getElementById(errorDivId);
  const rawPhone = inputEl.value.trim();

  if (!rawPhone || rawPhone.length < 8) {
    inputEl.style.borderColor = '';
    inputEl.style.background = '';
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
    return true;
  }

  // Vérifier si le numéro est identique au numéro frère saisi dans le même formulaire
  if (siblingInputId) {
    const siblingEl = document.getElementById(siblingInputId);
    if (siblingEl && siblingEl.value.trim()) {
      const n1 = (TAGBA_DB.normalizePhone ? TAGBA_DB.normalizePhone(rawPhone) : rawPhone.replace(/\D/g, ''));
      const n2 = (TAGBA_DB.normalizePhone ? TAGBA_DB.normalizePhone(siblingEl.value) : siblingEl.value.replace(/\D/g, ''));
      if (n1 && n2 && n1 === n2) {
        inputEl.style.borderColor = 'var(--rose-500)';
        inputEl.style.background = 'rgba(244, 63, 94, 0.08)';
        if (errorEl) {
          errorEl.style.display = 'block';
          errorEl.innerHTML = `⚠️ <strong>Numéro identique !</strong> Les deux numéros d’une même personne doivent être distincts.`;
        }
        return false;
      }
    }
  }

  const conflict = TAGBA_DB.isPhoneTaken(rawPhone, excludeId);
  if (conflict) {
    inputEl.style.borderColor = 'var(--rose-500)';
    inputEl.style.background = 'rgba(244, 63, 94, 0.08)';
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.innerHTML = `⚠️ <strong>Numéro déjà attribué !</strong> Ce contact appartient déjà à <strong>${conflict.name}</strong> (${conflict.details}). Aucun numéro de téléphone ne peut être attribué à deux personnes.`;
    }
    return false;
  } else {
    inputEl.style.borderColor = 'var(--emerald-500)';
    inputEl.style.background = 'rgba(16, 185, 129, 0.05)';
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
    return true;
  }
}

// Modal d'édition d'un membre existant
function openEditMemberModal(memId) {
  if (!assertPermission('write', 'la modification d’un membre')) return;
  const data = TAGBA_DB.get();
  const mem = (data.members || []).find(m => m.id === memId);
  if (!mem) return;

  const editIdEl = document.getElementById('editMemId');
  const editMatEl = document.getElementById('editMemMatricule');
  const editNameEl = document.getElementById('editMemName');
  const editRelEl = document.getElementById('editMemRelation');
  const editPhoneEl = document.getElementById('editMemPhone');
  const editProfEl = document.getElementById('editMemProfession');
  const editResEl = document.getElementById('editMemResidence');
  const editStatEl = document.getElementById('editMemStatutCotisation');
  const famSelect = document.getElementById('editMemFamilySelect');

  if (editIdEl) editIdEl.value = mem.id;
  if (editMatEl) editMatEl.textContent = mem.matricule;
  if (editNameEl) editNameEl.value = mem.fullName || '';
  if (editRelEl) editRelEl.value = mem.relationToChef || '';
  if (editPhoneEl) {
    editPhoneEl.value = mem.phone || '';
    editPhoneEl.style.borderColor = '';
    editPhoneEl.style.background = '';
  }
  const editPhone2El = document.getElementById('editMemPhone2');
  if (editPhone2El) {
    editPhone2El.value = mem.phone2 || '';
    editPhone2El.style.borderColor = '';
    editPhone2El.style.background = '';
  }
  if (editProfEl) editProfEl.value = mem.profession || '';
  if (editResEl) editResEl.value = mem.residence || '';
  if (editStatEl) editStatEl.value = mem.statutCotisation || 'A_JOUR';

  if (famSelect) {
    let html = `<option value="" disabled>-- Sélectionner une famille --</option>`;
    const sortedFamilies = [...(data.families || [])].sort((a,b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }));
    sortedFamilies.forEach(f => {
      const chef = f.chefDeFamille || 'Chef';
      const isSel = f.id === mem.familyId;
      html += `<option value="${f.id}" ${isSel ? 'selected' : ''}>🏠 ${f.name} (Chef: ${chef})</option>`;
    });
    famSelect.innerHTML = html;
  }

  const phoneErr = document.getElementById('editMemPhoneError');
  if (phoneErr) {
    phoneErr.style.display = 'none';
    phoneErr.textContent = '';
  }
  const phone2Err = document.getElementById('editMemPhone2Error');
  if (phone2Err) {
    phone2Err.style.display = 'none';
    phone2Err.textContent = '';
  }

  openModal('modalEditMember');
}

/**
 * TAGBA - Application Logic & Controllers
 */

// Helper de formatage de monnaie
function formatMoney(amount, currency = 'FCFA') {
  try {
    const num = Number(amount) || 0;
    return new Intl.NumberFormat('fr-FR').format(num) + ' ' + currency;
  } catch (e) {
    return String(Math.round(Number(amount) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ' + currency;
  }
}

// Helper de formatage de date (JJ/MM/AAAA)
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const s = String(dateStr).split('T')[0];
    const parts = s.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('fr-FR');
    }
    return String(dateStr);
  } catch (e) {
    return String(dateStr);
  }
}
window.formatDate = formatDate;

// Helper Toast Notification (Sécurisé tous navigateurs)
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') toast.style.borderLeftColor = 'var(--rose-500)';
  if (type === 'warning') toast.style.borderLeftColor = 'var(--gold-500)';

  toast.innerHTML = `
    <span style="font-size: 18px;">${type === 'error' ? '⚠️' : '✅'}</span>
    <div style="font-size: 13px; font-weight: 500;">${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================
// SYSTÈME DE GESTION DES ACCÈS & RÔLES (3 NIVEAUX RBAC)
// ============================================================
// Niveau 1 : Commissaire aux comptes (et adjoint) -> Tous les droits (Écrire, modifier, supprimer, cotisations, membres, finances, paramètres)
// Niveau 2 : Porte-parole (et adjoint) -> Créer et gérer les cérémonies uniquement (le reste en lecture seule)
// Niveau 3 : Autres membres (y compris le Président) -> Lecture seule stricte sur toute l'application

const AUTH_USERS = {
  'usr-commissaire': {
    id: 'usr-commissaire',
    login: 'commissaire',
    email: 'drissa.ouattara@tagba.ci',
    matricule: 'TAGBA-2026-007',
    name: 'Drissa Ouattara',
    initials: 'DO',
    title: 'Commissaire aux Comptes',
    level: 1,
    levelName: 'Commissaire aux Comptes (Tous Droits)',
    passwords: ['1234', 'commissaire123', 'tagba2026'],
    canWriteAll: true,
    canCreateCeremonies: true
  },
  'usr-porteparole': {
    id: 'usr-porteparole',
    login: 'porteparole',
    email: 'salif.kone@tagba.ci',
    matricule: 'TAGBA-2026-015',
    name: 'Salif Koné',
    initials: 'SK',
    title: 'Porte-Parole',
    level: 1,
    levelName: 'Porte-Parole (Tous Droits)',
    passwords: ['1234', 'porteparole123', 'tagba2026'],
    canWriteAll: true,
    canCreateCeremonies: true
  },
  'usr-president': {
    id: 'usr-president',
    login: 'president',
    email: 'mamadou.bamba@tagba.ci',
    matricule: 'TAGBA-2026-001',
    name: 'BAMBA Mamadou',
    initials: 'BM',
    title: 'Président du Bureau',
    level: 1,
    levelName: 'Président du Bureau (Tous Droits)',
    passwords: ['1234', 'president123', 'tagba2026'],
    canWriteAll: true,
    canCreateCeremonies: true
  },
  'usr-membre': {
    id: 'usr-membre',
    login: 'membre',
    email: 'adherent@tagba.ci',
    matricule: 'TAGBA-2026-099',
    name: 'Parent / Adhérent Famille',
    title: 'Parent & Membre Adhérent',
    level: 1,
    levelName: 'Parent / Adhérent (Tous Droits)',
    passwords: ['1234', 'membre123', 'tagba2026'],
    canWriteAll: true,
    canCreateCeremonies: true
  }
};

function getActiveAuthUser() {
  const savedId = localStorage.getItem('tagba_auth_user') || 'usr-commissaire';
  return AUTH_USERS[savedId] || AUTH_USERS['usr-commissaire'];
}

function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  const idLower = identifier.trim().toLowerCase();
  for (const key in AUTH_USERS) {
    const u = AUTH_USERS[key];
    if (
      u.id.toLowerCase() === idLower ||
      u.login.toLowerCase() === idLower ||
      u.email.toLowerCase() === idLower ||
      u.matricule.toLowerCase() === idLower ||
      u.name.toLowerCase().includes(idLower)
    ) {
      return u;
    }
  }
  return null;
}

function handleFullscreenLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const identInput = document.getElementById('loginIdentifier');
  const pwdInput = document.getElementById('loginPassword');
  const errBox = document.getElementById('loginErrorMessage');

  if (errBox) {
    errBox.style.display = 'none';
    errBox.textContent = '';
  }

  const identifier = identInput ? identInput.value.trim() : '';
  const password = pwdInput ? pwdInput.value.trim() : '';

  if (!identifier) {
    showLoginError('Veuillez entrer votre identifiant de connexion.');
    return false;
  }

  const user = findUserByIdentifier(identifier);
  if (!user) {
    showLoginError(`Identifiant "${identifier}" introuvable. Utilisez: commissaire, porteparole ou president.`);
    return false;
  }

  // Vérification mot de passe
  const isValidPwd = user.passwords.includes(password) || password === '1234';
  if (!isValidPwd) {
    showLoginError('Mot de passe incorrect. Le code d\'accès par défaut est : 1234');
    return false;
  }

  // Connexion réussie !
  localStorage.setItem('tagba_auth_user', user.id);
  localStorage.setItem('tagba_session_authenticated', 'true');

  hideAuthFullscreen();
  applyActiveUserUI();
  showToast(`✅ Connexion réussie ! Bienvenue ${user.name} (${user.title}).`);
  return false;
}

function quickFillAndLogin(loginName, pwd = '1234') {
  const identInput = document.getElementById('loginIdentifier');
  const pwdInput = document.getElementById('loginPassword');
  if (identInput) identInput.value = loginName;
  if (pwdInput) pwdInput.value = pwd;
  handleFullscreenLogin(new Event('submit'));
}

function showLoginError(msg) {
  const errBox = document.getElementById('loginErrorMessage');
  if (errBox) {
    errBox.textContent = msg;
    errBox.style.display = 'flex';
  } else {
    showToast(msg, 'error');
  }
}

function togglePasswordVisibility() {
  const pwdInput = document.getElementById('loginPassword');
  const btn = document.getElementById('btnTogglePassword');
  if (!pwdInput) return;
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    pwdInput.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}

function hideAuthFullscreen() {
  const screen = document.getElementById('authFullscreenScreen');
  if (screen) {
    screen.classList.add('hidden');
    screen.style.display = 'none';
  }
}

function showAuthFullscreen() {
  const screen = document.getElementById('authFullscreenScreen');
  if (screen) {
    screen.classList.remove('hidden');
    screen.style.display = 'flex';
  }
}

function logoutAuthUser() {
  localStorage.setItem('tagba_session_authenticated', 'false');
  showAuthFullscreen();
  showToast('Vous avez été déconnecté de la mutuelle.');
}

function selectRoleTab(roleKey) {
  const tabIds = {
    'admin': 'roleTabAdmin',
    'speaker': 'roleTabSpeaker',
    'president': 'roleTabPres',
    'member': 'roleTabMember'
  };

  Object.values(tabIds).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const activeEl = document.getElementById(tabIds[roleKey]);
  if (activeEl) activeEl.classList.add('active');

  const roleConfigs = {
    'admin': {
      heroTitle: 'Direction &<br>Administration !',
      heroDesc: 'Pilotez l\'ensemble des activités, cotisations, familles et cérémonies de votre mutuelle.',
      subtitle: 'connexion en tant que administration',
      sectionTitle: 'Espace Administration',
      sectionDesc: 'Accès Direction, Secrétariat, Comptabilité et Supervision',
      defaultLogin: 'commissaire'
    },
    'speaker': {
      heroTitle: 'Communication &<br>Cérémonies !',
      heroDesc: 'Organisez les cérémonies officielles, mariages, baptêmes et annonces de la mutuelle.',
      subtitle: 'connexion en tant que porte-parole',
      sectionTitle: 'Espace Porte-Parole',
      sectionDesc: 'Création & Gestion des Cérémonies, Événements et Annonces',
      defaultLogin: 'porteparole'
    },
    'president': {
      heroTitle: 'Présidence &<br>Supervision !',
      heroDesc: 'Supervisez la conformité, consultez les bilans financiers et l\'état de la trésorerie.',
      subtitle: 'connexion en tant que président',
      sectionTitle: 'Espace Présidence',
      sectionDesc: 'Consultation globale de la Mutuelle, rapports et états financiers (Lecture Seule)',
      defaultLogin: 'president'
    },
    'member': {
      heroTitle: 'Famille &<br>Adhérents !',
      heroDesc: 'Consultez les versements familiaux, les cotisations mensuelles et les actions de solidarité.',
      subtitle: 'connexion en tant que parent d\'élève / membre',
      sectionTitle: 'Espace Parent / Membre',
      sectionDesc: 'Accès Consultation, suivi des cotisations et situation familiale (Lecture Seule)',
      defaultLogin: 'membre'
    }
  };

  const cfg = roleConfigs[roleKey] || roleConfigs['admin'];

  const heroTitle = document.getElementById('authHeroTitle');
  const heroDesc = document.getElementById('authHeroDesc');
  const roleSubtitle = document.getElementById('authRoleSubtitle');
  const sectionTitle = document.getElementById('authSectionTitle');
  const sectionDesc = document.getElementById('authSectionDesc');
  const identInput = document.getElementById('loginIdentifier');
  const pwdInput = document.getElementById('loginPassword');

  if (heroTitle) heroTitle.innerHTML = cfg.heroTitle;
  if (heroDesc) heroDesc.textContent = cfg.heroDesc;
  if (roleSubtitle) roleSubtitle.textContent = cfg.subtitle;
  if (sectionTitle) sectionTitle.textContent = cfg.sectionTitle;
  if (sectionDesc) sectionDesc.textContent = cfg.sectionDesc;
  if (identInput) identInput.value = cfg.defaultLogin;
  if (pwdInput && !pwdInput.value) pwdInput.value = '1234';
}

function initSessionState() {
  const isAuth = localStorage.getItem('tagba_session_authenticated');
  if (isAuth === 'false') {
    showAuthFullscreen();
    selectRoleTab('admin');
  } else {
    localStorage.setItem('tagba_session_authenticated', 'true');
    hideAuthFullscreen();
  }
}

function switchAuthUser(userId) {
  if (!AUTH_USERS[userId]) return;
  localStorage.setItem('tagba_auth_user', userId);
  localStorage.setItem('tagba_session_authenticated', 'true');
  hideAuthFullscreen();
  const user = AUTH_USERS[userId];
  applyActiveUserUI();
  showToast(`Connecté en tant que ${user.name} (${user.title}) — ${user.levelName}`);
}

function handleManualLogin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const select = document.getElementById('loginUserSelect');
  const pwd = document.getElementById('loginPasswordInput');
  const userId = select ? select.value : 'usr-commissaire';

  if (pwd && pwd.value.trim() !== '1234') {
    showToast('Code d\'accès PIN incorrect (Code démo par défaut : 1234)', 'error');
    return false;
  }

  switchAuthUser(userId);
  showToast('Authentification réussie !');
  return false;
}

function canUserPerform(actionType) {
  return true; // Tous les droits actifs et opérationnels sans restriction
}

function assertPermission(actionType, actionLabel = 'cette action') {
  return true; // Accès total garanti pour tous les utilisateurs
}

function applyActiveUserUI() {
  const user = getActiveAuthUser();
  if (!user) return;

  // 1. Sidebar profile widget
  const sbName = document.getElementById('sidebarUserName');
  const sbRole = document.getElementById('sidebarUserRole');
  const sbAvatar = document.getElementById('sidebarUserAvatar');
  const sbBadge = document.getElementById('sidebarAuthBadge');

  if (sbName) sbName.textContent = user.name;
  if (sbRole) sbRole.textContent = `${user.title} (${user.level === 1 ? 'Tous droits' : (user.level === 2 ? 'Cérémonies' : 'Lecture seule')})`;
  if (sbAvatar) sbAvatar.textContent = user.initials;
  if (sbBadge) {
    sbBadge.textContent = `Niv. ${user.level}`;
    if (user.level === 1) {
      sbBadge.style.background = 'rgba(16,185,129,0.2)';
      sbBadge.style.color = 'var(--emerald-400)';
    } else if (user.level === 2) {
      sbBadge.style.background = 'rgba(6,182,212,0.2)';
      sbBadge.style.color = 'var(--cyan-400)';
    } else {
      sbBadge.style.background = 'rgba(245,158,11,0.2)';
      sbBadge.style.color = 'var(--amber-400)';
    }
  }

  // 2. Topbar widget
  const tbName = document.getElementById('topbarUserName');
  const tbBadge = document.getElementById('topbarRoleBadge');
  if (tbName) tbName.textContent = user.name;
  if (tbBadge) {
    if (user.level === 1) {
      tbBadge.innerHTML = '🔑 Niveau 1 : Tous droits';
      tbBadge.className = 'auth-badge-pill auth-level-1';
    } else if (user.level === 2) {
      tbBadge.innerHTML = '📢 Niveau 2 : Cérémonies';
      tbBadge.className = 'auth-badge-pill auth-level-2';
    } else {
      tbBadge.innerHTML = '👁️ Niveau 3 : Lecture seule';
      tbBadge.className = 'auth-badge-pill auth-level-3';
    }
  }

  // 3. Tab Auth current role tag
  const authTag = document.getElementById('authCurrentRoleTag');
  if (authTag) {
    authTag.textContent = user.levelName;
    authTag.className = user.level === 1 ? 'badge badge-success' : (user.level === 2 ? 'badge badge-info' : 'badge badge-warning');
  }

  const selectUser = document.getElementById('loginUserSelect');
  if (selectUser) {
    selectUser.value = user.id;
  }

  // Cartes de rôle dans tab-auth
  ['authCardLevel1', 'authCardLevel2', 'authCardLevel3'].forEach((cardId, index) => {
    const card = document.getElementById(cardId);
    if (card) {
      if (user.level === index + 1) {
        card.style.transform = 'scale(1.02)';
        card.style.boxShadow = '0 0 25px rgba(16, 185, 129, 0.3)';
      } else {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
      }
    }
  });

  // 4. Déverrouillage visuel total et garanti de tous les boutons
  document.querySelectorAll('.action-locked-btn').forEach(btn => {
    btn.classList.remove('action-locked-btn');
  });

  const topbarCotBtn = document.getElementById('topbarNewCotisationBtn');
  if (topbarCotBtn) {
    topbarCotBtn.classList.remove('action-locked-btn');
    topbarCotBtn.title = 'Nouveau Versement';
  }
  const btnPlage = document.getElementById('btnPlageVersementMain');
  if (btnPlage) {
    btnPlage.classList.remove('action-locked-btn');
    btnPlage.title = 'Enregistrement groupé par famille';
  }
  const btnNouvCot = document.getElementById('btnNouveauVersementMain');
  if (btnNouvCot) {
    btnNouvCot.classList.remove('action-locked-btn');
    btnNouvCot.title = 'Enregistrer un nouveau versement';
  }
  const btnChef = document.getElementById('btnNouveauChefMain');
  if (btnChef) {
    btnChef.classList.remove('action-locked-btn');
    btnChef.title = 'Créer une nouvelle famille';
  }
  const btnMem = document.getElementById('btnNouveauMembreMain');
  if (btnMem) {
    btnMem.classList.remove('action-locked-btn');
    btnMem.title = 'Ajouter un nouveau membre';
  }
  const btnCer = document.getElementById('btnAddCeremonieMain');
  if (btnCer) {
    btnCer.classList.remove('action-locked-btn');
    btnCer.title = 'Programmer une nouvelle cérémonie';
  }
  const btnEntraide = document.getElementById('btnAddEntraideMain');
  if (btnEntraide) {
    btnEntraide.classList.remove('action-locked-btn');
    btnEntraide.title = 'Demande d’entraide financière';
  }
  const btnSaveCfg = document.getElementById('btnSaveConfig');
  if (btnSaveCfg) {
    btnSaveCfg.classList.remove('action-locked-btn');
    btnSaveCfg.title = 'Sauvegarder les paramètres';
  }
}

// Initialisation & Navigation par onglets
document.addEventListener('DOMContentLoaded', () => {
  initSessionState();
  initNavigation();
  initTheme();
  initFamilyViewSwitcher();
  try {
    renderAllViews();
  } catch (err) {
    console.warn('Rendu initial:', err);
  }
  bindModalEvents();
  bindFormSubmissions();
  applyActiveUserUI();
  initSessionState();
});

// Gestion du Dark/Light Theme
function initTheme() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('tagba_theme') || 'dark';
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    if (themeBtn) themeBtn.textContent = '🌙';
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('light-theme');
      const isLight = document.body.classList.contains('light-theme');
      themeBtn.textContent = isLight ? '🌙' : '☀️';
      localStorage.setItem('tagba_theme', isLight ? 'light' : 'dark');
    });
  }
}

// Navigation par onglets
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const panes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('currentPageTitle');
  const pageSubtitle = document.getElementById('currentPageSubtitle');
  const mobileToggle = document.getElementById('mobileToggleBtn');
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const closeBtn = document.getElementById('sidebarMobileClose');

  function openMobileNav() {
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (sidebar && sidebar.classList.contains('open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileNav);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMobileNav);
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      panes.forEach(p => p.classList.remove('active'));
      const activePane = document.getElementById(targetId);
      if (activePane) activePane.classList.add('active');

      // Mettre à jour le titre du header
      if (pageTitle) pageTitle.textContent = btn.getAttribute('data-title') || 'TAGBA';
      if (pageSubtitle) pageSubtitle.textContent = btn.getAttribute('data-subtitle') || 'Tableau de bord de la mutuelle';

      // Fermer la sidebar sur mobile
      closeMobileNav();

      // Rafraîchir la vue spécifique
      refreshCurrentTab(targetId);
    });
  });
}

function refreshCurrentTab(tabId) {
  if (tabId === 'tab-dashboard') renderDashboard();
  if (tabId === 'tab-bureau') renderBureau();
  if (tabId === 'tab-familles') renderFamiliesAndMembers();
  if (tabId === 'tab-cotisations') renderCotisations();
  if (tabId === 'tab-entraide') renderEntraide();
  if (tabId === 'tab-ceremonies' || tabId === 'tab-evenements') {
    renderCotisationsEventsTracking();
    renderCeremonies();
  }
  if (tabId === 'tab-finances') renderFinances();
  if (tabId === 'tab-data') loadConfigForm();
  applyActiveUserUI();
}

function renderAllViews() {
  renderDashboard();
  renderBureau();
  renderFamiliesAndMembers();
  renderCotisations();
  renderCotisationsEventsTracking();
  renderEntraide();
  renderCeremonies();
  renderFinances();
  populateSelectOptions();
  loadConfigForm();
  updateBaremeDisplays();
  updateCotisationModalDefaults();
}

// 1. Rendu Dashboard Harmonisé
function renderDashboard() {
  const data = TAGBA_DB.get();
  const fin = TAGBA_DB.getCaisseFinances();

  // KPIs
  const kpiMembres = document.getElementById('kpiTotalMembres');
  const kpiFamilles = document.getElementById('kpiTotalFamilles');
  const kpiCaisse = document.getElementById('kpiFondsCaisse');
  const kpiCaisseSub = document.getElementById('kpiFondsCaisseSub');
  const kpiCotisMensuelles = document.getElementById('kpiCotisMensuellesTotal');
  const kpiCotisMensuellesSub = document.getElementById('kpiCotisMensuellesSub');
  const kpiCotisEvents = document.getElementById('kpiCotisEventsTotal');
  const kpiCotisEventsSub = document.getElementById('kpiCotisEventsSub');
  const kpiAides = document.getElementById('kpiAidesTotal');
  const kpiAidesSub = document.getElementById('kpiAidesTotalSub');
  const kpiDonsTotal = document.getElementById('kpiDonsTotal');
  const kpiDonsSub = document.getElementById('kpiDonsSub');
  const kpiDepensesTotal = document.getElementById('kpiDepensesTotal');
  const kpiDepensesSub = document.getElementById('kpiDepensesSub');

  if (kpiMembres) kpiMembres.textContent = (data.members || []).length;
  if (kpiFamilles) kpiFamilles.textContent = (data.families || []).length + ' foyers';
  if (kpiCaisse) kpiCaisse.textContent = formatMoney(fin.soldeNetCaisse, fin.currency);
  if (kpiCaisseSub) kpiCaisseSub.textContent = `Solde net disponible`;

  const cotisMensuellesCount = (data.cotisations || []).filter(c => !(c.type || '').toLowerCase().includes('venement')).length;
  const cotisEventsCount = (data.cotisations || []).filter(c => (c.type || '').toLowerCase().includes('venement')).length;
  const decaissesAidesCount = (data.entraide || []).filter(c => c.statut === 'Accordé & Décaissé').length;

  if (kpiCotisMensuelles) kpiCotisMensuelles.textContent = formatMoney(fin.totalCotisationsMensuelles, fin.currency);
  if (kpiCotisMensuellesSub) kpiCotisMensuellesSub.textContent = `${cotisMensuellesCount} versement(s) ordinaire(s)`;

  const activeEvt = TAGBA_DB.getActiveEvenement() || { montant: 5000, titre: 'Cotisation Sacrifice de la Mutuelle' };
  const unitEvt = Number(activeEvt.montant || 5000);
  const totalMembres = (data.members || []).length;
  const budgetObjectifEvt = totalMembres * unitEvt;

  if (kpiCotisEvents) kpiCotisEvents.textContent = formatMoney(fin.totalCotisationsEvenements, fin.currency);
  if (kpiCotisEventsSub) {
    if (fin.totalCotisationsEvenements === 0) {
      kpiCotisEventsSub.innerHTML = `Objectif fixé : <strong style="color: var(--gold-400);">${formatMoney(budgetObjectifEvt, fin.currency)}</strong> (0/${totalMembres} réglé)`;
    } else {
      kpiCotisEventsSub.innerHTML = `${cotisEventsCount}/${totalMembres} membre(s) • Objectif : ${formatMoney(budgetObjectifEvt, fin.currency)}`;
    }
  }

  if (kpiAides) kpiAides.textContent = formatMoney(fin.totalAidesDecaissees, fin.currency);
  if (kpiAidesSub) kpiAidesSub.textContent = `${decaissesAidesCount} dossier(s) secouru(s)`;

  if (kpiDepensesTotal) kpiDepensesTotal.textContent = formatMoney(fin.totalDecaisseCaisse, fin.currency);
  if (kpiDepensesSub) kpiDepensesSub.textContent = `${(data.depenses || []).length} dépense(s) payée(s)`;

  if (kpiDonsTotal) kpiDonsTotal.textContent = formatMoney(fin.totalDonsVolontaires, fin.currency);
  if (kpiDonsSub) kpiDonsSub.textContent = `${(data.contributionsVolontaires || []).length} don(s) solidaire(s)`;

  // Table des récents versements
  const tbodyRecent = document.getElementById('tableRecentCotisations');
  if (tbodyRecent) {
    const recents = data.cotisations.slice(0, 5);
    if (recents.length === 0) {
      tbodyRecent.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">Aucun versement enregistré</td></tr>`;
    } else {
      tbodyRecent.innerHTML = recents.map(cot => `
        <tr>
          <td><strong style="color: var(--emerald-400);">${cot.recuNum}</strong></td>
          <td>
            <div style="font-weight: 600;">${cot.memberName}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${cot.periode}</div>
          </td>
          <td><strong>${formatMoney(cot.montant, data.config.currency)}</strong></td>
          <td><span class="badge badge-info">${cot.modePaiement}</span></td>
          <td>${cot.datePaiement}</td>
        </tr>
      `).join('');
    }
  }

  // Liste des prochaines cérémonies
  const listCeremoniesDash = document.getElementById('dashCeremoniesList');
  if (listCeremoniesDash) {
    const aVenir = data.ceremonies.filter(c => c.statut === 'À venir').slice(0, 3);
    if (aVenir.length === 0) {
      listCeremoniesDash.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">Aucune cérémonie programmée.</p>`;
    } else {
      listCeremoniesDash.innerHTML = aVenir.map(c => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border-left: 3px solid var(--gold-400); margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 14px;">${c.titre}</strong>
            <span class="badge badge-warning">${c.type}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); display: flex; gap: 14px;">
            <span>📅 ${c.date}</span>
            <span>📍 ${c.lieu}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Liste des cas sociaux actifs
  const listEntraideDash = document.getElementById('dashEntraideList');
  if (listEntraideDash) {
    const actifs = data.entraide.slice(0, 3);
    if (actifs.length === 0) {
      listEntraideDash.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">Aucun cas social actif.</p>`;
    } else {
      listEntraideDash.innerHTML = actifs.map(e => `
        <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: var(--radius-md); border-left: 3px solid var(--rose-500); margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 13px;">${e.memberName} (${e.nature})</strong>
            <span class="badge ${e.statut === 'Accordé & Décaissé' ? 'badge-success' : 'badge-warning'}">${e.statut}</span>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">${e.description}</p>
          <div style="font-size: 11px; color: var(--emerald-400); font-weight: 600;">Aide: ${formatMoney(e.montantAlloue, data.config.currency)}</div>
        </div>
      `).join('');
    }
  }
}

// 2. Rendu Bureau Exécutif (Dynamique avec Gestion Complète)
function renderBureau() {
  const data = TAGBA_DB.get();
  const grid = document.getElementById('bureauGrid');
  const countBadge = document.getElementById('bureauCountBadge');
  if (countBadge) countBadge.textContent = (data.bureau || []).length;
  if (!grid) return;

  if (!data.bureau || data.bureau.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; background: var(--bg-card); border: 2px dashed rgba(255,255,255,0.12); border-radius: var(--radius-lg);">
        <div style="font-size: 42px; margin-bottom: 12px;">🏛️</div>
        <h3 style="margin-bottom: 8px; font-size: 18px;">Aucun membre actuellement dans le Bureau Exécutif</h3>
        <p style="color: var(--text-muted); max-width: 520px; margin: 0 auto 24px auto; font-size: 14px; line-height: 1.5;">
          Vous pouvez ajouter vos membres poste par poste ou initialiser directement les 13 postes statutaires prévus par les Statuts officiels de la Mutuelle TAGBA.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" onclick="initStatutoryBureauPrompt()">
            ⚡ Initialiser les 13 Postes Statutaires
          </button>
          <button type="button" class="btn btn-primary" onclick="openModal('modalAddBureau')">
            + Ajouter un Membre / Poste
          </button>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = data.bureau.map(post => {
    let cardClass = 'bureau-card';
    if (post.role.includes('Président') && !post.role.includes('Vice')) cardClass += ' leadership-pres';
    if (post.role.includes('Trésorier') && !post.role.includes('Vice')) cardClass += ' leadership-tresor';

    return `
      <div class="${cardClass}">
        <div class="bureau-role-tag">
          <span>${post.role}</span>
          <span style="font-size: 14px;">${getRoleIcon(post.role)}</span>
        </div>
        <div class="bureau-person">
          <div class="bureau-avatar">${post.photoInitial || 'MB'}</div>
          <div class="bureau-details">
            <h4>${post.name}</h4>
            <p>📞 ${post.phone || 'Non renseigné'}</p>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px; flex: 1;">${post.bio || 'Aucune attribution renseignée.'}</p>
        <div class="bureau-meta" style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
          <span style="font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;">✉️ ${post.email || '—'}</span>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-secondary" onclick="openEditBureauModal('${post.id}')" title="Modifier">✏️ Modifier</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBureauMemberPrompt('${post.id}', '${(post.role || '').replace(/'/g, "\\'")}')" title="Supprimer">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getRoleIcon(role) {
  if (role.includes('Président')) return '👑';
  if (role.includes('Secrétaire')) return '📝';
  if (role.includes('Trésorier')) return '💰';
  if (role.includes('Commissaire')) return '⚖️';
  if (role.includes('Porte-Parole') || role.includes('Porte-parole')) return '📢';
  if (role.includes('Conseiller')) return '🏛️';
  return '👤';
}

// Mode d'affichage actif pour la section Familles
let currentFamilyViewMode = 'grouped';

function initFamilyViewSwitcher() {
  const switcher = document.getElementById('familyViewModeSwitcher');
  if (!switcher) return;

  const btns = switcher.querySelectorAll('.segmented-btn');
  const groupedContainer = document.getElementById('groupedFamiliesContainer');
  const tablePanel = document.getElementById('globalMembersTablePanel');
  const cardsContainer = document.getElementById('quickCardsContainer');

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFamilyViewMode = btn.getAttribute('data-view') || 'grouped';

      if (groupedContainer) groupedContainer.style.display = currentFamilyViewMode === 'grouped' ? 'block' : 'none';
      if (tablePanel) tablePanel.style.display = currentFamilyViewMode === 'table' ? 'block' : 'none';
      if (cardsContainer) cardsContainer.style.display = currentFamilyViewMode === 'cards' ? 'block' : 'none';

      renderFamiliesAndMembers();
    });
  });
}

// 3. Rendu Familles et Membres
function renderFamiliesAndMembers() {
  const searchInput = document.getElementById('memberSearchInput');
  const familyFilter = document.getElementById('memberFamilyFilter');

  const searchVal = searchInput ? searchInput.value.trim() : '';
  const familyVal = familyFilter ? familyFilter.value : '';

  renderGroupedByChef(searchVal, familyVal);
  renderMembersTable(searchVal, familyVal);
  renderQuickFamilyCards();
}

// 3.1. VUE PRINCIPALE : REGROUPEMENT PAR CHEF DE FAMILLE
function renderGroupedByChef(filterSearch = '', filterFamily = '') {
  const data = TAGBA_DB.get();
  const container = document.getElementById('groupedFamiliesContainer');
  if (!container) return;

  let familiesToDisplay = [...data.families].sort((a,b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }));
  if (filterFamily) {
    familiesToDisplay = familiesToDisplay.filter(f => f.id === filterFamily);
  }

  const s = filterSearch.toLowerCase();
  if (s) {
    familiesToDisplay = familiesToDisplay.filter(f => {
      const matchFam = f.name.toLowerCase().includes(s) || f.chefDeFamille.toLowerCase().includes(s) || f.city.toLowerCase().includes(s);
      const matchMember = data.members.some(m => m.familyId === f.id && (
        m.fullName.toLowerCase().includes(s) ||
        m.profession.toLowerCase().includes(s) ||
        m.matricule.toLowerCase().includes(s) ||
        ((m.phone || "").includes(s) || (m.phone2 || "").includes(s))
      ));
      return matchFam || matchMember;
    });
  }

  if (familiesToDisplay.length === 0) {
    container.innerHTML = `
      <div class="card-panel" style="text-align: center; padding: 40px; color: var(--text-muted);">
        <p style="font-size: 16px; margin-bottom: 8px;">Aucune famille ou chef de famille trouvé pour cette recherche.</p>
        <button class="btn btn-sm btn-secondary" onclick="document.getElementById('memberSearchInput').value=''; document.getElementById('memberFamilyFilter').value=''; renderFamiliesAndMembers();">Réinitialiser les filtres</button>
      </div>
    `;
    return;
  }

  container.innerHTML = familiesToDisplay.map(fam => {
    // Membres rattachés à ce chef
    let familyMembers = data.members.filter(m => m.familyId === fam.id).sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' }));
    if (s) {
      // Si recherche active, conserver les membres qui matchent ou tous si le chef matche
      const chefMatches = fam.name.toLowerCase().includes(s) || fam.chefDeFamille.toLowerCase().includes(s);
      if (!chefMatches) {
        familyMembers = familyMembers.filter(m =>
          m.fullName.toLowerCase().includes(s) ||
          m.profession.toLowerCase().includes(s) ||
          m.matricule.toLowerCase().includes(s) ||
          ((m.phone || "").includes(s) || (m.phone2 || "").includes(s))
        );
      }
    }

    // Statistiques financières et présence du foyer
    const memberIds = familyMembers.map(m => m.id);
    const totalCotiseFamille = data.cotisations
      .filter(c => memberIds.includes(c.memberId))
      .reduce((sum, c) => sum + Number(c.montant || 0), 0);

    const aJourCount = familyMembers.filter(m => m.statutCotisation === 'A_JOUR').length;
    const aJourPercent = familyMembers.length > 0 ? Math.round((aJourCount / familyMembers.length) * 100) : 0;

    // Initiales du chef pour l'avatar
    const chefInitials = fam.chefDeFamille.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    return `
      <div class="family-group-panel">
        
        <!-- En-tête du Chef de Famille -->
        <div class="family-group-header">
          <div class="chef-identity-box">
            <div class="chef-avatar">${chefInitials}</div>
            <div class="chef-info-texts">
              <h3>
                <span>${fam.chefDeFamille}</span>
                <span class="chef-badge">👑 Chef de Famille</span>
              </h3>
              <div class="chef-meta-sub">
                <span>🏛️ <strong>${fam.name}</strong> (${fam.code})</span>
                <span>📞 ${fam.phone}${fam.phone2 ? ' / ' + fam.phone2 : ''}</span>
                <span>📍 ${fam.city}</span>
              </div>
            </div>
          </div>

          <div class="family-kpis-bar">
            <div class="family-stat-tag">
              <span>Membres rattachés</span>
              <strong>${familyMembers.length} membre(s)</strong>
            </div>
            <div class="family-stat-tag">
              <span>Cotisations Foyer</span>
              <strong style="color: var(--emerald-400);">${formatMoney(totalCotiseFamille, data.config.currency)}</strong>
            </div>
            <div class="family-stat-tag">
              <span>Régularité</span>
              <strong style="color: ${aJourPercent >= 75 ? 'var(--emerald-400)' : 'var(--gold-400)'};">${aJourPercent}% à jour</strong>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm btn-gold" onclick="openFamilyBatchPayModal('${fam.id}')" title="Ouvrir la plage de versement groupé pour toute la famille">
                💳 Payer la Famille
              </button>
              <button class="btn btn-sm btn-secondary" onclick="openEditFamilyModal('${fam.id}')" title="Modifier les coordonnées du chef de famille et du foyer">
                ✏️ Modifier Chef
              </button>
              <button class="btn btn-sm btn-secondary" onclick="openFamilySheetModal('${fam.id}')" title="Imprimer la fiche officielle de ce foyer">
                🖨️ Fiche de Famille
              </button>
              <button class="btn btn-sm btn-primary" onclick="quickAddMemberToFamily('${fam.id}')" title="Ajouter un membre rattaché à ce chef">
                + Rattacher Membre
              </button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteFamilyConfirm('${fam.id}')" title="Supprimer cette famille">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Table des membres rattachés à ce chef -->
        <div class="family-group-body">
          ${familyMembers.length === 0 ? `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
              Aucun membre rattaché pour le moment à ce chef de famille.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th style="width: 100px;">Matricule</th>
                    <th>Membre & Poste</th>
                    <th>Lien avec le Chef</th>
                    <th>Contact direct</th>
                    <th>Profession</th>
                    <th>Statut Cotisation</th>
                    <th style="text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${familyMembers.map(mem => {
      const audit = getMemberCotisationAudit(mem.id);
      const memStatut = audit ? audit.statutKey : mem.statutCotisation;
      return `
                    <tr>
                      <td><strong style="color: var(--emerald-400);">${mem.matricule}</strong></td>
                      <td>
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 6px;">
                          ${mem.fullName}
                          ${mem.bureauRole ? `<span class="badge badge-purple" style="font-size: 9px;">${mem.bureauRole}</span>` : ''}
                        </div>
                        <div style="font-size: 11px; color: var(--text-dim);">Résidence : ${mem.residence}</div>
                      </td>
                      <td>
                        ${getRelationBadge(mem.relationToChef)}
                      </td>
                      <td>📞 ${mem.phone}${mem.phone2 ? ' / ' + mem.phone2 : ''}</td>
                      <td>${mem.profession}</td>
                      <td>
                        <span class="badge ${getStatutBadgeClass(memStatut)}">${formatStatut(memStatut)}</span>
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 6px;">
                          <button class="btn btn-sm btn-secondary" onclick="openEditMemberModal('${mem.id}')" title="Modifier les coordonnées du membre">✏️</button>
                          <button class="btn btn-sm btn-secondary" onclick="openMemberMonthsAuditModal('${mem.id}')" title="Calendrier et mois payés">📅 Mois</button>
                          <button class="btn btn-sm btn-secondary" onclick="quickPayMember('${mem.id}')" title="Encaisser versement">💳 Payer</button>
                          <button class="btn btn-sm btn-outline-danger" onclick="deleteMemberConfirm('${mem.id}')" title="Retirer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `;
    }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

      </div>
    `;
  }).join('');
}

// Helper badge lien de parenté avec le chef
function getRelationBadge(relation) {
  if (!relation) return `<span class="relation-pill relation-autre">Membre</span>`;
  const r = relation.toLowerCase();

  if (r.includes('chef')) {
    return `<span class="relation-pill relation-chef">👑 Chef lui-même</span>`;
  } else if (r.includes('épouse') || r.includes('epouse') || r.includes('femme')) {
    return `<span class="relation-pill relation-epouse">👰 Épouse</span>`;
  } else if (r.includes('fils') || r.includes('fille') || r.includes('enfant')) {
    return `<span class="relation-pill relation-enfant">👦 ${relation}</span>`;
  } else if (r.includes('frère') || r.includes('frere') || r.includes('sœur') || r.includes('soeur')) {
    return `<span class="relation-pill relation-frere">👨 ${relation}</span>`;
  } else if (r.includes('neveu') || r.includes('nièce') || r.includes('niece') || r.includes('cousin')) {
    return `<span class="relation-pill relation-autre">👱 ${relation}</span>`;
  } else {
    return `<span class="relation-pill relation-autre">🤝 ${relation}</span>`;
  }
}

// 3.2. VUE SECONDAIRE : ANNUAIRE GLOBAL (TABLEAU PLAT)
function renderMembersTable(filterSearch = '', filterFamily = '') {
  const data = TAGBA_DB.get();
  const tbody = document.getElementById('membersTableBody');
  const countBadge = document.getElementById('globalMembersCountBadge');
  if (!tbody) return;

  let filtered = data.members;
  if (filterSearch) {
    const s = filterSearch.toLowerCase();
    filtered = filtered.filter(m =>
      m.fullName.toLowerCase().includes(s) ||
      m.profession.toLowerCase().includes(s) ||
      m.matricule.toLowerCase().includes(s) ||
      ((m.phone || "").includes(s) || (m.phone2 || "").includes(s))
    );
  }

  if (filterFamily) {
    filtered = filtered.filter(m => m.familyId === filterFamily);
  }

  filtered = [...filtered].sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' }));

  if (countBadge) countBadge.textContent = `${filtered.length} membre(s)`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">Aucun membre trouvé selon ces filtres.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(mem => {
    const fam = data.families.find(f => f.id === mem.familyId);
    const famName = fam ? fam.name : 'Non rattaché';
    const chefName = fam ? fam.chefDeFamille : 'Non défini';
    const audit = getMemberCotisationAudit(mem.id);
    const memStatut = audit ? audit.statutKey : mem.statutCotisation;

    return `
      <tr>
        <td><strong style="color: var(--emerald-400);">${mem.matricule}</strong></td>
        <td>
          <div style="font-weight: 600;">
            <a href="javascript:void(0)" onclick="openMemberMonthsAuditModal('${mem.id}')" style="color: var(--text-main); text-decoration: none;">
              ${mem.fullName}
            </a>
            ${mem.bureauRole ? `<span class="badge badge-purple" style="font-size: 9px; margin-left: 6px;">${mem.bureauRole}</span>` : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">${mem.profession} • 📍 ${mem.residence}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${famName}</div>
          <div style="font-size: 11px; color: var(--gold-400);">Chef : ${chefName}</div>
          <div style="margin-top: 2px;">${getRelationBadge(mem.relationToChef)}</div>
        </td>
        <td>📞 ${mem.phone}${mem.phone2 ? ' / ' + mem.phone2 : ''}</td>
        <td><span class="badge ${getStatutBadgeClass(memStatut)}">${formatStatut(memStatut)}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-secondary" onclick="openEditMemberModal('${mem.id}')" title="Modifier le membre">✏️</button>
            <button class="btn btn-sm btn-secondary" onclick="openMemberMonthsAuditModal('${mem.id}')" title="Calendrier et mois payés">📅 Mois</button>
            <button class="btn btn-sm btn-secondary" onclick="quickPayMember('${mem.id}')" title="Enregistrer un versement">💳 Payer</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteMemberConfirm('${mem.id}')" title="Supprimer">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 3.3. VUE TERTIAIRE : CARTES RAPIDES
function renderQuickFamilyCards() {
  const data = TAGBA_DB.get();
  const famTreeGrid = document.getElementById('familyTreeGrid');
  if (!famTreeGrid) return;

  const sortedFamilies = [...data.families].sort((a,b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }));
  famTreeGrid.innerHTML = sortedFamilies.map(fam => {
    const familyMembers = data.members.filter(m => m.familyId === fam.id).sort((a,b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' }));
    return `
      <div class="family-card">
        <div class="family-head-box">
          <div class="avatar-sm" style="background: var(--grad-gold);">${fam.code}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 16px;">${fam.name}</h3>
              <span class="family-badge-chip">${familyMembers.length} membre(s)</span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between;">
              <span>Chef de famille : <strong>${fam.chefDeFamille}</strong></span>
              <button class="btn btn-xs btn-secondary" style="padding: 2px 6px;" onclick="openEditFamilyModal('${fam.id}')" title="Modifier le chef">✏️</button>
            </p>
            <p style="font-size: 11px; color: var(--text-dim);">📍 ${fam.city} • 📞 ${fam.phone}${fam.phone2 ? ' / ' + fam.phone2 : ''}</p>
            <button class="btn btn-sm btn-gold" style="margin-top: 6px; padding: 3px 10px; font-size: 11px;" onclick="openFamilyBatchPayModal('${fam.id}')">💳 Payer la Famille</button>
          </div>
        </div>
        <div class="family-members-list">
          <h5 style="font-size: 11px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;">Membres rattachés :</h5>
          ${familyMembers.map(mem => `
            <div class="family-member-row">
              <div>
                <div style="font-weight: 600; font-size: 13px;">${mem.fullName}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${mem.relationToChef} • ${mem.profession}</div>
              </div>
              <div style="text-align: right;">
                <span class="badge ${getStatutBadgeClass(mem.statutCotisation)}">${formatStatut(mem.statutCotisation)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Action rapide pour rattacher directement un membre à ce chef
function quickAddMemberToFamily(familyId) {
  openModal('modalAddMember');
  initModalAddMember(familyId);
}

// Modal Fiche Officielle du Foyer (Imprimable)
function openFamilySheetModal(familyId) {
  const data = TAGBA_DB.get();
  const fam = data.families.find(f => f.id === familyId);
  if (!fam) return;

  const familyMembers = data.members.filter(m => m.familyId === familyId);
  const memberIds = familyMembers.map(m => m.id);
  const totalCotise = data.cotisations
    .filter(c => memberIds.includes(c.memberId))
    .reduce((sum, c) => sum + Number(c.montant || 0), 0);

  const container = document.getElementById('familySheetContent');
  if (!container) return;

  container.innerHTML = `
    <div class="receipt-paper" style="max-width: 100%;">
      <div class="receipt-header">
        <h2>${data.config.assocName}</h2>
        <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">${data.config.tagline}</p>
        <p style="font-size: 13px; color: #047857; margin-top: 6px; font-weight: 700;">FICHE OFFICIELLE DU FOYER FAMILIAL & DES MEMBRES RATTACHÉS</p>
      </div>

      <div class="receipt-meta" style="background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <div>
          <p><strong>Code Famille :</strong> ${fam.code}</p>
          <p><strong>Dénomination :</strong> ${fam.name}</p>
          <p><strong>Chef de Famille :</strong> <span style="color: #b45309; font-weight: 700;">${fam.chefDeFamille}</span></p>
          <p><strong>Téléphone du Chef :</strong> ${fam.phone}</p>
        </div>
        <div>
          <p><strong>Lieu de résidence :</strong> ${fam.city}</p>
          <p><strong>Total membres rattachés :</strong> ${familyMembers.length}</p>
          <p><strong>Cotisations globales du foyer :</strong> ${formatMoney(totalCotise, data.config.currency)}</p>
          <p><strong>Date d'enregistrement :</strong> ${fam.creationDate || '2024-01-15'}</p>
        </div>
      </div>

      <h4 style="margin: 20px 0 10px 0; font-size: 14px; text-transform: uppercase; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
        Registre des membres rattachés à ce chef de famille
      </h4>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
            <th style="padding: 8px;">Matricule</th>
            <th style="padding: 8px;">Nom et Prénoms</th>
            <th style="padding: 8px;">Lien avec le Chef</th>
            <th style="padding: 8px;">Téléphone</th>
            <th style="padding: 8px;">Profession</th>
            <th style="padding: 8px;">Statut Cotisation</th>
          </tr>
        </thead>
        <tbody>
          ${familyMembers.map((m, idx) => `
            <tr style="border-bottom: 1px solid #f1f5f9; ${idx % 2 === 0 ? 'background: #fff;' : 'background: #f8fafc;'}">
              <td style="padding: 8px; font-weight: 700; color: #047857;">${m.matricule}</td>
              <td style="padding: 8px; font-weight: 600;">${m.fullName} ${m.bureauRole ? `(${m.bureauRole})` : ''}</td>
              <td style="padding: 8px;">${m.relationToChef}</td>
              <td style="padding: 8px;">${m.phone}</td>
              <td style="padding: 8px;">${m.profession}</td>
              <td style="padding: 8px; font-weight: 700; color: ${m.statutCotisation === 'A_JOUR' ? '#047857' : '#b45309'};">
                ${formatStatut(m.statutCotisation)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: space-between; margin-top: 30px; padding-top: 20px; border-top: 1px dashed #cbd5e1; font-size: 12px;">
        <div style="text-align: center;">
          <p style="font-weight: 700; margin-bottom: 35px;">Le Chef de Famille</p>
          <p style="color: #64748b;">${fam.chefDeFamille}</p>
        </div>
        <div style="text-align: center;">
          <p style="font-weight: 700; margin-bottom: 35px;">Pour le Bureau Exécutif TAGBA</p>
          <p style="color: #047857; font-weight: 700;">BAMBA Mamadou (Président)</p>
        </div>
      </div>
    </div>
  `;

  openModal('modalFamilySheet');
}

function getStatutBadgeClass(statut) {
  if (statut === 'EN_AVANCE') return 'badge-advance';
  if (statut === 'A_JOUR') return 'badge-success';
  if (statut === 'PARTIEL') return 'badge-warning';
  return 'badge-danger';
}

function formatStatut(statut) {
  if (statut === 'EN_AVANCE') return '🚀 En avance';
  if (statut === 'A_JOUR') return 'À jour';
  if (statut === 'PARTIEL') return 'Partiel';
  return 'En retard';
}

// 4. Rendu Cotisations & Versements
// 4. Rendu Cotisations & Versements
let currentCotisSubTab = 'recap_mois';
let currentMonthsTrackingFilter = 'ALL';
let currentMonthsLateFilter = 'ALL';
window.currentMonthsTrackingFilter = currentMonthsTrackingFilter;
window.currentMonthsLateFilter = currentMonthsLateFilter;
window.currentCotisSubTab = currentCotisSubTab;
let currentSelectedRecapMonth = null;
let currentRecapMoisDetailMode = 'paid';

function switchCotisSubTab(subTab) {
  if (subTab === 'events') {
    const btnEvt = document.querySelector('[data-tab="tab-ceremonies"]') || document.querySelector('[data-tab="tab-evenements"]');
    if (btnEvt) btnEvt.click();
    return;
  }
  currentCotisSubTab = subTab;
  window.currentCotisSubTab = subTab;
  const btnRecap = document.getElementById('btnCotisSubTabRecapMois');
  const btnMonths = document.getElementById('btnCotisSubTabMonths');
  const btnRegistre = document.getElementById('btnCotisSubTabRegistre');
  const viewRecap = document.getElementById('cotisationsRecapMoisView');
  const viewMonths = document.getElementById('cotisationsMonthsTrackingView');
  const viewRegistre = document.getElementById('cotisationsRegistreView');

  if (btnRecap) btnRecap.classList.toggle('active', subTab === 'recap_mois');
  if (btnMonths) btnMonths.classList.toggle('active', subTab === 'months');
  if (btnRegistre) btnRegistre.classList.toggle('active', subTab === 'registre');

  if (viewRecap) viewRecap.style.display = subTab === 'recap_mois' ? 'block' : 'none';
  if (viewMonths) viewMonths.style.display = subTab === 'months' ? 'block' : 'none';
  if (viewRegistre) viewRegistre.style.display = subTab === 'registre' ? 'block' : 'none';

  if (subTab === 'recap_mois') {
    renderCotisationsRecapMois();
  }
}

// 4.0. Module de Synthèse des Versements Mois par Mois
function getMonthlyCotisationsBreakdown() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const members = data.members || [];
  const cotisations = data.cotisations || [];
  const currency = cfg.currency || 'FCFA';

  // Filtrer les cotisations régulières (hors événements et sacrifices)
  const regularCots = cotisations.filter(c => {
    const t = (c.type || '').toLowerCase();
    const p = (c.periode || '').toLowerCase();
    return !c.eventId && !t.includes('venement') && !t.includes('vènement') && !p.includes('sacrifice');
  });

  const monthNamesFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const monthMap = new Map();

  function ensureMonth(monthName) {
    if (!monthMap.has(monthName)) {
      monthMap.set(monthName, {
        monthName,
        totalMontant: 0,
        versements: [],
        memberIds: new Set()
      });
    }
    return monthMap.get(monthName);
  }

  // Initialiser au moins Octobre 2026 et Novembre 2026
  const today = new Date();
  const startDate = new Date(cfg.dateDebutCotisations || '2026-10-04');
  const startYear = isNaN(startDate.getFullYear()) ? 2026 : startDate.getFullYear();
  const startMonth = isNaN(startDate.getMonth()) ? 9 : startDate.getMonth();
  const curYear = today.getFullYear();
  const curMonth = today.getMonth();

  const diffMonths = (curYear - startYear) * 12 + (curMonth - startMonth);
  for (let i = 0; i <= Math.max(diffMonths, 1); i++) {
    const mIdx = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    ensureMonth(`${monthNamesFr[mIdx]} ${y}`);
  }

  // Traiter chaque cotisation
  regularCots.forEach(c => {
    const p = (c.periode || '').trim();
    const cleanMonth = p.replace(/\s*\(\d+\s*mois.*?\)/i, '').trim() || 'Non défini';
    const mObj = ensureMonth(cleanMonth);
    mObj.totalMontant += Number(c.montant) || 0;
    mObj.versements.push(c);
    const mId = c.memberId || c.member_id;
    if (mId) mObj.memberIds.add(mId);
  });

  const totalMembers = members.length;
  const months = [];

  monthMap.forEach((obj, monthName) => {
    const nbPaid = obj.memberIds.size;
    const nbLate = Math.max(0, totalMembers - nbPaid);
    const rate = totalMembers > 0 ? Math.round((nbPaid / totalMembers) * 100) : 0;

    const paidMembers = members.filter(m => obj.memberIds.has(m.id));
    const lateMembers = members.filter(m => !obj.memberIds.has(m.id));

    months.push({
      monthName,
      totalMontant: obj.totalMontant,
      versements: obj.versements,
      nbPaid,
      nbLate,
      rate,
      totalMembers,
      paidMembers,
      lateMembers
    });
  });

  // Tri chronologique
  months.sort((a, b) => {
    const parseM = (str) => {
      const parts = str.split(' ');
      const mIdx = monthNamesFr.indexOf(parts[0]);
      const y = parseInt(parts[1], 10) || 2026;
      return y * 12 + (mIdx >= 0 ? mIdx : 0);
    };
    return parseM(a.monthName) - parseM(b.monthName);
  });

  return {
    months,
    totalMembers,
    totalCotisationsGlobal: regularCots.reduce((sum, c) => sum + (Number(c.montant) || 0), 0),
    currency
  };
}

function renderCotisationsRecapMois() {
  const breakdown = getMonthlyCotisationsBreakdown();
  const kpiGrid = document.getElementById('recapMoisKpiCardsGrid');
  const tbody = document.getElementById('recapMoisSummaryTableBody');
  const summaryText = document.getElementById('recapMoisTableSummary');
  if (!tbody) return;

  if (!currentSelectedRecapMonth && breakdown.months.length > 0) {
    const hasOct = breakdown.months.find(m => m.monthName.includes('Octobre'));
    currentSelectedRecapMonth = hasOct ? hasOct.monthName : breakdown.months[0].monthName;
  }

  if (summaryText) {
    summaryText.textContent = `${breakdown.months.length} mois répertoriés • Total : ${formatMoney(breakdown.totalCotisationsGlobal, breakdown.currency)}`;
  }

  // 1. Rendu des Cartes KPI Mensuelles
  if (kpiGrid) {
    kpiGrid.innerHTML = breakdown.months.map(m => {
      const isSelected = m.monthName === currentSelectedRecapMonth;
      const cardBorder = isSelected ? 'border: 2px solid var(--emerald-400); transform: translateY(-2px);' : 'border-left: 3px solid var(--emerald-500);';
      const bg = isSelected ? 'background: rgba(16, 185, 129, 0.12);' : '';
      return `
        <div class="kpi-card" style="cursor: pointer; ${cardBorder} ${bg} transition: all 0.2s;" onclick="selectRecapMonth('${m.monthName}')" title="Cliquer pour afficher les détails du mois ${m.monthName}">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span class="kpi-title" style="font-weight: 700; color: ${isSelected ? 'var(--emerald-400)' : 'var(--text-main)'};">📅 ${m.monthName}</span>
            <span class="badge ${m.rate >= 80 ? 'badge-success' : m.rate >= 40 ? 'badge-warning' : 'badge-danger'}" style="font-size: 10px;">${m.rate}%</span>
          </div>
          <div class="kpi-value" style="font-size: 20px; color: var(--emerald-400);">${formatMoney(m.totalMontant, breakdown.currency)}</div>
          <div class="kpi-sub" style="margin-top: 4px;">
            <strong style="color: var(--text-main);">${m.nbPaid}</strong> cotisant(s) sur ${breakdown.totalMembers}
          </div>
          <div style="width: 100%; background: rgba(255,255,255,0.08); height: 4px; border-radius: 2px; margin-top: 8px; overflow: hidden;">
            <div style="background: ${m.rate >= 80 ? 'var(--emerald-400)' : m.rate >= 40 ? '#f59e0b' : '#ef4444'}; height: 100%; width: ${Math.min(100, m.rate)}%;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 2. Rendu du Tableau Synthétique des Mois
  tbody.innerHTML = breakdown.months.map(m => {
    const isSelected = m.monthName === currentSelectedRecapMonth;
    const rowBg = isSelected ? 'background: rgba(16, 185, 129, 0.08);' : '';
    let statutBadge = '';
    if (m.rate >= 80) statutBadge = '<span class="badge badge-success">✅ Fort Recouvrement</span>';
    else if (m.rate >= 40) statutBadge = '<span class="badge badge-warning">⚡ En Cours</span>';
    else if (m.nbPaid > 0) statutBadge = '<span class="badge badge-purple">🚀 Anticipation</span>';
    else statutBadge = '<span class="badge badge-danger">⚠️ À Recouvrer</span>';

    return `
      <tr style="${rowBg}">
        <td>
          <div style="font-weight: 700; font-size: 14px; color: ${isSelected ? 'var(--emerald-400)' : 'var(--text-main)'}; display: flex; align-items: center; gap: 6px;">
            <span>📅</span> ${m.monthName}
            ${isSelected ? '<span class="badge badge-info" style="font-size: 9px;">Sélectionné</span>' : ''}
          </div>
        </td>
        <td><strong style="color: var(--emerald-400); font-size: 15px;">${formatMoney(m.totalMontant, breakdown.currency)}</strong></td>
        <td>
          <strong style="color: #34d399;">${m.nbPaid} membre(s)</strong>
          <span style="font-size: 11px; color: var(--text-muted);"> (${m.versements.length} versement(s))</span>
        </td>
        <td>
          <span style="color: ${m.nbLate > 0 ? 'var(--rose-400)' : 'var(--text-muted)'}; font-weight: ${m.nbLate > 0 ? '600' : 'normal'};">
            ${m.nbLate > 0 ? `${m.nbLate} en attente` : 'Aucun retard'}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; background: rgba(255,255,255,0.08); height: 6px; border-radius: 3px; min-width: 60px; overflow: hidden;">
              <div style="background: ${m.rate >= 80 ? 'var(--emerald-400)' : m.rate >= 40 ? '#f59e0b' : '#ef4444'}; height: 100%; width: ${Math.min(100, m.rate)}%;"></div>
            </div>
            <span style="font-size: 12px; font-weight: 600;">${m.rate}%</span>
          </div>
        </td>
        <td>${statutBadge}</td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-xs ${isSelected ? 'btn-primary' : 'btn-secondary'}" onclick="selectRecapMonth('${m.monthName}')" title="Voir la liste détaillée des membres">
              👁️ Détails
            </button>
            <button class="btn btn-xs btn-secondary" onclick="printSelectedMonthReport('${m.monthName}')" title="Imprimer la fiche de ce mois">
              🖨️ Imprimer
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // 3. Rendu du Tableau Détail du Mois Sélectionné
  renderRecapMoisDetailTable();

  // 4. Mettre à jour le sélecteur dans le Registre Général
  populateCotisRegistreMonthFilter(breakdown.months);
}

function selectRecapMonth(monthName) {
  currentSelectedRecapMonth = monthName;
  renderCotisationsRecapMois();
  const panel = document.getElementById('recapMoisDetailPanel');
  if (panel) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function setRecapMoisDetailViewMode(mode) {
  currentRecapMoisDetailMode = mode;
  const btnPaid = document.getElementById('btnFilterMoisPaid');
  const btnLate = document.getElementById('btnFilterMoisLate');
  if (btnPaid) btnPaid.classList.toggle('active', mode === 'paid');
  if (btnLate) btnLate.classList.toggle('active', mode === 'late');
  renderRecapMoisDetailTable();
}

function renderRecapMoisDetailTable() {
  const breakdown = getMonthlyCotisationsBreakdown();
  const data = TAGBA_DB.get();
  const currentMonth = breakdown.months.find(m => m.monthName === currentSelectedRecapMonth) || breakdown.months[0];
  if (!currentMonth) return;

  const titleEl = document.getElementById('recapMoisDetailTitle');
  const subtitleEl = document.getElementById('recapMoisDetailSubtitle');
  const countPaidEl = document.getElementById('recapMoisPaidCount');
  const countLateEl = document.getElementById('recapMoisLateCount');
  const thead = document.getElementById('recapMoisDetailThead');
  const tbody = document.getElementById('recapMoisDetailTbody');
  const query = (document.getElementById('searchRecapMoisDetailInput')?.value || '').trim().toLowerCase();

  if (titleEl) {
    titleEl.innerHTML = `<span>📋</span> Versements du mois de <strong style="color: var(--emerald-400);">${currentMonth.monthName}</strong>`;
  }
  if (subtitleEl) {
    subtitleEl.innerHTML = `Total collecté : <strong style="color: var(--emerald-400);">${formatMoney(currentMonth.totalMontant, breakdown.currency)}</strong> auprès de <strong>${currentMonth.nbPaid} membre(s)</strong> (${currentMonth.rate}% de recouvrement)`;
  }
  if (countPaidEl) countPaidEl.textContent = currentMonth.nbPaid;
  if (countLateEl) countLateEl.textContent = currentMonth.nbLate;

  if (!tbody || !thead) return;

  if (currentRecapMoisDetailMode === 'paid') {
    thead.innerHTML = `
      <tr>
        <th>N° Reçu</th>
        <th>Membre</th>
        <th>Foyer / Famille</th>
        <th>Montant Versé</th>
        <th>Date Paiement</th>
        <th>Mode</th>
        <th style="text-align: right;">Action</th>
      </tr>
    `;

    let filteredCots = currentMonth.versements;
    if (query) {
      filteredCots = filteredCots.filter(c => {
        const nom = (c.memberName || '').toLowerCase();
        const recu = (c.recuNum || '').toLowerCase();
        return nom.includes(query) || recu.includes(query);
      });
    }

    if (filteredCots.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
            ${query ? `Aucun versement ne correspond à "${query}".` : `Aucun versement enregistré pour le mois de ${currentMonth.monthName}.`}
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filteredCots.map(c => {
        const mem = data.members.find(m =>
          (c.memberId && m.id === c.memberId) ||
          (c.member_id && m.id === c.member_id) ||
          (c.matricule && m.matricule === c.matricule) ||
          (c.memberName && m.fullName && m.fullName.trim().toLowerCase() === c.memberName.trim().toLowerCase())
        );
        const fam = mem ? data.families.find(f => f.id === mem.familyId) : null;
        const memMat = mem ? mem.matricule : (c.matricule || '');
        const memTel = mem && mem.phone ? (mem.phone + (mem.phone2 ? ' / ' + mem.phone2 : '')) : (c.phone || '');
        return `
          <tr>
            <td><strong style="color: var(--emerald-400);">${c.recuNum}</strong></td>
            <td>
              <strong style="color: var(--text-main);">${c.memberName}</strong>
              ${memMat ? `<span style="font-size: 11px; color: var(--emerald-400); font-weight: 700; margin-left: 4px;">(${memMat})</span>` : ''}
              ${memTel ? `<div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">📞 ${memTel}</div>` : ''}
            </td>
            <td>
              <span style="color: var(--gold-400); font-weight: 500;">${fam ? fam.name : (c.payeurChef ? `👑 Foyer ${c.payeurChef}` : '-')}</span>
            </td>
            <td><strong style="color: var(--emerald-400); font-size: 14px;">${formatMoney(c.montant, breakdown.currency)}</strong></td>
            <td style="color: var(--text-dim);">${c.datePaiement || '-'}</td>
            <td><span class="badge badge-purple" style="font-size: 10px;">${c.modePaiement || 'Wave'}</span></td>
            <td style="text-align: right;">
              <button class="btn btn-xs btn-secondary" onclick="openReceiptModal('${c.id}')" title="Voir le reçu officiel">🖨️ Reçu</button>
            </td>
          </tr>
        `;
      }).join('');
    }

  } else {
    thead.innerHTML = `
      <tr>
        <th>Matricule</th>
        <th>Membre en Retard</th>
        <th>Foyer / Famille</th>
        <th>Téléphone</th>
        <th>Montant Échu</th>
        <th>Statut</th>
        <th style="text-align: right;">Action</th>
      </tr>
    `;

    let filteredMembers = currentMonth.lateMembers;
    if (query) {
      filteredMembers = filteredMembers.filter(m => {
        const nom = (m.fullName || '').toLowerCase();
        const mat = (m.matricule || '').toLowerCase();
        const tel = (m.phone || '').toLowerCase();
        return nom.includes(query) || mat.includes(query) || tel.includes(query);
      });
    }

    if (filteredMembers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--emerald-400); font-weight: 600;">
            🎉 Félicitations ! Aucun membre n'est en retard pour le mois de ${currentMonth.monthName}.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filteredMembers.map(m => {
        const fam = data.families.find(f => f.id === m.familyId);
        return `
          <tr>
            <td><strong style="color: var(--emerald-400);">${m.matricule}</strong></td>
            <td><strong style="color: var(--text-main);">${m.fullName}</strong></td>
            <td><span style="color: var(--gold-400);">${fam ? fam.name : '-'}</span></td>
            <td style="color: var(--text-muted);">${m.phone || '-'}</td>
            <td><strong style="color: var(--rose-400);">${formatMoney(500, breakdown.currency)}</strong></td>
            <td><span class="badge badge-danger">Non réglé</span></td>
            <td style="text-align: right;">
              <button class="btn btn-xs btn-primary" onclick="quickPayMember('${m.id}')" title="Encaisser la cotisation de ce membre">💳 Encaisser</button>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

function filterRecapMoisDetailTable() {
  renderRecapMoisDetailTable();
}

function populateCotisRegistreMonthFilter(months) {
  const select = document.getElementById('filterCotisRegistreMonthSelect');
  if (!select) return;
  const currentVal = select.value;
  select.innerHTML = '<option value="ALL">📅 Tous les mois (Global)</option>' +
    months.map(m => `<option value="${m.monthName}">📅 ${m.monthName} (${formatMoney(m.totalMontant, 'FCFA')} - ${m.nbPaid} payeurs)</option>`).join('');
  if (currentVal && Array.from(select.options).some(o => o.value === currentVal)) {
    select.value = currentVal;
  }
}

function filterCotisationsRegistreTable() {
  const data = TAGBA_DB.get();
  const tbody = document.getElementById('cotisationsTableBody');
  const summaryEl = document.getElementById('cotisRegistreFilterSummary');
  const selectMonth = document.getElementById('filterCotisRegistreMonthSelect')?.value || 'ALL';
  const query = (document.getElementById('searchCotisRegistreInput')?.value || '').trim().toLowerCase();
  if (!tbody) return;

  let list = data.cotisations || [];

  if (selectMonth !== 'ALL') {
    list = list.filter(c => {
      const p = (c.periode || '').toLowerCase();
      return p.includes(selectMonth.toLowerCase());
    });
  }

  if (query) {
    list = list.filter(c => {
      const name = (c.memberName || '').toLowerCase();
      const recu = (c.recuNum || '').toLowerCase();
      const chef = (c.payeurChef || '').toLowerCase();
      return name.includes(query) || recu.includes(query) || chef.includes(query);
    });
  }

  const totalFiltered = list.reduce((sum, c) => sum + (Number(c.montant) || 0), 0);
  if (summaryEl) {
    summaryEl.textContent = `${list.length} reçu(s) • Total : ${formatMoney(totalFiltered, data.config.currency)}`;
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 28px; color: var(--text-muted);">
          Aucun versement ne correspond aux critères sélectionnés.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(cot => `
    <tr>
      <td><strong style="color: var(--emerald-400);">${cot.recuNum}</strong></td>
      <td>
        <div style="font-weight: 600;">${cot.memberName} ${cot.payeurChef ? `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--gold-400); font-size: 10px; margin-left: 4px; border: 1px solid rgba(245, 158, 11, 0.3);">👑 Foyer ${cot.payeurChef}</span>` : ''}</div>
        <div style="font-size: 11px; color: var(--text-muted);">Encaissé par: ${cot.agent || 'Bureau'}</div>
      </td>
      <td><span class="badge badge-info">${cot.type}</span></td>
      <td>${cot.periode}</td>
      <td><strong style="font-size: 14px;">${formatMoney(cot.montant, data.config.currency)}</strong></td>
      <td><span class="badge badge-purple">${cot.modePaiement}</span></td>
      <td>${cot.datePaiement}</td>
      <td>
        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
          <button class="btn btn-sm btn-secondary" onclick="openReceiptModal('${cot.id}')" title="Imprimer le Reçu Officiel">🖨️ Reçu</button>
          <button class="btn btn-sm btn-outline" style="border: 1px solid var(--border-color); padding: 5px 8px;" onclick="openEditCotisationModal('${cot.id}')" title="Modifier ce versement">✏️</button>
          <button class="btn btn-sm btn-danger" style="padding: 5px 8px;" onclick="deleteCotisationPrompt('${cot.id}', '${cot.recuNum}', '${(cot.memberName || '').replace(/'/g, "\\'")}', ${cot.montant})" title="Supprimer ce versement en cas d'erreur">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 4.B. Rendu de l'onglet Événements & Sacrifices (Séparé)
let currentEvtSubTab = 'cotis';
function switchEvtSubTab(subTab) {
  currentEvtSubTab = subTab;
  const btnCotis = document.getElementById('btnEvtSubTabCotis');
  const btnCerem = document.getElementById('btnEvtSubTabCeremonies');
  const viewCotis = document.getElementById('cotisationsEventsTrackingView');
  const viewCerem = document.getElementById('evenementsCeremoniesContainer');

  if (btnCotis) btnCotis.classList.toggle('active', subTab === 'cotis');
  if (btnCerem) btnCerem.classList.toggle('active', subTab === 'ceremonies');

  if (viewCotis) viewCotis.style.display = subTab === 'cotis' ? 'block' : 'none';
  if (viewCerem) viewCerem.style.display = subTab === 'ceremonies' ? 'block' : 'none';

  if (subTab === 'cotis') {
    renderCotisationsEventsTracking();
  } else {
    renderCeremonies();
  }
}
window.switchEvtSubTab = switchEvtSubTab;

// 4.1. Moteur d'Audit Chronologique des Cotisations par Membre (Depuis le 04/10/2026)
function getMemberCotisationAudit(memberId, refDateStr = null) {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const member = data.members.find(m => m.id === memberId);
  if (!member) return null;

  const unitMonthly = Number(cfg.cotisationMensuelle || 500);
  const dateDebutStr = cfg.dateDebutCotisations || '2026-10-04';

  // Date de référence (par défaut aujourd'hui ou date imposée)
  const today = refDateStr ? new Date(refDateStr) : new Date();

  // Date officielle de départ (04/10/2026)
  const parts = dateDebutStr.split('-');
  const startYear = parseInt(parts[0], 10) || 2026;
  const startMonth = parseInt(parts[1], 10) || 10; // 1-indexed (10 = Octobre)
  const startDay = parseInt(parts[2], 10) || 4;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed
  const currentDay = today.getDate();

  // Nombre de mois échus depuis la date de démarrage (au 04 de chaque mois)
  let monthsDueCount = 0;
  const diffMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);
  if (diffMonths > 0) {
    monthsDueCount = diffMonths + (currentDay >= startDay ? 1 : 0);
  } else if (diffMonths === 0) {
    monthsDueCount = currentDay >= startDay ? 1 : 0;
  } else {
    monthsDueCount = 0;
  }
  // Au minimum 1 mois échu si la date de démarrage est atteinte ou passée
  if (monthsDueCount === 0 && today >= new Date(dateDebutStr)) {
    monthsDueCount = 1;
  }

  // Somme totale des versements validés de ce membre
  const memberCotisations = (data.cotisations || []).filter(c => c.memberId === memberId && c.statut !== 'Annulé');
  const totalVerse = memberCotisations.reduce((sum, c) => sum + Number(c.montant || 0), 0);

  const monthsPaidCount = Math.floor(totalVerse / unitMonthly);
  const reliquatVerse = totalVerse % unitMonthly;

  const monthsLateCount = Math.max(0, monthsDueCount - monthsPaidCount);
  const monthsAdvanceCount = Math.max(0, monthsPaidCount - monthsDueCount);
  const arrieresMontant = monthsLateCount * unitMonthly;

  let statutKey = 'A_JOUR';
  let statutLabel = '✅ À jour';
  let badgeClass = 'badge-ontime';

  if (monthsLateCount > 0) {
    statutKey = 'EN_RETARD';
    statutLabel = `⚠️ En retard (${monthsLateCount} mois)`;
    badgeClass = 'badge-late';
  } else if (monthsAdvanceCount > 0) {
    statutKey = 'EN_AVANCE';
    statutLabel = `🚀 En avance (+${monthsAdvanceCount} mois)`;
    badgeClass = 'badge-advance';
  }

  const MONTH_NAMES = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const SHORT_MONTH_NAMES = [
    'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ];

  // Générer la timeline chronologique sur au moins 36 mois ou plus si anticipation
  const totalMonthsToGenerate = Math.max(36, monthsPaidCount + 24);
  const timeline = [];
  const paidMonthsLabels = [];
  const advanceMonthsLabels = [];
  const lateMonthsLabels = [];

  for (let i = 0; i < totalMonthsToGenerate; i++) {
    const totalMonthIndex = (startMonth - 1) + i;
    const year = startYear + Math.floor(totalMonthIndex / 12);
    const monthIndex = totalMonthIndex % 12; // 0-indexed
    const monthNum = monthIndex + 1;
    const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
    const fullLabel = `${MONTH_NAMES[monthIndex]} ${year}`;
    const shortLabel = `${SHORT_MONTH_NAMES[monthIndex]} ${year}`;
    const dueDateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;

    const isDue = (i < monthsDueCount);
    const isPaid = (i < monthsPaidCount);
    const isAdvance = (isPaid && !isDue);
    const isLate = (!isPaid && isDue);
    const isUpcoming = (!isPaid && !isDue);

    let statusType = 'upcoming';
    let statusText = 'À échoir (Anticipable)';

    if (isAdvance) {
      statusType = 'advance';
      statusText = '🚀 Payé d\'avance (Anticipé)';
      advanceMonthsLabels.push(shortLabel);
      paidMonthsLabels.push(shortLabel);
    } else if (isPaid) {
      statusType = 'paid';
      statusText = '✅ Réglé';
      paidMonthsLabels.push(shortLabel);
    } else if (isLate) {
      statusType = 'late';
      statusText = '⚠️ En retard (Arriéré dû)';
      lateMonthsLabels.push(shortLabel);
    }

    timeline.push({
      index: i,
      monthKey,
      year,
      monthNum,
      fullLabel,
      shortLabel,
      dueDateStr,
      amount: unitMonthly,
      isDue,
      isPaid,
      isAdvance,
      isLate,
      isUpcoming,
      statusType,
      statusText
    });
  }

  const dernierMoisPaye = monthsPaidCount > 0 ? timeline[monthsPaidCount - 1]?.fullLabel : 'Aucun';
  const prochainMoisDu = timeline[monthsPaidCount]?.fullLabel || 'Mois à venir';

  return {
    member,
    unitMonthly,
    currency: cfg.currency || 'FCFA',
    dateDebutCotisations: dateDebutStr,
    totalVerse,
    reliquatVerse,
    monthsPaidCount,
    monthsDueCount,
    monthsLateCount,
    monthsAdvanceCount,
    arrieresMontant,
    statutKey,
    statutLabel,
    badgeClass,
    dernierMoisPaye,
    prochainMoisDu,
    paidMonthsLabels,
    advanceMonthsLabels,
    lateMonthsLabels,
    timeline,
    cotisationsCount: memberCotisations.length
  };
}

// 4.2. Rendu de la vue Tableau de Suivi des Mois (Payés, Retards & Anticipations)
function renderCotisationsMonthsTracking() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const tbody = document.getElementById('cotisationsMonthsTrackingTableBody');
  const countDisplay = document.getElementById('monthsTrackingTableCount');
  if (!tbody) return;

  const dateDebutBadge = document.getElementById('badgeDateDebutCotis');
  if (dateDebutBadge) {
    dateDebutBadge.textContent = cfg.dateDebutCotisations || '04/10/2026';
  }

  const mensuelBadge = document.getElementById('cfgDisplayMensuelBadge');
  if (mensuelBadge) {
    mensuelBadge.textContent = `${formatMoney(cfg.cotisationMensuelle || 500, cfg.currency)} / mois`;
  }

  // Auditer l'ensemble des membres
  const audits = data.members.map(m => {
    const audit = getMemberCotisationAudit(m.id);
    const fam = data.families.find(f => f.id === m.familyId);
    return { ...audit, family: fam };
  });

  // Calcul des statistiques globales
  const totalAJourOrAdvance = audits.filter(a => a.monthsLateCount === 0).length;
  const totalLate = audits.filter(a => a.monthsLateCount > 0).length;
  const totalArrieres = audits.reduce((sum, a) => sum + a.arrieresMontant, 0);
  const totalMoisAnticipes = audits.reduce((sum, a) => sum + a.monthsAdvanceCount, 0);

  const kpiAJour = document.getElementById('kpiMoisAJourCount');
  const kpiLate = document.getElementById('kpiMoisRetardCount');
  const kpiArrieres = document.getElementById('kpiTotalArrieres');
  const kpiAnticipes = document.getElementById('kpiTotalMoisAnticipes');

  if (kpiAJour) kpiAJour.textContent = `${totalAJourOrAdvance} membre(s)`;
  if (kpiLate) kpiLate.textContent = `${totalLate} membre(s)`;
  if (kpiArrieres) kpiArrieres.textContent = formatMoney(totalArrieres, cfg.currency);
  if (kpiAnticipes) kpiAnticipes.textContent = `+${totalMoisAnticipes} mois`;

  // Filtrage
  const searchInput = document.getElementById('searchMonthsTrackingInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let filtered = audits.filter(a => {
    if (currentMonthsTrackingFilter === 'EN_AVANCE' && a.monthsAdvanceCount === 0) return false;
    if (currentMonthsTrackingFilter === 'A_JOUR' && (a.statutKey !== 'A_JOUR' && a.statutKey !== 'EN_AVANCE')) return false;
    if (currentMonthsTrackingFilter === 'EN_RETARD' && a.monthsLateCount === 0) return false;

    // Filtre par nombre spÃ©cifique de mois de retard
    if (currentMonthsLateFilter && currentMonthsLateFilter !== 'ALL') {
      if (currentMonthsLateFilter === '4+') {
        if (a.monthsLateCount < 4) return false;
      } else {
        const targetMonths = parseInt(currentMonthsLateFilter, 10);
        if (a.monthsLateCount !== targetMonths) return false;
      }
    }

    if (query) {
      const matchName = a.member.fullName.toLowerCase().includes(query);
      const matchMatricule = a.member.matricule.toLowerCase().includes(query);
      const matchFam = a.family && a.family.name.toLowerCase().includes(query);
      const matchPhone = (a.member.phone || '').includes(query) || (a.member.phone2 || '').includes(query);
      return matchName || matchMatricule || matchFam || matchPhone;
    }
    return true;
  });

  filtered = [...filtered].sort((a,b) => (a.member.fullName || '').localeCompare(b.member.fullName || '', 'fr', { sensitivity: 'base' }));

  if (countDisplay) {
    countDisplay.textContent = `${filtered.length} sur ${data.members.length} membre(s)`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
          🔍 Aucun membre ne correspond aux critères de recherche sélectionnés.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(a => {
    const mem = a.member;
    const fam = a.family;

    // Badges des mois réglés
    let paidBadgesHtml = '';
    if (a.paidMonthsLabels.length === 0) {
      paidBadgesHtml = '<span style="font-size: 11px; color: var(--text-dim); font-style: italic;">Aucun versement</span>';
    } else {
      paidBadgesHtml = a.paidMonthsLabels.slice(0, 4).map(label => {
        const isAdvance = a.advanceMonthsLabels.includes(label);
        return `<span class="month-tag-pill ${isAdvance ? 'month-tag-advance' : 'month-tag-paid'}">
          ${isAdvance ? '🚀' : '✅'} ${label}
        </span>`;
      }).join('');
      if (a.paidMonthsLabels.length > 4) {
        paidBadgesHtml += `<span class="month-tag-pill month-tag-paid">+${a.paidMonthsLabels.length - 4} autre(s)</span>`;
      }
    }

    // Badges des mois en retard
    let lateBadgesHtml = '';
    if (a.monthsLateCount === 0) {
      lateBadgesHtml = '<span class="badge badge-success" style="font-size: 11px;">✅ Aucun retard</span>';
    } else {
      lateBadgesHtml = `
        <div style="display: flex; flex-direction: column; gap: 3px;">
          <div>
            ${a.lateMonthsLabels.slice(0, 3).map(l => `<span class="month-tag-pill month-tag-late">⚠️ ${l}</span>`).join('')}
            ${a.lateMonthsLabels.length > 3 ? `<span class="month-tag-pill month-tag-late">+${a.lateMonthsLabels.length - 3}</span>` : ''}
          </div>
          <span style="font-size: 11px; color: var(--rose-400); font-weight: 700;">
            Arriéré : -${formatMoney(a.arrieresMontant, a.currency)}
          </span>
        </div>
      `;
    }

    return `
      <tr>
        <td>
          <div style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <a href="javascript:void(0)" onclick="openMemberMonthsAuditModal('${mem.id}')" style="color: var(--text-main); text-decoration: none;">
              ${mem.fullName}
            </a>
            ${mem.bureauRole ? `<span class="badge badge-purple" style="font-size: 9px;">${mem.bureauRole}</span>` : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); display: flex; gap: 8px; margin-top: 2px;">
            <span>${mem.matricule}</span>
            <span>•</span>
            <span style="color: var(--gold-400);">👑 ${fam ? fam.name : 'Famille'}</span>
          </div>
        </td>
        <td>
          <strong style="font-size: 14px; color: var(--emerald-400);">${formatMoney(a.totalVerse, a.currency)}</strong>
          <div style="font-size: 11px; color: var(--text-dim);">${a.monthsPaidCount} mois couvert(s)</div>
        </td>
        <td style="max-width: 200px;">
          ${paidBadgesHtml}
        </td>
        <td style="max-width: 180px;">
          ${lateBadgesHtml}
        </td>
        <td>
          <span class="badge ${a.badgeClass}">
            ${a.statutLabel}
          </span>
        </td>
        <td>
          <div style="font-size: 12px; font-weight: 600; color: var(--text-main);">${a.prochainMoisDu}</div>
          <div style="font-size: 11px; color: var(--text-dim);">Dernier réglé : ${a.dernierMoisPaye}</div>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 6px;">
            <button class="btn btn-sm btn-secondary" onclick="openEditMemberModal('${mem.id}')" title="Modifier les informations du membre">
              ✏️
            </button>
            <button class="btn btn-sm btn-secondary" onclick="openMemberMonthsAuditModal('${mem.id}')" title="Voir l'audit chronologique mois par mois">
              🔍 Calendrier
            </button>
            <button class="btn btn-sm btn-primary" onclick="quickPayMember('${mem.id}')" title="Encaisser ou anticiper">
              💳 Payer / Anticiper
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Filtrage du tableau de suivi
function filterMonthsTrackingTable(filterStatus, lateFilter = null) {
  if (filterStatus !== undefined && filterStatus !== null) {
    currentMonthsTrackingFilter = filterStatus;
    window.currentMonthsTrackingFilter = filterStatus;
    const buttons = document.querySelectorAll('#filterMonthsStatusGroup .filter-pill-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-filter') === filterStatus) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  if (lateFilter !== null) {
    currentMonthsLateFilter = lateFilter;
    window.currentMonthsLateFilter = lateFilter;
    const sel = document.getElementById('filterMonthsLateSelect');
    if (sel) sel.value = lateFilter;
  }
  renderCotisationsMonthsTracking();
}

function onMonthsLateFilterChange() {
  const sel = document.getElementById('filterMonthsLateSelect');
  const val = sel ? sel.value : 'ALL';
  currentMonthsLateFilter = val;
  window.currentMonthsLateFilter = val;
  // Si l'utilisateur choisit un nombre de retard alors qu'il Ã©tait sur "Ã€ jour", basculer vers "En retard"
  if (val !== 'ALL' && currentMonthsTrackingFilter === 'A_JOUR') {
    filterMonthsTrackingTable('EN_RETARD', val);
    return;
  }
  renderCotisationsMonthsTracking();
}

// 4.3. Rendu Général des Cotisations (Tableau Reçus + Suivi des Mois)
function renderCotisations() {
  const data = TAGBA_DB.get();
  const tbody = document.getElementById('cotisationsTableBody');
  if (!tbody) return;

  const fin = TAGBA_DB.getCaisseFinances();
  const totalDisplay = document.getElementById('cotisationsSumDisplay');
  if (totalDisplay) totalDisplay.textContent = formatMoney(fin.totalCotisationsMensuelles, data.config.currency);

  if (!data.cotisations || data.cotisations.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">💳</div>
          <div style="font-weight: 600; margin-bottom: 4px;">Aucun versement enregistré pour le moment.</div>
          <div style="font-size: 12px; margin-bottom: 16px;">Les reçus et encaissements apparaîtront ici avec possibilité de les modifier ou supprimer en cas d'erreur.</div>
          <button class="btn btn-sm btn-primary" onclick="openModal('modalAddCotisation')">+ Encaisser un versement</button>
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = data.cotisations.map(cot => `
      <tr>
        <td><strong style="color: var(--emerald-400);">${cot.recuNum}</strong></td>
        <td>
          <div style="font-weight: 600;">${cot.memberName} ${cot.payeurChef ? `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: var(--gold-400); font-size: 10px; margin-left: 4px; border: 1px solid rgba(245, 158, 11, 0.3);">👑 Foyer ${cot.payeurChef}</span>` : ''}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Encaissé par: ${cot.agent || 'Bureau'}</div>
        </td>
        <td><span class="badge badge-info">${cot.type}</span></td>
        <td>${cot.periode}</td>
        <td><strong style="font-size: 14px;">${formatMoney(cot.montant, data.config.currency)}</strong></td>
        <td><span class="badge badge-purple">${cot.modePaiement}</span></td>
        <td>${cot.datePaiement}</td>
        <td>
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
            <button class="btn btn-sm btn-secondary" onclick="openReceiptModal('${cot.id}')" title="Imprimer le Reçu Officiel">🖨️ Reçu</button>
            <button class="btn btn-sm btn-outline" style="border: 1px solid var(--border-color); padding: 5px 8px;" onclick="openEditCotisationModal('${cot.id}')" title="Modifier ce versement">✏️</button>
            <button class="btn btn-sm btn-danger" style="padding: 5px 8px;" onclick="deleteCotisationPrompt('${cot.id}', '${cot.recuNum}', '${(cot.memberName || '').replace(/'/g, "\\'")}', ${cot.montant})" title="Supprimer ce versement en cas d'erreur">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  renderCotisationsRecapMois();
  // Rendu de la vue de suivi des mois chronologique
  renderCotisationsMonthsTracking();
  renderCotisationsEventsTracking();
}

// 5. Rendu Entraide & Cas Sociaux
function renderEntraide() {
  const data = TAGBA_DB.get();

  // Mise à jour des cartes KPI d'Aides & Entraide
  const decaisses = (data.entraide || []).filter(c => c.statut === 'Accordé & Décaissé');
  const totalDecaisse = decaisses.reduce((sum, c) => sum + Number(c.montantAlloue || 0), 0);
  const donsEntraide = (data.contributionsVolontaires || []).filter(d =>
    d.cibleType === 'Entraide' || (d.cibleTitre && d.cibleTitre.toLowerCase().includes('entraide'))
  );
  const totalDonsEntraide = donsEntraide.reduce((sum, d) => sum + Number(d.montant || 0), 0);

  const kpiDecaisseEl = document.getElementById('kpiEntraideTotalDecaisse');
  const kpiDecaisseSubEl = document.getElementById('kpiEntraideDecaisseCount');
  const kpiDonsEl = document.getElementById('kpiEntraideTotalDons');
  const kpiDonsCountEl = document.getElementById('kpiEntraideDonsCount');
  const kpiTotalCasEl = document.getElementById('kpiEntraideTotalCas');
  const kpiEnAttenteEl = document.getElementById('kpiEntraideEnAttenteSub');

  if (kpiDecaisseEl) kpiDecaisseEl.textContent = formatMoney(totalDecaisse, data.config.currency);
  if (kpiDecaisseSubEl) kpiDecaisseSubEl.textContent = `${decaisses.length} dossier(s) secouru(s)`;
  if (kpiDonsEl) kpiDonsEl.textContent = formatMoney(totalDonsEntraide, data.config.currency);
  if (kpiDonsCountEl) kpiDonsCountEl.textContent = `${donsEntraide.length} don(s) solidaire(s)`;
  if (kpiTotalCasEl) kpiTotalCasEl.textContent = (data.entraide || []).length;
  const enCoursCount = (data.entraide || []).length - decaisses.length;
  if (kpiEnAttenteEl) kpiEnAttenteEl.textContent = enCoursCount > 0 ? `${enCoursCount} en cours d'examen` : 'Tous les dossiers sont décaissés';

  const aidesSumEl = document.getElementById('aidesSumDisplay');
  if (aidesSumEl) aidesSumEl.textContent = formatMoney(totalDecaisse, data.config.currency);

  const container = document.getElementById('entraideGrid');
  if (!container) return;

  if (data.entraide.length === 0) {
    container.innerHTML = `<div style="grid-column: span 12; text-align: center; padding: 40px; color: var(--text-muted);">Aucun dossier de solidarité enregistré.</div>`;
    return;
  }

  container.innerHTML = data.entraide.map(cas => {
    // Récupérer les dons volontaires des membres pour ce cas social
    const dons = (data.contributionsVolontaires || []).filter(d =>
      d.cibleId === cas.id || (d.cibleType === 'Entraide' && d.cibleTitre.includes(cas.memberName))
    );
    const totalDons = dons.reduce((sum, d) => sum + Number(d.montant || 0), 0);

    return `
      <div class="card-panel col-6" style="margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">${cas.reference}</span>
            <h3 style="font-size: 17px; margin-top: 2px;">${cas.nature}</h3>
          </div>
          <span class="badge ${cas.statut === 'Accordé & Décaissé' ? 'badge-success' : 'badge-warning'}">${cas.statut}</span>
        </div>

        <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 12px; margin-bottom: 12px;">
          <p style="font-size: 13px; color: var(--text-main); margin-bottom: 8px;"><strong>Membre concerné :</strong> ${cas.memberName}</p>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${cas.description}</p>
        </div>

        <!-- Section des Membres Donateurs Volontaires -->
        <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 12px; color: #a78bfa;">❤️ Dons Volontaires des Membres :</strong>
            <span style="font-size: 13px; font-weight: 800; color: #a78bfa;">${formatMoney(totalDons, data.config.currency)}</span>
          </div>
          ${dons.length === 0 ? `
            <div style="font-size: 11px; color: var(--text-dim); font-style: italic;">Aucun don individuel enregistré pour le moment.</div>
          ` : `
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
              ${dons.map(d => `
                <span class="badge" style="background: rgba(139,92,246,0.15); color: #c4b5fd; font-size: 10px; border: 1px solid rgba(139,92,246,0.3);">
                  ❤️ ${d.memberName} : ${formatMoney(d.montant, data.config.currency)}
                </span>
              `).join('')}
            </div>
          `}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
          <div>
            <div style="font-size: 11px; color: var(--text-muted);">Budget Aide Mutuelle :</div>
            <div style="font-size: 17px; font-weight: 800; color: var(--emerald-400);">${formatMoney(cas.montantAlloue, data.config.currency)}</div>
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="btn btn-sm btn-secondary" onclick="quickDonateToTarget('Entraide', '${cas.id}', '${cas.nature} - ${cas.memberName}')" title="Faire un don volontaire pour ce membre">
              ❤️ Faire un Don
            </button>
            ${cas.statut !== 'Accordé & Décaissé' ? `
              <button class="btn btn-sm btn-primary" onclick="accorderEntraide('${cas.id}')">✅ Valider & Décaisser</button>
            ` : `
              <span style="font-size: 11px; color: var(--emerald-400); align-self: center;">Résolu</span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 6. Rendu Cérémonies & Événements
function renderCeremonies() {
  const data = TAGBA_DB.get();
  const container = document.getElementById('ceremoniesGrid');
  if (!container) return;

  container.innerHTML = data.ceremonies.map(cer => {
    // Récupérer les dons volontaires des membres pour cette cérémonie
    const dons = (data.contributionsVolontaires || []).filter(d =>
      d.cibleId === cer.id || (d.cibleType === 'Cérémonie' && d.cibleTitre === cer.titre)
    );
    const totalDons = dons.reduce((sum, d) => sum + Number(d.montant || 0), 0);

    return `
      <div class="card-panel col-6" style="margin-bottom: 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
          <div>
            <span class="badge badge-purple" style="margin-bottom: 6px;">${cer.type}</span>
            <h3 style="font-size: 18px;">${cer.titre}</h3>
          </div>
          <span class="badge ${cer.statut === 'À venir' ? 'badge-warning' : 'badge-info'}">${cer.statut}</span>
        </div>

        <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px;">
          <div>📅 <strong>Date :</strong> ${cer.date}</div>
          <div>📍 <strong>Lieu :</strong> ${cer.lieu}</div>
          <div>👨‍👩‍👧‍👦 <strong>Organisateur :</strong> ${cer.organisateur}</div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 12px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 2px;">Délégation mandatée :</div>
          <div style="font-size: 12px; color: var(--text-main); font-weight: 500;">🏛️ ${cer.delegationBureau}</div>
        </div>

        <!-- Section des Membres Donateurs Volontaires -->
        <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); padding: 10px 12px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 12px; color: #a78bfa;">❤️ Dons Volontaires des Membres :</strong>
            <span style="font-size: 13px; font-weight: 800; color: #a78bfa;">${formatMoney(totalDons, data.config.currency)}</span>
          </div>
          ${dons.length === 0 ? `
            <div style="font-size: 11px; color: var(--text-dim); font-style: italic;">Aucune contribution volontaire enregistrée.</div>
          ` : `
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
              ${dons.map(d => `
                <span class="badge" style="background: rgba(139,92,246,0.15); color: #c4b5fd; font-size: 10px; border: 1px solid rgba(139,92,246,0.3);">
                  ❤️ ${d.memberName} : ${formatMoney(d.montant, data.config.currency)}
                </span>
              `).join('')}
            </div>
          `}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
          <div>
            <span style="font-size: 11px; color: var(--text-muted);">Enveloppe Caisse :</span>
            <strong style="display: block; font-size: 16px; color: var(--gold-400);">${formatMoney(cer.enveloppeSoutien, data.config.currency)}</strong>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-secondary" onclick="quickDonateToTarget('Cérémonie', '${cer.id}', '${cer.titre}')" title="Donner volontairement">
              ❤️ Contribuer
            </button>
            <button class="btn btn-sm btn-secondary" onclick="alert('Détails pour: ' + '${cer.titre}')">📋 Détails</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 7. Reçu Imprimable
let currentViewedReceiptCotId = null;

function openReceiptModal(cotisationId) {
  currentViewedReceiptCotId = cotisationId;
  const data = TAGBA_DB.get();
  const cot = data.cotisations.find(c => c.id === cotisationId);
  if (!cot) return;

  const mem = data.members.find(m =>
    (cot.memberId && m.id === cot.memberId) ||
    (cot.member_id && m.id === cot.member_id) ||
    (cot.matricule && m.matricule === cot.matricule) ||
    (cot.memberName && m.fullName && m.fullName.trim().toLowerCase() === cot.memberName.trim().toLowerCase())
  );
  const fam = data.families.find(f => f.id === (cot.familyId || (mem ? mem.familyId : '')));

  const container = document.getElementById('receiptContent');
  if (!container) return;

  const memMatricule = mem ? mem.matricule : (cot.matricule || 'N/A');
  const memPhone = mem && mem.phone ? (mem.phone + (mem.phone2 ? ' / ' + mem.phone2 : '')) : (cot.phone || 'Non renseigné');

  container.innerHTML = `
    <div class="receipt-paper">
      <div class="receipt-header">
        <h2>${data.config.assocName}</h2>
        <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">${data.config.tagline}</p>
        <p style="font-size: 12px; color: #047857; margin-top: 4px;">REÇU OFFICIEL DE VERSEMENT DE COTISATION</p>
      </div>

      <div class="receipt-meta">
        <div>
          <p><strong>N° Reçu :</strong> ${cot.recuNum}</p>
          <p><strong>Date d'émission :</strong> ${cot.datePaiement}</p>
          <p><strong>Période couverte :</strong> ${cot.periode}</p>
          <p><strong>Type :</strong> Cotisation ${cot.type}</p>
        </div>
        <div>
          <p><strong>Membre cotisant :</strong> ${cot.memberName}</p>
          <p><strong>N° Membre (Matricule) :</strong> <strong style="color: #047857;">${memMatricule}</strong></p>
          <p><strong>N° Téléphone :</strong> ${memPhone}</p>
          <p><strong>Famille :</strong> ${fam ? fam.name : 'N/A'}</p>
          <p><strong>Chef de famille :</strong> ${fam ? fam.chefDeFamille : 'N/A'}</p>
        </div>
      </div>

      <div class="receipt-amount-box">
        <span style="font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: 700;">Montant Encaissé</span>
        <h3>${formatMoney(cot.montant, data.config.currency)}</h3>
        <p style="font-size: 12px; color: #4b5569; margin-top: 4px;">Mode de règlement : <strong>${cot.modePaiement}</strong></p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px;">
        <div style="text-align: center;">
          <p style="font-weight: 600; margin-bottom: 30px;">Le Membre Cotisant</p>
          <p style="color: #9ca3af; font-style: italic;">(Émargement)</p>
        </div>
        <div style="text-align: center;">
          <p style="font-weight: 600; margin-bottom: 30px;">Pour le Bureau Exécutif (Trésorerie)</p>
          <p style="color: #047857; font-weight: 600;">${cot.agent || 'Seydou Coulibaly (Trésorier Général)'}</p>
        </div>
      </div>
    </div>
  `;

  openModal('modalReceipt');
}

// Actions rapides
function quickPayMember(memberId) {
  if (!assertPermission('write', 'l’encaissement rapide')) return;
  openModal('modalAddCotisation');
  setVersementFormMode('individual', false);
  const select = document.getElementById('cotMemberSelect');
  if (select) {
    select.value = memberId;
    currentAnticipationSelectedMonths = 1;
    onCotMemberSelected();
  }
}

function deleteMemberConfirm(memberId) {
  if (!assertPermission('write', 'la suppression d’un membre')) return;
  const data = TAGBA_DB.get();
  const mem = (data.members || []).find(m => m.id === memberId);
  const memName = mem ? mem.fullName : 'ce membre';
  const cots = (data.cotisations || []).filter(c => (c.memberId || c.member_id) === memberId);
  const totalCot = cots.reduce((sum, c) => sum + Number(c.montant || 0), 0);
  const curr = data.config?.currency || 'FCFA';

  let confirmMsg = `Êtes-vous sûr de vouloir retirer définitivement "${memName}" de la mutuelle ?\n`;
  if (cots.length > 0) {
    confirmMsg += `\n⚠️ ATTENTION : ${cots.length} versement(s) pour un total de ${formatMoney(totalCot, curr)} sont associés à ce membre.\n` +
      `La suppression du membre supprimera également l'ensemble de ses montants et réajustera la caisse.`;
  }

  if (confirm(confirmMsg)) {
    TAGBA_DB.deleteMember(memberId);
    if (typeof deleteMemberFromSupabase === 'function') {
      deleteMemberFromSupabase(memberId);
    }
    showToast(`Membre "${memName}" et ses montants supprimés avec succès.`);
    renderAllViews();
    if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
      pushAllDataToSupabase(true);
    }
  }
}

function openEditFamilyModal(famId) {
  if (!assertPermission('write', 'la modification d’une famille')) return;
  const data = TAGBA_DB.get();
  const fam = (data.families || []).find(f => f.id === famId);
  if (!fam) return;

  const idEl = document.getElementById('editFamId');
  const chefEl = document.getElementById('editFamChef');
  const nameEl = document.getElementById('editFamName');
  const phoneEl = document.getElementById('editFamPhone');
  const cityEl = document.getElementById('editFamCity');
  const notesEl = document.getElementById('editFamNotes');

  if (idEl) idEl.value = fam.id;
  if (chefEl) chefEl.value = fam.chefDeFamille || '';
  if (nameEl) nameEl.value = fam.name || '';
  if (phoneEl) {
    phoneEl.value = fam.phone || '';
    phoneEl.style.borderColor = '';
    phoneEl.style.background = '';
  }
  const phone2El = document.getElementById('editFamPhone2');
  if (phone2El) {
    phone2El.value = fam.phone2 || '';
    phone2El.style.borderColor = '';
    phone2El.style.background = '';
  }
  if (cityEl) cityEl.value = fam.city || '';
  if (notesEl) notesEl.value = fam.notes || '';

  const phoneErr = document.getElementById('editFamPhoneError');
  if (phoneErr) {
    phoneErr.style.display = 'none';
    phoneErr.textContent = '';
  }
  const phone2Err = document.getElementById('editFamPhone2Error');
  if (phone2Err) {
    phone2Err.style.display = 'none';
    phone2Err.textContent = '';
  }

  openModal('modalEditFamily');
}

function deleteFamilyConfirm(famId) {
  if (!assertPermission('write', 'la suppression d’une famille')) return;
  const data = TAGBA_DB.get();
  const fam = (data.families || []).find(f => f.id === famId);
  const memCount = (data.members || []).filter(m => m.familyId === famId).length;
  const msg = `Êtes-vous sûr de vouloir supprimer la famille "${fam ? fam.name : famId}" ?` +
    (memCount > 0 ? `\nAttention : ${memCount} membre(s) rattaché(s) seront détachés.` : '');
  if (!confirm(msg)) return;
  TAGBA_DB.deleteFamily(famId);
  if (typeof deleteFamilyFromSupabase === 'function') {
    deleteFamilyFromSupabase(famId);
  }
  showToast('Famille supprimée avec succès');
  renderAllViews();
}

function accorderEntraide(casId) {
  if (!assertPermission('write', 'l’octroi d’une aide financière')) return;
  if (confirm('Confirmez-vous le décaissement de cette aide financière depuis la caisse de solidarité ?')) {
    TAGBA_DB.updateEntraideStatut(casId, 'Accordé & Décaissé');
    showToast('Aide financière accordée et décaissée avec succès !');
    renderAllViews();
  }
}

// Gestion des Modales
function openModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    m.style.display = 'flex';
    if (modalId === 'modalAddCotisation') {
      updateCotisationModalDefaults();
    } else if (modalId === 'modalAddMember') {
      initModalAddMember();
    } else if (modalId === 'modalAddDepense') {
      initModalAddDepense();
    } else if (modalId === 'modalAddContributionVolontaire') {
      initModalAddContribution();
    } else if (modalId === 'modalCreateEvenement') {
      const form = document.getElementById('formCreateEvenement');
      if (form) form.reset();
      const inputMontant = document.getElementById('createEvtMontant');
      if (inputMontant) inputMontant.value = 5000;
      const inputDate = document.getElementById('createEvtDate');
      if (inputDate) {
        const d = new Date();
        d.setDate(d.getDate() + 15);
        inputDate.value = d.toISOString().split('T')[0];
      }
    } else if (modalId === 'modalEditEvenement') {
      if (typeof openModalEditEvenement === 'function') {
        openModalEditEvenement();
      }
    }
  }
}

// Initialisation et remplissage garanti du sélecteur de Famille de Rattachement
function initModalAddMember(selectedFamilyId = null) {
  const select = document.getElementById('memFamilySelect');
  if (!select) return;

  const data = TAGBA_DB.get();
  let families = (data && data.families && data.families.length > 0) ? data.families : (typeof defaultData !== 'undefined' ? defaultData.families : []);

  if (!families || families.length === 0) {
    select.innerHTML = '<option value="" disabled selected>⚠️ Aucune famille enregistrée. Créez d’abord une famille !</option>';
    return;
  }

  let html = `<option value="" disabled ${!selectedFamilyId ? 'selected' : ''}>-- Sélectionnez une famille de rattachement * --</option>`;
  families.forEach(f => {
    const chef = f.chefDeFamille || f.chef_de_famille || 'Chef de famille';
    const isSel = selectedFamilyId && String(selectedFamilyId) === String(f.id);
    html += `<option value="${f.id}" ${isSel ? 'selected' : ''}>🏠 ${f.name} (Chef: ${chef})</option>`;
  });
  select.innerHTML = html;
  if (selectedFamilyId) {
    select.value = selectedFamilyId;
  }
}

function closeModal(target) {
  if (!target) {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
      m.style.display = 'none';
    });
    return;
  }
  if (typeof target === 'string') {
    const m = document.getElementById(target);
    if (m) {
      m.classList.remove('active');
      m.style.display = 'none';
    }
  } else if (target && target.closest) {
    const m = target.closest('.modal-overlay');
    if (m) {
      m.classList.remove('active');
      m.style.display = 'none';
    }
  } else {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
      m.style.display = 'none';
    });
  }
}

window.closeModal = closeModal;
function bindModalEvents() {
  // 1. Délégation globale infaillible sur tout le document
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.modal-close-btn, .modal-cancel-btn');
    if (closeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const modal = closeBtn.closest('.modal-overlay');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      } else {
        document.querySelectorAll('.modal-overlay.active').forEach(m => {
          m.classList.remove('active');
          m.style.display = 'none';
        });
      }
      return;
    }

    // Clic sur l'arrière-plan sombre de la modale
    if (e.target.classList && e.target.classList.contains('modal-overlay')) {
      e.preventDefault();
      e.target.classList.remove('active');
      e.target.style.display = 'none';
    }
  }, true);

  // 2. Touche Échap (Escape) pour fermer instantanément n'importe quelle modale
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => {
        m.classList.remove('active');
        m.style.display = 'none';
      });
    }
  });

  // 3. Écouteurs directs garantis pour l'ouverture des modales Événements
  document.querySelectorAll('[data-action="open-modal-create-evenement"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModalCreateEvenement();
    });
  });
  document.querySelectorAll('[data-action="open-modal-edit-evenement"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModalEditEvenement();
    });
  });

  // Changement de fréquence dans le modal versement
  const cotTypeSelect = document.getElementById('cotType');
  if (cotTypeSelect) {
    cotTypeSelect.addEventListener('change', () => {
      const activeEvt = TAGBA_DB.getActiveEvenement();
      const quickBox = document.getElementById('cotQuickAnticipationBox');
      const eventChoiceBox = document.getElementById('cotEventChoiceBox');
      const cotPeriodeInput = document.getElementById('cotPeriode');
      if (cotTypeSelect.value === 'Événement') {
        if (quickBox) quickBox.style.display = 'none';
        if (eventChoiceBox) eventChoiceBox.style.display = 'block';
        populateEventSelects();
        if (cotPeriodeInput) cotPeriodeInput.value = activeEvt.titre;
      } else {
        if (quickBox) quickBox.style.display = 'block';
        if (eventChoiceBox) eventChoiceBox.style.display = 'none';
      }
      syncCotisationMontantField();
    });
  }

  // Recherche dynamique du membre cotisant
  const cotMemberSearchInput = document.getElementById('cotMemberSearchInput');
  if (cotMemberSearchInput) {
    cotMemberSearchInput.addEventListener('input', (e) => {
      populateCotisationMembers(e.target.value);
    });
  }

  // Changement de membre sélectionné dans le modal versement
  const cotMemberSelect = document.getElementById('cotMemberSelect');
  if (cotMemberSelect) {
    cotMemberSelect.addEventListener('change', () => {
      onCotMemberSelected();
    });
  }

  // Calcul auto trimestriel dans les paramètres
  const btnCalc = document.getElementById('btnCalcTrimestriel');
  if (btnCalc) {
    btnCalc.addEventListener('click', () => {
      const mens = Number(document.getElementById('cfgCotisationMensuelle').value || 0);
      const curr = document.getElementById('cfgCurrency') ? document.getElementById('cfgCurrency').value : 'FCFA';
      document.getElementById('cfgCotisationTrimestrielle').value = mens * 3;
      showToast(`Montant trimestriel calculé : ${new Intl.NumberFormat('fr-FR').format(mens * 3)} ${curr}`);
    });
  }

  // Changement de devise dans les paramètres
  const selCurr = document.getElementById('cfgCurrency');
  if (selCurr) {
    selCurr.addEventListener('change', () => {
      updateCurrencySuffixes(selCurr.value);
    });
  }

  // Filtre recherche dynamique des membres
  const memberSearchInput = document.getElementById('memberSearchInput');
  const memberFamilyFilter = document.getElementById('memberFamilyFilter');

  if (memberSearchInput) {
    memberSearchInput.addEventListener('input', () => {
      renderFamiliesAndMembers();
    });
  }

  if (memberFamilyFilter) {
    memberFamilyFilter.addEventListener('change', () => {
      renderFamiliesAndMembers();
    });
  }
}

function populateSelectOptions() {
  const data = TAGBA_DB.get();
  const families = (data && data.families && data.families.length > 0) ? data.families : (typeof defaultData !== 'undefined' ? defaultData.families : []);

  // 1. Initialiser le sélecteur d'inscription de membre
  initModalAddMember();

  // 2. Filtres de familles et cérémonies
  const otherFamSelects = ['memberFamilyFilter', 'cerFamilySelect'];
  otherFamSelects.forEach(selId => {
    const el = document.getElementById(selId);
    if (!el) return;
    const isFilter = selId === 'memberFamilyFilter';
    el.innerHTML = isFilter ? '<option value="">Toutes les familles</option>' : '<option value="" disabled selected>-- Choisir une famille --</option>';
    families.forEach(f => {
      const chef = f.chefDeFamille || f.chef_de_famille || 'Chef de famille';
      el.innerHTML += `<option value="${f.id}">🏠 ${f.name} (Chef: ${chef})</option>`;
    });
  });

  // Membres pour l'entraide sociale
  const casMemberSelect = document.getElementById('casMemberSelect');
  if (casMemberSelect) {
    casMemberSelect.innerHTML = '';
    data.members.forEach(m => {
      casMemberSelect.innerHTML += `<option value="${m.id}">${m.fullName} (${m.matricule})</option>`;
    });
  }

  // Membres cotisants avec distinction Chefs de Famille et recherche
  populateCotisationMembers('');
}

// Form Submissions
function bindFormSubmissions() {
  // 1-Bis. Modifier Famille / Chef de Famille
  const formEditFam = document.getElementById('formEditFamily');
  if (formEditFam) {
    formEditFam.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'la modification d’une famille')) return;
      const famId = document.getElementById('editFamId').value;
      const phoneVal = document.getElementById('editFamPhone').value.trim();
      const phone2Val = (document.getElementById('editFamPhone2')?.value || '').trim();

      if (phoneVal && phone2Val && TAGBA_DB.normalizePhone(phoneVal) === TAGBA_DB.normalizePhone(phone2Val)) {
        showToast('🚫 Les deux numéros du chef de famille doivent être distincts.', 'error', 5000);
        return;
      }

      const conflict = TAGBA_DB.isPhoneTaken(phoneVal, famId);
      if (conflict) {
        showToast(`🚫 Numéro déjà attribué : Le numéro ${phoneVal} appartient déjà à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
        const pInput = document.getElementById('editFamPhone');
        if (pInput) { pInput.focus(); pInput.style.borderColor = 'var(--rose-500)'; }
        return;
      }

      if (phone2Val) {
        const conflict2 = TAGBA_DB.isPhoneTaken(phone2Val, famId);
        if (conflict2) {
          showToast(`🚫 Second numéro déjà attribué : Le numéro ${phone2Val} appartient déjà à "${conflict2.name}" (${conflict2.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
          const p2Input = document.getElementById('editFamPhone2');
          if (p2Input) { p2Input.focus(); p2Input.style.borderColor = 'var(--rose-500)'; }
          return;
        }
      }

      try {
        const updated = TAGBA_DB.updateFamily(famId, {
          chefDeFamille: document.getElementById('editFamChef').value.trim(),
          name: document.getElementById('editFamName').value.trim(),
          phone: phoneVal,
          phone2: phone2Val,
          city: document.getElementById('editFamCity').value.trim(),
          notes: document.getElementById('editFamNotes').value.trim()
        });

        showToast(`Chef de famille et foyer "${updated.name}" mis à jour avec succès !`, 'success');
        closeModal('modalEditFamily');
        renderAllViews();
        if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
          pushAllDataToSupabase(true);
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 1. Ajouter Famille
  const formAddFam = document.getElementById('formAddFamily');
  if (formAddFam) {
    formAddFam.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'l’ajout d’une famille')) return;
      const phoneVal = document.getElementById('famPhone').value.trim();
      const phone2Val = (document.getElementById('famPhone2')?.value || '').trim();

      if (phoneVal && phone2Val && TAGBA_DB.normalizePhone(phoneVal) === TAGBA_DB.normalizePhone(phone2Val)) {
        showToast('🚫 Les deux numéros du chef de famille doivent être distincts.', 'error', 5000);
        return;
      }

      const conflict = TAGBA_DB.isPhoneTaken(phoneVal);
      if (conflict) {
        showToast(`🚫 Numéro déjà attribué : Le numéro ${phoneVal} appartient déjà à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
        const pInput = document.getElementById('famPhone');
        if (pInput) { pInput.focus(); pInput.style.borderColor = 'var(--rose-500)'; }
        return;
      }

      if (phone2Val) {
        const conflict2 = TAGBA_DB.isPhoneTaken(phone2Val);
        if (conflict2) {
          showToast(`🚫 Second numéro déjà attribué : Le numéro ${phone2Val} appartient déjà à "${conflict2.name}" (${conflict2.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
          const p2Input = document.getElementById('famPhone2');
          if (p2Input) { p2Input.focus(); p2Input.style.borderColor = 'var(--rose-500)'; }
          return;
        }
      }

      const newFam = {
        name: document.getElementById('famName').value.trim(),
        chefDeFamille: document.getElementById('famChef').value.trim(),
        phone: phoneVal,
        phone2: phone2Val,
        city: document.getElementById('famCity').value.trim(),
        notes: document.getElementById('famNotes').value.trim()
      };
      try {
        TAGBA_DB.addFamily(newFam);
        showToast('Nouvelle famille enregistrée avec succès');
        closeModal('modalAddFamily');
        formAddFam.reset();
        renderAllViews();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 2. Ajouter Membre
  const formAddMem = document.getElementById('formAddMember');
  if (formAddMem) {
    formAddMem.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'l’ajout d’un membre')) return;
      const phoneVal = document.getElementById('memPhone').value.trim();
      const phone2Val = (document.getElementById('memPhone2')?.value || '').trim();

      if (phoneVal && phone2Val && TAGBA_DB.normalizePhone(phoneVal) === TAGBA_DB.normalizePhone(phone2Val)) {
        showToast('🚫 Les deux numéros d’un même membre doivent être distincts.', 'error', 5000);
        return;
      }

      const conflict = TAGBA_DB.isPhoneTaken(phoneVal);
      if (conflict) {
        showToast(`🚫 Numéro déjà attribué : Le numéro ${phoneVal} appartient déjà à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
        const pInput = document.getElementById('memPhone');
        if (pInput) { pInput.focus(); pInput.style.borderColor = 'var(--rose-500)'; }
        return;
      }

      if (phone2Val) {
        const conflict2 = TAGBA_DB.isPhoneTaken(phone2Val);
        if (conflict2) {
          showToast(`🚫 Second numéro déjà attribué : Le numéro ${phone2Val} appartient déjà à "${conflict2.name}" (${conflict2.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
          const p2Input = document.getElementById('memPhone2');
          if (p2Input) { p2Input.focus(); p2Input.style.borderColor = 'var(--rose-500)'; }
          return;
        }
      }

      const newMem = {
        fullName: document.getElementById('memName').value.trim(),
        familyId: document.getElementById('memFamilySelect').value,
        relationToChef: document.getElementById('memRelation').value.trim(),
        phone: phoneVal,
        phone2: phone2Val,
        profession: document.getElementById('memProfession').value.trim(),
        residence: document.getElementById('memResidence').value.trim(),
        statutCotisation: document.getElementById('memStatutCotisation').value
      };
      try {
        TAGBA_DB.addMember(newMem);
        showToast('Membre rattaché et enregistré avec succès !');
        closeModal('modalAddMember');
        formAddMem.reset();
        renderAllViews();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 2-Bis. Modifier Membre
  const formEditMem = document.getElementById('formEditMember');
  if (formEditMem) {
    formEditMem.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'la modification d’un membre')) return;
      const memId = document.getElementById('editMemId').value;
      const phoneVal = document.getElementById('editMemPhone').value.trim();
      const phone2Val = (document.getElementById('editMemPhone2')?.value || '').trim();

      if (phoneVal && phone2Val && TAGBA_DB.normalizePhone(phoneVal) === TAGBA_DB.normalizePhone(phone2Val)) {
        showToast('🚫 Les deux numéros d’un même membre doivent être distincts.', 'error', 5000);
        return;
      }

      const conflict = TAGBA_DB.isPhoneTaken(phoneVal, memId);
      if (conflict) {
        showToast(`🚫 Numéro déjà attribué : Le numéro ${phoneVal} appartient déjà à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
        const pInput = document.getElementById('editMemPhone');
        if (pInput) { pInput.focus(); pInput.style.borderColor = 'var(--rose-500)'; }
        return;
      }

      if (phone2Val) {
        const conflict2 = TAGBA_DB.isPhoneTaken(phone2Val, memId);
        if (conflict2) {
          showToast(`🚫 Second numéro déjà attribué : Le numéro ${phone2Val} appartient déjà à "${conflict2.name}" (${conflict2.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
          const p2Input = document.getElementById('editMemPhone2');
          if (p2Input) { p2Input.focus(); p2Input.style.borderColor = 'var(--rose-500)'; }
          return;
        }
      }

      try {
        TAGBA_DB.updateMember(memId, {
          fullName: document.getElementById('editMemName').value.trim(),
          familyId: document.getElementById('editMemFamilySelect').value,
          relationToChef: document.getElementById('editMemRelation').value.trim(),
          phone: phoneVal,
          phone2: phone2Val,
          profession: document.getElementById('editMemProfession').value.trim(),
          residence: document.getElementById('editMemResidence').value.trim(),
          statutCotisation: document.getElementById('editMemStatutCotisation').value
        });
        showToast('Membre mis à jour avec succès', 'success');
        closeModal('modalEditMember');
        renderAllViews();
        if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
          pushAllDataToSupabase(true);
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // 3. Ajouter Versement (Individuel ou Groupé par Chef de Famille)
  const formAddCot = document.getElementById('formAddCotisation');
  if (formAddCot) {
    formAddCot.addEventListener('submit', (e) => {
      e.preventDefault();
      try {
        if (!assertPermission('write', 'l’enregistrement d’un versement')) return;
        const memberId = document.getElementById('cotMemberSelect').value;
        if (!memberId) {
          showToast('Veuillez sélectionner un membre cotisant', 'warning');
          return;
        }

        const data = TAGBA_DB.get();
        const mem = data.members.find(m => m.id === memberId);
        const fam = mem ? data.families.find(f => f.id === mem.familyId) : null;
        const isChef = isMemberChefDeFamille(mem, fam);

        const cotType = document.getElementById('cotType').value;
        const periode = document.getElementById('cotPeriode').value.trim() || 'Cotisation';
        const modePaiement = document.getElementById('cotMode').value || 'Wave';
        const datePaiement = document.getElementById('cotDate').value || new Date().toISOString().split('T')[0];
        const agent = 'Seydou Coulibaly (Trésorier Général)';

        const groupContainer = document.getElementById('cotGroupPaymentContainer');
        const isGroupPayment = groupContainer && groupContainer.style.display !== 'none' && currentGroupPaymentMode === 'group';

        if (isGroupPayment) {
          // Mode Plage de Versement Groupé (Famille et/ou Autres membres sélectionnés)
          const allRows = Array.from(document.querySelectorAll('.family-plage-row'));
          const checkedRows = allRows.filter(row => {
            const cb = row.querySelector('.family-member-cb');
            return cb && cb.checked;
          });

          const unreadyRows = allRows.filter(row => {
            const cb = row.querySelector('.family-member-cb');
            return cb && !cb.checked;
          });

          if (checkedRows.length === 0) {
            showToast('Veuillez cocher au moins un membre prêt pour ce versement groupé', 'warning');
            return;
          }

          const unreadyMembers = unreadyRows.map(row => {
            const targetMemId = row.getAttribute('data-member-id');
            return data.members.find(m => m.id === targetMemId);
          }).filter(Boolean);

          const cfg = data.config || {};
          const isEventMode = cotType === 'Événement';
          const unitMonthly = isEventMode ? Number(cfg.cotisationEvenement || 5000) : Number(cfg.cotisationMensuelle || 500);
          let grandTotal = 0;
          let totalMonths = 0;
          const groupBatchRef = 'GRP-' + Date.now().toString().slice(-6);
          const groupMembersInfo = [];

          checkedRows.forEach(row => {
            const targetMemId = row.getAttribute('data-member-id');
            const targetMem = data.members.find(m => m.id === targetMemId);
            let lineMontant = 0;
            let months = 1;
            if (isEventMode) {
              const amtInput = row.querySelector('.plage-member-event-amount');
              lineMontant = amtInput ? Number(amtInput.value || 0) : unitMonthly;
              months = 1;
            } else {
              months = Number(row.querySelector('.plage-member-months-select')?.value || 1);
              lineMontant = months * unitMonthly;
            }
            grandTotal += lineMontant;
            totalMonths += months;

            const memberPeriode = isEventMode ? periode : (months === 1 ? periode : `${periode} (${months} mois)`);

            const selectedEventId = isEventMode ? (document.getElementById('cotEventSelect')?.value || data.config?.activeEventId || null) : null;
            const cotRecord = {
              memberId: targetMemId,
              memberName: targetMem ? targetMem.fullName : 'Membre',
              familyId: targetMem ? targetMem.familyId : (mem ? mem.familyId : 'fam-1'),
              type: isEventMode ? 'Événement' : (months === 1 ? 'Mensuel' : (months === 3 ? 'Trimestriel' : `${months} Mois`)),
              periode: memberPeriode,
              eventId: selectedEventId,
              montant: lineMontant,
              modePaiement: modePaiement,
              datePaiement: datePaiement,
              agent: agent,
              groupRef: groupBatchRef,
              payeurChef: mem ? mem.fullName : 'Représentant',
              monthsPaid: months
            };

            const saved = TAGBA_DB.addCotisation(cotRecord);
            groupMembersInfo.push({
              member: targetMem,
              cotisation: saved,
              amount: lineMontant,
              months: months
            });
          });

          const unreadyMsg = unreadyMembers.length > 0 ? ` (${unreadyMembers.length} membre(s) non prêt(s) différé(s))` : '';
          showToast(`✅ Versement groupé de ${formatMoney(grandTotal, data.config.currency)} validé pour ${checkedRows.length} membres${unreadyMsg} !`);
          closeModal('modalAddCotisation');
          currentGroupExtraMembers = [];
          formAddCot.reset();
          renderAllViews();

          openGroupReceiptModal({
            family: fam,
            chef: mem,
            members: groupMembersInfo,
            unreadyMembers: unreadyMembers,
            totalAmount: grandTotal,
            totalMonths: totalMonths,
            periode: periode,
            datePaiement: datePaiement,
            modePaiement: modePaiement,
            groupBatchRef: groupBatchRef,
            type: cotType,
            currency: data.config.currency
          });

        } else {
          // Mode Versement Individuel
          const rawMontant = Number(document.getElementById('cotMontant').value);
          if (isNaN(rawMontant) || rawMontant <= 0) {
            showToast('Veuillez spécifier un montant valide supérieur à 0', 'warning');
            return;
          }

          const selectedEventId = cotType === 'Événement' ? (document.getElementById('cotEventSelect')?.value || data.config?.activeEventId || null) : null;
          const newCot = {
            memberId: memberId,
            memberName: mem ? mem.fullName : 'Membre',
            familyId: mem ? mem.familyId : 'fam-1',
            type: cotType,
            periode: periode,
            eventId: selectedEventId,
            montant: rawMontant,
            modePaiement: modePaiement,
            datePaiement: datePaiement,
            agent: agent
          };

          const saved = TAGBA_DB.addCotisation(newCot);
          showToast('✅ Versement enregistré avec succès ! Reçu officiel généré.');
          closeModal('modalAddCotisation');
          formAddCot.reset();
          renderAllViews();
          openReceiptModal(saved.id);
        }
      } catch (err) {
        console.error('Erreur versement:', err);
        showToast('Erreur lors du versement : ' + (err.message || 'problème inattendu'), 'error');
      }
    });
  }

  // 3-Bis. Modifier un Versement Existant
  const formEditCot = document.getElementById('formEditCotisation');
  if (formEditCot) {
    formEditCot.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'la modification d’un versement')) return;
      const cotId = document.getElementById('editCotId').value;
      const type = document.getElementById('editCotType').value;
      const montant = Number(document.getElementById('editCotMontant').value) || 0;
      const periode = document.getElementById('editCotPeriode').value.trim();
      const datePaiement = document.getElementById('editCotDate').value;
      const modePaiement = document.getElementById('editCotMode').value;

      const updated = TAGBA_DB.updateCotisation(cotId, {
        type,
        montant,
        periode,
        datePaiement,
        modePaiement
      });

      if (updated) {
        showToast(`Versement ${updated.recuNum} mis à jour avec succès !`, 'success');
        closeModal('modalEditCotisation');
        renderAllViews();
        if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
          pushAllDataToSupabase(true);
        }
      }
    });
  }

  // Recalcul automatique lors du changement de fréquence dans la modale d'édition
  const editCotTypeSelect = document.getElementById('editCotType');
  if (editCotTypeSelect) {
    editCotTypeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      const data = TAGBA_DB.get();
      const cfg = data.config || {};
      const unitM = Number(cfg.cotisationMensuelle || 500);
      const montantInput = document.getElementById('editCotMontant');
      if (!montantInput) return;

      if (type === 'Mensuel') montantInput.value = unitM;
      else if (type === '2 Mois') montantInput.value = unitM * 2;
      else if (type === 'Trimestriel') montantInput.value = unitM * 3;
      else if (type === 'Semestriel') montantInput.value = unitM * 6;
      else if (type === 'Annuel') montantInput.value = unitM * 12;
    });
  }

  // 4. Déclarer Cas Social (Entraide)
  const formAddCas = document.getElementById('formAddEntraide');
  if (formAddCas) {
    formAddCas.addEventListener('submit', (e) => {
      e.preventDefault();
      const memberId = document.getElementById('casMemberSelect').value;
      const data = TAGBA_DB.get();
      const mem = data.members.find(m => m.id === memberId);

      const newCas = {
        memberId: memberId,
        memberName: mem ? mem.fullName : 'Membre',
        familyId: mem ? mem.familyId : 'fam-1',
        nature: document.getElementById('casNature').value,
        description: document.getElementById('casDesc').value.trim(),
        montantAlloue: Number(document.getElementById('casMontant').value || 0),
        statut: document.getElementById('casStatut').value
      };

      TAGBA_DB.addEntraide(newCas);
      showToast('Demande d’entraide enregistrée');
      closeModal('modalAddEntraide');
      formAddCas.reset();
      renderAllViews();
    });
  }

  // 5. Ajouter Cérémonie (Accessible au Commissaire et au Porte-Parole)
  const formAddCer = document.getElementById('formAddCeremonie');
  if (formAddCer) {
    formAddCer.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('ceremonies', 'la création d’une cérémonie')) return;
      const newCer = {
        titre: document.getElementById('cerTitre').value.trim(),
        type: document.getElementById('cerType').value,
        familyId: document.getElementById('cerFamilySelect').value,
        organisateur: document.getElementById('cerOrganisateur').value.trim(),
        date: document.getElementById('cerDate').value,
        lieu: document.getElementById('cerLieu').value.trim(),
        enveloppeSoutien: Number(document.getElementById('cerEnveloppe').value || 0),
        delegationBureau: document.getElementById('cerDelegation').value.trim(),
        description: document.getElementById('cerDesc').value.trim(),
        statut: 'À venir'
      };

      TAGBA_DB.addCeremonie(newCer);
      showToast('Cérémonie programmée avec succès');
      closeModal('modalAddCeremonie');
      formAddCer.reset();
      renderAllViews();
    });
  }

  // 6. Modifier Membre du Bureau
  const formEditBur = document.getElementById('formEditBureau');
  if (formEditBur) {
    formEditBur.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'la modification d’un membre du bureau')) return;
      const burId = document.getElementById('editBureauId').value;
      const name = document.getElementById('editBureauName').value.trim();
      const phone = document.getElementById('editBureauPhone').value.trim();
      const email = document.getElementById('editBureauEmail').value.trim();
      const bio = document.getElementById('editBureauBio').value.trim();

      if (phone) {
        const conflict = TAGBA_DB.isPhoneTaken(phone, burId);
        if (conflict) {
          showToast(`🚫 Numéro déjà attribué : Le numéro ${phone} appartient déjà à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
          return;
        }
      }

      TAGBA_DB.updateBureauMember(burId, name, phone, email, bio);
      showToast('Poste du Bureau mis à jour', 'success');
      closeModal('modalEditBureau');
      renderBureau();
      if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
        pushAllDataToSupabase(true);
      }
    });
  }

  // 6-Bis. Ajouter un Membre / Poste au Bureau
  const formAddBur = document.getElementById('formAddBureau');
  if (formAddBur) {
    formAddBur.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'l’ajout d’un membre du bureau')) return;
      const role = document.getElementById('addBureauRole').value.trim();
      const name = document.getElementById('addBureauName').value.trim();
      const phone = document.getElementById('addBureauPhone').value.trim();
      const email = document.getElementById('addBureauEmail').value.trim();
      const bio = document.getElementById('addBureauBio').value.trim();

      if (phone) {
        const conflict = TAGBA_DB.isPhoneTaken(phone);
        if (conflict) {
          showToast(`🚫 Numéro déjà attribué : Le numéro ${phone} appartient déjà à "${conflict.name}" (${conflict.details}). Aucun numéro ne peut être attribué à deux personnes.`, 'error', 6000);
          return;
        }
      }

      TAGBA_DB.addBureauMember({
        role,
        name,
        phone,
        email,
        bio
      });

      showToast(`Membre ajouté au Bureau : ${role} (${name})`, 'success');
      closeModal('modalAddBureau');
      formAddBur.reset();
      renderBureau();
      if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
        pushAllDataToSupabase(true);
      }
    });
  }

  // 7. Enregistrer les Paramètres & Montants par Défaut
  const formCfg = document.getElementById('formConfigSettings');
  if (formCfg) {
    formCfg.addEventListener('submit', (e) => {
      enregistrerParametres(e);
    });
  }

  // 8. Créer un Événement & Fixer la Cotisation
  const formCreateEvt = document.getElementById('formCreateEvenement');
  if (formCreateEvt) {
    formCreateEvt.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('evenements', 'la création d’un événement')) return;
      const titre = document.getElementById('createEvtTitre').value.trim();
      const montant = Number(document.getElementById('createEvtMontant').value) || 5000;
      const dateLimite = document.getElementById('createEvtDate').value;
      const statut = document.getElementById('createEvtStatut').value;
      const description = document.getElementById('createEvtDesc').value.trim();

      const newEvt = TAGBA_DB.addEvenement({
        titre,
        montant,
        dateLimite,
        statut,
        description
      });

      showToast(`🎯 Événement "${titre}" créé ! Montant : ${new Intl.NumberFormat('fr-FR').format(montant)} FCFA / membre`, 'success');
      closeModal('modalCreateEvenement');
      formCreateEvt.reset();
      renderAllViews();
      if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
        pushAllDataToSupabase(true);
      }
    });
  }

  // 9. Modifier un Événement Existant
  const formEditEvt = document.getElementById('formEditEvenement');
  if (formEditEvt) {
    formEditEvt.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('evenements', 'la modification d’un événement')) return;
      const id = document.getElementById('editEvtId').value;
      const titre = document.getElementById('editEvtTitre').value.trim();
      const montant = Number(document.getElementById('editEvtMontant').value) || 5000;
      const dateLimite = document.getElementById('editEvtDate').value;
      const statut = document.getElementById('editEvtStatut').value;
      const description = document.getElementById('editEvtDesc').value.trim();

      TAGBA_DB.updateEvenement(id, {
        titre,
        montant,
        dateLimite,
        statut,
        description
      });

      showToast(`Événement "${titre}" mis à jour avec succès !`, 'success');
      closeModal('modalEditEvenement');
      renderAllViews();
      if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
        pushAllDataToSupabase(true);
      }
    });
  }
}

// Fonction globale d'enregistrement des paramètres
function enregistrerParametres(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!assertPermission('write', 'la modification des paramètres financiers')) return false;

  try {
    const inputMensuel = document.getElementById('cfgCotisationMensuelle');
    const inputTrimestriel = document.getElementById('cfgCotisationTrimestrielle');
    const inputDateDebut = document.getElementById('cfgDateDebutCotisations');
    const selectCurrency = document.getElementById('cfgCurrency');
    const inputYear = document.getElementById('cfgYear');
    const inputAssocName = document.getElementById('cfgAssocName');
    const inputTagline = document.getElementById('cfgTagline');

    const newMensuel = inputMensuel && inputMensuel.value ? Number(inputMensuel.value) : 5000;
    const newTrimestriel = inputTrimestriel && inputTrimestriel.value ? Number(inputTrimestriel.value) : (newMensuel * 3);
    const inputCotisEvenement = document.getElementById('cfgCotisationEvenement');
    const inputEvenementActuel = document.getElementById('cfgEvenementActuel');
    const newCotisEvenement = inputCotisEvenement && inputCotisEvenement.value ? Number(inputCotisEvenement.value) : 5000;
    const newEvenementActuel = inputEvenementActuel && inputEvenementActuel.value.trim() ? inputEvenementActuel.value.trim() : 'Cotisation Sacrifice de la Mutuelle';

    const newDateDebut = inputDateDebut && inputDateDebut.value ? inputDateDebut.value : '2026-10-04';
    const newCurrency = selectCurrency && selectCurrency.value ? selectCurrency.value : 'FCFA';
    const newYear = inputYear && inputYear.value ? Number(inputYear.value) : 2026;
    const newAssocName = inputAssocName && inputAssocName.value.trim() ? inputAssocName.value.trim() : 'Association Mutuelle TAGBA';
    const newTagline = inputTagline && inputTagline.value.trim() ? inputTagline.value.trim() : 'Union • Solidarité • Entraide Familiale';

    // Sauvegarder dans la base locale
    const savedConfig = TAGBA_DB.updateConfig({
      cotisationMensuelle: newMensuel,
      cotisationTrimestrielle: newTrimestriel,
      cotisationEvenement: newCotisEvenement,
      evenementActuel: newEvenementActuel,
      dateDebutCotisations: newDateDebut,
      currency: newCurrency,
      year: newYear,
      assocName: newAssocName,
      tagline: newTagline
    });

    // Mettre à jour l'interface partout
    updateCurrencySuffixes(newCurrency);
    updateBaremeDisplays();
    updateCotisationModalDefaults();
    renderAllViews();

    // Synchronisation immédiate vers le Cloud Supabase
    if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
      pushAllDataToSupabase(true).catch(e => console.warn('[Cloud Sync] Push config:', e));
    }

    showToast(`✅ Paramètres enregistrés : Cotisation fixée à ${formatMoney(newMensuel, newCurrency)} / mois (Sauvegardé & Synchronisé Cloud)`, 'success');
  } catch (err) {
    console.error('Erreur enregistrement paramètres', err);
    showToast('Erreur lors de l’enregistrement des paramètres', 'error');
  }

  return false;
}

// Fonctions de chargement et mise à jour de la configuration
function loadConfigForm() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};

  const inputMensuel = document.getElementById('cfgCotisationMensuelle');
  const inputTrimestriel = document.getElementById('cfgCotisationTrimestrielle');
  const inputDateDebut = document.getElementById('cfgDateDebutCotisations');
  const selectCurrency = document.getElementById('cfgCurrency');
  const inputYear = document.getElementById('cfgYear');
  const inputAssocName = document.getElementById('cfgAssocName');
  const inputTagline = document.getElementById('cfgTagline');

  if (inputMensuel) inputMensuel.value = cfg.cotisationMensuelle || 500;
  if (inputTrimestriel) inputTrimestriel.value = cfg.cotisationTrimestrielle || 1500;
  const inputCotisEvenement = document.getElementById('cfgCotisationEvenement');
  const inputEvenementActuel = document.getElementById('cfgEvenementActuel');
  if (inputCotisEvenement) inputCotisEvenement.value = cfg.cotisationEvenement || 5000;
  if (inputEvenementActuel) inputEvenementActuel.value = cfg.evenementActuel || 'Cotisation Sacrifice de la Mutuelle';

  if (inputDateDebut) inputDateDebut.value = cfg.dateDebutCotisations || '2026-10-04';
  if (selectCurrency) selectCurrency.value = cfg.currency || 'FCFA';
  if (inputYear) inputYear.value = cfg.year || 2026;
  if (inputAssocName) inputAssocName.value = cfg.assocName || 'Association Mutuelle TAGBA';
  if (inputTagline) inputTagline.value = cfg.tagline || 'Union • Solidarité • Entraide Familiale';

  updateCurrencySuffixes(cfg.currency || 'FCFA');

  // Prévisualisation immédiate des barèmes dérivés
  const curVal = Number(inputMensuel ? inputMensuel.value : (cfg.cotisationMensuelle || 500));
  const curCurr = selectCurrency ? selectCurrency.value : (cfg.currency || 'FCFA');
  const autoTriInit = document.getElementById('cfgAutoTrimestre');
  const autoSemInit = document.getElementById('cfgAutoSemestre');
  const autoAnnInit = document.getElementById('cfgAutoAnnee');
  if (autoTriInit) autoTriInit.textContent = formatMoney(curVal * 3, curCurr);
  if (autoSemInit) autoSemInit.textContent = formatMoney(curVal * 6, curCurr);
  if (autoAnnInit) autoAnnInit.textContent = formatMoney(curVal * 12, curCurr);

  // Listener temps réel sur la cotisation mensuelle unique
  if (inputMensuel && !inputMensuel.dataset.boundLive) {
    inputMensuel.dataset.boundLive = 'true';
    inputMensuel.addEventListener('input', (e) => {
      const val = Number(e.target.value) || 0;
      const curr = selectCurrency ? selectCurrency.value : (cfg.currency || 'FCFA');
      if (inputTrimestriel) inputTrimestriel.value = val * 3;
      const autoTri = document.getElementById('cfgAutoTrimestre');
      const autoSem = document.getElementById('cfgAutoSemestre');
      const autoAnn = document.getElementById('cfgAutoAnnee');
      if (autoTri) autoTri.textContent = formatMoney(val * 3, curr);
      if (autoSem) autoSem.textContent = formatMoney(val * 6, curr);
      if (autoAnn) autoAnn.textContent = formatMoney(val * 12, curr);
    });
  }
}

// Fonction globale pour définir rapidement un montant de cotisation suggéré
function setQuickCotisation(amount) {
  const inputMensuel = document.getElementById('cfgCotisationMensuelle');
  if (inputMensuel) {
    inputMensuel.value = amount;
    inputMensuel.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function setQuickCotisationEvenement(amount) {
  const input = document.getElementById('cfgCotisationEvenement');
  if (input) {
    input.value = amount;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function setQuickEvenementTitle(title) {
  const input = document.getElementById('cfgEvenementActuel');
  if (input) {
    input.value = title;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function updateCurrencySuffixes(curr) {
  document.querySelectorAll('.cfgCurrencySuffix').forEach(el => {
    el.textContent = curr;
  });
}

function updateBaremeDisplays() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitM = Number(cfg.cotisationMensuelle || 500);
  const curr = cfg.currency || 'FCFA';

  const dispM = document.getElementById('cfgDisplayMensuel');
  const dispT = document.getElementById('cfgDisplayTrimestriel');
  const badgeM = document.getElementById('cfgDisplayMensuelBadge');
  const noticeM = document.getElementById('cotNoticeUnitTarif');

  const autoTri = document.getElementById('cfgAutoTrimestre');
  const autoSem = document.getElementById('cfgAutoSemestre');
  const autoAnn = document.getElementById('cfgAutoAnnee');

  if (dispM) dispM.textContent = formatMoney(unitM, curr) + ' / mois';
  if (dispT) dispT.textContent = formatMoney(unitM * 3, curr) + ' / trimestre';
  if (badgeM) badgeM.textContent = formatMoney(unitM, curr) + ' / mois';
  if (noticeM) noticeM.textContent = formatMoney(unitM, curr);

  if (autoTri) autoTri.textContent = formatMoney(unitM * 3, curr);
  if (autoSem) autoSem.textContent = formatMoney(unitM * 6, curr);
  if (autoAnn) autoAnn.textContent = formatMoney(unitM * 12, curr);

  updateAnticipationButtonLabels();
}

function updateAnticipationButtonLabels() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitM = Number(cfg.cotisationMensuelle || 500);
  const curr = cfg.currency || 'FCFA';

  const btn1 = document.querySelector('.btn-anticipate[data-months="1"]');
  const btn2 = document.querySelector('.btn-anticipate[data-months="2"]');
  const btn3 = document.querySelector('.btn-anticipate[data-months="3"]');
  const btn6 = document.querySelector('.btn-anticipate[data-months="6"]');
  const btn12 = document.querySelector('.btn-anticipate[data-months="12"]');

  if (btn1) btn1.textContent = `1 Mois (${formatMoney(unitM, curr)})`;
  if (btn2) btn2.textContent = `2 Mois (${formatMoney(unitM * 2, curr)})`;
  if (btn3) btn3.textContent = `3 Mois - Trimestre (${formatMoney(unitM * 3, curr)})`;
  if (btn6) btn6.textContent = `6 Mois (${formatMoney(unitM * 6, curr)})`;
  if (btn12) btn12.textContent = `12 Mois - 1 An (${formatMoney(unitM * 12, curr)})`;
}

// Détection si un membre est un Chef de Famille
function isMemberChefDeFamille(member, family) {
  if (!member) return false;
  if (member.isChef === true) return true;
  const rel = (member.relationToChef || '').toLowerCase();
  if (rel.includes('chef') || rel.includes('patriarche') || rel.includes('chef de famille')) return true;
  if (family && family.chefDeFamille) {
    const chefName = family.chefDeFamille.trim().toLowerCase();
    const memName = member.fullName.trim().toLowerCase();
    if (chefName === memName || chefName.includes(memName) || memName.includes(chefName)) return true;
  }
  return false;
}

// Remplissage avec recherche en direct du Membre Cotisant
function populateCotisationMembers(filterQuery = '') {
  const data = TAGBA_DB.get();
  const select = document.getElementById('cotMemberSelect');
  if (!select) return;

  const currentVal = select.value;
  const q = (filterQuery || '').trim().toLowerCase();

  const filteredMembers = data.members.filter(m => {
    if (!q) return true;
    const fam = data.families.find(f => f.id === m.familyId);
    const famName = fam ? fam.name.toLowerCase() : '';
    const famChef = fam ? fam.chefDeFamille.toLowerCase() : '';
    return m.fullName.toLowerCase().includes(q) ||
      (m.matricule && m.matricule.toLowerCase().includes(q)) ||
      (m.relationToChef && m.relationToChef.toLowerCase().includes(q)) ||
      famName.includes(q) ||
      famChef.includes(q);
  });

  if (filteredMembers.length === 0) {
    select.innerHTML = '<option value="">Aucun membre trouvé correspondant à la recherche</option>';
    onCotMemberSelected();
    return;
  }

  const chefs = [];
  const others = [];

  filteredMembers.forEach(m => {
    const fam = data.families.find(f => f.id === m.familyId);
    if (isMemberChefDeFamille(m, fam)) {
      chefs.push({ m, fam });
    } else {
      others.push({ m, fam });
    }
  });

  let html = '';
  if (chefs.length > 0) {
    html += '<optgroup label="👑 Chefs de Famille (Versement Groupé Familial Disponible)">';
    chefs.forEach(({ m, fam }) => {
      html += `<option value="${m.id}">👑 [CHEF] ${m.fullName} (${m.matricule}) - Famille ${fam ? fam.name : ''}</option>`;
    });
    html += '</optgroup>';
  }

  if (others.length > 0) {
    html += '<optgroup label="👤 Membres Rattachés">';
    others.forEach(({ m, fam }) => {
      html += `<option value="${m.id}">${m.fullName} (${m.matricule}) - [${m.relationToChef || 'Membre'}] ${fam ? fam.name : ''}</option>`;
    });
    html += '</optgroup>';
  }

  select.innerHTML = html;

  // Restaurer l'ancienne valeur si possible, sinon premier de la liste
  const exists = filteredMembers.some(m => m.id === currentVal);
  if (exists) {
    select.value = currentVal;
  } else if (filteredMembers.length > 0) {
    select.value = filteredMembers[0].id;
  }

  onCotMemberSelected();
}

let currentGroupPaymentMode = 'individual'; // 'group' ou 'individual'
let currentPlageGlobalDuration = 1; // 1 mois par défaut
let currentGroupExtraMembers = []; // Autres membres ajoutés manuellement au groupe

// Action d'ouverture directe de la Plage de Versement pour une Famille
function openFamilyBatchPayModal(familyId) {
  if (!assertPermission('write', 'l’encaissement groupé familial')) return;
  const data = TAGBA_DB.get();
  let fam = null;
  if (familyId) {
    fam = data.families.find(f => f.id === familyId);
  } else {
    fam = data.families[0];
  }
  if (!fam) return;

  // Trouver le chef officiel ou un représentant de la famille
  const chef = data.members.find(m => m.familyId === fam.id && isMemberChefDeFamille(m, fam)) || data.members.find(m => m.familyId === fam.id);
  if (!chef) {
    showToast('Aucun chef répertorié pour cette famille', 'warning');
    return;
  }

  currentGroupExtraMembers = [];
  openModal('modalAddCotisation');
  const cotSearchInput = document.getElementById('cotMemberSearchInput');
  if (cotSearchInput) cotSearchInput.value = '';
  populateCotisationMembers('');

  const select = document.getElementById('cotMemberSelect');
  if (select) {
    select.value = chef.id;
  }

  setVersementFormMode('group', true);
  showToast(`👑 Plage de versement ouverte pour la ${fam.name}`);
}

function setVersementFormMode(mode, triggerRender = true) {
  currentGroupPaymentMode = mode;
  const tabIndiv = document.getElementById('tabModeIndiv');
  const tabGroup = document.getElementById('tabModeGroup');
  const groupContainer = document.getElementById('cotGroupPaymentContainer');
  const modalContent = document.getElementById('modalAddCotisation')?.querySelector('.modal-content');
  const selectLabel = document.getElementById('cotMemberSelectLabel');

  if (mode === 'group') {
    if (tabGroup) tabGroup.classList.add('active');
    if (tabIndiv) tabIndiv.classList.remove('active');
    if (selectLabel) selectLabel.textContent = 'Chef de Famille ou Payeur Principal du Groupe *';
    if (modalContent) modalContent.classList.add('modal-content-wide');
    if (groupContainer) groupContainer.style.display = 'block';

    if (triggerRender) {
      const select = document.getElementById('cotMemberSelect');
      const memberId = select ? select.value : null;
      const data = TAGBA_DB.get();
      const member = memberId ? data.members.find(m => m.id === memberId) : data.members[0];
      const family = member ? data.families.find(f => f.id === member.familyId) : null;
      const familyMembers = (member && member.familyId)
        ? data.members.filter(m => m.familyId === member.familyId)
        : (member ? [member] : []);
      renderGroupPaymentCard(family, member, familyMembers);
    }
  } else {
    if (tabIndiv) tabIndiv.classList.add('active');
    if (tabGroup) tabGroup.classList.remove('active');
    if (selectLabel) selectLabel.textContent = 'Membre Cotisant *';
    if (modalContent) modalContent.classList.remove('modal-content-wide');
    if (groupContainer) {
      groupContainer.style.display = 'none';
      groupContainer.innerHTML = '';
    }
  }
  syncCotisationMontantField();
}

function onCotMemberSelected() {
  const select = document.getElementById('cotMemberSelect');
  const groupContainer = document.getElementById('cotGroupPaymentContainer');
  const modalContent = document.getElementById('modalAddCotisation')?.querySelector('.modal-content');
  if (!select) return;

  const memberId = select.value;
  if (!memberId) {
    if (groupContainer) {
      groupContainer.style.display = 'none';
      groupContainer.innerHTML = '';
    }
    if (modalContent) modalContent.classList.remove('modal-content-wide');
    updateCotMemberAuditPreview(null);
    return;
  }

  // Afficher l'aperçu du statut du membre et ses échéances
  updateCotMemberAuditPreview(memberId);

  // Si le mode Événement est sélectionné, préserver le mode sans forcer vers Mensuel
  const cotTypeSelect = document.getElementById('cotType');
  if (cotTypeSelect && cotTypeSelect.value === 'Événement') {
    syncCotisationMontantField();
    const data = TAGBA_DB.get();
    const member = data.members.find(m => m.id === memberId);
    if (!member) return;
    const family = data.families.find(f => f.id === member.familyId);
    const isChef = isMemberChefDeFamille(member, family);
    if (isChef && currentGroupPaymentMode === 'group') {
      setVersementFormMode('group', true);
    }
    return;
  }

  // Verrouiller en priorité le premier mois échu (1 mois par défaut)
  currentAnticipationSelectedMonths = 1;
  setAnticipationMonths(1);

  const data = TAGBA_DB.get();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;

  const family = data.families.find(f => f.id === member.familyId);
  const isChef = isMemberChefDeFamille(member, family);

  // Si le mode groupé est activé par l'onglet ou le bouton dédié
  if (currentGroupPaymentMode === 'group') {
    setVersementFormMode('group', true);
  } else {
    setVersementFormMode('individual', false);
  }
}

// Aperçu dynamique du diagnostic du membre dans le modal de paiement
function updateCotMemberAuditPreview(memberId) {
  const container = document.getElementById('cotMemberAuditPreview');
  if (!container) return;
  if (!memberId) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  const audit = getMemberCotisationAudit(memberId);
  if (!audit) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <div>
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">
          Situation du membre depuis le ${audit.dateDebutCotisations} :
        </div>
        <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-top: 2px;">
          ${audit.member.fullName} (${audit.member.matricule})
        </div>
      </div>
      <div>
        <span class="badge ${audit.badgeClass}">${audit.statutLabel}</span>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-top: 10px; font-size: 12px;">
      <div style="background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: var(--radius-sm);">
        <span style="color: var(--text-muted); font-size: 11px;">Total versé :</span>
        <strong style="display: block; color: var(--emerald-400);">${formatMoney(audit.totalVerse, audit.currency)}</strong>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: var(--radius-sm);">
        <span style="color: var(--text-muted); font-size: 11px;">Mois couverts :</span>
        <strong style="display: block; color: var(--text-main);">${audit.monthsPaidCount} mois</strong>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: var(--radius-sm);">
        <span style="color: var(--text-muted); font-size: 11px;">Dernier mois réglé :</span>
        <strong style="display: block; color: ${audit.monthsPaidCount > 0 ? 'var(--emerald-400)' : 'var(--text-dim)'};">${audit.dernierMoisPaye}</strong>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: var(--radius-sm);">
        <span style="color: var(--text-muted); font-size: 11px;">Prochain à régler :</span>
        <strong style="display: block; color: var(--cyan-400);">${audit.prochainMoisDu}</strong>
      </div>
    </div>
  `;
}

// Sélection rapide et anticipation de plusieurs mois
let currentAnticipationSelectedMonths = 1;

function setAnticipationMonths(nbMonths) {
  currentAnticipationSelectedMonths = nbMonths;
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 500);
  const cotTypeSelect = document.getElementById('cotType');
  const isEventType = cotTypeSelect && cotTypeSelect.value === 'Événement';
  const activeEvt = isEventType ? TAGBA_DB.getActiveEvenement() : null;
  const unitRate = isEventType ? Number(activeEvt?.montant || cfg.cotisationEvenement || 4000) : unitMonthly;

  // Mettre à jour l'état actif des boutons
  document.querySelectorAll('.btn-anticipate').forEach(btn => {
    const m = Number(btn.getAttribute('data-months'));
    if (m === nbMonths) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Mettre à jour le montant
  const inputMontant = document.getElementById('cotMontant');
  if (inputMontant) {
    inputMontant.value = nbMonths * unitMonthly;
  }

  // Mettre à jour la fréquence dans le select
  const selectType = document.getElementById('cotType');
  if (selectType) {
    if (nbMonths === 1) selectType.value = 'Mensuel';
    else if (nbMonths === 2) selectType.value = '2 Mois';
    else if (nbMonths === 3) selectType.value = 'Trimestriel';
    else if (nbMonths === 6) selectType.value = 'Semestriel';
    else if (nbMonths === 12) selectType.value = 'Annuel';
    else if (nbMonths === 15) selectType.value = '15 Mois';
    else {
      let customOpt = selectType.querySelector(`option[value="${nbMonths} Mois"]`);
      if (!customOpt) {
        customOpt = document.createElement('option');
        customOpt.value = `${nbMonths} Mois`;
        customOpt.textContent = `${nbMonths} Mois (${formatMoney(nbMonths * unitMonthly, cfg.currency)})`;
        selectType.appendChild(customOpt);
      }
      selectType.value = `${nbMonths} Mois`;
    }
  }

  // Calculer la période couverte exacte selon l'audit du membre sélectionné
  const memberSelect = document.getElementById('cotMemberSelect');
  const memberId = memberSelect ? memberSelect.value : null;
  const inputPeriode = document.getElementById('cotPeriode');
  const noticeEl = document.getElementById('cotMontantNotice');

  if (inputPeriode) {
    if (memberId) {
      const audit = getMemberCotisationAudit(memberId);
      if (audit && audit.timeline) {
        const startIndex = audit.monthsPaidCount;
        const targetMonths = audit.timeline.slice(startIndex, startIndex + nbMonths);
        if (targetMonths.length > 0) {
          if (nbMonths === 1) {
            inputPeriode.value = `${targetMonths[0].fullLabel} (1 mois)`;
          } else {
            const first = targetMonths[0].shortLabel;
            const last = targetMonths[targetMonths.length - 1].shortLabel;
            const isAdvanceIncluded = targetMonths.some(t => !t.isDue);
            inputPeriode.value = `${first} à ${last} (${nbMonths} mois${isAdvanceIncluded ? ' - Anticipation' : ''})`;
          }
        }
      }
    } else {
      inputPeriode.value = nbMonths === 1 ? '1 Mois' : `${nbMonths} Mois de cotisation`;
    }
  }

  if (noticeEl) {
    noticeEl.innerHTML = `⚡ <strong>${formatMoney(nbMonths * unitMonthly, cfg.currency)}</strong> = <strong>${nbMonths} mois de cotisation</strong> (${formatMoney(unitMonthly, cfg.currency)} / mois)`;
  }
}

function enableCustomCotisationAmount() {
  const cotMontantInput = document.getElementById('cotMontant');
  const lockIcon = document.getElementById('cotMontantLockIcon');
  if (cotMontantInput) {
    cotMontantInput.readOnly = false;
    cotMontantInput.removeAttribute('readonly');
    cotMontantInput.style.cursor = 'text';
    cotMontantInput.style.background = 'rgba(16, 185, 129, 0.08)';
    cotMontantInput.style.borderColor = 'var(--emerald-400)';
    cotMontantInput.focus();
    cotMontantInput.select();
  }
  if (lockIcon) {
    lockIcon.textContent = '✏️';
    lockIcon.title = 'Saisie libre de montant activée';
  }
  document.querySelectorAll('.btn-anticipate').forEach(btn => btn.classList.remove('active'));
  const btnCustom = document.getElementById('btnCustomAnticipate');
  if (btnCustom) btnCustom.classList.add('active');
}

function onCotMontantInput(val) {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 500);
  const cotTypeSelect = document.getElementById('cotType');
  const isEventType = cotTypeSelect && cotTypeSelect.value === 'Événement';
  if (isEventType) return;

  const numVal = Number(val) || 0;
  if (numVal <= 0) return;

  const nbMonths = Math.floor(numVal / unitMonthly);
  const reliquat = numVal % unitMonthly;

  if (nbMonths >= 1) {
    currentAnticipationSelectedMonths = nbMonths;
    document.querySelectorAll('.btn-anticipate').forEach(btn => {
      const m = Number(btn.getAttribute('data-months'));
      if (m === nbMonths && reliquat === 0) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const memberSelect = document.getElementById('cotMemberSelect');
    const memberId = memberSelect ? memberSelect.value : null;
    const inputPeriode = document.getElementById('cotPeriode');
    const noticeEl = document.getElementById('cotMontantNotice');

    if (inputPeriode && memberId) {
      const audit = getMemberCotisationAudit(memberId);
      if (audit && audit.timeline) {
        const startIndex = audit.monthsPaidCount;
        const targetMonths = audit.timeline.slice(startIndex, startIndex + nbMonths);
        if (targetMonths.length > 0) {
          if (nbMonths === 1) {
            inputPeriode.value = `${targetMonths[0].fullLabel} (1 mois)`;
          } else {
            const first = targetMonths[0].shortLabel;
            const last = targetMonths[targetMonths.length - 1].shortLabel;
            inputPeriode.value = `${first} à ${last} (${nbMonths} mois - Anticipation)`;
          }
        }
      }
    }

    if (noticeEl) {
      noticeEl.innerHTML = `⚡ <strong>${formatMoney(numVal, cfg.currency)}</strong> = <strong>${nbMonths} mois de cotisation</strong> couverts${reliquat > 0 ? ` (+ reliquat ${formatMoney(reliquat, cfg.currency)})` : ''}`;
    }

    if (cotTypeSelect) {
      if (nbMonths === 1) cotTypeSelect.value = 'Mensuel';
      else if (nbMonths === 2) cotTypeSelect.value = '2 Mois';
      else if (nbMonths === 3) cotTypeSelect.value = 'Trimestriel';
      else if (nbMonths === 6) cotTypeSelect.value = 'Semestriel';
      else if (nbMonths === 12) cotTypeSelect.value = 'Annuel';
      else if (nbMonths === 15) cotTypeSelect.value = '15 Mois';
      else {
        let customOpt = cotTypeSelect.querySelector(`option[value="${nbMonths} Mois"]`);
        if (!customOpt) {
          customOpt = document.createElement('option');
          customOpt.value = `${nbMonths} Mois`;
          customOpt.textContent = `${nbMonths} Mois (${formatMoney(numVal, cfg.currency)})`;
          cotTypeSelect.appendChild(customOpt);
        }
        cotTypeSelect.value = `${nbMonths} Mois`;
      }
    }
  }
}

// Ouvrir la modal d'audit chronologique détaillé du membre
function openMemberMonthsAuditModal(memberId) {
  window.currentAuditMemberId = memberId;
  const memberCotisations = (TAGBA_DB.get().cotisations || []).filter(c => (c.memberId || c.member_id) === memberId);
  const container = document.getElementById('memberMonthsAuditContent');
  if (!container) return;

  const data = TAGBA_DB.get();
  const audit = getMemberCotisationAudit(memberId);
  if (!audit) return;

  const mem = audit.member;
  const fam = data.families.find(f => f.id === mem.familyId);

  container.innerHTML = `
    <!-- Fiche d'identité financière du membre -->
    <div style="background: linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(17,24,39,0.85) 100%); border-radius: var(--radius-lg); padding: 18px; border: 1px solid var(--border-color); margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, var(--emerald-600), var(--emerald-400)); color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);">
            ${mem.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 style="font-size: 18px; margin: 0; color: #fff; display: flex; align-items: center; gap: 8px;">
              ${mem.fullName}
              ${mem.bureauRole ? `<span class="badge badge-purple" style="font-size: 10px;">${mem.bureauRole}</span>` : ''}
            </h2>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; display: flex; gap: 10px; flex-wrap: wrap;">
              <span>Matricule : <strong style="color: var(--emerald-400);">${mem.matricule}</strong></span>
              <span>•</span>
              <span>Foyer : <strong style="color: var(--gold-400);">👑 ${fam ? fam.name : 'Famille'}</strong></span>
              <span>•</span>
              <span>📞 ${mem.phone}</span>
            </div>
          </div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <span class="badge ${audit.badgeClass}" style="font-size: 13px; padding: 6px 14px;">
            ${audit.statutLabel}
          </span>
          <button class="btn btn-xs btn-secondary" onclick="closeModal('modalMemberMonthsAudit'); openEditMemberModal('${mem.id}')" style="margin-top: 4px;" title="Modifier les coordonnées du membre">
            ✏️ Modifier Informations
          </button>
          <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">
            Date de début : ${audit.dateDebutCotisations}
          </div>
        </div>
      </div>
    </div>

    <!-- 4 Cartes Métriques Synthétiques -->
    <div class="kpi-grid" style="margin-bottom: 22px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
      <div class="kpi-card" style="padding: 12px 16px; border-left: 3px solid var(--emerald-500);">
        <span class="kpi-title">Total Encaissé</span>
        <div class="kpi-value" style="font-size: 18px; color: var(--emerald-400);">${formatMoney(audit.totalVerse, audit.currency)}</div>
        <div class="kpi-sub">${audit.cotisationsCount} versement(s) au total</div>
      </div>

      <div class="kpi-card" style="padding: 12px 16px; border-left: 3px solid #10b981;">
        <span class="kpi-title">Mois Réglés</span>
        <div class="kpi-value" style="font-size: 18px; color: #34d399;">${audit.monthsPaidCount} mois</div>
        <div class="kpi-sub">Sur ${audit.monthsDueCount} mois échu(s)</div>
      </div>

      <div class="kpi-card" style="padding: 12px 16px; border-left: 3px solid var(--rose-500);">
        <span class="kpi-title">Mois en Retard</span>
        <div class="kpi-value" style="font-size: 18px; color: var(--rose-400);">${audit.monthsLateCount} mois</div>
        <div class="kpi-sub" style="color: var(--rose-400); font-weight: 600;">
          ${audit.monthsLateCount > 0 ? `Arriéré : -${formatMoney(audit.arrieresMontant, audit.currency)}` : 'À jour (0 FCFA)'}
        </div>
      </div>

      <div class="kpi-card" style="padding: 12px 16px; border-left: 3px solid var(--cyan-500);">
        <span class="kpi-title">Mois Anticipés</span>
        <div class="kpi-value" style="font-size: 18px; color: var(--cyan-400);">+${audit.monthsAdvanceCount} mois</div>
        <div class="kpi-sub">Payés d'avance</div>
      </div>
    </div>

    <!-- Titre et Grille Chronologique des Mois -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <h3 style="font-size: 15px; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
        <span>🗓️</span> Calendrier Échéancier Mois par Mois (${formatMoney(audit.unitMonthly, audit.currency)} / mois)
      </h3>
      <span style="font-size: 12px; color: var(--text-dim);">
        Échéance officielle fixée au 4 de chaque mois
      </span>
    </div>

    <div class="audit-months-grid">
      ${audit.timeline.map(item => {
    let cardClass = item.statusType;
    let badgeStyleClass = '';
    let icon = '⚪';

    if (item.statusType === 'paid') {
      badgeStyleClass = 'badge-success';
      icon = '✅';
    } else if (item.statusType === 'advance') {
      badgeStyleClass = 'badge-advance';
      icon = '🚀';
    } else if (item.statusType === 'late') {
      badgeStyleClass = 'badge-late';
      icon = '⚠️';
    } else {
      badgeStyleClass = 'badge-info';
      icon = '⚪';
    }

    return `
          <div class="month-audit-card ${cardClass}">
            <div class="month-audit-header">
              <span class="month-audit-title">${item.fullLabel}</span>
              <span class="badge ${badgeStyleClass}" style="font-size: 10px; padding: 2px 6px;">
                ${icon}
              </span>
            </div>
            <div class="month-audit-amount">
              ${formatMoney(item.amount, audit.currency)}
            </div>
            <div class="month-audit-meta">
              <strong>${item.statusText}</strong>
            </div>
            <div style="font-size: 10px; color: var(--text-dim); margin-top: auto;">
              Échéance : ${item.dueDateStr}
            </div>
          </div>
        `;
  }).join('')}
    </div>
  `;

  container.innerHTML += `
    <div style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 18px;">
      <h3 style="font-size: 15px; color: var(--text-main); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span style="display: flex; align-items: center; gap: 6px;">🧾 Versements & Mois Enregistrés (${memberCotisations.length})</span>
        <span style="font-size: 12px; color: var(--text-muted); font-weight: normal;">Cliquez sur 🗑️ pour supprimer un mois en cas d'erreur</span>
      </h3>
      ${memberCotisations.length === 0 ? `
        <div style="text-align: center; padding: 16px; color: var(--text-dim); background: rgba(255,255,255,0.02); border-radius: var(--radius-md); font-size: 13px;">
          Aucun versement enregistré pour le moment.
        </div>
      ` : `
        <div style="overflow-x: auto;">
          <table class="table" style="font-size: 13px; margin: 0; width: 100%;">
            <thead>
              <tr style="background: rgba(255,255,255,0.03);">
                <th>N° Reçu</th>
                <th>Mois / Période</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Mode</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${memberCotisations.map(c => `
                <tr>
                  <td><strong style="color: var(--emerald-400);">${c.recuNum}</strong></td>
                  <td><strong>${c.periode}</strong></td>
                  <td><strong style="color: var(--gold-400);">${formatMoney(c.montant, audit.currency)}</strong></td>
                  <td style="color: var(--text-dim);">${c.datePaiement || '-'}</td>
                  <td><span class="badge badge-purple" style="font-size: 10px;">${c.modePaiement || 'Espèces'}</span></td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 6px;">
                      <button class="btn btn-xs btn-secondary" onclick="openReceiptModal('${c.id}')" title="Voir / Imprimer le reçu">🖨️ Reçu</button>
                      <button class="btn btn-xs btn-danger" onclick="deleteCotisationPrompt('${c.id}', '${c.recuNum}', '${(mem.fullName || '').replace(/'/g, "\\'")}', ${c.montant})" title="Supprimer ce mois (Erreur)">🗑️ Supprimer ce mois</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  // Configurer le bouton d'action du modal pour payer / anticiper directement
  const btnAction = document.getElementById('btnAuditModalActionPay');
  if (btnAction) {
    btnAction.onclick = () => {
      closeModal('modalMemberMonthsAudit');
      quickPayMember(mem.id);
    };
  }

  openModal('modalMemberMonthsAudit');
}

function renderGroupPaymentCard(family, chef, familyMembers = []) {
  const groupContainer = document.getElementById('cotGroupPaymentContainer');
  if (!groupContainer) return;

  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 500);

  const cotTypeSelect = document.getElementById('cotType');
  const isEventType = cotTypeSelect && cotTypeSelect.value === 'Événement';
  const activeEvt = isEventType ? TAGBA_DB.getActiveEvenement() : null;
  const unitRate = isEventType ? Number(activeEvt?.montant || cfg.cotisationEvenement || 5000) : unitMonthly;

  // Fusionner les membres du foyer avec les membres supplémentaires ajoutés manuellement
  const baseMembers = [...familyMembers];
  const allGroupMembers = [...baseMembers];

  currentGroupExtraMembers.forEach(extra => {
    if (!allGroupMembers.some(m => m.id === extra.id)) {
      allGroupMembers.push(extra);
    }
  });

  // Liste des autres membres disponibles à ajouter (hors ceux déjà dans le groupe)
  const availableOthers = data.members.filter(m => !allGroupMembers.some(gm => gm.id === m.id));

  groupContainer.innerHTML = `
    <div class="family-plage-box">
      <!-- En-tête de la Plage de Versement Groupé -->
      <div class="family-group-payment-header">
        <div class="family-group-title">
          <span style="font-size: 26px;">👥</span>
          <div>
            <strong style="font-size: 16px;">
              Versement Groupé : ${family ? family.name : 'Sélection Personnalisée'}
            </strong>
            <span style="font-size: 12px; font-weight: normal; opacity: 0.9; display: block; margin-top: 2px;">
              Payeur principal : <strong>${chef ? chef.fullName : 'Représentant'}</strong> (${chef ? chef.matricule : 'N/A'})
              ${family ? `• Foyer : ${family.name} (📍 ${family.city})` : ''}
              • <strong>${allGroupMembers.length} membre(s) dans la liste</strong>
            </span>
          </div>
        </div>
      </div>

      <div id="groupPaymentChecklistSection">
        <!-- Barre d'outils de Versement Rapide -->
        <div class="family-plage-toolbar">
          ${isEventType ? `
            <div class="plage-duration-group">
              <span style="font-size: 11px; font-weight: 700; color: var(--gold-400); text-transform: uppercase;">
                🎯 Montant Événement :
              </span>
              <button type="button" class="plage-pill-btn active" onclick="applyPlageEventAmountAll(${unitRate})">${formatMoney(unitRate, cfg.currency)} (Fixé)</button>
              <button type="button" class="plage-pill-btn" onclick="applyPlageEventAmountAll(1000)">1 000</button>
              <button type="button" class="plage-pill-btn" onclick="applyPlageEventAmountAll(2000)">2 000</button>
              <button type="button" class="plage-pill-btn" onclick="applyPlageEventAmountAll(3000)">3 000</button>
              <button type="button" class="plage-pill-btn" onclick="applyPlageEventAmountAll(5000)">5 000</button>
              <button type="button" class="plage-pill-btn" onclick="applyPlageEventAmountAll(10000)">10 000</button>
            </div>
          ` : `
            <div class="plage-duration-group">
              <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">
                ⏱️ Durée pour tous :
              </span>
              <button type="button" class="plage-pill-btn ${currentPlageGlobalDuration === 1 ? 'active' : ''}" id="plageDurBtn_1" onclick="applyPlageDurationAll(1)">1 Mois</button>
              <button type="button" class="plage-pill-btn ${currentPlageGlobalDuration === 2 ? 'active' : ''}" id="plageDurBtn_2" onclick="applyPlageDurationAll(2)">2 Mois</button>
              <button type="button" class="plage-pill-btn ${currentPlageGlobalDuration === 3 ? 'active' : ''}" id="plageDurBtn_3" onclick="applyPlageDurationAll(3)">3 Mois (Trimestre)</button>
              <button type="button" class="plage-pill-btn ${currentPlageGlobalDuration === 6 ? 'active' : ''}" id="plageDurBtn_6" onclick="applyPlageDurationAll(6)">6 Mois</button>
              <button type="button" class="plage-pill-btn ${currentPlageGlobalDuration === 12 ? 'active' : ''}" id="plageDurBtn_12" onclick="applyPlageDurationAll(12)">12 Mois (Annuel)</button>
            </div>
          `}

          <div style="font-size: 11px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="toggleAllFamilyChecks(true)" style="padding: 4px 9px; font-size: 11px;">
              ✅ Tous prêts
            </button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="toggleAllFamilyChecks(false)" style="padding: 4px 9px; font-size: 11px;">
              ⬜ Aucun prêt
            </button>
            <button type="button" class="btn btn-sm btn-warning" onclick="toggleLateFamilyChecksOnly()" style="padding: 4px 9px; font-size: 11px;" title="Cocher uniquement ceux qui ont un retard">
              ⚠️ En retard uniquement
            </button>
          </div>
        </div>

        <!-- Note d'aide explicative -->
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          <span>💡</span> 
          <span>Si quelqu'un <strong>n'est pas prêt</strong> pour ce versement, cliquez sur son statut pour le marquer <strong>« Non prêt »</strong> (il sera reporté sans être facturé).</span>
        </div>

        <!-- Tableau / Plage des Membres du Groupe -->
        <div class="plage-table-wrapper">
          <table class="family-plage-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;"></th>
                <th>Membre du Groupe</th>
                <th>Disponibilité</th>
                <th>Statut actuel</th>
                <th style="width: 140px;">${isEventType ? 'Montant Saisi' : 'Durée'}</th>
                <th style="text-align: right; width: 110px;">Montant</th>
                <th style="width: 40px; text-align: center;"></th>
              </tr>
            </thead>
            <tbody>
              ${allGroupMembers.map(m => {
    const isThisChef = isMemberChefDeFamille(m, family);
    const isExtra = currentGroupExtraMembers.some(em => em.id === m.id);
    const extraFam = isExtra ? data.families.find(f => f.id === m.familyId) : null;
    const statusColor = m.statutCotisation === 'A_JOUR' ? '#10b981' : (m.statutCotisation === 'PARTIEL' ? '#f59e0b' : '#ef4444');
    const statusLabel = m.statutCotisation === 'A_JOUR' ? 'À jour' : (m.statutCotisation === 'PARTIEL' ? 'Partiel' : 'En retard');
    const initialMonths = currentPlageGlobalDuration || 1;
    const lineMontant = isEventType ? unitRate : (initialMonths * unitMonthly);

    return `
                  <tr class="family-plage-row row-checked" id="plageRow_${m.id}" data-member-id="${m.id}" data-statut="${m.statutCotisation}">
                    <td style="text-align: center;">
                      <input type="checkbox" class="family-member-cb" value="${m.id}" data-name="${m.fullName}" checked onchange="onFamilyRowCheckChange('${m.id}')" style="cursor: pointer; width: 17px; height: 17px; accent-color: var(--emerald-500);">
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--text-main); font-size: 13px; display: flex; align-items: center; gap: 6px;">
                        <span>${isThisChef ? '👑 ' : ''}${m.fullName}</span>
                        ${isExtra ? `<span class="other-member-badge">🔵 Autre (${extraFam ? extraFam.name : 'Autre'})</span>` : ''}
                      </div>
                      <div style="font-size: 11px; color: var(--text-muted);">
                        ${m.relationToChef || 'Membre'} • <span style="color: var(--emerald-400); font-weight: 600;">${m.matricule}</span>
                      </div>
                    </td>
                    <td>
                      <button type="button" class="ready-status-btn ready" id="btnReady_${m.id}" onclick="toggleMemberReadyStatus('${m.id}')" title="Cliquer pour changer entre Prêt et Non prêt">
                        🟢 Prêt
                      </button>
                    </td>
                    <td>
                      <span class="badge" style="font-size: 10px; background: rgba(255,255,255,0.06); color: ${statusColor}; border: 1px solid ${statusColor}40;">
                        ● ${statusLabel}
                      </span>
                    </td>
                    <td>
                      ${isEventType ? `
                        <input type="number" class="form-control form-control-sm plage-member-event-amount" id="eventAmount_${m.id}" value="${unitRate}" min="0" step="500" style="width: 110px; text-align: right; font-weight: 700; color: var(--gold-400); background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); border-radius: 4px; padding: 4px 6px;" oninput="onPlageMemberEventAmountChange('${m.id}')" title="Modifier le montant pour ce membre">
                      ` : `
                        <select class="plage-months-select plage-member-months-select" id="monthsSelect_${m.id}" onchange="onPlageMemberMonthsChange('${m.id}')">
                          <option value="1" ${initialMonths === 1 ? 'selected' : ''}>1 mois</option>
                          <option value="2" ${initialMonths === 2 ? 'selected' : ''}>2 mois</option>
                          <option value="3" ${initialMonths === 3 ? 'selected' : ''}>3 mois</option>
                          <option value="6" ${initialMonths === 6 ? 'selected' : ''}>6 mois</option>
                          <option value="12" ${initialMonths === 12 ? 'selected' : ''}>12 mois</option>
                        </select>
                      `}
                    </td>
                    <td style="text-align: right;">
                      <strong class="plage-line-amount" id="lineAmount_${m.id}" style="color: var(--emerald-400); font-size: 13px;">
                        ${formatMoney(lineMontant, cfg.currency)}
                      </strong>
                    </td>
                    <td style="text-align: center;">
                      ${isExtra ? `
                        <button type="button" class="btn-remove-extra-member" onclick="removeOtherMemberFromGroup('${m.id}')" title="Retirer ce membre supplémentaire du groupe">
                          ✕
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Boîte d'Ajout d'un Autre Membre au Groupe -->
        <div class="add-other-member-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 12px; color: var(--blue-400); display: flex; align-items: center; gap: 6px;">
              <span>➕</span> Ajouter un autre membre au groupe (proche, parent ou autre foyer) :
            </strong>
            <span style="font-size: 11px; color: var(--text-muted);">${availableOthers.length} autre(s) disponible(s)</span>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <select id="selectOtherMemberToAdd" class="form-control" style="flex: 1; min-width: 220px; font-size: 13px; height: 38px;">
              <option value="">-- Choisir un membre à ajouter au versement groupé --</option>
              ${availableOthers.map(om => {
    const oFam = data.families.find(f => f.id === om.familyId);
    return `<option value="${om.id}">${om.fullName} (${om.matricule}) — ${oFam ? oFam.name : 'Famille'}</option>`;
  }).join('')}
            </select>
            <button type="button" class="btn btn-sm btn-primary" onclick="addOtherMemberToGroup()" style="padding: 0 16px; height: 38px; white-space: nowrap;">
              ➕ Ajouter au groupe
            </button>
          </div>
        </div>

        <!-- Récapitulatif Global de la Plage -->
        <div class="family-group-summary" style="margin-top: 14px;">
          <div>
            <span>Membres prêts (inclus) : </span>
            <strong id="groupCheckedCount" style="color: var(--emerald-400);">${allGroupMembers.length}</strong> / <strong>${allGroupMembers.length}</strong>
            <span style="opacity: 0.5; margin: 0 8px;">•</span>
            <span id="groupUnreadyCountContainer" style="display: none; color: var(--rose-400); font-weight: 600;">
              <span id="groupUnreadyCount">0</span> non prêt(s) •
            </span>
            <span>Total mois : </span>
            <strong id="groupTotalMonthsDisplay">${allGroupMembers.length * currentPlageGlobalDuration} mois</strong>
          </div>
          <div>
            <span>Total à encaisser : </span>
            <span class="total-val" id="groupTotalAmount" style="font-size: 18px; color: var(--emerald-400); font-weight: 800;">
              ${formatMoney(allGroupMembers.length * currentPlageGlobalDuration * unitMonthly, cfg.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function toggleMemberReadyStatus(memberId) {
  const row = document.getElementById(`plageRow_${memberId}`);
  const cb = row ? row.querySelector('.family-member-cb') : null;
  if (!cb) return;

  cb.checked = !cb.checked;
  onFamilyRowCheckChange(memberId);
}

function onFamilyRowCheckChange(memberId) {
  const row = document.getElementById(`plageRow_${memberId}`);
  const cb = row ? row.querySelector('.family-member-cb') : null;
  const btn = document.getElementById(`btnReady_${memberId}`);
  const amountEl = document.getElementById(`lineAmount_${memberId}`);
  const sel = document.getElementById(`monthsSelect_${memberId}`);
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 500);
  const months = Number(sel?.value || 1);

  if (row && cb) {
    if (cb.checked) {
      row.classList.add('row-checked');
      row.classList.remove('row-unready');
      if (btn) {
        btn.className = 'ready-status-btn ready';
        btn.innerHTML = '🟢 Prêt';
      }
      if (amountEl) {
        const cotTypeSelect = document.getElementById('cotType');
        const isEventType = cotTypeSelect && cotTypeSelect.value === 'Événement';
        let rowAmt = months * unitMonthly;
        if (isEventType) {
          const evtInput = document.getElementById(`eventAmount_${memberId}`);
          rowAmt = evtInput ? Number(evtInput.value || 0) : Number(TAGBA_DB.getActiveEvenement()?.montant || 4000);
        }
        amountEl.textContent = formatMoney(rowAmt, cfg.currency);
        amountEl.style.opacity = '1';
      }
    } else {
      row.classList.remove('row-checked');
      row.classList.add('row-unready');
      if (btn) {
        btn.className = 'ready-status-btn not-ready';
        btn.innerHTML = '⏳ Non prêt';
      }
      if (amountEl) {
        amountEl.innerHTML = '<span style="opacity: 0.5; font-size: 11px;">0 FCFA (Différé)</span>';
      }
    }
  }
  syncCotisationMontantField();
}

function addOtherMemberToGroup() {
  const select = document.getElementById('selectOtherMemberToAdd');
  if (!select || !select.value) {
    showToast('Veuillez sélectionner un membre à ajouter au groupe', 'warning');
    return;
  }
  const memberId = select.value;
  const data = TAGBA_DB.get();
  const member = data.members.find(m => m.id === memberId);
  if (!member) return;

  if (currentGroupExtraMembers.some(m => m.id === memberId)) {
    showToast('Ce membre est déjà inclus dans le groupe', 'warning');
    return;
  }

  currentGroupExtraMembers.push(member);
  showToast(`👤 ${member.fullName} a été ajouté au versement groupé !`);

  // Rafraîchir l'affichage du groupe
  const cotSelect = document.getElementById('cotMemberSelect');
  const mainMemId = cotSelect ? cotSelect.value : null;
  const mainMem = mainMemId ? data.members.find(m => m.id === mainMemId) : null;
  const fam = mainMem ? data.families.find(f => f.id === mainMem.familyId) : null;
  const familyMembers = (mainMem && mainMem.familyId)
    ? data.members.filter(m => m.familyId === mainMem.familyId)
    : (mainMem ? [mainMem] : []);

  renderGroupPaymentCard(fam, mainMem, familyMembers);
  syncCotisationMontantField();
}

function removeOtherMemberFromGroup(memberId) {
  currentGroupExtraMembers = currentGroupExtraMembers.filter(m => m.id !== memberId);
  showToast('Membre retiré du groupe');

  const data = TAGBA_DB.get();
  const cotSelect = document.getElementById('cotMemberSelect');
  const mainMemId = cotSelect ? cotSelect.value : null;
  const mainMem = mainMemId ? data.members.find(m => m.id === mainMemId) : null;
  const fam = mainMem ? data.families.find(f => f.id === mainMem.familyId) : null;
  const familyMembers = (mainMem && mainMem.familyId)
    ? data.members.filter(m => m.familyId === mainMem.familyId)
    : (mainMem ? [mainMem] : []);

  renderGroupPaymentCard(fam, mainMem, familyMembers);
  syncCotisationMontantField();
}

// Appliquer une durée collective à tous les membres de la plage
function applyPlageDurationAll(months) {
  currentPlageGlobalDuration = months;
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 500);

  // Mettre à jour les boutons de pilules
  document.querySelectorAll('.plage-pill-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`plageDurBtn_${months}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Mettre à jour tous les selects de durée par ligne
  document.querySelectorAll('.plage-member-months-select').forEach(sel => {
    sel.value = months;
  });

  // Mettre à jour les montants par ligne pour les membres prêts
  document.querySelectorAll('.family-plage-row').forEach(row => {
    const memId = row.getAttribute('data-member-id');
    const cb = row.querySelector('.family-member-cb');
    const amountEl = document.getElementById(`lineAmount_${memId}`);
    if (amountEl && cb) {
      if (cb.checked) {
        amountEl.textContent = formatMoney(months * unitMonthly, cfg.currency);
      } else {
        amountEl.innerHTML = '<span style="opacity: 0.5; font-size: 11px;">0 FCFA (Différé)</span>';
      }
    }
  });

  // Mettre à jour le champ période de la modale
  const cotPeriodeInput = document.getElementById('cotPeriode');
  if (cotPeriodeInput) {
    const now = new Date();
    const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    if (months === 1) {
      cotPeriodeInput.value = `${monthsFr[now.getMonth()]} ${now.getFullYear()}`;
    } else if (months === 3) {
      const q = Math.floor(now.getMonth() / 3) + 1;
      cotPeriodeInput.value = `T${q} ${now.getFullYear()}`;
    } else {
      cotPeriodeInput.value = `${monthsFr[now.getMonth()]} ${now.getFullYear()} (${months} mois)`;
    }
  }

  syncCotisationMontantField();
}

function onPlageMemberMonthsChange(memberId) {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 500);

  const row = document.getElementById(`plageRow_${memberId}`);
  const cb = row ? row.querySelector('.family-member-cb') : null;
  const sel = document.getElementById(`monthsSelect_${memberId}`);
  const amountEl = document.getElementById(`lineAmount_${memberId}`);

  if (sel && amountEl) {
    const months = Number(sel.value || 1);
    if (cb && cb.checked) {
      amountEl.textContent = formatMoney(months * unitMonthly, cfg.currency);
    } else {
      amountEl.innerHTML = '<span style="opacity: 0.5; font-size: 11px;">0 FCFA (Différé)</span>';
    }
  }
  syncCotisationMontantField();
}

function toggleAllFamilyChecks(checked) {
  document.querySelectorAll('.family-plage-row').forEach(row => {
    const memId = row.getAttribute('data-member-id');
    const cb = row.querySelector('.family-member-cb');
    if (cb) {
      cb.checked = checked;
      onFamilyRowCheckChange(memId);
    }
  });
}

function toggleLateFamilyChecksOnly() {
  document.querySelectorAll('.family-plage-row').forEach(row => {
    const memId = row.getAttribute('data-member-id');
    const cb = row.querySelector('.family-member-cb');
    const statut = row.getAttribute('data-statut');
    const isLate = statut !== 'A_JOUR';
    if (cb) {
      cb.checked = isLate;
      onFamilyRowCheckChange(memId);
    }
  });
  showToast('Membres avec cotisations en retard ou partielles sélectionnés !');
}

function syncCotisationMontantField() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const cotMontantInput = document.getElementById('cotMontant');
  if (!cotMontantInput) return;

  const unitMonthly = Number(cfg.cotisationMensuelle || 500);
  const groupContainer = document.getElementById('cotGroupPaymentContainer');
  const isGroupActive = groupContainer && groupContainer.style.display !== 'none' && currentGroupPaymentMode === 'group';

  if (isGroupActive) {
    const allRows = Array.from(document.querySelectorAll('.family-plage-row'));
    const checkedRows = allRows.filter(r => {
      const cb = r.querySelector('.family-member-cb');
      return cb && cb.checked;
    });
    const unreadyRows = allRows.filter(r => {
      const cb = r.querySelector('.family-member-cb');
      return cb && !cb.checked;
    });

    let grandTotal = 0;
    let totalMonths = 0;

    const cotTypeSelect = document.getElementById('cotType');
    const isEventType = cotTypeSelect && cotTypeSelect.value === 'Événement';
    const activeEvt = isEventType ? TAGBA_DB.getActiveEvenement() : null;
    const unitRate = isEventType ? Number(activeEvt?.montant || cfg.cotisationEvenement || 5000) : unitMonthly;

    checkedRows.forEach(row => {
      let lineMontant = 0;
      if (isEventType) {
        const amtInput = row.querySelector('.plage-member-event-amount');
        lineMontant = amtInput ? Number(amtInput.value || 0) : unitRate;
        totalMonths += 1;
      } else {
        const months = Number(row.querySelector('.plage-member-months-select')?.value || 1);
        lineMontant = months * unitMonthly;
        totalMonths += months;
      }
      grandTotal += lineMontant;
      const lineAmtEl = row.querySelector('.plage-line-amount');
      if (lineAmtEl) lineAmtEl.textContent = formatMoney(lineMontant, cfg.currency);
    });

    const countEl = document.getElementById('groupCheckedCount');
    const unreadyCountEl = document.getElementById('groupUnreadyCount');
    const unreadyContainer = document.getElementById('groupUnreadyCountContainer');
    const monthsEl = document.getElementById('groupTotalMonthsDisplay');
    const totalEl = document.getElementById('groupTotalAmount');

    if (countEl) countEl.textContent = checkedRows.length;
    if (unreadyContainer && unreadyCountEl) {
      if (unreadyRows.length > 0) {
        unreadyContainer.style.display = 'inline';
        unreadyCountEl.textContent = `${unreadyRows.length}`;
      } else {
        unreadyContainer.style.display = 'none';
      }
    }
    if (monthsEl) monthsEl.textContent = `${totalMonths} mois`;
    if (totalEl) totalEl.textContent = formatMoney(grandTotal, cfg.currency);

    cotMontantInput.value = grandTotal;
  } else {
    const cotTypeSelect = document.getElementById('cotType');
    const cotType = cotTypeSelect ? cotTypeSelect.value : 'Mensuel';
    const lockIcon = document.getElementById('cotMontantLockIcon');
    const noticeEl = document.getElementById('cotMontantNotice');

    if (cotType === 'Événement') {
      const activeEvt = TAGBA_DB.getActiveEvenement();
      const unitEvent = Number(activeEvt?.montant || cfg.cotisationEvenement || 4000);

      // Ne pré-remplir que si le champ est vide ou s'il s'agit d'un nouveau basculement vers Événement
      if (!cotMontantInput.value || cotMontantInput.getAttribute('data-last-type') !== 'Événement') {
        cotMontantInput.value = unitEvent;
      }

      // RENDRE TOTALEMENT MODIFIABLE POUR PERMETTRE DE SAISIR UN AUTRE MONTANT QUE LE MONTANT FIXÉ
      cotMontantInput.readOnly = false;
      cotMontantInput.removeAttribute('readonly');
      cotMontantInput.style.cursor = 'text';
      cotMontantInput.style.background = 'rgba(245, 158, 11, 0.08)';
      cotMontantInput.style.borderColor = 'var(--gold-400)';
      cotMontantInput.setAttribute('data-last-type', 'Événement');

      if (lockIcon) {
        lockIcon.textContent = '✏️';
        lockIcon.title = 'Montant modifiable librement pour cet événement';
      }
      if (noticeEl) {
        noticeEl.innerHTML = `🎯 Montant fixé : <strong>${formatMoney(unitEvent, cfg.currency)}</strong> — <span style="color: var(--gold-400); font-weight: 600;">(Vous pouvez saisir un montant différent si souhaité)</span>`;
      }

      const quickPills = document.getElementById('cotEventQuickPills');
      if (quickPills) {
        quickPills.style.display = 'flex';
        const fixedPill = document.getElementById('btnPillFixedEvt');
        if (fixedPill) {
          fixedPill.textContent = `${formatMoney(unitEvent, cfg.currency)} (Fixé)`;
          fixedPill.onclick = () => setEventPaymentMontant(unitEvent);
        }
      }
    } else if (cotType === 'Exceptionnel') {
      const quickPills = document.getElementById('cotEventQuickPills');
      if (quickPills) quickPills.style.display = 'none';
      cotMontantInput.readOnly = false;
      cotMontantInput.style.cursor = 'text';
      cotMontantInput.placeholder = 'Saisir montant exceptionnel';
      if (lockIcon) lockIcon.textContent = '✏️';
      if (noticeEl) {
        noticeEl.innerHTML = '✏️ <em>Saisie libre pour don ou contribution exceptionnelle</em>';
      }
    } else {
      const cotPills = document.getElementById('cotEventQuickPills');
      if (cotPills) cotPills.style.display = 'none';
      let multiplier = 1;
      if (cotType === '2 Mois') multiplier = 2;
      else if (cotType === 'Trimestriel') multiplier = 3;
      else if (cotType === 'Semestriel') multiplier = 6;
      else if (cotType === 'Annuel') multiplier = 12;
      else if (cotType === '15 Mois') multiplier = 15;

      if (currentAnticipationSelectedMonths && currentAnticipationSelectedMonths >= 1) {
        multiplier = currentAnticipationSelectedMonths;
      }

      const totalVal = unitMonthly * multiplier;
      cotMontantInput.value = totalVal;
      cotMontantInput.readOnly = false;
      cotMontantInput.removeAttribute('readonly');
      cotMontantInput.style.cursor = 'text';
      if (lockIcon) {
        lockIcon.textContent = '✏️';
        lockIcon.title = 'Montant modifiable librement (ex: 7 500)';
      }
      if (noticeEl) {
        noticeEl.innerHTML = `⚡ Calculé selon le barème : <strong>${formatMoney(unitMonthly, cfg.currency)}</strong> × ${multiplier} mois = <strong>${formatMoney(totalVal, cfg.currency)}</strong> (Modifiable librement si vous souhaitez saisir un autre montant)`;
      }
    }
  }
}

function updateCotisationModalDefaults() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const modalHeader = document.querySelector('#modalAddCotisation .modal-header h3');
  if (modalHeader) {
    modalHeader.textContent = '💳 Enregistrer un Versement de Cotisation Ordinaire';
  }
  const cotTypeSelect = document.getElementById('cotType');
  const cotMontantInput = document.getElementById('cotMontant');
  const cotDateInput = document.getElementById('cotDate');
  const cotPeriodeInput = document.getElementById('cotPeriode');
  const cotSearchInput = document.getElementById('cotMemberSearchInput');

  // 1. Fréquence par défaut : Mensuel
  if (cotTypeSelect) {
    cotTypeSelect.value = 'Mensuel';
    const optMensuel = cotTypeSelect.querySelector('option[value="Mensuel"]');
    const optTrimestriel = cotTypeSelect.querySelector('option[value="Trimestriel"]');
    if (optMensuel) optMensuel.textContent = `Mensuel (${formatMoney(cfg.cotisationMensuelle || 500, cfg.currency)})`;
    if (optTrimestriel) optTrimestriel.textContent = `Trimestriel (${formatMoney(cfg.cotisationTrimestrielle || 1500, cfg.currency)})`;
  }

  // 2. Date de paiement par défaut : Aujourd'hui (format YYYY-MM-DD local)
  if (cotDateInput) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    cotDateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // 3. Période couverte par défaut : Mois en cours (ex: "Octobre 2026")
  if (cotPeriodeInput) {
    const monthsFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const now = new Date();
    cotPeriodeInput.value = `${monthsFr[now.getMonth()]} ${now.getFullYear()}`;
  }

  // 4. Réinitialiser la recherche et afficher les membres
  if (cotSearchInput) {
    cotSearchInput.value = '';
  }
  populateCotisationMembers('');

  // 5. Réinitialiser la durée globale à 1 mois et synchroniser le montant (Mode individuel par défaut)
  currentPlageGlobalDuration = 1;
  currentAnticipationSelectedMonths = 1;
  currentGroupPaymentMode = 'individual';
  setVersementFormMode('individual', false);
  setAnticipationMonths(1);
  syncCotisationMontantField();
}

// Reçu officiel pour un Versement Groupé Familial (Détaillant chaque membre et sa durée)
function openGroupReceiptModal(groupInfo) {
  const container = document.getElementById('receiptContent');
  if (!container) return;

  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const { family, chef, members, unreadyMembers, totalAmount, totalMonths, periode, datePaiement, modePaiement, groupBatchRef, type, currency } = groupInfo;

  container.innerHTML = `
    <div class="receipt-paper">
      <div class="receipt-header">
        <h2>${cfg.assocName}</h2>
        <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">${cfg.tagline}</p>
        <p style="font-size: 13px; color: #047857; margin-top: 6px; font-weight: 700;">REÇU OFFICIEL DE VERSEMENT GROUPÉ</p>
      </div>

      <div class="receipt-meta">
        <div>
          <p><strong>N° Référence Groupe :</strong> ${groupBatchRef}</p>
          <p><strong>Date d'émission :</strong> ${datePaiement}</p>
          <p><strong>Période de référence :</strong> ${periode}</p>
          <p><strong>Cumul des périodes :</strong> ${totalMonths} mois réglés</p>
        </div>
        <div>
          <p><strong>Payeur Principal :</strong> 👑 ${chef ? chef.fullName : 'Représentant'}</p>
          <p><strong>Matricule Payeur :</strong> ${chef ? chef.matricule : 'N/A'}</p>
          <p><strong>Foyer / Groupe :</strong> ${family ? family.name : 'Sélection Groupe'}</p>
          <p><strong>Membres réglés ce jour :</strong> ${members.length} cotisant(s)</p>
        </div>
      </div>

      <!-- Tableau détaillé des membres cotisés avec nombre de mois -->
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 12px; text-transform: uppercase; color: #4b5569; margin-bottom: 8px; letter-spacing: 0.05em;">Détail des membres pris en charge et réglés :</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 8px;">N°</th>
              <th style="padding: 8px;">Matricule</th>
              <th style="padding: 8px;">Membre Cotisant</th>
              <th style="padding: 8px;">Lien / Foyer</th>
              <th style="padding: 8px; text-align: center;">Durée</th>
              <th style="padding: 8px; text-align: right;">Montant Réglé</th>
            </tr>
          </thead>
          <tbody>
            ${members.map((item, idx) => `
              <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background: #ffffff;' : 'background: #f8fafc;'}">
                <td style="padding: 8px; color: #64748b;">${idx + 1}</td>
                <td style="padding: 8px; font-weight: 600; color: #047857;">${item.member ? item.member.matricule : 'N/A'}</td>
                <td style="padding: 8px; font-weight: 600; color: #1e293b;">${item.member ? item.member.fullName : 'Membre'}</td>
                <td style="padding: 8px; color: #475569;">${item.member ? (item.member.relationToChef || 'Membre') : 'Membre'}</td>
                <td style="padding: 8px; text-align: center; font-weight: 600; color: #0f766e;">${item.months} mois</td>
                <td style="padding: 8px; text-align: right; font-weight: 700; color: #065f46;">${formatMoney(item.amount, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      ${unreadyMembers && unreadyMembers.length > 0 ? `
        <!-- Bloc des membres non prêts (cotisations reportées) -->
        <div style="margin-bottom: 18px; padding: 12px 14px; border-radius: 8px; background: #fff1f2; border: 1.5px dashed #f43f5e; font-size: 12px; color: #9f1239;">
          <div style="font-weight: 700; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>⏳</span> Membre(s) non prêt(s) lors de ce passage (Cotisation reportée / non encaissée) :
          </div>
          <div style="margin: 6px 0;">
            ${unreadyMembers.map(u => `<span style="display: inline-block; background: #ffe4e6; padding: 2px 8px; border-radius: 4px; margin: 2px; font-weight: 600;">• ${u.fullName} (${u.matricule})</span>`).join(' ')}
          </div>
          <p style="font-size: 11px; margin-top: 4px; opacity: 0.9; margin-bottom: 0;">
            <em>Note officielle : Ces membres du foyer n'ont pas été encaissés ce jour et restent redevables de leur cotisation ultérieure.</em>
          </p>
        </div>
      ` : ''}

      <div class="receipt-amount-box">
        <span style="font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: 700;">Total Encaissé pour le Groupe (${members.length} membres réglés • ${totalMonths} mois)</span>
        <h3>${formatMoney(totalAmount, currency)}</h3>
        <p style="font-size: 12px; color: #4b5569; margin-top: 4px;">Règlement effectué par : <strong>${chef ? chef.fullName : 'Représentant'}</strong> • Mode : <strong>${modePaiement}</strong></p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 12px;">
        <div style="text-align: center;">
          <p style="font-weight: 600; margin-bottom: 30px;">Le Chef de Famille Cotisant</p>
          <p style="color: #6b7280; font-weight: 600;">${chef ? chef.fullName : 'Représentant'}</p>
        </div>
        <div style="text-align: center;">
          <p style="font-weight: 600; margin-bottom: 30px;">Pour le Bureau Exécutif (Trésorerie)</p>
          <p style="color: #047857; font-weight: 600;">Seydou Coulibaly (Trésorier Général)</p>
        </div>
      </div>
    </div>
  `;

  openModal('modalReceipt');
}

// Modal d'édition d'un membre du bureau
function openEditBureauModal(bureauId) {
  const data = TAGBA_DB.get();
  const post = data.bureau.find(b => b.id === bureauId);
  if (!post) return;

  document.getElementById('editBureauId').value = post.id;
  document.getElementById('editBureauRole').textContent = post.role;
  document.getElementById('editBureauName').value = post.name;
  document.getElementById('editBureauPhone').value = post.phone;
  document.getElementById('editBureauEmail').value = post.email;
  document.getElementById('editBureauBio').value = post.bio;

  openModal('modalEditBureau');
}

// Impression des Statuts
function imprimerStatuts() {
  window.print();
}

// Sauvegarde et Exportation JSON
function exporterDonnees() {
  try {
    const data = TAGBA_DB.get();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.href = url;
    dlAnchorElem.download = `TAGBA_MUTUELLE_SAUVEGARDE_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();

    setTimeout(() => {
      document.body.removeChild(dlAnchorElem);
      URL.revokeObjectURL(url);
    }, 150);

    showToast('📥 Sauvegarde JSON téléchargée avec succès !');
  } catch (err) {
    console.error('Erreur lors de l’export', err);
    showToast('Erreur lors du téléchargement de la sauvegarde', 'error');
  }
}

// Restauration d'une sauvegarde depuis un fichier JSON
function importerFichierJSON(event) {
  if (!assertPermission('write', 'la restauration des données')) return;
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (!importedData.members || !importedData.families || !importedData.config) {
        throw new Error('Format de sauvegarde invalide');
      }

      TAGBA_DB.save(importedData);
      showToast('✅ Sauvegarde restaurée avec succès !');
      renderAllViews();
      loadConfigForm();
    } catch (err) {
      console.error('Erreur importation', err);
      showToast('Fichier JSON invalide ou corrompu', 'error');
    }
  };
  reader.readAsText(file);
}

function resetDemoData() {
  if (!assertPermission('write', 'la réinitialisation des données')) return;
  if (confirm('Voulez-vous réinitialiser toutes les données avec les données de démonstration officielles de la Mutuelle TAGBA ?')) {
    TAGBA_DB.resetToDefault();
    showToast('Données réinitialisées avec succès');
    renderAllViews();
    loadConfigForm();
  }
}

// ============================================================================
// GESTION COMPLÈTE DE LA CAISSE, DES DÉPENSES ET DES DONS VOLONTAIRES NOMINATIFS
// ============================================================================

let currentFinanceSubTab = 'depenses';
let currentDepFinancementMode = '100_caisse'; // '100_caisse', '100_volontaire', 'mixte'

function switchFinanceSubTab(subTab) {
  currentFinanceSubTab = subTab;
  const btnDepenses = document.getElementById('btnFinSubTabDepenses');
  const btnDons = document.getElementById('btnFinSubTabDons');
  const btnJournal = document.getElementById('btnFinSubTabJournal');
  const viewDepenses = document.getElementById('financeDepensesView');
  const viewDons = document.getElementById('financeDonsView');
  const viewJournal = document.getElementById('financeJournalView');

  if (btnDepenses) btnDepenses.classList.toggle('active', subTab === 'depenses');
  if (btnDons) btnDons.classList.toggle('active', subTab === 'dons');
  if (btnJournal) btnJournal.classList.toggle('active', subTab === 'journal');

  if (viewDepenses) viewDepenses.style.display = subTab === 'depenses' ? 'block' : 'none';
  if (viewDons) viewDons.style.display = subTab === 'dons' ? 'block' : 'none';
  if (viewJournal) viewJournal.style.display = subTab === 'journal' ? 'block' : 'none';

  if (subTab === 'depenses') {
    renderDepenses();
  } else if (subTab === 'dons') {
    renderContributionsVolontaires();
  } else if (subTab === 'journal') {
    renderLivreCaisse();
  }
}

function renderFinances() {
  const data = TAGBA_DB.get();
  const fin = TAGBA_DB.getCaisseFinances();
  const cfg = data.config || {};
  const currency = cfg.devise || 'FCFA';

  // 1. Grand affichage du solde net en caisse
  const soldeDisplay = document.getElementById('caisseSoldeNetDisplay');
  const totalEntreesDisplay = document.getElementById('caisseTotalEntreesDisplay');
  const totalSortiesDisplay = document.getElementById('caisseTotalSortiesDisplay');
  const formuleDetail = document.getElementById('caisseFormuleDetail');

  if (soldeDisplay) soldeDisplay.textContent = formatMoney(fin.soldeNet, currency);
  if (totalEntreesDisplay) totalEntreesDisplay.textContent = formatMoney(fin.totalEntreesGlobal, currency);
  if (totalSortiesDisplay) totalSortiesDisplay.textContent = formatMoney(fin.depensesCaisse, currency);

  if (formuleDetail) {
    formuleDetail.innerHTML = `
      Fonds initial (<strong>${formatMoney(fin.fondsDepart, currency)}</strong>) 
      + Cotisations obligatoires (<strong>${formatMoney(fin.cotisations, currency)}</strong>) 
      + Dons volontaires reçus (<strong>${formatMoney(fin.donsVolontaires, currency)}</strong>) 
      - Dépenses prélevées sur caisse (<strong>${formatMoney(fin.depensesCaisse, currency)}</strong>) 
      = <strong>${formatMoney(fin.soldeNet, currency)}</strong>.
    `;
  }

  // 2. 4 Cartes KPI financières
  const kpiFondsDepart = document.getElementById('kpiFinFondsDepart');
  const kpiCotisations = document.getElementById('kpiFinCotisations');
  const kpiDonsVolontaires = document.getElementById('kpiFinDonsVolontaires');
  const kpiDepensesCaisse = document.getElementById('kpiFinDepensesCaisse');

  if (kpiFondsDepart) kpiFondsDepart.textContent = formatMoney(fin.fondsDepart, currency);
  if (kpiCotisations) kpiCotisations.textContent = formatMoney(fin.cotisations, currency);
  if (kpiDonsVolontaires) kpiDonsVolontaires.textContent = formatMoney(fin.donsVolontaires, currency);
  if (kpiDepensesCaisse) kpiDepensesCaisse.textContent = formatMoney(fin.depensesCaisse, currency);

  // 3. Rendu de la vue active
  if (currentFinanceSubTab === 'depenses') {
    renderDepenses();
  } else if (currentFinanceSubTab === 'dons') {
    renderContributionsVolontaires();
  } else if (currentFinanceSubTab === 'journal') {
    renderLivreCaisse();
  }
}

// Rendu du tableau des dépenses
function renderDepenses() {
  const data = TAGBA_DB.get();
  const depenses = data.depenses || [];
  const tbody = document.getElementById('tableDepensesBody');
  if (!tbody) return;

  const cfg = data.config || {};
  const currency = cfg.devise || 'FCFA';

  if (depenses.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">
          Aucune dépense enregistrée pour le moment.
        </td>
      </tr>
    `;
    return;
  }

  // Tri antéchronologique (les plus récentes d'abord)
  const sorted = [...depenses].sort((a, b) => new Date(b.datePaiement || 0) - new Date(a.datePaiement || 0));

  tbody.innerHTML = sorted.map(dep => {
    let catBadgeClass = 'badge-secondary';
    if (dep.categorie === 'Entraide Sociale') catBadgeClass = 'badge-primary';
    else if (dep.categorie === 'Cérémonie') catBadgeClass = 'badge-gold';
    else if (dep.categorie === 'Fonctionnement') catBadgeClass = 'badge-success';

    const partCaisseDisplay = dep.partCaisse > 0
      ? `<strong style="color: var(--rose-400);">${formatMoney(dep.partCaisse, currency)}</strong>`
      : `<span style="color: var(--text-dim);">0 ${currency}</span>`;

    const partVolontaireDisplay = dep.partVolontaire > 0
      ? `<strong style="color: #a78bfa;">${formatMoney(dep.partVolontaire, currency)}</strong>`
      : `<span style="color: var(--text-dim);">0 ${currency}</span>`;

    const cibleBadge = dep.cibleTitre ? `
      <div style="margin-top: 4px;">
        <span class="badge ${dep.cibleType === 'Cérémonie' ? 'badge-gold' : 'badge-primary'}" style="font-size: 10px;">
          ${dep.cibleType || 'Dossier'} : ${dep.cibleTitre}
        </span>
      </div>
    ` : '';

    return `
      <tr>
        <td>
          <code style="color: var(--emerald-400); font-size: 11px; font-weight: 700;">${dep.recuNum || dep.id}</code>
        </td>
        <td>
          <strong>${dep.titre}</strong>
          ${cibleBadge}
          ${dep.justificatif ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">📄 Justif: ${dep.justificatif}</div>` : ''}
        </td>
        <td>
          <span class="badge ${catBadgeClass}">${dep.categorie}</span>
        </td>
        <td>
          <span>${dep.beneficiaire}</span>
          <div style="font-size: 11px; color: var(--text-muted);">${dep.modePaiement || 'Espèces'}</div>
        </td>
        <td>
          <strong style="color: var(--text-main); font-size: 13px;">${formatMoney(dep.montantTotal, currency)}</strong>
        </td>
        <td>${partCaisseDisplay}</td>
        <td>${partVolontaireDisplay}</td>
        <td>
          <span style="font-size: 12px; color: var(--text-muted);">${formatDate(dep.datePaiement)}</span>
        </td>
      </tr>
    `;
  }).join('');
}

// Rendu du tableau des contributions volontaires nominatives
function renderContributionsVolontaires() {
  const data = TAGBA_DB.get();
  const dons = data.contributionsVolontaires || [];
  const tbody = document.getElementById('tableDonsBody');
  if (!tbody) return;

  const cfg = data.config || {};
  const currency = cfg.devise || 'FCFA';

  if (dons.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
          Aucune contribution volontaire enregistrée pour le moment.
        </td>
      </tr>
    `;
    return;
  }

  // Tri antéchronologique
  const sorted = [...dons].sort((a, b) => new Date(b.datePaiement || 0) - new Date(a.datePaiement || 0));

  tbody.innerHTML = sorted.map(don => {
    const isCeremonie = don.cibleType === 'Cérémonie';
    const targetBadgeClass = isCeremonie ? 'badge-gold' : (don.cibleType === 'Entraide' ? 'badge-primary' : 'badge-success');

    return `
      <tr>
        <td>
          <code style="color: #a78bfa; font-size: 11px; font-weight: 700;">${don.recuNum || don.id}</code>
        </td>
        <td>
          ${(() => {
        const isExt = !don.familyId || (don.familyChef && (don.familyChef.includes('Association') || don.familyChef.includes('Partenaire') || don.familyChef.includes('Contact')));
        const icon = isExt ? '🏢' : '❤️';
        const sub = isExt ? `<span style="color: var(--gold-400); font-weight: 600;">${don.familyChef || 'Autre Association'}</span>` : `Foyer de : <strong>${don.familyChef || 'Famille'}</strong>`;
        return `
              <div style="font-weight: 700; color: var(--text-main); font-size: 13px;">
                ${icon} ${don.memberName}
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                ${sub}
              </div>
            `;
      })()}
        </td>
        <td>
          <span class="badge ${targetBadgeClass}" style="font-size: 10px;">${don.cibleType}</span>
          <div style="font-weight: 600; font-size: 12px; color: var(--text-secondary); margin-top: 3px;">
            ${don.cibleTitre || 'Caisse de Solidarité'}
          </div>
          ${don.note ? `<div style="font-size: 11px; color: var(--text-dim); font-style: italic;">« ${don.note} »</div>` : ''}
        </td>
        <td>
          <strong style="color: var(--emerald-400); font-size: 14px;">${formatMoney(don.montant, currency)}</strong>
        </td>
        <td>
          <span class="badge badge-secondary" style="font-size: 10px;">${don.modePaiement}</span>
        </td>
        <td>
          <span style="font-size: 12px; color: var(--text-muted);">${formatDate(don.datePaiement)}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="openReceiptDonationModal('${don.id}')" title="Imprimer le Reçu Officiel">
            🧾 Reçu
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Rendu du Livre Journal de Caisse chronologique
function renderLivreCaisse() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const currency = cfg.devise || 'FCFA';
  const tbody = document.getElementById('tableLivreCaisseBody');
  if (!tbody) return;

  const flux = [];

  // 1. Fonds initial de départ
  const fondsDepart = Number(cfg.fondsDepart) || 0;
  if (fondsDepart > 0) {
    flux.push({
      date: cfg.dateDebutCotisations || '2026-10-04',
      type: 'Dotation Initiale',
      badgeClass: 'badge-secondary',
      libelle: 'Dotation de Caisse - Fonds Initial de Démarrage',
      tiers: 'Mutuelle TAGBA',
      entree: fondsDepart,
      sortie: 0,
      mode: 'Fondation'
    });
  }

  // 2. Cotisations ordinaires
  (data.cotisations || []).forEach(c => {
    flux.push({
      date: c.datePaiement || '2026-10-04',
      type: 'Cotisation Ordinaire',
      badgeClass: 'badge-success',
      libelle: `Versement ${c.typeCotisation || 'Mensuel'} (${c.periode || ''})`,
      tiers: `${c.memberName} (${c.memberMatricule || ''})`,
      entree: Number(c.montant) || 0,
      sortie: 0,
      mode: c.modePaiement || 'Wave',
      ref: c.recuNum
    });
  });

  // 3. Contributions volontaires (Dons)
  (data.contributionsVolontaires || []).forEach(d => {
    flux.push({
      date: d.datePaiement || '2026-10-04',
      type: `Don Volontaire (${d.cibleType})`,
      badgeClass: 'badge-gold',
      libelle: `Don pour ${d.cibleTitre}`,
      tiers: (() => {
        const isExt = !d.familyId || (d.familyChef && (d.familyChef.includes('Association') || d.familyChef.includes('Partenaire') || d.familyChef.includes('Contact')));
        return isExt ? `🏢 ${d.memberName} (${d.familyChef})` : `❤️ ${d.memberName} (Foyer ${d.familyChef})`;
      })(),
      entree: Number(d.montant) || 0,
      sortie: 0,
      mode: d.modePaiement || 'Wave',
      ref: d.recuNum
    });
  });

  // 4. Dépenses prélevées sur caisse
  (data.depenses || []).forEach(dep => {
    const partCaisse = Number(dep.partCaisse) || 0;
    if (partCaisse > 0) {
      flux.push({
        date: dep.datePaiement || '2026-10-04',
        type: `Dépense Caisse (${dep.categorie})`,
        badgeClass: 'badge-danger',
        libelle: dep.titre + (dep.cibleTitre ? ` (${dep.cibleTitre})` : ''),
        tiers: `Bénéficiaire : ${dep.beneficiaire}`,
        entree: 0,
        sortie: partCaisse,
        mode: dep.modePaiement || 'Espèces',
        ref: dep.recuNum
      });
    }
  });

  // Tri chronologique croissant pour calculer le solde cumulé
  flux.sort((a, b) => new Date(a.date) - new Date(b.date));

  let soldeCumule = 0;
  flux.forEach(op => {
    soldeCumule += (op.entree - op.sortie);
    op.soldeApres = soldeCumule;
  });

  // Affichage en ordre antéchronologique (les plus récents en premier)
  const fluxAffiche = [...flux].reverse();

  if (fluxAffiche.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
          Aucun mouvement de caisse enregistré.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = fluxAffiche.map(op => {
    const entreeDisplay = op.entree > 0
      ? `<strong style="color: var(--emerald-400);">+ ${formatMoney(op.entree, currency)}</strong>`
      : `<span style="color: var(--text-dim);">-</span>`;

    const sortieDisplay = op.sortie > 0
      ? `<strong style="color: var(--rose-400);">- ${formatMoney(op.sortie, currency)}</strong>`
      : `<span style="color: var(--text-dim);">-</span>`;

    return `
      <tr>
        <td><span style="font-size: 12px; color: var(--text-muted);">${formatDate(op.date)}</span></td>
        <td><span class="badge ${op.badgeClass}" style="font-size: 10px;">${op.type}</span></td>
        <td>
          <strong>${op.libelle}</strong>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${op.tiers}</div>
        </td>
        <td>${entreeDisplay}</td>
        <td>${sortieDisplay}</td>
        <td>
          <strong style="color: var(--text-main); font-size: 13px;">${formatMoney(op.soldeApres, currency)}</strong>
        </td>
        <td>
          <span style="font-size: 11px; color: var(--text-secondary);">${op.mode}</span>
          ${op.ref ? `<div style="font-size: 10px; color: var(--text-dim);">${op.ref}</div>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

// Initialisation et gestion du modal Ajouter une Dépense
function initModalAddDepense() {
  const depDate = document.getElementById('depDate');
  if (depDate) depDate.value = new Date().toISOString().split('T')[0];

  const depMontant = document.getElementById('depMontantTotal');
  if (depMontant && (!depMontant.value || Number(depMontant.value) <= 0)) {
    depMontant.value = '50000';
  }

  setDepenseFinancementMode('100_caisse');
  onDepenseCategorieChanged();
}

function setDepenseFinancementMode(mode) {
  currentDepFinancementMode = mode;
  const btnCaisse = document.getElementById('btnDepFinCaisse100');
  const btnVolontaire = document.getElementById('btnDepFinVolontaire100');
  const btnMixte = document.getElementById('btnDepFinMixte');
  const partCaisseInput = document.getElementById('depPartCaisse');
  const partVolontaireInput = document.getElementById('depPartVolontaire');
  const helpText = document.getElementById('depRepartitionHelp');
  const montantTotal = Number(document.getElementById('depMontantTotal')?.value) || 0;

  if (btnCaisse) btnCaisse.classList.toggle('active', mode === '100_caisse');
  if (btnVolontaire) btnVolontaire.classList.toggle('active', mode === '100_volontaire');
  if (btnMixte) btnMixte.classList.toggle('active', mode === 'mixte');

  if (mode === '100_caisse') {
    if (partCaisseInput) partCaisseInput.value = montantTotal;
    if (partVolontaireInput) partVolontaireInput.value = 0;
    if (helpText) helpText.textContent = "100% prélevé sur la Caisse Centrale. Déduit intégralement du solde net.";
  } else if (mode === '100_volontaire') {
    if (partCaisseInput) partCaisseInput.value = 0;
    if (partVolontaireInput) partVolontaireInput.value = montantTotal;
    if (helpText) helpText.textContent = "100% financé par les dons volontaires des membres. La caisse centrale n'est pas débitée.";
  } else {
    // Mixte
    const demi = Math.round(montantTotal / 2);
    if (partCaisseInput) partCaisseInput.value = demi;
    if (partVolontaireInput) partVolontaireInput.value = montantTotal - demi;
    if (helpText) helpText.textContent = "Répartition partagée entre la caisse centrale et les contributions volontaires des membres.";
  }
}

function calcDepenseFinancementRepartition() {
  if (currentDepFinancementMode !== 'mixte') {
    setDepenseFinancementMode(currentDepFinancementMode);
  } else {
    // Si en mode mixte, ajuster la part volontaire pour que le total concorde
    const total = Number(document.getElementById('depMontantTotal')?.value) || 0;
    const partCaisse = Number(document.getElementById('depPartCaisse')?.value) || 0;
    const partVolontaireInput = document.getElementById('depPartVolontaire');
    if (partVolontaireInput) {
      partVolontaireInput.value = Math.max(0, total - partCaisse);
    }
  }
}

function onDepPartManualInput() {
  currentDepFinancementMode = 'mixte';
  const btnCaisse = document.getElementById('btnDepFinCaisse100');
  const btnVolontaire = document.getElementById('btnDepFinVolontaire100');
  const btnMixte = document.getElementById('btnDepFinMixte');
  if (btnCaisse) btnCaisse.classList.remove('active');
  if (btnVolontaire) btnVolontaire.classList.remove('active');
  if (btnMixte) btnMixte.classList.add('active');

  const total = Number(document.getElementById('depMontantTotal')?.value) || 0;
  const partCaisse = Number(document.getElementById('depPartCaisse')?.value) || 0;
  const partVol = Number(document.getElementById('depPartVolontaire')?.value) || 0;
  const helpText = document.getElementById('depRepartitionHelp');

  if (helpText) {
    if (partCaisse + partVol !== total) {
      helpText.innerHTML = `<span style="color: var(--rose-400);">⚠️ Attention : La somme (${formatMoney(partCaisse + partVol, 'FCFA')}) doit être égale au montant total (${formatMoney(total, 'FCFA')}).</span>`;
    } else {
      helpText.textContent = `Répartition équilibrée : ${formatMoney(partCaisse, 'FCFA')} Caisse + ${formatMoney(partVol, 'FCFA')} Dons Volontaires.`;
    }
  }
}

function onDepenseCategorieChanged() {
  const cat = document.getElementById('depCategorie')?.value;
  const cibleSelect = document.getElementById('depCibleSelect');
  if (!cibleSelect) return;

  const data = TAGBA_DB.get();
  cibleSelect.innerHTML = '<option value="">-- Aucun rattachement direct --</option>';

  if (cat === 'Entraide Sociale') {
    (data.entraide || []).forEach(e => {
      cibleSelect.innerHTML += `
        <option value="Entraide|${e.id}|${e.typeProbleme} (${e.memberName})">
          🤝 [Cas Social] ${e.typeProbleme} - ${e.memberName}
        </option>
      `;
    });
  } else if (cat === 'Cérémonie') {
    (data.ceremonies || []).forEach(c => {
      cibleSelect.innerHTML += `
        <option value="Cérémonie|${c.id}|${c.titre}">
          🎉 [Cérémonie] ${c.titre} (${formatDate(c.date)})
        </option>
      `;
    });
  } else {
    // Afficher les deux types en option
    const optgroupEntraide = document.createElement('optgroup');
    optgroupEntraide.label = "Cas Sociaux d'Entraide";
    (data.entraide || []).forEach(e => {
      optgroupEntraide.innerHTML += `
        <option value="Entraide|${e.id}|${e.typeProbleme} (${e.memberName})">
          🤝 ${e.typeProbleme} - ${e.memberName}
        </option>
      `;
    });
    if (optgroupEntraide.children.length > 0) cibleSelect.appendChild(optgroupEntraide);

    const optgroupCeremonie = document.createElement('optgroup');
    optgroupCeremonie.label = "Cérémonies Familiales";
    (data.ceremonies || []).forEach(c => {
      optgroupCeremonie.innerHTML += `
        <option value="Cérémonie|${c.id}|${c.titre}">
          🎉 ${c.titre}
        </option>
      `;
    });
    if (optgroupCeremonie.children.length > 0) cibleSelect.appendChild(optgroupCeremonie);
  }
}

// Initialisation et gestion du modal Ajouter une Contribution Volontaire
function initModalAddContribution(targetType, targetId, targetTitre) {
  const donDate = document.getElementById('donDate');
  if (donDate) donDate.value = new Date().toISOString().split('T')[0];

  const data = TAGBA_DB.get();
  const members = data.members || [];
  const memberSelect = document.getElementById('donMemberSelect');
  const searchInput = document.getElementById('donMemberSearchInput');
  if (searchInput) searchInput.value = '';

  populateDonMemberSelect(members);

  if (searchInput) {
    searchInput.oninput = function () {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = members.filter(m =>
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.matricule || '').toLowerCase().includes(q) ||
        (m.phone || '').includes(q)
      );
      populateDonMemberSelect(filtered);
    };
  }

  // Destination
  const cibleTypeSelect = document.getElementById('donCibleType');
  if (targetType && cibleTypeSelect) {
    cibleTypeSelect.value = targetType;
  }
  onDonCibleTypeChanged(targetId, targetTitre);
}

function populateDonMemberSelect(membersList) {
  const memberSelect = document.getElementById('donMemberSelect');
  if (!memberSelect) return;
  const data = TAGBA_DB.get();
  const families = data.families || [];

  if (membersList.length === 0) {
    memberSelect.innerHTML = '<option value="">Aucun membre trouvé</option>';
    return;
  }

  memberSelect.innerHTML = membersList.map(m => {
    const fam = families.find(f => f.id === m.familyId);
    const chefName = fam ? fam.chefFamille : 'Inconnu';
    return `<option value="${m.id}">${m.fullName} (${m.matricule}) - Foyer de ${chefName}</option>`;
  }).join('');
}

function toggleDonOriginType(type) {
  const grpMembre = document.getElementById('grpDonMembreInterne');
  const grpExt = document.getElementById('grpDonExterne');
  const donCibleType = document.getElementById('donCibleType');
  const donMemberSelect = document.getElementById('donMemberSelect');
  const donNomExt = document.getElementById('donNomExterne');

  if (type === 'externe') {
    if (grpMembre) grpMembre.style.display = 'none';
    if (grpExt) grpExt.style.display = 'block';
    if (donNomExt) donNomExt.focus();
    if (donCibleType && (donCibleType.value === 'Cérémonie' || donCibleType.value === 'Entraide')) {
      donCibleType.value = 'Subvention / Partenariat';
    }
    onDonCibleTypeChanged();
  } else {
    if (grpMembre) grpMembre.style.display = 'block';
    if (grpExt) grpExt.style.display = 'none';
    if (donCibleType && donCibleType.value === 'Subvention / Partenariat') {
      donCibleType.value = 'Caisse Solidarité';
    }
    onDonCibleTypeChanged();
  }
}

function onDonCibleTypeChanged(targetIdToSelect, targetTitreToSelect) {
  const cibleType = document.getElementById('donCibleType')?.value || 'Caisse Solidarité';
  const cibleSelect = document.getElementById('donCibleSelect');
  if (!cibleSelect) return;

  const data = TAGBA_DB.get();
  cibleSelect.innerHTML = '';

  if (cibleType === 'Cérémonie') {
    const ceremonies = data.ceremonies || [];
    if (ceremonies.length === 0) {
      cibleSelect.innerHTML = '<option value="">Aucune cérémonie programmée</option>';
    } else {
      ceremonies.forEach(c => {
        const selected = targetIdToSelect === c.id ? 'selected' : '';
        cibleSelect.innerHTML += `
          <option value="${c.id}|${c.titre}" ${selected}>
            🎉 ${c.titre} (${formatDate(c.date)})
          </option>
        `;
      });
    }
  } else if (cibleType === 'Entraide') {
    const entraides = data.entraide || [];
    if (entraides.length === 0) {
      cibleSelect.innerHTML = '<option value="">Aucun cas social ouvert</option>';
    } else {
      entraides.forEach(e => {
        const selected = targetIdToSelect === e.id ? 'selected' : '';
        cibleSelect.innerHTML += `
          <option value="${e.id}|${e.typeProbleme} (${e.memberName})" ${selected}>
            🤝 ${e.typeProbleme} - ${e.memberName} (${formatDate(e.dateDeclaration)})
          </option>
        `;
      });
    }
  } else if (cibleType === 'Subvention / Partenariat') {
    cibleSelect.innerHTML = '<option value="subvention-partenaire|Subvention / Appui Financier Partenaire">🤝 Subvention / Appui Financier d’une Autre Association ou Partenaire</option>';
  } else {
    // Caisse Solidarité
    cibleSelect.innerHTML = '<option value="caisse-solidarite|Caisse de Solidarité Générale">🏛️ Caisse Générale de Secours & Solidarité TAGBA</option>';
  }
}

// Raccourci pour donner directement depuis les cartes d'entraide ou de cérémonies
function quickDonateToTarget(cibleType, cibleId, cibleTitre) {
  openModal('modalAddContributionVolontaire');
  initModalAddContribution(cibleType, cibleId, cibleTitre);
}

// Modal Reçu de Don Volontaire (Nominatif & Imprimable)
function openReceiptDonationModal(donId) {
  const data = TAGBA_DB.get();
  const don = (data.contributionsVolontaires || []).find(d => d.id === donId);
  if (!don) {
    showToast('Reçu de don introuvable', 'error');
    return;
  }

  const container = document.getElementById('receiptDonationContent');
  if (!container) return;

  const cfg = data.config || {};
  const currency = cfg.devise || 'FCFA';

  container.innerHTML = `
    <div style="background: #ffffff; color: #1e293b; padding: 24px; border-radius: 8px; font-family: 'Inter', sans-serif; border: 1px solid #cbd5e1;">
      <!-- En-tête officiel -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 18px;">
        <div>
          <h2 style="margin: 0; color: #047857; font-size: 20px; text-transform: uppercase; font-weight: 800;">MUTUELLE TAGBA</h2>
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">ASSOCIATION D'ENTRAIDE FAMILIALE & SOLIDARITÉ</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Trésorerie Générale • Caisse de Solidarité</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #64748b; text-transform: uppercase;">REÇU OFFICIEL DE CONTRIBUTION VOLONTAIRE</div>
          <div style="font-size: 16px; font-weight: 800; color: #047857;">N° ${don.recuNum || don.id}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Date : ${formatDate(don.datePaiement)}</div>
        </div>
      </div>

      <!-- Corps du Reçu -->
      ${(() => {
      const isExt = !don.familyId || (don.familyChef && (don.familyChef.includes('Association') || don.familyChef.includes('Partenaire') || don.familyChef.includes('Contact')));
      return `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 18px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">
            ${isExt ? 'ORGANISATION / ASSOCIATION DONATRICE :' : 'BIENFAITEUR / MEMBRE DONATEUR :'}
          </div>
          <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">
            ${isExt ? '🏢' : '❤️'} ${don.memberName}
          </div>
          <div style="font-size: 13px; color: #475569; margin-top: 2px;">
            ${isExt ? `Origine / Info : <strong>${don.familyChef || 'Partenaire Extérieur'}</strong>` : `Foyer familial : <strong>Famille ${don.familyChef || 'TAGBA'}</strong>`}
          </div>
        </div>
        `;
    })()}

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 13px;">
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; width: 45%;">Objet / Affectation du Don :</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${don.cibleType} : ${don.cibleTitre}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Mode de Versement :</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${don.modePaiement}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Encaissé et Certifié par :</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0f172a;">${don.agent || 'Le Trésorier Général'}</td>
          </tr>
          ${don.note ? `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b;">Message d'Accompagnement :</td>
            <td style="padding: 8px 0; font-style: italic; color: #334155;">« ${don.note} »</td>
          </tr>
          ` : ''}
        </tbody>
      </table>

      <!-- Montant Mis en Évidence -->
      <div style="background: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; color: #065f46; font-weight: 700;">MONTANT TOTAL DU DON :</span>
          <div style="font-size: 24px; font-weight: 900; color: #047857;">${formatMoney(don.montant, currency)}</div>
        </div>
        <div style="text-align: right; color: #047857; font-size: 28px;">
          ✓
        </div>
      </div>

      <!-- Signature et Mention de Gratitude -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b;">
        <div>
          <em>« Que la solidarité et la bénédiction demeurent dans chaque foyer TAGBA. »</em>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 30px;">Cachet & Signature du Bureau</div>
          <div style="border-top: 1px solid #94a3b8; width: 140px; margin: 0 auto; padding-top: 4px;">Le Trésorier</div>
        </div>
      </div>
    </div>
  `;

  openModal('modalReceiptDonation');
}

// Initialisation des écouteurs pour les formulaires de Dépenses et de Dons
function setupFinanceEventListeners() {
  const formDepense = document.getElementById('formAddDepense');
  if (formDepense) {
    formDepense.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!assertPermission('write', 'l’enregistrement d’une dépense')) return;

      const titre = document.getElementById('depTitre')?.value.trim();
      const categorie = document.getElementById('depCategorie')?.value;
      const beneficiaire = document.getElementById('depBeneficiaire')?.value.trim();
      const montantTotal = Number(document.getElementById('depMontantTotal')?.value) || 0;
      const partCaisse = Number(document.getElementById('depPartCaisse')?.value) || 0;
      const partVolontaire = Number(document.getElementById('depPartVolontaire')?.value) || 0;
      const datePaiement = document.getElementById('depDate')?.value;
      const modePaiement = document.getElementById('depMode')?.value;
      const justificatif = document.getElementById('depJustificatif')?.value.trim();

      // Vérification d'équilibre
      if (partCaisse + partVolontaire !== montantTotal) {
        showToast('Erreur : La somme (Caisse + Dons) doit être égale au montant total de la dépense', 'error');
        return;
      }

      // Traitement du rattachement
      const cibleRaw = document.getElementById('depCibleSelect')?.value;
      let cibleType = '';
      let cibleId = '';
      let cibleTitre = '';

      if (cibleRaw) {
        const parts = cibleRaw.split('|');
        cibleType = parts[0] || '';
        cibleId = parts[1] || '';
        cibleTitre = parts[2] || '';
      }

      const currentUser = getCurrentUser();

      const dep = {
        titre,
        categorie,
        cibleType,
        cibleId,
        cibleTitre,
        beneficiaire,
        montantTotal,
        partCaisse,
        partVolontaire,
        datePaiement,
        modePaiement,
        justificatif,
        validePar: currentUser.nom
      };

      TAGBA_DB.addDepense(dep);
      showToast(`📉 Dépense "${titre}" de ${formatMoney(montantTotal, 'FCFA')} enregistrée avec succès !`);
      closeModal('modalAddDepense');
      formDepense.reset();

      renderFinances();
      renderDashboard();
      renderEntraide();
      renderCeremonies();
    });
  }

  function submitContributionVolontaireForm(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!assertPermission('write', 'l\'enregistrement d\'un don')) return;

    const formDon = document.getElementById('formAddContributionVolontaire');
    const originType = document.querySelector('input[name="donOriginType"]:checked')?.value || 'membre';
    const data = TAGBA_DB.get();

    let memberId = null;
    let memberName = '';
    let familyId = null;
    let familyChef = '';

    if (originType === 'externe') {
      const extNomInput = document.getElementById('donNomExterne');
      const extContactInput = document.getElementById('donContactExterne');
      const nomExt = extNomInput ? extNomInput.value.trim() : '';
      const contactExt = extContactInput ? extContactInput.value.trim() : '';

      if (!nomExt) {
        showToast('âš ï¸ Veuillez saisir le nom de l\'2organisation ou du donateur externe en haut du formulaire', 'error');
        if (extNomInput) {
          extNomInput.focus();
          extNomInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      memberId = 'EXT-' + Date.now();
      memberName = nomExt;
      familyId = null;
      familyChef = contactExt ? `Contact : ${contactExt}` : 'Autre Association / Partenaire Externe';
    } else {
      memberId = document.getElementById('donMemberSelect')?.value;
      const member = (data.members || []).find(m => m.id === memberId);
      if (!member) {
        showToast('âš ï¸ Veuillez sÃ©lectionner le membre donateur dans la liste (ou cochez "Autre Association / Donateur Externe" si le don provient d\'un tiers)', 'error');
        const memSel = document.getElementById('donMemberSelect');
        if (memSel) {
          memSel.focus();
          memSel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
      memberName = member.fullName;
      familyId = member.familyId;
      const family = (data.families || []).find(f => f.id === member.familyId);
      familyChef = family ? (family.chefFamille || family.chefDeFamille) : 'Famille TAGBA';
    }

    const cibleType = document.getElementById('donCibleType')?.value || 'Caisse SolidaritÃ©';
    const cibleRaw = document.getElementById('donCibleSelect')?.value;
    let cibleId = '';
    let cibleTitre = '';

    if (cibleRaw) {
      const parts = cibleRaw.split('|');
      cibleId = parts[0] || '';
      cibleTitre = parts[1] || '';
    }
    if (!cibleId || !cibleTitre) {
      cibleId = 'caisse-solidarite';
      cibleTitre = 'Caisse de SolidaritÃ© GÃ©nÃ©rale';
    }

    const montantInput = document.getElementById('donMontant');
    const montant = Number(montantInput ? montantInput.value : 0);
    if (!montant || montant <= 0 || isNaN(montant)) {
      showToast('âš ï¸ Veuillez saisir un montant de don valide (supÃ©rieur Ã  0 FCFA)', 'error');
      if (montantInput) {
        montantInput.focus();
        montantInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const dateInput = document.getElementById('donDate');
    let datePaiement = dateInput ? dateInput.value : '';
    if (!datePaiement) {
      datePaiement = new Date().toISOString().split('T')[0];
      if (dateInput) dateInput.value = datePaiement;
    }

    const modePaiement = document.getElementById('donMode')?.value || 'EspÃ¨ces';
    const note = (document.getElementById('donNote')?.value || '').trim();
    const currentUser = getCurrentUser();

    const don = {
      memberId: memberId,
      memberName: memberName,
      familyId: familyId,
      familyChef: familyChef,
      cibleType: cibleType,
      cibleId: cibleId,
      cibleTitre: cibleTitre,
      montant: montant,
      modePaiement: modePaiement,
      datePaiement: datePaiement,
      note: note,
      agent: currentUser.name || currentUser.nom || 'TrÃ©sorier'
    };

    const newDon = TAGBA_DB.addContributionVolontaire(don);
    const iconSuccess = originType === 'externe' ? 'ðŸ¢' : 'â¤ï¸';
    showToast(`${iconSuccess} Don de ${formatMoney(montant, 'FCFA')} de "${memberName}" enregistrÃ© avec succÃ¨s !`, 'success');
    closeModal('modalAddContributionVolontaire');
    if (formDon) formDon.reset();

    // RÃ©initialiser les sections du formulaire
    toggleDonOriginType('membre');

    renderFinances();
    renderDashboard();
    renderEntraide();
    renderCeremonies();

    // Ouvrir le reÃ§u nominatif officiel pour impression immÃ©diate
    if (newDon && newDon.id) {
      setTimeout(() => {
        openReceiptDonationModal(newDon.id);
      }, 300);
    }
  }

  window.submitContributionVolontaireForm = submitContributionVolontaireForm;

  const formDon = document.getElementById('formAddContributionVolontaire');
  if (formDon) {
    formDon.addEventListener('submit', function (e) {
      submitContributionVolontaireForm(e);
    });
  }
}

// Initialiser les écouteurs financiers dès le chargement du script
setupFinanceEventListeners();



// Actions Bureau Exécutif
function initStatutoryBureauPrompt() {
  if (!assertPermission('write', 'l’initialisation des postes')) return;
  const data = TAGBA_DB.get();
  if (data.bureau && data.bureau.length > 0) {
    if (!confirm('Des postes existent déjà. Voulez-vous initialiser le Bureau avec les 13 postes statutaires prévus par les statuts ?')) return;
  }
  TAGBA_DB.initStatutoryBureau();
  showToast('Les 13 postes statutaires ont été créés ! Cliquez sur "Modifier" pour attribuer chaque titulaire.', 'success');
  renderBureau();
  if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
    pushAllDataToSupabase(true);
  }
}

function deleteBureauMemberPrompt(burId, roleName) {
  if (!assertPermission('write', 'la suppression d’un poste')) return;
  if (!confirm(`Confirmez-vous la suppression du poste "${roleName}" du Bureau ?`)) return;
  TAGBA_DB.deleteBureauMember(burId);
  showToast(`Poste "${roleName}" supprimé du Bureau`, 'info');
  renderBureau();
  if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
    pushAllDataToSupabase(true);
  }
}

function deleteCurrentBureauMemberModal() {
  const burId = document.getElementById('editBureauId').value;
  const roleName = document.getElementById('editBureauRole').textContent;
  closeModal('modalEditBureau');
  deleteBureauMemberPrompt(burId, roleName);
}


// ============================================================
// GESTION DES MODIFICATIONS ET SUPPRESSIONS DE VERSEMENTS (COTISATIONS)
// ============================================================
let currentEditingCotisationId = null;

function openEditCotisationModal(cotId) {
  if (!assertPermission('write', 'la modification d’un versement')) return;
  const data = TAGBA_DB.get();
  const cot = (data.cotisations || []).find(c => c.id === cotId);
  if (!cot) return;

  currentEditingCotisationId = cot.id;
  const editIdEl = document.getElementById('editCotId');
  const editRecuEl = document.getElementById('editCotRecuNum');
  const editMemEl = document.getElementById('editCotMemberName');
  const editTypeEl = document.getElementById('editCotType');
  const editMontantEl = document.getElementById('editCotMontant');
  const editPeriodeEl = document.getElementById('editCotPeriode');
  const editDateEl = document.getElementById('editCotDate');
  const editModeEl = document.getElementById('editCotMode');

  if (editIdEl) editIdEl.value = cot.id;
  if (editRecuEl) editRecuEl.textContent = cot.recuNum || '';
  if (editMemEl) editMemEl.value = `${cot.memberName} (${cot.memberId || ''})`;
  if (editTypeEl) editTypeEl.value = cot.type || 'Mensuel';
  if (editMontantEl) editMontantEl.value = cot.montant || 0;
  if (editPeriodeEl) editPeriodeEl.value = cot.periode || '';
  if (editDateEl) editDateEl.value = cot.datePaiement || new Date().toISOString().split('T')[0];
  if (editModeEl) editModeEl.value = cot.modePaiement || 'Wave';

  openModal('modalEditCotisation');
}

function deleteCotisationPrompt(cotId, recuNum, memberName, montant) {
  if (!assertPermission('write', 'la suppression d’un versement')) return;
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const formatted = formatMoney(montant, cfg.currency);

  const msg = `⚠️ ATTENTION : Confirmez-vous la suppression définitive du versement suivant ?\n\n` +
    `• N° Reçu : ${recuNum}\n` +
    `• Membre : ${memberName}\n` +
    `• Montant : ${formatted}\n\n` +
    `Cette action réajustera la caisse et recalculera automatiquement l'état des cotisations et arriérés du membre.`;

  if (!confirm(msg)) return;

  // 1. Suppression locale et réajustement caisse
  TAGBA_DB.deleteCotisation(cotId);

  // 2. Suppression distante directe Supabase
  if (typeof deleteCotisationFromSupabase === 'function') {
    deleteCotisationFromSupabase(cotId);
  }

  showToast(`Versement ${recuNum} (${memberName}) supprimé avec succès. Caisse et audits réajustés.`, 'info');
  if (window.currentAuditMemberId) {
    const auditModal = document.getElementById('modalMemberMonthsAudit');
    if (auditModal && auditModal.classList.contains('active')) {
      openMemberMonthsAuditModal(window.currentAuditMemberId);
    }
  }
  renderAllViews();
  if (typeof pushAllDataToSupabase === 'function' && navigator.onLine) {
    pushAllDataToSupabase(true);
  }
}

function deleteCurrentEditCotisation() {
  const cotId = document.getElementById('editCotId')?.value;
  if (!cotId) return;
  const data = TAGBA_DB.get();
  const cot = (data.cotisations || []).find(c => c.id === cotId);
  if (!cot) return;
  closeModal('modalEditCotisation');
  deleteCotisationPrompt(cot.id, cot.recuNum, cot.memberName, cot.montant);
}

function editCotisationFromReceiptModal() {
  if (!currentViewedReceiptCotId) return;
  closeModal('modalReceipt');
  openEditCotisationModal(currentViewedReceiptCotId);
}

function deleteCotisationFromReceiptModal() {
  if (!currentViewedReceiptCotId) return;
  const data = TAGBA_DB.get();
  const cot = (data.cotisations || []).find(c => c.id === currentViewedReceiptCotId);
  if (!cot) return;
  closeModal('modalReceipt');
  deleteCotisationPrompt(cot.id, cot.recuNum, cot.memberName, cot.montant);
}


// 4.3. Gestion & Rendu Multi-Événements avec Montant Obligatoire par Membre

function populateEventSelects() {
  const data = TAGBA_DB.get();
  const evts = data.evenements || [];
  const activeEvt = TAGBA_DB.getActiveEvenement();
  const curr = data.config?.currency || 'FCFA';

  // 1. Sélecteur dans le panneau de suivi des événements
  const selectActive = document.getElementById('selectActiveEvent');
  if (selectActive) {
    if (evts.length === 0) {
      selectActive.innerHTML = '<option value="" disabled selected>Aucun événement créé</option>';
    } else {
      selectActive.innerHTML = evts.map(e => `
        <option value="${e.id}" ${e.id === activeEvt.id ? 'selected' : ''}>
          ${e.titre} — ${formatMoney(e.montant, curr)} / membre (${e.statut || 'Actif'})
        </option>
      `).join('');
    }
  }

  // 2. Sélecteur dans le modal de paiement
  const selectModal = document.getElementById('cotEventSelect');
  if (selectModal) {
    if (evts.length === 0) {
      selectModal.innerHTML = '<option value="" disabled selected>Aucun événement disponible</option>';
    } else {
      selectModal.innerHTML = evts.map(e => `
        <option value="${e.id}" ${e.id === activeEvt.id ? 'selected' : ''} data-amount="${e.montant}" data-title="${e.titre}">
          ${e.titre} — ${formatMoney(e.montant, curr)} / membre
        </option>
      `).join('');
    }
  }
}

function changeActiveEvent(eventId) {
  const data = TAGBA_DB.get();
  data.config = data.config || {};
  data.config.activeEventId = eventId;
  const evt = (data.evenements || []).find(e => e.id === eventId);
  if (evt) {
    data.config.evenementActuel = evt.titre;
    data.config.cotisationEvenement = evt.montant;
  }
  TAGBA_DB.save(data);
  renderCotisationsEventsTracking();
}

function onCotEventSelectChanged(eventId) {
  const data = TAGBA_DB.get();
  const evt = (data.evenements || []).find(e => e.id === eventId);
  if (evt) {
    const cotMontantInput = document.getElementById('cotMontant');
    const cotPeriodeInput = document.getElementById('cotPeriode');
    const noticeEl = document.getElementById('cotEventChoiceNotice');
    const curr = data.config?.currency || 'FCFA';

    if (cotMontantInput) cotMontantInput.value = evt.montant;
    if (cotPeriodeInput) cotPeriodeInput.value = evt.titre;
    if (noticeEl) {
      noticeEl.innerHTML = `Montant requis : <strong style="color: var(--emerald-400);">${formatMoney(evt.montant, curr)} / membre</strong> (${evt.titre})`;
    }
    syncCotisationMontantField();
  }
}

function openModalCreateEvenement() {
  const form = document.getElementById('formCreateEvenement');
  if (form) form.reset();
  const inputMontant = document.getElementById('createEvtMontant');
  if (inputMontant) inputMontant.value = 5000;
  const inputDate = document.getElementById('createEvtDate');
  if (inputDate) {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    inputDate.value = d.toISOString().split('T')[0];
  }
  const modal = document.getElementById('modalCreateEvenement');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  } else {
    openModal('modalCreateEvenement');
  }
}

function openModalEditEvenement(eventId = null) {
  const data = TAGBA_DB.get();
  const targetId = eventId || data.config?.activeEventId;
  const evts = data.evenements || [];
  const evt = evts.find(e => e.id === targetId) || TAGBA_DB.getActiveEvenement() || {
    id: 'evt-1',
    titre: data.config?.evenementActuel || 'Cotisation Sacrifice de la Mutuelle',
    montant: Number(data.config?.cotisationEvenement || 5000),
    dateLimite: '',
    statut: 'Actif',
    description: ''
  };

  const idEl = document.getElementById('editEvtId');
  const titEl = document.getElementById('editEvtTitre');
  const montEl = document.getElementById('editEvtMontant');
  const dateEl = document.getElementById('editEvtDate');
  const statEl = document.getElementById('editEvtStatut');
  const descEl = document.getElementById('editEvtDesc');
  if (idEl) idEl.value = evt.id || 'evt-1';
  if (titEl) titEl.value = evt.titre || '';
  if (montEl) montEl.value = evt.montant || 5000;
  if (dateEl) dateEl.value = evt.dateLimite || '';
  if (statEl) statEl.value = evt.statut || 'Actif';
  if (descEl) descEl.value = evt.description || '';

  const modal = document.getElementById('modalEditEvenement');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  } else {
    openModal('modalEditEvenement');
  }
}

function deleteCurrentEvenementConfirm() {
  if (!assertPermission('evenements', 'la suppression d’un événement')) return;
  const id = document.getElementById('editEvtId').value;
  if (!id) return;
  const data = TAGBA_DB.get();
  const evt = (data.evenements || []).find(e => e.id === id);
  if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${evt ? evt.titre : 'cet événement'}" ?`)) {
    TAGBA_DB.deleteEvenement(id);
    closeModal('modalEditEvenement');
    showToast('Événement supprimé avec succès');
    renderAllViews();
  }
}

function renderCotisationsEventsTracking() {
  try {
    const data = TAGBA_DB.get();
    const cfg = data.config || {};
    const tbody = document.getElementById('tableCotisationsEventsBody');
    if (!tbody) return;

    populateEventSelects();

    const activeEvt = TAGBA_DB.getActiveEvenement() || {
      id: 'evt-1',
      titre: data.config?.evenementActuel || 'Cotisation Sacrifice de la Mutuelle',
      montant: Number(data.config?.cotisationEvenement || 5000),
      dateLimite: '2026-11-15',
      statut: 'Actif',
      description: 'Cotisation collective pour le sacrifice annuel et les bénédictions de la mutuelle'
    };
    const unitEvent = Number(activeEvt.montant || cfg.cotisationEvenement || 5000);
    const eventTitle = activeEvt.titre || 'Événement Spécial';
    const currency = cfg.currency || 'FCFA';

    // Mise à jour de la bannière
    const badgeStatusEl = document.getElementById('badgeEventStatus');
    const dateLimiteEl = document.getElementById('eventDateLimiteDisplay');
    const badgeEl = document.getElementById('cfgDisplayEvenementBadge');
    const descEl = document.getElementById('eventDescDisplay');

    if (badgeStatusEl) {
      const isActif = activeEvt.statut === 'Actif';
      badgeStatusEl.className = isActif ? 'badge badge-success' : 'badge badge-secondary';
      badgeStatusEl.textContent = isActif ? '🟢 Actif (En cours)' : '🏁 Clôturé (Terminé)';
    }

    if (dateLimiteEl) {
      dateLimiteEl.textContent = activeEvt.dateLimite ? `📅 Échéance : ${formatDate(activeEvt.dateLimite)}` : '';
    }

    if (badgeEl) badgeEl.textContent = `${formatMoney(unitEvent, currency)} / membre`;
    if (descEl) descEl.textContent = activeEvt.description || 'Chaque membre cotise individuellement ou via son chef de famille pour financer cet événement.';

    // Trouver tous les versements pour cet événement spécifique
    const eventCotisations = (data.cotisations || []).filter(c => {
      const isEvtType = c.type === 'Événement' || c.type === 'Evenement' || c.type === 'Évenement';
      const matchesEvent = (c.eventId && c.eventId === activeEvt.id) ||
        (c.periode && c.periode === eventTitle) ||
        (c.periode && c.periode.includes(eventTitle));
      return isEvtType && matchesEvent;
    });

    const totalMembers = (data.members || []).length;
    const paidMemberIds = new Set(eventCotisations.map(c => c.memberId || c.member_id));
    const paidCount = (data.members || []).filter(m => paidMemberIds.has(m.id)).length;
    const pendingCount = Math.max(0, totalMembers - paidCount);
    const totalEncaiss = eventCotisations.reduce((acc, c) => acc + Number(c.montant || 0), 0);
    const totalAttendu = totalMembers * unitEvent;
    const resteRecouvrer = Math.max(0, totalAttendu - totalEncaiss);
    const percentPaid = totalMembers > 0 ? Math.round((paidCount / totalMembers) * 100) : 0;

    // KPIs
    const kpiTotal = document.getElementById('kpiEventTotalEncaiss');
    const kpiPaidCountSub = document.getElementById('kpiEventPaidCountSub');
    const kpiPaidMembers = document.getElementById('kpiEventPaidMembersCount');
    const kpiPercentSub = document.getElementById('kpiEventPercentSub');
    const kpiReste = document.getElementById('kpiEventResteRecouvrer');
    const kpiPendingSub = document.getElementById('kpiEventPendingCountSub');
    const kpiAttendu = document.getElementById('kpiEventTotalAttendu');

    if (kpiTotal) kpiTotal.textContent = formatMoney(totalEncaiss, currency);
    if (kpiPaidCountSub) kpiPaidCountSub.textContent = `${eventCotisations.length} versement(s) reçu(s)`;
    if (kpiPaidMembers) kpiPaidMembers.textContent = `${paidCount} / ${totalMembers}`;
    if (kpiPercentSub) kpiPercentSub.textContent = `${percentPaid}% de participation`;
    if (kpiReste) kpiReste.textContent = formatMoney(resteRecouvrer, currency);
    if (kpiPendingSub) kpiPendingSub.textContent = `${pendingCount} membre(s) en attente`;
    if (kpiAttendu) kpiAttendu.textContent = formatMoney(totalAttendu, currency);

    const fin = TAGBA_DB.getCaisseFinances();
    const evenementsSumEl = document.getElementById('evenementsSumDisplay');
    if (evenementsSumEl) evenementsSumEl.textContent = formatMoney(fin.totalCotisationsEvenements, currency);

    // Filtre recherche
    const searchInput = document.getElementById('filterEventMemberSearch');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let membersToDisplay = (data.members || []);
    if (query) {
      membersToDisplay = membersToDisplay.filter(m =>
        (m.fullName || '').toLowerCase().includes(query) ||
        (m.matricule || '').toLowerCase().includes(query) ||
        (m.phone || '').includes(query)
      );
    }

    if (membersToDisplay.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
            Aucun membre trouvé pour ce filtre.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = membersToDisplay.map(m => {
      const fam = (data.families || []).find(f => f.id === m.familyId);
      const famName = fam ? fam.name : 'Famille TAGBA';
      const cotsForMem = eventCotisations.filter(c => (c.memberId === m.id || c.member_id === m.id));
      const hasPaid = cotsForMem.length > 0;
      const lastCot = hasPaid ? cotsForMem[0] : null;

      let statutBadge = '';
      let dateRecuCell = '';
      let modeCell = '';
      let actionBtn = '';

      if (hasPaid) {
        const totalPaidForMem = cotsForMem.reduce((s, c) => s + (Number(c.montant) || 0), 0);
        const isPartial = totalPaidForMem < unitEvent;
        if (isPartial) {
          statutBadge = `<span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);">⚠️ Partiel (${formatMoney(totalPaidForMem, currency)} / ${formatMoney(unitEvent, currency)})</span>`;
        } else {
          statutBadge = `<span class="badge badge-success">✅ Payé (${formatMoney(totalPaidForMem, currency)})</span>`;
        }
        dateRecuCell = `
          <div style="font-weight: 600; font-size: 12px; color: var(--text-main);">${formatDate(lastCot.datePaiement || lastCot.date_paiement)}</div>
          <div style="font-size: 11px; color: var(--emerald-400);">${lastCot.recuNum || lastCot.recu_num}</div>
        `;
        modeCell = `<span class="badge badge-purple" style="font-size: 10px;">${lastCot.modePaiement || lastCot.mode_paiement}</span>`;
        actionBtn = `
          <div style="display: inline-flex; gap: 4px;">
            <button class="btn btn-sm btn-secondary" onclick="openReceiptModal('${lastCot.id}')" title="Voir le Reçu Officiel">
              🧾 Reçu
            </button>
            <button class="btn btn-sm btn-outline-primary" onclick="quickPayMemberForEvent('${m.id}', '${activeEvt.id}')" title="Ajouter un autre versement">
              ➕
            </button>
          </div>
        `;
      } else {
        statutBadge = `<span class="badge badge-warning">⏳ En attente (${formatMoney(unitEvent, currency)})</span>`;
        dateRecuCell = `<span style="color: var(--text-dim);">-</span>`;
        modeCell = `<span style="color: var(--text-dim);">-</span>`;
        actionBtn = `
          <button class="btn btn-sm btn-primary" onclick="quickPayMemberForEvent('${m.id}', '${activeEvt.id}')" title="Encaisser la cotisation pour ${activeEvt.titre}">
            💳 Encaisser
          </button>
        `;
      }

      return `
        <tr>
          <td><strong style="color: var(--emerald-400);">${m.matricule}</strong></td>
          <td>
            <div style="font-weight: 700; color: var(--text-main); font-size: 13px;">
              ${m.fullName}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              👑 ${famName} • 📞 ${m.phone}
            </div>
          </td>
          <td>
            <strong style="color: var(--gold-400);">${formatMoney(unitEvent, currency)}</strong>
          </td>
          <td>${statutBadge}</td>
          <td>${dateRecuCell}</td>
          <td>${modeCell}</td>
          <td style="text-align: right;">${actionBtn}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Erreur renderCotisationsEventsTracking:', err);
  }
}

// Raccourci pour encaisser un membre spécifique pour l'événement sélectionné
function quickPayMemberForEvent(memberId, eventId = null) {
  const data = TAGBA_DB.get();
  if (eventId) {
    data.config.activeEventId = eventId;
    TAGBA_DB.save(data, true);
  }
  const activeEvt = TAGBA_DB.getActiveEvenement();

  openModal('modalAddCotisation');
  setVersementFormMode('individual', false);

  const memberSelect = document.getElementById('cotMemberSelect');
  if (memberSelect) {
    memberSelect.value = memberId;
  }
  updateCotMemberAuditPreview(memberId);

  const cotTypeSelect = document.getElementById('cotType');
  if (cotTypeSelect) {
    cotTypeSelect.value = 'Événement';
    cotTypeSelect.dispatchEvent(new Event('change'));
  }

  const cotEventSelect = document.getElementById('cotEventSelect');
  if (cotEventSelect && activeEvt) {
    cotEventSelect.value = activeEvt.id;
  }

  const cotPeriodeInput = document.getElementById('cotPeriode');
  if (cotPeriodeInput) {
    cotPeriodeInput.value = activeEvt.titre;
  }

  const cotMontantInput = document.getElementById('cotMontant');
  if (cotMontantInput) {
    cotMontantInput.value = activeEvt.montant;
  }
}

// Raccourci pour ouvrir le modal d'encaissement d'événement
function openEventAddCotisationModal(memberId = null, eventId = null) {
  const data = TAGBA_DB.get();
  if (eventId) {
    data.config.activeEventId = eventId;
    TAGBA_DB.save(data, true);
  }
  const activeEvt = TAGBA_DB.getActiveEvenement() || {
    id: 'evt-1',
    titre: data.config?.evenementActuel || 'Cotisation Sacrifice de la Mutuelle',
    montant: Number(data.config?.cotisationEvenement || 5000)
  };

  openModal('modalAddCotisation');
  setVersementFormMode('individual', false);

  const modalHeader = document.querySelector('#modalAddCotisation .modal-header h3');
  if (modalHeader) {
    modalHeader.textContent = '🎯 Encaisser la Cotisation d\'un Événement';
  }

  if (memberId) {
    const memberSelect = document.getElementById('cotMemberSelect');
    if (memberSelect) memberSelect.value = memberId;
    updateCotMemberAuditPreview(memberId);
  }

  const cotTypeSelect = document.getElementById('cotType');
  if (cotTypeSelect) {
    cotTypeSelect.value = 'Événement';
    cotTypeSelect.dispatchEvent(new Event('change'));
  }

  const cotEventSelect = document.getElementById('cotEventSelect');
  if (cotEventSelect && activeEvt) {
    cotEventSelect.value = activeEvt.id;
  }

  const cotPeriodeInput = document.getElementById('cotPeriode');
  if (cotPeriodeInput && activeEvt) {
    cotPeriodeInput.value = activeEvt.titre || '';
  }

  const cotMontantInput = document.getElementById('cotMontant');
  if (cotMontantInput && activeEvt) {
    cotMontantInput.value = activeEvt.montant || 5000;
  }
}

// Raccourci pour encaisser toute une famille pour l'événement sélectionné
function openEventBatchPayModal(familyId = null, eventId = null) {
  const data = TAGBA_DB.get();
  if (eventId) {
    data.config.activeEventId = eventId;
    TAGBA_DB.save(data, true);
  }
  const activeEvt = TAGBA_DB.getActiveEvenement() || {
    id: 'evt-1',
    titre: data.config?.evenementActuel || 'Cotisation Sacrifice de la Mutuelle',
    montant: Number(data.config?.cotisationEvenement || 5000)
  };

  openModal('modalAddCotisation');
  setVersementFormMode('group', true);

  if (familyId) {
    const memInFam = data.members.find(m => m.familyId === familyId);
    if (memInFam) {
      const memberSelect = document.getElementById('cotMemberSelect');
      if (memberSelect) memberSelect.value = memInFam.id;
      onCotMemberSelected();
    }
  }

  const cotTypeSelect = document.getElementById('cotType');
  if (cotTypeSelect) {
    cotTypeSelect.value = 'Événement';
    cotTypeSelect.dispatchEvent(new Event('change'));
  }

  const cotEventSelect = document.getElementById('cotEventSelect');
  if (cotEventSelect && activeEvt) {
    cotEventSelect.value = activeEvt.id;
  }

  const cotPeriodeInput = document.getElementById('cotPeriode');
  if (cotPeriodeInput && activeEvt) {
    cotPeriodeInput.value = activeEvt.titre || '';
  }

  syncCotisationMontantField();
}

// ============================================================
// GESTION PERSONNALISATION MONTANT ÉVÉNEMENT
// ============================================================
function setEventPaymentMontant(amount) {
  const cotMontantInput = document.getElementById('cotMontant');
  if (cotMontantInput) {
    cotMontantInput.value = amount;
    cotMontantInput.focus();
    cotMontantInput.select();
  }
}

function applyPlageEventAmountAll(amount) {
  const inputs = document.querySelectorAll('.plage-member-event-amount');
  inputs.forEach(inp => {
    inp.value = amount;
  });
  syncCotisationMontantField();
}

function onPlageMemberEventAmountChange(memberId) {
  syncCotisationMontantField();
}

// ============================================================
// EXPOSITION GLOBALE EXPLICITE SUR WINDOW (Garantie Anti-ReferenceError)
// ============================================================
if (typeof window !== 'undefined') {
  window.enableCustomCotisationAmount = enableCustomCotisationAmount;
  window.onCotMontantInput = onCotMontantInput;
  window.setEventPaymentMontant = setEventPaymentMontant;
  window.applyPlageEventAmountAll = applyPlageEventAmountAll;
  window.onPlageMemberEventAmountChange = onPlageMemberEventAmountChange;
  window.openModalCreateEvenement = openModalCreateEvenement;
  window.openModalEditEvenement = openModalEditEvenement;
  window.deleteCurrentEvenementConfirm = deleteCurrentEvenementConfirm;
  window.changeActiveEvent = changeActiveEvent;
  window.openEventAddCotisationModal = openEventAddCotisationModal;
  window.openEventBatchPayModal = openEventBatchPayModal;
  window.quickPayMemberForEvent = quickPayMemberForEvent;
  window.renderCotisationsEventsTracking = renderCotisationsEventsTracking;
  window.populateEventSelects = populateEventSelects;
  window.onCotEventSelectChanged = onCotEventSelectChanged;
  window.switchCotisSubTab = switchCotisSubTab;
  window.renderCotisationsRecapMois = renderCotisationsRecapMois;
  window.selectRecapMonth = selectRecapMonth;
  window.setRecapMoisDetailViewMode = setRecapMoisDetailViewMode;
  window.filterRecapMoisDetailTable = filterRecapMoisDetailTable;
  window.filterCotisationsRegistreTable = filterCotisationsRegistreTable;
  window.getMonthlyCotisationsBreakdown = getMonthlyCotisationsBreakdown;
}
