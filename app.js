/**
 * MAIN APPLICATION CONTROLLER
 * - Independent Single-View Page Routing & Navigation
 * - Upper-Left Hamburger Menu & Side Drawer Controller
 * - Virtual Laboratory Controls & Physics Simulation Bridge
 * - Observation Table, Linear Regression & CSV Export
 * - Exactly 4 Application Demos (Doors, Night Vision, Photocells, PMT)
 * - Advanced Photoelectric Emission Simulator & Quantum Canvas
 * - Project Diary / Development Logbook with LocalStorage Persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLabControls();
  initObservationTable();
  initApplicationDemos();
  initAdvancedEmission();
  initProjectDiary();
});

/* ==========================================================================
   1. SINGLE-VIEW NAVIGATION & HAMBURGER DRAWER SYSTEM
   ========================================================================== */

const PAGE_TITLES = {
  'home': 'Home',
  'theory': "Theory & Einstein's Law",
  'experiment': 'Virtual Lab (Simulation)',
  'observations': 'Observations Table',
  'graphs': 'Scientific Graphs',
  'challenges': 'Laboratory Challenges',
  'applications': 'Applications',
  'app-automatic-doors': 'Automatic Doors & Barriers',
  'app-night-vision': 'Night Vision & Image Intensifiers',
  'app-photocells': 'Photo Cells & Optical Sensors',
  'app-pmt': 'Photomultiplier Tubes (PMTs)',
  'advanced': 'Advanced Photoelectric Emission',
  'diary': 'Project Diary / Development Log',
  'conclusion': 'Synthesis & Findings'
};

function navigateToPage(targetId, updateHash = true) {
  if (!targetId || !document.getElementById(targetId)) {
    targetId = 'home';
  }

  // 1. Hide all page views
  const allPages = document.querySelectorAll('main > section.page-view');
  allPages.forEach(page => {
    page.classList.remove('active-page');
  });

  // 2. Display the selected single page only
  const targetPage = document.getElementById(targetId);
  if (targetPage) {
    targetPage.classList.add('active-page');
  }

  // 3. Keep URL hash synchronized for bookmarking and back/forward buttons
  if (updateHash) {
    if (window.location.hash !== `#${targetId}`) {
      window.location.hash = `#${targetId}`;
    }
  }

  // 4. Update active highlight in Hamburger Drawer
  const drawerItems = document.querySelectorAll('.drawer-item');
  drawerItems.forEach(item => {
    const itemTarget = item.getAttribute('data-page') || item.getAttribute('href')?.replace('#', '');
    const isActive = (itemTarget === targetId) || 
                     (itemTarget === 'applications' && targetId.startsWith('app-'));
    item.classList.toggle('active', isActive);
  });

  // 5. Update Navbar Active View Badge
  const viewBadge = document.getElementById('current-view-badge');
  if (viewBadge) {
    viewBadge.textContent = PAGE_TITLES[targetId] || 'Photoelectric Effect';
  }

  // 6. Close drawer on navigation
  closeNavDrawer();

  // 7. Scroll to top of the selected view
  window.scrollTo({ top: 0, behavior: 'instant' });

  // 8. Fire page-specific canvas redraws or updates
  onPageActivated(targetId);
}

// Global hook for in-HTML onclick handlers
window.navigateToPage = navigateToPage;

function openNavDrawer() {
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const hamburgerBtn = document.getElementById('hamburger-btn');

  if (drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (overlay) {
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
  }
  if (hamburgerBtn) {
    hamburgerBtn.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  }
  document.body.style.overflow = 'hidden';
}

function closeNavDrawer() {
  const drawer = document.getElementById('nav-drawer');
  const overlay = document.getElementById('drawer-overlay');
  const hamburgerBtn = document.getElementById('hamburger-btn');

  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (hamburgerBtn) {
    hamburgerBtn.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }
  document.body.style.overflow = '';
}

function onPageActivated(pageId) {
  if (pageId === 'experiment') {
    if (window.updateSimulationUI) window.updateSimulationUI();
    if (window.apparatus && window.apparatus.render) window.apparatus.render();
  } else if (pageId === 'theory') {
    if (window.energyDiagram && window.energyDiagram.draw) window.energyDiagram.draw();
  } else if (pageId === 'graphs') {
    if (window.scientificGraphs && window.scientificGraphs.renderActiveGraph) {
      window.scientificGraphs.renderActiveGraph();
    }
  } else if (pageId === 'challenges') {
    if (window.challengeEngine && window.challengeEngine.updateLiveStatus) {
      window.challengeEngine.updateLiveStatus();
    }
  } else if (pageId === 'advanced') {
    if (window.updateAdvancedSimulation) window.updateAdvancedSimulation();
  } else if (pageId === 'diary') {
    if (window.renderProjectDiary) window.renderProjectDiary();
  }
}

function initNavigation() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerOverlay = document.getElementById('drawer-overlay');

  // Hamburger Button Toggle
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const drawer = document.getElementById('nav-drawer');
      if (drawer && drawer.classList.contains('open')) {
        closeNavDrawer();
      } else {
        openNavDrawer();
      }
    });
  }

  // Drawer Close Button
  if (drawerCloseBtn) {
    drawerCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeNavDrawer();
    });
  }

  // Overlay Backdrop Click
  if (drawerOverlay) {
    drawerOverlay.addEventListener('click', closeNavDrawer);
  }

  // Escape Key to Close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNavDrawer();
  });

  // Intercept all internal anchor navigation links (`href="#..."`)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    // If target is a registered page view, route cleanly
    if (targetElement && targetElement.classList.contains('page-view')) {
      e.preventDefault();
      navigateToPage(targetId, true);
    }
  });

  // Handle Browser Back / Forward buttons via hashchange
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    const targetEl = document.getElementById(hash);
    if (targetEl && targetEl.classList.contains('page-view')) {
      navigateToPage(hash, false);
    }
  });

  // Load initial route on startup
  const initialHash = window.location.hash.replace('#', '') || 'home';
  navigateToPage(initialHash, false);
}

/* ==========================================================================
   2. LABORATORY CONTROLS & INTERACTION
   ========================================================================== */
