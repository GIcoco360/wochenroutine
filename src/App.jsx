import { useState, useEffect, useCallback, useRef } from "react";

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
  beta: "#e67e22",
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

// ==================== FOOTER ====================
function AppFooter({ onShowInfo }) {
  return (
    <footer style={{
      maxWidth: "520px",
      margin: "0 auto",
      padding: "24px 24px 40px",
      textAlign: "center",
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
        <a href="https://www.so-smart.club/datenschutz" target="_blank" rel="noopener noreferrer" style={footerLink}>Datenschutz</a>
        <a href="https://www.so-smart.club/impressum" target="_blank" rel="noopener noreferrer" style={footerLink}>Impressum</a>
        <a href="https://www.so-smart.club/agb" target="_blank" rel="noopener noreferrer" style={footerLink}>AGB</a>
        <button onClick={onShowInfo} style={{ ...footerLink, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Georgia', serif" }}>Hintergrundinformationen</button>
      </div>
      <p style={{ fontSize: "11px", color: COLORS.warmgray, marginTop: "12px", fontFamily: "sans-serif" }}>
        © {new Date().getFullYear()} so-smart.club
      </p>
    </footer>
  );
}

const footerLink = {
  fontSize: "13px",
  color: COLORS.midgray,
  textDecoration: "none",
  borderBottom: `1px solid ${COLORS.warmgray}`,
  paddingBottom: "1px",
};

// ==================== INFO PAGE ====================
function InfoPage({ onClose }) {
  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, maxWidth: "600px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...styles.stepTitle, margin: 0 }}>Hintergrundinformationen</h2>
          <button onClick={onClose} style={{ ...styles.secondaryBtn, padding: "8px 16px", fontSize: "13px" }}>Schließen</button>
        </div>

        <Section title="Was die App ist">
          Die 3×3 Wochenroutine ist ein digitaler Begleiter für Zeitmanagement und Selbstführung. Sie führt einmal pro Woche in 30 Minuten durch einen strukturierten Prozess aus Reflexion und Planung. Die App ersetzt keine bestehenden Tools — Teilnehmer nutzen weiterhin ihren eigenen Kalender und ihre eigene Aufgabenliste. Die App gibt den Rahmen, dokumentiert den Prozess und macht die persönliche Entwicklung über die Wochen sichtbar.
        </Section>

        <Section title="Der wöchentliche Ablauf">
          <p style={infoP}>Die Routine besteht aus drei Schritten mit einer klaren Dramaturgie: Erst bei sich ankommen, dann zurückschauen, dann vorausplanen.</p>
          <p style={infoP}><strong>Schritt 1 — 5-Finger-Reflexion (ca. 7 Minuten):</strong> Der Teilnehmer schaut auf seine Woche zurück — nicht auf den Plan, sondern auf sein Erleben. Fünf Fragen, orientiert an den fünf Fingern: Was war gut? Was war wichtig? Was hat gestört? Welche Beziehung war wichtig? Was kam zu kurz? Das dient der Psychohygiene und schafft eine reflektierte Grundlage für alles, was danach kommt.</p>
          <p style={infoP}><strong>Schritt 2 — Plan-Check (ca. 5 Minuten):</strong> Der Teilnehmer öffnet seinen Kalender und seine Aufgabenliste der vergangenen Woche und beantwortet drei Fragen: Wie gut hat mein Plan zur Realität gepasst? Was war der Grund, wenn etwas nicht stattgefunden hat? Was nehme ich daraus mit? Die App zeigt automatisch die Vorhaben der Vorwoche an, damit der Abgleich konkret bleibt. Eine Selbsteinschätzung auf einer Fünferskala dokumentiert die Planungsqualität über die Zeit.</p>
          <p style={infoP}><strong>Schritt 3 — Wochenplanung (ca. 15 Minuten):</strong> Screen 3.1 leitet den Teilnehmer an, seinen Stundenplan und seine Aufgabenliste für die kommende Woche zu erstellen — mit konkreten Checklisten als Orientierung. Der Vorsatz aus dem Plan-Check wird als Erinnerung angezeigt. Screen 3.2 hält die Essenz fest: Die drei wichtigsten Vorhaben der Woche, die Haltung, mit der der Teilnehmer in die Woche geht, und worauf er seine Aufmerksamkeit richten will.</p>
        </Section>

        <Section title="Was über die Wochen wächst">
          Alle Eingaben werden im Browser lokal gespeichert. Woche für Woche entsteht ein persönliches Lernprotokoll. Die App zeigt ab der dritten abgeschlossenen Woche einen Verlauf der Planumsetzung als einfaches Balkendiagramm. Ein Fortschrittsbalken zählt leise bis zur 12-Wochen-Marke. An passenden Stellen erscheinen kontextbezogene Impulse — zum Beispiel der Hinweis, dass sich Planungsqualität meist erst nach vier bis sechs Wochen stabilisiert, oder dass ab acht Wochen die Routine zur Gewohnheit wird.
        </Section>

        <Section title="Die wissenschaftliche Grundlage">
          Das Format basiert auf dem Befund der Trentepohl-Studie (2022), dass regelmäßiges Planen und Reflektieren über einen längeren Zeitraum die einzige Zeitmanagement-Intervention ist, die nachhaltig wirkt — reines Wissen ohne Praxis führt nach einem anfänglichen Fortschritt nicht weiter. Die drei Wirkebenen, die das Programm adressiert — Zufriedenheit, Stressreduktion, Produktivität — sind durch die Meta-Analysen von Aeon et al. (2021) und Bedi & Sass (2023) belegt.
        </Section>

        <Section title="Technisch">
          Die App läuft unter routine.so-smart.club. Die Daten der Teilnehmer liegen lokal im Browser (localStorage) — es gibt keine zentrale Datenbank und kein Login. Die Daten können jederzeit exportiert und importiert werden.
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ fontSize: "16px", fontWeight: "600", color: COLORS.darktext, margin: "0 0 8px" }}>{title}</h3>
      <div style={{ fontSize: "14px", color: COLORS.darktext, lineHeight: "1.7" }}>{children}</div>
    </div>
  );
}

const infoP = { fontSize: "14px", color: COLORS.darktext, lineHeight: "1.7", margin: "0 0 12px" };

// ==================== BETA BADGE ====================
function BetaBadge() {
  return (
    <span style={{
      display: "inline-block",
      fontSize: "10px",
      fontWeight: "700",
      color: "#fff",
      backgroundColor: COLORS.beta,
      padding: "2px 8px",
      borderRadius: "2px",
      letterSpacing: "1px",
      textTransform: "uppercase",
      fontFamily: "sans-serif",
      marginLeft: "8px",
      verticalAlign: "middle",
      position: "relative",
      top: "-2px",
    }}>Beta</span>
  );
}

// ==================== MAIN APP ====================
export default function WochenRoutine() {
  const [currentWeek] = useState(getWeekKey());
  const [step, setStep] = useState(-1);
  const [activeFinger, setActiveFinger] = useState(0);
  const [weekData, setWeekData] = useState(null);
  const [allWeeks, setAllWeeks] = useState({});
  const [previousWeek, setPreviousWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timerStart, setTimerStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [welcomeSeen, setWelcomeSeen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const fileInputRef = useRef(null);

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

  // ===== EXPORT / IMPORT =====
  const exportData = () => {
    const dataStr = JSON.stringify(allWeeks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wochenroutine-backup-${getWeekKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (typeof imported === "object" && imported !== null) {
          const merged = { ...allWeeks, ...imported };
          setAllWeeks(merged);
          if (merged[currentWeek]) setWeekData(merged[currentWeek]);
          await window.storage.set(STORAGE_KEY, JSON.stringify(merged));
          alert("Daten erfolgreich importiert.");
        }
      } catch (err) {
        alert("Die Datei konnte nicht gelesen werden.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ===== INFO PAGE =====
  if (showInfo) {
    return (
      <>
        <InfoPage onClose={() => setShowInfo(false)} />
        <AppFooter onShowInfo={() => setShowInfo(true)} />
      </>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: "center", padding: "80px 24px" }}>
          <p style={{ color: COLORS.midgray }}>Lädt...</p>
        </div>
      </div>
    );
  }

  // ==================== WELCOME SCREEN ====================
  if (step === -1) {
    return (
      <>
        <div style={{ ...styles.container, alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: "440px", textAlign: "center" }}>

            <img src="/logo.png" alt="3×3 Business Coaching" style={{ width: "260px", height: "auto", display: "block", margin: "0 auto 48px" }} />

            <h1 style={{ fontSize: "28px", fontWeight: "400", color: COLORS.black, margin: "0", lineHeight: "1.25", letterSpacing: "-0.3px" }}>
              3×3 Wochenroutine <BetaBadge />
            </h1>

            <p style={{ fontSize: "16px", color: COLORS.midgray, lineHeight: "1.6", margin: "20px 0 0", whiteSpace: "pre-line", fontFamily: "'Georgia', serif" }}>
              {"30 Minuten pro Woche.\nAnkommen. Zurückschauen. Vorausplanen."}
            </p>

            <div style={{ width: "32px", height: "1.5px", backgroundColor: COLORS.warmgray, margin: "40px auto" }} />

            <p style={{ fontSize: "14px", color: COLORS.midgray, lineHeight: "1.7", margin: "0 auto", maxWidth: "340px", fontStyle: "italic", fontFamily: "'Georgia', serif" }}>
              Du nutzt deine eigenen Tools für Kalender und Aufgaben. Diese App führt dich durch den Prozess.
            </p>

            {/* Privacy notice */}
            <div style={{
              margin: "32px auto 0",
              maxWidth: "380px",
              padding: "14px 16px",
              backgroundColor: COLORS.lightgray,
              borderRadius: "3px",
              textAlign: "left",
            }}>
              <p style={{ fontSize: "12px", color: COLORS.midgray, lineHeight: "1.6", margin: "0" }}>
                <strong style={{ color: COLORS.darktext }}>Datenschutz:</strong> Deine Daten werden ausschließlich lokal in deinem Browser gespeichert (localStorage). Es werden keine Daten an Server oder Dritte übermittelt. Es gibt kein Tracking und keine Cookies. Mehr dazu in unserer{" "}
                <a href="https://www.so-smart.club/datenschutz" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary }}>Datenschutzerklärung</a>.
              </p>
            </div>

            <button onClick={() => { setWelcomeSeen(true); setStep(0); }} style={{
              ...styles.primaryBtn,
              marginTop: "32px",
              maxWidth: "280px",
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              Starten
            </button>

          </div>
        </div>
        <AppFooter onShowInfo={() => setShowInfo(true)} />
      </>
    );
  }

  // ==================== START SCREEN ====================
  if (step === 0) {
    const alreadyDone = weekData?.completed;
    const completedCount = getCompletedWeeks().length;

    return (
      <>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.topBar}>
              <span style={styles.weekLabel}>{getWeekLabel(currentWeek)}</span>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {completedCount > 0 && (
                  <button onClick={() => setHistoryOpen(!historyOpen)} style={styles.historyBtn}>
                    {historyOpen ? "Schließen" : `Verlauf (${completedCount})`}
                  </button>
                )}
              </div>
            </div>

            {historyOpen ? (
              <HistoryView weeks={allWeeks} onClose={() => setHistoryOpen(false)} />
            ) : (
              <>
                <div style={styles.heroSection}>
                  <h1 style={styles.heroTitle}>3×3 Wochenroutine <BetaBadge /></h1>
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
                      <button onClick={() => { setStep(1); setTimerStart(Date.now()); }} style={styles.secondaryBtn}>Nochmal anschauen</button>
                      <button onClick={() => { const fresh = initWeekData(); setWeekData(fresh); setStep(1); setTimerStart(Date.now()); setElapsed(0); }} style={styles.secondaryBtn}>Neu starten</button>
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

                {/* Export / Import */}
                {completedCount > 0 && (
                  <div style={{ marginTop: "24px", borderTop: `1px solid ${COLORS.lightgray}`, paddingTop: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                      <button onClick={exportData} style={{ ...styles.secondaryBtn, fontSize: "12px", padding: "8px 16px" }}>Daten exportieren</button>
                      <button onClick={() => fileInputRef.current?.click()} style={{ ...styles.secondaryBtn, fontSize: "12px", padding: "8px 16px" }}>Daten importieren</button>
                      <input ref={fileInputRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
                    </div>
                    <p style={{ fontSize: "11px", color: COLORS.midgray, textAlign: "center", marginTop: "8px" }}>
                      Sichere deine Daten als Backup oder übertrage sie auf ein anderes Gerät.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <AppFooter onShowInfo={() => setShowInfo(true)} />
      </>
    );
  }

  // ==================== STEP 1: 5-FINGER ====================
  if (step === 1) {
    const current = FINGER_LABELS[activeFinger];
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader step={1} title="5-Finger-Reflexion" timeHint="~7 Minuten" elapsed={elapsed} formatTime={formatTime} />
          <p style={styles.stepIntro}>Schau auf deine vergangene Woche. Nicht auf den Plan — auf dein Erleben.</p>
          <div style={styles.fingerTabs}>
            {FINGER_LABELS.map((f, i) => (
              <button key={i} onClick={() => setActiveFinger(i)} style={{
                ...styles.fingerTab,
                backgroundColor: activeFinger === i ? COLORS.primary : "transparent",
                color: activeFinger === i ? "#fff" : COLORS.midgray,
                borderColor: activeFinger === i ? COLORS.primary : COLORS.warmgray,
              }}>
                <span style={{ fontSize: "18px" }}>{f.icon}</span>
              </button>
            ))}
          </div>
          <div style={styles.fingerContent} key={activeFinger}>
            <h3 style={styles.fingerTitle}>{current.finger}</h3>
            <p style={styles.fingerPrompt}>{current.prompt}</p>
            <textarea value={weekData.fingers[activeFinger]} onChange={(e) => updateFinger(activeFinger, e.target.value)} placeholder="Ein paar Worte oder Stichpunkte..." style={styles.textarea} rows={3} />
          </div>
          <div style={styles.fingerNav}>
            {activeFinger > 0 && <button onClick={() => setActiveFinger(activeFinger - 1)} style={styles.secondaryBtn}>Zurück</button>}
            <div style={{ flex: 1 }} />
            {activeFinger < 4 ? (
              <button onClick={() => setActiveFinger(activeFinger + 1)} style={styles.primaryBtnSmall}>Weiter</button>
            ) : (
              <button onClick={nextStep} style={styles.primaryBtnSmall}>Zum Plan-Check →</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 2: PLAN-CHECK ====================
  if (step === 2) {
    const hasPrevious = previousWeek?.completed;
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader step={2} title="Plan-Check" timeHint="~5 Minuten" elapsed={elapsed} formatTime={formatTime} />
          <p style={styles.stepIntro}>Öffne deinen Kalender / Wochenplan und deine ToDo-Liste der letzten Woche. Schau kurz drauf — und beantworte dann diese Fragen.</p>
          {hasPrevious && previousWeek.weekGoals?.some(g => g) && (
            <div style={styles.prevGoals}>
              <p style={styles.prevGoalsLabel}>Deine Vorhaben letzte Woche:</p>
              {previousWeek.weekGoals.filter(g => g).map((g, i) => <p key={i} style={styles.prevGoalItem}>→ {g}</p>)}
            </div>
          )}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Wie gut hat dein Plan (Termine und Aufgaben) zur Realität gepasst?</label>
            <div style={styles.scaleRow}>
              {PLAN_SCALE.map((s) => (
                <button key={s.value} onClick={() => updateField("planCheckScore", s.value)} style={{
                  ...styles.scaleBtn,
                  backgroundColor: weekData.planCheckScore === s.value ? COLORS.primary : COLORS.lightgray,
                  color: weekData.planCheckScore === s.value ? "#fff" : COLORS.darktext,
                }}>
                  <span style={{ fontSize: "16px", fontWeight: "500" }}>{s.value}</span>
                  <span style={{ fontSize: "11px", marginTop: "2px" }}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Was war der Grund, wenn etwas nicht stattgefunden hat?</label>
            <textarea value={weekData.planCheckReason} onChange={(e) => updateField("planCheckReason", e.target.value)} placeholder="Bewusste Entscheidung? Externer Einfluss? Überplant?" style={styles.textarea} rows={3} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Was nimmst du daraus für die kommende Woche mit?</label>
            <textarea value={weekData.planCheckTakeaway} onChange={(e) => updateField("planCheckTakeaway", e.target.value)} placeholder="Eine Sache, die du anpassen möchtest..." style={styles.textarea} rows={2} />
          </div>
          <div style={styles.fingerNav}>
            <button onClick={() => setStep(1)} style={styles.secondaryBtn}>Zurück</button>
            <div style={{ flex: 1 }} />
            <button onClick={nextStep} style={styles.primaryBtnSmall}>Zur Wochenplanung →</button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 3: PLANUNG 3.1 ====================
  if (step === 3) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader step={"3.1"} title="Wochenplanung" timeHint="~15 Minuten" elapsed={elapsed} formatTime={formatTime} />
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
            <button onClick={() => setStep(2)} style={styles.secondaryBtn}>Zurück</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => setStep(4)} style={styles.primaryBtnSmall}>Weiter →</button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 4: PLANUNG 3.2 ====================
  if (step === 4) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <StepHeader step={"3.2"} title="Vorhaben & Haltung" timeHint="" elapsed={elapsed} formatTime={formatTime} />
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Meine drei wichtigsten Vorhaben diese Woche:</label>
            {[0, 1, 2].map((i) => (
              <div key={i} style={styles.goalRow}>
                <span style={styles.goalNum}>{i + 1}</span>
                <input value={weekData.weekGoals[i]} onChange={(e) => updateGoal(i, e.target.value)} placeholder={i === 0 ? "Das Wichtigste..." : i === 1 ? "Außerdem..." : "Und wenn möglich..."} style={styles.goalInput} />
              </div>
            ))}
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Mit welcher Haltung gehe ich in diese Woche?</label>
            <textarea value={weekData.weekIntention} onChange={(e) => updateField("weekIntention", e.target.value)} placeholder="Ein Satz, der dich durch die Woche begleitet..." style={styles.textarea} rows={2} />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Worauf will ich meine Aufmerksamkeit richten?</label>
            <textarea value={weekData.weekAttention} onChange={(e) => updateField("weekAttention", e.target.value)} placeholder="Was soll diese Woche meine besondere Beachtung bekommen?" style={styles.textarea} rows={2} />
          </div>
          <div style={styles.fingerNav}>
            <button onClick={() => setStep(3)} style={styles.secondaryBtn}>Zurück</button>
            <div style={{ flex: 1 }} />
            <button onClick={finishRoutine} style={styles.primaryBtnSmall}>Routine abschließen ✓</button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== STEP 5: DONE ====================
  if (step === 5) {
    const count = getCompletedWeeks().length;
    return (
      <>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.doneSection}>
              <div style={styles.doneCheck}>✓</div>
              <h2 style={styles.doneTitle}>Woche geplant.</h2>
              <p style={styles.doneTime}>{formatTime(elapsed)} Minuten</p>
              {weekData.weekGoals.filter(g => g).length > 0 && (
                <div style={styles.doneSummary}>
                  <p style={styles.doneSummaryLabel}>Deine Vorhaben:</p>
                  {weekData.weekGoals.filter(g => g).map((g, i) => <p key={i} style={styles.doneSummaryItem}>{i + 1}. {g}</p>)}
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
                  {count === 1 ? "Erste Woche geschafft. Der Anfang ist gemacht."
                    : count < 4 ? `${count} Wochen. Die Routine beginnt sich zu formen.`
                    : count < 8 ? `${count} Wochen. Du bist mittendrin.`
                    : count < 12 ? `${count} Wochen. Die Forschung zeigt: Hier wird aus Praxis Gewohnheit.`
                    : `${count} Wochen. Das ist nachhaltige Veränderung.`}
                </p>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${Math.min(100, (count / 12) * 100)}%` }} />
                </div>
                <div style={styles.progressLabels}><span>Start</span><span>12 Wochen</span></div>
              </div>
              <button onClick={() => { setStep(0); setTimerStart(null); setElapsed(0); }} style={styles.secondaryBtn}>Zurück zur Übersicht</button>
            </div>
          </div>
        </div>
        <AppFooter onShowInfo={() => setShowInfo(true)} />
      </>
    );
  }

  return null;
}

// ==================== HELPER COMPONENTS ====================
function StepHeader({ step, title, timeHint, elapsed, formatTime }) {
  return (
    <div style={styles.stepHeader}>
      <div style={styles.stepIndicator}>
        <span style={styles.stepNum}>Schritt {step} von 3</span>
        <span style={styles.stepTime}>{formatTime(elapsed)}</span>
      </div>
      <h2 style={styles.stepTitle}>{title}</h2>
      {timeHint && <p style={styles.stepTimeHint}>{timeHint}</p>}
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

function HistoryView({ weeks }) {
  const completed = Object.entries(weeks).filter(([, d]) => d.completed).sort(([a], [b]) => b.localeCompare(a));
  const scores = completed.filter(([, d]) => d.planCheckScore).reverse();
  return (
    <div style={{ padding: "8px 0" }}>
      <h2 style={{ ...styles.stepTitle, marginBottom: "24px" }}>Dein Verlauf</h2>
      {scores.length >= 3 && (
        <div style={styles.chartSection}>
          <p style={styles.label}>Plan-Umsetzung über die Wochen:</p>
          <div style={styles.miniChart}>
            {scores.map(([key, d]) => (
              <div key={key} style={styles.chartCol}>
                <div style={{ ...styles.chartBar, height: `${(d.planCheckScore / 5) * 80}px`, backgroundColor: d.planCheckScore >= 4 ? COLORS.accent : d.planCheckScore >= 3 ? COLORS.primary : COLORS.warmgray }} />
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
            {d.planCheckScore && <span style={styles.historyScore}>Plan: {d.planCheckScore}/5</span>}
          </div>
          {d.weekGoals?.filter(g => g).length > 0 && (
            <div style={{ marginTop: "8px" }}>
              {d.weekGoals.filter(g => g).map((g, i) => <p key={i} style={styles.historyGoal}>→ {g}</p>)}
            </div>
          )}
          {d.weekIntention && <p style={styles.historyIntention}>„{d.weekIntention}"</p>}
        </div>
      ))}
      {completed.length === 0 && <p style={{ color: COLORS.midgray, textAlign: "center", padding: "40px 0" }}>Noch keine abgeschlossenen Wochen.</p>}
    </div>
  );
}

// ==================== STYLES ====================
const styles = {
  container: { minHeight: "100vh", backgroundColor: COLORS.offwhite, display: "flex", justifyContent: "center", padding: "24px 16px", fontFamily: "'Georgia', 'Times New Roman', serif" },
  card: { width: "100%", maxWidth: "520px", backgroundColor: "#fff", borderRadius: "4px", padding: "32px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", alignSelf: "flex-start" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  weekLabel: { fontSize: "13px", color: COLORS.midgray, letterSpacing: "0.5px", textTransform: "uppercase" },
  historyBtn: { fontSize: "13px", color: COLORS.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "'Georgia', serif", textDecoration: "underline", textUnderlineOffset: "3px" },
  heroSection: { textAlign: "center", padding: "16px 0 32px" },
  heroTitle: { fontSize: "28px", fontWeight: "400", color: COLORS.black, margin: "0 0 12px", letterSpacing: "-0.5px" },
  heroSub: { fontSize: "15px", color: COLORS.midgray, lineHeight: "1.6", margin: "0", whiteSpace: "pre-line" },
  stepsPreview: { padding: "0 0 32px" },
  stepPreviewItem: { display: "flex", alignItems: "flex-start", gap: "16px", padding: "14px 0", borderBottom: `1px solid ${COLORS.lightgray}` },
  stepPreviewNum: { width: "32px", height: "32px", borderRadius: "50%", backgroundColor: COLORS.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "500", flexShrink: 0, fontFamily: "sans-serif" },
  stepPreviewTitle: { fontSize: "15px", fontWeight: "600", color: COLORS.darktext, margin: "0 0 2px" },
  stepPreviewDesc: { fontSize: "13px", color: COLORS.midgray, margin: "0" },
  primaryBtn: { display: "block", width: "100%", padding: "16px", backgroundColor: COLORS.primary, color: "#fff", border: "none", borderRadius: "3px", fontSize: "16px", fontFamily: "'Georgia', serif", cursor: "pointer", letterSpacing: "0.3px" },
  primaryBtnSmall: { padding: "12px 24px", backgroundColor: COLORS.primary, color: "#fff", border: "none", borderRadius: "3px", fontSize: "14px", fontFamily: "'Georgia', serif", cursor: "pointer" },
  secondaryBtn: { padding: "12px 20px", backgroundColor: "transparent", color: COLORS.midgray, border: `1px solid ${COLORS.warmgray}`, borderRadius: "3px", fontSize: "14px", fontFamily: "'Georgia', serif", cursor: "pointer" },
  badge: { display: "inline-block", padding: "8px 20px", borderRadius: "3px", fontSize: "14px", fontWeight: "500", fontFamily: "sans-serif" },
  impulse: { marginTop: "24px", padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderLeft: `3px solid ${COLORS.warm}` },
  impulseText: { fontSize: "14px", color: COLORS.darktext, lineHeight: "1.6", margin: "0", fontStyle: "italic" },
  stepHeader: { marginBottom: "24px", borderBottom: `1px solid ${COLORS.lightgray}`, paddingBottom: "16px" },
  stepIndicator: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  stepNum: { fontSize: "12px", color: COLORS.midgray, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" },
  stepTime: { fontSize: "13px", color: COLORS.primary, fontFamily: "monospace", fontWeight: "500" },
  stepTitle: { fontSize: "22px", fontWeight: "400", color: COLORS.black, margin: "0 0 4px" },
  stepTimeHint: { fontSize: "13px", color: COLORS.midgray, margin: "0" },
  stepIntro: { fontSize: "15px", color: COLORS.darktext, lineHeight: "1.6", margin: "0 0 24px" },
  fingerTabs: { display: "flex", gap: "8px", marginBottom: "24px", justifyContent: "center" },
  fingerTab: { width: "44px", height: "44px", borderRadius: "50%", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s ease", fontFamily: "sans-serif" },
  fingerContent: { minHeight: "160px" },
  fingerTitle: { fontSize: "17px", fontWeight: "600", color: COLORS.darktext, margin: "0 0 4px" },
  fingerPrompt: { fontSize: "14px", color: COLORS.midgray, margin: "0 0 12px", fontStyle: "italic" },
  textarea: { width: "100%", padding: "12px 14px", border: `1px solid ${COLORS.warmgray}`, borderRadius: "3px", fontSize: "15px", fontFamily: "'Georgia', serif", lineHeight: "1.6", resize: "vertical", color: COLORS.darktext, backgroundColor: COLORS.offwhite, outline: "none", boxSizing: "border-box" },
  fingerNav: { display: "flex", alignItems: "center", marginTop: "32px", gap: "12px" },
  fieldGroup: { marginBottom: "24px" },
  label: { display: "block", fontSize: "14px", fontWeight: "600", color: COLORS.darktext, marginBottom: "10px" },
  scaleRow: { display: "flex", gap: "6px" },
  scaleBtn: { flex: 1, padding: "10px 4px", border: "none", borderRadius: "3px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", transition: "all 0.15s ease", fontFamily: "sans-serif" },
  prevGoals: { padding: "16px", backgroundColor: COLORS.lightgray, borderRadius: "3px", marginBottom: "24px" },
  prevGoalsLabel: { fontSize: "13px", color: COLORS.midgray, margin: "0 0 8px", fontWeight: "600" },
  prevGoalItem: { fontSize: "14px", color: COLORS.darktext, margin: "4px 0" },
  reminder: { padding: "16px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderLeft: `3px solid ${COLORS.primary}`, marginBottom: "24px" },
  reminderLabel: { fontSize: "12px", color: COLORS.midgray, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" },
  reminderText: { fontSize: "15px", color: COLORS.darktext, margin: "0", fontStyle: "italic" },
  checklist: { padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px" },
  checkItem: { fontSize: "14px", color: COLORS.darktext, margin: "6px 0", lineHeight: "1.5" },
  goalRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  goalNum: { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: COLORS.lightgray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: COLORS.midgray, flexShrink: 0, fontFamily: "sans-serif" },
  goalInput: { flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.warmgray}`, borderRadius: "3px", fontSize: "15px", fontFamily: "'Georgia', serif", color: COLORS.darktext, backgroundColor: COLORS.offwhite, outline: "none" },
  doneSection: { textAlign: "center", padding: "24px 0" },
  doneCheck: { width: "56px", height: "56px", borderRadius: "50%", backgroundColor: COLORS.accent, color: COLORS.black, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "600", marginBottom: "16px" },
  doneTitle: { fontSize: "24px", fontWeight: "400", color: COLORS.black, margin: "0 0 4px" },
  doneTime: { fontSize: "14px", color: COLORS.midgray, margin: "0 0 28px" },
  doneSummary: { textAlign: "left", padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px", marginBottom: "16px" },
  doneSummaryLabel: { fontSize: "12px", color: COLORS.midgray, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" },
  doneSummaryItem: { fontSize: "15px", color: COLORS.darktext, margin: "4px 0" },
  doneIntention: { padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px", marginBottom: "28px" },
  doneIntentionText: { fontSize: "15px", color: COLORS.darktext, margin: "0", fontStyle: "italic" },
  doneProgress: { marginBottom: "28px" },
  doneProgressText: { fontSize: "14px", color: COLORS.darktext, marginBottom: "12px" },
  progressBar: { height: "6px", backgroundColor: COLORS.warmgray, borderRadius: "3px", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: "3px", transition: "width 0.5s ease" },
  progressLabels: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: COLORS.midgray, marginTop: "4px", fontFamily: "sans-serif" },
  chartSection: { marginBottom: "28px" },
  miniChart: { display: "flex", alignItems: "flex-end", gap: "6px", height: "100px", padding: "8px 0" },
  chartCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" },
  chartBar: { width: "100%", maxWidth: "32px", borderRadius: "2px 2px 0 0", transition: "height 0.3s ease" },
  chartLabel: { fontSize: "10px", color: COLORS.midgray, marginTop: "4px", fontFamily: "sans-serif" },
  historyCard: { padding: "16px 0", borderBottom: `1px solid ${COLORS.lightgray}` },
  historyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  historyWeek: { fontSize: "14px", fontWeight: "600", color: COLORS.darktext },
  historyScore: { fontSize: "13px", color: COLORS.primary, fontFamily: "sans-serif" },
  historyGoal: { fontSize: "14px", color: COLORS.darktext, margin: "3px 0" },
  historyIntention: { fontSize: "13px", color: COLORS.midgray, fontStyle: "italic", marginTop: "8px" },
};
