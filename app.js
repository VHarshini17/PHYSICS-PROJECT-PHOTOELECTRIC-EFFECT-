/**
 * MAIN APPLICATION CONTROLLER
 * Handles Navigation, Control Panel Inputs, Observations Table,
 * CSV Export, Linear Regression Analysis, and UI Interactivity.
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLabControls();
  initObservationTable();
  initEditableCredits();
});

/* ==========================================================================
   1. NAVIGATION & SCROLLSPY
   ========================================================================== */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-links .nav-item');
  const sections = document.querySelectorAll('section[id], footer[id]');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('nav-menu');

  // Mobile Menu Toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Close on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }

  // Active Link on Scroll
  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = section.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${currentId}`);
      });
    }
  }, { passive: true });
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
      window.simState.frequency_1e14 = parseFloat(e.target.value);
      window.updateSimulationUI();
      highlightActivePreset(e.target.value);
    });
  }

  // Quick Preset Frequency Chips
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = parseFloat(chip.getAttribute('data-freq'));
      if (freqSlider) freqSlider.value = val;
      window.simState.frequency_1e14 = val;
      window.updateSimulationUI();
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
      window.simState.intensity_pct = parseInt(e.target.value, 10);
      window.updateSimulationUI();
    });
  }

  // Collector Tube Voltage Slider Input
  if (voltageSlider) {
    voltageSlider.addEventListener('input', (e) => {
      window.simState.collectorVoltage_V = parseFloat(e.target.value);
      window.updateSimulationUI();
    });
  }

  // Snap to Stopping Potential (-Vs)
  if (snapVsBtn) {
    snapVsBtn.addEventListener('click', () => {
      if (window.simState.isEmitting) {
        const vs = window.simState.stoppingPotential_V;
        const snapVal = Math.max(-3.00, -vs);
        window.simState.collectorVoltage_V = parseFloat(snapVal.toFixed(2));
        if (voltageSlider) voltageSlider.value = snapVal.toFixed(2);
        window.updateSimulationUI();
      }
    });
  }

  // Work Function Slider Input (Fine tuning)
  if (phiSlider) {
    phiSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      window.simState.workFunction_eV = val;

      // If matches known preset, keep key, else set to custom
      let matchedKey = 'custom';
      for (const [key, obj] of Object.entries(window.METALS)) {
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

      window.updateSimulationUI();
    });
  }

  // Target Metal Buttons Selector
  metalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      metalButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const metalKey = btn.getAttribute('data-metal');
      const phiVal = parseFloat(btn.getAttribute('data-phi'));

      window.simState.currentMetalKey = metalKey;
      window.simState.workFunction_eV = phiVal;

      if (phiSlider) phiSlider.value = phiVal;
      if (currentMetalTag) {
        currentMetalTag.textContent = `${window.METALS[metalKey]?.name || 'Custom'} (${phiVal.toFixed(2)} eV)`;
      }

      window.updateSimulationUI();
    });
  });

  // Pause / Resume Simulation
  if (pauseBtn) {
    const pauseIcon = document.getElementById('btn-pause-icon');
    const pauseText = document.getElementById('btn-pause-text');

    pauseBtn.addEventListener('click', () => {
      window.simState.isPaused = !window.simState.isPaused;
      if (window.simState.isPaused) {
        pauseIcon.innerHTML = '&#9654;';
        pauseText.textContent = 'Resume';
        pauseBtn.classList.add('btn-primary');
        pauseBtn.classList.remove('btn-outline');
      } else {
        pauseIcon.innerHTML = '&#9646;&#9646;';
        pauseText.textContent = 'Pause';
        pauseBtn.classList.remove('btn-primary');
        pauseBtn.classList.add('btn-outline');
      }
    });
  }

  // Reset Simulation to Standard Defaults
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
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

      window.updateSimulationUI();
    });
  }

  // Sound Toggle
  if (soundBtn) {
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    soundBtn.addEventListener('click', () => {
      window.simState.soundEnabled = !window.simState.soundEnabled;
      if (window.simState.soundEnabled) {
        soundIcon.innerHTML = '&#128266;';
        soundText.textContent = 'Sound ON';
        soundBtn.style.color = 'var(--cyan-primary)';
      } else {
        soundIcon.innerHTML = '&#128263;';
        soundText.textContent = 'Sound OFF';
        soundBtn.style.color = 'var(--text-faint)';
      }
    });
  }

  // Record Observation from Lab Panel
  if (recordBtn) {
    recordBtn.addEventListener('click', () => {
      addCurrentObservation();
      // Visual Feedback on button
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
    metal: window.METALS[s.currentMetalKey]?.name || 'Custom',
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
  // Automatically sweeps 5 frequencies across visible/UV spectrum for current metal
  const s = window.simState;
  const currentPhi = s.workFunction_eV;
  const f0 = s.thresholdFreq_1e14;

  // Clear existing or append
  const sampleFreqs = [
    Math.max(3.5, f0 - 1.0),
    f0,
    f0 + 1.2,
    f0 + 2.5,
    Math.min(10.0, f0 + 4.0)
  ];

  sampleFreqs.forEach(freq => {
    s.frequency_1e14 = parseFloat(freq.toFixed(2));
    const hf = CONSTANTS.h_eV_s * s.frequency_Hz;
    const isEmit = (s.frequency_Hz >= s.thresholdFreq_Hz) && (s.intensity_pct > 0);
    const kmax = isEmit ? Math.max(0, hf - currentPhi) : 0;
    const vs = isEmit ? kmax : 0;
    const current = isEmit ? (s.intensity_pct * 0.72) : 0;

    observationsData.push({
      id: observationsData.length + 1,
      metal: window.METALS[s.currentMetalKey]?.name || 'Custom',
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

  // Restore active frequency to last one
  const freqSlider = document.getElementById('frequency-slider');
  if (freqSlider) freqSlider.value = s.frequency_1e14;
  window.updateSimulationUI();
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

    // Row click event: clicking anywhere on the row selects it and visualizes it
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

  // Highlight selected row in table
  renderObservationsTable();

  // Smoothly scroll down to graphs section with laboratory feel
  const graphSec = document.getElementById('graphs');
  if (graphSec) {
    graphSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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

  // Compute Linear Regression Slope (Planck's Constant h) from points where emission occurred
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
   4. INLINE EDITABLE CREDITS (Verified Academic Team Details)
   ========================================================================== */
function initEditableCredits() {
  // Verified Team Members and Affiliation details are rendered directly in HTML
}
