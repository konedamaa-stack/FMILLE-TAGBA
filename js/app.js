/**
 * TAGBA - Application Logic & Controllers
 */

// Helper de formatage de monnaie
function formatMoney(amount, currency = 'FCFA') {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency;
}

// Helper Toast Notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
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
    levelName: 'Niveau 1 : Commissaire (Tous Droits)',
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
    level: 2,
    levelName: 'Niveau 2 : Porte-Parole (Cérémonies)',
    passwords: ['1234', 'porteparole123', 'tagba2026'],
    canWriteAll: false,
    canCreateCeremonies: true
  },
  'usr-president': {
    id: 'usr-president',
    login: 'president',
    email: 'ibrahim.kone@tagba.ci',
    matricule: 'TAGBA-2026-001',
    name: 'Ibrahim Koné',
    initials: 'IK',
    title: 'Président du Bureau',
    level: 3,
    levelName: 'Niveau 3 : Président (Lecture Seule)',
    passwords: ['1234', 'president123', 'tagba2026'],
    canWriteAll: false,
    canCreateCeremonies: false
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
  }
}

function showAuthFullscreen() {
  const screen = document.getElementById('authFullscreenScreen');
  if (screen) {
    screen.classList.remove('hidden');
  }
}

function logoutAuthUser() {
  localStorage.setItem('tagba_session_authenticated', 'false');
  showAuthFullscreen();
  showToast('Vous avez été déconnecté de la mutuelle.');
}

function initSessionState() {
  const isAuth = localStorage.getItem('tagba_session_authenticated');
  if (isAuth === 'true') {
    hideAuthFullscreen();
  } else {
    showAuthFullscreen();
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
  const user = getActiveAuthUser();
  if (actionType === 'ceremonies') {
    return user.canCreateCeremonies; // Niveau 1 & 2
  }
  // Tout le reste (cotisations, membres, familles, entraide, paramètres, suppression)
  return user.canWriteAll; // Uniquement Niveau 1
}

function assertPermission(actionType, actionLabel = 'cette action') {
  if (canUserPerform(actionType)) return true;

  const user = getActiveAuthUser();
  if (actionType === 'ceremonies') {
    showToast(`🔒 Accès refusé pour ${actionLabel} : Seuls le Porte-Parole et le Commissaire aux comptes ont le rôle de programmer les cérémonies. Votre compte (${user.title}) est en lecture seule.`, 'warning');
  } else {
    showToast(`🔒 Accès restreint pour ${actionLabel} : Seul le Commissaire aux comptes détient tous les droits d'écriture et de modification. Votre compte (${user.title}) est en lecture seule stricte.`, 'warning');
  }
  return false;
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

  // 4. Verrouillage visuel des boutons d'action selon permissions
  const writeLocked = !user.canWriteAll;
  const ceremoniesLocked = !user.canCreateCeremonies;

  // Topbar nouveau versement
  const topbarCotBtn = document.getElementById('topbarNewCotisationBtn');
  if (topbarCotBtn) {
    topbarCotBtn.classList.toggle('action-locked-btn', writeLocked);
    topbarCotBtn.title = writeLocked ? 'Réservé au Commissaire aux comptes (Lecture seule)' : 'Nouveau Versement';
  }

  // Boutons section Cotisations
  const btnPlage = document.getElementById('btnPlageVersementMain');
  if (btnPlage) {
    btnPlage.classList.toggle('action-locked-btn', writeLocked);
    btnPlage.title = writeLocked ? 'Réservé au Commissaire aux comptes' : '';
  }
  const btnNouvCot = document.getElementById('btnNouveauVersementMain');
  if (btnNouvCot) {
    btnNouvCot.classList.toggle('action-locked-btn', writeLocked);
    btnNouvCot.title = writeLocked ? 'Réservé au Commissaire aux comptes' : '';
  }

  // Boutons section Familles & Membres
  const btnChef = document.getElementById('btnNouveauChefMain');
  if (btnChef) {
    btnChef.classList.toggle('action-locked-btn', writeLocked);
    btnChef.title = writeLocked ? 'Réservé au Commissaire aux comptes' : '';
  }
  const btnMem = document.getElementById('btnNouveauMembreMain');
  if (btnMem) {
    btnMem.classList.toggle('action-locked-btn', writeLocked);
    btnMem.title = writeLocked ? 'Réservé au Commissaire aux comptes' : '';
  }

  // Bouton Cérémonie (Niveau 1 et 2 autorisés)
  const btnCer = document.getElementById('btnAddCeremonieMain');
  if (btnCer) {
    btnCer.classList.toggle('action-locked-btn', ceremoniesLocked);
    btnCer.title = ceremoniesLocked ? 'Réservé au Porte-parole et Commissaire aux comptes' : '';
  }

  // Bouton Entraide
  const btnEntraide = document.getElementById('btnAddEntraideMain');
  if (btnEntraide) {
    btnEntraide.classList.toggle('action-locked-btn', writeLocked);
    btnEntraide.title = writeLocked ? 'Réservé au Commissaire aux comptes' : '';
  }

  // Bouton Sauvegarde Paramètres
  const btnSaveCfg = document.getElementById('btnSaveConfig');
  if (btnSaveCfg) {
    btnSaveCfg.classList.toggle('action-locked-btn', writeLocked);
    btnSaveCfg.title = writeLocked ? 'Réservé au Commissaire aux comptes' : '';
  }
}

// Initialisation & Navigation par onglets
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initTheme();
  initFamilyViewSwitcher();
  renderAllViews();
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
  const sidebar = document.querySelector('.sidebar');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
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
      if (sidebar) sidebar.classList.remove('open');

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
  if (tabId === 'tab-ceremonies') renderCeremonies();
  if (tabId === 'tab-data') loadConfigForm();
  applyActiveUserUI();
}

