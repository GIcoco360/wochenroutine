import { useState, useEffect, useCallback } from "react";

const COLORS = {
  primary: "#00838e",
  accent: "#69f0ae",
  warm: "#e9e562",
  black: "#1a1a1a",
  offwhite: "#f7f7f5",
  warmgray: "#e4e2dd",
  midgray: "#8a8a8a",
  lightgray: "#f0efec",
  darktext: "#2a2a2a",
  error: "#c0392b",
};

const FINGER_LABELS = [
  { finger: "Daumen", prompt: "Was war gut diese Woche? Worauf bist du stolz?", icon: "👍" },
  { finger: "Zeigefinger", prompt: "Was war wichtig? Worauf möchte ich hinweisen — mir selbst oder anderen?", icon: "👆" },
  { finger: "Mittelfinger", prompt: "Was hat mich geärgert oder gestört?", icon: "🖕" },
  { finger: "Ringfinger", prompt: "Welche Beziehung war mir diese Woche wichtig?", icon: "💍" },
  { finger: "Kleiner Finger", prompt: "Was kam zu kurz?", icon: "🤙" },
];

const PLAN_SCALE = [
  { value: 1, label: "Kaum umgesetzt" },
  { value: 2, label: "Teilweise" },
  { value: 3, label: "Größtenteils" },
  { value: 4, label: "Gut umgesetzt" },
  { value: 5, label: "Sehr gut" },
];

function getWeekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function getWeekLabel(weekKey) {
  const parts = weekKey.split("-W");
  return `KW ${parseInt(parts[1])} / ${parts[0]}`;
}

function getPreviousWeekKey(weekKey) {
  const parts = weekKey.split("-W");
  let year = parseInt(parts[0]);
  let week = parseInt(parts[1]);
  week--;
  if (week < 1) { year--; week = 52; }
  return `${year}-W${String(week).padStart(2, "0")}`;
}

const STORAGE_KEY = "wochenroutine";

