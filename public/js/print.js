/**
 * TAGBA - Moteur d'Impression Officiel & Export PDF
 * Association Mutuelle de Solidarité et d'Entraide (Famille TAGBA)
 * Permet d'imprimer partout dans l'application avec en-têtes officielles et blocs de signatures
 */

(function () {
  'use strict';

  // Formatage monétaire sécurisé
  function formatMoney(amount, currency) {
    const val = Number(amount || 0);
    const curr = currency || 'FCFA';
    return val.toLocaleString('fr-FR') + ' ' + curr;
  }

  // Formatage de date sécurisé
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const parts = String(dateStr).split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    } catch (_) {
      return dateStr;
    }
  }

  // Récupération des données du store
  function getDbData() {
    if (typeof TAGBA_DB !== 'undefined' && typeof TAGBA_DB.get === 'function') {
      return TAGBA_DB.get();
    }
    return {
      config: {
        assocName: 'Association Mutuelle TAGBA',
        tagline: 'Union • Solidarité • Entraide Familiale',
        currency: 'FCFA',
        cotisationMensuelle: 5000,
        fondsCaisse: 0
      },
      bureau: [],
      families: [],
      members: [],
      cotisations: [],
      evenements: [],
      ceremonies: [],
      depenses: [],
      contributionsVolontaires: [],
      entraide: []
    };
  }

  // Exécuteur d'impression universel
  function executeTagbaPrint(contentHtml, documentTitle) {
    let printArea = document.getElementById('tagbaPrintArea');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'tagbaPrintArea';
      printArea.className = 'tagba-print-container';
      document.body.appendChild(printArea);
    }

    printArea.innerHTML = contentHtml;

    const originalTitle = document.title;
    if (documentTitle) {
      document.title = documentTitle;
    }

    document.body.classList.add('tagba-printing-active');

    // Déclenchement de l'impression
    setTimeout(() => {
      window.print();
    }, 50);

    const cleanup = () => {
      document.body.classList.remove('tagba-printing-active');
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 3000);
  }

  // En-tête officielle mutualiste
  function getOfficialPrintHeader(title, subtitle, metaItems) {
    const data = getDbData();
    const cfg = data.config || {};
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const metaHtml = (metaItems && metaItems.length > 0)
      ? `<div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 10px;">
          ${metaItems.map(m => `
            <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 11px;">
              <span style="color: #64748b;">${m.label} :</span> <strong style="color: #0f172a;">${m.value}</strong>
            </div>
          `).join('')}
        </div>`
      : '';

    return `
      <div class="print-doc-header" style="margin-bottom: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
          <div style="max-width: 58%;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">🏛️</span>
              <div>
                <h1 style="font-size: 18px; font-weight: 800; color: #047857; margin: 0; text-transform: uppercase; letter-spacing: 0.04em;">
                  ${cfg.assocName || 'ASSOCIATION MUTUELLE TAGBA'}
                </h1>
                <p style="font-size: 10px; font-weight: 700; color: #b45309; text-transform: uppercase; margin: 2px 0 0 0; letter-spacing: 0.06em;">
                  « ${cfg.tagline || 'Fraternité • Solidarité • Entraide Familiale'} »
                </p>
              </div>
            </div>
            <div style="font-size: 9.5px; color: #475569; margin-top: 4px; line-height: 1.3;">
              Mutuelle d'Entraide et de Fraternité des Ressortissants de Tagba • Siège : Khoroko / Abidjan<br>
              Plateforme Numérique de Gestion & Traçabilité Cloud
            </div>
          </div>
          
          <div style="text-align: right; max-width: 40%;">
            <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; text-transform: uppercase;">
              RÉPUBLIQUE DE CÔTE D'IVOIRE
            </div>
            <div style="font-size: 8.5px; color: #64748b; font-style: italic; margin-bottom: 4px;">
              Union - Discipline - Travail
            </div>
            <div style="font-size: 9.5px; color: #334155; background: #f8fafc; border: 1px solid #cbd5e1; padding: 3px 6px; border-radius: 4px; display: inline-block;">
              Édité le : <strong>${dateStr} à ${timeStr}</strong>
            </div>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 14px;">
          <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.03em;">
            ${title}
          </h2>
          ${subtitle ? `<p style="font-size: 11.5px; color: #475569; margin: 3px 0 0 0; font-weight: 600;">${subtitle}</p>` : ''}
          ${metaHtml}
        </div>
      </div>
    `;
  }

  // Bloc des 3 signatures statutaires
  function getOfficialPrintSignatures() {
    const data = getDbData();
    const bureau = data.bureau || [];
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const pdt = bureau.find(b => /président|president/i.test(b.role) && !/vice/i.test(b.role))?.holder || 'BAMBA Mamadou';
    const tresorier = bureau.find(b => /trésorier|tresorier/i.test(b.role) && !/adjoint/i.test(b.role))?.holder || 'Seydou Coulibaly';
    const cComptes = bureau.find(b => /commissaire/i.test(b.role))?.holder || 'Commissariat aux Comptes';

    return `
      <div class="tagba-print-signatures" style="margin-top: 28px; page-break-inside: avoid; border-top: 1px solid #94a3b8; padding-top: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="font-size: 9.5px; color: #475569; font-style: italic; text-align: center; margin-bottom: 12px;">
          « Le présent document a été arrêté et certifié conforme aux registres numériques de l'Association Mutuelle TAGBA en date du ${dateStr}. »
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; text-align: center;">
          
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #fafafa; min-height: 95px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Le Commissaire aux Comptes</div>
              <div style="font-size: 8.5px; color: #64748b;">(Contrôle & Conformité)</div>
              <div style="font-size: 10.5px; font-weight: 600; color: #334155; margin-top: 3px;">${cComptes}</div>
            </div>
            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; margin-top: 25px;">
              Visa & Mention "Lu et Approuvé"
            </div>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #fafafa; min-height: 95px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Le Trésorier Général</div>
              <div style="font-size: 8.5px; color: #64748b;">(Gestion Financière & Recouvrement)</div>
              <div style="font-size: 10.5px; font-weight: 600; color: #047857; margin-top: 3px;">${tresorier}</div>
            </div>
            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; margin-top: 25px;">
              Visa & Signature
            </div>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; background: #fafafa; min-height: 95px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 10.5px; font-weight: 700; color: #0f172a; text-transform: uppercase;">Le Président du Bureau</div>
              <div style="font-size: 8.5px; color: #64748b;">(Ordonnateur & Représentant Légal)</div>
              <div style="font-size: 10.5px; font-weight: 600; color: #b45309; margin-top: 3px;">${pdt}</div>
            </div>
            <div style="font-size: 8.5px; color: #94a3b8; font-style: italic; margin-top: 25px;">
              Cachet & Signature Officielle
            </div>
          </div>

        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; font-size: 8.5px; color: #94a3b8; border-top: 1px dotted #e2e8f0; padding-top: 4px;">
          <span>Association Mutuelle TAGBA • Document Officiel d'Archive</span>
          <span>Système TAGBA Cloud Sécurisé</span>
          <span>Page 1 sur 1</span>
        </div>
      </div>
    `;
  }

  // Style CSS embarqué spécifique pour le conteneur d'impression
  const printDocStyle = `
    <style>
      .tagba-print-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        padding: 0;
        margin: 0;
      }
      .tagba-print-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 14px;
        font-size: 11px;
      }
      .tagba-print-table th {
        background: #f1f5f9;
        color: #0f172a;
        font-weight: 700;
        text-transform: uppercase;
        font-size: 10px;
        border: 1px solid #64748b;
        padding: 6px 8px;
        text-align: left;
      }
      .tagba-print-table td {
        border: 1px solid #cbd5e1;
        padding: 5px 8px;
        vertical-align: middle;
      }
      .tagba-print-table tbody tr:nth-child(even) {
        background: #f8fafc;
      }
      .tagba-print-table tfoot td {
        font-weight: 700;
        background: #f1f5f9;
        border-top: 2px solid #0f172a;
      }
      .print-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9.5px;
        font-weight: 700;
        border: 1px solid #cbd5e1;
      }
      .print-badge-success { background: #ecfdf5; color: #065f46; border-color: #a7f3d0; }
      .print-badge-warning { background: #fffbeb; color: #92400e; border-color: #fde68a; }
      .print-badge-danger { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
      .print-badge-info { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
    </style>
  `;

  // ============================================================
  // 1. RAPPORT TABLEAU DE BORD (DASHBOARD)
  // ============================================================
  function printDashboardReport() {
    const data = getDbData();
    const cfg = data.config || {};
    const curr = cfg.currency || 'FCFA';

    const totalMembres = (data.members || []).length;
    const totalFamilles = (data.families || []).length;
    const fondsDepart = Number(cfg.fondsCaisse || 0);

    const isEventCotis = (c) => {
      const t = (c.type || '').toLowerCase();
      const p = (c.periode || '').toLowerCase();
      return !!c.eventId || !!c.evenementId || t.includes('venement') || t.includes('vènement') || p.includes('sacrifice') || p.includes('khoroko');
    };

    const cotisMensuelles = (data.cotisations || [])
      .filter(c => !isEventCotis(c))
      .reduce((s, c) => s + Number(c.montant || 0), 0);

    const cotisEvenements = (data.cotisations || [])
      .filter(c => isEventCotis(c))
      .reduce((s, c) => s + Number(c.montant || 0), 0);

    const totalDons = (data.contributionsVolontaires || [])
      .reduce((s, d) => s + Number(d.montant || 0), 0);

    const totalDepenses = (data.depenses || [])
      .reduce((s, d) => s + Number(d.montant || 0), 0);

    const totalEntraide = (data.entraide || [])
      .filter(e => e.statut === 'Accordée' || e.statut === 'Payée' || e.statut === 'Terminé')
      .reduce((s, e) => s + Number(e.montant || 0), 0);

    const caisseNet = fondsDepart + cotisMensuelles + cotisEvenements + totalDons - totalDepenses;

    const meta = [
      { label: 'Effectif Total', value: `${totalMembres} membres (${totalFamilles} foyers)` },
      { label: 'Solde Net Caisse', value: formatMoney(caisseNet, curr) },
      { label: 'Cotisations Encaissées', value: formatMoney(cotisMensuelles + cotisEvenements, curr) }
    ];

    const header = getOfficialPrintHeader('Bilan Général & Tableau de Bord Exécutif', 'Situation financière et associative globale de la Mutuelle', meta);

    // Derniers versements
    const recentCotis = [...(data.cotisations || [])]
      .sort((a, b) => new Date(b.datePaiement || 0) - new Date(a.datePaiement || 0))
      .slice(0, 10);

    const recentHtml = recentCotis.map((c, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${c.recuNum || 'N/A'}</strong></td>
        <td>${formatDate(c.datePaiement)}</td>
        <td>${c.memberName || 'Membre'}</td>
        <td>${c.type || 'Ordinaire'}</td>
        <td>${c.periode || 'N/A'}</td>
        <td style="font-weight: 700; text-align: right; color: #047857;">${formatMoney(c.montant, curr)}</td>
        <td>${c.modePaiement || 'Espèces'}</td>
      </tr>
    `).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;">
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #ecfdf5;">
            <div style="font-size: 10px; color: #065f46; text-transform: uppercase; font-weight: 700;">Solde Net Caisse</div>
            <div style="font-size: 16px; font-weight: 800; color: #047857; margin-top: 2px;">${formatMoney(caisseNet, curr)}</div>
            <div style="font-size: 9px; color: #047857;">Disponible immédiatement</div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc;">
            <div style="font-size: 10px; color: #475569; text-transform: uppercase; font-weight: 700;">Cotisations Mensuelles</div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;">${formatMoney(cotisMensuelles, curr)}</div>
            <div style="font-size: 9px; color: #64748b;">Recouvrement ordinaire</div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #fffbeb;">
            <div style="font-size: 10px; color: #92400e; text-transform: uppercase; font-weight: 700;">Événements / Sacrifices</div>
            <div style="font-size: 16px; font-weight: 800; color: #b45309; margin-top: 2px;">${formatMoney(cotisEvenements, curr)}</div>
            <div style="font-size: 9px; color: #92400e;">Fonds spécifiques</div>
          </div>
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #fef2f2;">
            <div style="font-size: 10px; color: #991b1b; text-transform: uppercase; font-weight: 700;">Dépenses & Secours</div>
            <div style="font-size: 16px; font-weight: 800; color: #b91c1c; margin-top: 2px;">${formatMoney(totalDepenses, curr)}</div>
            <div style="font-size: 9px; color: #991b1b;">Décaissements totaux</div>
          </div>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; margin: 14px 0 6px 0; color: #0f172a; border-bottom: 1px solid #94a3b8; padding-bottom: 4px;">
          Journal des 10 Derniers Encaissements Enregistrés
        </h3>
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Réf. Reçu</th>
              <th>Date</th>
              <th>Membre</th>
              <th>Type</th>
              <th>Période</th>
              <th style="text-align: right;">Montant</th>
              <th>Mode</th>
            </tr>
          </thead>
          <tbody>
            ${recentHtml || '<tr><td colspan="8" style="text-align: center; color: #64748b;">Aucun versement enregistré pour le moment.</td></tr>'}
          </tbody>
        </table>

        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Bilan_General_Synthese');
  }

  // ============================================================
  // 2. LISTE OFFICIELLE DU BUREAU EXÉCUTIF
  // ============================================================
  function printBureauList() {
    const data = getDbData();
    const bureau = data.bureau || [];
    const meta = [
      { label: 'Effectif du Bureau', value: `${bureau.length} membres` },
      { label: 'Mandat Statutaire', value: '2026 - 2029' },
      { label: 'Siège Administratif', value: 'Khoroko / Abidjan' }
    ];

    const header = getOfficialPrintHeader('Liste Officielle du Bureau Exécutif & Commissariat', 'Composition nominative des instances dirigeantes prévues par les Statuts', meta);

    const rowsHtml = bureau.map((b, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td style="font-weight: 700; color: #047857;">${b.role}</td>
        <td style="font-weight: 600;">${b.holder || 'Poste à pourvoir'}</td>
        <td>${b.phone || 'Non renseigné'}</td>
        <td>${b.profession || 'N/A'}</td>
        <td style="font-size: 10px; color: #475569;">${b.description || 'Administration statutaire'}</td>
      </tr>
    `).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th style="width: 28%;">Poste Statutaire</th>
              <th style="width: 25%;">Nom et Prénoms</th>
              <th style="width: 15%;">Contact Téléphonique</th>
              <th style="width: 14%;">Profession</th>
              <th>Missions / Rôle</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="6" style="text-align: center;">Aucun poste enregistré.</td></tr>'}
          </tbody>
        </table>
        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Bureau_Executif_Officiel');
  }

  // ============================================================
  // 3. REGISTRE DES FAMILLES & MEMBRES
  // ============================================================
  function printFamiliesAndMembersReport() {
    const data = getDbData();
    const members = [...(data.members || [])].sort((a,b) => (a.fullName || "").localeCompare(b.fullName || "", "fr", { sensitivity: "base" }));
    const families = data.families || [];
    const curr = data.config?.currency || 'FCFA';

    const meta = [
      { label: 'Nombre de Foyers', value: `${families.length} familles` },
      { label: 'Total Membres Adhérents', value: `${members.length} membres` },
      { label: 'Lieu de Référence', value: 'Khoroko' }
    ];

    const header = getOfficialPrintHeader('Registre Officiel des Familles & Membres Adhérents', 'Recensement exhaustif de la communauté mutualiste TAGBA', meta);

    const rowsHtml = members.map((m, idx) => {
      const fam = families.find(f => f.id === m.familyId);
      const chefNom = fam ? fam.chefDeFamille : 'N/A';
      const famNom = fam ? fam.name : 'N/A';
      const statutBadge = m.statutCotisation === 'EN_AVANCE'
        ? '<span class="print-badge print-badge-info">🚀 En avance</span>'
        : m.statutCotisation === 'A_JOUR'
          ? '<span class="print-badge print-badge-success">✅ À jour</span>'
          : '<span class="print-badge print-badge-danger">⚠️ En retard</span>';

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-weight: 700; color: #047857;">${m.matricule || 'N/A'}</td>
          <td style="font-weight: 600;">${m.fullName} ${m.bureauRole ? `<small>(${m.bureauRole})</small>` : ''}</td>
          <td><strong>${famNom}</strong> <br><small style="color: #64748b;">Chef : ${chefNom}</small></td>
          <td>${m.relationToChef || 'Membre'}</td>
          <td>${m.phone ? m.phone + (m.phone2 ? ' / ' + m.phone2 : '') : 'N/A'}</td>
          <td>${m.profession || 'N/A'}</td>
          <td style="text-align: center;">${statutBadge}</td>
        </tr>
      `;
    }).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Matricule / N° Membre</th>
              <th>Nom & Prénoms / Contact</th>
              <th>Foyer & Chef de Famille</th>
              <th>Lien</th>
              <th>Téléphone</th>
              <th>Profession</th>
              <th style="text-align: center;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" style="text-align: center;">Aucun membre enregistré.</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7" style="text-align: right; font-weight: 700;">TOTAL MEMBRES REPERTORIES :</td>
              <td style="text-align: center; font-weight: 800; color: #047857;">${members.length}</td>
            </tr>
          </tfoot>
        </table>
        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Registre_Familles_Membres');
  }

  // ============================================================
  // 4. ÉTAT DES COTISATIONS MENSUELLES (AVEC FILTRES DYNAMIQUES)
  // (Tous, À jour, En retard, ou filtré par nombre de mois de retard)
  // ============================================================
  function printMonthlyCotisationsReport(statusArg = null, lateArg = null) {
    const data = getDbData();
    const allMembers = data.members || [];
    const cfg = data.config || {};
    const curr = cfg.currency || 'FCFA';
    const unitPrice = Number(cfg.cotisationMensuelle || 500);

    // 1. Résolution des critères de filtrage
    let filterStatus = 'ALL';
    let filterLate = 'ALL';
    let searchQuery = '';

    if (typeof statusArg === 'object' && statusArg !== null) {
      filterStatus = statusArg.status || statusArg.filterStatus || 'ALL';
      filterLate = statusArg.late !== undefined ? String(statusArg.late) : (statusArg.lateMonths !== undefined ? String(statusArg.lateMonths) : 'ALL');
      searchQuery = statusArg.search || statusArg.query || '';
    } else if (typeof statusArg === 'string') {
      filterStatus = statusArg;
      if (lateArg !== null && lateArg !== undefined) filterLate = String(lateArg);
    } else {
      // Lecture automatique depuis les contrôles de l'interface active
      filterStatus = window.currentMonthsTrackingFilter || 'ALL';
      const lateSel = document.getElementById('filterMonthsLateSelect');
      filterLate = lateSel ? lateSel.value : (window.currentMonthsLateFilter || 'ALL');
      const searchInput = document.getElementById('searchMonthsTrackingInput');
      searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
    }

    // 2. Audit complet de chaque membre
    const auditedMembers = allMembers.map(m => {
      const audit = (typeof getMemberCotisationAudit === 'function')
        ? getMemberCotisationAudit(m.id)
        : null;
      const fam = (data.families || []).find(f => f.id === m.familyId);
      return { member: m, audit, family: fam };
    });

    // 3. Filtrage précis selon les critères
    const filtered = auditedMembers.filter(item => {
      const a = item.audit;
      if (!a) return true;

      // Filtre statut
      if (filterStatus === 'A_JOUR' && (a.statutKey !== 'A_JOUR' && a.statutKey !== 'EN_AVANCE')) return false;
      if (filterStatus === 'EN_AVANCE' && a.monthsAdvanceCount === 0) return false;
      if (filterStatus === 'EN_RETARD' && a.monthsLateCount === 0) return false;

      // Filtre nombre de mois de retard
      if (filterLate && filterLate !== 'ALL') {
        if (filterLate === '4+') {
          if (a.monthsLateCount < 4) return false;
        } else {
          const target = parseInt(filterLate, 10);
          if (a.monthsLateCount !== target) return false;
        }
      }

      // Recherche par texte
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const mName = (item.member.fullName || '').toLowerCase();
        const mMat = (item.member.matricule || '').toLowerCase();
        const fName = (item.family?.name || '').toLowerCase();
        if (!mName.includes(q) && !mMat.includes(q) && !fName.includes(q)) return false;
      }

      return true;
    });

    // Tri alphabétique systématique par nom officiel du membre
    filtered.sort((a, b) => (a.member?.fullName || '').localeCompare(b.member?.fullName || '', 'fr', { sensitivity: 'base' }));

    // 4. Calcul des totaux sur la sélection filtrée
    let totalRecouvreSelection = 0;
    let totalArrieresSelection = 0;
    let countAJourSelection = 0;
    let countRetardSelection = 0;

    filtered.forEach(item => {
      const a = item.audit;
      if (a) {
        totalRecouvreSelection += Number(a.totalVerse || 0);
        totalArrieresSelection += Number(a.arrieresMontant || 0);
        if (a.monthsLateCount > 0) countRetardSelection++;
        else countAJourSelection++;
      }
    });

    // 5. Titres et métadonnées adaptés au filtre
    let docTitle = 'État Récapitulatif des Cotisations Mensuelles';
    let docSubtitle = `Suivi chronologique des versements ordinaires depuis le ${cfg.dateDebutCotisations || '04/10/2026'}`;
    let filterBadgeLabel = 'Tous les membres';
    let pdfFileName = 'TAGBA_Cotisations_Mensuelles';

    if (filterStatus === 'A_JOUR') {
      docTitle = 'Liste Officielle des Membres À Jour de Cotisation';
      docSubtitle = `Adhérents en règle sans arriérés au calendrier officiel de la Mutuelle`;
      filterBadgeLabel = '✅ Membres À Jour & En Avance';
      pdfFileName = 'TAGBA_Membres_A_Jour';
    } else if (filterStatus === 'EN_RETARD') {
      if (filterLate && filterLate !== 'ALL') {
        const lateTxt = filterLate === '4+' ? '4 mois et plus' : `${filterLate} mois`;
        docTitle = `État des Membres En Retard (${lateTxt} de retard)`;
        docSubtitle = `Relance et suivi spécifique des adhérents accusant ${lateTxt} d'arriéré de cotisation`;
        filterBadgeLabel = `⚠️ Retard de ${lateTxt}`;
        pdfFileName = `TAGBA_Membres_Retard_${filterLate}mois`;
      } else {
        docTitle = 'État Nominatif des Membres En Retard de Cotisation';
        docSubtitle = `Relevé des adhérents en souffrance de cotisations ordinaires et arriérés exigibles`;
        filterBadgeLabel = '⚠️ Tous les Membres En Retard';
        pdfFileName = 'TAGBA_Membres_En_Retard';
      }
    } else if (filterStatus === 'EN_AVANCE') {
      docTitle = 'Liste des Membres Ayant Cotisé par Anticipation';
      docSubtitle = `Adhérents disposant d'une avance sur leurs cotisations futures`;
      filterBadgeLabel = '🚀 Cotisations Anticipées';
      pdfFileName = 'TAGBA_Membres_En_Avance';
    } else if (filterLate && filterLate !== 'ALL') {
      const lateTxt = filterLate === '4+' ? '4 mois et plus' : `${filterLate} mois`;
      docTitle = `État des Cotisations - Retard de ${lateTxt}`;
      docSubtitle = `Filtrage des membres accusant ${lateTxt} d'arriéré de cotisation`;
      filterBadgeLabel = `Retard (${lateTxt})`;
      pdfFileName = `TAGBA_Cotisations_Retard_${filterLate}mois`;
    }

    const meta = [
      { label: 'Filtre Appliqué', value: filterBadgeLabel },
      { label: 'Membres Sélectionnés', value: `${filtered.length} / ${allMembers.length} adhérent(s)` },
      { label: 'Total Versé Sélection', value: formatMoney(totalRecouvreSelection, curr) },
      { label: 'Total Arriérés Dus', value: formatMoney(totalArrieresSelection, curr) },
      { label: 'Tarif Mensuel', value: `${formatMoney(unitPrice, curr)} / mois` }
    ];

    const header = getOfficialPrintHeader(docTitle, docSubtitle, meta);

    const rowsHtml = filtered.map((item, idx) => {
      const m = item.member;
      const fam = item.family;
      const audit = item.audit;
      const totalVerse = audit ? audit.totalVerse : 0;
      const monthsPaid = audit ? audit.monthsPaidCount : 0;
      const monthsLate = audit ? audit.monthsLateCount : 0;
      const arriere = audit ? audit.arrieresMontant : 0;
      const isLate = monthsLate > 0;

      let statutBadge = '';
      if (audit) {
        if (audit.statutKey === 'EN_AVANCE') {
          statutBadge = `<span class="print-badge print-badge-info">🚀 En Avance (+${audit.monthsAdvanceCount}m)</span>`;
        } else if (isLate) {
          statutBadge = `<span class="print-badge print-badge-danger">⚠️ Retard (${monthsLate} mois)</span>`;
        } else {
          statutBadge = `<span class="print-badge print-badge-success">✅ À Jour</span>`;
        }
      }

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-weight: 700; color: #047857;">${m.matricule || 'N/A'}</td>
          <td style="font-weight: 600;">
            ${m.fullName}
            ${m.bureauRole ? `<small style="color: #6366f1;">(${m.bureauRole})</small>` : ''}
            ${m.phone ? `<br><small style="color: #64748b;">📞 ${m.phone}${m.phone2 ? ' / ' + m.phone2 : ''}</small>` : ''}
          </td>
          <td>${fam ? fam.name : 'N/A'}</td>
          <td style="text-align: right; font-weight: 700; color: #047857;">${formatMoney(totalVerse, curr)}</td>
          <td style="text-align: center;">${monthsPaid} mois</td>
          <td style="text-align: center; font-weight: 700; color: ${isLate ? '#b91c1c' : '#64748b'};">
            ${isLate ? `${monthsLate} mois` : '0'}
          </td>
          <td style="text-align: center;">${statutBadge}</td>
          <td style="text-align: right; color: ${isLate ? '#b91c1c' : '#047857'}; font-weight: 700;">
            ${isLate ? `-${formatMoney(arriere, curr)}` : '0 FCFA'}
          </td>
        </tr>
      `;
    }).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Matricule / N° Membre</th>
              <th>Nom & Prénoms / Contact</th>
              <th>Foyer</th>
              <th style="text-align: right;">Total Versé</th>
              <th style="text-align: center;">Mois Réglés</th>
              <th style="text-align: center;">Mois en Retard</th>
              <th style="text-align: center;">Statut Échéance</th>
              <th style="text-align: right;">Arriéré / Solde</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="9" style="text-align: center; padding: 24px; color: #64748b;">Aucun membre ne correspond aux critères sélectionnés (${filterBadgeLabel}).</td></tr>`}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right; font-weight: 700;">TOTAL SÉLECTION (${filtered.length} membre${filtered.length > 1 ? 's' : ''}) :</td>
              <td style="text-align: right; font-weight: 800; color: #047857;">${formatMoney(totalRecouvreSelection, curr)}</td>
              <td></td>
              <td></td>
              <td></td>
              <td style="text-align: right; font-weight: 800; color: ${totalArrieresSelection > 0 ? '#b91c1c' : '#047857'};">
                ${totalArrieresSelection > 0 ? `-${formatMoney(totalArrieresSelection, curr)}` : '0 FCFA'}
              </td>
            </tr>
          </tfoot>
        </table>
        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, pdfFileName);
  }

  // ============================================================
  // 5. REGISTRE DES REÇUS ET ENCAISSEMENTS
  // ============================================================
  function printReceiptsJournal() {
    const data = getDbData();
    const cotisations = data.cotisations || [];
    const curr = data.config?.currency || 'FCFA';

    const sortedCotis = [...cotisations].sort((a, b) => new Date(b.datePaiement || 0) - new Date(a.datePaiement || 0));
    const totalSomme = sortedCotis.reduce((s, c) => s + Number(c.montant || 0), 0);

    const meta = [
      { label: 'Nombre Total de Reçus', value: `${sortedCotis.length} reçus émis` },
      { label: 'Total Général Encaissé', value: formatMoney(totalSomme, curr) }
    ];

    const header = getOfficialPrintHeader('Journal Général des Reçus & Encaissements', 'Grand livre chronologique de tous les paiements enregistrés', meta);

    const rowsHtml = sortedCotis.map((c, idx) => {
      const cMemId = c.memberId || c.member_id;
      const mem = (data.members || []).find(mbr => {
        if (cMemId) return mbr.id === cMemId;
        if (c.matricule && mbr.matricule) return mbr.matricule === c.matricule;
        if (c.memberName && mbr.fullName) return mbr.fullName.trim().toLowerCase() === c.memberName.trim().toLowerCase();
        return false;
      });
      const memMat = mem ? mem.matricule : (c.matricule || '');
      const memTel = mem && mem.phone ? (mem.phone + (mem.phone2 ? ' / ' + mem.phone2 : '')) : (c.phone || '');
      return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-weight: 700; color: #047857;">${c.recuNum || 'N/A'}</td>
        <td>${formatDate(c.datePaiement)}</td>
        <td style="font-weight: 600;">
          ${c.memberName || 'Membre'}
          ${memMat ? `<br><small style="color: #047857; font-weight: 700;">N° ${memMat}</small>` : ''}
          ${memTel ? `<small style="color: #64748b; margin-left: 4px;">(📞 ${memTel})</small>` : ''}
        </td>
        <td>${c.type || 'Ordinaire'}</td>
        <td>${c.periode || 'N/A'}</td>
        <td style="font-weight: 700; text-align: right;">${formatMoney(c.montant, curr)}</td>
        <td>${c.modePaiement || 'Espèces'}</td>
        <td style="font-size: 10px; color: #475569;">${c.agent || 'Trésorerie'}</td>
      </tr>
      `;
    }).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Réf. Reçu</th>
              <th>Date</th>
              <th>Membre Cotisant</th>
              <th>Type</th>
              <th>Période Couverte</th>
              <th style="text-align: right;">Montant</th>
              <th>Mode</th>
              <th>Encaissé par</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align: center;">Aucun reçu délivré pour le moment.</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6" style="text-align: right; font-weight: 700;">TOTAL GÉNÉRAL DES ENCAISSEMENTS :</td>
              <td style="text-align: right; font-weight: 800; color: #047857;">${formatMoney(totalSomme, curr)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Journal_General_Recus');
  }

  // ============================================================
  // 6. ÉTAT DE COTISATION PAR ÉVÉNEMENT / SACRIFICE
  // ============================================================
  function printEventCotisationsReport(eventId, filterMode = 'all') {
    const data = getDbData();
    const curr = data.config?.currency || 'FCFA';
    const members = [...(data.members || [])].sort((a,b) => (a.fullName || "").localeCompare(b.fullName || "", "fr", { sensitivity: "base" }));

    // Récupérer l'événement ciblé ou l'actif
    let activeEvt = null;
    if (eventId && Array.isArray(data.evenements)) {
      activeEvt = data.evenements.find(e => e.id === eventId);
    }
    if (!activeEvt && typeof TAGBA_DB !== 'undefined' && typeof TAGBA_DB.getActiveEvenement === 'function') {
      activeEvt = TAGBA_DB.getActiveEvenement();
    }
    if (!activeEvt) {
      activeEvt = {
        id: 'evt-default',
        titre: data.config?.evenementActuel || 'Cotisation Sacrifice de la Mutuelle',
        montant: Number(data.config?.cotisationEvenement || 5000),
        dateLimite: '2026-11-16',
        statut: 'Actif',
        description: 'Participation collective pour le sacrifice et les bénédictions'
      };
    }

    const unitPrice = Number(activeEvt.montant || 5000);
    const targetEvtId = activeEvt.id;

    let countPayes = 0;
    let countAttente = 0;
    let totalEncaise = 0;

    // Évaluer chaque membre
    const evaluatedMembers = members.map(m => {
      const fam = (data.families || []).find(f => f.id === m.familyId);

      // Trouver les versements liés à cet événement
      const eventCotis = (data.cotisations || []).filter(c => {
        const cMemId = c.memberId || c.member_id;
        let isMem = false;
        if (cMemId) {
          isMem = (cMemId === m.id);
        } else if (c.matricule && m.matricule) {
          isMem = (c.matricule === m.matricule);
        } else if (m.fullName && c.memberName) {
          isMem = (m.fullName.trim().toLowerCase() === c.memberName.trim().toLowerCase());
        }
        if (!isMem) return false;
        if (c.evenementId && c.evenementId === targetEvtId) return true;
        if (c.eventId && c.eventId === targetEvtId) return true;
        const isEvtType = c.type === 'Événement' || c.type === 'Evenement' || c.type === 'événement';
        if (isEvtType && (!c.evenementId && !c.eventId || c.evenementId === targetEvtId || c.eventId === targetEvtId)) return true;
        if (c.periode && (c.periode === activeEvt.titre || c.periode.includes(activeEvt.titre))) return true;
        return false;
      });

      const montantPaye = eventCotis.reduce((s, c) => s + Number(c.montant || 0), 0);
      const isPaye = montantPaye >= unitPrice;
      const reste = Math.max(0, unitPrice - montantPaye);
      const recuRef = eventCotis.map(c => c.recuNum).filter(Boolean).join(', ');

      if (isPaye) {
        countPayes++;
      } else {
        countAttente++;
      }
      totalEncaise += montantPaye;

      return {
        member: m,
        fam,
        montantPaye,
        isPaye,
        reste,
        recuRef
      };
    });

    // Déterminer le mode de filtrage (ajour/paid, retard/late, ou selon le sélecteur actif)
    let effectiveMode = filterMode;
    if (!effectiveMode || effectiveMode === 'auto') {
      const sel = document.getElementById('filterEventStatusSelect');
      if (sel && sel.value === 'LATE') effectiveMode = 'retard';
      else if (sel && sel.value === 'PAID') effectiveMode = 'ajour';
      else effectiveMode = 'all';
    }
    const isRetardOnly = effectiveMode === 'retard' || effectiveMode === 'late';
    const isAjourOnly = effectiveMode === 'ajour' || effectiveMode === 'paid';
    const targetMembers = isRetardOnly
      ? evaluatedMembers.filter(item => !item.isPaye)
      : isAjourOnly
        ? evaluatedMembers.filter(item => item.isPaye)
        : evaluatedMembers;

    // Tri alphabétique systématique par nom du membre
    targetMembers.sort((a, b) => (a.member?.fullName || '').localeCompare(b.member?.fullName || '', 'fr', { sensitivity: 'base' }));

    const totalResteSelection = targetMembers.reduce((s, item) => s + item.reste, 0);
    const totalVerseSelection = targetMembers.reduce((s, item) => s + item.montantPaye, 0);

    const rowsHtml = targetMembers.map((item, idx) => {
      const m = item.member;
      const fam = item.fam;
      const statutBadge = item.isPaye
        ? '<span class="print-badge print-badge-success">✅ Payé</span>'
        : (item.montantPaye > 0)
          ? `<span class="print-badge print-badge-warning">⏳ Partiel (${formatMoney(item.montantPaye, curr)})</span>`
          : '<span class="print-badge print-badge-danger">❌ Non Payé</span>';

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-weight: 700; color: #047857; text-align: center;">${m.matricule || 'N/A'}</td>
          <td style="font-weight: 600;">
            ${m.fullName}
            ${m.phone ? `<br><small style="color: #64748b;">📞 ${m.phone}${m.phone2 ? ' / ' + m.phone2 : ''}</small>` : ''}
          </td>
          <td>${fam ? fam.name : 'N/A'}</td>
          <td style="text-align: right;">${formatMoney(unitPrice, curr)}</td>
          <td style="text-align: right; font-weight: 700; color: ${item.isPaye ? '#047857' : '#b45309'};">${formatMoney(item.montantPaye, curr)}</td>
          <td style="text-align: right; font-weight: 800; color: ${item.reste > 0 ? '#b91c1c' : '#047857'};">
            ${item.reste > 0 ? `-${formatMoney(item.reste, curr)}` : '0 FCFA'}
          </td>
          <td style="text-align: center;">${statutBadge}</td>
          <td style="font-size: 10px; text-align: center;">${item.recuRef || '-'}</td>
        </tr>
      `;
    }).join('');

    function getEvtMonth(e) {
      const dStr = e ? (e.dateLimite || e.createdAt) : null;
      if (!dStr) return 'Mois Indéfini';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return 'Mois Indéfini';
      const m = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return m.charAt(0).toUpperCase() + m.slice(1);
    }
    const evtMonth = getEvtMonth(activeEvt);

    const objectifTotal = members.length * unitPrice;
    const docTitle = isRetardOnly
      ? `État des Non À Jour (Retards) : ${activeEvt.titre}`
      : isAjourOnly
        ? `Liste des Membres À Jour : ${activeEvt.titre}`
        : `État des Cotisations : ${activeEvt.titre}`;
    const docSubtitle = isRetardOnly
      ? `Liste nominative officielle des membres non à jour pour l'échéance de ${evtMonth} (Date limite : ${formatDate(activeEvt.dateLimite)})`
      : isAjourOnly
        ? `Liste nominative officielle des membres ayant intégralement réglé leur cotisation (${evtMonth})`
        : (activeEvt.description || `Suivi nominatif du recouvrement - Échéance de ${evtMonth}`);

    const meta = isRetardOnly ? [
      { label: 'Événement', value: activeEvt.titre },
      { label: 'Mois d\'Échéance', value: `📅 ${evtMonth}` },
      { label: 'Date Limite', value: formatDate(activeEvt.dateLimite) },
      { label: 'Filtrage Sélectionné', value: '⚠️ Non À Jour (Retards)' },
      { label: 'Membres Non À Jour', value: `${targetMembers.length} sur ${members.length} adhérent(s)` },
      { label: 'Montant Restant Dû', value: formatMoney(totalResteSelection, curr) },
      { label: 'Cotisation Exigée', value: `${formatMoney(unitPrice, curr)} / membre` }
    ] : isAjourOnly ? [
      { label: 'Événement', value: activeEvt.titre },
      { label: 'Mois d\'Échéance', value: `📅 ${evtMonth}` },
      { label: 'Filtrage Sélectionné', value: '✅ Membres À Jour Uniquement' },
      { label: 'Membres À Jour', value: `${targetMembers.length} sur ${members.length} adhérent(s)` },
      { label: 'Total Encaissé Sélection', value: formatMoney(totalVerseSelection, curr) },
      { label: 'Cotisation Fixée', value: `${formatMoney(unitPrice, curr)} / membre` }
    ] : [
      { label: 'Événement', value: activeEvt.titre },
      { label: 'Mois d\'Échéance', value: `📅 ${evtMonth}` },
      { label: 'Montant Fixé', value: `${formatMoney(unitPrice, curr)} / membre` },
      { label: 'Date Limite', value: formatDate(activeEvt.dateLimite) },
      { label: 'Progression', value: `${countPayes} payés sur ${members.length} (${formatMoney(totalEncaise, curr)} / ${formatMoney(objectifTotal, curr)})` }
    ];

    const header = getOfficialPrintHeader(docTitle, docSubtitle, meta);

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th style="text-align: center;">Matricule / N° Membre</th>
              <th>Nom & Prénoms / Contact</th>
              <th>Foyer</th>
              <th style="text-align: right;">Montant Dû</th>
              <th style="text-align: right;">Montant Versé</th>
              <th style="text-align: right;">Reste à Payer</th>
              <th style="text-align: center;">Statut</th>
              <th style="text-align: center;">Réf. Reçu</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="9" style="text-align: center; padding: 20px; color: #64748b;">${isRetardOnly ? 'Félicitations ! Aucun membre n\'est en retard pour cet événement.' : 'Aucun membre à afficher.'}</td></tr>`}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4" style="text-align: right; font-weight: 700;">TOTAL ${isRetardOnly ? 'RETARDS DE LA SÉLECTION' : isAjourOnly ? 'MEMBRES À JOUR' : 'GÉNÉRAL'} :</td>
              <td style="text-align: right; font-weight: 800; color: #0f172a;">${formatMoney((isRetardOnly || isAjourOnly) ? targetMembers.length * unitPrice : objectifTotal, curr)}</td>
              <td style="text-align: right; font-weight: 800; color: #047857;">${formatMoney(totalVerseSelection, curr)}</td>
              <td style="text-align: right; font-weight: 800; color: ${totalResteSelection > 0 ? '#b91c1c' : '#047857'};">
                ${totalResteSelection > 0 ? `-${formatMoney(totalResteSelection, curr)}` : '0 FCFA'}
              </td>
              <td colspan="2" style="text-align: center; font-weight: 700; color: ${isAjourOnly ? '#047857' : '#b45309'};">
                ${isRetardOnly ? `${targetMembers.length} membre(s) à relancer` : isAjourOnly ? `${targetMembers.length} membre(s) à jour` : `Reste : ${formatMoney(Math.max(0, objectifTotal - totalEncaise), curr)}`}
              </td>
            </tr>
          </tfoot>
        </table>
        ${getOfficialPrintSignatures()}
      </div>
    `;

    const pdfTitle = isRetardOnly
      ? `TAGBA_Retards_${evtMonth.replace(/[^a-zA-Z0-9]/g, '_')}_${activeEvt.titre.replace(/[^a-zA-Z0-9]/g, '_')}`
      : `TAGBA_Cotisations_${evtMonth.replace(/[^a-zA-Z0-9]/g, '_')}_${activeEvt.titre.replace(/[^a-zA-Z0-9]/g, '_')}`;

    executeTagbaPrint(html, pdfTitle);
  }

  // ============================================================
  // 6.b. SYNTHÈSE DES COTISATIONS & RETARDS PAR ÉVÉNEMENT PAR MOIS
  // ============================================================
  function printAllEventsRecapReport() {
    const data = getDbData();
    const curr = data.config?.currency || 'FCFA';
    const allMembers = [...(data.members || [])].sort((a,b) => (a.fullName || "").localeCompare(b.fullName || "", "fr", { sensitivity: "base" }));
    const events = [...(data.evenements || [])];

    if (events.length === 0) {
      alert("Aucun événement n'est enregistré dans l'application.");
      return;
    }

    function getEvtMonth(e) {
      const dStr = e ? (e.dateLimite || e.createdAt) : null;
      if (!dStr) return 'Mois indéfini';
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return 'Mois indéfini';
      const m = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return m.charAt(0).toUpperCase() + m.slice(1);
    }

    // Trier les événements par date d'échéance (du plus ancien au plus récent)
    events.sort((a, b) => new Date(a.dateLimite || a.createdAt || 0) - new Date(b.dateLimite || b.createdAt || 0));

    let grandTotalAttendu = 0;
    let grandTotalEncaise = 0;
    let grandTotalReste = 0;
    let grandTotalMembresRetard = 0;

    const summaryByEvent = events.map(evt => {
      const targetEvtId = evt.id;
      const unitPrice = Number(evt.montant || 0);
      const moisNom = getEvtMonth(evt);

      let countPayes = 0;
      let countPartiels = 0;
      let countNonPayes = 0;
      let totalEncaise = 0;
      const lateMembers = [];

      allMembers.forEach(m => {
        const fam = (data.families || []).find(f => f.id === m.familyId);
        const eventCotis = (data.cotisations || []).filter(c => {
          const cMemId = c.memberId || c.member_id;
          let isMem = false;
          if (cMemId) {
            isMem = (cMemId === m.id);
          } else if (c.matricule && m.matricule) {
            isMem = (c.matricule === m.matricule);
          } else if (m.fullName && c.memberName) {
            isMem = (m.fullName.trim().toLowerCase() === c.memberName.trim().toLowerCase());
          }
          if (!isMem) return false;
          if (c.evenementId && c.evenementId === targetEvtId) return true;
          if (c.eventId && c.eventId === targetEvtId) return true;
          const isEvtType = c.type === 'Événement' || c.type === 'Evenement' || c.type === 'événement';
          if (isEvtType && (!c.evenementId && !c.eventId || c.evenementId === targetEvtId || c.eventId === targetEvtId)) return true;
          if (c.periode && (c.periode === evt.titre || c.periode.includes(evt.titre))) return true;
          return false;
        });

        const montantPaye = eventCotis.reduce((s, c) => s + Number(c.montant || 0), 0);
        const reste = Math.max(0, unitPrice - montantPaye);
        totalEncaise += montantPaye;

        if (montantPaye >= unitPrice) {
          countPayes++;
        } else {
          if (montantPaye > 0) countPartiels++;
          else countNonPayes++;

          lateMembers.push({
            member: m,
            family: fam,
            montantPaye,
            reste,
            statut: montantPaye > 0 ? `Partiel (${formatMoney(montantPaye, curr)})` : 'Non payé'
          });
        }
      });

      // Tri alphabétique systématique des membres en retard
      lateMembers.sort((a, b) => (a.member?.fullName || '').localeCompare(b.member?.fullName || '', 'fr', { sensitivity: 'base' }));

      const totalAttendu = allMembers.length * unitPrice;
      const totalReste = Math.max(0, totalAttendu - totalEncaise);
      const countRetards = countPartiels + countNonPayes;
      const taux = totalAttendu > 0 ? Math.round((totalEncaise / totalAttendu) * 100) : 0;

      grandTotalAttendu += totalAttendu;
      grandTotalEncaise += totalEncaise;
      grandTotalReste += totalReste;
      grandTotalMembresRetard += countRetards;

      return {
        evt,
        moisNom,
        unitPrice,
        countPayes,
        countPartiels,
        countNonPayes,
        countRetards,
        totalAttendu,
        totalEncaise,
        totalReste,
        taux,
        lateMembers
      };
    });

    const meta = [
      { label: 'Total Événements Répertoriés', value: `${events.length} événement(s)` },
      { label: 'Effectif Total des Adhérents', value: `${allMembers.length} membres` },
      { label: 'Budget Total Attendu', value: formatMoney(grandTotalAttendu, curr) },
      { label: 'Total Encaissé Événements', value: formatMoney(grandTotalEncaise, curr) },
      { label: 'Reste Total à Recouvrer (Retards)', value: formatMoney(grandTotalReste, curr) }
    ];

    const header = getOfficialPrintHeader(
      'Synthèse des Cotisations & Retards par Événement Mois par Mois',
      'Tableau comparatif du recouvrement et relevé nominatif officiel des arriérés d\'événements par mois',
      meta
    );

    // Lignes tableau 1 : Synthèse des événements
    const recapRowsHtml = summaryByEvent.map((item, idx) => `
      <tr>
        <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
        <td style="font-weight: 700; color: #047857; white-space: nowrap;">📅 ${item.moisNom}</td>
        <td style="font-weight: 600;">
          ${item.evt.titre}
          ${item.evt.description ? `<br><small style="color: #64748b;">${item.evt.description}</small>` : ''}
        </td>
        <td style="text-align: center; font-size: 11px;">${formatDate(item.evt.dateLimite)}</td>
        <td style="text-align: right; font-weight: 600;">${formatMoney(item.unitPrice, curr)}</td>
        <td style="text-align: center; font-weight: 700; color: #047857;">${item.countPayes} / ${allMembers.length}</td>
        <td style="text-align: center; font-weight: 700; color: ${item.countRetards > 0 ? '#b91c1c' : '#047857'};">
          ${item.countRetards > 0 ? `⚠️ ${item.countRetards}` : '✅ 0'}
        </td>
        <td style="text-align: right; font-weight: 600;">${formatMoney(item.totalAttendu, curr)}</td>
        <td style="text-align: right; font-weight: 700; color: #047857;">${formatMoney(item.totalEncaise, curr)}</td>
        <td style="text-align: right; font-weight: 800; color: ${item.totalReste > 0 ? '#b91c1c' : '#047857'};">
          ${item.totalReste > 0 ? `-${formatMoney(item.totalReste, curr)}` : '0 FCFA'}
        </td>
        <td style="text-align: center; font-weight: 700; color: ${item.taux >= 80 ? '#047857' : item.taux >= 50 ? '#b45309' : '#b91c1c'};">${item.taux}%</td>
      </tr>
    `).join('');

    // Section 2 : Relevé nominatif détaillé des membres en retard par événement
    let detailRetardsHtml = '';
    summaryByEvent.forEach(item => {
      detailRetardsHtml += `
        <div style="margin-top: 24px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; background: #fef2f2; border-left: 4px solid #ef4444; padding: 8px 12px; margin-bottom: 8px; border-radius: 4px;">
            <div style="font-weight: 800; color: #991b1b; font-size: 13px;">
              ⚠️ Retards : ${item.evt.titre} — Mois de ${item.moisNom} (Échéance : ${formatDate(item.evt.dateLimite)})
            </div>
            <div style="font-size: 12px; color: #b91c1c; font-weight: 700;">
              ${item.lateMembers.length} retardataire(s) | Reste à recouvrer : ${formatMoney(item.totalReste, curr)}
            </div>
          </div>
          <table class="tagba-print-table" style="font-size: 11px; margin-bottom: 16px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="width: 30px; text-align: center;">N°</th>
                <th style="text-align: center; width: 90px;">Matricule</th>
                <th>Nom & Prénoms / Contact</th>
                <th>Foyer</th>
                <th style="text-align: right; width: 90px;">Déjà Versé</th>
                <th style="text-align: right; width: 100px;">Reste Dû</th>
                <th style="text-align: center; width: 100px;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${item.lateMembers.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; color: #047857; padding: 12px; font-weight: 600;">✅ Félicitations ! Tous les membres sont à jour pour cet événement.</td></tr>
              ` : item.lateMembers.map((lm, lIdx) => `
                <tr>
                  <td style="text-align: center;">${lIdx + 1}</td>
                  <td style="font-weight: 700; color: #047857; text-align: center;">${lm.member.matricule || 'N/A'}</td>
                  <td style="font-weight: 600;">
                    ${lm.member.fullName}
                    ${lm.member.phone ? `<br><small style="color: #64748b;">📞 ${lm.member.phone}${lm.member.phone2 ? ' / ' + lm.member.phone2 : ''}</small>` : ''}
                  </td>
                  <td>${lm.family ? lm.family.name : 'N/A'}</td>
                  <td style="text-align: right; font-weight: 600; color: ${lm.montantPaye > 0 ? '#047857' : '#64748b'};">${formatMoney(lm.montantPaye, curr)}</td>
                  <td style="text-align: right; font-weight: 800; color: #b91c1c;">-${formatMoney(lm.reste, curr)}</td>
                  <td style="text-align: center;">
                    <span class="print-badge ${lm.montantPaye > 0 ? 'print-badge-warning' : 'print-badge-danger'}">
                      ${lm.montantPaye > 0 ? 'Partiel' : 'Non payé'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align: right; font-weight: 700;">Sous-total retards (${item.evt.titre}) :</td>
                <td style="text-align: right; font-weight: 700; color: #047857;">${formatMoney(item.totalEncaise, curr)}</td>
                <td style="text-align: right; font-weight: 800; color: #b91c1c;">-${formatMoney(item.totalReste, curr)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    });

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        
        <h4 style="margin: 16px 0 8px 0; color: #0f172a; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">
          1. Synthèse Mensuelle de Tous les Événements & Retards
        </h4>
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Mois</th>
              <th>Événement</th>
              <th style="text-align: center;">Échéance</th>
              <th style="text-align: right;">Tarif / Mbr</th>
              <th style="text-align: center;">À Jour</th>
              <th style="text-align: center;">Retards</th>
              <th style="text-align: right;">Total Attendu</th>
              <th style="text-align: right;">Total Encaissé</th>
              <th style="text-align: right;">Reste à Recouvrer</th>
              <th style="text-align: center;">Taux</th>
            </tr>
          </thead>
          <tbody>
            ${recapRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: 700;">GRAND TOTAL TOUS ÉVÉNEMENTS :</td>
              <td style="text-align: center; font-weight: 800;">-</td>
              <td style="text-align: center; font-weight: 800; color: ${grandTotalMembresRetard > 0 ? '#b91c1c' : '#047857'};">
                ${grandTotalMembresRetard} cas
              </td>
              <td style="text-align: right; font-weight: 800; color: #0f172a;">${formatMoney(grandTotalAttendu, curr)}</td>
              <td style="text-align: right; font-weight: 800; color: #047857;">${formatMoney(grandTotalEncaise, curr)}</td>
              <td style="text-align: right; font-weight: 800; color: ${grandTotalReste > 0 ? '#b91c1c' : '#047857'};">
                ${grandTotalReste > 0 ? `-${formatMoney(grandTotalReste, curr)}` : '0 FCFA'}
              </td>
              <td style="text-align: center; font-weight: 800; color: #047857;">
                ${grandTotalAttendu > 0 ? Math.round((grandTotalEncaise / grandTotalAttendu) * 100) : 0}%
              </td>
            </tr>
          </tfoot>
        </table>

        <h4 style="margin: 28px 0 8px 0; color: #0f172a; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px;">
          2. Relevé Nominatif Officiel des Membres en Retard par Événement & Mois
        </h4>
        ${detailRetardsHtml}

        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Synthese_Evenements_Retards_Mois');
  }

  // ============================================================
  // 7. REGISTRE DES CÉRÉMONIES
  // ============================================================
  function printCeremoniesReport() {
    const data = getDbData();
    const ceremonies = data.ceremonies || [];
    const meta = [
      { label: 'Total Cérémonies', value: `${ceremonies.length} événements` },
      { label: 'Cadre', value: 'Mariages, Baptêmes, Obsèques, Réunions' }
    ];

    const header = getOfficialPrintHeader('Registre Officiel des Cérémonies Familiales & Réunions', 'Calendrier et organisation des manifestations de la communauté TAGBA', meta);

    const rowsHtml = ceremonies.map((c, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td><strong>${formatDate(c.date)}</strong></td>
        <td style="font-weight: 700; color: #047857;">${c.type || 'Cérémonie'}</td>
        <td style="font-weight: 600;">${c.title}</td>
        <td>${c.hostFamily || 'Famille'}</td>
        <td>${c.location || 'Khoroko'}</td>
        <td>${c.delegation || 'Délégation du Bureau'}</td>
        <td style="text-align: center;">
          <span class="print-badge ${c.status === 'Terminé' ? 'print-badge-info' : 'print-badge-success'}">
            ${c.status || 'Programmé'}
          </span>
        </td>
      </tr>
    `).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Date</th>
              <th>Type</th>
              <th>Intitulé de la Cérémonie</th>
              <th>Foyer Organisateur</th>
              <th>Lieu</th>
              <th>Délégation / Représentation</th>
              <th style="text-align: center;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" style="text-align: center;">Aucune cérémonie enregistrée.</td></tr>'}
          </tbody>
        </table>
        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Registre_Ceremonies');
  }

  // ============================================================
  // 8. LIVRE DE CAISSE ET RAPPORT FINANCIER
  // ============================================================
  function printFinancesReport() {
    const data = getDbData();
    const cfg = data.config || {};
    const curr = cfg.currency || 'FCFA';

    const fondsDepart = Number(cfg.fondsCaisse || 0);

    const cotisTotal = (data.cotisations || [])
      .reduce((s, c) => s + Number(c.montant || 0), 0);

    const donsTotal = (data.contributionsVolontaires || [])
      .reduce((s, d) => s + Number(d.montant || 0), 0);

    const depensesTotal = (data.depenses || [])
      .reduce((s, d) => s + Number(d.montant || 0), 0);

    const totalEntrees = fondsDepart + cotisTotal + donsTotal;
    const soldeNet = totalEntrees - depensesTotal;

    const meta = [
      { label: 'Fonds Initial', value: formatMoney(fondsDepart, curr) },
      { label: 'Total Entrées', value: formatMoney(totalEntrees, curr) },
      { label: 'Total Dépenses', value: formatMoney(depensesTotal, curr) },
      { label: 'Solde Net Caisse', value: formatMoney(soldeNet, curr) }
    ];

    const header = getOfficialPrintHeader('Livre de Caisse & Bilan Financier Officiel', 'Compte des flux de trésorerie, encaissements et dépenses décaissées', meta);

    const depensesRows = (data.depenses || []).map((d, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${formatDate(d.date)}</td>
        <td style="font-weight: 700; color: #b91c1c;">${d.titre}</td>
        <td>${d.categorie || 'Fonctionnement'}</td>
        <td>${d.beneficiaire || 'N/A'}</td>
        <td style="text-align: right; font-weight: 700; color: #b91c1c;">-${formatMoney(d.montant, curr)}</td>
        <td>${d.sourceFinancement || 'Caisse Centrale'}</td>
      </tr>
    `).join('');

    const donsRows = (data.contributionsVolontaires || []).map((d, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${formatDate(d.date)}</td>
        <td style="font-weight: 700; color: #047857;">${d.donateur}</td>
        <td>${d.destination || 'Solidarité'}</td>
        <td style="text-align: right; font-weight: 700; color: #047857;">+${formatMoney(d.montant, curr)}</td>
        <td>${d.modePaiement || 'Espèces'}</td>
        <td>${d.recuNum || 'N/A'}</td>
      </tr>
    `).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
          <h3 style="font-size: 13px; margin: 0 0 8px 0; color: #0f172a; text-transform: uppercase;">
            Synthèse de la Trésorerie
          </h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div>
              <span style="font-size: 10px; color: #64748b;">Dotation Initiale :</span><br>
              <strong style="font-size: 13px;">${formatMoney(fondsDepart, curr)}</strong>
            </div>
            <div>
              <span style="font-size: 10px; color: #047857;">Total Cotisations + Dons :</span><br>
              <strong style="font-size: 13px; color: #047857;">${formatMoney(cotisTotal + donsTotal, curr)}</strong>
            </div>
            <div>
              <span style="font-size: 10px; color: #b91c1c;">Total Décaissements :</span><br>
              <strong style="font-size: 13px; color: #b91c1c;">-${formatMoney(depensesTotal, curr)}</strong>
            </div>
            <div>
              <span style="font-size: 10px; color: #065f46;">Solde Net Actuel :</span><br>
              <strong style="font-size: 16px; color: #047857;">${formatMoney(soldeNet, curr)}</strong>
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; margin: 16px 0 6px 0; color: #b91c1c; border-bottom: 1px solid #fca5a5; padding-bottom: 4px;">
          Journal des Dépenses Décaissées
        </h3>
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Date</th>
              <th>Motif / Intitulé</th>
              <th>Catégorie</th>
              <th>Bénéficiaire</th>
              <th style="text-align: right;">Montant</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            ${depensesRows || '<tr><td colspan="7" style="text-align: center;">Aucune dépense enregistrée.</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: 700;">TOTAL DÉPENSES :</td>
              <td style="text-align: right; font-weight: 800; color: #b91c1c;">-${formatMoney(depensesTotal, curr)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        ${donsRows ? `
          <h3 style="font-size: 12px; text-transform: uppercase; margin: 18px 0 6px 0; color: #047857; border-bottom: 1px solid #a7f3d0; padding-bottom: 4px;">
            Registre des Dons et Contributions Volontaires Reçus
          </h3>
          <table class="tagba-print-table">
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">N°</th>
                <th>Date</th>
                <th>Donateur</th>
                <th>Affectation</th>
                <th style="text-align: right;">Montant Don</th>
                <th>Mode</th>
                <th>Réf. Reçu</th>
              </tr>
            </thead>
            <tbody>
              ${donsRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" style="text-align: right; font-weight: 700;">TOTAL DONS REÇUS :</td>
                <td style="text-align: right; font-weight: 800; color: #047857;">+${formatMoney(donsTotal, curr)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        ` : ''}

        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Livre_Caisse_Bilan_Financier');
  }

  // ============================================================
  // 9. REGISTRE DE L'ENTRAIDE SOCIALE
  // ============================================================
  function printEntraideReport() {
    const data = getDbData();
    const entraide = data.entraide || [];
    const curr = data.config?.currency || 'FCFA';

    const totalDecaisse = entraide
      .filter(e => e.statut === 'Accordée' || e.statut === 'Payée' || e.statut === 'Terminé')
      .reduce((s, e) => s + Number(e.montant || 0), 0);

    const meta = [
      { label: 'Dossiers Traités', value: `${entraide.length} demandes` },
      { label: 'Total Secours Décaissés', value: formatMoney(totalDecaisse, curr) }
    ];

    const header = getOfficialPrintHeader('Registre de l\'Entraide Sociale & Secours Mutuel', 'Prise en charge de la santé, des urgences familiales et de la solidarité', meta);

    const rowsHtml = entraide.map((e, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${formatDate(e.date)}</td>
        <td style="font-weight: 700; color: #047857;">${e.titre}</td>
        <td style="font-weight: 600;">${e.beneficiaire || 'Membre'}</td>
        <td>${e.urgence || 'Normal'}</td>
        <td style="text-align: right; font-weight: 700; color: #047857;">${formatMoney(e.montant, curr)}</td>
        <td style="text-align: center;">
          <span class="print-badge ${e.statut === 'Accordée' || e.statut === 'Terminé' ? 'print-badge-success' : 'print-badge-warning'}">
            ${e.statut || 'En attente'}
          </span>
        </td>
      </tr>
    `).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Date</th>
              <th>Motif / Nature de l'Aide</th>
              <th>Bénéficiaire</th>
              <th>Degré d'Urgence</th>
              <th style="text-align: right;">Montant Alloué</th>
              <th style="text-align: center;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align: center;">Aucun dossier d\'entraide enregistré.</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: 700;">TOTAL DES AIDES DÉCAISSÉES :</td>
              <td style="text-align: right; font-weight: 800; color: #047857;">${formatMoney(totalDecaisse, curr)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, 'TAGBA_Registre_Entraide_Sociale');
  }

  // ============================================================
  // 10. RELEVÉ INDIVIDUEL DE MEMBRE (AUDIT PERSONNEL)
  // ============================================================
  function printMemberAudit(memberId) {
    const data = getDbData();
    const curr = data.config?.currency || 'FCFA';

    // Trouver le membre
    let mem = null;
    if (memberId) {
      mem = (data.members || []).find(m => m.id === memberId);
    }
    if (!mem && typeof currentAuditMemberId !== 'undefined' && currentAuditMemberId) {
      mem = (data.members || []).find(m => m.id === currentAuditMemberId);
    }
    if (!mem && (data.members || []).length > 0) {
      mem = data.members[0];
    }
    if (!mem) {
      if (typeof showToast === 'function') showToast('Aucun membre sélectionné pour le relevé.', 'warning');
      return;
    }

    const fam = (data.families || []).find(f => f.id === mem.familyId);
    const audit = (typeof getMemberCotisationAudit === 'function')
      ? getMemberCotisationAudit(mem.id)
      : null;

    const totalVerse = audit ? audit.totalVerse : 0;
    const monthsPaid = audit ? audit.monthsPaidCount : 0;
    const monthsLate = audit ? audit.monthsLateCount : 0;
    const arrieres = audit ? audit.arrieresMontant : 0;

    const meta = [
      { label: 'Matricule', value: mem.matricule || 'N/A' },
      { label: 'Foyer Familial', value: fam ? `${fam.name} (Chef : ${fam.chefDeFamille})` : 'N/A' },
      { label: 'Contact', value: mem.phone ? mem.phone + (mem.phone2 ? ' / ' + mem.phone2 : '') : 'N/A' },
      { label: 'Statut Global', value: audit ? audit.statutLabel : 'N/A' }
    ];

    const header = getOfficialPrintHeader(`Relevé Individuel de Situation Financière`, `Extrait de compte nominatif certifié pour : ${mem.fullName}`, meta);

    // Historique des reçus du membre
    const memberCotis = (data.cotisations || [])
      .filter(c => c.memberId === mem.id)
      .sort((a, b) => new Date(b.datePaiement || 0) - new Date(a.datePaiement || 0));

    const cotisRows = memberCotis.map((c, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="font-weight: 700; color: #047857;">${c.recuNum || 'N/A'}</td>
        <td>${formatDate(c.datePaiement)}</td>
        <td>${c.type || 'Ordinaire'}</td>
        <td>${c.periode || 'N/A'}</td>
        <td style="text-align: right; font-weight: 700; color: #047857;">${formatMoney(c.montant, curr)}</td>
        <td>${c.modePaiement || 'Espèces'}</td>
        <td style="font-size: 10px; color: #475569;">${c.agent || 'Trésorerie'}</td>
      </tr>
    `).join('');

    const html = `
      ${printDocStyle}
      <div class="tagba-print-container">
        ${header}

        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
          <h3 style="font-size: 12px; margin: 0 0 8px 0; color: #0f172a; text-transform: uppercase;">
            Diagnostic des Cotisations
          </h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div>
              <span style="font-size: 10px; color: #047857;">Total Versé :</span><br>
              <strong style="font-size: 15px; color: #047857;">${formatMoney(totalVerse, curr)}</strong>
            </div>
            <div>
              <span style="font-size: 10px; color: #0f172a;">Mois Réglés :</span><br>
              <strong style="font-size: 15px;">${monthsPaid} mois</strong>
            </div>
            <div>
              <span style="font-size: 10px; color: #b91c1c;">Mois en Retard :</span><br>
              <strong style="font-size: 15px; color: #b91c1c;">${monthsLate} mois</strong>
            </div>
            <div>
              <span style="font-size: 10px; color: #b91c1c;">Arriérés à Payer :</span><br>
              <strong style="font-size: 15px; color: ${arrieres > 0 ? '#b91c1c' : '#047857'};">
                ${arrieres > 0 ? `-${formatMoney(arrieres, curr)}` : 'À Jour (0 FCFA)'}
              </strong>
            </div>
          </div>
        </div>

        <h3 style="font-size: 12px; text-transform: uppercase; margin: 14px 0 6px 0; color: #0f172a; border-bottom: 1px solid #94a3b8; padding-bottom: 4px;">
          Historique des Paiements Effectués par le Membre
        </h3>
        <table class="tagba-print-table">
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">N°</th>
              <th>Réf. Reçu</th>
              <th>Date</th>
              <th>Type de Versement</th>
              <th>Période / Motif</th>
              <th style="text-align: right;">Montant</th>
              <th>Mode</th>
              <th>Encaissé par</th>
            </tr>
          </thead>
          <tbody>
            ${cotisRows || '<tr><td colspan="8" style="text-align: center;">Aucun versement enregistré pour ce membre.</td></tr>'}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; font-weight: 700;">TOTAL DES VERSEMENTS DU MEMBRE :</td>
              <td style="text-align: right; font-weight: 800; color: #047857;">${formatMoney(totalVerse, curr)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>

        ${getOfficialPrintSignatures()}
      </div>
    `;

    executeTagbaPrint(html, `TAGBA_Releve_${mem.fullName.replace(/[^a-zA-Z0-9]/g, '_')}`);
  }

  // ============================================================
  // ROUTEUR INTELLIGENT DE LA VUE ACTIVE
  // ============================================================
  function printCurrentTab() {
    // Si un modal est ouvert, vérifier s'il s'agit d'un modal imprimable
    const activeModal = document.querySelector('.modal-overlay.active');
    if (activeModal) {
      if (activeModal.id === 'modalReceipt') {
        window.print();
        return;
      }
      if (activeModal.id === 'modalFamilySheet') {
        window.print();
        return;
      }
      if (activeModal.id === 'modalReceiptDonation') {
        window.print();
        return;
      }
      if (activeModal.id === 'modalMemberMonthsAudit') {
        printMemberAudit();
        return;
      }
    }

    // Détecter l'onglet actif
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab) {
      window.print();
      return;
    }

    const tabId = activeTab.id;

    if (tabId === 'tab-dashboard') {
      printDashboardReport();
    } else if (tabId === 'tab-bureau') {
      printBureauList();
    } else if (tabId === 'tab-familles') {
      printFamiliesAndMembersReport();
    } else if (tabId === 'tab-cotisations') {
      printCotisationsCurrentSubView();
    } else if (tabId === 'tab-ceremonies') {
      // Détecter le sous-onglet actif
      const subCeremonies = document.getElementById('ceremoniesListView');
      const isCeremonies = subCeremonies && subCeremonies.style.display !== 'none';
      if (isCeremonies) {
        printCeremoniesReport();
      } else {
        printEventCotisationsReport();
      }
    } else if (tabId === 'tab-finances') {
      printFinancesReport();
    } else if (tabId === 'tab-entraide') {
      printEntraideReport();
    } else if (tabId === 'tab-statuts') {
      if (typeof imprimerStatuts === 'function') {
        imprimerStatuts();
      } else {
        window.print();
      }
    } else {
      window.print();
    }
  }

  // Sous-vues spécifiques
  function printSelectedMonthReport(monthName = null, mode = 'auto') {
    if (mode === 'late' || mode === 'retard' || (mode === 'auto' && window.currentRecapMoisDetailMode === 'late')) {
      printSelectedMonthLateReport(monthName);
      return;
    }

    const fnBreakdown = window.getMonthlyCotisationsBreakdown || (typeof getMonthlyCotisationsBreakdown === 'function' ? getMonthlyCotisationsBreakdown : null);
    if (!fnBreakdown) return;
    const breakdown = fnBreakdown();
    const targetMonth = monthName || window.currentSelectedRecapMonth || (breakdown.months[0]?.monthName);
    const m = breakdown.months.find(item => item.monthName === targetMonth);
    if (!m) {
      alert('Aucune donnée trouvée pour ce mois.');
      return;
    }

    const data = TAGBA_DB.get();
    const cfg = data.config || {};
    const dateTirage = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    let rowsHtml = '';
    const sortedVersements = [...(m.versements || [])].sort((a, b) => {
      const cMemIdA = a.memberId || a.member_id;
      const memA = (data.members || []).find(mbr => {
        if (cMemIdA) return mbr.id === cMemIdA;
        if (a.matricule && mbr.matricule) return mbr.matricule === a.matricule;
        if (a.memberName && mbr.fullName) return mbr.fullName.trim().toLowerCase() === a.memberName.trim().toLowerCase();
        return false;
      });
      const nameA = (memA ? memA.fullName : a.memberName) || '';

      const cMemIdB = b.memberId || b.member_id;
      const memB = (data.members || []).find(mbr => {
        if (cMemIdB) return mbr.id === cMemIdB;
        if (b.matricule && mbr.matricule) return mbr.matricule === b.matricule;
        if (b.memberName && mbr.fullName) return mbr.fullName.trim().toLowerCase() === b.memberName.trim().toLowerCase();
        return false;
      });
      const nameB = (memB ? memB.fullName : b.memberName) || '';

      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });

    sortedVersements.forEach((c, idx) => {
      const cMemId = c.memberId || c.member_id;
      const mem = data.members.find(mbr => {
        if (cMemId) return mbr.id === cMemId;
        if (c.matricule && mbr.matricule) return mbr.matricule === c.matricule;
        if (c.memberName && mbr.fullName) return mbr.fullName.trim().toLowerCase() === c.memberName.trim().toLowerCase();
        return false;
      });
      const fam = mem ? data.families.find(f => f.id === mem.familyId) : null;
      const memMatricule = mem ? mem.matricule : (c.matricule || '-');
      const memPhone = mem && mem.phone ? (mem.phone + (mem.phone2 ? ' / ' + mem.phone2 : '')) : (c.phone || '-');
      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: bold; color: #047857; text-align: center;">${c.recuNum || '-'}</td>
          <td style="font-weight: 600;">${c.memberName || '-'}</td>
          <td style="text-align: center; font-weight: bold; color: #047857;">${memMatricule}</td>
          <td style="text-align: center; color: #334155; font-size: 11px;">${memPhone}</td>
          <td>${fam ? fam.name : (c.payeurChef ? `Foyer ${c.payeurChef}` : '-')}</td>
          <td style="text-align: right; font-weight: bold; color: #047857;">${formatMoney(c.montant, breakdown.currency)}</td>
          <td style="text-align: center;">${c.datePaiement || '-'}</td>
          <td style="text-align: center;">${c.modePaiement || 'Espèces'}</td>
        </tr>
      `;
    });

    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
        <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #047857; text-transform: uppercase;">ASSOCIATION MUTUELLE TAGBA</h2>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">Union • Solidarité • Entraide Familiale | Divo, Côte d'Ivoire</p>
          <h3 style="margin: 12px 0 4px 0; font-size: 18px; color: #111; text-transform: uppercase; letter-spacing: 0.5px;">
            FICHE OFFICIELLE DES VERSEMENTS - MOIS DE ${m.monthName.toUpperCase()}
          </h3>
          <p style="margin: 0; font-size: 12px; color: #666;">Date d'édition : ${dateTirage}</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 18px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b;">Mois concerné</div>
            <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${m.monthName}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b;">Total Collecté</div>
            <div style="font-size: 16px; font-weight: bold; color: #047857;">${formatMoney(m.totalMontant, breakdown.currency)}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b;">Membres Cotisants</div>
            <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${m.nbPaid} / ${breakdown.totalMembers} (${m.rate}%)</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b;">En attente / Retard</div>
            <div style="font-size: 16px; font-weight: bold; color: #dc2626;">${m.nbLate} membre(s)</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #047857; color: white;">
              <th style="padding: 7px; border: 1px solid #047857; width: 30px; text-align: center;">N°</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: center;">N° Reçu</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: left;">Nom & Prénoms</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: center;">N° Membre (Matricule)</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: center;">N° Téléphone</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: left;">Foyer / Famille</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: right;">Montant</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: center;">Date</th>
              <th style="padding: 7px; border: 1px solid #047857; text-align: center;">Mode</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align: center; padding: 20px;">Aucun versement enregistré.</td></tr>'}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="6" style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">TOTAL ENCAISSÉ :</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #047857; font-size: 13px;">${formatMoney(m.totalMontant, breakdown.currency)}</td>
              <td colspan="2" style="border: 1px solid #cbd5e1;"></td>
            </tr>
          </tfoot>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px;">
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 60px;">Le Trésorier Général</p>
            <p style="font-size: 11px; color: #666;">(Signature & Date)</p>
          </div>
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 60px;">Le Président de la Mutuelle</p>
            <p style="font-size: 11px; color: #666;">(Visa & Cachet)</p>
          </div>
        </div>
      </div>
    `;

    executeTagbaPrint(content, `Rapport_Cotisations_${m.monthName.replace(/\s+/g, '_')}`);
  }

  function printSelectedMonthLateReport(monthName = null) {
    const fnBreakdown = window.getMonthlyCotisationsBreakdown || (typeof getMonthlyCotisationsBreakdown === 'function' ? getMonthlyCotisationsBreakdown : null);
    if (!fnBreakdown) return;
    const breakdown = fnBreakdown();
    const targetMonth = monthName || window.currentSelectedRecapMonth || (breakdown.months[0]?.monthName);
    const m = breakdown.months.find(item => item.monthName === targetMonth);
    if (!m) {
      alert('Aucune donnée trouvée pour ce mois.');
      return;
    }

    const data = TAGBA_DB.get();
    const cfg = data.config || {};
    const unitPrice = Number(cfg.cotisationMensuelle || 500);
    const dateTirage = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    let rowsHtml = '';
    const lateList = [...(m.lateMembers || [])].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' }));
    lateList.forEach((mem, idx) => {
      const fam = mem ? data.families.find(f => f.id === mem.familyId) : null;
      const memMatricule = mem.matricule || '-';
      const memPhone = mem.phone ? (mem.phone + (mem.phone2 ? ' / ' + mem.phone2 : '')) : '-';
      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="text-align: center; font-weight: bold; color: #047857;">${memMatricule}</td>
          <td style="font-weight: 600;">${mem.fullName}</td>
          <td style="text-align: center; color: #334155; font-size: 11px;">${memPhone}</td>
          <td>${fam ? fam.name : '-'}</td>
          <td>${fam ? (fam.chefDeFamille || '-') : '-'}</td>
          <td style="text-align: right; font-weight: bold; color: #b91c1c;">${formatMoney(unitPrice, breakdown.currency)}</td>
          <td style="text-align: center;"><span class="print-badge print-badge-danger">⚠️ En Retard</span></td>
        </tr>
      `;
    });

    const totalArriereMois = lateList.length * unitPrice;

    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
        <div style="text-align: center; border-bottom: 2px solid #b91c1c; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #047857; text-transform: uppercase;">ASSOCIATION MUTUELLE TAGBA</h2>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">Union • Solidarité • Entraide Familiale | Divo, Côte d'Ivoire</p>
          <h3 style="margin: 12px 0 4px 0; font-size: 18px; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px;">
            FICHE OFFICIELLE DES RETARDS DE COTISATION - MOIS DE ${m.monthName.toUpperCase()}
          </h3>
          <p style="margin: 0; font-size: 12px; color: #666;">Date d'édition : ${dateTirage}</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 6px; padding: 12px 18px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #9f1239; font-weight: 700;">Mois concerné</div>
            <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${m.monthName}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #9f1239; font-weight: 700;">Membres en Retard</div>
            <div style="font-size: 16px; font-weight: bold; color: #b91c1c;">${lateList.length} membre(s) / ${breakdown.totalMembers}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #9f1239; font-weight: 700;">Tarif Mensuel</div>
            <div style="font-size: 16px; font-weight: bold; color: #0f172a;">${formatMoney(unitPrice, breakdown.currency)} / membre</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #9f1239; font-weight: 700;">Total Arriérés du Mois</div>
            <div style="font-size: 16px; font-weight: bold; color: #b91c1c;">${formatMoney(totalArriereMois, breakdown.currency)}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #991b1b; color: white;">
              <th style="padding: 7px; border: 1px solid #991b1b; width: 30px; text-align: center;">N°</th>
              <th style="padding: 7px; border: 1px solid #991b1b; text-align: center;">N° Membre (Matricule)</th>
              <th style="padding: 7px; border: 1px solid #991b1b; text-align: left;">Nom & Prénoms</th>
              <th style="padding: 7px; border: 1px solid #991b1b; text-align: center;">Téléphone</th>
              <th style="padding: 7px; border: 1px solid #991b1b; text-align: left;">Foyer / Famille</th>
              <th style="padding: 7px; border: 1px solid #991b1b; text-align: left;">Chef de Famille</th>
              <th style="padding: 7px; border: 1px solid #991b1b; text-align: right;">Montant Échu</th>
              <th style="padding: 7px; border: 1px solid #991b1b; text-align: center;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #047857; font-weight: bold;">🎉 Félicitations ! Aucun membre n\'est en retard pour ce mois.</td></tr>'}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="6" style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">TOTAL ARRIÉRÉS À RECOUVRER :</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c; font-size: 13px;">${formatMoney(totalArriereMois, breakdown.currency)}</td>
              <td style="border: 1px solid #cbd5e1; text-align: center; color: #b91c1c;">${lateList.length} retard(s)</td>
            </tr>
          </tfoot>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px;">
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 60px;">Le Trésorier Général</p>
            <p style="font-size: 11px; color: #666;">(Signature & Date)</p>
          </div>
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 60px;">Le Président de la Mutuelle</p>
            <p style="font-size: 11px; color: #666;">(Visa & Cachet)</p>
          </div>
        </div>
      </div>
    `;

    executeTagbaPrint(content, `TAGBA_Retards_Cotisations_${m.monthName.replace(/\s+/g, '_')}`);
  }

  function printAllMonthsRecapReport() {
    const fnBreakdown = window.getMonthlyCotisationsBreakdown || (typeof getMonthlyCotisationsBreakdown === 'function' ? getMonthlyCotisationsBreakdown : null);
    if (!fnBreakdown) return;
    const breakdown = fnBreakdown();
    const dateTirage = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

    let rowsHtml = '';
    breakdown.months.forEach((m, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: bold; font-size: 13px;">📅 ${m.monthName}</td>
          <td style="text-align: right; font-weight: bold; color: #047857; font-size: 13px;">${formatMoney(m.totalMontant, breakdown.currency)}</td>
          <td style="text-align: center; font-weight: bold;">${m.nbPaid} / ${breakdown.totalMembers}</td>
          <td style="text-align: center; color: ${m.nbLate > 0 ? '#dc2626' : '#555'};">${m.nbLate > 0 ? `${m.nbLate} en retard` : 'Complet'}</td>
          <td style="text-align: center; font-weight: bold;">${m.rate}%</td>
          <td style="text-align: center;">${m.rate >= 80 ? 'Fort recouvrement' : m.rate >= 40 ? 'En cours' : m.nbPaid > 0 ? 'Anticipation' : 'À recouvrer'}</td>
        </tr>
      `;
    });

    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
        <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #047857; text-transform: uppercase;">ASSOCIATION MUTUELLE TAGBA</h2>
          <p style="margin: 4px 0; font-size: 13px; color: #555;">Union • Solidarité • Entraide Familiale | Divo, Côte d'Ivoire</p>
          <h3 style="margin: 12px 0 4px 0; font-size: 18px; color: #111; text-transform: uppercase; letter-spacing: 0.5px;">
            SYNTHÈSE GÉNÉRALE DES COTISATIONS MOIS PAR MOIS
          </h3>
          <p style="margin: 0; font-size: 12px; color: #666;">Date d'édition : ${dateTirage}</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 18px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b;">Total Cotisations Ordinaires</div>
            <div style="font-size: 18px; font-weight: bold; color: #047857;">${formatMoney(breakdown.totalCotisationsGlobal, breakdown.currency)}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b;">Mois Répertoriés</div>
            <div style="font-size: 18px; font-weight: bold; color: #0f172a;">${breakdown.months.length} mois</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b;">Effectif des Membres</div>
            <div style="font-size: 18px; font-weight: bold; color: #0f172a;">${breakdown.totalMembers} membres</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 30px;">
          <thead>
            <tr style="background: #047857; color: white;">
              <th style="padding: 8px; border: 1px solid #047857;">N°</th>
              <th style="padding: 8px; border: 1px solid #047857; text-align: left;">Mois</th>
              <th style="padding: 8px; border: 1px solid #047857; text-align: right;">Total Encaissé</th>
              <th style="padding: 8px; border: 1px solid #047857;">Cotisants</th>
              <th style="padding: 8px; border: 1px solid #047857;">Retards</th>
              <th style="padding: 8px; border: 1px solid #047857;">Taux</th>
              <th style="padding: 8px; border: 1px solid #047857;">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td colspan="2" style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">GRAND TOTAL :</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #047857; font-size: 14px;">${formatMoney(breakdown.totalCotisationsGlobal, breakdown.currency)}</td>
              <td colspan="4" style="border: 1px solid #cbd5e1;"></td>
            </tr>
          </tfoot>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 40px;">
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 60px;">Le Trésorier Général</p>
            <p style="font-size: 11px; color: #666;">(Signature & Date)</p>
          </div>
          <div style="text-align: center;">
            <p style="font-weight: bold; margin-bottom: 60px;">Le Président de la Mutuelle</p>
            <p style="font-size: 11px; color: #666;">(Visa & Cachet)</p>
          </div>
        </div>
      </div>
    `;

    executeTagbaPrint(content, `Synthese_Cotisations_Mois_TAGBA`);
  }

  function printCotisationsCurrentSubView() {
    if (window.currentCotisSubTab === 'recap_mois') {
      printSelectedMonthReport();
    } else if (window.currentCotisSubTab === 'registre') {
      printReceiptsJournal();
    } else {
      printMonthlyCotisationsReport();
    }
  }

  function printCotisationsByStatus(statusMode = 'ajour') {
    const isRetard = statusMode === 'retard' || statusMode === 'late' || statusMode === 'EN_RETARD';
    if (window.currentCotisSubTab === 'recap_mois') {
      if (isRetard) {
        printSelectedMonthLateReport();
      } else {
        printSelectedMonthReport(null, 'paid');
      }
    } else {
      printMonthlyCotisationsReport(isRetard ? 'EN_RETARD' : 'A_JOUR');
    }
  }

  function printCeremoniesCurrentSubView() {
    const subCeremonies = document.getElementById('ceremoniesListView');
    const isCeremonies = subCeremonies && subCeremonies.style.display !== 'none';
    if (isCeremonies) {
      printCeremoniesReport();
    } else {
      const statusSelect = document.getElementById('filterEventStatusSelect');
      const val = statusSelect ? statusSelect.value : 'ALL';
      const mode = val === 'LATE' ? 'retard' : (val === 'PAID' ? 'ajour' : 'all');
      printEventCotisationsReport(null, mode);
    }
  }

  // Écouteur global pour Ctrl + P / Cmd + P
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
      e.preventDefault();
      printCurrentTab();
    }
  });

  // Exportation globale sur window
  window.executeTagbaPrint = executeTagbaPrint;
  window.printCurrentTab = printCurrentTab;
  window.printDashboardReport = printDashboardReport;
  window.printBureauList = printBureauList;
  window.printFamiliesAndMembersReport = printFamiliesAndMembersReport;
  window.printMonthlyCotisationsReport = printMonthlyCotisationsReport;
  window.printReceiptsJournal = printReceiptsJournal;
  window.printEventCotisationsReport = printEventCotisationsReport;
  window.printAllEventsRecapReport = printAllEventsRecapReport;
  window.printCeremoniesReport = printCeremoniesReport;
  window.printFinancesReport = printFinancesReport;
  window.printEntraideReport = printEntraideReport;
  window.printSelectedMonthReport = printSelectedMonthReport;
  window.printSelectedMonthLateReport = printSelectedMonthLateReport;
  window.printAllMonthsRecapReport = printAllMonthsRecapReport;
  window.printMemberAudit = printMemberAudit;
  window.printCotisationsCurrentSubView = printCotisationsCurrentSubView;
  window.printCotisationsByStatus = printCotisationsByStatus;
  window.printCeremoniesCurrentSubView = printCeremoniesCurrentSubView;

})();
