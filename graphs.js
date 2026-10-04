/**
 * SCIENTIFIC GRAPHS & ANALYSIS ENGINE
 * High-DPI Canvas Plotter for Photoelectric Effect Curves
 * 1. Kmax vs Frequency (f)
 * 2. Stopping Potential (Vs) vs Frequency (f)
 * 3. Photocurrent (I) vs Light Intensity
 * 4. Photocurrent (I) vs Collector Voltage (I-V Characteristics)
 *
 * Supports Interactive Observation Selection:
 * Clicking any trial in the Observation Table dynamically links and plots
 * that specific observation's data on the corresponding scientific graph!
 */

class ScientificGraphEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;

    this.activeGraphType = 'kmax-vs-freq'; // 'kmax-vs-freq', 'vs-vs-freq', 'current-vs-intensity', 'current-vs-voltage'
    this.selectedObservation = null;       // Linked observation object (or null for live sim)
    
    // Canvas dimensions & Plot Margins
    this.width = 960;
    this.height = 440;
    this.margins = { top: 40, right: 50, bottom: 65, left: 80 };

    this.setupResolution();
    this.bindEvents();
    this.renderActiveGraph();
  }

  setupResolution() {
    if (!this.canvas) return;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(this.dpr, this.dpr);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.setupResolution();
      this.renderActiveGraph();
    });

    // Tab buttons
    const tabs = document.querySelectorAll('.graph-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeGraphType = tab.getAttribute('data-graph');
        this.updateSidebarAnalysis();
        this.renderActiveGraph();
      });
    });

    // Export PNG button
    const exportBtn = document.getElementById('btn-export-graph');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportChartPNG());
    }

    // Revert to Live Parameters Button
    const resetGraphBtn = document.getElementById('btn-reset-graph-live');
    if (resetGraphBtn) {
      resetGraphBtn.addEventListener('click', () => {
        this.clearSelectedObservation();
        if (window.clearTableSelectionHighlight) {
          window.clearTableSelectionHighlight();
        }
      });
    }
  }

  selectObservation(obs) {
    this.selectedObservation = obs;
    const banner = document.getElementById('active-graph-banner');
    const textEl = document.getElementById('active-graph-text');
    if (banner && textEl) {
      textEl.textContent = `Displaying Data for Trial #${obs.id}: ${obs.metal} (f = ${obs.freq_1e14.toFixed(2)} × 10¹⁴ Hz, Intensity = ${obs.intensity_pct}%, Kmax = ${obs.kmax_eV.toFixed(2)} eV)`;
      banner.classList.remove('hidden');
    }
    this.updateSidebarAnalysis();
    this.renderActiveGraph();
  }

  clearSelectedObservation() {
    this.selectedObservation = null;
    const banner = document.getElementById('active-graph-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
    this.updateSidebarAnalysis();
    this.renderActiveGraph();
  }

  exportChartPNG() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = `photoelectric_${this.activeGraphType}${this.selectedObservation ? '_trial' + this.selectedObservation.id : ''}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  get plotArea() {
    return {
      x: this.margins.left,
      y: this.margins.top,
      w: this.width - this.margins.left - this.margins.right,
      h: this.height - this.margins.top - this.margins.bottom
    };
  }

  getActiveParams() {
    if (this.selectedObservation) {
      const obs = this.selectedObservation;
      const f0 = obs.phi_eV / (CONSTANTS.h_eV_s * 1e14);
      return {
        isObservation: true,
        obsId: obs.id,
        metalName: obs.metal,
        phi: obs.phi_eV,
        f0: f0,
        curF: obs.freq_1e14,
        curKmax: obs.kmax_eV,
        curVs: obs.stoppingPot_V,
        curIntensity: obs.intensity_pct,
        curI: obs.photocurrent_uA,
        curV: 0.00,
        isEmitting: obs.isEmitting
      };
    }

    return {
      isObservation: false,
      obsId: null,
      metalName: METALS[simState.currentMetalKey]?.name || 'Target Metal',
      phi: simState.workFunction_eV,
      f0: simState.thresholdFreq_1e14,
      curF: simState.frequency_1e14,
      curKmax: simState.maxKineticEnergy_eV,
      curVs: simState.stoppingPotential_V,
      curIntensity: simState.intensity_pct,
      curI: simState.photocurrent_uA,
      curV: simState.collectorVoltage_V,
      isEmitting: simState.isEmitting
    };
  }

  renderActiveGraph() {
    if (!this.canvas) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    switch (this.activeGraphType) {
      case 'kmax-vs-freq':
        this.renderKmaxVsFreq();
        break;
      case 'vs-vs-freq':
        this.renderVsVsFreq();
        break;
      case 'current-vs-intensity':
        this.renderCurrentVsIntensity();
        break;
      case 'current-vs-voltage':
        this.renderCurrentVsVoltage();
        break;
      default:
        this.renderKmaxVsFreq();
    }
  }

  /* -------------------------------------------------------------
     GRAPH 1: Maximum Kinetic Energy (Kmax) vs. Frequency (f)
     ------------------------------------------------------------- */
  renderKmaxVsFreq() {
    const ctx = this.ctx;
    const p = this.plotArea;
    const params = this.getActiveParams();

    const f0 = params.f0;
    const phi = params.phi;
    const curF = params.curF;
    const curKmax = params.curKmax;

    const xMin = 0;
    const xMax = 12.0; // 10^14 Hz
    const yMin = -3.0; // eV (showing intercept at -Phi)
    const yMax = 3.0;  // eV

    const titlePrefix = params.isObservation ? `[Observation #${params.obsId} — ${params.metalName}] ` : '';
    this.drawGridAndAxes({
      title: `${titlePrefix}GRAPH 1: Maximum Kinetic Energy (Kmax) vs. Frequency (f)`,
      xLabel: 'Frequency f (× 10¹⁴ Hz)',
      yLabel: 'Maximum Kinetic Energy Kmax (eV)',
      xMin, xMax, yMin, yMax,
      xTicks: [0, 2, 4, 6, 8, 10, 12],
      yTicks: [-3, -2, -1, 0, 1, 2, 3],
      zeroYVal: 0
    });

    const toX = (val) => p.x + ((val - xMin) / (xMax - xMin)) * p.w;
    const toY = (val) => p.y + p.h - ((val - yMin) / (yMax - yMin)) * p.h;

    // 1. Negative extrapolation dashed line (from (0, -Phi) to (f0, 0))
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(-phi));
    ctx.lineTo(toX(f0), toY(0));
    ctx.stroke();

    // Mark Y-intercept at -Phi
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(toX(0), toY(-phi), 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 11px "Fira Code", monospace';
    ctx.fillText(`(0, −Φ) = −${phi.toFixed(2)} eV`, toX(0) + 10, toY(-phi) + 4);

    // 2. Physical theoretical active line: Kmax = hf - Phi for f >= f0
    ctx.setLineDash([]);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(toX(f0), toY(0));
    const kMaxAtEnd = (CONSTANTS.h_eV_s * (xMax * 1e14)) - phi;
    ctx.lineTo(toX(xMax), toY(kMaxAtEnd));
    ctx.stroke();

    // 3. Mark Threshold Frequency f0 on X-axis
    ctx.fillStyle = '#f59e0b';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(toX(f0), toY(0), 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillText(`f₀ = ${f0.toFixed(2)} × 10¹⁴ Hz`, toX(f0) - 35, toY(0) + 20);

    // 4. Plot other recorded observations as historical scatter points
    if (window.observationsData && window.observationsData.length > 0) {
      window.observationsData.forEach(obs => {
        if (params.isObservation && obs.id === params.obsId) return; // Skip active (drawn specially below)
        const ox = toX(obs.freq_1e14);
        const oy = toY(obs.kmax_eV);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
        ctx.beginPath();
        ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '9px "Fira Code", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`#${obs.id}`, ox + 6, oy - 4);
      });
    }

    // 5. Active Selected Operating Point
    if (curF >= f0) {
      const curPtX = toX(curF);
      const curPtY = toY(curKmax);

      // Coordinate dashed projection lines
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = params.isObservation ? 'rgba(0, 240, 255, 0.7)' : 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curPtX, toY(yMin));
      ctx.lineTo(curPtX, curPtY);
      ctx.lineTo(toX(xMin), curPtY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Outer Pulsing Target Ring if selected observation
      if (params.isObservation) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(curPtX, curPtY, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glowing Point Marker
      ctx.fillStyle = params.isObservation ? '#00f0ff' : '#10b981';
      ctx.shadowColor = params.isObservation ? '#00f0ff' : '#10b981';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(curPtX, curPtY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Label coordinate
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.font = '700 11px "Fira Code", monospace';
      const label = params.isObservation ? `Obs #${params.obsId}: (${curF.toFixed(2)}, ${curKmax.toFixed(2)} eV)` : `Live: (${curF.toFixed(2)}, ${curKmax.toFixed(2)} eV)`;
      ctx.fillText(label, curPtX + 14, curPtY - 8);
    } else {
      // Subthreshold marker on 0 eV axis
      const curPtX = toX(curF);
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(curPtX, toY(0), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`f < f₀ (Kmax = 0)`, curPtX + 10, toY(0) - 10);
    }

    ctx.restore();
    this.updateLiveCoordBadge(`${curF.toFixed(2)} × 10¹⁴ Hz`, `${curKmax.toFixed(2)} eV`, params);
  }

  /* -------------------------------------------------------------
     GRAPH 2: Stopping Potential (Vs) vs. Frequency (f)
     ------------------------------------------------------------- */
  renderVsVsFreq() {
    const ctx = this.ctx;
    const p = this.plotArea;
    const params = this.getActiveParams();

    const f0 = params.f0;
    const phi = params.phi;
    const curF = params.curF;
    const curVs = params.curVs;

    const xMin = 0;
    const xMax = 12.0;
    const yMin = 0;
    const yMax = 3.5;

    const titlePrefix = params.isObservation ? `[Observation #${params.obsId} — ${params.metalName}] ` : '';
    this.drawGridAndAxes({
      title: `${titlePrefix}GRAPH 2: Stopping Potential (Vs) vs. Frequency (f)`,
      xLabel: 'Frequency f (× 10¹⁴ Hz)',
      yLabel: 'Stopping Potential Vs (Volts)',
      xMin, xMax, yMin, yMax,
      xTicks: [0, 2, 4, 6, 8, 10, 12],
      yTicks: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
      zeroYVal: 0
    });

    const toX = (val) => p.x + ((val - xMin) / (xMax - xMin)) * p.w;
    const toY = (val) => p.y + p.h - ((val - yMin) / (yMax - yMin)) * p.h;

    ctx.save();

    // Straight line: Vs = (h/e)f - (Phi/e) above f0
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(toX(f0), toY(0));
    const vsAtEnd = (CONSTANTS.h_eV_s * (xMax * 1e14)) - phi;
    ctx.lineTo(toX(xMax), toY(vsAtEnd));
    ctx.stroke();

    // Mark f0
    ctx.fillStyle = '#f59e0b';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(toX(f0), toY(0), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '700 11px "Fira Code", monospace';
    ctx.fillText(`f₀ = ${f0.toFixed(2)}`, toX(f0) - 20, toY(0) + 18);

    // Scatter points for all recorded observations
    if (window.observationsData) {
      window.observationsData.forEach(obs => {
        if (params.isObservation && obs.id === params.obsId) return;
        if (!obs.isEmitting) return;
        const ox = toX(obs.freq_1e14);
        const oy = toY(obs.stoppingPot_V);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.65)';
        ctx.beginPath();
        ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '9px "Fira Code", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`#${obs.id}`, ox + 6, oy - 4);
      });
    }

    // Current Operating Point
    if (curF >= f0) {
      const curPtX = toX(curF);
      const curPtY = toY(curVs);

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curPtX, toY(0));
      ctx.lineTo(curPtX, curPtY);
      ctx.lineTo(toX(0), curPtY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (params.isObservation) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(curPtX, curPtY, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(curPtX, curPtY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      const label = params.isObservation ? `Obs #${params.obsId}: Vs = ${curVs.toFixed(2)} V` : `Vs = ${curVs.toFixed(2)} V`;
      ctx.fillText(label, curPtX + 14, curPtY - 8);
    }

    ctx.restore();
    this.updateLiveCoordBadge(`${curF.toFixed(2)} × 10¹⁴ Hz`, `${curVs.toFixed(2)} V`, params);
  }

  /* -------------------------------------------------------------
     GRAPH 3: Photocurrent (I) vs. Light Intensity
     ------------------------------------------------------------- */
  renderCurrentVsIntensity() {
    const ctx = this.ctx;
    const p = this.plotArea;
    const params = this.getActiveParams();

    const isEmitting = params.isEmitting;
    const curIntensity = params.curIntensity;
    const curI = params.curI;

    const xMin = 0;
    const xMax = 100; // %
    const yMin = 0;
    const yMax = 80;  // uA

    const titlePrefix = params.isObservation ? `[Observation #${params.obsId} — ${params.metalName}] ` : '';
    this.drawGridAndAxes({
      title: `${titlePrefix}GRAPH 3: Photocurrent (I) vs. Light Intensity (%)`,
      xLabel: 'Incident Light Intensity (%)',
      yLabel: 'Saturation Photocurrent (µA)',
      xMin, xMax, yMin, yMax,
      xTicks: [0, 20, 40, 60, 80, 100],
      yTicks: [0, 20, 40, 60, 80],
      zeroYVal: 0
    });

    const toX = (val) => p.x + ((val - xMin) / (xMax - xMin)) * p.w;
    const toY = (val) => p.y + p.h - ((val - yMin) / (yMax - yMin)) * p.h;

    ctx.save();

    if (isEmitting) {
      // Linear relationship: I = k * Intensity
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(168, 85, 129, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      ctx.lineTo(toX(100), toY(72)); // 72 uA at 100%
      ctx.stroke();

      // Scatter points for all recorded observations
      if (window.observationsData) {
        window.observationsData.forEach(obs => {
          if (params.isObservation && obs.id === params.obsId) return;
          const ox = toX(obs.intensity_pct);
          const oy = toY(obs.photocurrent_uA);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.65)';
          ctx.beginPath();
          ctx.arc(ox, oy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '9px "Fira Code", monospace';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillText(`#${obs.id}`, ox + 6, oy - 4);
        });
      }

      // Current Point
      const curPtX = toX(curIntensity);
      const curPtY = toY(curI);

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curPtX, toY(0));
      ctx.lineTo(curPtX, curPtY);
      ctx.lineTo(toX(0), curPtY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (params.isObservation) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(curPtX, curPtY, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(curPtX, curPtY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.font = '700 11px "Fira Code", monospace';
      const label = params.isObservation ? `Obs #${params.obsId}: (${curIntensity}%, ${curI.toFixed(1)} µA)` : `(${curIntensity}%, ${curI.toFixed(1)} µA)`;
      ctx.fillText(label, curPtX + 14, curPtY - 8);
    } else {
      // Subthreshold: Flat zero line
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toX(0), toY(0));
      ctx.lineTo(toX(100), toY(0));
      ctx.stroke();

      ctx.font = '600 12px Outfit, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('f < f₀: Zero Photocurrent at All Intensities', toX(30), toY(15));
    }

    ctx.restore();
    this.updateLiveCoordBadge(`${curIntensity}% Intensity`, `${curI.toFixed(1)} µA`, params);
  }

  /* -------------------------------------------------------------
     GRAPH 4: I-V Characteristic Curve (Photocurrent vs Voltage)
     ------------------------------------------------------------- */
  renderCurrentVsVoltage() {
    const ctx = this.ctx;
    const p = this.plotArea;
    const params = this.getActiveParams();

    const vs = params.curVs;
    const isEmitting = params.isEmitting;
    const curV = params.curV;
    const curI = params.curI;

    const xMin = -3.0; // V
    const xMax = 3.0;  // V
    const yMin = 0;
    const yMax = 80;   // uA

    const titlePrefix = params.isObservation ? `[Observation #${params.obsId} — ${params.metalName}] ` : '';
    this.drawGridAndAxes({
      title: `${titlePrefix}GRAPH 4: Photocurrent (I) vs. Applied Collector Voltage (V)`,
      xLabel: 'Collector Potential V (Volts)',
      yLabel: 'Photocurrent I (µA)',
      xMin, xMax, yMin, yMax,
      xTicks: [-3, -2, -1, 0, 1, 2, 3],
      yTicks: [0, 20, 40, 60, 80],
      zeroYVal: 0,
      zeroXVal: 0
    });

    const toX = (val) => p.x + ((val - xMin) / (xMax - xMin)) * p.w;
    const toY = (val) => p.y + p.h - ((val - yMin) / (yMax - yMin)) * p.h;

    ctx.save();

    if (isEmitting) {
      const satI = params.curIntensity * 0.72;

      // Draw characteristic I-V curve
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      // Before -Vs: 0 current
      ctx.moveTo(toX(xMin), toY(0));
      ctx.lineTo(toX(-vs), toY(0));

      // Curve from -Vs to +3V
      const steps = 60;
      for (let s = 0; s <= steps; s++) {
        const v = -vs + (s / steps) * (xMax - (-vs));
        let iVal = 0;
        if (v < 0) {
          const frac = Math.pow((v + vs) / vs, 1.8);
          iVal = satI * frac;
        } else {
          const accFactor = 1 - Math.exp(-(v + 0.3) / 0.8);
          iVal = Math.min(satI, satI * 0.88 + satI * 0.12 * Math.min(1, accFactor));
        }
        ctx.lineTo(toX(v), toY(iVal));
      }
      ctx.stroke();

      // Mark Stopping Potential -Vs on X axis
      ctx.fillStyle = '#f43f5e';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(toX(-vs), toY(0), 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '700 11px "Fira Code", monospace';
      ctx.fillText(`−Vs = −${vs.toFixed(2)} V`, toX(-vs) - 30, toY(0) + 18);

      // Current Operating Point
      const curPtX = toX(curV);
      const curPtY = toY(curI);

      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(curPtX, toY(0));
      ctx.lineTo(curPtX, curPtY);
      ctx.lineTo(toX(xMin), curPtY);
      ctx.stroke();
      ctx.setLineDash([]);

      if (params.isObservation) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(curPtX, curPtY, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(curPtX, curPtY, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      const label = params.isObservation ? `Obs #${params.obsId}: (${curV.toFixed(2)} V, ${curI.toFixed(1)} µA)` : `(${curV >= 0 ? '+' : ''}${curV.toFixed(2)} V, ${curI.toFixed(1)} µA)`;
      ctx.fillText(label, curPtX + 14, curPtY - 8);
    } else {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toX(xMin), toY(0));
      ctx.lineTo(toX(xMax), toY(0));
      ctx.stroke();

      ctx.font = '600 12px Outfit, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('f < f₀: Zero Photocurrent regardless of Voltage', toX(-1.5), toY(20));
    }

    ctx.restore();
    this.updateLiveCoordBadge(`${curV >= 0 ? '+' : ''}${curV.toFixed(2)} V`, `${curI.toFixed(1)} µA`, params);
  }

  /* -------------------------------------------------------------
     Coordinate Grid, Axes & Labels Drawer Helper
     ------------------------------------------------------------- */
  drawGridAndAxes(cfg) {
    const ctx = this.ctx;
    const p = this.plotArea;

    ctx.save();

    // Background chart plot fill
    ctx.fillStyle = 'rgba(6, 14, 30, 0.65)';
    ctx.fillRect(p.x, p.y, p.w, p.h);

    const toX = (val) => p.x + ((val - cfg.xMin) / (cfg.xMax - cfg.xMin)) * p.w;
    const toY = (val) => p.y + p.h - ((val - cfg.yMin) / (cfg.yMax - cfg.yMin)) * p.h;

    // Draw Grid Lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';

    // X Grid & Ticks
    for (const xt of cfg.xTicks) {
      const gx = toX(xt);
      ctx.beginPath();
      ctx.moveTo(gx, p.y);
      ctx.lineTo(gx, p.y + p.h);
      ctx.stroke();

      // Tick label
      ctx.fillText(xt.toString(), gx, p.y + p.h + 16);
    }

    // Y Grid & Ticks
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const yt of cfg.yTicks) {
      const gy = toY(yt);
      ctx.beginPath();
      ctx.moveTo(p.x, gy);
      ctx.lineTo(p.x + p.w, gy);
      ctx.stroke();

      // Tick label
      ctx.fillText(yt.toString(), p.x - 8, gy);
    }

    // Main Axes (X & Y)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;

    // Zero Y axis line
    const zeroY = toY(cfg.zeroYVal ?? 0);
    ctx.beginPath();
    ctx.moveTo(p.x, zeroY);
    ctx.lineTo(p.x + p.w, zeroY);
    ctx.stroke();

    // Zero X axis or Left border
    const zeroX = cfg.zeroXVal !== undefined ? toX(cfg.zeroXVal) : p.x;
    ctx.beginPath();
    ctx.moveTo(zeroX, p.y);
    ctx.lineTo(zeroX, p.y + p.h);
    ctx.stroke();

    // Chart Border
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    // Axis Titles
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cfg.xLabel, p.x + p.w / 2, p.y + p.h + 40);

    ctx.save();
    ctx.translate(22, p.y + p.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(cfg.yLabel, 0, 0);
    ctx.restore();

    // Graph Title in top-left
    ctx.font = '700 13px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(cfg.title, p.x + 8, p.y - 12);

    ctx.restore();
  }

  updateLiveCoordBadge(xVal, yVal, params) {
    const p = params || this.getActiveParams();
    const coordEl = document.getElementById('g-stat-coord');
    const metalEl = document.getElementById('g-stat-metal');
    const f0El = document.getElementById('g-stat-f0');

    if (coordEl) coordEl.textContent = `(${xVal}, ${yVal})`;
    if (metalEl) metalEl.textContent = `${p.metalName} (${p.phi.toFixed(2)} eV)`;
    if (f0El) f0El.textContent = `${p.f0.toFixed(2)} × 10¹⁴ Hz`;
  }

  updateSidebarAnalysis() {
    const titleEl = document.getElementById('graph-analysis-title');
    const contentEl = document.getElementById('graph-analysis-content');
    if (!titleEl || !contentEl) return;

    const params = this.getActiveParams();
    const contextTag = params.isObservation ? `<span class="card-tag">OBSERVATION #${params.obsId}</span><br>` : '';

    switch (this.activeGraphType) {
      case 'kmax-vs-freq':
        titleEl.textContent = 'Kmax vs Frequency (f)';
        contentEl.innerHTML = `
          ${contextTag}
          <p><strong>Equation:</strong> <code>K<sub>max</sub> = hf &minus; &phi;</code></p>
          <ul class="analysis-points">
            <li><strong>Slope (m):</strong> Universal Planck constant <code>h = 4.136 &times; 10⁻¹⁵ eV&middot;s</code> for all target metals.</li>
            <li><strong>X-Intercept:</strong> Threshold frequency <code>f₀ = &phi; / h = ${params.f0.toFixed(2)} &times; 10¹⁴ Hz</code>. Below f₀, emission is physically impossible.</li>
            <li><strong>Negative Y-Intercept:</strong> Work function <code>&minus;&phi; = &minus;${params.phi.toFixed(2)} eV</code>.</li>
            <li><strong>Active Point:</strong> ${params.isObservation ? `Logged Trial #${params.obsId}` : 'Current Live Lab'} at f = ${params.curF.toFixed(2)} × 10¹⁴ Hz.</li>
          </ul>
        `;
        break;

      case 'vs-vs-freq':
        titleEl.textContent = 'Stopping Potential (Vs) vs Frequency';
        contentEl.innerHTML = `
          ${contextTag}
          <p><strong>Equation:</strong> <code>V<sub>s</sub> = (h/e)f &minus; (&phi;/e)</code></p>
          <ul class="analysis-points">
            <li><strong>Slope (m):</strong> Fundamental ratio <code>h/e = 4.136 &times; 10⁻¹⁵ V&middot;s</code>. Universal for any electrode!</li>
            <li><strong>Threshold (f₀):</strong> At <code>${params.f0.toFixed(2)} &times; 10¹⁴ Hz</code>, stopping potential is 0 V.</li>
            <li><strong>Active Point:</strong> Vs = ${params.curVs.toFixed(2)} V for ${params.metalName}.</li>
          </ul>
        `;
        break;

      case 'current-vs-intensity':
        titleEl.textContent = 'Photocurrent (I) vs Light Intensity';
        contentEl.innerHTML = `
          ${contextTag}
          <p><strong>Relationship:</strong> <code>I &prop; Intensity (for f &ge; f₀)</code></p>
          <ul class="analysis-points">
            <li><strong>Direct Proportionality:</strong> When frequency is above threshold, current scales linearly with light brightness.</li>
            <li><strong>Sub-Threshold:</strong> Flat zero current line if f &lt; f₀, regardless of intensity.</li>
            <li><strong>Active Point:</strong> Intensity = ${params.curIntensity}%, Photocurrent = ${params.curI.toFixed(1)} µA.</li>
          </ul>
        `;
        break;

      case 'current-vs-voltage':
        titleEl.textContent = 'I-V Characteristic Curve';
        contentEl.innerHTML = `
          ${contextTag}
          <p><strong>Characteristic:</strong> Current response to collector potential V.</p>
          <ul class="analysis-points">
            <li><strong>Retarding Cut-off (&minus;Vs):</strong> At <code>V &le; &minus;${params.curVs.toFixed(2)} V</code>, photocurrent ceases.</li>
            <li><strong>Saturation Current:</strong> Reaches plateau of ~${(params.curIntensity * 0.72).toFixed(1)} µA for ${params.curIntensity}% intensity.</li>
          </ul>
        `;
        break;
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.scientificGraphs = new ScientificGraphEngine('scientific-chart-canvas');
});