function initLabControls() {
  const freqSlider = document.getElementById('frequency-slider');
  const intensitySlider = document.getElementById('intensity-slider');
  const voltageSlider = document.getElementById('voltage-slider');
  const phiSlider = document.getElementById('work-function-slider');
  const metalButtons = document.querySelectorAll('.btn-metal');
  const presetChips = document.querySelectorAll('.chip-btn');
  const snapVsBtn = document.getElementById('btn-snap-stopping');
  const pauseBtn = document.getElementById('btn-pause-sim');
  const resetBtn = document.getElementById('btn-reset-sim');
  const soundBtn = document.getElementById('btn-toggle-sound');
  const recordBtn = document.getElementById('btn-record-observation');
  const currentMetalTag = document.getElementById('current-metal-tag');

  // Frequency Slider Input
  if (freqSlider) {
    freqSlider.addEventListener('input', (e) => {
      if (window.simState) {
        window.simState.frequency_1e14 = parseFloat(e.target.value);
        if (window.updateSimulationUI) window.updateSimulationUI();
      }
      highlightActivePreset(e.target.value);
      if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
    });
  }

  // Quick Preset Frequency Chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = parseFloat(chip.getAttribute('data-freq'));
      if (freqSlider) freqSlider.value = val;
      if (window.simState) {
        window.simState.frequency_1e14 = val;
        if (window.updateSimulationUI) window.updateSimulationUI();
      }
      if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
    });
  });

  function highlightActivePreset(val) {
    presetChips.forEach(c => {
      const chipVal = parseFloat(c.getAttribute('data-freq'));
      c.classList.toggle('active', Math.abs(chipVal - val) < 0.08);
    });
  }

  // Intensity Slider Input
  if (intensitySlider) {
    intensitySlider.addEventListener('input', (e) => {
      if (window.simState) {
        window.simState.intensity_pct = parseInt(e.target.value, 10);
        if (window.updateSimulationUI) window.updateSimulationUI();
      }
      if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
    });
  }

  // Collector Tube Voltage Slider Input
  if (voltageSlider) {
    voltageSlider.addEventListener('input', (e) => {
      if (window.simState) {
        window.simState.collectorVoltage_V = parseFloat(e.target.value);
        if (window.updateSimulationUI) window.updateSimulationUI();
      }
      if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
    });
  }

  // Snap to Stopping Potential (-Vs)
  if (snapVsBtn) {
    snapVsBtn.addEventListener('click', () => {
      if (window.simState && window.simState.isEmitting) {
        const vs = window.simState.stoppingPotential_V;
        const snapVal = Math.max(-3.00, -vs);
        window.simState.collectorVoltage_V = parseFloat(snapVal.toFixed(2));
        if (voltageSlider) voltageSlider.value = snapVal.toFixed(2);
        if (window.updateSimulationUI) window.updateSimulationUI();
        if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
      }
    });
  }

  // Work Function Slider Input
  if (phiSlider) {
    phiSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (window.simState) {
        window.simState.workFunction_eV = val;

        let matchedKey = 'custom';
        for (const [key, obj] of Object.entries(window.METALS || {})) {
          if (key !== 'custom' && Math.abs(obj.phi - val) < 0.01) {
            matchedKey = key;
            break;
          }
        }
        window.simState.currentMetalKey = matchedKey;

        metalButtons.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('data-metal') === matchedKey);
        });

        if (currentMetalTag) {
          currentMetalTag.textContent = `${window.METALS[matchedKey]?.name || 'Custom'} (${val.toFixed(2)} eV)`;
        }

        if (window.updateSimulationUI) window.updateSimulationUI();
        if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
      }
    });
  }

  // Target Metal Selector Buttons
  metalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      metalButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const metalKey = btn.getAttribute('data-metal');
      const phiVal = parseFloat(btn.getAttribute('data-phi'));

      if (window.simState) {
        window.simState.currentMetalKey = metalKey;
        window.simState.workFunction_eV = phiVal;

        if (phiSlider) phiSlider.value = phiVal;
        if (currentMetalTag) {
          currentMetalTag.textContent = `${window.METALS[metalKey]?.name || 'Custom'} (${phiVal.toFixed(2)} eV)`;
        }

        if (window.updateSimulationUI) window.updateSimulationUI();
        if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
      }
    });
  });

  // Pause / Resume Simulation
  if (pauseBtn) {
    const pauseIcon = document.getElementById('btn-pause-icon');
    const pauseText = document.getElementById('btn-pause-text');

    pauseBtn.addEventListener('click', () => {
      if (!window.simState) return;
      window.simState.isPaused = !window.simState.isPaused;
      if (window.simState.isPaused) {
        if (pauseIcon) pauseIcon.innerHTML = '&#9654;';
        if (pauseText) pauseText.textContent = 'Resume';
        pauseBtn.classList.add('btn-primary');
        pauseBtn.classList.remove('btn-outline');
      } else {
        if (pauseIcon) pauseIcon.innerHTML = '&#9646;&#9646;';
        if (pauseText) pauseText.textContent = 'Pause';
        pauseBtn.classList.remove('btn-primary');
        pauseBtn.classList.add('btn-outline');
      }
    });
  }

  // Reset Simulation to Standard Defaults
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!window.simState) return;
      window.simState.frequency_1e14 = 6.00;
      window.simState.intensity_pct = 60;
      window.simState.workFunction_eV = 2.30;
      window.simState.currentMetalKey = 'K';
      window.simState.collectorVoltage_V = 0.00;
      window.simState.isPaused = false;

      if (freqSlider) freqSlider.value = 6.00;
      if (intensitySlider) intensitySlider.value = 60;
      if (voltageSlider) voltageSlider.value = 0.00;
      if (phiSlider) phiSlider.value = 2.30;

      metalButtons.forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-metal') === 'K');
      });
      highlightActivePreset(6.00);

      const pauseIcon = document.getElementById('btn-pause-icon');
      const pauseText = document.getElementById('btn-pause-text');
      if (pauseIcon) pauseIcon.innerHTML = '&#9646;&#9646;';
      if (pauseText) pauseText.textContent = 'Pause';
      if (pauseBtn) {
        pauseBtn.classList.remove('btn-primary');
        pauseBtn.classList.add('btn-outline');
      }

      if (window.updateSimulationUI) window.updateSimulationUI();
      if (window.challengeEngine) window.challengeEngine.updateLiveStatus();
    });
  }

  // Sound Toggle
  if (soundBtn) {
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    soundBtn.addEventListener('click', () => {
      if (!window.simState) return;
      window.simState.soundEnabled = !window.simState.soundEnabled;
      if (window.simState.soundEnabled) {
        if (soundIcon) soundIcon.innerHTML = '&#128266;';
        if (soundText) soundText.textContent = 'Sound ON';
        soundBtn.style.color = 'var(--cyan-primary)';
      } else {
        if (soundIcon) soundIcon.innerHTML = '&#128263;';
        if (soundText) soundText.textContent = 'Sound OFF';
        soundBtn.style.color = 'var(--text-faint)';
      }
    });
  }

  // Record Observation from Lab Panel
  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      addCurrentObservation();
      const origText = recordBtn.innerHTML;
      recordBtn.innerHTML = '<span>✓ Logged to Table!</span>';
      setTimeout(() => {
        recordBtn.innerHTML = origText;
      }, 1000);
    });
  }
}

