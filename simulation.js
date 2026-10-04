/**
 * PHOTOELECTRIC EFFECT SIMULATION ENGINE
 * Accurate quantum physics calculations & high-performance HTML5 Canvas renderer
 */

// Universal Physical Constants
const CONSTANTS = {
  h_eV_s: 4.135667696e-15,  // Planck's constant in eV·s
  h_J_s: 6.62607015e-34,    // Planck's constant in J·s
  c: 2.99792458e8,          // Speed of light in m/s
  e: 1.602176634e-19,       // Elementary charge in C
  m_e: 9.1093837e-31        // Electron mass in kg
};

// Metal Work Function Presets
const METALS = {
  Cs: { name: 'Cesium', phi: 2.14, color: '#fef08a' },
  K:  { name: 'Potassium', phi: 2.30, color: '#e2e8f0' },
  Na: { name: 'Sodium', phi: 2.36, color: '#cbd5e1' },
  Zn: { name: 'Zinc', phi: 4.31, color: '#94a3b8' },
  Cu: { name: 'Copper', phi: 4.65, color: '#fdba74' },
  custom: { name: 'Custom Metal', phi: 3.00, color: '#a5f3fc' }
};

// Simulation State
const simState = {
  // Primary Control Variables
  frequency_1e14: 6.00,      // in 10^14 Hz
  intensity_pct: 60,         // 0 to 100 %
  workFunction_eV: 2.30,     // in eV
  currentMetalKey: 'K',
  collectorVoltage_V: 0.00,  // -3.00 to +3.00 V

  // Derived Physical Values
  get frequency_Hz() { return this.frequency_1e14 * 1e14; },
  get wavelength_m() { return CONSTANTS.c / this.frequency_Hz; },
  get wavelength_nm() { return (this.wavelength_m * 1e9); },
  get photonEnergy_eV() { return CONSTANTS.h_eV_s * this.frequency_Hz; },
  get photonEnergy_J() { return this.photonEnergy_eV * CONSTANTS.e; },
  get thresholdFreq_Hz() { return (this.workFunction_eV / CONSTANTS.h_eV_s); },
  get thresholdFreq_1e14() { return this.thresholdFreq_Hz / 1e14; },
  get thresholdWavelength_nm() { return (CONSTANTS.c / this.thresholdFreq_Hz) * 1e9; },

  // Emission Criteria
  get isEmitting() {
    return (this.frequency_Hz >= this.thresholdFreq_Hz) && (this.intensity_pct > 0);
  },
  get maxKineticEnergy_eV() {
    if (!this.isEmitting) return 0;
    return Math.max(0, this.photonEnergy_eV - this.workFunction_eV);
  },
  get maxKineticEnergy_J() {
    return this.maxKineticEnergy_eV * CONSTANTS.e;
  },
  get maxVelocity_ms() {
    if (this.maxKineticEnergy_J <= 0) return 0;
    return Math.sqrt((2 * this.maxKineticEnergy_J) / CONSTANTS.m_e);
  },
  get stoppingPotential_V() {
    if (this.maxKineticEnergy_eV <= 0) return 0;
    return this.maxKineticEnergy_eV; // 1 eV = 1 V stopping potential
  },

  // Circuit Current (Micro-amperes)
  get photocurrent_uA() {
    if (!this.isEmitting) return 0;
    const saturationCurrent = this.intensity_pct * 0.72; // max ~72 uA at 100%
    const V = this.collectorVoltage_V;
    const Vs = this.stoppingPotential_V;

    // Retarding potential cut-off
    if (V <= -Vs) {
      return 0;
    }
    // Transition region between -Vs and 0V
    if (V < 0) {
      // Fraction of electrons having enough kinetic energy to overcome retarding voltage
      const fraction = Math.pow((V + Vs) / Vs, 1.8);
      return Math.max(0, saturationCurrent * fraction);
    }
    // Positive accelerating potential approaches saturation smoothly
    const accFactor = 1 - Math.exp(- (V + 0.3) / 0.8);
    return Math.min(saturationCurrent, saturationCurrent * 0.88 + saturationCurrent * 0.12 * Math.min(1, accFactor));
  },

  // Simulation Running Flags
  isPaused: false,
  soundEnabled: true
};

// Photon and Electron Particle Containers
const particles = {
  photons: [],
  electrons: [],
  sparks: [],
  lastPhotonTime: 0,
  lastElectronTime: 0
};

