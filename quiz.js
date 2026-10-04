/**
 * VIVA VOCE QUIZ ENGINE
 * 10 Comprehensive B.Tech 1st-Year University Physics Viva Questions
 * Instant feedback, detailed physical rationales, score tracking & review mode
 */

const VIVA_QUESTIONS = [
  {
    id: 1,
    question: "What physical quantity strictly determines whether photoelectric emission occurs from a given metal surface?",
    options: [
      "The intensity (brightness) of the incident radiation",
      "The frequency (or wavelength) of the incident radiation",
      "The duration of illumination (exposure time)",
      "The angle of incidence of the radiation beam"
    ],
    correctIndex: 1,
    explanation: "Photoelectric emission is an all-or-nothing quantum threshold effect governed solely by photon energy E = hf. Emission occurs only if f ≥ f₀ (threshold frequency), irrespective of intensity or exposure time."
  },
  {
    id: 2,
    question: "What is the physical definition of the threshold frequency (f₀)?",
    options: [
      "The maximum frequency of radiation that can be reflected by a metal",
      "The minimum frequency of incident radiation below which no photoelectrons are emitted",
      "The frequency at which the photocurrent reaches its maximum saturation value",
      "The frequency of electron orbital revolution inside conduction bands"
    ],
    correctIndex: 1,
    explanation: "Threshold frequency f₀ = Φ / h is the minimum frequency of radiation required to liberate an electron from the metal lattice with zero remaining kinetic energy."
  },
  {
    id: 3,
    question: "When the radiation frequency is held constant ABOVE threshold (f > f₀), what happens if the light intensity is doubled?",
    options: [
      "The maximum kinetic energy and stopping potential both double",
      "The threshold frequency decreases by half",
      "The saturation photocurrent doubles, while maximum kinetic energy remains completely unchanged",
      "The speed of emitted photoelectrons doubles"
    ],
    correctIndex: 2,
    explanation: "Light intensity represents the number of photons arriving per unit area per second. Doubling intensity doubles the number of ejected electrons per second (doubling photocurrent), but each individual photon still possesses the identical energy E = hf."
  },
  {
    id: 4,
    question: "Does increasing incident light intensity increase the maximum kinetic energy (Kmax) of emitted photoelectrons?",
    options: [
      "Yes, because higher intensity waves impart a stronger oscillating electric field",
      "Yes, but only for alkali metals with low work functions",
      "No, Kmax depends strictly on radiation frequency (f) and metal work function (Φ), completely independent of intensity",
      "No, increasing intensity actually slows electrons down due to space charge"
    ],
    correctIndex: 2,
    explanation: "According to Einstein's law Kmax = hf − Φ, kinetic energy depends strictly on the energy of single photons (hf). Intensity has no influence on Kmax, directly contradicting classical wave theory."
  },
  {
    id: 5,
    question: "What is meant by the work function (Φ) of a metal?",
    options: [
      "The total electrostatic binding energy of all valence electrons in the metal",
      "The minimum energy required to eject an electron from the surface of the metal into vacuum",
      "The electrical work done by the battery per second in the external circuit",
      "The kinetic energy acquired by an electron falling through one volt"
    ],
    correctIndex: 1,
    explanation: "The work function Φ is the minimum energy required to extract an electron from the Fermi level of the metal lattice to infinity with zero velocity (Φ = h f₀)."
  },
  {
    id: 6,
    question: "What is stopping potential (Vs), and how is it related to maximum kinetic energy (Kmax)?",
    options: [
      "The accelerating voltage at which photocurrent reaches saturation; eVs = 2 Kmax",
      "The retarding voltage that reduces photocurrent to zero; eVs = Kmax",
      "The breakdown voltage of the quartz vacuum phototube envelope",
      "The work done per unit charge by the incident light beam"
    ],
    correctIndex: 1,
    explanation: "Stopping potential Vs is the minimum negative collector voltage that brings even the fastest emitted photoelectron to a halt, such that electrical work done equals kinetic energy: e Vs = Kmax."
  },
  {
    id: 7,
    question: "What happens if high-intensity radiation of frequency BELOW threshold (f < f₀) illuminates a metal surface for several hours?",
    options: [
      "Electrons will eventually accumulate enough wave energy and be emitted after a time lag",
      "The work function of the metal will gradually decrease until emission occurs",
      "Zero photoelectric emission will occur, no matter how intense the beam or how long the exposure",
      "Electrons will emit, but with very low kinetic energy"
    ],
    correctIndex: 2,
    explanation: "In quantum theory, energy transfer is a discrete one-to-one collision. If an individual photon has hf < Φ, it cannot liberate an electron. High intensity merely sends more deficient photons, none of which can cause emission."
  },
  {
    id: 8,
    question: "Which of the following is Einstein's photoelectric equation?",
    options: [
      "E = mc²",
      "hf = Φ + Kmax  ⟹  Kmax = hf − Φ",
      "λ = h / p",
      "Vs = hf + Φ"
    ],
    correctIndex: 1,
    explanation: "Einstein applied energy conservation: Energy of incident photon (hf) = energy needed to escape (Φ) + maximum kinetic energy of liberated electron (Kmax)."
  },
  {
    id: 9,
    question: "In the experimental plot of stopping potential (Vs) versus frequency (f), what does the slope of the straight line represent?",
    options: [
      "The work function of the metal (Φ)",
      "The universal ratio of Planck's constant to elementary charge (h / e)",
      "The threshold frequency (f₀)",
      "The velocity of light in vacuum (c)"
    ],
    correctIndex: 1,
    explanation: "From eVs = hf − Φ, rearranging into y = mx + c gives: Vs = (h/e)f − (Φ/e). The slope m is universally equal to h/e for every target metal!"
  },
  {
    id: 10,
    question: "Why can a faint ultraviolet lamp eject electrons from zinc (Φ = 4.31 eV), whereas a blindingly bright red laser fails completely?",
    options: [
      "Red light is reflected by all metals, while UV light is totally absorbed",
      "A red laser produces continuous waves, whereas UV lamps only emit particles",
      "Each UV photon has frequency above threshold (hf > 4.31 eV), whereas individual red photons have energy (~1.8 eV) far below zinc's work function",
      "Zinc metal atoms are destroyed by ultraviolet radiation"
    ],
    correctIndex: 2,
    explanation: "UV light has very high frequency (f ~ 10¹⁵ Hz), so each photon carries > 4.31 eV, sufficient to liberate electrons. Red light photons only carry ~1.8 eV. Since emission depends on single-photon energy, even trillions of red photons cannot eject an electron."
  }
];

