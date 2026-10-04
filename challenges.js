/**
 * INTERACTIVE CHALLENGE / EXPERIMENT MODE ENGINE
 * Practical Physics Tasks & Guided Problem-Solving
 */

const CHALLENGE_TASKS = [
  {
    id: 0,
    title: "Find the Threshold Frequency of Potassium",
    metalKey: "K",
    phi_eV: 2.30,
    description: "Potassium has a work function of Φ = 2.30 eV. Adjust the frequency slider in the laboratory until photoelectric emission just begins (within ± 0.15 × 10¹⁴ Hz of the threshold frequency f₀).",
    hint: "f₀ = Φ / h. For 2.30 eV: f₀ = 2.30 / 4.1357 × 10⁻¹⁵ ≈ 5.56 × 10¹⁴ Hz. Set metal to Potassium (K) and frequency to ~5.55 – 5.65 × 10¹⁴ Hz.",
    targetMetalText: "Potassium (K, Φ = 2.30 eV)",
    requiredConditionText: "5.45 × 10¹⁴ ≤ f ≤ 5.70 × 10¹⁴ Hz (Emission Just Begins)",
    validate: (state) => {
      if (state.currentMetalKey !== 'K' && Math.abs(state.workFunction_eV - 2.30) > 0.05) {
        return { success: false, msg: "Target metal is not Potassium (Φ = 2.30 eV). Please select Potassium (K) in the Virtual Lab." };
      }
      const f = state.frequency_1e14;
      if (f < 5.45) {
        return { success: false, msg: `Current frequency (${f.toFixed(2)} × 10¹⁴ Hz) is too low. No emission can occur. Increase frequency towards ~5.56 × 10¹⁴ Hz.` };
      }
      if (f > 5.75) {
        return { success: false, msg: `Current frequency (${f.toFixed(2)} × 10¹⁴ Hz) is well above threshold! The electron kinetic energy is already ${state.maxKineticEnergy_eV.toFixed(2)} eV. Lower the frequency to find the onset point.` };
      }
      return { success: true, msg: `✓ Outstanding! Threshold frequency f₀ ≈ 5.56 × 10¹⁴ Hz verified. At this exact threshold, photon energy hf equals Φ (2.30 eV) and photoelectrons are liberated with approximately zero kinetic energy.` };
    }
  },
  {
    id: 1,
    title: "Configure Parameters for Target Kmax = 0.50 ± 0.05 eV",
    metalKey: "Cs",
    phi_eV: 2.14,
    description: "Select Cesium (Φ = 2.14 eV) and adjust the incident frequency so that the liberated photoelectrons have a maximum kinetic energy of exactly 0.50 eV (allowable range: 0.45 eV to 0.55 eV).",
    hint: "Kmax = hf − Φ ⟹ hf = Φ + Kmax = 2.14 + 0.50 = 2.64 eV. Then f = 2.64 / (4.136 × 10⁻¹⁵) ≈ 6.38 × 10¹⁴ Hz.",
    targetMetalText: "Cesium (Cs, Φ = 2.14 eV)",
    requiredConditionText: "0.45 eV ≤ Kmax ≤ 0.55 eV",
    validate: (state) => {
      if (state.currentMetalKey !== 'Cs' && Math.abs(state.workFunction_eV - 2.14) > 0.05) {
        return { success: false, msg: "Target metal must be Cesium (Cs, Φ = 2.14 eV). Please select Cesium in the Virtual Lab." };
      }
      const kmax = state.maxKineticEnergy_eV;
      if (kmax < 0.45) {
        return { success: false, msg: `Current Kmax is ${kmax.toFixed(2)} eV (too low). Increase incident frequency to impart more kinetic energy!` };
      }
      if (kmax > 0.55) {
        return { success: false, msg: `Current Kmax is ${kmax.toFixed(2)} eV (too high). Decrease incident frequency closer to ~6.38 × 10¹⁴ Hz.` };
      }
      return { success: true, msg: `✓ Perfect calibration! Kmax = ${kmax.toFixed(2)} eV. At f ≈ ${state.frequency_1e14.toFixed(2)} × 10¹⁴ Hz, photon energy is ${(CONSTANTS.h_eV_s * state.frequency_Hz).toFixed(2)} eV, yielding exactly ~0.50 eV excess kinetic energy.` };
    }
  },
  {
    id: 2,
    title: "Demonstrate the Sub-Threshold Intensity Fallacy",
    metalKey: "Zn",
    phi_eV: 4.31,
    description: "Demonstrate that for Zinc (Φ = 4.31 eV), setting incident light to high intensity (≥ 80%) with visible light (f ≤ 6.5 × 10¹⁴ Hz) produces ZERO photocurrent.",
    hint: "Zinc has a high work function (4.31 eV, UV threshold ~10.4 × 10¹⁴ Hz). Set metal to Zinc, intensity to 80–100%, and frequency to visible green or red light.",
    targetMetalText: "Zinc (Zn, Φ = 4.31 eV)",
    requiredConditionText: "Intensity ≥ 80%, f ≤ 6.50 × 10¹⁴ Hz, Photocurrent = 0 µA",
    validate: (state) => {
      if (state.currentMetalKey !== 'Zn' && Math.abs(state.workFunction_eV - 4.31) > 0.05) {
        return { success: false, msg: "Please select Zinc (Zn, Φ = 4.31 eV) in the Virtual Lab." };
      }
      if (state.intensity_pct < 80) {
        return { success: false, msg: `Set light intensity to at least 80% (currently ${state.intensity_pct}%). We want to prove that high brightness fails!` };
      }
      if (state.frequency_1e14 > 6.50) {
        return { success: false, msg: `Frequency (${state.frequency_1e14.toFixed(2)} × 10¹⁴ Hz) is too high. Lower it into the visible spectrum (f ≤ 6.50 × 10¹⁴ Hz).` };
      }
      return { success: true, msg: `✓ Proof Complete! Photocurrent is 0 µA despite ${state.intensity_pct}% light intensity! This vividly proves that light wave amplitude cannot compensate for insufficient single-photon quantum energy (hf < Φ).` };
    }
  },
  {
    id: 3,
    title: "Find Stopping Potential for Zinc in Ultraviolet",
    metalKey: "Zn",
    phi_eV: 4.31,
    description: "Irradiate Zinc (Φ = 4.31 eV) with deep UV radiation at f = 10.00 × 10¹⁴ Hz. Adjust the collector tube voltage to halt all photocurrent (find −Vs).",
    hint: "At f = 10.0 × 10¹⁴ Hz, hf ≈ 4.14 eV. Wait, threshold for Zinc is 4.31 / 4.136 ≈ 10.42 × 10¹⁴ Hz. What if we use Potassium or Sodium? For Sodium (2.36 eV) at f = 7.00 × 10¹⁴ Hz: Vs ≈ 0.53 V. Let's find stopping voltage where meter reads 0 µA!",
    targetMetalText: "Potassium (K) or Sodium (Na) with f > f₀",
    requiredConditionText: "Set Tube Voltage V = −Vs such that Photocurrent = 0.0 µA",
    validate: (state) => {
      if (!state.isEmitting) {
        return { success: false, msg: "Electrons must first be emitting! Choose a metal with f > f₀ (e.g. Potassium or Cesium with f ≥ 7.0 × 10¹⁴ Hz)." };
      }
      const v = state.collectorVoltage_V;
      const vs = state.stoppingPotential_V;
      if (v > -vs + 0.05) {
        return { success: false, msg: `Collector voltage (${v >= 0 ? '+' : ''}${v.toFixed(2)} V) has not reached stopping potential (−${vs.toFixed(2)} V). Current is still ${state.photocurrent_uA.toFixed(1)} µA.` };
      }
      return { success: true, msg: `✓ Stopping Potential Confirmed! At V = ${v.toFixed(2)} V (≤ −${vs.toFixed(2)} V), the opposing electric field overcomes even the most energetic photoelectron (Kmax = ${state.maxKineticEnergy_eV.toFixed(2)} eV). Photocurrent drops to exactly 0.0 µA!` };
    }
  }
];