// Optical Wavelength to RGB Conversion Helper
function wavelengthToRGB(wavelength_nm) {
  let r = 0, g = 0, b = 0, alpha = 1;
  const wl = wavelength_nm;

  if (wl >= 380 && wl < 440) {
    r = -(wl - 440) / (440 - 380);
    g = 0.0;
    b = 1.0;
  } else if (wl >= 440 && wl < 490) {
    r = 0.0;
    g = (wl - 440) / (490 - 440);
    b = 1.0;
  } else if (wl >= 490 && wl < 510) {
    r = 0.0;
    g = 1.0;
    b = -(wl - 510) / (510 - 490);
  } else if (wl >= 510 && wl < 580) {
    r = (wl - 510) / (580 - 510);
    g = 1.0;
    b = 0.0;
  } else if (wl >= 580 && wl < 645) {
    r = 1.0;
    g = -(wl - 645) / (645 - 580);
    b = 0.0;
  } else if (wl >= 645 && wl <= 780) {
    r = 1.0;
    g = 0.0;
    b = 0.0;
  } else if (wl < 380) {
    // Ultraviolet
    r = 0.75;
    g = 0.2;
    b = 1.0;
  } else {
    // Infrared
    r = 0.6;
    g = 0.05;
    b = 0.05;
  }

  // Intensity ramp-off near visual boundaries
  let factor = 1.0;
  if (wl >= 380 && wl < 420) {
    factor = 0.3 + 0.7 * (wl - 380) / (420 - 380);
  } else if (wl >= 700 && wl <= 780) {
    factor = 0.3 + 0.7 * (780 - wl) / (780 - 700);
  } else if (wl < 380) {
    factor = 0.9;
  } else if (wl > 780) {
    factor = 0.5;
  }

  const red = Math.round(r * 255 * factor);
  const green = Math.round(g * 255 * factor);
  const blue = Math.round(b * 255 * factor);
  return {
    r: red,
    g: green,
    b: blue,
    rgbStr: `rgb(${red}, ${green}, ${blue})`,
    rgbaStr: (a) => `rgba(${red}, ${green}, ${blue}, ${a})`
  };
}

// Get Human Friendly Spectral Band
function getSpectralBandName(wl_nm) {
  if (wl_nm < 380) return 'Ultraviolet (UV)';
  if (wl_nm < 450) return 'Violet';
  if (wl_nm < 485) return 'Blue';
  if (wl_nm < 500) return 'Cyan';
  if (wl_nm < 565) return 'Green';
  if (wl_nm < 590) return 'Yellow';
  if (wl_nm < 625) return 'Orange';
  if (wl_nm <= 740) return 'Red';
  return 'Infrared (IR)';
}

// Sound Synthesizer via Web Audio API (Electron -> Collector Impact Sounds)
let audioCtx = null;
let impactAudioBuffer = null;
let masterImpactGain = null;
let lastImpactSoundTime = 0;

function initAudioSystem() {
  if (audioCtx && impactAudioBuffer) return audioCtx;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();

    if (!masterImpactGain) {
      masterImpactGain = audioCtx.createGain();
      masterImpactGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      masterImpactGain.connect(audioCtx.destination);
    }

    if (!impactAudioBuffer) {
      // Synthesize a pleasant, crisp, laboratory electron collision ping/click
      // Duration: 24ms, fast exponential decay, clean frequency sweep
      const sampleRate = audioCtx.sampleRate || 44100;
      const duration = 0.024;
      const frameCount = Math.floor(sampleRate * duration);
      impactAudioBuffer = audioCtx.createBuffer(1, frameCount, sampleRate);
      const data = impactAudioBuffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        // Fast, smooth exponential decay to avoid any end-clicks
        const env = Math.exp(-t * 240);
        // Frequency sweep from 1700 Hz to 1050 Hz (subtle metallic/electronic ping)
        const freq = 1700 - (t / duration) * 650;
        const wave = Math.sin(2 * Math.PI * freq * t);
        // Soft initial click transient in first 1.5ms
        const transient = (t < 0.0015) ? (Math.random() * 2 - 1) * 0.18 * (1 - t / 0.0015) : 0;
        data[i] = (wave * 0.82 + transient) * env;
      }
    }
  } catch (e) {
    // Gracefully handle browser restrictions
  }
  return audioCtx;
}

// User-gesture audio unlock
['click', 'touchstart', 'keydown', 'pointerdown'].forEach(evt => {
  window.addEventListener(evt, () => {
    const ctx = initAudioSystem();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }, { passive: true });
});

// Dedicated Electron -> Collector Collision Sound
// Plays a short, pleasant sound EACH time an electron hits the collector plate
// Repeats continuously if collisions continue; zero sound if no collisions occur
function playElectronCollectorImpact() {
  if (!simState.soundEnabled || simState.isPaused) return;

  const now = performance.now();
  // Minimum spacing (25ms) so rapid multiple hits remain crisp and distinct without acoustic jamming
  if (now - lastImpactSoundTime < 25) return;
  lastImpactSoundTime = now;

  try {
    const ctx = initAudioSystem();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!impactAudioBuffer || !masterImpactGain) return;

    const source = ctx.createBufferSource();
    source.buffer = impactAudioBuffer;
    // Micro-pitch variation (0.95 to 1.05) creates an organic, authentic detector texture
    source.playbackRate.value = 0.95 + Math.random() * 0.10;

    source.connect(masterImpactGain);
    source.start(0);

    // Cleanly disconnect when playback ends
    source.onended = () => {
      try { source.disconnect(); } catch (err) {}
    };
  } catch (e) {
    // Graceful fallback
  }
}

function playLabBeep(freq = 600, duration = 0.04, type = 'sine', volume = 0.05) {
  // Retained for non-simulation UI feedback if needed, but not triggered by simulation toggle
}

/* ==========================================================================
   CANVAS RENDERING ENGINE: VACUUM PHOTOTUBE APPARATUS
   ========================================================================== */
class ApparatusRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // High DPI Support
    this.dpr = window.devicePixelRatio || 1;
    this.setupResolution();
    window.addEventListener('resize', () => this.setupResolution());

    // Layout Dimensions of Apparatus Components
    this.tube = { x: 260, y: 55, w: 460, h: 220, r: 40 };
    this.lamp = { x: 70, y: 70, w: 90, h: 90 };
    this.cathode = { x: 330, y: 80, w: 16, h: 170 };   // Emitter plate
    this.anode = { x: 650, y: 80, w: 16, h: 170 };     // Collector plate
    this.circuitY = 365;

    // Electron Wire Current Particles
    this.wireParticles = [];
    for (let i = 0; i < 30; i++) {
      this.wireParticles.push({ progress: Math.random() });
    }

    this.lastFrameTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupResolution() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const width = rect.width || 900;
    const height = rect.height || 460;

    this.width = 900;
    this.height = 460;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(this.dpr, this.dpr);
  }

  updateParticles(dt) {
    if (simState.isPaused) return;

    const colorObj = wavelengthToRGB(simState.wavelength_nm);

    // 1. Spawn Photons from Light Source
    if (simState.intensity_pct > 0) {
      const photonInterval = Math.max(12, 160 - (simState.intensity_pct * 1.4));
      const now = performance.now();
      if (now - particles.lastPhotonTime > photonInterval) {
        particles.lastPhotonTime = now;
        
        // Spawn 1 to 3 photons based on intensity
        const count = simState.intensity_pct > 70 ? 2 : 1;
        for (let k = 0; k < count; k++) {
          const startY = this.lamp.y + 20 + Math.random() * (this.lamp.h - 40);
          const targetY = this.cathode.y + 15 + Math.random() * (this.cathode.h - 30);
          
          particles.photons.push({
            x: this.lamp.x + this.lamp.w + 5,
            y: startY,
            startX: this.lamp.x + this.lamp.w + 5,
            startY: startY,
            targetX: this.cathode.x,
            targetY: targetY,
            progress: 0,
            speed: 0.018 + Math.random() * 0.006,
            wavelength_nm: simState.wavelength_nm,
            energy_eV: simState.photonEnergy_eV,
            color: colorObj.rgbaStr(0.85),
            wavePhase: Math.random() * Math.PI * 2
          });
        }
      }
    }

    // 2. Advance Photons & Detect Metal Collision
    for (let i = particles.photons.length - 1; i >= 0; i--) {
      const p = particles.photons[i];
      p.progress += p.speed;
      p.x = p.startX + (p.targetX - p.startX) * p.progress;
      p.y = p.startY + (p.targetY - p.startY) * p.progress;

      // Photon strikes cathode plate
      if (p.progress >= 1.0) {
        particles.photons.splice(i, 1);

        if (simState.isEmitting) {
          // Photoelectron is liberated!
          const ke_eV = simState.maxKineticEnergy_eV * (0.35 + Math.random() * 0.65); // velocity distribution
          // Convert KE to normalized canvas speed
          const baseSpeed = 1.6 + Math.sqrt(ke_eV) * 2.8;

          // Emission angle spread (mostly rightwards towards collector)
          const angle = (Math.random() - 0.5) * 0.85; // +/- ~25 degrees
          const vx = Math.cos(angle) * baseSpeed;
          const vy = Math.sin(angle) * (baseSpeed * 0.45);

          particles.electrons.push({
            x: this.cathode.x + this.cathode.w,
            y: p.targetY,
            vx: vx,
            vy: vy,
            ke_eV: ke_eV,
            initialKE: ke_eV,
            size: 4 + Math.random() * 1.5,
            life: 1.0,
            trail: []
          });

          // Small spark on ejection
          particles.sparks.push({
            x: this.cathode.x + this.cathode.w,
            y: p.targetY,
            color: '#00f0ff',
            life: 1.0,
            size: 8
          });
        } else {
          // Below threshold: photon is harmlessly reflected/absorbed without ejecting electron
          particles.sparks.push({
            x: this.cathode.x,
            y: p.targetY,
            color: '#f43f5e',
            life: 0.6,
            size: 4
          });
        }
      }
    }

    // 3. Advance Emitted Photoelectrons
    // Retarding or accelerating electric field inside tube
    // Voltage: Positive accelerates towards collector; Negative retards/slows electrons
    const electricFieldAcc = (simState.collectorVoltage_V * 0.85);

    for (let i = particles.electrons.length - 1; i >= 0; i--) {
      const e = particles.electrons[i];

      // Trail record
      e.trail.push({ x: e.x, y: e.y });
      if (e.trail.length > 5) e.trail.shift();

      // Electric field effect on velocity
      e.vx += electricFieldAcc * 0.08;
      e.x += e.vx;
      e.y += e.vy;

      // Soft vertical bounce inside tube vacuum envelope
      if (e.y < this.tube.y + 12 || e.y > this.tube.y + this.tube.h - 12) {
        e.vy = -e.vy * 0.8;
      }

      // Check: Reached Collector Plate (Anode)
      if (e.x >= this.anode.x) {
        particles.electrons.splice(i, 1);

        // Collector impact spark
        particles.sparks.push({
          x: this.anode.x,
          y: e.y,
          color: '#38bdf8',
          life: 1.0,
          size: 9
        });

        // Synchronized subtle sound effect strictly upon collision with collector
        playElectronCollectorImpact();
        continue;
      }

      // Check: Turned back by retarding potential and hit emitter plate or bounced back
      if (e.vx <= 0 && e.x <= this.cathode.x + this.cathode.w) {
        // Turned back and absorbed by cathode
        particles.electrons.splice(i, 1);
        continue;
      }

      // If electron drifted way off boundaries
      if (e.x < this.tube.x - 20 || e.x > this.tube.x + this.tube.w + 30) {
        particles.electrons.splice(i, 1);
      }
    }

    // 4. Update Sparks
    for (let i = particles.sparks.length - 1; i >= 0; i--) {
      const s = particles.sparks[i];
      s.life -= 0.06;
      if (s.life <= 0) {
        particles.sparks.splice(i, 1);
      }
    }

    // 5. Update External Circuit Moving Charges
    if (simState.photocurrent_uA > 0) {
      const currentSpeed = (simState.photocurrent_uA / 100) * 0.012 + 0.002;
      for (const wp of this.wireParticles) {
        wp.progress = (wp.progress + currentSpeed) % 1.0;
      }
    }
  }

  drawApparatus() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw External Circuit Wires & Meters First (Behind Tube)
    this.drawExternalCircuit();

    // 2. Draw Light Source (Lamp, Housing, Lens)
    this.drawLightSource();

    // 3. Draw Light Cone / Rays
    this.drawIncidentLightBeam();

    // 4. Draw Vacuum Phototube (Quartz Glass Bulb)
    this.drawVacuumPhototube();

    // 5. Draw Target Emitter (Cathode) & Collector (Anode)
    this.drawPlates();

    // 6. Draw Moving Photons
    this.drawPhotons();

    // 7. Draw Emitted Photoelectrons & Trails
    this.drawElectrons();

    // 8. Draw Sparks / Impact Ripples
    this.drawSparks();
  }

  drawVacuumPhototube() {
    const ctx = this.ctx;
    const t = this.tube;

    ctx.save();

    // Outer quartz glow
    ctx.shadowColor = 'rgba(0, 240, 255, 0.12)';
    ctx.shadowBlur = 20;

    // Tube background (evacuated deep space interior)
    ctx.fillStyle = 'rgba(6, 15, 33, 0.78)';
    ctx.beginPath();
    ctx.roundRect(t.x, t.y, t.w, t.h, t.r);
    ctx.fill();

    // Tube Glass Borders
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.stroke();

    // Glass Reflection Highlights
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.roundRect(t.x + 8, t.y + 6, t.w - 16, 25, [20, 20, 0, 0]);
    ctx.stroke();

    // Quartz Window Label
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.fillText('EVACUATED QUARTZ PHOTOTUBE', t.x + t.w / 2 - 80, t.y + 24);

    // Subtle Grid in Vacuum Interior
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    for (let x = t.x + 30; x < t.x + t.w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, t.y + 10);
      ctx.lineTo(x, t.y + t.h - 10);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawLightSource() {
    const ctx = this.ctx;
    const lamp = this.lamp;
    const colorObj = wavelengthToRGB(simState.wavelength_nm);

    ctx.save();

    // Lamp Casing / Stand
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(lamp.x, lamp.y, lamp.w, lamp.h, 10);
    ctx.fill();
    ctx.stroke();

    // Stand base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(lamp.x + lamp.w / 2 - 8, lamp.y + lamp.h, 16, 60);

    // Lamp Lens Bevel
    const apertureX = lamp.x + lamp.w;
    const apertureY = lamp.y + lamp.h / 2;

    // Glowing Light Bulb Bulb Filament
    const glowGrad = ctx.createRadialGradient(
      lamp.x + lamp.w - 15, apertureY, 5,
      lamp.x + lamp.w - 15, apertureY, 40
    );
    glowGrad.addColorStop(0, colorObj.rgbaStr(simState.intensity_pct > 0 ? 0.95 : 0.15));
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(lamp.x + lamp.w - 15, apertureY, 40, 0, Math.PI * 2);
    ctx.fill();

    // Lens Ring
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = colorObj.rgbaStr(0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(apertureX, apertureY, 8, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lamp Label
    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('LIGHT SOURCE', lamp.x + 8, lamp.y + 24);

    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = colorObj.rgbStr;
    ctx.fillText(`${Math.round(simState.wavelength_nm)} nm`, lamp.x + 8, lamp.y + 44);
    ctx.fillText(`${simState.intensity_pct}% Flux`, lamp.x + 8, lamp.y + 60);

    ctx.restore();
  }

  drawIncidentLightBeam() {
    if (simState.intensity_pct <= 0) return;

    const ctx = this.ctx;
    const lamp = this.lamp;
    const cathode = this.cathode;
    const colorObj = wavelengthToRGB(simState.wavelength_nm);

    ctx.save();

    const beamAlpha = 0.08 + (simState.intensity_pct / 100) * 0.22;
    const beamGrad = ctx.createLinearGradient(
      lamp.x + lamp.w, lamp.y + lamp.h / 2,
      cathode.x, cathode.y + cathode.h / 2
    );
    beamGrad.addColorStop(0, colorObj.rgbaStr(beamAlpha * 1.5));
    beamGrad.addColorStop(0.8, colorObj.rgbaStr(beamAlpha));
    beamGrad.addColorStop(1, colorObj.rgbaStr(beamAlpha * 0.4));

    // Trapezoidal beam cone focused towards cathode plate
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(lamp.x + lamp.w, lamp.y + lamp.h / 2 - 25);
    ctx.lineTo(cathode.x, cathode.y + 10);
    ctx.lineTo(cathode.x, cathode.y + cathode.h - 10);
    ctx.lineTo(lamp.x + lamp.w, lamp.y + lamp.h / 2 + 25);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawPlates() {
    const ctx = this.ctx;
    const c = this.cathode;
    const a = this.anode;
    const metal = METALS[simState.currentMetalKey] || METALS.K;

    ctx.save();

    // 1. Emitter Cathode Plate (Photosensitive target)
    ctx.fillStyle = metal.color || '#e2e8f0';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.3)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(c.x, c.y, c.w, c.h, 4);
    ctx.fill();
    ctx.stroke();

    // Emitter Plate Connection Terminal
    ctx.fillStyle = '#64748b';
    ctx.fillRect(c.x + c.w / 2 - 3, c.y + c.h, 6, 40);

    // Emitter Plate Label
    ctx.shadowBlur = 0;
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('EMITTER (C)', c.x - 16, c.y - 12);
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = 'var(--amber-accent)';
    ctx.fillText(`${metal.name}`, c.x - 16, c.y + c.h + 20);
    ctx.fillText(`Φ=${simState.workFunction_eV.toFixed(2)}eV`, c.x - 16, c.y + c.h + 34);

    // 2. Collector Anode Plate
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.3)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(a.x, a.y, a.w, a.h, 4);
    ctx.fill();
    ctx.stroke();

    // Collector Plate Connection Terminal
    ctx.fillStyle = '#64748b';
    ctx.fillRect(a.x + a.w / 2 - 3, a.y + a.h, 6, 40);

    // Collector Plate Label
    ctx.shadowBlur = 0;
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('COLLECTOR (A)', a.x - 24, a.y - 12);

    // Voltage Polarity Tag above plates
    ctx.font = '700 11px "Fira Code", monospace';
    if (simState.collectorVoltage_V < 0) {
      ctx.fillStyle = '#10b981'; // Cathode is positive relative to collector
      ctx.fillText('( + )', c.x - 4, c.y + 14);
      ctx.fillStyle = '#f43f5e'; // Collector is negative (retarding)
      ctx.fillText('( − )', a.x - 4, a.y + 14);
    } else if (simState.collectorVoltage_V > 0) {
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('( − )', c.x - 4, c.y + 14);
      ctx.fillStyle = '#10b981';
      ctx.fillText('( + )', a.x - 4, a.y + 14);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('( 0 )', c.x - 4, c.y + 14);
      ctx.fillText('( 0 )', a.x - 4, a.y + 14);
    }

    ctx.restore();
  }

  drawPhotons() {
    const ctx = this.ctx;
    const colorObj = wavelengthToRGB(simState.wavelength_nm);

    ctx.save();
    for (const p of particles.photons) {
      ctx.strokeStyle = colorObj.rgbaStr(0.9);
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowColor = colorObj.rgbStr;
      ctx.shadowBlur = 8;

      // Draw sinusoidal wave-packet packet
      ctx.beginPath();
      const waveLen = 22;
      const numCycles = 2.5;
      const amp = 4.5;
      for (let s = -waveLen / 2; s <= waveLen / 2; s += 2) {
        const sineY = Math.sin((s / waveLen) * Math.PI * 2 * numCycles + p.wavePhase) * amp;
        const ptX = p.x + s;
        const ptY = p.y + sineY;
        if (s === -waveLen / 2) ctx.moveTo(ptX, ptY);
        else ctx.lineTo(ptX, ptY);
      }
      ctx.stroke();

      // Glowing central photon corpuscle
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawElectrons() {
    const ctx = this.ctx;
    ctx.save();

    for (const e of particles.electrons) {
      // Draw motion trails
      if (e.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(e.trail[0].x, e.trail[0].y);
        for (let i = 1; i < e.trail.length; i++) {
          ctx.lineTo(e.trail[i].x, e.trail[i].y);
        }
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      // Draw Electron Particle (Glowing Cyan Sphere with negative '-' label)
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fill();

      // Core white spot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawSparks() {
    const ctx = this.ctx;
    ctx.save();
    for (const s of particles.sparks) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = Math.max(0, s.life);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (1 - s.life * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawExternalCircuit() {
    const ctx = this.ctx;
    const c = this.cathode;
    const a = this.anode;
    const wireY = this.circuitY;

    ctx.save();

    // Circuit Connecting Wires
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // From Cathode down to circuit bus
    ctx.moveTo(c.x + c.w / 2, c.y + c.h);
    ctx.lineTo(c.x + c.w / 2, wireY);

    // Left lower circuit to battery & voltmeter
    ctx.lineTo(430, wireY);

    // Gap for Voltmeter / Battery apparatus
    ctx.moveTo(550, wireY);
    ctx.lineTo(a.x + a.w / 2, wireY);

    // Up to Anode
    ctx.lineTo(a.x + a.w / 2, a.y + a.h);
    ctx.stroke();

    // Draw Microammeter Meter on Right Wire Branch
    const ammeterX = a.x + a.w / 2;
    const ammeterY = (a.y + a.h + wireY) / 2;

    ctx.fillStyle = '#0b162c';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ammeterX, ammeterY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 12px "Fira Code", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('µA', ammeterX, ammeterY);

    // Draw Battery / Variable DC Supply on Lower Bus
    const dcX = 490;
    const dcY = wireY;

    ctx.fillStyle = '#0b162c';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(dcX - 45, dcY - 18, 90, 36, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 10px Outfit, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('DC SUPPLY', dcX, dcY - 5);

    ctx.font = '700 11px "Fira Code", monospace';
    const vVal = simState.collectorVoltage_V;
    ctx.fillStyle = vVal < 0 ? '#f43f5e' : (vVal > 0 ? '#10b981' : '#94a3b8');
    ctx.fillText(`${vVal >= 0 ? '+' : ''}${vVal.toFixed(2)} V`, dcX, dcY + 9);

    // Moving Charge Carrier Dots in Wire
    if (simState.photocurrent_uA > 0) {
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 6;

      // Closed loop circuit length parameterization
      for (const wp of this.wireParticles) {
        const pt = this.getCircuitCoordinate(wp.progress);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  getCircuitCoordinate(progress) {
    // 4 segments: down cathode (0-0.25), right across bottom (0.25-0.75), up anode (0.75-1.0)
    const cX = this.cathode.x + this.cathode.w / 2;
    const aX = this.anode.x + this.anode.w / 2;
    const topY = this.cathode.y + this.cathode.h;
    const btmY = this.circuitY;

    if (progress < 0.25) {
      const p = progress / 0.25;
      return { x: cX, y: topY + (btmY - topY) * p };
    } else if (progress < 0.75) {
      const p = (progress - 0.25) / 0.50;
      return { x: cX + (aX - cX) * p, y: btmY };
    } else {
      const p = (progress - 0.75) / 0.25;
      return { x: aX, y: btmY - (btmY - topY) * p };
    }
  }

  animate(currentTime) {
    const dt = Math.min(50, currentTime - this.lastFrameTime);
    this.lastFrameTime = currentTime;

    this.updateParticles(dt);
    this.drawApparatus();

    requestAnimationFrame(this.animate);
  }
}

/* ==========================================================================
   INTERACTIVE ENERGY LEVEL SIMULATOR CANVAS (Einstein Section)
   ========================================================================== */
class EnergyLevelDiagramRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.draw = this.draw.bind(this);
    this.draw();
  }

  draw() {
    if (!this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const groundY = 220;
    const vacuumY = 110;
    const hf_eV = simState.photonEnergy_eV;
    const phi_eV = simState.workFunction_eV;
    const kmax_eV = simState.maxKineticEnergy_eV;

    // Metal Lattice Potential Well Box
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(40, vacuumY, 180, groundY - vacuumY + 30, [0, 8, 8, 0]);
    ctx.fill();
    ctx.stroke();

    // Conduction Band / Fermi Sea shading
    const fermiGrad = ctx.createLinearGradient(40, groundY, 40, vacuumY);
    fermiGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    fermiGrad.addColorStop(1, 'rgba(2, 132, 199, 0.15)');
    ctx.fillStyle = fermiGrad;
    ctx.fillRect(40, vacuumY, 180, groundY - vacuumY);

    // Fermi Level Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, vacuumY);
    ctx.lineTo(220, vacuumY);
    ctx.stroke();

    ctx.font = '600 11px Outfit, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Fermi Level (EF)', 50, vacuumY - 8);

    // Free Vacuum Level (E = 0)
    const vacLevelY = vacuumY - (phi_eV * 22);
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(40, vacLevelY);
    ctx.lineTo(420, vacLevelY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Vacuum Level (E = 0)`, 240, vacLevelY - 6);

    // Work Function Arrow (Phi)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    this.drawArrow(ctx, 160, vacuumY, 160, vacLevelY);
    ctx.fillText(`Φ = ${phi_eV.toFixed(2)} eV`, 168, (vacuumY + vacLevelY) / 2 + 4);

    // Incident Photon Energy Arrow (hf)
    const colorObj = wavelengthToRGB(simState.wavelength_nm);
    const photonTopY = vacuumY - (hf_eV * 22);
    ctx.strokeStyle = colorObj.rgbStr;
    ctx.fillStyle = colorObj.rgbStr;
    ctx.lineWidth = 2.5;
    this.drawArrow(ctx, 100, vacuumY, 100, photonTopY);
    ctx.fillText(`E = hf (${hf_eV.toFixed(2)} eV)`, 108, (vacuumY + photonTopY) / 2);

    // Excess Kinetic Energy Bracket (Kmax)
    if (kmax_eV > 0) {
      ctx.strokeStyle = '#10b981';
      ctx.fillStyle = '#10b981';
      ctx.lineWidth = 2.5;
      this.drawArrow(ctx, 320, vacLevelY, 320, photonTopY);
      ctx.fillText(`Kmax = ${kmax_eV.toFixed(2)} eV`, 330, (vacLevelY + photonTopY) / 2 + 4);
    } else {
      ctx.font = '600 11px Outfit, sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('No Escape (hf < Φ)', 280, vacLevelY + 24);
    }
  }

  drawArrow(ctx, fromX, fromY, toX, toY) {
    const headLen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}

/* ==========================================================================
   LIVE READOUT AND TELEMETRY UI BINDINGS
   ========================================================================== */
function updateSimulationUI() {
  const f_1e14 = simState.frequency_1e14;
  const f_Hz = simState.frequency_Hz;
  const phi = simState.workFunction_eV;
  const hf = simState.photonEnergy_eV;
  const f0_1e14 = simState.thresholdFreq_1e14;
  const wl_nm = simState.wavelength_nm;
  const kmax = simState.maxKineticEnergy_eV;
  const vs = simState.stoppingPotential_V;
  const current_uA = simState.photocurrent_uA;
  const isEmitting = simState.isEmitting;

  // 1. Digital Meters
  const dispPhotocurrent = document.getElementById('disp-photocurrent');
  const dispCurrentPercent = document.getElementById('disp-current-percent');
  const dispTubeVoltage = document.getElementById('disp-tube-voltage');
  const dispVoltageMode = document.getElementById('disp-voltage-mode');
  const dispStoppingPot = document.getElementById('disp-stopping-pot');
  const dispKmaxVal = document.getElementById('disp-kmax-val');
  const dispKmaxJoules = document.getElementById('disp-kmax-joules');

  if (dispPhotocurrent) dispPhotocurrent.textContent = current_uA.toFixed(1);
  if (dispCurrentPercent) dispCurrentPercent.textContent = `Current: ${((current_uA / 72) * 100).toFixed(0)}%`;
  if (dispTubeVoltage) dispTubeVoltage.textContent = (simState.collectorVoltage_V >= 0 ? '+' : '') + simState.collectorVoltage_V.toFixed(2);
  
  if (dispVoltageMode) {
    if (simState.collectorVoltage_V < 0) {
      dispVoltageMode.textContent = simState.collectorVoltage_V <= -vs ? 'Cut-off (V ≤ −Vs)' : 'Retarding Potential';
    } else if (simState.collectorVoltage_V > 0) {
      dispVoltageMode.textContent = 'Accelerating Potential';
    } else {
      dispVoltageMode.textContent = 'Neutral (0 V)';
    }
  }

  if (dispStoppingPot) dispStoppingPot.textContent = vs.toFixed(2);
  if (dispKmaxVal) dispKmaxVal.textContent = kmax.toFixed(2);
  if (dispKmaxJoules) dispKmaxJoules.textContent = `${(simState.maxKineticEnergy_J * 1e19).toFixed(2)} × 10⁻¹⁹ J`;

  // 2. Telemetry Strip Elements
  const roPhotonEnergy = document.getElementById('ro-photon-energy');
  const roPhotonJoules = document.getElementById('ro-photon-joules');
  const roWorkFunction = document.getElementById('ro-work-function');
  const roMetalName = document.getElementById('ro-metal-name');
  const roThresholdFreq = document.getElementById('ro-threshold-freq');
  const roThresholdWl = document.getElementById('ro-threshold-wl');
  const roWavelength = document.getElementById('ro-wavelength');
  const roSpectralBand = document.getElementById('ro-spectral-band');
  const roKmax = document.getElementById('ro-kmax');
  const roElectronVelocity = document.getElementById('ro-electron-velocity');
  const roStoppingPot = document.getElementById('ro-stopping-pot');
  const roPhotocurrent = document.getElementById('ro-photocurrent');
  const roEmissionState = document.getElementById('ro-emission-state');
  const roEmissionCondition = document.getElementById('ro-emission-condition');

  if (roPhotonEnergy) roPhotonEnergy.textContent = `${hf.toFixed(2)} eV`;
  if (roPhotonJoules) roPhotonJoules.textContent = `${(simState.photonEnergy_J * 1e19).toFixed(2)} × 10⁻¹⁹ J`;
  if (roWorkFunction) roWorkFunction.textContent = `${phi.toFixed(2)} eV`;
  if (roMetalName) roMetalName.textContent = METALS[simState.currentMetalKey]?.name || 'Target Metal';
  if (roThresholdFreq) roThresholdFreq.textContent = `${f0_1e14.toFixed(2)} × 10¹⁴ Hz`;
  if (roThresholdWl) roThresholdWl.textContent = `λ₀ = ${Math.round(simState.thresholdWavelength_nm)} nm`;
  if (roWavelength) roWavelength.textContent = `${Math.round(wl_nm)} nm`;
  if (roSpectralBand) roSpectralBand.textContent = getSpectralBandName(wl_nm);
  if (roKmax) roKmax.textContent = `${kmax.toFixed(2)} eV`;
  if (roElectronVelocity) roElectronVelocity.textContent = `vmax = ${(simState.maxVelocity_ms / 1e5).toFixed(2)} × 10⁵ m/s`;
  if (roStoppingPot) roStoppingPot.textContent = `${vs.toFixed(2)} V`;
  if (roPhotocurrent) roPhotocurrent.textContent = `${current_uA.toFixed(1)} µA`;

  // Status Badge & Banner
  const subthresholdBanner = document.getElementById('subthreshold-banner');
  const emissionStatusDot = document.getElementById('emission-status-dot');
  const emissionStatusLabel = document.getElementById('emission-status-label');

  if (isEmitting) {
    if (roEmissionState) {
      roEmissionState.textContent = '✓ Emission Occurring';
      roEmissionState.className = 'metric-badge status-active';
    }
    if (roEmissionCondition) roEmissionCondition.textContent = 'hf ≥ Φ (Quantum Liberated)';
    if (subthresholdBanner) subthresholdBanner.classList.add('hidden');
    if (emissionStatusDot) emissionStatusDot.classList.remove('subthreshold');
    if (emissionStatusLabel) emissionStatusLabel.textContent = 'Photoemission Occurring';
  } else {
    if (roEmissionState) {
      roEmissionState.textContent = '✕ No Emission';
      roEmissionState.className = 'metric-badge status-stopped';
    }
    if (roEmissionCondition) roEmissionCondition.textContent = 'hf < Φ (Insufficient Energy)';
    if (subthresholdBanner) subthresholdBanner.classList.remove('hidden');
    if (emissionStatusDot) emissionStatusDot.classList.add('subthreshold');
    if (emissionStatusLabel) emissionStatusLabel.textContent = 'No Photoemission (f < f₀)';
  }

  // 3. Sliders Values Text
  const sliderFreqVal = document.getElementById('slider-freq-val');
  const spectralColorBadge = document.getElementById('spectral-color-badge');
  const sliderIntensityVal = document.getElementById('slider-intensity-val');
  const sliderPhiVal = document.getElementById('slider-phi-val');
  const dispCalcF0 = document.getElementById('disp-calc-f0');
  const sliderVoltageVal = document.getElementById('slider-voltage-val');

  if (sliderFreqVal) sliderFreqVal.textContent = `${f_1e14.toFixed(2)} × 10¹⁴ Hz`;
  if (spectralColorBadge) {
    spectralColorBadge.textContent = `${getSpectralBandName(wl_nm)} (${Math.round(wl_nm)} nm)`;
    const colorObj = wavelengthToRGB(wl_nm);
    spectralColorBadge.style.color = colorObj.rgbStr;
    spectralColorBadge.style.backgroundColor = colorObj.rgbaStr(0.12);
  }
  if (sliderIntensityVal) sliderIntensityVal.textContent = `${simState.intensity_pct}%`;
  if (sliderPhiVal) sliderPhiVal.textContent = `${phi.toFixed(2)} eV`;
  if (dispCalcF0) dispCalcF0.textContent = `${f0_1e14.toFixed(2)} × 10¹⁴ Hz`;
  if (sliderVoltageVal) sliderVoltageVal.textContent = (simState.collectorVoltage_V >= 0 ? '+' : '') + simState.collectorVoltage_V.toFixed(2) + ' V';

  // 4. Update Einstein Demonstration Card
  const demoPhotonE = document.getElementById('demo-photon-e');
  const demoWorkFunc = document.getElementById('demo-work-func');
  const demoKmax = document.getElementById('demo-kmax');
  const demoVs = document.getElementById('demo-vs');
  const calcInsightText = document.getElementById('calc-insight-text');

  if (demoPhotonE) demoPhotonE.textContent = `${hf.toFixed(2)} eV`;
  if (demoWorkFunc) demoWorkFunc.textContent = `${phi.toFixed(2)} eV (${METALS[simState.currentMetalKey]?.name || 'Metal'})`;
  if (demoKmax) demoKmax.textContent = `${kmax.toFixed(2)} eV`;
  if (demoVs) demoVs.textContent = `${vs.toFixed(2)} V`;
  if (calcInsightText) {
    if (isEmitting) {
      calcInsightText.textContent = `Photon energy (${hf.toFixed(2)} eV) exceeds work function (${phi.toFixed(2)} eV). Photoelectron escapes with ${kmax.toFixed(2)} eV maximum kinetic energy!`;
    } else {
      calcInsightText.textContent = `Photon energy (${hf.toFixed(2)} eV) is LESS than work function (${phi.toFixed(2)} eV). No photoelectron can escape regardless of light beam intensity.`;
    }
  }

  // 5. Redraw Energy Level Diagram
  if (window.energyDiagram) {
    window.energyDiagram.draw();
  }

  // 6. Update Active Graphs
  if (window.scientificGraphs) {
    window.scientificGraphs.renderActiveGraph();
  }

  // 7. Update Challenge Mode Checker if active
  if (window.challengeEngine) {
    window.challengeEngine.updateLiveStatus();
  }
}

// Global Exports
window.simState = simState;
window.CONSTANTS = CONSTANTS;
window.METALS = METALS;
window.updateSimulationUI = updateSimulationUI;
window.wavelengthToRGB = wavelengthToRGB;
window.getSpectralBandName = getSpectralBandName;
window.playLabBeep = playLabBeep;

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  window.apparatus = new ApparatusRenderer('photoelectric-canvas');
  window.energyDiagram = new EnergyLevelDiagramRenderer('energy-level-canvas');
  updateSimulationUI();
});