class VivaQuizEngine {
  constructor() {
    this.currentIndex = 0;
    this.userAnswers = new Array(VIVA_QUESTIONS.length).fill(null);
    this.score = 0;
    this.isSubmitted = new Array(VIVA_QUESTIONS.length).fill(false);

    this.initDOM();
  }

  initDOM() {
    this.questionCard = document.getElementById('quiz-question-card');
    this.resultsCard = document.getElementById('quiz-results-card');
    this.counterEl = document.getElementById('quiz-question-counter');
    this.scoreEl = document.getElementById('live-quiz-score');
    this.titleEl = document.getElementById('quiz-question-title');
    this.optionsList = document.getElementById('quiz-options-list');
    this.feedbackBox = document.getElementById('quiz-feedback-box');
    this.feedbackStatus = document.getElementById('quiz-feedback-status');
    this.feedbackText = document.getElementById('quiz-feedback-text');
    this.prevBtn = document.getElementById('btn-quiz-prev');
    this.nextBtn = document.getElementById('btn-quiz-next');
    this.retakeBtn = document.getElementById('btn-retake-quiz');

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.goToPreviousQuestion());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.handleNextOrSubmit());
    }
    if (this.retakeBtn) {
      this.retakeBtn.addEventListener('click', () => this.restartQuiz());
    }

    this.renderCurrentQuestion();
  }

  renderCurrentQuestion() {
    const q = VIVA_QUESTIONS[this.currentIndex];
    if (!q) return;

    // Update Counter & Score
    if (this.counterEl) {
      this.counterEl.textContent = `Question ${this.currentIndex + 1} of ${VIVA_QUESTIONS.length}`;
    }
    if (this.scoreEl) {
      this.scoreEl.textContent = this.score;
    }

    // Set Question Text
    if (this.titleEl) {
      this.titleEl.textContent = `${q.id}. ${q.question}`;
    }

    // Render Options
    if (this.optionsList) {
      this.optionsList.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];

      q.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option-btn';
        btn.setAttribute('data-index', idx);

        const prefix = document.createElement('span');
        prefix.className = 'option-prefix';
        prefix.textContent = letters[idx];

        const text = document.createElement('span');
        text.className = 'option-text';
        text.textContent = optText;

        btn.appendChild(prefix);
        btn.appendChild(text);

        // Check if previously selected / submitted
        if (this.userAnswers[this.currentIndex] === idx) {
          btn.classList.add('selected');
        }

        if (this.isSubmitted[this.currentIndex]) {
          btn.disabled = true;
          if (idx === q.correctIndex) {
            btn.classList.add('correct');
          } else if (this.userAnswers[this.currentIndex] === idx) {
            btn.classList.add('incorrect');
          }
        } else {
          btn.addEventListener('click', () => this.selectOption(idx));
        }

        this.optionsList.appendChild(btn);
      });
    }

    // Feedback Box
    if (this.isSubmitted[this.currentIndex]) {
      this.showFeedback(this.userAnswers[this.currentIndex] === q.correctIndex, q.explanation);
      if (this.nextBtn) {
        this.nextBtn.textContent = this.currentIndex === VIVA_QUESTIONS.length - 1 ? 'View Final Results →' : 'Next Question →';
      }
    } else {
      if (this.feedbackBox) this.feedbackBox.classList.add('hidden');
      if (this.nextBtn) {
        this.nextBtn.textContent = 'Submit Answer';
        this.nextBtn.disabled = this.userAnswers[this.currentIndex] === null;
      }
    }

    // Previous Button state
    if (this.prevBtn) {
      this.prevBtn.disabled = this.currentIndex === 0;
    }
  }

  selectOption(idx) {
    if (this.isSubmitted[this.currentIndex]) return;
    this.userAnswers[this.currentIndex] = idx;

    const btns = this.optionsList.querySelectorAll('.quiz-option-btn');
    btns.forEach((b, i) => {
      b.classList.toggle('selected', i === idx);
    });

    if (this.nextBtn) {
      this.nextBtn.disabled = false;
    }

    if (window.playLabBeep) {
      window.playLabBeep(520, 0.03, 'sine', 0.02);
    }
  }

  handleNextOrSubmit() {
    const q = VIVA_QUESTIONS[this.currentIndex];

    // If not submitted yet, submit current answer
    if (!this.isSubmitted[this.currentIndex]) {
      const selected = this.userAnswers[this.currentIndex];
      if (selected === null) return;

      this.isSubmitted[this.currentIndex] = true;
      const isCorrect = (selected === q.correctIndex);
      if (isCorrect) {
        this.score++;
        if (window.playLabBeep) window.playLabBeep(880, 0.08, 'triangle', 0.05);
      } else {
        if (window.playLabBeep) window.playLabBeep(260, 0.12, 'sawtooth', 0.04);
      }

      this.renderCurrentQuestion();
      return;
    }

    // If already submitted, move to next question or show results
    if (this.currentIndex < VIVA_QUESTIONS.length - 1) {
      this.currentIndex++;
      this.renderCurrentQuestion();
    } else {
      this.showFinalResults();
    }
  }

  goToPreviousQuestion() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.renderCurrentQuestion();
    }
  }

  showFeedback(isCorrect, explanation) {
    if (!this.feedbackBox) return;
    this.feedbackBox.classList.remove('hidden');

    if (isCorrect) {
      this.feedbackStatus.innerHTML = '<span class="text-emerald">✓ CORRECT ANSWER</span>';
    } else {
      this.feedbackStatus.innerHTML = '<span class="text-rose">✕ INCORRECT</span>';
    }

    this.feedbackText.textContent = explanation;
  }

  showFinalResults() {
    if (this.questionCard) this.questionCard.classList.add('hidden');
    if (this.resultsCard) this.resultsCard.classList.remove('hidden');

    const total = VIVA_QUESTIONS.length;
    const correct = this.score;
    const incorrect = total - correct;
    const pct = Math.round((correct / total) * 100);

    const verdictEl = document.getElementById('results-verdict');
    const summaryEl = document.getElementById('results-summary-text');
    const badgeEl = document.getElementById('results-badge');
    const correctEl = document.getElementById('res-correct-count');
    const incorrectEl = document.getElementById('res-incorrect-count');
    const pctEl = document.getElementById('res-percentage');

    if (correctEl) correctEl.textContent = correct;
    if (incorrectEl) incorrectEl.textContent = incorrect;
    if (pctEl) pctEl.textContent = `${pct}%`;

    if (summaryEl) {
      summaryEl.textContent = `You scored ${correct} out of ${total} (${pct}%).`;
    }

    if (pct >= 90) {
      if (verdictEl) verdictEl.textContent = 'Distinction! Master of Quantum Physics';
      if (badgeEl) badgeEl.textContent = '🏆';
    } else if (pct >= 70) {
      if (verdictEl) verdictEl.textContent = 'Excellent Viva Performance (First Class)';
      if (badgeEl) badgeEl.textContent = '🎓';
    } else if (pct >= 50) {
      if (verdictEl) verdictEl.textContent = 'Good Understanding (Pass)';
      if (badgeEl) badgeEl.textContent = '📘';
    } else {
      if (verdictEl) verdictEl.textContent = 'Needs Revision of Core Concepts';
      if (badgeEl) badgeEl.textContent = '🔬';
    }
  }

  restartQuiz() {
    this.currentIndex = 0;
    this.userAnswers = new Array(VIVA_QUESTIONS.length).fill(null);
    this.isSubmitted = new Array(VIVA_QUESTIONS.length).fill(false);
    this.score = 0;

    if (this.resultsCard) this.resultsCard.classList.add('hidden');
    if (this.questionCard) this.questionCard.classList.remove('hidden');

    this.renderCurrentQuestion();
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.vivaQuiz = new VivaQuizEngine();
});