export default function WochenRoutine() {
  const [currentWeek] = useState(getWeekKey());
  const [step, setStep] = useState(-1); // -1=welcome, 0=start, 1=finger, 2=plancheck, 3=planung3.1, 4=planung3.2, 5=done
  const [activeFinger, setActiveFinger] = useState(0);
  const [weekData, setWeekData] = useState(null);
  const [allWeeks, setAllWeeks] = useState({});
  const [previousWeek, setPreviousWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(false);

  // Load data
  useEffect(() => {
    async function load() {
      let hasData = false;
      try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
          const parsed = JSON.parse(result.value);
          setAllWeeks(parsed);
          hasData = Object.keys(parsed).length > 0;
          if (parsed[currentWeek]) {
            setWeekData(parsed[currentWeek]);
          }
          const prevKey = getPreviousWeekKey(currentWeek);
          if (parsed[prevKey]) {
            setPreviousWeek(parsed[prevKey]);
          }
        }
      } catch (e) {
        console.log("No existing data");
      }
      if (hasData) {
        setWelcomeSeen(true);
        setStep(0);
      }
      setLoading(false);
    }
    load();
  }, [currentWeek]);

  // Timer
  useEffect(() => {
    if (!timerStart) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - timerStart) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerStart]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // Save
  const saveData = useCallback(async (data) => {
    const updated = { ...allWeeks, [currentWeek]: data };
    setAllWeeks(updated);
    setWeekData(data);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Save failed:", e);
    }
  }, [allWeeks, currentWeek]);

  const initWeekData = () => ({
    weekKey: currentWeek,
    createdAt: new Date().toISOString(),
    fingers: ["", "", "", "", ""],
    planCheckScore: null,
    planCheckReason: "",
    planCheckTakeaway: "",
    weekGoals: ["", "", ""],
    weekIntention: "",
    weekAttention: "",
    completed: false,
  });

  const startRoutine = () => {
    const data = weekData || initWeekData();
    setWeekData(data);
    setStep(1);
    setTimerStart(Date.now());
  };

  const updateField = (field, value) => {
    const updated = { ...weekData, [field]: value };
    setWeekData(updated);
  };

  const updateFinger = (index, value) => {
    const fingers = [...weekData.fingers];
    fingers[index] = value;
    updateField("fingers", fingers);
  };

  const updateGoal = (index, value) => {
    const goals = [...weekData.weekGoals];
    goals[index] = value;
    updateField("weekGoals", goals);
  };

  const nextStep = async () => {
    await saveData(weekData);
    setStep(step + 1);
  };

  const finishRoutine = async () => {
    const final = { ...weekData, completed: true, completedAt: new Date().toISOString(), durationSeconds: elapsed };
    await saveData(final);
    setStep(5);
  };

  const getCompletedWeeks = () => {
    return Object.entries(allWeeks)
      .filter(([, d]) => d.completed)
      .sort(([a], [b]) => b.localeCompare(a));
  };

  const weekNumber = getCompletedWeeks().length + (weekData?.completed ? 0 : step > 0 ? 1 : 0);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "80px 24px" }}>
          <p style={{ color: COLORS.midgray }}>Lädt...</p>
        </div>
      </div>
    );
  }

  // WELCOME SCREEN (first-time users only)
  if (step === -1) {
    return (
      <div style={{
        ...styles.container,
        alignItems: "center",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "440px",
          textAlign: "center",
        }}>

          <img
            src="/logo.png"
            alt="3×3 Business Coaching"
            style={{
              width: "260px",
              height: "auto",
              display: "block",
              margin: "0 auto 48px",
            }}
          />

          <h1 style={{
            fontSize: "28px",
            fontWeight: "400",
            color: COLORS.black,
            margin: "0",
            lineHeight: "1.25",
            letterSpacing: "-0.3px",
          }}>3×3 Wochenroutine</h1>

          <p style={{
            fontSize: "16px",
            color: COLORS.midgray,
            lineHeight: "1.6",
            margin: "20px 0 0",
            whiteSpace: "pre-line",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}>
            {"30 Minuten pro Woche.\nAnkommen. Zurückschauen. Vorausplanen."}
          </p>

          <div style={{
            width: "32px",
            height: "1.5px",
            backgroundColor: COLORS.warmgray,
            margin: "40px auto",
          }} />

          <p style={{
            fontSize: "14px",
            color: COLORS.midgray,
            lineHeight: "1.7",
            margin: "0 auto",
            maxWidth: "340px",
            fontStyle: "italic",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}>
            Du nutzt deine eigenen Tools für Kalender und Aufgaben. Diese App führt dich durch den Prozess.
          </p>

          <button onClick={() => { setWelcomeSeen(true); setStep(0); }} style={{
            ...styles.primaryBtn,
            marginTop: "48px",
            maxWidth: "280px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Starten
          </button>

        </div>
      </div>
    );
  }

  // START SCREEN
  if (step === 0) {
    const alreadyDone = weekData?.completed;
    const completedCount = getCompletedWeeks().length;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.topBar}>
            <span style={styles.weekLabel}>{getWeekLabel(currentWeek)}</span>
            {completedCount > 0 && (
              <button onClick={() => setHistoryOpen(!historyOpen)} style={styles.historyBtn}>
                {historyOpen ? "Schließen" : `Verlauf (${completedCount})`}
              </button>
            )}
          </div>

          {historyOpen ? (
            <HistoryView weeks={allWeeks} onClose={() => setHistoryOpen(false)} />
          ) : (
            <>
              <div style={styles.heroSection}>
                <h1 style={styles.heroTitle}>3×3 Wochenroutine</h1>
                <p style={styles.heroSub}>
                  30 Minuten für deine Woche.{"\n"}Ankommen. Zurückschauen. Vorausplanen.
                </p>
              </div>

              <div style={styles.stepsPreview}>
                <StepPreview num="1" title="5-Finger-Reflexion" time="~7 Min" desc="Wie war meine Woche?" />
                <StepPreview num="2" title="Plan-Check" time="~5 Min" desc="Was habe ich umgesetzt?" />
                <StepPreview num="3" title="Wochenplanung" time="~15 Min" desc="Was nehme ich mir vor?" />
              </div>

              {alreadyDone ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ ...styles.badge, backgroundColor: COLORS.accent, color: COLORS.black }}>
                    ✓ Diese Woche abgeschlossen
                  </div>
                  <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
                    <button onClick={() => {
                      setStep(1);
                      setTimerStart(Date.now());
                    }} style={styles.secondaryBtn}>
                      Nochmal anschauen
                    </button>
                    <button onClick={() => {
                      const fresh = initWeekData();
                      setWeekData(fresh);
                      setStep(1);
                      setTimerStart(Date.now());
                      setElapsed(0);
                    }} style={styles.secondaryBtn}>
                      Neu starten
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={startRoutine} style={styles.primaryBtn}>
                  {weekData ? "Fortsetzen" : "Routine starten"}
                </button>
              )}

              {completedCount >= 3 && !historyOpen && (
                <div style={styles.impulse}>
                  <p style={styles.impulseText}>
                    {completedCount >= 8
                      ? "Zwei Monate regelmäßige Praxis. Die Forschung zeigt: Ab hier wird die Routine zur Gewohnheit."
                      : completedCount >= 4
                      ? "Schau dir deine Rückblicke der letzten Wochen an. Erkennst du ein Muster?"
                      : "Die Forschung zeigt, dass sich Planungsqualität meist erst nach vier bis sechs Wochen stabilisiert. Du bist auf dem Weg."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // STEP 1: 5-FINGER-REFLEXION
  if (step === 1) {
    const current = FINGER_LABELS[activeFinger];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader
            step={1}
            title="5-Finger-Reflexion"
            timeHint="~7 Minuten"
            elapsed={elapsed}
            formatTime={formatTime}
          />

          <p style={styles.stepIntro}>
            Schau auf deine vergangene Woche. Nicht auf den Plan — auf dein Erleben.
          </p>

          {/* Finger tabs */}
          <div style={styles.fingerTabs}>
            {FINGER_LABELS.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveFinger(i)}
                style={{
                  ...styles.fingerTab,
                  backgroundColor: activeFinger === i ? COLORS.primary : "transparent",
                  color: activeFinger === i ? "#fff" : COLORS.midgray,
                  borderColor: activeFinger === i ? COLORS.primary : COLORS.warmgray,
                }}
              >
                <span style={{ fontSize: "18px" }}>{f.icon}</span>
              </button>
            ))}
          </div>

          <div style={styles.fingerContent} key={activeFinger}>
            <h3 style={styles.fingerTitle}>{current.finger}</h3>
            <p style={styles.fingerPrompt}>{current.prompt}</p>
            <textarea
              value={weekData.fingers[activeFinger]}
              onChange={(e) => updateFinger(activeFinger, e.target.value)}
              placeholder="Ein paar Worte oder Stichpunkte..."
              style={styles.textarea}
              rows={3}
            />
          </div>

          <div style={styles.fingerNav}>
            {activeFinger > 0 && (
              <button onClick={() => setActiveFinger(activeFinger - 1)} style={styles.secondaryBtn}>
                Zurück
              </button>
            )}
            <div style={{ flex: 1 }} />
            {activeFinger < 4 ? (
              <button onClick={() => setActiveFinger(activeFinger + 1)} style={styles.primaryBtnSmall}>
                Weiter
              </button>
            ) : (
              <button onClick={nextStep} style={styles.primaryBtnSmall}>
                Zum Plan-Check →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: PLAN-CHECK
  if (step === 2) {
    const hasPrevious = previousWeek?.completed;

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader
            step={2}
            title="Plan-Check"
            timeHint="~5 Minuten"
            elapsed={elapsed}
            formatTime={formatTime}
          />

          <p style={styles.stepIntro}>
            Öffne deinen Kalender / Wochenplan und deine ToDo-Liste der letzten Woche. Schau kurz drauf — und beantworte dann diese Fragen.
          </p>

          {hasPrevious && previousWeek.weekGoals?.some(g => g) && (
            <div style={styles.prevGoals}>
              <p style={styles.prevGoalsLabel}>Deine Vorhaben letzte Woche:</p>
              {previousWeek.weekGoals.filter(g => g).map((g, i) => (
                <p key={i} style={styles.prevGoalItem}>→ {g}</p>
              ))}
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Wie gut hat dein Plan (Termine und Aufgaben) zur Realität gepasst?</label>
            <div style={styles.scaleRow}>
              {PLAN_SCALE.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateField("planCheckScore", s.value)}
                  style={{
                    ...styles.scaleBtn,
                    backgroundColor: weekData.planCheckScore === s.value ? COLORS.primary : COLORS.lightgray,
                    color: weekData.planCheckScore === s.value ? "#fff" : COLORS.darktext,
                  }}
                >
                  <span style={{ fontSize: "16px", fontWeight: "500" }}>{s.value}</span>
                  <span style={{ fontSize: "11px", marginTop: "2px" }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Was war der Grund, wenn etwas nicht stattgefunden hat?</label>
            <textarea
              value={weekData.planCheckReason}
              onChange={(e) => updateField("planCheckReason", e.target.value)}
              placeholder="Bewusste Entscheidung? Externer Einfluss? Überplant?"
              style={styles.textarea}
              rows={3}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Was nimmst du daraus für die kommende Woche mit?</label>
            <textarea
              value={weekData.planCheckTakeaway}
              onChange={(e) => updateField("planCheckTakeaway", e.target.value)}
              placeholder="Eine Sache, die du anpassen möchtest..."
              style={styles.textarea}
              rows={2}
            />
          </div>

          <div style={styles.fingerNav}>
            <button onClick={() => setStep(1)} style={styles.secondaryBtn}>
              Zurück
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={nextStep} style={styles.primaryBtnSmall}>
              Zur Wochenplanung →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: WOCHENPLANUNG — Screen 3.1: Stundenplan & Aufgabenliste
  if (step === 3) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader
            step={"3.1"}
            title="Wochenplanung"
            timeHint="~15 Minuten"
            elapsed={elapsed}
            formatTime={formatTime}
          />

          {weekData.planCheckTakeaway && (
            <div style={styles.reminder}>
              <p style={styles.reminderLabel}>Dein Vorsatz aus dem Plan-Check:</p>
              <p style={styles.reminderText}>„{weekData.planCheckTakeaway}"</p>
            </div>
          )}

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Öffne jetzt deinen Kalender und erstelle deinen Stundenplan für nächste Woche:</label>
            <div style={styles.checklist}>
              <p style={styles.checkItem}>○ Lege deine Arbeitszeiten fest</p>
              <p style={styles.checkItem}>○ Plane Pausen und Freizeitaktivitäten</p>
              <p style={styles.checkItem}>○ Trage Zeitblöcke für Fixtermine und Kernaktivitäten ein</p>
              <p style={styles.checkItem}>○ Plane Zeitpuffer am Ende des Tages</p>
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Aktualisiere und organisiere deine Aufgabenliste für nächste Woche:</label>
            <div style={styles.checklist}>
              <p style={styles.checkItem}>○ Lösche oder delegiere, was nicht mehr relevant ist</p>
              <p style={styles.checkItem}>○ Achte auf selbsterklärende Formulierungen der Aufgaben</p>
              <p style={styles.checkItem}>○ Weise den Aufgaben konkrete Zeitabschätzungen zu</p>
            </div>
          </div>

          <div style={styles.fingerNav}>
            <button onClick={() => setStep(2)} style={styles.secondaryBtn}>
              Zurück
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setStep(4)} style={styles.primaryBtnSmall}>
              Weiter →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 4: WOCHENPLANUNG — Screen 3.2: Vorhaben, Haltung, Aufmerksamkeit
  if (step === 4) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader
            step={"3.2"}
            title="Vorhaben & Haltung"
            timeHint=""
            elapsed={elapsed}
            formatTime={formatTime}
          />

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Meine drei wichtigsten Vorhaben diese Woche:</label>
            {[0, 1, 2].map((i) => (
              <div key={i} style={styles.goalRow}>
                <span style={styles.goalNum}>{i + 1}</span>
                <input
                  value={weekData.weekGoals[i]}
                  onChange={(e) => updateGoal(i, e.target.value)}
                  placeholder={i === 0 ? "Das Wichtigste..." : i === 1 ? "Außerdem..." : "Und wenn möglich..."}
                  style={styles.goalInput}
                />
              </div>
            ))}
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mit welcher Haltung gehe ich in diese Woche?</label>
            <textarea
              value={weekData.weekIntention}
              onChange={(e) => updateField("weekIntention", e.target.value)}
              placeholder="Ein Satz, der dich durch die Woche begleitet..."
              style={styles.textarea}
              rows={2}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Worauf will ich meine Aufmerksamkeit richten?</label>
            <textarea
              value={weekData.weekAttention}
              onChange={(e) => updateField("weekAttention", e.target.value)}
              placeholder="Was soll diese Woche meine besondere Beachtung bekommen?"
              style={styles.textarea}
              rows={2}
            />
          </div>

          <div style={styles.fingerNav}>
            <button onClick={() => setStep(3)} style={styles.secondaryBtn}>
              Zurück
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={finishRoutine} style={styles.primaryBtnSmall}>
              Routine abschließen ✓
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 5: DONE
  if (step === 5) {
    const count = getCompletedWeeks().length;
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.doneSection}>
            <div style={styles.doneCheck}>✓</div>
            <h2 style={styles.doneTitle}>Woche geplant.</h2>
            <p style={styles.doneTime}>{formatTime(elapsed)} Minuten</p>

            {weekData.weekGoals.filter(g => g).length > 0 && (
              <div style={styles.doneSummary}>
                <p style={styles.doneSummaryLabel}>Deine Vorhaben:</p>
                {weekData.weekGoals.filter(g => g).map((g, i) => (
                  <p key={i} style={styles.doneSummaryItem}>{i + 1}. {g}</p>
                ))}
              </div>
            )}

            {weekData.weekIntention && (
              <div style={styles.doneIntention}>
                <p style={styles.doneIntentionText}>„{weekData.weekIntention}"</p>
              </div>
            )}

            {weekData.weekAttention && (
              <div style={{ ...styles.doneIntention, borderLeft: `3px solid ${COLORS.warm}` }}>
                <p style={{ ...styles.doneIntentionText, fontStyle: "normal" }}>
                  <span style={{ fontSize: "12px", color: COLORS.midgray, display: "block", marginBottom: "4px", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Meine Aufmerksamkeit:</span>
                  {weekData.weekAttention}
                </p>
              </div>
            )}

            <div style={styles.doneProgress}>
              <p style={styles.doneProgressText}>
                {count === 1
                  ? "Erste Woche geschafft. Der Anfang ist gemacht."
                  : count < 4
                  ? `${count} Wochen. Die Routine beginnt sich zu formen.`
                  : count < 8
                  ? `${count} Wochen. Du bist mittendrin.`
                  : count < 12
                  ? `${count} Wochen. Die Forschung zeigt: Hier wird aus Praxis Gewohnheit.`
                  : `${count} Wochen. Das ist nachhaltige Veränderung.`}
              </p>

              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min(100, (count / 12) * 100)}%`,
                  }}
                />
              </div>
              <div style={styles.progressLabels}>
                <span>Start</span>
                <span>12 Wochen</span>
              </div>
            </div>

            <button onClick={() => { setStep(0); setTimerStart(null); setElapsed(0); }} style={styles.secondaryBtn}>
              Zurück zur Übersicht
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function StepHeader({ step, title, timeHint, elapsed, formatTime }) {
  return (
    <div style={styles.stepHeader}>
      <div style={styles.stepIndicator}>
        <span style={styles.stepNum}>Schritt {step} von 3</span>
        <span style={styles.stepTime}>{formatTime(elapsed)}</span>
      </div>
      <h2 style={styles.stepTitle}>{title}</h2>
      <p style={styles.stepTimeHint}>{timeHint}</p>
    </div>
  );
}

function StepPreview({ num, title, time, desc }) {
  return (
    <div style={styles.stepPreviewItem}>
      <div style={styles.stepPreviewNum}>{num}</div>
      <div>
        <p style={styles.stepPreviewTitle}>{title}</p>
        <p style={styles.stepPreviewDesc}>{desc} · {time}</p>
      </div>
    </div>
  );
}

function HistoryView({ weeks, onClose }) {
  const completed = Object.entries(weeks)
    .filter(([, d]) => d.completed)
    .sort(([a], [b]) => b.localeCompare(a));

  const scores = completed
    .filter(([, d]) => d.planCheckScore)
    .reverse();

  return (
    <div style={{ padding: "8px 0" }}>
      <h2 style={{ ...styles.stepTitle, marginBottom: "24px" }}>Dein Verlauf</h2>

      {scores.length >= 3 && (
        <div style={styles.chartSection}>
          <p style={styles.label}>Plan-Umsetzung über die Wochen:</p>
          <div style={styles.miniChart}>
            {scores.map(([key, d], i) => (
              <div key={key} style={styles.chartCol}>
                <div style={{
                  ...styles.chartBar,
                  height: `${(d.planCheckScore / 5) * 80}px`,
                  backgroundColor: d.planCheckScore >= 4 ? COLORS.accent : d.planCheckScore >= 3 ? COLORS.primary : COLORS.warmgray,
                }} />
                <span style={styles.chartLabel}>{parseInt(key.split("-W")[1])}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {completed.map(([key, d]) => (
        <div key={key} style={styles.historyCard}>
          <div style={styles.historyHeader}>
            <span style={styles.historyWeek}>{getWeekLabel(key)}</span>
            {d.planCheckScore && (
              <span style={styles.historyScore}>Plan: {d.planCheckScore}/5</span>
            )}
          </div>
          {d.weekGoals?.filter(g => g).length > 0 && (
            <div style={{ marginTop: "8px" }}>
              {d.weekGoals.filter(g => g).map((g, i) => (
                <p key={i} style={styles.historyGoal}>→ {g}</p>
              ))}
            </div>
          )}
          {d.weekIntention && (
            <p style={styles.historyIntention}>„{d.weekIntention}"</p>
          )}
        </div>
      ))}

      {completed.length === 0 && (
        <p style={{ color: COLORS.midgray, textAlign: "center", padding: "40px 0" }}>
          Noch keine abgeschlossenen Wochen.
        </p>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: COLORS.offwhite,
    display: "flex",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    backgroundColor: "#fff",
    borderRadius: "4px",
    padding: "32px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    alignSelf: "flex-start",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  weekLabel: {
    fontSize: "13px",
    color: COLORS.midgray,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  historyBtn: {
    fontSize: "13px",
    color: COLORS.primary,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    textDecoration: "underline",
    textUnderlineOffset: "3px",
  },
  heroSection: {
    textAlign: "center",
    padding: "16px 0 32px",
  },
  heroTitle: {
    fontSize: "28px",
    fontWeight: "400",
    color: COLORS.black,
    margin: "0 0 12px",
    letterSpacing: "-0.5px",
  },
  heroSub: {
    fontSize: "15px",
    color: COLORS.midgray,
    lineHeight: "1.6",
    margin: "0",
    whiteSpace: "pre-line",
  },
  stepsPreview: {
    padding: "0 0 32px",
  },
  stepPreviewItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    padding: "14px 0",
    borderBottom: `1px solid ${COLORS.lightgray}`,
  },
  stepPreviewNum: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: COLORS.primary,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "500",
    flexShrink: 0,
    fontFamily: "sans-serif",
  },
  stepPreviewTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: COLORS.darktext,
    margin: "0 0 2px",
  },
  stepPreviewDesc: {
    fontSize: "13px",
    color: COLORS.midgray,
    margin: "0",
  },
  primaryBtn: {
    display: "block",
    width: "100%",
    padding: "16px",
    backgroundColor: COLORS.primary,
    color: "#fff",
    border: "none",
    borderRadius: "3px",
    fontSize: "16px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    letterSpacing: "0.3px",
  },
  primaryBtnSmall: {
    padding: "12px 24px",
    backgroundColor: COLORS.primary,
    color: "#fff",
    border: "none",
    borderRadius: "3px",
    fontSize: "14px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "12px 20px",
    backgroundColor: "transparent",
    color: COLORS.midgray,
    border: `1px solid ${COLORS.warmgray}`,
    borderRadius: "3px",
    fontSize: "14px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
  },
  badge: {
    display: "inline-block",
    padding: "8px 20px",
    borderRadius: "3px",
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "sans-serif",
  },
  impulse: {
    marginTop: "24px",
    padding: "16px 20px",
    backgroundColor: COLORS.lightgray,
    borderRadius: "3px",
    borderLeft: `3px solid ${COLORS.warm}`,
  },
  impulseText: {
    fontSize: "14px",
    color: COLORS.darktext,
    lineHeight: "1.6",
    margin: "0",
    fontStyle: "italic",
  },
  stepHeader: {
    marginBottom: "24px",
    borderBottom: `1px solid ${COLORS.lightgray}`,
    paddingBottom: "16px",
  },
  stepIndicator: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  stepNum: {
    fontSize: "12px",
    color: COLORS.midgray,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontFamily: "sans-serif",
  },
  stepTime: {
    fontSize: "13px",
    color: COLORS.primary,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  stepTitle: {
    fontSize: "22px",
    fontWeight: "400",
    color: COLORS.black,
    margin: "0 0 4px",
  },
  stepTimeHint: {
    fontSize: "13px",
    color: COLORS.midgray,
    margin: "0",
  },
  stepIntro: {
    fontSize: "15px",
    color: COLORS.darktext,
    lineHeight: "1.6",
    margin: "0 0 24px",
  },
  fingerTabs: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    justifyContent: "center",
  },
  fingerTab: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "sans-serif",
  },
  fingerContent: {
    minHeight: "160px",
  },
  fingerTitle: {
    fontSize: "17px",
    fontWeight: "600",
    color: COLORS.darktext,
    margin: "0 0 4px",
  },
  fingerPrompt: {
    fontSize: "14px",
    color: COLORS.midgray,
    margin: "0 0 12px",
    fontStyle: "italic",
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${COLORS.warmgray}`,
    borderRadius: "3px",
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    lineHeight: "1.6",
    resize: "vertical",
    color: COLORS.darktext,
    backgroundColor: COLORS.offwhite,
    outline: "none",
    boxSizing: "border-box",
  },
  fingerNav: {
    display: "flex",
    alignItems: "center",
    marginTop: "32px",
    gap: "12px",
  },
  fieldGroup: {
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "600",
    color: COLORS.darktext,
    marginBottom: "10px",
  },
  scaleRow: {
    display: "flex",
    gap: "6px",
  },
  scaleBtn: {
    flex: 1,
    padding: "10px 4px",
    border: "none",
    borderRadius: "3px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    transition: "all 0.15s ease",
    fontFamily: "sans-serif",
  },
  prevGoals: {
    padding: "16px",
    backgroundColor: COLORS.lightgray,
    borderRadius: "3px",
    marginBottom: "24px",
  },
  prevGoalsLabel: {
    fontSize: "13px",
    color: COLORS.midgray,
    margin: "0 0 8px",
    fontWeight: "600",
  },
  prevGoalItem: {
    fontSize: "14px",
    color: COLORS.darktext,
    margin: "4px 0",
  },
  reminder: {
    padding: "16px",
    backgroundColor: COLORS.lightgray,
    borderRadius: "3px",
    borderLeft: `3px solid ${COLORS.primary}`,
    marginBottom: "24px",
  },
  reminderLabel: {
    fontSize: "12px",
    color: COLORS.midgray,
    margin: "0 0 4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontFamily: "sans-serif",
  },
  reminderText: {
    fontSize: "15px",
    color: COLORS.darktext,
    margin: "0",
    fontStyle: "italic",
  },
  checklist: {
    padding: "16px 20px",
    backgroundColor: COLORS.lightgray,
    borderRadius: "3px",
  },
  checkItem: {
    fontSize: "14px",
    color: COLORS.darktext,
    margin: "6px 0",
    lineHeight: "1.5",
  },
  goalRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  goalNum: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: COLORS.lightgray,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    color: COLORS.midgray,
    flexShrink: 0,
    fontFamily: "sans-serif",
  },
  goalInput: {
    flex: 1,
    padding: "10px 14px",
    border: `1px solid ${COLORS.warmgray}`,
    borderRadius: "3px",
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    color: COLORS.darktext,
    backgroundColor: COLORS.offwhite,
    outline: "none",
  },
  doneSection: {
    textAlign: "center",
    padding: "24px 0",
  },
  doneCheck: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    backgroundColor: COLORS.accent,
    color: COLORS.black,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  doneTitle: {
    fontSize: "24px",
    fontWeight: "400",
    color: COLORS.black,
    margin: "0 0 4px",
  },
  doneTime: {
    fontSize: "14px",
    color: COLORS.midgray,
    margin: "0 0 28px",
  },
  doneSummary: {
    textAlign: "left",
    padding: "16px 20px",
    backgroundColor: COLORS.lightgray,
    borderRadius: "3px",
    marginBottom: "16px",
  },
  doneSummaryLabel: {
    fontSize: "12px",
    color: COLORS.midgray,
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontFamily: "sans-serif",
  },
  doneSummaryItem: {
    fontSize: "15px",
    color: COLORS.darktext,
    margin: "4px 0",
  },
  doneIntention: {
    padding: "16px 20px",
    backgroundColor: COLORS.lightgray,
    borderRadius: "3px",
    marginBottom: "28px",
  },
  doneIntentionText: {
    fontSize: "15px",
    color: COLORS.darktext,
    margin: "0",
    fontStyle: "italic",
  },
  doneProgress: {
    marginBottom: "28px",
  },
  doneProgressText: {
    fontSize: "14px",
    color: COLORS.darktext,
    marginBottom: "12px",
  },
  progressBar: {
    height: "6px",
    backgroundColor: COLORS.warmgray,
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: "3px",
    transition: "width 0.5s ease",
  },
  progressLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "11px",
    color: COLORS.midgray,
    marginTop: "4px",
    fontFamily: "sans-serif",
  },
  chartSection: {
    marginBottom: "28px",
  },
  miniChart: {
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
    height: "100px",
    padding: "8px 0",
  },
  chartCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
  },
  chartBar: {
    width: "100%",
    maxWidth: "32px",
    borderRadius: "2px 2px 0 0",
    transition: "height 0.3s ease",
  },
  chartLabel: {
    fontSize: "10px",
    color: COLORS.midgray,
    marginTop: "4px",
    fontFamily: "sans-serif",
  },
  historyCard: {
    padding: "16px 0",
    borderBottom: `1px solid ${COLORS.lightgray}`,
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyWeek: {
    fontSize: "14px",
    fontWeight: "600",
    color: COLORS.darktext,
  },
  historyScore: {
    fontSize: "13px",
    color: COLORS.primary,
    fontFamily: "sans-serif",
  },
  historyGoal: {
    fontSize: "14px",
    color: COLORS.darktext,
    margin: "3px 0",
  },
  historyIntention: {
    fontSize: "13px",
    color: COLORS.midgray,
    fontStyle: "italic",
    marginTop: "8px",
  },
  welcomeSection: {
    textAlign: "center",
    padding: "16px 0",
  },
  welcomeLogo: {
    display: "inline-block",
    fontSize: "14px",
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: "1px",
    padding: "6px 14px",
    border: `2px solid ${COLORS.primary}`,
    borderRadius: "3px",
    marginBottom: "28px",
    fontFamily: "sans-serif",
  },
  welcomeTitle: {
    fontSize: "26px",
    fontWeight: "400",
    color: COLORS.black,
    margin: "0 0 16px",
    lineHeight: "1.3",
    letterSpacing: "-0.3px",
    whiteSpace: "pre-line",
  },
  welcomeText: {
    fontSize: "15px",
    color: COLORS.midgray,
    lineHeight: "1.6",
    margin: "0 0 20px",
    padding: "0 8px",
  },
  welcomeDivider: {
    width: "40px",
    height: "2px",
    backgroundColor: COLORS.warmgray,
    margin: "24px auto",
  },
  welcomeSteps: {
    textAlign: "left",
    padding: "0 4px",
    marginBottom: "24px",
  },
  welcomeStep: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    padding: "12px 0",
    borderBottom: `1px solid ${COLORS.lightgray}`,
  },
  welcomeStepIcon: {
    fontSize: "20px",
    flexShrink: 0,
    width: "32px",
    textAlign: "center",
    paddingTop: "2px",
  },
  welcomeStepTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: COLORS.darktext,
    margin: "0 0 2px",
  },
  welcomeStepDesc: {
    fontSize: "13px",
    color: COLORS.midgray,
    margin: "0",
    lineHeight: "1.4",
  },
  welcomeNote: {
    fontSize: "13px",
    color: COLORS.midgray,
    lineHeight: "1.5",
    margin: "0 0 28px",
    padding: "16px",
    backgroundColor: COLORS.lightgray,
    borderRadius: "3px",
    textAlign: "left",
    fontStyle: "italic",
  },
};