class ChallengeEngine {
  constructor() {
    this.activeTaskIndex = 0;
    this.completedTasks = new Set();

    this.initDOM();
  }

  initDOM() {
    this.tabs = document.querySelectorAll('.challenge-tab');
    this.taskBadge = document.getElementById('task-badge');
    this.headline = document.getElementById('task-headline');
    this.description = document.getElementById('task-description');
    this.hint = document.getElementById('task-hint');
    this.targetMetal = document.getElementById('task-target-metal');
    this.userVal = document.getElementById('task-user-val');
    this.requiredCond = document.getElementById('task-required-cond');
    this.statusPill = document.getElementById('task-status-pill');
    this.feedbackAlert = document.getElementById('task-feedback-alert');

    this.verifyBtn = document.getElementById('btn-verify-task');
    this.resetBtn = document.getElementById('btn-reset-task');

    // Bind tab clicks
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        this.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeTaskIndex = index;
        this.renderTask();
      });
    });

    if (this.verifyBtn) {
      this.verifyBtn.addEventListener('click', () => this.verifyCurrentTask());
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.completedTasks.delete(this.activeTaskIndex);
        this.renderTask();
      });
    }

    this.renderTask();
  }

  renderTask() {
    const task = CHALLENGE_TASKS[this.activeTaskIndex];
    if (!task) return;

    if (this.taskBadge) this.taskBadge.textContent = `TASK ${task.id + 1} OF ${CHALLENGE_TASKS.length}`;
    if (this.headline) this.headline.textContent = task.title;
    if (this.description) this.description.textContent = task.description;
    if (this.hint) this.hint.textContent = task.hint;
    if (this.targetMetal) this.targetMetal.textContent = task.targetMetalText;
    if (this.requiredCond) this.requiredCond.textContent = task.requiredConditionText;

    if (this.feedbackAlert) {
      this.feedbackAlert.className = 'task-feedback hidden';
      this.feedbackAlert.innerHTML = '';
    }

    const isDone = this.completedTasks.has(this.activeTaskIndex);
    if (this.statusPill) {
      if (isDone) {
        this.statusPill.className = 'task-status-pill completed';
        this.statusPill.textContent = '✓ Completed';
      } else {
        this.statusPill.className = 'task-status-pill';
        this.statusPill.textContent = 'Status: Incomplete';
      }
    }

    this.updateLiveStatus();
  }

  updateLiveStatus() {
    const task = CHALLENGE_TASKS[this.activeTaskIndex];
    if (!task || !this.userVal) return;

    const s = window.simState;
    if (!s) return;

    switch (this.activeTaskIndex) {
      case 0:
        this.userVal.textContent = `f = ${s.frequency_1e14.toFixed(2)} × 10¹⁴ Hz (Metal: ${METALS[s.currentMetalKey]?.name})`;
        break;
      case 1:
        this.userVal.textContent = `Kmax = ${s.maxKineticEnergy_eV.toFixed(2)} eV (f = ${s.frequency_1e14.toFixed(2)} × 10¹⁴ Hz)`;
        break;
      case 2:
        this.userVal.textContent = `Intensity = ${s.intensity_pct}%, f = ${s.frequency_1e14.toFixed(2)} × 10¹⁴, I = ${s.photocurrent_uA.toFixed(1)} µA`;
        break;
      case 3:
        this.userVal.textContent = `Voltage = ${s.collectorVoltage_V.toFixed(2)} V, I = ${s.photocurrent_uA.toFixed(1)} µA (Vs = ${s.stoppingPotential_V.toFixed(2)} V)`;
        break;
    }
  }

  verifyCurrentTask() {
    const task = CHALLENGE_TASKS[this.activeTaskIndex];
    if (!task || !window.simState) return;

    const res = task.validate(window.simState);

    if (this.feedbackAlert) {
      this.feedbackAlert.classList.remove('hidden');
      if (res.success) {
        this.completedTasks.add(this.activeTaskIndex);
        this.feedbackAlert.className = 'task-feedback success';
        this.feedbackAlert.innerHTML = `<strong>SUCCESS:</strong> ${res.msg}`;
        if (this.statusPill) {
          this.statusPill.className = 'task-status-pill completed';
          this.statusPill.textContent = '✓ Completed';
        }
        if (window.playLabBeep) window.playLabBeep(880, 0.1, 'triangle', 0.05);
      } else {
        this.feedbackAlert.className = 'task-feedback warning';
        this.feedbackAlert.innerHTML = `<strong>GUIDANCE:</strong> ${res.msg}`;
        if (window.playLabBeep) window.playLabBeep(320, 0.1, 'sawtooth', 0.04);
      }
    }
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.challengeEngine = new ChallengeEngine();
});