/* ==========================================================================
   3. OBSERVATION TABLE & LINEAR REGRESSION ANALYSIS
   ========================================================================== */
const observationsData = [];
window.observationsData = observationsData;

function initObservationTable() {
  const recordTableBtn = document.getElementById('btn-record-obs-table');
  const autoSampleBtn = document.getElementById('btn-auto-sample-table');
  const exportCsvBtn = document.getElementById('btn-export-csv');
  const clearTableBtn = document.getElementById('btn-clear-table');

  if (recordTableBtn) {
    recordTableBtn.addEventListener('click', () => addCurrentObservation());
  }

  if (autoSampleBtn) {
    autoSampleBtn.addEventListener('click', () => performAutoSweep());
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => exportObservationsCSV());
  }

  if (clearTableBtn) {
    clearTableBtn.addEventListener('click', () => {
      if (observationsData.length === 0) return;
      if (confirm('Clear all recorded observations from the laboratory logbook?')) {
        observationsData.length = 0;
        renderObservationsTable();
      }
    });
  }
}

function addCurrentObservation() {
  const s = window.simState;
  if (!s) return;

  if (observationsData.length >= 20) {
    alert('Maximum limit of 20 observations reached. Please clear the table or export to CSV to start a new trial.');
    return;
  }

  const obs = {
    id: observationsData.length + 1,
    metal: (window.METALS && window.METALS[s.currentMetalKey]?.name) || 'Custom',
    metalKey: s.currentMetalKey,
    phi_eV: s.workFunction_eV,
    freq_1e14: s.frequency_1e14,
    freq_Hz: s.frequency_Hz,
    wavelength_nm: s.wavelength_nm,
    intensity_pct: s.intensity_pct,
    energy_eV: s.photonEnergy_eV,
    isEmitting: s.isEmitting,
    kmax_eV: s.maxKineticEnergy_eV,
    stoppingPot_V: s.stoppingPotential_V,
    photocurrent_uA: s.photocurrent_uA
  };

  observationsData.push(obs);
  renderObservationsTable();
}

function performAutoSweep() {
  const s = window.simState;
  if (!s) return;

  const currentPhi = s.workFunction_eV;
  const f0 = s.thresholdFreq_1e14;

  const sampleFreqs = [
    Math.max(3.5, f0 - 1.0),
    f0,
    f0 + 1.2,
    f0 + 2.5,
    Math.min(10.0, f0 + 4.0)
  ];

  sampleFreqs.forEach(freq => {
    s.frequency_1e14 = parseFloat(freq.toFixed(2));
    const h_eV_s = (window.CONSTANTS && window.CONSTANTS.h_eV_s) || 4.135667696e-15;
    const hf = h_eV_s * s.frequency_Hz;
    const isEmit = (s.frequency_Hz >= s.thresholdFreq_Hz) && (s.intensity_pct > 0);
    const kmax = isEmit ? Math.max(0, hf - currentPhi) : 0;
    const vs = isEmit ? kmax : 0;
    const current = isEmit ? (s.intensity_pct * 0.72) : 0;

    observationsData.push({
      id: observationsData.length + 1,
      metal: (window.METALS && window.METALS[s.currentMetalKey]?.name) || 'Custom',
      metalKey: s.currentMetalKey,
      phi_eV: currentPhi,
      freq_1e14: s.frequency_1e14,
      freq_Hz: s.frequency_Hz,
      wavelength_nm: s.wavelength_nm,
      intensity_pct: s.intensity_pct,
      energy_eV: hf,
      isEmitting: isEmit,
      kmax_eV: kmax,
      stoppingPot_V: vs,
      photocurrent_uA: current
    });
  });

  const freqSlider = document.getElementById('frequency-slider');
  if (freqSlider) freqSlider.value = s.frequency_1e14;
  if (window.updateSimulationUI) window.updateSimulationUI();
  renderObservationsTable();
}