function renderAllViews() {
  renderDashboard();
  renderBureau();
  renderFamiliesAndMembers();
  renderCotisations();
  renderEntraide();
  renderCeremonies();
  populateSelectOptions();
  loadConfigForm();
  updateBaremeDisplays();
  updateCotisationModalDefaults();
}

// 1. Rendu Dashboard
function renderDashboard() {
  const data = TAGBA_DB.get();

  // KPIs
  const kpiMembres = document.getElementById('kpiTotalMembres');
  const kpiFamilles = document.getElementById('kpiTotalFamilles');
  const kpiCaisse = document.getElementById('kpiFondsCaisse');
  const kpiCotisationsMois = document.getElementById('kpiCotisationsTotal');
  const kpiEntraideTotal = document.getElementById('kpiEntraideTotal');

  if (kpiMembres) kpiMembres.textContent = data.members.length;
  if (kpiFamilles) kpiFamilles.textContent = data.families.length + ' foyers';
  if (kpiCaisse) kpiCaisse.textContent = formatMoney(data.config.fondsCaisse, data.config.currency);

  const totalCotisationsRecues = data.cotisations.reduce((acc, c) => acc + Number(c.montant || 0), 0);
  if (kpiCotisationsMois) kpiCotisationsMois.textContent = formatMoney(totalCotisationsRecues, data.config.currency);

  const totalEntraideDecaissee = data.entraide
    .filter(e => e.statut === 'Accordé & Décaissé')
    .reduce((acc, e) => acc + Number(e.montantAlloue || 0), 0);
  if (kpiEntraideTotal) kpiEntraideTotal.textContent = formatMoney(totalEntraideDecaissee, data.config.currency);

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

// 2. Rendu Bureau Exécutif (Les 11 Postes Officiels)
function renderBureau() {
  const data = TAGBA_DB.get();
  const grid = document.getElementById('bureauGrid');
  if (!grid) return;

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
          <div class="bureau-avatar">${post.photoInitial}</div>
          <div class="bureau-details">
            <h4>${post.name}</h4>
            <p>📞 ${post.phone}</p>
          </div>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 14px; flex: 1;">${post.bio}</p>
        <div class="bureau-meta">
          <span>✉️ ${post.email}</span>
          <button class="btn btn-sm btn-secondary" onclick="openEditBureauModal('${post.id}')" title="Modifier">✏️ Modifier</button>
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

  let familiesToDisplay = data.families;
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
        m.phone.includes(s)
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
    let familyMembers = data.members.filter(m => m.familyId === fam.id);
    if (s) {
      // Si recherche active, conserver les membres qui matchent ou tous si le chef matche
      const chefMatches = fam.name.toLowerCase().includes(s) || fam.chefDeFamille.toLowerCase().includes(s);
      if (!chefMatches) {
        familyMembers = familyMembers.filter(m =>
          m.fullName.toLowerCase().includes(s) ||
          m.profession.toLowerCase().includes(s) ||
          m.matricule.toLowerCase().includes(s) ||
          m.phone.includes(s)
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
                <span>📞 ${fam.phone}</span>
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
              <button class="btn btn-sm btn-secondary" onclick="openFamilySheetModal('${fam.id}')" title="Imprimer la fiche officielle de ce foyer">
                🖨️ Fiche de Famille
              </button>
              <button class="btn btn-sm btn-primary" onclick="quickAddMemberToFamily('${fam.id}')" title="Ajouter un membre rattaché à ce chef">
                + Rattacher Membre
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
                  ${familyMembers.map(mem => `
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
                      <td>📞 ${mem.phone}</td>
                      <td>${mem.profession}</td>
                      <td>
                        <span class="badge ${getStatutBadgeClass(mem.statutCotisation)}">${formatStatut(mem.statutCotisation)}</span>
                      </td>
                      <td style="text-align: right;">
                        <div style="display: inline-flex; gap: 6px;">
                          <button class="btn btn-sm btn-secondary" onclick="quickPayMember('${mem.id}')" title="Encaisser versement">💳 Payer</button>
                          <button class="btn btn-sm btn-outline-danger" onclick="deleteMemberConfirm('${mem.id}')" title="Retirer">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
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
      m.phone.includes(s)
    );
  }

  if (filterFamily) {
    filtered = filtered.filter(m => m.familyId === filterFamily);
  }

  if (countBadge) countBadge.textContent = `${filtered.length} membre(s)`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">Aucun membre trouvé selon ces filtres.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(mem => {
    const fam = data.families.find(f => f.id === mem.familyId);
    const famName = fam ? fam.name : 'Non rattaché';
    const chefName = fam ? fam.chefDeFamille : 'Non défini';

    return `
      <tr>
        <td><strong style="color: var(--emerald-400);">${mem.matricule}</strong></td>
        <td>
          <div style="font-weight: 600;">${mem.fullName} ${mem.bureauRole ? `<span class="badge badge-purple" style="font-size: 9px; margin-left: 6px;">${mem.bureauRole}</span>` : ''}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${mem.profession} • 📍 ${mem.residence}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${famName}</div>
          <div style="font-size: 11px; color: var(--gold-400);">Chef : ${chefName}</div>
          <div style="margin-top: 2px;">${getRelationBadge(mem.relationToChef)}</div>
        </td>
        <td>📞 ${mem.phone}</td>
        <td><span class="badge ${getStatutBadgeClass(mem.statutCotisation)}">${formatStatut(mem.statutCotisation)}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
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

  famTreeGrid.innerHTML = data.families.map(fam => {
    const familyMembers = data.members.filter(m => m.familyId === fam.id);
    return `
      <div class="family-card">
        <div class="family-head-box">
          <div class="avatar-sm" style="background: var(--grad-gold);">${fam.code}</div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h3 style="font-size: 16px;">${fam.name}</h3>
              <span class="family-badge-chip">${familyMembers.length} membre(s)</span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted);">Chef de famille : <strong>${fam.chefDeFamille}</strong></p>
            <p style="font-size: 11px; color: var(--text-dim);">📍 ${fam.city} • 📞 ${fam.phone}</p>
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
  const select = document.getElementById('memFamilySelect');
  if (select) select.value = familyId;
  openModal('modalAddMember');
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
          <p style="color: #047857; font-weight: 700;">Ibrahim Koné (Président)</p>
        </div>
      </div>
    </div>
  `;

  openModal('modalFamilySheet');
}

function getStatutBadgeClass(statut) {
  if (statut === 'A_JOUR') return 'badge-success';
  if (statut === 'PARTIEL') return 'badge-warning';
  return 'badge-danger';
}

function formatStatut(statut) {
  if (statut === 'A_JOUR') return 'À jour';
  if (statut === 'PARTIEL') return 'Partiel';
  return 'En retard';
}

// 4. Rendu Cotisations & Versements
function renderCotisations() {
  const data = TAGBA_DB.get();
  const tbody = document.getElementById('cotisationsTableBody');
  if (!tbody) return;

  const total = data.cotisations.reduce((acc, c) => acc + Number(c.montant || 0), 0);
  const totalDisplay = document.getElementById('cotisationsSumDisplay');
  if (totalDisplay) totalDisplay.textContent = formatMoney(total, data.config.currency);

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
        <button class="btn btn-sm btn-secondary" onclick="openReceiptModal('${cot.id}')">🖨️ Reçu</button>
      </td>
    </tr>
  `).join('');
}

// 5. Rendu Entraide & Cas Sociaux
function renderEntraide() {
  const data = TAGBA_DB.get();
  const container = document.getElementById('entraideGrid');
  if (!container) return;

  if (data.entraide.length === 0) {
    container.innerHTML = `<div style="grid-column: span 12; text-align: center; padding: 40px; color: var(--text-muted);">Aucun dossier de solidarité enregistré.</div>`;
    return;
  }

  container.innerHTML = data.entraide.map(cas => `
    <div class="card-panel col-6" style="margin-bottom: 0;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
        <div>
          <span style="font-size: 11px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">${cas.reference}</span>
          <h3 style="font-size: 17px; margin-top: 2px;">${cas.nature}</h3>
        </div>
        <span class="badge ${cas.statut === 'Accordé & Décaissé' ? 'badge-success' : 'badge-warning'}">${cas.statut}</span>
      </div>

      <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 12px; margin-bottom: 14px;">
        <p style="font-size: 13px; color: var(--text-main); margin-bottom: 8px;"><strong>Membre concerné :</strong> ${cas.memberName}</p>
        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">${cas.description}</p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <div>
          <div style="font-size: 11px; color: var(--text-muted);">Montant assistance</div>
          <div style="font-size: 18px; font-weight: 800; color: var(--emerald-400);">${formatMoney(cas.montantAlloue, data.config.currency)}</div>
        </div>

        <div style="display: flex; gap: 8px;">
          ${cas.statut !== 'Accordé & Décaissé' ? `
            <button class="btn btn-sm btn-primary" onclick="accorderEntraide('${cas.id}')">✅ Valider & Décaisser</button>
          ` : `
            <span style="font-size: 12px; color: var(--emerald-400);">Résolu le ${cas.dateResolution || 'Récemment'}</span>
          `}
        </div>
      </div>
    </div>
  `).join('');
}

// 6. Rendu Cérémonies & Événements
function renderCeremonies() {
  const data = TAGBA_DB.get();
  const container = document.getElementById('ceremoniesGrid');
  if (!container) return;

  container.innerHTML = data.ceremonies.map(cer => `
    <div class="card-panel col-6" style="margin-bottom: 0;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
        <div>
          <span class="badge badge-purple" style="margin-bottom: 6px;">${cer.type}</span>
          <h3 style="font-size: 18px;">${cer.titre}</h3>
        </div>
        <span class="badge ${cer.statut === 'À venir' ? 'badge-warning' : 'badge-info'}">${cer.statut}</span>
      </div>

      <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px; display: flex; flex-direction: column; gap: 6px;">
        <div>📅 <strong>Date :</strong> ${cer.date}</div>
        <div>📍 <strong>Lieu :</strong> ${cer.lieu}</div>
        <div>👨‍👩‍👧‍👦 <strong>Organisateur :</strong> ${cer.organisateur}</div>
      </div>

      <div style="background: rgba(255,255,255,0.03); border-radius: var(--radius-md); padding: 12px; margin-bottom: 14px;">
        <div style="font-size: 11px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 4px;">Délégation mandatée de la mutuelle :</div>
        <div style="font-size: 12px; color: var(--text-main); font-weight: 500;">🏛️ ${cer.delegationBureau}</div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 12px;">
        <div>
          <span style="font-size: 11px; color: var(--text-muted);">Enveloppe de la Mutuelle :</span>
          <strong style="display: block; font-size: 16px; color: var(--gold-400);">${formatMoney(cer.enveloppeSoutien, data.config.currency)}</strong>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="alert('Détails et rapport de mission pour: ' + '${cer.titre}')">📋 Voir Détails</button>
      </div>
    </div>
  `).join('');
}

// 7. Reçu Imprimable
function openReceiptModal(cotisationId) {
  const data = TAGBA_DB.get();
  const cot = data.cotisations.find(c => c.id === cotisationId);
  if (!cot) return;

  const mem = data.members.find(m => m.id === cot.memberId);
  const fam = data.families.find(f => f.id === cot.familyId);

  const container = document.getElementById('receiptContent');
  if (!container) return;

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
          <p><strong>Matricule :</strong> ${mem ? mem.matricule : 'N/A'}</p>
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
  const select = document.getElementById('cotMemberSelect');
  if (select) {
    select.value = memberId;
    onCotMemberSelected();
  }
}

function deleteMemberConfirm(memberId) {
  if (!assertPermission('write', 'la suppression d’un membre')) return;
  if (confirm('Êtes-vous sûr de vouloir retirer ce membre de la mutuelle ?')) {
    TAGBA_DB.deleteMember(memberId);
    showToast('Membre supprimé avec succès');
    renderAllViews();
  }
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
  if (modalId === 'modalAddCeremonie') {
    if (!assertPermission('ceremonies', 'la création de cérémonies')) return;
  } else if (
    modalId === 'modalAddCotisation' ||
    modalId === 'modalAddMember' ||
    modalId === 'modalAddFamily' ||
    modalId === 'modalAddEntraide' ||
    modalId === 'modalEditBureau'
  ) {
    if (!assertPermission('write', 'cette modification')) return;
  }

  const m = document.getElementById(modalId);
  if (m) {
    m.classList.add('active');
    if (modalId === 'modalAddCotisation') {
      updateCotisationModalDefaults();
    }
  }
}

function closeModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('active');
}

function bindModalEvents() {
  document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Fermer au clic extérieur
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  // Changement de fréquence dans le modal versement
  const cotTypeSelect = document.getElementById('cotType');
  if (cotTypeSelect) {
    cotTypeSelect.addEventListener('change', () => {
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

  // Familles select
  const famSelects = ['memFamilySelect', 'memberFamilyFilter', 'cerFamilySelect'];
  famSelects.forEach(selId => {
    const el = document.getElementById(selId);
    if (!el) return;
    const isFilter = selId === 'memberFamilyFilter';
    el.innerHTML = isFilter ? '<option value="">Toutes les familles</option>' : '';
    data.families.forEach(f => {
      el.innerHTML += `<option value="${f.id}">${f.name} (Chef: ${f.chefDeFamille})</option>`;
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
  // 1. Ajouter Famille
  const formAddFam = document.getElementById('formAddFamily');
  if (formAddFam) {
    formAddFam.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'l’ajout d’une famille')) return;
      const newFam = {
        name: document.getElementById('famName').value.trim(),
        chefDeFamille: document.getElementById('famChef').value.trim(),
        phone: document.getElementById('famPhone').value.trim(),
        city: document.getElementById('famCity').value.trim(),
        notes: document.getElementById('famNotes').value.trim()
      };
      TAGBA_DB.addFamily(newFam);
      showToast('Nouvelle famille enregistrée avec succès');
      closeModal('modalAddFamily');
      formAddFam.reset();
      renderAllViews();
    });
  }

  // 2. Ajouter Membre
  const formAddMem = document.getElementById('formAddMember');
  if (formAddMem) {
    formAddMem.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!assertPermission('write', 'l’ajout d’un membre')) return;
      const newMem = {
        fullName: document.getElementById('memName').value.trim(),
        familyId: document.getElementById('memFamilySelect').value,
        relationToChef: document.getElementById('memRelation').value.trim(),
        phone: document.getElementById('memPhone').value.trim(),
        profession: document.getElementById('memProfession').value.trim(),
        residence: document.getElementById('memResidence').value.trim(),
        statutCotisation: document.getElementById('memStatutCotisation').value
      };
      TAGBA_DB.addMember(newMem);
      showToast('Membre rattaché et enregistré avec succès !');
      closeModal('modalAddMember');
      formAddMem.reset();
      renderAllViews();
    });
  }

  // 3. Ajouter Versement (Individuel ou Groupé par Chef de Famille)
  const formAddCot = document.getElementById('formAddCotisation');
  if (formAddCot) {
    formAddCot.addEventListener('submit', (e) => {
      e.preventDefault();
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
      const periode = document.getElementById('cotPeriode').value.trim();
      const modePaiement = document.getElementById('cotMode').value;
      const datePaiement = document.getElementById('cotDate').value || new Date().toISOString().split('T')[0];
      const agent = 'Seydou Coulibaly (Trésorier Général)';

      const groupContainer = document.getElementById('cotGroupPaymentContainer');
      const isGroupPayment = isChef && groupContainer && groupContainer.style.display !== 'none' && currentGroupPaymentMode === 'group';

      if (isGroupPayment) {
        // Mode Plage de Versement Groupé pour la Famille
        const checkedRows = Array.from(document.querySelectorAll('.family-plage-row')).filter(row => {
          const cb = row.querySelector('.family-member-cb');
          return cb && cb.checked;
        });

        if (checkedRows.length === 0) {
          showToast('Veuillez cocher au moins un membre de la famille pour le versement groupé', 'warning');
          return;
        }

        const cfg = data.config || {};
        const unitMonthly = Number(cfg.cotisationMensuelle || 5000);
        let grandTotal = 0;
        let totalMonths = 0;
        const groupBatchRef = 'GRP-' + Date.now().toString().slice(-6);
        const groupMembersInfo = [];

        checkedRows.forEach(row => {
          const targetMemId = row.getAttribute('data-member-id');
          const targetMem = data.members.find(m => m.id === targetMemId);
          const months = Number(row.querySelector('.plage-member-months-select')?.value || 1);
          const lineMontant = months * unitMonthly;
          grandTotal += lineMontant;
          totalMonths += months;

          const memberPeriode = months === 1 ? periode : `${periode} (${months} mois)`;

          const cotRecord = {
            memberId: targetMemId,
            memberName: targetMem ? targetMem.fullName : 'Membre',
            familyId: mem.familyId,
            type: months === 1 ? 'Mensuel' : (months === 3 ? 'Trimestriel' : `${months} Mois`),
            periode: memberPeriode,
            montant: lineMontant,
            modePaiement: modePaiement,
            datePaiement: datePaiement,
            agent: agent,
            groupRef: groupBatchRef,
            payeurChef: mem.fullName,
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

        showToast(`✅ Versement groupé de ${formatMoney(grandTotal, data.config.currency)} validé pour ${checkedRows.length} membres (${totalMonths} mois) !`);
        closeModal('modalAddCotisation');
        formAddCot.reset();
        renderAllViews();

        openGroupReceiptModal({
          family: fam,
          chef: mem,
          members: groupMembersInfo,
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
        const newCot = {
          memberId: memberId,
          memberName: mem ? mem.fullName : 'Membre',
          familyId: mem ? mem.familyId : 'fam-1',
          type: cotType,
          periode: periode,
          montant: Number(document.getElementById('cotMontant').value),
          modePaiement: modePaiement,
          datePaiement: datePaiement,
          agent: agent
        };

        const saved = TAGBA_DB.addCotisation(newCot);
        showToast('Versement enregistré ! Reçu individuel généré.');
        closeModal('modalAddCotisation');
        formAddCot.reset();
        renderAllViews();
        openReceiptModal(saved.id);
      }
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

      TAGBA_DB.updateBureauMember(burId, name, phone, email, bio);
      showToast('Poste du Bureau mis à jour');
      closeModal('modalEditBureau');
      renderBureau();
    });
  }

  // 7. Enregistrer les Paramètres & Montants par Défaut
  const formCfg = document.getElementById('formConfigSettings');
  if (formCfg) {
    formCfg.addEventListener('submit', (e) => {
      enregistrerParametres(e);
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
    const selectCurrency = document.getElementById('cfgCurrency');
    const inputYear = document.getElementById('cfgYear');
    const inputAssocName = document.getElementById('cfgAssocName');
    const inputTagline = document.getElementById('cfgTagline');

    const newMensuel = inputMensuel && inputMensuel.value ? Number(inputMensuel.value) : 5000;
    const newTrimestriel = inputTrimestriel && inputTrimestriel.value ? Number(inputTrimestriel.value) : (newMensuel * 3);
    const newCurrency = selectCurrency && selectCurrency.value ? selectCurrency.value : 'FCFA';
    const newYear = inputYear && inputYear.value ? Number(inputYear.value) : 2026;
    const newAssocName = inputAssocName && inputAssocName.value.trim() ? inputAssocName.value.trim() : 'Association Mutuelle TAGBA';
    const newTagline = inputTagline && inputTagline.value.trim() ? inputTagline.value.trim() : 'Union • Solidarité • Entraide Familiale';

    // Sauvegarder dans la base locale
    const savedConfig = TAGBA_DB.updateConfig({
      cotisationMensuelle: newMensuel,
      cotisationTrimestrielle: newTrimestriel,
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

    showToast(`✅ Paramètres enregistrés : Cotisation mensuelle fixée à ${formatMoney(newMensuel, newCurrency)}`);
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
  const selectCurrency = document.getElementById('cfgCurrency');
  const inputYear = document.getElementById('cfgYear');
  const inputAssocName = document.getElementById('cfgAssocName');
  const inputTagline = document.getElementById('cfgTagline');

  if (inputMensuel) inputMensuel.value = cfg.cotisationMensuelle || 5000;
  if (inputTrimestriel) inputTrimestriel.value = cfg.cotisationTrimestrielle || 15000;
  if (selectCurrency) selectCurrency.value = cfg.currency || 'FCFA';
  if (inputYear) inputYear.value = cfg.year || 2026;
  if (inputAssocName) inputAssocName.value = cfg.assocName || 'Association Mutuelle TAGBA';
  if (inputTagline) inputTagline.value = cfg.tagline || 'Union • Solidarité • Entraide Familiale';

  updateCurrencySuffixes(cfg.currency || 'FCFA');
}

function updateCurrencySuffixes(curr) {
  document.querySelectorAll('.cfgCurrencySuffix').forEach(el => {
    el.textContent = curr;
  });
}

function updateBaremeDisplays() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const dispM = document.getElementById('cfgDisplayMensuel');
  const dispT = document.getElementById('cfgDisplayTrimestriel');

  if (dispM) dispM.textContent = formatMoney(cfg.cotisationMensuelle || 5000, cfg.currency) + ' / mois';
  if (dispT) dispT.textContent = formatMoney(cfg.cotisationTrimestrielle || 15000, cfg.currency) + ' / trimestre';
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

let currentGroupPaymentMode = 'group'; // 'group' ou 'individual'
let currentPlageGlobalDuration = 1; // 1 mois par défaut

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

  openModal('modalAddCotisation');
  const cotSearchInput = document.getElementById('cotMemberSearchInput');
  if (cotSearchInput) cotSearchInput.value = '';
  populateCotisationMembers('');

  const select = document.getElementById('cotMemberSelect');
  if (select) {
    select.value = chef.id;
    onCotMemberSelected();
  }

  showToast(`👑 Plage de versement ouverte pour la ${fam.name}`);
}

function onCotMemberSelected() {
  const select = document.getElementById('cotMemberSelect');
  const groupContainer = document.getElementById('cotGroupPaymentContainer');
  const modalContent = document.getElementById('modalAddCotisation')?.querySelector('.modal-content');
  if (!select || !groupContainer) return;

  const memberId = select.value;
  if (!memberId) {
    groupContainer.style.display = 'none';
    groupContainer.innerHTML = '';
    if (modalContent) modalContent.classList.remove('modal-content-wide');
    return;
  }

  const data = TAGBA_DB.get();
  const member = data.members.find(m => m.id === memberId);
  if (!member) {
    groupContainer.style.display = 'none';
    groupContainer.innerHTML = '';
    if (modalContent) modalContent.classList.remove('modal-content-wide');
    return;
  }

  const family = data.families.find(f => f.id === member.familyId);
  const isChef = isMemberChefDeFamille(member, family);

  if (!isChef) {
    // Membre standard : masquer le panneau groupé et repasser en format classique
    groupContainer.style.display = 'none';
    groupContainer.innerHTML = '';
    currentGroupPaymentMode = 'individual';
    if (modalContent) modalContent.classList.remove('modal-content-wide');
    syncCotisationMontantField();
    return;
  }

  // Chef de famille : élargir la modale et afficher la PLAGE DE VERSEMENT FAMILIAL
  const familyMembers = data.members.filter(m => m.familyId === member.familyId);
  if (modalContent) modalContent.classList.add('modal-content-wide');
  groupContainer.style.display = 'block';
  renderGroupPaymentCard(family, member, familyMembers);
  syncCotisationMontantField();
}

function renderGroupPaymentCard(family, chef, familyMembers) {
  const groupContainer = document.getElementById('cotGroupPaymentContainer');
  if (!groupContainer) return;

  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 5000);

  groupContainer.innerHTML = `
    <div class="family-plage-box">
      <!-- En-tête de la Plage Familiale -->
      <div class="family-group-payment-header">
        <div class="family-group-title">
          <span style="font-size: 26px;">👑</span>
          <div>
            <strong style="font-size: 16px;">Plage de Versement Familial : ${family ? family.name : 'Famille'}</strong>
            <span style="font-size: 12px; font-weight: normal; opacity: 0.9; display: block; margin-top: 2px;">
              Chef de foyer : <strong>${chef.fullName}</strong> (${chef.matricule}) • ${familyMembers.length} membre(s) sous sa tutelle • 📍 ${family ? family.city : 'N/A'}
            </span>
          </div>
        </div>
        <div class="group-mode-toggle">
          <button type="button" class="group-mode-btn ${currentGroupPaymentMode === 'group' ? 'active' : ''}" id="btnModeGroup" onclick="setGroupPaymentMode('group')">
            👥 Plage Groupée (Foyer)
          </button>
          <button type="button" class="group-mode-btn ${currentGroupPaymentMode === 'individual' ? 'active' : ''}" id="btnModeIndiv" onclick="setGroupPaymentMode('individual')">
            👤 Chef Uniquement
          </button>
        </div>
      </div>

      <div id="groupPaymentChecklistSection" style="${currentGroupPaymentMode === 'group' ? '' : 'display: none;'}">
        <!-- Barre d'outils de Versement Rapide par plusieurs (Multi-mois & Multi-membres) -->
        <div class="family-plage-toolbar">
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

          <div style="font-size: 11px; display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="toggleAllFamilyChecks(true)" style="padding: 4px 10px; font-size: 11px;">✅ Tout cocher</button>
            <button type="button" class="btn btn-sm btn-secondary" onclick="toggleAllFamilyChecks(false)" style="padding: 4px 10px; font-size: 11px;">⬜ Tout décocher</button>
            <button type="button" class="btn btn-sm btn-warning" onclick="toggleLateFamilyChecksOnly()" style="padding: 4px 10px; font-size: 11px;" title="Cocher uniquement ceux en retard ou partiel">⚠️ Retardataires uniquement</button>
          </div>
        </div>

        <!-- Tableau / Plage des Membres du Foyer -->
        <div class="plage-table-wrapper">
          <table class="family-plage-table">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;"></th>
                <th>Membre rattaché & Poste</th>
                <th>Statut actuel</th>
                <th style="width: 150px;">Durée à régler</th>
                <th style="text-align: right; width: 120px;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${familyMembers.map(m => {
                const isThisChef = isMemberChefDeFamille(m, family);
                const statusColor = m.statutCotisation === 'A_JOUR' ? '#10b981' : (m.statutCotisation === 'PARTIEL' ? '#f59e0b' : '#ef4444');
                const statusLabel = m.statutCotisation === 'A_JOUR' ? 'À jour' : (m.statutCotisation === 'PARTIEL' ? 'Partiel' : 'En retard');
                const initialMonths = currentPlageGlobalDuration || 1;
                const lineMontant = initialMonths * unitMonthly;

                return `
                  <tr class="family-plage-row row-checked" id="plageRow_${m.id}" data-member-id="${m.id}" data-statut="${m.statutCotisation}">
                    <td style="text-align: center;">
                      <input type="checkbox" class="family-member-cb" value="${m.id}" data-name="${m.fullName}" checked onchange="onFamilyRowCheckChange('${m.id}')" style="cursor: pointer; width: 17px; height: 17px; accent-color: var(--emerald-500);">
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--text-main); font-size: 13px;">
                        ${isThisChef ? '👑 ' : ''}${m.fullName}
                      </div>
                      <div style="font-size: 11px; color: var(--text-muted);">
                        ${m.relationToChef || 'Membre'} • <span style="color: var(--emerald-400); font-weight: 600;">${m.matricule}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge" style="font-size: 10px; background: rgba(255,255,255,0.06); color: ${statusColor}; border: 1px solid ${statusColor}40;">
                        ● ${statusLabel}
                      </span>
                    </td>
                    <td>
                      <select class="plage-months-select plage-member-months-select" id="monthsSelect_${m.id}" onchange="onPlageMemberMonthsChange('${m.id}')">
                        <option value="1" ${initialMonths === 1 ? 'selected' : ''}>1 mois (${formatMoney(unitMonthly * 1, cfg.currency)})</option>
                        <option value="2" ${initialMonths === 2 ? 'selected' : ''}>2 mois (${formatMoney(unitMonthly * 2, cfg.currency)})</option>
                        <option value="3" ${initialMonths === 3 ? 'selected' : ''}>3 mois (${formatMoney(unitMonthly * 3, cfg.currency)})</option>
                        <option value="6" ${initialMonths === 6 ? 'selected' : ''}>6 mois (${formatMoney(unitMonthly * 6, cfg.currency)})</option>
                        <option value="12" ${initialMonths === 12 ? 'selected' : ''}>12 mois (${formatMoney(unitMonthly * 12, cfg.currency)})</option>
                      </select>
                    </td>
                    <td style="text-align: right;">
                      <strong class="plage-line-amount" id="lineAmount_${m.id}" style="color: var(--emerald-400); font-size: 13px;">
                        ${formatMoney(lineMontant, cfg.currency)}
                      </strong>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Récapitulatif Global de la Plage -->
        <div class="family-group-summary">
          <div>
            <span>Membres retenus : </span>
            <strong id="groupCheckedCount">${familyMembers.length}</strong> / <strong>${familyMembers.length}</strong>
            <span style="opacity: 0.5; margin: 0 8px;">•</span>
            <span>Total mois couverts : </span>
            <strong id="groupTotalMonthsDisplay">${familyMembers.length * currentPlageGlobalDuration} mois</strong>
          </div>
          <div>
            <span>Total général à encaisser : </span>
            <span class="total-val" id="groupTotalAmount" style="font-size: 17px;">
              ${formatMoney(familyMembers.length * currentPlageGlobalDuration * unitMonthly, cfg.currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setGroupPaymentMode(mode) {
  currentGroupPaymentMode = mode;
  const sec = document.getElementById('groupPaymentChecklistSection');
  const btnGroup = document.getElementById('btnModeGroup');
  const btnIndiv = document.getElementById('btnModeIndiv');

  if (btnGroup && btnIndiv) {
    if (mode === 'group') {
      btnGroup.classList.add('active');
      btnIndiv.classList.remove('active');
      if (sec) sec.style.display = '';
    } else {
      btnIndiv.classList.add('active');
      btnGroup.classList.remove('active');
      if (sec) sec.style.display = 'none';
    }
  }
  syncCotisationMontantField();
}

// Appliquer une durée collective à tous les membres de la plage
function applyPlageDurationAll(months) {
  currentPlageGlobalDuration = months;
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const unitMonthly = Number(cfg.cotisationMensuelle || 5000);

  // Mettre à jour les boutons de pilules
  document.querySelectorAll('.plage-pill-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`plageDurBtn_${months}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Mettre à jour tous les selects de durée par ligne
  document.querySelectorAll('.plage-member-months-select').forEach(sel => {
    sel.value = months;
  });

  // Mettre à jour les montants par ligne
  document.querySelectorAll('.family-plage-row').forEach(row => {
    const memId = row.getAttribute('data-member-id');
    const amountEl = document.getElementById(`lineAmount_${memId}`);
    if (amountEl) {
      amountEl.textContent = formatMoney(months * unitMonthly, cfg.currency);
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
  const unitMonthly = Number(cfg.cotisationMensuelle || 5000);

  const sel = document.getElementById(`monthsSelect_${memberId}`);
  const amountEl = document.getElementById(`lineAmount_${memberId}`);
  if (sel && amountEl) {
    const months = Number(sel.value || 1);
    amountEl.textContent = formatMoney(months * unitMonthly, cfg.currency);
  }
  syncCotisationMontantField();
}

function onFamilyRowCheckChange(memberId) {
  const row = document.getElementById(`plageRow_${memberId}`);
  const cb = row ? row.querySelector('.family-member-cb') : null;
  if (row && cb) {
    if (cb.checked) {
      row.classList.add('row-checked');
    } else {
      row.classList.remove('row-checked');
    }
  }
  syncCotisationMontantField();
}

function toggleAllFamilyChecks(checked) {
  document.querySelectorAll('.family-plage-row').forEach(row => {
    const cb = row.querySelector('.family-member-cb');
    if (cb) {
      cb.checked = checked;
      if (checked) row.classList.add('row-checked');
      else row.classList.remove('row-checked');
    }
  });
  syncCotisationMontantField();
}

function toggleLateFamilyChecksOnly() {
  document.querySelectorAll('.family-plage-row').forEach(row => {
    const cb = row.querySelector('.family-member-cb');
    const statut = row.getAttribute('data-statut');
    const isLate = statut !== 'A_JOUR';
    if (cb) {
      cb.checked = isLate;
      if (isLate) row.classList.add('row-checked');
      else row.classList.remove('row-checked');
    }
  });
  syncCotisationMontantField();
  showToast('Membres avec cotisations en retard ou partielles sélectionnés !');
}

function syncCotisationMontantField() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const cotMontantInput = document.getElementById('cotMontant');
  if (!cotMontantInput) return;

  const unitMonthly = Number(cfg.cotisationMensuelle || 5000);
  const groupContainer = document.getElementById('cotGroupPaymentContainer');
  const isGroupActive = groupContainer && groupContainer.style.display !== 'none' && currentGroupPaymentMode === 'group';

  if (isGroupActive) {
    const checkedRows = Array.from(document.querySelectorAll('.family-plage-row')).filter(r => {
      const cb = r.querySelector('.family-member-cb');
      return cb && cb.checked;
    });

    let grandTotal = 0;
    let totalMonths = 0;

    checkedRows.forEach(row => {
      const months = Number(row.querySelector('.plage-member-months-select')?.value || 1);
      grandTotal += months * unitMonthly;
      totalMonths += months;
    });

    const countEl = document.getElementById('groupCheckedCount');
    const monthsEl = document.getElementById('groupTotalMonthsDisplay');
    const totalEl = document.getElementById('groupTotalAmount');

    if (countEl) countEl.textContent = checkedRows.length;
    if (monthsEl) monthsEl.textContent = `${totalMonths} mois`;
    if (totalEl) totalEl.textContent = formatMoney(grandTotal, cfg.currency);

    cotMontantInput.value = grandTotal;
  } else {
    const cotTypeSelect = document.getElementById('cotType');
    const cotType = cotTypeSelect ? cotTypeSelect.value : 'Mensuel';
    const unitMontant = cotType === 'Trimestriel'
      ? (cfg.cotisationTrimestrielle || 15000)
      : (cfg.cotisationMensuelle || 5000);
    cotMontantInput.value = unitMontant;
  }
}

function updateCotisationModalDefaults() {
  const data = TAGBA_DB.get();
  const cfg = data.config || {};
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
    if (optMensuel) optMensuel.textContent = `Mensuel (${formatMoney(cfg.cotisationMensuelle || 5000, cfg.currency)})`;
    if (optTrimestriel) optTrimestriel.textContent = `Trimestriel (${formatMoney(cfg.cotisationTrimestrielle || 15000, cfg.currency)})`;
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

  // 5. Réinitialiser la durée globale à 1 mois et synchroniser le montant
  currentPlageGlobalDuration = 1;
  currentGroupPaymentMode = 'group';
  syncCotisationMontantField();
}

// Reçu officiel pour un Versement Groupé Familial (Détaillant chaque membre et sa durée)
function openGroupReceiptModal(groupInfo) {
  const container = document.getElementById('receiptContent');
  if (!container) return;

  const data = TAGBA_DB.get();
  const cfg = data.config || {};
  const { family, chef, members, totalAmount, totalMonths, periode, datePaiement, modePaiement, groupBatchRef, type, currency } = groupInfo;

  container.innerHTML = `
    <div class="receipt-paper">
      <div class="receipt-header">
        <h2>${cfg.assocName}</h2>
        <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600;">${cfg.tagline}</p>
        <p style="font-size: 13px; color: #047857; margin-top: 6px; font-weight: 700;">REÇU OFFICIEL DE VERSEMENT GROUPÉ FAMILIAL</p>
      </div>

      <div class="receipt-meta">
        <div>
          <p><strong>N° Référence Groupe :</strong> ${groupBatchRef}</p>
          <p><strong>Date d'émission :</strong> ${datePaiement}</p>
          <p><strong>Période de référence :</strong> ${periode}</p>
          <p><strong>Cumul des périodes :</strong> ${totalMonths} mois réglés</p>
        </div>
        <div>
          <p><strong>Chef de Famille Cotisant :</strong> 👑 ${chef.fullName}</p>
          <p><strong>Matricule Chef :</strong> ${chef.matricule}</p>
          <p><strong>Foyer Familial :</strong> ${family ? family.name : 'Famille'}</p>
          <p><strong>Membres pris en charge :</strong> ${members.length} cotisant(s)</p>
        </div>
      </div>

      <!-- Tableau détaillé des membres cotisés avec nombre de mois -->
      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 12px; text-transform: uppercase; color: #4b5569; margin-bottom: 8px; letter-spacing: 0.05em;">Détail de la plage des membres pris en charge :</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 8px;">N°</th>
              <th style="padding: 8px;">Matricule</th>
              <th style="padding: 8px;">Membre Cotisant</th>
              <th style="padding: 8px;">Lien Chef</th>
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
                <td style="padding: 8px; color: #475569;">${item.member ? item.member.relationToChef : 'Membre'}</td>
                <td style="padding: 8px; text-align: center; font-weight: 600; color: #0f766e;">${item.months} mois</td>
                <td style="padding: 8px; text-align: right; font-weight: 700; color: #065f46;">${formatMoney(item.amount, currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="receipt-amount-box">
        <span style="font-size: 12px; color: #065f46; text-transform: uppercase; font-weight: 700;">Total Encaissé pour le Foyer (${members.length} membres • ${totalMonths} mois)</span>
        <h3>${formatMoney(totalAmount, currency)}</h3>
        <p style="font-size: 12px; color: #4b5569; margin-top: 4px;">Règlement effectué par : <strong>${chef.fullName}</strong> • Mode : <strong>${modePaiement}</strong></p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 12px;">
        <div style="text-align: center;">
          <p style="font-weight: 600; margin-bottom: 30px;">Le Chef de Famille Cotisant</p>
          <p style="color: #6b7280; font-weight: 600;">${chef.fullName}</p>
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
  reader.onload = function(e) {
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