function renderObservationsTable() {
  const tbody = document.getElementById('observation-table-body');
  const countBadge = document.getElementById('obs-count-badge');
  if (!tbody) return;

  if (countBadge) {
    countBadge.textContent = `${observationsData.length} Observations`;
  }

  if (observationsData.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-table-placeholder">
        <td colspan="11" class="text-center">
          <em>No observations recorded yet. Adjust controls in the Virtual Lab and click "Record Observation" or "Auto-Sample 5 Frequencies".</em>
        </td>
      </tr>
    `;
    updateTableSummary();
    return;
  }

  tbody.innerHTML = '';
  observationsData.forEach((obs, index) => {
    const tr = document.createElement('tr');
    const isSelected = (window.scientificGraphs && window.scientificGraphs.selectedObservation && window.scientificGraphs.selectedObservation.id === obs.id);
    tr.className = `clickable-obs ${isSelected ? 'active-obs-row' : ''}`;
    tr.setAttribute('data-id', obs.id);
    tr.title = 'Click to plot this observation on the Scientific Graphs';

    tr.innerHTML = `
      <td><strong>${index + 1}</strong></td>
      <td><span class="badge-tag">${obs.metal}</span></td>
      <td><strong>${obs.freq_1e14.toFixed(2)}</strong></td>
      <td>${Math.round(obs.wavelength_nm)}</td>
      <td>${obs.intensity_pct}%</td>
      <td>${obs.energy_eV.toFixed(2)}</td>
      <td>
        <span class="metric-badge ${obs.isEmitting ? 'status-active' : 'status-stopped'}">
          ${obs.isEmitting ? 'Yes' : 'No'}
        </span>
      </td>
      <td class="text-emerald"><strong>${obs.kmax_eV.toFixed(2)}</strong></td>
      <td class="text-purple">${obs.stoppingPot_V.toFixed(2)}</td>
      <td class="text-cyan">${obs.photocurrent_uA.toFixed(1)}</td>
      <td>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="obs-plot-btn" onclick="selectObservationToGraph(event, ${obs.id})" title="View corresponding graph">
            ${isSelected ? '✓ Plotting' : 'Plot Graph &rarr;'}
          </button>
          <button class="btn btn-xs btn-danger-outline" onclick="deleteObservationRow(event, ${index})" title="Remove trial">
            &times;
          </button>
        </div>
      </td>
    `;

    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-danger-outline')) return;
      selectObservationToGraph(e, obs.id);
    });

    tbody.appendChild(tr);
  });

  updateTableSummary();
}

window.selectObservationToGraph = function(event, id) {
  if (event) event.stopPropagation();
  const obs = observationsData.find(d => d.id === id);
  if (!obs) return;

  if (window.scientificGraphs) {
    window.scientificGraphs.selectObservation(obs);
  }

  renderObservationsTable();

  // Navigate to scientific graphs page directly in single-view architecture
  navigateToPage('graphs');
};

window.clearTableSelectionHighlight = function() {
  renderObservationsTable();
};

window.deleteObservationRow = function(event, index) {
  if (event) event.stopPropagation();
  const deleted = observationsData[index];
  if (window.scientificGraphs && window.scientificGraphs.selectedObservation && window.scientificGraphs.selectedObservation.id === deleted?.id) {
    window.scientificGraphs.clearSelectedObservation();
  }
  observationsData.splice(index, 1);
  renderObservationsTable();
};

function updateTableSummary() {
  const summaryWorkfunc = document.getElementById('summary-workfunc');
  const summaryF0 = document.getElementById('summary-f0');
  const summaryCalcH = document.getElementById('summary-calc-h');

  const s = window.simState;
  if (summaryWorkfunc && s) summaryWorkfunc.textContent = `${s.workFunction_eV.toFixed(2)} eV`;
  if (summaryF0 && s) summaryF0.textContent = `${s.thresholdFreq_1e14.toFixed(2)} × 10¹⁴ Hz`;

  const validPoints = observationsData.filter(d => d.isEmitting && d.kmax_eV > 0);

  if (validPoints.length >= 2) {
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const n = validPoints.length;

    validPoints.forEach(p => {
      const x = p.freq_Hz;
      const y = p.kmax_eV;
      sumX += x;
      sumY += y;
      sumXY += (x * y);
      sumXX += (x * x);
    });

    const slope_h_eV_s = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    if (summaryCalcH && !isNaN(slope_h_eV_s) && slope_h_eV_s > 0) {
      summaryCalcH.textContent = `${(slope_h_eV_s * 1e15).toFixed(3)} × 10⁻¹⁵ eV·s`;
      summaryCalcH.style.color = '#10b981';
    }
  } else {
    if (summaryCalcH) {
      summaryCalcH.textContent = 'Need ≥ 2 emission trials';
      summaryCalcH.style.color = 'var(--text-faint)';
    }
  }
}

function exportObservationsCSV() {
  if (observationsData.length === 0) {
    alert('Observation table is empty. Record some trials before exporting CSV.');
    return;
  }

  const headers = [
    'Trial',
    'Target Metal',
    'Work Function (eV)',
    'Frequency (x10^14 Hz)',
    'Wavelength (nm)',
    'Light Intensity (%)',
    'Photon Energy (eV)',
    'Photoemission Occurred',
    'Max Kinetic Energy (eV)',
    'Stopping Potential (V)',
    'Photocurrent (uA)'
  ];

  const rows = observationsData.map((d, i) => [
    i + 1,
    `"${d.metal}"`,
    d.phi_eV.toFixed(2),
    d.freq_1e14.toFixed(2),
    Math.round(d.wavelength_nm),
    d.intensity_pct,
    d.energy_eV.toFixed(2),
    d.isEmitting ? 'YES' : 'NO',
    d.kmax_eV.toFixed(2),
    d.stoppingPot_V.toFixed(2),
    d.photocurrent_uA.toFixed(1)
  ]);

  let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'photoelectric_experiment_observations.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ==========================================================================
   4. APPLICATION INTERACTIVE DEMONSTRATORS (4 APPLICATIONS)
   ========================================================================== */
function initApplicationDemos() {
  // Demo 1: Automatic Doors Optical Beam Interruption
  const doorToggleBtn = document.getElementById('btn-toggle-door-beam');
  const doorBeamLine = document.getElementById('door-beam-line');
  const doorObstacleMarker = document.getElementById('door-obstacle-marker');
  const doorStatusBeam = document.getElementById('door-status-beam');
  const doorStatusCurrent = document.getElementById('door-status-current');
  const doorStatusRelay = document.getElementById('door-status-relay');
  const doorToggleText = document.getElementById('door-toggle-text');

  let isBeamBlocked = false;

  if (doorToggleBtn) {
    doorToggleBtn.addEventListener('click', () => {
      isBeamBlocked = !isBeamBlocked;
      if (doorBeamLine) doorBeamLine.classList.toggle('blocked', isBeamBlocked);
      if (doorObstacleMarker) doorObstacleMarker.classList.toggle('active', isBeamBlocked);

      if (isBeamBlocked) {
        if (doorStatusBeam) {
          doorStatusBeam.textContent = 'INTERRUPTED (Person Detected)';
          doorStatusBeam.className = 'demo-val text-rose';
        }
        if (doorStatusCurrent) {
          doorStatusCurrent.textContent = '0.0 µA (Beam Halts)';
          doorStatusCurrent.className = 'demo-val text-rose';
        }
        if (doorStatusRelay) {
          doorStatusRelay.textContent = 'SAFETY TRIGGER: DOOR OPENS!';
          doorStatusRelay.className = 'demo-val text-emerald';
        }
        if (doorToggleText) doorToggleText.textContent = 'Clear Doorway Path';
        if (window.playLabBeep) window.playLabBeep(520, 0.15, 'sine', 0.04);
      } else {
        if (doorStatusBeam) {
          doorStatusBeam.textContent = 'UNINTERRUPTED';
          doorStatusBeam.className = 'demo-val text-cyan';
        }
        if (doorStatusCurrent) {
          doorStatusCurrent.textContent = '45.0 µA';
          doorStatusCurrent.className = 'demo-val text-emerald';
        }
        if (doorStatusRelay) {
          doorStatusRelay.textContent = 'DOOR IDLE (CLOSED)';
          doorStatusRelay.className = 'demo-val text-amber';
        }
        if (doorToggleText) doorToggleText.textContent = 'Cross / Block Optical Beam';
        if (window.playLabBeep) window.playLabBeep(780, 0.1, 'sine', 0.03);
      }
    });
  }

  // Demo 2: Night Vision Microchannel Plate (MCP) Simulator
  const nvLightSlider = document.getElementById('nv-light-slider');
  const nvGainSlider = document.getElementById('nv-gain-slider');
  const nvLuxVal = document.getElementById('nv-lux-val');
  const nvGainVal = document.getElementById('nv-gain-val');
  const nvStatPrimary = document.getElementById('nv-stat-primary');
  const nvStatAmplified = document.getElementById('nv-stat-amplified');
  const nvStatLumens = document.getElementById('nv-stat-lumens');
  const nvScreenPreview = document.getElementById('nv-screen-preview');

  const lightLevels = [
    { label: 'Deep Overcast Night (0.0001 Lux)', primaryFlux: 250 },
    { label: 'Starlight (0.001 Lux)', primaryFlux: 1200 },
    { label: 'Quarter Moon (0.01 Lux)', primaryFlux: 8500 },
    { label: 'Half Moon (0.05 Lux)', primaryFlux: 35000 },
    { label: 'Full Moon Night (0.1 Lux)', primaryFlux: 95000 }
  ];

  function updateNightVisionDemo() {
    const levelIdx = Math.max(0, Math.min(lightLevels.length - 1, (parseInt(nvLightSlider?.value || '2', 10) - 1)));
    const gain = parseInt(nvGainSlider?.value || '10000', 10);
    const lightInfo = lightLevels[levelIdx];

    if (nvLuxVal) nvLuxVal.textContent = lightInfo.label;
    if (nvGainVal) nvGainVal.textContent = `${gain.toLocaleString()}×`;

    const primaryElectrons = lightInfo.primaryFlux;
    const amplifiedTotal = primaryElectrons * gain;
    const luminanceCd = Math.min(120, (amplifiedTotal / 2.5e6) * 10);

    if (nvStatPrimary) nvStatPrimary.textContent = `${primaryElectrons.toLocaleString()} e⁻/sec`;
    if (nvStatAmplified) {
      nvStatAmplified.textContent = amplifiedTotal > 1e6 ? 
        `${(amplifiedTotal / 1e6).toFixed(2)} × 10⁶ e⁻/sec` : 
        `${amplifiedTotal.toLocaleString()} e⁻/sec`;
    }
    if (nvStatLumens) nvStatLumens.textContent = `${luminanceCd.toFixed(1)} cd/m²`;

    if (nvScreenPreview) {
      const alpha = Math.min(0.9, Math.max(0.12, luminanceCd / 50));
      nvScreenPreview.style.background = `rgba(16, 185, 129, ${alpha})`;
      nvScreenPreview.style.boxShadow = `0 0 ${Math.min(30, luminanceCd * 0.4)}px rgba(16, 185, 129, ${alpha * 0.8})`;
      const visibilityScore = Math.min(100, Math.round(luminanceCd * 2));
      nvScreenPreview.textContent = `VISIBILITY: ${visibilityScore}% • ${visibilityScore > 75 ? 'HIGH FIDELITY' : visibilityScore > 40 ? 'MODERATE' : 'FAINT NOCTURNAL'}`;
    }
  }

  if (nvLightSlider) nvLightSlider.addEventListener('input', updateNightVisionDemo);
  if (nvGainSlider) nvGainSlider.addEventListener('input', updateNightVisionDemo);

  // Demo 3: Photo Cell Lux Simulator
  const cellLuxSlider = document.getElementById('cell-lux-slider');
  const cellLuxVal = document.getElementById('cell-lux-val');
  const cellStatPhotons = document.getElementById('cell-stat-photons');
  const cellStatCurrent = document.getElementById('cell-stat-current');

  function updatePhotocellDemo() {
    const lux = parseFloat(cellLuxSlider?.value || '500');
    if (cellLuxVal) cellLuxVal.textContent = `${lux.toFixed(0)} Lux`;

    const current_uA = lux * 0.072;
    const flux_e14 = (lux * 0.0064);

    if (cellStatPhotons) cellStatPhotons.textContent = `${flux_e14.toFixed(2)} × 10¹⁴ photons/s`;
    if (cellStatCurrent) cellStatCurrent.textContent = `${current_uA.toFixed(1)} µA`;
  }

  if (cellLuxSlider) cellLuxSlider.addEventListener('input', updatePhotocellDemo);

  // Demo 4: Photomultiplier Tube (PMT) Dynode Cascade
  const pmtDeltaSlider = document.getElementById('pmt-delta-slider');
  const pmtStagesSlider = document.getElementById('pmt-stages-slider');
  const pmtDeltaVal = document.getElementById('pmt-delta-val');
  const pmtStagesVal = document.getElementById('pmt-stages-val');
  const pmtStatGain = document.getElementById('pmt-stat-gain');
  const pmtStatElectrons = document.getElementById('pmt-stat-electrons');
  const pmtStatCharge = document.getElementById('pmt-stat-charge');

  function updatePMTDemo() {
    const delta = parseFloat(pmtDeltaSlider?.value || '4.0');
    const n = parseInt(pmtStagesSlider?.value || '10', 10);

    if (pmtDeltaVal) pmtDeltaVal.textContent = delta.toFixed(1);
    if (pmtStagesVal) pmtStagesVal.textContent = `${n} Stages`;

    const gain = Math.pow(delta, n);
    const charge_pC = (gain * 1.602176634e-19) * 1e12;

    if (pmtStatGain) {
      if (gain >= 1e6) {
        pmtStatGain.textContent = `${(gain / 1e6).toFixed(2)} × 10⁶`;
      } else {
        pmtStatGain.textContent = `${Math.round(gain).toLocaleString()}`;
      }
    }

    if (pmtStatElectrons) {
      pmtStatElectrons.textContent = gain >= 1e7 ? 
        `${gain.toExponential(2)} e⁻` : 
        `${Math.round(gain).toLocaleString()} e⁻`;
    }

    if (pmtStatCharge) {
      pmtStatCharge.textContent = `${charge_pC.toFixed(3)} pC`;
    }
  }

  if (pmtDeltaSlider) pmtDeltaSlider.addEventListener('input', updatePMTDemo);
  if (pmtStagesSlider) pmtStagesSlider.addEventListener('input', updatePMTDemo);
}

/* ==========================================================================
   5. ADVANCED PHOTOELECTRIC EMISSION SIMULATOR & QUANTUM VISUALIZATION
   ========================================================================== */
function initAdvancedEmission() {
  const modeCwBtn = document.getElementById('adv-mode-cw');
  const modePulsedBtn = document.getElementById('adv-mode-pulsed');
  const freqSlider = document.getElementById('adv-freq-slider');
  const phiSlider = document.getElementById('adv-phi-slider');
  const intensitySlider = document.getElementById('adv-intensity-slider');

  const freqValEl = document.getElementById('adv-freq-val');
  const phiValEl = document.getElementById('adv-phi-val');
  const intensityValEl = document.getElementById('adv-intensity-val');

  const resHfEl = document.getElementById('adv-res-hf');
  const resNminEl = document.getElementById('adv-res-nmin');
  const resSingleEl = document.getElementById('adv-res-single');
  const resKmaxEl = document.getElementById('adv-res-kmax');
  const captionEl = document.getElementById('adv-canvas-caption');

  const canvas = document.getElementById('advanced-multiphoton-canvas');
  let isPulsedMode = false;

  if (modeCwBtn && modePulsedBtn) {
    modeCwBtn.addEventListener('click', () => {
      isPulsedMode = false;
      modeCwBtn.classList.add('active');
      modePulsedBtn.classList.remove('active');
      updateAdvancedSimulation();
    });

    modePulsedBtn.addEventListener('click', () => {
      isPulsedMode = true;
      modePulsedBtn.classList.add('active');
      modeCwBtn.classList.remove('active');
      updateAdvancedSimulation();
    });
  }

  if (freqSlider) freqSlider.addEventListener('input', updateAdvancedSimulation);
  if (phiSlider) phiSlider.addEventListener('input', updateAdvancedSimulation);
  if (intensitySlider) intensitySlider.addEventListener('input', updateAdvancedSimulation);

  function updateAdvancedSimulation() {
    const f_1e14 = parseFloat(freqSlider?.value || '4.0');
    const phi_eV = parseFloat(phiSlider?.value || '2.3');
    const intensityTier = parseInt(intensitySlider?.value || '5', 10);

    const h_eV_s = 4.135667696e-15;
    const hf = h_eV_s * (f_1e14 * 1e14);
    const n_min = Math.max(1, Math.ceil(phi_eV / hf));

    if (freqValEl) {
      let bandName = f_1e14 < 4.3 ? 'Red / Near-IR' : f_1e14 < 5.5 ? 'Green / Visible' : f_1e14 < 7.5 ? 'Violet / Blue' : 'Ultraviolet';
      freqValEl.textContent = `${f_1e14.toFixed(2)} × 10¹⁴ Hz (${bandName})`;
    }
    if (phiValEl) {
      let metalName = Math.abs(phi_eV - 2.14) < 0.1 ? 'Cesium' : 
                      Math.abs(phi_eV - 2.30) < 0.1 ? 'Potassium' : 
                      Math.abs(phi_eV - 2.36) < 0.1 ? 'Sodium' : 
                      Math.abs(phi_eV - 4.31) < 0.1 ? 'Zinc' : 
                      Math.abs(phi_eV - 4.70) < 0.1 ? 'Copper' : 'Metal';
      phiValEl.textContent = `${phi_eV.toFixed(2)} eV (${metalName})`;
    }
    if (intensityValEl) {
      intensityValEl.textContent = `${(1.0).toFixed(1)} × 10¹² W/cm² (Tier ${intensityTier})`;
    }

    if (resHfEl) resHfEl.textContent = `${hf.toFixed(2)} eV`;
    if (resNminEl) resNminEl.textContent = `${n_min} Photon${n_min > 1 ? 's' : ''}`;

    const isSinglePossible = hf >= phi_eV;
    if (resSingleEl) {
      if (isSinglePossible) {
        resSingleEl.textContent = `ALLOWED (${(hf - phi_eV).toFixed(2)} eV excess)`;
        resSingleEl.className = 'demo-val text-emerald';
      } else {
        resSingleEl.textContent = `BLOCKED (hf < Φ by ${(phi_eV - hf).toFixed(2)} eV)`;
        resSingleEl.className = 'demo-val text-rose';
      }
    }

    if (resKmaxEl) {
      if (isPulsedMode) {
        const kmax_multi = (n_min * hf) - phi_eV;
        resKmaxEl.textContent = `${kmax_multi.toFixed(2)} eV (${n_min}-photon absorption)`;
        resKmaxEl.className = 'demo-val text-emerald';
      } else {
        if (isSinglePossible) {
          resKmaxEl.textContent = `${(hf - phi_eV).toFixed(2)} eV (Ordinary 1-photon)`;
          resKmaxEl.className = 'demo-val text-emerald';
        } else {
          resKmaxEl.textContent = `0.00 eV (No Emission)`;
          resKmaxEl.className = 'demo-val text-rose';
        }
      }
    }

    if (captionEl) {
      if (!isPulsedMode) {
        if (isSinglePossible) {
          captionEl.textContent = `Ordinary CW Mode: Single photon hf = ${hf.toFixed(2)} eV > Φ (${phi_eV.toFixed(2)} eV). Photoelectrons ejected linearly with intensity.`;
        } else {
          captionEl.textContent = `Ordinary CW Mode: Single photon hf = ${hf.toFixed(2)} eV < Φ (${phi_eV.toFixed(2)} eV). Light intensity cannot overcome work function.`;
        }
      } else {
        captionEl.textContent = `Ultrafast Pulsed Laser Mode: Simultaneous coherent absorption of ${n_min} photons imparts total energy ${ (n_min * hf).toFixed(2) } eV > Φ (${phi_eV.toFixed(2)} eV), liberating electrons via multiphoton photoemission!`;
      }
    }

    drawAdvancedCanvas(canvas, hf, phi_eV, n_min, isPulsedMode, isSinglePossible);
  }

  function drawAdvancedCanvas(cvs, hf, phi, n_min, isPulsed, isSinglePossible) {
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const w = cvs.width;
    const h = cvs.height;

    ctx.clearRect(0, 0, w, h);

    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#040b17');
    bgGrad.addColorStop(1, '#020610');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    const baseLineY = h - 50;
    const vacuumY = baseLineY - (phi * 32);

    // 1. Metal Fermi Sea
    ctx.fillStyle = 'rgba(14, 165, 233, 0.18)';
    ctx.fillRect(40, baseLineY, w - 80, 40);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, baseLineY);
    ctx.lineTo(w - 40, baseLineY);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillText('Fermi Level (EF = 0 eV)', 50, baseLineY + 18);

    // 2. Vacuum Level
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, vacuumY);
    ctx.lineTo(w - 40, vacuumY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Vacuum Level (Φ = ${phi.toFixed(2)} eV)`, 50, vacuumY - 8);

    // 3. Arrow for Work function Φ
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    drawArrow(ctx, w - 60, baseLineY, w - 60, vacuumY);
    ctx.fillText('Φ', w - 50, (baseLineY + vacuumY) / 2 + 4);

    // 4. Photon Absorption Steps
    if (!isPulsed) {
      const topY = baseLineY - (hf * 32);
      ctx.strokeStyle = isSinglePossible ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 3;
      drawArrow(ctx, 160, baseLineY, 160, topY);

      ctx.fillStyle = isSinglePossible ? '#10b981' : '#f43f5e';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.fillText(`1× Photon: ${hf.toFixed(2)} eV`, 175, (baseLineY + topY) / 2);

      if (isSinglePossible) {
        ctx.strokeStyle = '#10b981';
        drawArrow(ctx, 160, vacuumY, 160, topY);
        ctx.fillStyle = '#10b981';
        ctx.fillText(`Kmax = ${(hf - phi).toFixed(2)} eV`, 175, topY - 8);
      } else {
        ctx.fillStyle = '#f43f5e';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('✕ Cannot cross barrier', 175, topY - 6);
      }
    } else {
      let currentY = baseLineY;
      const stepX = 170;

      for (let i = 1; i <= n_min; i++) {
        const nextY = currentY - (hf * 32);

        if (i < n_min) {
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(stepX - 40, nextY);
          ctx.lineTo(stepX + 40, nextY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        drawArrow(ctx, stepX, currentY, stepX, nextY);

        ctx.fillStyle = '#c084fc';
        ctx.font = '600 10px monospace';
        ctx.fillText(`hf #${i}`, stepX + 12, (currentY + nextY) / 2 + 4);

        currentY = nextY;
      }

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      drawArrow(ctx, stepX, vacuumY, stepX, currentY);

      const kmax = (n_min * hf) - phi;
      ctx.fillStyle = '#10b981';
      ctx.font = '700 12px Inter, sans-serif';
      ctx.fillText(`Multiphoton Kmax = ${kmax.toFixed(2)} eV (${n_min}×hf - Φ)`, stepX + 15, currentY - 8);
    }
  }

  function drawArrow(ctx, fromx, fromy, tox, toy) {
    const headlen = 8;
    const angle = Math.atan2(toy - fromy, tox - fromx);
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  window.updateAdvancedSimulation = updateAdvancedSimulation;
  updateAdvancedSimulation();
}

/* ==========================================================================
   6. PROJECT DIARY / DEVELOPMENT LOGBOOK CONTROLLER
   ========================================================================== */
const DIARY_STORAGE_KEY = 'photoelectric_project_diary';

const DEFAULT_DIARY_ENTRIES = [
  {
    id: 'entry-1',
    date: '2026-09-08T10:30:00Z',
    author: 'Harshini V (26BCE1356)',
    category: 'Quantum Theory Derivation',
    title: 'Planck Radiation Hypothesis & Einstein Photoelectric Equation Analysis',
    body: 'Derived the theoretical foundation linking Max Planck\'s discrete quantum hypothesis (E = nhf, 1900) to Albert Einstein\'s heuristic light quantum formulation (1905). Analyzed why classical electromagnetic wave theory fails to explain the existence of threshold frequency f0 = Phi/h and the immediate emission of photoelectrons (< 10^-9 s).'
  },
  {
    id: 'entry-2',
    date: '2026-09-18T14:15:00Z',
    author: 'Nandini S (26BCE1424)',
    category: 'Apparatus Modeling & Physics Simulation',
    title: 'Computational Photoelectric Tube Numerical Engine Implementation',
    body: 'Architected the core interactive HTML5 Canvas simulation engine modeling monochromatic incident light, target work functions (Cs, K, Na, Zn, Pt), and electrostatic retarding potentials (-Vs). Ensured rigorous conservation of energy: Kmax = hf - Phi = e*Vs, dynamically rendered at 60 FPS with particle motion vectors.'
  },
  {
    id: 'entry-3',
    date: '2026-09-28T16:00:00Z',
    author: 'S Bhavana (26BCE1286)',
    category: 'Data Analysis & Scientific Graphs',
    title: 'Linear Regression for Planck\'s Constant & Five Foundational Graphs',
    body: 'Constructed scientific charting canvas plotting (1) Photocurrent vs. Retarding Voltage for varying intensities, (2) Stopping Potential vs. Frequency, (3) Kinetic Energy vs. Frequency, and (4) Photocurrent vs. Intensity. Implemented least-squares linear regression on experimental trial points to derive experimental Planck constant h with residual R² analysis.'
  },
  {
    id: 'entry-4',
    date: '2026-10-06T11:45:00Z',
    author: 'Naravula Sudeeptaa (26BCE1336)',
    category: 'Applications & Interactive Demonstrators',
    title: 'Engineering Applications (Automatic Doors, Night Vision, Photocells, PMTs)',
    body: 'Designed in-depth undergraduate engineering modules for the four primary technological applications of photoemission. Integrated dynamic computational simulators demonstrating infrared beam interruption relays, Microchannel Plate (MCP) secondary electron gain in night vision, linear phototube lux response, and PMT dynode cascade multiplication.'
  }
];

function getStoredDiaryEntries() {
  try {
    const raw = localStorage.getItem(DIARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Could not read diary from localStorage:', e);
  }
  saveDiaryEntries(DEFAULT_DIARY_ENTRIES);
  return DEFAULT_DIARY_ENTRIES;
}

function saveDiaryEntries(entries) {
  try {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('Could not save diary to localStorage:', e);
  }
}

function renderProjectDiary() {
  const container = document.getElementById('diary-entries-container');
  const searchInput = document.getElementById('diary-search-input');
  if (!container) return;

  const entries = getStoredDiaryEntries();
  const query = (searchInput?.value || '').toLowerCase().trim();

  const filtered = entries.filter(e => {
    if (!query) return true;
    return (
      e.title.toLowerCase().includes(query) ||
      e.author.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query) ||
      e.body.toLowerCase().includes(query)
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel" style="padding: 30px; text-align: center; color: var(--text-muted);">
        <p>No logbook entries match "${query}". Click "Reset Defaults" or add a new entry above.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const dateFormatted = new Date(item.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    return `
      <div class="diary-entry-card glass-panel" data-id="${item.id}">
        <div class="diary-entry-header">
          <div>
            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 6px;">
              <span class="diary-entry-tag">${escapeHtml(item.category || 'Engineering Log')}</span>
              <span class="diary-entry-date">${dateFormatted}</span>
            </div>
            <h3 class="diary-entry-title">${escapeHtml(item.title)}</h3>
            <span class="diary-entry-author">By: <strong>${escapeHtml(item.author)}</strong></span>
          </div>
          <button class="btn btn-xs btn-danger-outline" onclick="deleteDiaryEntry('${item.id}')" title="Delete log entry">
            &times; Delete
          </button>
        </div>
        <div class="diary-entry-body">
          ${escapeHtml(item.body)}
        </div>
      </div>
    `;
  }).join('');
}

window.renderProjectDiary = renderProjectDiary;

window.deleteDiaryEntry = function(id) {
  if (confirm('Delete this diary log entry?')) {
    const entries = getStoredDiaryEntries();
    const updated = entries.filter(e => e.id !== id);
    saveDiaryEntries(updated);
    renderProjectDiary();
  }
};

function initProjectDiary() {
  const openAddBtn = document.getElementById('btn-open-add-diary');
  const formCard = document.getElementById('diary-form-card');
  const saveBtn = document.getElementById('btn-save-diary-entry');
  const cancelBtn = document.getElementById('btn-cancel-diary-entry');
  const searchInput = document.getElementById('diary-search-input');
  const exportBtn = document.getElementById('btn-export-diary');
  const resetBtn = document.getElementById('btn-reset-diary');

  if (openAddBtn && formCard) {
    openAddBtn.addEventListener('click', () => {
      formCard.classList.toggle('hidden');
      if (!formCard.classList.contains('hidden')) {
        document.getElementById('new-diary-title')?.focus();
      }
    });
  }

  if (cancelBtn && formCard) {
    cancelBtn.addEventListener('click', () => {
      formCard.classList.add('hidden');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const titleInput = document.getElementById('new-diary-title');
      const authorInput = document.getElementById('new-diary-author');
      const categoryInput = document.getElementById('new-diary-category');
      const bodyInput = document.getElementById('new-diary-body');

      const title = titleInput?.value.trim();
      const author = authorInput?.value.trim() || 'Harshini V (26BCE1356)';
      const category = categoryInput?.value.trim() || 'Development Log';
      const body = bodyInput?.value.trim();

      if (!title || !body) {
        alert('Please provide a title and detailed observations for this log entry.');
        return;
      }

      const newEntry = {
        id: 'entry-' + Date.now(),
        date: new Date().toISOString(),
        author: author,
        category: category,
        title: title,
        body: body
      };

      const entries = getStoredDiaryEntries();
      entries.unshift(newEntry);
      saveDiaryEntries(entries);

      if (titleInput) titleInput.value = '';
      if (categoryInput) categoryInput.value = '';
      if (bodyInput) bodyInput.value = '';
      if (formCard) formCard.classList.add('hidden');

      renderProjectDiary();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', renderProjectDiary);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const entries = getStoredDiaryEntries();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', 'photoelectric_project_diary.json');
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset Project Diary to standard BAPHY 105 project milestones?')) {
        saveDiaryEntries(DEFAULT_DIARY_ENTRIES);
        renderProjectDiary();
      }
    });
  }

  renderProjectDiary();
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
