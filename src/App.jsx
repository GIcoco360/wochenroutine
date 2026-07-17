import { useState, useEffect, useCallback, useRef } from "react";

const COLORS = {
  primary: "#00838e",
  accent: "#69f0ae",
  warm: "#e9e562",
  black: "#1a1a1a",
  offwhite: "#f7f7f5",
  warmgray: "#e4e2dd",
  midgray: "#6e6e6e",
  lightgray: "#f0efec",
  darktext: "#1a1a1a",
  error: "#c0392b",
  beta: "#e67e22",
};

// Centralized typography scale. Use: style={{ ...TYPO.body, color: COLORS.darktext }}
const TYPO = {
  display:  { fontSize: "28px", fontWeight: "400", lineHeight: "1.25" },
  title:    { fontSize: "22px", fontWeight: "400", lineHeight: "1.25" },
  heading:  { fontSize: "17px", fontWeight: "600", lineHeight: "1.35" },
  body:     { fontSize: "16px", fontWeight: "400", lineHeight: "1.55" },
  meta:     { fontSize: "13px", fontWeight: "600", lineHeight: "1.4" },
  caps:     { fontSize: "12px", fontWeight: "700", lineHeight: "1.4", letterSpacing: "0.5px", textTransform: "uppercase" },
};

const FINGER_LABELS = [
  { finger: "Daumen", prompt: "Was war gut diese Woche? Worauf bist du stolz?", icon: "👍" },
  { finger: "Zeigefinger", prompt: "Was war wichtig? Worauf möchte ich hinweisen — mir selbst oder anderen?", icon: "👆" },
  { finger: "Mittelfinger", prompt: "Was hat mich geärgert oder gestört?", icon: "🖕" },
  { finger: "Ringfinger", prompt: "Welche Beziehung war mir diese Woche wichtig?", icon: "💍" },
  { finger: "Kleiner Finger", prompt: "Was kam zu kurz?", icon: "🤙" },
];

const PLAN_SCALE = [
  { value: 1, label: "Kaum" },
  { value: 2, label: "Teilweise" },
  { value: 3, label: "Größtenteils" },
  { value: 4, label: "Gut" },
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

// Plausible Custom Events helper — fails silently if Plausible is blocked/unavailable
const track = (event, props) => {
  try {
    if (typeof window !== "undefined" && typeof window.plausible === "function") {
      props ? window.plausible(event, { props }) : window.plausible(event);
    }
  } catch (e) { /* silent */ }
};

const footerLink = { fontSize: "13px", fontWeight: "500", color: COLORS.midgray, textDecoration: "none", borderBottom: `1px solid ${COLORS.warmgray}`, paddingBottom: "1px" };

function AppFooter({ onShowInfo }) {
  return (
    <footer style={{ maxWidth: "520px", margin: "0 auto", padding: "24px 24px 40px", textAlign: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
        <a href="https://www.so-smart.club/datenschutz" target="_blank" rel="noopener noreferrer" style={footerLink}>Datenschutz</a>
        <a href="https://www.so-smart.club/impressum" target="_blank" rel="noopener noreferrer" style={footerLink}>Impressum</a>
        <a href="https://www.so-smart.club/agb" target="_blank" rel="noopener noreferrer" style={footerLink}>AGB</a>
        <button onClick={onShowInfo} style={{ ...footerLink, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Georgia', serif" }}>Hintergrundinformationen</button>
      </div>
      <p style={{ fontSize: "12px", color: COLORS.midgray, marginTop: "12px", fontFamily: "sans-serif" }}>© {new Date().getFullYear()} so-smart.club</p>
    </footer>
  );
}

function InfoPage({ onClose }) {
  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, maxWidth: "600px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ ...styles.stepTitle, margin: 0 }}>Hintergrundinformationen</h2>
          <button onClick={onClose} style={{ ...styles.secondaryBtn, padding: "8px 16px", fontSize: "14px" }}>Schließen</button>
        </div>
        <Sec title="Was die App ist">Die 3×3 Wochenroutine ist ein digitaler Begleiter für Zeitmanagement und Selbstführung. Sie führt einmal pro Woche in 30 Minuten durch einen strukturierten Prozess aus Reflexion und Planung.</Sec>
        <Sec title="Der wöchentliche Ablauf">
          <p style={ip}>Die Routine besteht aus drei Schritten: Erst die Woche reflektieren, dann Termine und Aufgaben planen, dann die kommende Woche fokussieren.</p>
          <p style={ip}><strong>Schritt 1 — Reflektieren (~10 Min):</strong> 5-Finger-Methode und Plan-Check. Wie war die Woche? Wie gut hat der Plan zur Realität gepasst?</p>
          <p style={ip}><strong>Schritt 2 — Planen (~15 Min):</strong> Mit dem 5-Elemente-Stundenplan die kommende Woche strukturieren (Arbeitszeiten, Pausen, Fixtermine, Kernaktivitäten, Zeitpuffer) und die Aufgabenliste nach dem Kanban-Prinzip organisieren (Sammeln, Organisieren, Erledigen).</p>
          <p style={ip}><strong>Schritt 3 — Fokussieren (~5 Min):</strong> Mit der Triple-A-Methode nach Caroline Webb: Anliegen, Haltung und Aufmerksamkeit für die kommende Woche setzen.</p>
        </Sec>
        <Sec title="Die wissenschaftliche Grundlage">Das Format basiert auf dem Befund der Trentepohl-Studie (2022), dass regelmäßiges Planen und Reflektieren die einzige Zeitmanagement-Intervention ist, die nachhaltig wirkt. Belegt durch die Meta-Analysen von Aeon et al. (2021) und Bedi & Sass (2023).</Sec>
        <Sec title="Technisch">Die Daten liegen lokal im Browser (localStorage) — es gibt keine zentrale Datenbank und kein Login. Die Daten können jederzeit exportiert und importiert werden.</Sec>
      </div>
    </div>
  );
}

function Sec({ title, children }) { return <div style={{ marginBottom: "24px" }}><h3 style={{ fontSize: "17px", fontWeight: "600", color: COLORS.darktext, margin: "0 0 8px", lineHeight: "1.35" }}>{title}</h3><div style={{ fontSize: "16px", color: COLORS.darktext, lineHeight: "1.55" }}>{children}</div></div>; }
const ip = { fontSize: "16px", color: COLORS.darktext, lineHeight: "1.55", margin: "0 0 12px" };

function BetaBadge() {
  return <span style={{ display: "inline-block", fontSize: "10px", fontWeight: "700", color: "#fff", backgroundColor: COLORS.beta, padding: "2px 8px", borderRadius: "2px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "sans-serif", marginLeft: "8px", verticalAlign: "middle", position: "relative", top: "-2px" }}>Beta</span>;
}

function SmartTipp({ children }) {
  return (
    <div style={{ padding: "16px 20px", backgroundColor: COLORS.warm + "30", borderRadius: "3px", borderLeft: `3px solid ${COLORS.warm}`, marginBottom: "20px" }}>
      <p style={{ fontSize: "12px", fontWeight: "700", color: COLORS.midgray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>Smart Tipp</p>
      <p style={{ fontSize: "16px", color: COLORS.darktext, lineHeight: "1.55", margin: "0" }}>{children}</p>
    </div>
  );
}

// ==================== MAIN APP ====================
export default function WochenRoutine() {
  const [currentWeek] = useState(getWeekKey());
  // Steps: -1=welcome, 0=start, 1=finger, 2=plancheck, 3=terminplan, 4=aufgabenliste, 5=triple-a, 6=done
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
          if (parsed[currentWeek]) setWeekData(parsed[currentWeek]);
          const prevKey = getPreviousWeekKey(currentWeek);
          if (parsed[prevKey]) setPreviousWeek(parsed[prevKey]);
        }
      } catch (e) { console.log("No existing data"); }
      if (hasData) { setWelcomeSeen(true); setStep(0); }
      setLoading(false);
    }
    load();
  }, [currentWeek]);

  useEffect(() => {
    if (!timerStart) return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - timerStart) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [timerStart]);

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

  const saveData = useCallback(async (data) => {
    const updated = { ...allWeeks, [currentWeek]: data };
    setAllWeeks(updated);
    setWeekData(data);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(updated)); } catch (e) { console.error("Save failed:", e); }
  }, [allWeeks, currentWeek]);

  const getNextSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() + (7 - d.getDay()));
    return d.toISOString().split("T")[0];
  };

  const initWeekData = () => ({
    weekKey: currentWeek, createdAt: new Date().toISOString(),
    fingers: ["", "", "", "", ""],
    planCheckScore: null, planCheckReason: "", planCheckTakeaway: "",
    terminplanChecks: [false, false, false, false, false], terminplanSatisfaction: null,
    aufgabenChecks: [false, false, false, false], aufgabenSatisfaction: null,
    weekGoals: ["", "", ""], weekIntention: "", weekAttention: "",
    nextPlanDate: getNextSunday(), nextPlanTime: "09:00",
    completed: false,
  });

  const startRoutine = () => { const data = weekData || initWeekData(); setWeekData(data); setStep(1); setTimerStart(Date.now()); track("routine_started"); };
  const updateField = (field, value) => setWeekData({ ...weekData, [field]: value });
  const updateFinger = (i, v) => { const f = [...weekData.fingers]; f[i] = v; updateField("fingers", f); };
  const updateGoal = (i, v) => { const g = [...weekData.weekGoals]; g[i] = v; updateField("weekGoals", g); };
  const toggleCheck = (field, i) => { const arr = [...weekData[field]]; arr[i] = !arr[i]; updateField(field, arr); };
  const nextStep = async (to) => {
    await saveData(weekData);
    if (to === 2) track("step_1_finger_complete");
    else if (to === 3) track("step_1_plancheck_complete");
    else if (to === 4) track("step_2_terminplan_complete");
    else if (to === 5) track("step_2_aufgaben_complete");
    setStep(to);
  };
  const finishRoutine = async () => {
    const final = { ...weekData, completed: true, completedAt: new Date().toISOString(), durationSeconds: elapsed };
    await saveData(final);
    const totalCompleted = Object.values({ ...allWeeks, [currentWeek]: final }).filter(d => d.completed).length;
    track("routine_completed", {
      duration_minutes: Math.round(elapsed / 60),
      completed_weeks_total: totalCompleted
    });
    setStep(6);
  };
  const getCompletedWeeks = () => Object.entries(allWeeks).filter(([, d]) => d.completed).sort(([a], [b]) => b.localeCompare(a));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(allWeeks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `wochenroutine-backup-${getWeekKey()}.json`; a.click(); URL.revokeObjectURL(url);
    track("data_exported");
  };

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (typeof imported === "object" && imported !== null) {
          const merged = { ...allWeeks, ...imported }; setAllWeeks(merged);
          if (merged[currentWeek]) setWeekData(merged[currentWeek]);
          await window.storage.set(STORAGE_KEY, JSON.stringify(merged));
          track("data_imported");
          alert("Daten erfolgreich importiert.");
        }
      } catch { alert("Die Datei konnte nicht gelesen werden."); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const exportCalendarEvent = async () => {
    if (!weekData?.nextPlanDate || !weekData?.nextPlanTime) return;
    const dt = new Date(`${weekData.nextPlanDate}T${weekData.nextPlanTime}:00`);
    const end = new Date(dt.getTime() + 30 * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//3x3//Wochenroutine//DE",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(dt)}`, `DTEND:${fmt(end)}`,
      "SUMMARY:3×3 Wochenroutine",
      "DESCRIPTION:30 Minuten für deine Woche. Öffne routine.so-smart.club",
      "URL:https://routine.so-smart.club",
      "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Wochenplanung in 30 Minuten", "END:VALARM",
      `UID:${Date.now()}@so-smart.club`,
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "wochenroutine.ics"; a.click(); URL.revokeObjectURL(url);
    await saveData({ ...weekData, calendarExported: true });
    track("calendar_event_exported");
  };

  const formatDateDE = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]}`;
  };

  if (showInfo) return <><InfoPage onClose={() => setShowInfo(false)} /><AppFooter onShowInfo={() => setShowInfo(true)} /></>;
  if (loading) return <div style={styles.container}><div style={{ ...styles.card, textAlign: "center", padding: "80px 24px" }}><p style={{ color: COLORS.midgray }}>Lädt...</p></div></div>;

  // ==================== WELCOME ====================
  if (step === -1) {
    return (
      <>
        <div style={{ ...styles.container, alignItems: "center" }}>
          <div style={{ width: "100%", maxWidth: "440px", textAlign: "center" }}>
            <img src="/logo.png" alt="3×3 Business Coaching" style={{ width: "260px", height: "auto", display: "block", margin: "0 auto 48px" }} />
            <h1 style={{ fontSize: "28px", fontWeight: "400", color: COLORS.black, margin: "0", lineHeight: "1.25", letterSpacing: "-0.3px" }}>3×3 Wochenroutine <BetaBadge /></h1>
            <p style={{ fontSize: "16px", color: COLORS.midgray, lineHeight: "1.55", margin: "20px 0 0", whiteSpace: "pre-line", fontFamily: "'Georgia', serif" }}>{"30 Minuten pro Woche.\nReflektieren. Planen. Fokussieren."}</p>
            <div style={{ width: "32px", height: "1.5px", backgroundColor: COLORS.warmgray, margin: "40px auto" }} />
            <p style={{ fontSize: "16px", color: COLORS.midgray, lineHeight: "1.55", margin: "0 auto", maxWidth: "340px", fontStyle: "italic", fontFamily: "'Georgia', serif" }}>Du nutzt deine eigenen Tools für Kalender und Aufgaben. Diese App führt dich durch den Prozess.</p>
            <div style={{ margin: "32px auto 0", maxWidth: "380px", padding: "14px 16px", backgroundColor: COLORS.lightgray, borderRadius: "3px", textAlign: "left" }}>
              <p style={{ fontSize: "13px", color: COLORS.midgray, lineHeight: "1.55", margin: "0" }}>
                <strong style={{ color: COLORS.darktext }}>Datenschutz:</strong> Deine Daten werden ausschließlich lokal in deinem Browser gespeichert. Es werden keine Daten an Server oder Dritte übermittelt. Kein Tracking, keine Cookies. <a href="https://www.so-smart.club/datenschutz" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.primary }}>Mehr erfahren</a>.
              </p>
            </div>
            <button onClick={() => { setWelcomeSeen(true); setStep(0); }} style={{ ...styles.primaryBtn, marginTop: "32px", maxWidth: "280px", marginLeft: "auto", marginRight: "auto" }}>Starten</button>
          </div>
        </div>
        <AppFooter onShowInfo={() => setShowInfo(true)} />
      </>
    );
  }

  // ==================== START ====================
  if (step === 0) {
    const alreadyDone = weekData?.completed;
    const completedCount = getCompletedWeeks().length;
    return (
      <>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.topBar}>
              <span style={styles.weekLabel}>{getWeekLabel(currentWeek)}</span>
              {completedCount > 0 && <button onClick={() => { if (!historyOpen) track("history_opened"); setHistoryOpen(!historyOpen); }} style={styles.historyBtn}>{historyOpen ? "Schließen" : `Verlauf (${completedCount})`}</button>}
            </div>
            {historyOpen ? <HistoryView weeks={allWeeks} /> : (
              <>
                <div style={styles.heroSection}>
                  <h1 style={styles.heroTitle}>3×3 Wochenroutine <BetaBadge /></h1>
                  <p style={styles.heroSub}>{"30 Minuten für deine Woche.\nReflektieren. Planen. Fokussieren."}</p>
                </div>
                <div style={styles.stepsPreview}>
                  <StepPreview num="1" title="Reflektieren" time="~10 Min" desc="5-Finger-Methode + Plan-Check" />
                  <StepPreview num="2" title="Planen" time="~15 Min" desc="5-Elemente-Stundenplan + Kanban" />
                  <StepPreview num="3" title="Fokussieren" time="~5 Min" desc="Triple-A-Methode" />
                </div>
                {alreadyDone ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ ...styles.badge, backgroundColor: COLORS.accent, color: COLORS.black }}>✓ Diese Woche abgeschlossen</div>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
                      <button onClick={() => { setStep(1); setTimerStart(Date.now()); }} style={styles.secondaryBtn}>Nochmal anschauen</button>
                      <button onClick={() => { setWeekData(initWeekData()); setStep(1); setTimerStart(Date.now()); setElapsed(0); }} style={styles.secondaryBtn}>Neu starten</button>
                    </div>
                  </div>
                ) : <button onClick={startRoutine} style={styles.primaryBtn}>{weekData ? "Fortsetzen" : "Routine starten"}</button>}
                {completedCount >= 3 && !historyOpen && (
                  <div style={styles.impulse}><p style={styles.impulseText}>{completedCount >= 8 ? "Zwei Monate regelmäßige Praxis. Die Forschung zeigt: Ab hier wird die Routine zur Gewohnheit." : completedCount >= 4 ? "Schau dir deine Rückblicke der letzten Wochen an. Erkennst du ein Muster?" : "Die Forschung zeigt, dass sich Planungsqualität meist erst nach vier bis sechs Wochen stabilisiert. Du bist auf dem Weg."}</p></div>
                )}
                {completedCount > 0 && (
                  <div style={{ marginTop: "24px", borderTop: `1px solid ${COLORS.lightgray}`, paddingTop: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                      <button onClick={exportData} style={{ ...styles.secondaryBtn, fontSize: "14px", padding: "8px 16px" }}>Daten exportieren</button>
                      <button onClick={() => fileInputRef.current?.click()} style={{ ...styles.secondaryBtn, fontSize: "14px", padding: "8px 16px" }}>Daten importieren</button>
                      <input ref={fileInputRef} type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
                    </div>
                    <p style={{ fontSize: "13px", color: COLORS.midgray, textAlign: "center", marginTop: "8px", lineHeight: "1.5" }}>Sichere deine Daten als Backup oder übertrage sie auf ein anderes Gerät.</p>
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

  // ==================== STEP 1a: 5-FINGER ====================
  if (step === 1) {
    const current = FINGER_LABELS[activeFinger];
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="1" title="Reflektieren" timeHint="5-Finger-Methode · ~7 Min" elapsed={elapsed} formatTime={formatTime} />
        <p style={styles.stepIntro}>Schau auf deine vergangene Woche. Nicht auf den Plan — auf dein Erleben.</p>
        <div style={styles.fingerTabs}>
          {FINGER_LABELS.map((f, i) => (
            <button key={i} onClick={() => setActiveFinger(i)} style={{ ...styles.fingerTab, backgroundColor: activeFinger === i ? COLORS.primary : "transparent", color: activeFinger === i ? "#fff" : COLORS.midgray, borderColor: activeFinger === i ? COLORS.primary : COLORS.warmgray }}>
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
          {activeFinger < 4 ? <button onClick={() => setActiveFinger(activeFinger + 1)} style={styles.primaryBtnSmall}>Weiter</button>
            : <button onClick={() => nextStep(2)} style={styles.primaryBtnSmall}>Zum Plan-Check →</button>}
        </div>
      </div></div>
    );
  }

  // ==================== STEP 1b: PLAN-CHECK ====================
  if (step === 2) {
    const hasPrevious = previousWeek?.completed;
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="1" title="Reflektieren" timeHint="Plan-Check · ~3 Min" elapsed={elapsed} formatTime={formatTime} />
        <p style={styles.stepIntro}>Öffne deinen Kalender / Wochenplan und deine ToDo-Liste der letzten Woche. Schau kurz drauf — und beantworte dann diese Fragen.</p>
        {hasPrevious && previousWeek.weekGoals?.some(g => g) && (
          <div style={styles.prevGoals}>
            <p style={styles.prevGoalsLabel}>Deine Anliegen letzte Woche:</p>
            {previousWeek.weekGoals.filter(g => g).map((g, i) => <p key={i} style={styles.prevGoalItem}>→ {g}</p>)}
          </div>
        )}
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Wie gut hat dein Plan (Termine und Aufgaben) zur Realität gepasst?</label>
          <SatisfactionSlider value={weekData.planCheckScore} onChange={(v) => updateField("planCheckScore", v)} lowLabel="1 · kaum" highLabel="10 · sehr gut" />
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
          <button onClick={() => nextStep(3)} style={styles.primaryBtnSmall}>Zum Terminplan →</button>
        </div>
      </div></div>
    );
  }

  // ==================== STEP 2: TERMINPLAN AKTUALISIEREN ====================
  if (step === 3) {
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="2" title="Planen" timeHint="5-Elemente-Stundenplan · ~7 Min" elapsed={elapsed} formatTime={formatTime} />

        {weekData.planCheckTakeaway && (
          <div style={styles.reminder}>
            <p style={styles.reminderLabel}>Dein Vorsatz aus dem Plan-Check:</p>
            <p style={styles.reminderText}>„{weekData.planCheckTakeaway}"</p>
          </div>
        )}

        <p style={styles.stepIntro}>Öffne deinen Kalender. Ein guter Wochenplan setzt fünf Elemente aufeinander auf:</p>

        {/* Block 1: In deinem Kalender */}
        <div style={styles.checklist}>
          <p style={styles.checklistTitle}>In deinem Kalender:</p>
          <CheckItem checked={weekData.terminplanChecks[0]} onToggle={() => toggleCheck("terminplanChecks", 0)} boxStyle={styles.cboxArbeit} boxStyleChecked={styles.cboxArbeitChecked}>Arbeitszeiten stehen (Anfang und Ende)</CheckItem>
          <CheckItem checked={weekData.terminplanChecks[1]} onToggle={() => toggleCheck("terminplanChecks", 1)} boxStyle={styles.cboxPause} boxStyleChecked={styles.cboxPauseChecked}>Pausen und Freizeitaktivitäten sind bewusst eingeplant</CheckItem>
          <CheckItem checked={weekData.terminplanChecks[2]} onToggle={() => toggleCheck("terminplanChecks", 2)} boxStyle={styles.cboxFix} boxStyleChecked={styles.cboxFixChecked}>Termine sind eingetragen</CheckItem>
          <CheckItem checked={weekData.terminplanChecks[3]} onToggle={() => toggleCheck("terminplanChecks", 3)} boxStyle={styles.cboxKern} boxStyleChecked={styles.cboxKernChecked}>Kernaktivitäten haben feste Zeitblöcke</CheckItem>
          <CheckItem checked={weekData.terminplanChecks[4]} onToggle={() => toggleCheck("terminplanChecks", 4)} boxStyle={styles.cboxPuffer} boxStyleChecked={styles.cboxPufferChecked}>Mindestens 1 Stunde Pufferzeit pro Tag</CheckItem>
        </div>

        {/* Block 2: Zufriedenheit */}
        <div style={styles.satisfactionBox}>
          <p style={styles.satisfactionQuestion}>Wie zufrieden bist du mit deinem Wochenplan?</p>
          <SatisfactionSlider value={weekData.terminplanSatisfaction} onChange={(v) => updateField("terminplanSatisfaction", v)} lowLabel="1 · wenig" highLabel="10 · top" />
        </div>

        {/* Block 3: Zwischenüberschrift */}
        <h3 style={styles.sectionHeading}>5-Elemente-Stundenplan</h3>

        {/* Block 4: Smart Tipp */}
        <SmartTipp>
          Bau dir einmal einen 5-Elemente-Stundenplan für deine typische Woche. In der Wochenplanung passt du ihn nur noch an — du musst die Woche nicht jedes Mal neu erfinden.
        </SmartTipp>

        {/* Block 5: Kalenderblatt */}
        <WeekSchema />

        {/* Block 6: Die Elemente */}
        <div style={styles.rahmenBlock}>
          <p style={styles.checklistTitle}>Die Elemente</p>
          <div style={styles.rahmenGrid}>
            <LegendItem num="1" swatchStyle={{ background: "rgba(0,131,142,0.08)", borderLeft: `3px solid ${COLORS.primary}` }}>Arbeitszeit</LegendItem>
            <LegendItem num="4" swatchStyle={{ background: "#fff", border: `1.5px solid ${COLORS.primary}`, borderLeft: `3px solid ${COLORS.primary}` }}>Kernaktivitäten</LegendItem>
            <LegendItem num="2" swatchStyle={{ background: "rgba(105,240,174,0.32)", borderLeft: `3px solid ${COLORS.accent}` }}>Pausen &amp; Freizeit</LegendItem>
            <LegendItem num="3" swatchStyle={{ background: "#fff", border: `1.5px solid ${COLORS.warm}`, borderLeft: `3px solid ${COLORS.warm}` }}>Termine</LegendItem>
            <LegendItem num="5" swatchStyle={{ background: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,131,142,0.22) 3px, rgba(0,131,142,0.22) 4px)" }}>Pufferzeit</LegendItem>
          </div>
        </div>

        <div style={styles.fingerNav}>
          <button onClick={() => setStep(2)} style={styles.secondaryBtn}>Zurück</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => { track("terminplan_satisfaction", weekData.terminplanSatisfaction ? { value: weekData.terminplanSatisfaction } : undefined); nextStep(4); }} style={styles.primaryBtnSmall}>Zur Aufgabenliste →</button>
        </div>
      </div></div>
    );
  }

  // ==================== STEP 3a: AUFGABENLISTE ORGANISIEREN ====================
  if (step === 4) {
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="2" title="Planen" timeHint="Kanban-Aufgabenliste · ~8 Min" elapsed={elapsed} formatTime={formatTime} />

        <p style={styles.stepIntro}>Wie deine Termine einen fixen Platz haben — den Kalender — so brauchen auch deine Aufgaben einen fixen Ort. Nach dem Kanban-Prinzip:</p>

        {/* Block 1: In deinem Aufgaben-Tool */}
        <div style={styles.checklist}>
          <p style={styles.checklistTitle}>In deinem Aufgaben-Tool:</p>
          <CheckItem checked={weekData.aufgabenChecks[0]} onToggle={() => toggleCheck("aufgabenChecks", 0)} boxStyle={styles.cboxNeutral} boxStyleChecked={styles.cboxNeutralChecked}>Löschen oder delegieren, was nicht mehr relevant ist</CheckItem>
          <CheckItem checked={weekData.aufgabenChecks[1]} onToggle={() => toggleCheck("aufgabenChecks", 1)} boxStyle={styles.cboxNeutral} boxStyleChecked={styles.cboxNeutralChecked}>Formulierungen selbsterklärend machen</CheckItem>
          <CheckItem checked={weekData.aufgabenChecks[2]} onToggle={() => toggleCheck("aufgabenChecks", 2)} boxStyle={styles.cboxNeutral} boxStyleChecked={styles.cboxNeutralChecked}>Zeitabschätzung pro Aufgabe</CheckItem>
          <CheckItem checked={weekData.aufgabenChecks[3]} onToggle={() => toggleCheck("aufgabenChecks", 3)} boxStyle={styles.cboxNeutral} boxStyleChecked={styles.cboxNeutralChecked}>Aufgaben in „Diese Woche" verschieben</CheckItem>
        </div>

        {/* Block 2: Zufriedenheit */}
        <div style={styles.satisfactionBox}>
          <p style={styles.satisfactionQuestion}>Wie zufrieden bist du mit deiner Aufgabenliste?</p>
          <SatisfactionSlider value={weekData.aufgabenSatisfaction} onChange={(v) => updateField("aufgabenSatisfaction", v)} lowLabel="1 · wenig" highLabel="10 · top" />
        </div>

        {/* Block 3: Zwischenüberschrift */}
        <h3 style={styles.sectionHeading}>Kanban-Aufgabenliste</h3>

        {/* Block 4: Smart Tipp */}
        <SmartTipp>
          Collect — Organize — Do: Zuerst sammeln, dann organisieren, dann erledigen. Die Aufgaben wandern Schritt für Schritt von links nach rechts.
        </SmartTipp>

        {/* Block 5: Kanban-Visual */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "130px", padding: "14px 12px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderTop: `3px solid ${COLORS.midgray}` }}>
            <p style={{ fontSize: "12px", color: COLORS.midgray, margin: "0 0 6px", fontWeight: "700", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.3px", overflowWrap: "break-word" }}>Aufgabenspeicher</p>
            <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", lineHeight: "1.5" }}>Alles was anfällt, landet zuerst hier.</p>
          </div>
          <div style={{ flex: 1, minWidth: "130px", padding: "14px 12px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderTop: `3px solid ${COLORS.primary}` }}>
            <p style={{ fontSize: "12px", color: COLORS.primary, margin: "0 0 6px", fontWeight: "700", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.3px", overflowWrap: "break-word" }}>Diese Woche</p>
            <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", lineHeight: "1.5" }}>Was du diese Woche erledigen willst.</p>
          </div>
          <div style={{ flex: 1, minWidth: "130px", padding: "14px 12px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderTop: `3px solid ${COLORS.accent}` }}>
            <p style={{ fontSize: "12px", color: COLORS.darktext, margin: "0 0 6px", fontWeight: "700", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.3px", overflowWrap: "break-word" }}>Heute</p>
            <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", lineHeight: "1.5" }}>Was heute dran ist. Nicht mehr.</p>
          </div>
        </div>

        <div style={styles.fingerNav}>
          <button onClick={() => setStep(3)} style={styles.secondaryBtn}>Zurück</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => { track("aufgaben_satisfaction", weekData.aufgabenSatisfaction ? { value: weekData.aufgabenSatisfaction } : undefined); nextStep(5); }} style={styles.primaryBtnSmall}>Zu Triple-A →</button>
        </div>
      </div></div>
    );
  }

  // ==================== STEP 3b: TRIPLE-A ====================
  if (step === 5) {
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="3" title="Fokussieren" timeHint="Triple-A-Methode · ~5 Min" elapsed={elapsed} formatTime={formatTime} />
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Was sind meine drei Kernanliegen für die kommende Woche?</label>
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
          <button onClick={() => setStep(4)} style={styles.secondaryBtn}>Zurück</button>
          <div style={{ flex: 1 }} />
          <button onClick={finishRoutine} style={styles.primaryBtnSmall}>Routine abschließen ✓</button>
        </div>
      </div></div>
    );
  }

  // ==================== DONE ====================
  if (step === 6) {
    const count = getCompletedWeeks().length;
    const rollingWeeks = (() => {
      const keys = [];
      let k = currentWeek;
      for (let i = 0; i < 12; i++) { keys.unshift(k); k = getPreviousWeekKey(k); }
      const existingKeys = Object.keys(allWeeks);
      const firstKey = existingKeys.length > 0 ? existingKeys.slice().sort()[0] : currentWeek;
      return keys.map((key) => ({
        key,
        completed: !!allWeeks[key]?.completed,
        beforeFirst: key < firstKey,
      }));
    })();
    const rollingCompletedCount = rollingWeeks.filter((w) => w.completed).length;
    const rollingStreak = (() => {
      let s = 0;
      for (let i = rollingWeeks.length - 1; i >= 0; i--) {
        if (rollingWeeks[i].completed) s++; else break;
      }
      return s;
    })();
    return (
      <>
        <div style={styles.container}><div style={styles.card}>

          {/* Confirmation */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={styles.doneCheck}>✓</div>
            <h2 style={styles.doneTitle}>Woche geplant.</h2>
            <p style={styles.doneTime}>{formatTime(elapsed)} Minuten</p>
          </div>

          {/* Anliegen summary */}
          {weekData.weekGoals.filter(g => g).length > 0 && (
            <div style={styles.doneSummary}>
              <p style={styles.doneSummaryLabel}>Deine Anliegen:</p>
              {weekData.weekGoals.filter(g => g).map((g, i) => <p key={i} style={styles.doneSummaryItem}>{i + 1}. {g}</p>)}
            </div>
          )}

          {/* Haltung + Aufmerksamkeit */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {weekData.weekIntention && (
              <div style={{ flex: 1, padding: "12px", backgroundColor: COLORS.lightgray, borderRadius: "3px" }}>
                <p style={{ fontSize: "12px", fontWeight: "700", color: COLORS.midgray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>Haltung</p>
                <p style={{ fontSize: "15px", color: COLORS.darktext, margin: "0", fontStyle: "italic", fontFamily: "'Georgia', serif", lineHeight: "1.5" }}>„{weekData.weekIntention}"</p>
              </div>
            )}
            {weekData.weekAttention && (
              <div style={{ flex: 1, padding: "12px", backgroundColor: COLORS.lightgray, borderRadius: "3px" }}>
                <p style={{ fontSize: "12px", fontWeight: "700", color: COLORS.midgray, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>Aufmerksamkeit</p>
                <p style={{ fontSize: "15px", color: COLORS.darktext, margin: "0", fontStyle: "italic", fontFamily: "'Georgia', serif", lineHeight: "1.5" }}>{weekData.weekAttention}</p>
              </div>
            )}
          </div>

          {/* Next planning date */}
          <div style={{ borderTop: `1px solid ${COLORS.lightgray}`, paddingTop: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "18px", color: COLORS.primary }}>📅</span>
              <p style={{ fontSize: "16px", fontWeight: "600", margin: "0", color: COLORS.darktext }}>Wann planst du die nächste Woche?</p>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.midgray, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>Datum</label>
                <input
                  type="date"
                  value={weekData.nextPlanDate || ""}
                  onChange={(e) => updateField("nextPlanDate", e.target.value)}
                  style={{ ...styles.goalInput, width: "100%", padding: "10px 12px", fontSize: "16px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: COLORS.midgray, display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>Uhrzeit</label>
                <input
                  type="time"
                  value={weekData.nextPlanTime || "09:00"}
                  onChange={(e) => updateField("nextPlanTime", e.target.value)}
                  style={{ ...styles.goalInput, width: "100%", padding: "10px 12px", fontSize: "16px", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <button onClick={exportCalendarEvent} style={{ ...styles.primaryBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              📅 In meinen Kalender eintragen
            </button>
            <p style={{ fontSize: "13px", color: COLORS.midgray, textAlign: "center", marginTop: "8px", lineHeight: "1.5" }}>
              Erstellt einen Termin mit Erinnerung (30 Min vorher) in deinem Kalender.
            </p>
          </div>

          {/* Rollierende 12-Wochen-Darstellung */}
          <div style={{ borderTop: `1px solid ${COLORS.lightgray}`, paddingTop: "16px", marginBottom: "20px" }}>
            <p style={{ ...TYPO.caps, color: COLORS.midgray, fontFamily: "sans-serif", margin: "0 0 12px" }}>Deine letzten 12 Wochen</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "4px", marginBottom: "6px" }}>
              {rollingWeeks.map((w, i) => {
                const isLast = i === rollingWeeks.length - 1;
                let bg = COLORS.lightgray, border = "none", boxShadow = "none", opacity = 1;
                if (w.beforeFirst) { bg = "#f7f7f5"; opacity = 0.4; }
                else if (w.completed) { bg = COLORS.primary; }
                else { bg = COLORS.lightgray; border = `1.5px dashed ${COLORS.warmgray}`; }
                if (isLast && w.completed) { boxShadow = `0 0 0 2px #fff, 0 0 0 3.5px ${COLORS.accent}`; }
                return <div key={w.key} style={{ aspectRatio: "1", borderRadius: "3px", backgroundColor: bg, border, boxShadow, opacity }} />;
              })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "4px", marginBottom: "10px" }}>
              {rollingWeeks.map((w) => (
                <span key={w.key} style={{ fontSize: "9px", color: COLORS.midgray, fontFamily: "sans-serif", fontWeight: "600", textAlign: "center" }}>{parseInt(w.key.split("-W")[1])}</span>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", fontWeight: "600" }}>{rollingCompletedCount} von 12 abgeschlossen</p>
              <p style={{ fontSize: "14px", color: COLORS.primary, margin: "0", fontWeight: "600" }}>
                {rollingStreak >= 2 ? `${rollingStreak} Wochen in Folge` : ""}
              </p>
            </div>
          </div>

          {/* Impulse */}
          <div style={{ ...styles.impulse, marginTop: "0", marginBottom: "20px" }}>
            <p style={styles.impulseText}>
              {count === 1 ? "Erste Woche geschafft. Der Anfang ist gemacht."
                : count < 4 ? "Die Routine beginnt sich zu formen."
                : count < 8 ? "Du bist mittendrin. Schau dir deine Rückblicke an — erkennst du ein Muster?"
                : count < 12 ? "Die Forschung zeigt: Ab hier wird die Routine zur Gewohnheit."
                : "Das ist nachhaltige Veränderung."}
            </p>
          </div>

          {weekData.nextPlanDate && (
            <p style={{ fontSize: "14px", color: COLORS.midgray, textAlign: "center", marginBottom: "16px", fontStyle: "italic", fontFamily: "'Georgia', serif" }}>
              Nächste Planungsroutine: {formatDateDE(weekData.nextPlanDate)}{weekData.nextPlanTime ? `, ${weekData.nextPlanTime} Uhr` : ""}
            </p>
          )}

          <button onClick={() => { setStep(0); setTimerStart(null); setElapsed(0); }} style={styles.secondaryBtn}>Zurück zur Übersicht</button>

        </div></div>
        <AppFooter onShowInfo={() => setShowInfo(true)} />
      </>
    );
  }

  return null;
}

// ==================== HELPERS ====================
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
      <div><p style={styles.stepPreviewTitle}>{title}</p><p style={styles.stepPreviewDesc}>{desc} · {time}</p></div>
    </div>
  );
}

// ==================== SATISFACTION SLIDER ====================
function SatisfactionSlider({ value, onChange, lowLabel, highLabel }) {
  return (
    <div>
      <div style={styles.sliderValue}>
        {value == null
          ? <span style={styles.sliderEmpty}>– noch nicht bewertet –</span>
          : <span><span style={styles.sliderNum}>{value}</span><span style={styles.sliderMax}>/10</span></span>}
      </div>
      <input type="range" min="1" max="10" step="1" value={value ?? 5} onChange={(e) => onChange(parseInt(e.target.value))} style={styles.rangeInput} />
      <div style={styles.sliderLabels}><span>{lowLabel}</span><span>{highLabel}</span></div>
    </div>
  );
}

// ==================== CHECK ITEM ====================
function CheckItem({ checked, onToggle, boxStyle, boxStyleChecked, children }) {
  return (
    <div onClick={onToggle} style={styles.checkItemRow}>
      <div style={{ ...styles.checkBox, ...boxStyle, ...(checked ? boxStyleChecked : {}) }}>{checked ? "✓" : ""}</div>
      <div style={{ ...styles.checkLabel, ...(checked ? styles.checkLabelChecked : {}) }}>{children}</div>
    </div>
  );
}

// ==================== LEGEND ITEM ====================
function LegendItem({ num, swatchStyle, children }) {
  return (
    <div style={styles.legendItem}>
      <span style={styles.legendNum}>{num}</span>
      <span style={{ ...styles.legendSwatchBase, ...swatchStyle }} />
      {children}
    </div>
  );
}

// ==================== WEEK SCHEMA (Kalenderblatt) ====================
function WeekSchema() {
  const arbeit = (top, height) => ({ position: "absolute", left: 0, right: 0, top, height, backgroundColor: "rgba(0,131,142,0.08)", borderLeft: `3px solid ${COLORS.primary}`, zIndex: 1 });
  const kern = (top, height, label) => ({ style: { position: "absolute", left: "6px", right: "4px", top, height, borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: "9px", fontWeight: "600", padding: "0 3px", textAlign: "center", lineHeight: "1.1", zIndex: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden", backgroundColor: "#fff", color: COLORS.primary, border: `1.5px solid ${COLORS.primary}`, borderLeft: `3px solid ${COLORS.primary}` }, label });
  const fix = (top, height, label) => ({ style: { position: "absolute", left: "6px", right: "4px", top, height, borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: "9px", fontWeight: "600", padding: "0 3px", textAlign: "center", lineHeight: "1.1", zIndex: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden", backgroundColor: "#fff", color: "#7a6b00", border: `1.5px solid ${COLORS.warm}`, borderLeft: `3px solid ${COLORS.warm}` }, label });
  const pause = (top, height, label) => ({ style: { position: "absolute", left: "6px", right: "4px", top, height, borderRadius: "2px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: "9px", fontWeight: "600", padding: "0 3px", textAlign: "center", lineHeight: "1.1", zIndex: 2, boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden", backgroundColor: "rgba(105,240,174,0.32)", color: "#1a6f40", borderLeft: `3px solid ${COLORS.accent}`, fontStyle: "italic" }, label });
  const puffer = (top, height) => ({ position: "absolute", left: "6px", right: "4px", top, height, borderRadius: "2px", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: "8.5px", color: COLORS.primary, fontWeight: "600", fontStyle: "italic", letterSpacing: "0.3px", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(0,131,142,0.22) 4px, rgba(0,131,142,0.22) 5px)" });
  const dayColStyle = { position: "relative", height: "312px", backgroundColor: "#fff", borderRadius: "3px", overflow: "hidden" };

  const days = [
    { label: "Mo", blocks: [
      { t: "fix", top: 24, h: 24, l: "Termin" }, { t: "pause", top: 48, h: 12, l: "Pause" },
      { t: "kern", top: 60, h: 60, l: "Kernaktivität" }, { t: "freizeit", top: 120, h: 24, l: "Mittag" },
      { t: "fix", top: 144, h: 24, l: "Termin" }, { t: "fix", top: 168, h: 36, l: "Termin" },
      { t: "pause", top: 204, h: 12, l: "Pause" },
    ], arbeit: [[24, 96], [144, 120]], puffer: [240, 24] },
    { label: "Di", blocks: [
      { t: "kern", top: 24, h: 60, l: "Kernaktivität" }, { t: "pause", top: 84, h: 12, l: "Pause" },
      { t: "fix", top: 96, h: 24, l: "Termin" }, { t: "freizeit", top: 120, h: 24, l: "Mittag" },
      { t: "fix", top: 144, h: 48, l: "Termin" }, { t: "pause", top: 192, h: 12, l: "Pause" },
      { t: "freizeit", top: 264, h: 36, l: "Sport" },
    ], arbeit: [[24, 96], [144, 120]], puffer: [240, 24] },
    { label: "Mi", blocks: [
      { t: "fix", top: 24, h: 36, l: "Termin" }, { t: "fix", top: 60, h: 36, l: "Termin" },
      { t: "pause", top: 96, h: 12, l: "Pause" }, { t: "fix", top: 108, h: 12, l: "Termin" },
      { t: "freizeit", top: 120, h: 24, l: "Mittag" }, { t: "fix", top: 144, h: 30, l: "Termin" },
      { t: "fix", top: 174, h: 30, l: "Termin" }, { t: "pause", top: 204, h: 12, l: "Pause" },
      { t: "fix", top: 216, h: 24, l: "Termin" },
    ], arbeit: [[24, 96], [144, 120]], puffer: [240, 24] },
    { label: "Do", blocks: [
      { t: "fix", top: 24, h: 36, l: "Termin" }, { t: "pause", top: 60, h: 12, l: "Pause" },
      { t: "kern", top: 72, h: 48, l: "Kernaktivität" }, { t: "freizeit", top: 120, h: 24, l: "Mittag" },
      { t: "kern", top: 144, h: 48, l: "Kernaktivität" }, { t: "pause", top: 192, h: 12, l: "Pause" },
      { t: "fix", top: 216, h: 24, l: "Termin" }, { t: "freizeit", top: 264, h: 36, l: "Konzert" },
    ], arbeit: [[24, 96], [144, 120]], puffer: [240, 24] },
    { label: "Fr", blocks: [
      { t: "kern", top: 24, h: 36, l: "Kernaktivität" }, { t: "pause", top: 84, h: 12, l: "Pause" },
      { t: "fix", top: 96, h: 24, l: "Termin" }, { t: "freizeit", top: 120, h: 24, l: "Mittag" },
      { t: "fix", top: 144, h: 36, l: "Termin" }, { t: "pause", top: 192, h: 12, l: "Pause" },
    ], arbeit: [[24, 96], [144, 96]], puffer: [216, 24] },
  ];

  const renderBlock = (b, i) => {
    const cfg = b.t === "kern" ? kern(`${b.top}px`, `${b.h}px`, b.l)
      : b.t === "fix" ? fix(`${b.top}px`, `${b.h}px`, b.l)
      : pause(`${b.top}px`, `${b.h}px`, b.l);
    return <div key={i} style={cfg.style}>{cfg.label}</div>;
  };

  return (
    <div style={styles.kalenderblatt}>
      <div style={styles.schemaHeader}>
        <span></span>
        {days.map((d) => <span key={d.label}>{d.label}</span>)}
      </div>
      <div style={styles.schemaBody}>
        <div style={styles.schemaTimes}>
          {["7", "9", "11", "13", "15", "17", "19"].map((t) => <span key={t}>{t}</span>)}
        </div>
        {days.map((d, di) => (
          <div key={di} style={dayColStyle}>
            {d.arbeit.map((a, ai) => <div key={ai} style={arbeit(`${a[0]}px`, `${a[1]}px`)} />)}
            {d.blocks.map(renderBlock)}
            <div style={puffer(`${d.puffer[0]}px`, `${d.puffer[1]}px`)}>Puffer</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== HISTORY VIEW (v2) ====================
function HistoryView({ weeks }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const completed = Object.entries(weeks).filter(([, d]) => d.completed).sort(([a], [b]) => b.localeCompare(a));
  const scores = completed.filter(([, d]) => d.planCheckScore).reverse();
  const last12 = scores.slice(-12);

  const streak = (() => {
    if (completed.length === 0) return 0;
    const keys = completed.map(([k]) => k);
    let s = 1;
    for (let i = 0; i < keys.length - 1; i++) {
      if (keys[i + 1] === getPreviousWeekKey(keys[i])) s++;
      else break;
    }
    return s;
  })();

  const avgScore = scores.length > 0
    ? (scores.reduce((sum, [, d]) => sum + d.planCheckScore, 0) / scores.length)
    : null;

  const scoreColor = (s) => {
    if (s >= 8) return COLORS.accent;
    if (s >= 5) return COLORS.primary;
    return COLORS.warmgray;
  };

  const scoreBadgeStyle = (s) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    fontSize: "13px",
    fontWeight: "700",
    flexShrink: 0,
    fontFamily: "sans-serif",
    backgroundColor: s >= 8 ? COLORS.accent : s >= 5 ? COLORS.primary : COLORS.warmgray,
    color: s >= 8 ? COLORS.black : s >= 5 ? "#fff" : COLORS.darktext,
  });

  if (completed.length === 0) {
    return (
      <div style={{ padding: "8px 0" }}>
        <h2 style={{ ...styles.stepTitle, marginBottom: "24px" }}>Dein Verlauf</h2>
        <p style={{ color: COLORS.midgray, textAlign: "center", padding: "40px 0", fontSize: "16px" }}>Noch keine abgeschlossenen Wochen.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 0" }}>
      <h2 style={{ ...styles.stepTitle, marginBottom: "22px" }}>Dein Verlauf</h2>

      {/* Stat header */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <div style={statCard}>
          <p style={statLabel}>Serie</p>
          <div style={statValue}>
            <span style={statNum}>{streak}</span>
            <span style={statUnit}>{streak === 1 ? "Woche" : "Wochen"}</span>
          </div>
          <div style={statBarWrap}>
            <div style={{ ...statBar, width: `${Math.min(streak / 12, 1) * 100}%`, backgroundColor: COLORS.accent }} />
          </div>
        </div>
        {avgScore !== null && (
          <div style={statCard}>
            <p style={statLabel}>Schnitt</p>
            <div style={statValue}>
              <span style={statNum}>{avgScore.toFixed(1).replace(".", ",")}</span>
              <span style={statUnit}>/ 10</span>
            </div>
            <div style={statBarWrap}>
              <div style={{ ...statBar, width: `${(avgScore / 10) * 100}%`, backgroundColor: COLORS.primary }} />
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {scores.length >= 3 && (
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
            <p style={{ fontSize: "16px", fontWeight: "600", color: COLORS.darktext, margin: "0", lineHeight: "1.35" }}>Plan-Umsetzung</p>
            <span style={{ fontSize: "12px", color: COLORS.midgray, fontFamily: "sans-serif", fontWeight: "500" }}>Skala 1–10</span>
          </div>
          <p style={{ fontSize: "14px", color: COLORS.midgray, fontStyle: "italic", margin: "0 0 16px", lineHeight: "1.45" }}>
            Wie gut hat dein Plan zur Realität gepasst?
          </p>

          <div style={{ display: "flex", gap: "8px" }}>
            {/* Y-axis */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "22px", height: "130px", flexShrink: 0 }}>
              {[10, 8, 6, 4, 2].map(n => (
                <span key={n} style={{ fontSize: "11px", color: COLORS.midgray, fontFamily: "sans-serif", lineHeight: "1", fontWeight: "600" }}>{n}</span>
              ))}
            </div>
            {/* Chart area */}
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "8px", height: "130px", borderLeft: `1px solid ${COLORS.lightgray}`, paddingLeft: "8px", position: "relative" }}>
              {[2, 4, 6, 8, 10].map(level => (
                <div key={level} style={{ position: "absolute", left: "8px", right: "0", borderTop: `1px dashed ${COLORS.lightgray}`, height: "0", bottom: `${22 + (level / 10) * 94}px`, pointerEvents: "none" }} />
              ))}
              {last12.map(([key, d]) => (
                <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: COLORS.darktext, fontFamily: "sans-serif", marginBottom: "4px" }}>{d.planCheckScore}</span>
                  <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${(d.planCheckScore / 10) * 94}px`, backgroundColor: scoreColor(d.planCheckScore), minHeight: "4px" }} />
                  <span style={{ fontSize: "11px", color: COLORS.midgray, marginTop: "6px", fontFamily: "sans-serif", fontWeight: "600" }}>{parseInt(key.split("-W")[1])}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "14px", marginTop: "14px", flexWrap: "wrap", fontFamily: "sans-serif", fontSize: "12px", color: COLORS.midgray, fontWeight: "500" }}>
            <div style={legendItem}><span style={{ ...legendSwatch, backgroundColor: COLORS.accent }} />Gut umgesetzt (8–10)</div>
            <div style={legendItem}><span style={{ ...legendSwatch, backgroundColor: COLORS.primary }} />Teilweise (5–7)</div>
            <div style={legendItem}><span style={{ ...legendSwatch, backgroundColor: COLORS.warmgray }} />Wenig (1–4)</div>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ borderTop: `1px solid ${COLORS.lightgray}`, paddingTop: "4px" }}>
        {completed.map(([key, d]) => {
          const isExpanded = expandedKey === key;
          const goals = d.weekGoals?.filter(g => g) || [];
          const preview = goals[0] || (d.weekIntention ? `„${d.weekIntention}"` : "—");
          return (
            <div key={key}>
              <div
                onClick={() => setExpandedKey(isExpanded ? null : key)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 0", borderBottom: isExpanded ? "1px solid transparent" : `1px solid ${COLORS.lightgray}`, cursor: "pointer", minHeight: "44px" }}
              >
                <span style={{ fontSize: "16px", fontWeight: "700", color: COLORS.darktext, minWidth: "60px", fontFamily: "sans-serif" }}>KW {parseInt(key.split("-W")[1])}</span>
                {d.planCheckScore ? (
                  <span style={scoreBadgeStyle(d.planCheckScore)}>{d.planCheckScore}</span>
                ) : (
                  <span style={{ width: "32px", flexShrink: 0 }} />
                )}
                <span style={{ flex: 1, fontSize: "15px", color: COLORS.darktext, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.3" }}>{preview}</span>
                <span style={{ color: COLORS.midgray, fontSize: "20px", fontFamily: "sans-serif", lineHeight: "1", transform: isExpanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s ease" }}>›</span>
              </div>
              {isExpanded && (
                <div style={{ padding: "4px 0 20px 72px", borderBottom: `1px solid ${COLORS.lightgray}` }}>
                  {goals.map((g, i) => <p key={i} style={{ fontSize: "16px", color: COLORS.darktext, margin: "6px 0", lineHeight: "1.45" }}>→ {g}</p>)}
                  {d.weekIntention && (
                    <p style={{ fontSize: "15px", color: COLORS.darktext, fontStyle: "italic", marginTop: "14px", paddingTop: "14px", borderTop: `1px solid ${COLORS.lightgray}`, lineHeight: "1.5" }}>
                      „{d.weekIntention}"
                    </p>
                  )}
                  {d.weekAttention && (
                    <p style={{ fontSize: "14px", color: COLORS.midgray, marginTop: "8px", lineHeight: "1.45" }}>
                      <span style={{ fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700", fontSize: "11px", marginRight: "6px" }}>Aufmerksamkeit:</span>
                      {d.weekAttention}
                    </p>
                  )}
                  {d.planCheckScore && (
                    <p style={{ fontSize: "12px", color: COLORS.midgray, marginTop: "12px", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>
                      Plan-Check {d.planCheckScore}/5{d.planCheckTakeaway ? ` · ${d.planCheckTakeaway}` : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Stat-card style fragments
const statCard = { flex: 1, backgroundColor: COLORS.lightgray, borderRadius: "6px", padding: "14px 14px 16px" };
const statLabel = { fontSize: "11px", fontFamily: "sans-serif", color: COLORS.midgray, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: "700", margin: "0 0 8px" };
const statValue = { display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "8px" };
const statNum = { fontSize: "32px", fontWeight: "600", color: COLORS.darktext, lineHeight: "1", fontFamily: "'Georgia', serif", letterSpacing: "-1px" };
const statUnit = { fontSize: "13px", color: COLORS.midgray, fontFamily: "sans-serif", fontWeight: "500" };
const statBarWrap = { height: "6px", backgroundColor: "#fff", borderRadius: "3px", overflow: "hidden" };
const statBar = { height: "100%", borderRadius: "3px", transition: "width 0.3s ease" };
const legendItem = { display: "flex", alignItems: "center", gap: "5px" };
const legendSwatch = { width: "10px", height: "10px", borderRadius: "2px", display: "inline-block" };

// ==================== STYLES ====================
const styles = {
  container: { minHeight: "100vh", backgroundColor: COLORS.offwhite, display: "flex", justifyContent: "center", padding: "24px 16px", fontFamily: "'Georgia', 'Times New Roman', serif" },
  card: { width: "100%", maxWidth: "520px", backgroundColor: "#fff", borderRadius: "4px", padding: "32px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", alignSelf: "flex-start" },
  topBar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  weekLabel: { ...TYPO.caps, color: COLORS.midgray, fontFamily: "sans-serif" },
  historyBtn: { fontSize: "14px", fontWeight: "500", color: COLORS.primary, background: "none", border: "none", cursor: "pointer", fontFamily: "'Georgia', serif", textDecoration: "underline", textUnderlineOffset: "3px" },
  heroSection: { textAlign: "center", padding: "16px 0 32px" },
  heroTitle: { ...TYPO.display, color: COLORS.black, margin: "0 0 12px", letterSpacing: "-0.5px" },
  heroSub: { fontSize: "16px", color: COLORS.midgray, lineHeight: "1.55", margin: "0", whiteSpace: "pre-line" },
  stepsPreview: { padding: "0 0 32px" },
  stepPreviewItem: { display: "flex", alignItems: "flex-start", gap: "16px", padding: "16px 0", borderBottom: `1px solid ${COLORS.lightgray}` },
  stepPreviewNum: { width: "32px", height: "32px", borderRadius: "50%", backgroundColor: COLORS.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", flexShrink: 0, fontFamily: "sans-serif" },
  stepPreviewTitle: { fontSize: "16px", fontWeight: "600", color: COLORS.darktext, margin: "0 0 2px", lineHeight: "1.35" },
  stepPreviewDesc: { fontSize: "14px", color: COLORS.midgray, margin: "0", lineHeight: "1.45" },
  primaryBtn: { display: "block", width: "100%", padding: "16px", backgroundColor: COLORS.primary, color: "#fff", border: "none", borderRadius: "3px", fontSize: "16px", fontWeight: "500", fontFamily: "'Georgia', serif", cursor: "pointer", letterSpacing: "0.3px" },
  primaryBtnSmall: { padding: "12px 24px", backgroundColor: COLORS.primary, color: "#fff", border: "none", borderRadius: "3px", fontSize: "16px", fontWeight: "500", fontFamily: "'Georgia', serif", cursor: "pointer" },
  secondaryBtn: { padding: "12px 20px", backgroundColor: "transparent", color: COLORS.midgray, border: `1px solid ${COLORS.warmgray}`, borderRadius: "3px", fontSize: "16px", fontFamily: "'Georgia', serif", cursor: "pointer" },
  badge: { display: "inline-block", padding: "8px 20px", borderRadius: "3px", fontSize: "14px", fontWeight: "600", fontFamily: "sans-serif" },
  impulse: { marginTop: "24px", padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderLeft: `3px solid ${COLORS.warm}` },
  impulseText: { fontSize: "16px", color: COLORS.darktext, lineHeight: "1.55", margin: "0", fontStyle: "italic" },
  stepHeader: { marginBottom: "24px", borderBottom: `1px solid ${COLORS.lightgray}`, paddingBottom: "16px" },
  stepIndicator: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  stepNum: { ...TYPO.caps, color: COLORS.midgray, fontFamily: "sans-serif" },
  stepTime: { fontSize: "14px", color: COLORS.primary, fontFamily: "monospace", fontWeight: "600" },
  stepTitle: { ...TYPO.title, color: COLORS.black, margin: "0 0 4px" },
  stepTimeHint: { fontSize: "14px", color: COLORS.midgray, margin: "0", lineHeight: "1.45" },
  stepIntro: { fontSize: "16px", color: COLORS.darktext, lineHeight: "1.55", margin: "0 0 24px" },
  fingerTabs: { display: "flex", gap: "8px", marginBottom: "24px", justifyContent: "center" },
  fingerTab: { width: "44px", height: "44px", borderRadius: "50%", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s ease", fontFamily: "sans-serif" },
  fingerContent: { minHeight: "160px" },
  fingerTitle: { ...TYPO.heading, color: COLORS.darktext, margin: "0 0 4px" },
  fingerPrompt: { fontSize: "16px", color: COLORS.midgray, margin: "0 0 12px", fontStyle: "italic", lineHeight: "1.5" },
  textarea: { width: "100%", padding: "12px 14px", border: `1px solid ${COLORS.warmgray}`, borderRadius: "3px", fontSize: "16px", fontFamily: "'Georgia', serif", lineHeight: "1.55", resize: "vertical", color: COLORS.darktext, backgroundColor: COLORS.offwhite, outline: "none", boxSizing: "border-box" },
  fingerNav: { display: "flex", alignItems: "center", marginTop: "32px", gap: "12px" },
  fieldGroup: { marginBottom: "24px" },
  label: { display: "block", fontSize: "16px", fontWeight: "600", color: COLORS.darktext, marginBottom: "10px", lineHeight: "1.4" },
  scaleRow: { display: "flex", gap: "6px" },
  scaleBtn: { flex: 1, padding: "10px 4px", border: "none", borderRadius: "3px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", transition: "all 0.15s ease", fontFamily: "sans-serif" },
  prevGoals: { padding: "16px", backgroundColor: COLORS.lightgray, borderRadius: "3px", marginBottom: "24px" },
  prevGoalsLabel: { ...TYPO.caps, color: COLORS.midgray, margin: "0 0 8px", fontFamily: "sans-serif" },
  prevGoalItem: { fontSize: "16px", color: COLORS.darktext, margin: "4px 0", lineHeight: "1.5" },
  reminder: { padding: "16px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderLeft: `3px solid ${COLORS.primary}`, marginBottom: "24px" },
  reminderLabel: { ...TYPO.caps, color: COLORS.midgray, margin: "0 0 6px", fontFamily: "sans-serif" },
  reminderText: { fontSize: "16px", color: COLORS.darktext, margin: "0", fontStyle: "italic", lineHeight: "1.5" },
  checklist: { padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px", marginBottom: "20px" },
  checkItem: { fontSize: "16px", color: COLORS.darktext, margin: "8px 0", lineHeight: "1.5" },
  goalRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" },
  goalNum: { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: COLORS.lightgray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: COLORS.midgray, fontWeight: "600", flexShrink: 0, fontFamily: "sans-serif" },
  goalInput: { flex: 1, padding: "10px 14px", border: `1px solid ${COLORS.warmgray}`, borderRadius: "3px", fontSize: "16px", fontFamily: "'Georgia', serif", color: COLORS.darktext, backgroundColor: COLORS.offwhite, outline: "none" },
  doneSection: { textAlign: "center", padding: "24px 0" },
  doneCheck: { width: "56px", height: "56px", borderRadius: "50%", backgroundColor: COLORS.accent, color: COLORS.black, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "600", marginBottom: "16px" },
  doneTitle: { fontSize: "24px", fontWeight: "400", color: COLORS.black, margin: "0 0 4px", lineHeight: "1.25" },
  doneTime: { fontSize: "14px", color: COLORS.midgray, margin: "0 0 28px" },
  doneSummary: { textAlign: "left", padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px", marginBottom: "16px" },
  doneSummaryLabel: { ...TYPO.caps, color: COLORS.midgray, margin: "0 0 8px", fontFamily: "sans-serif" },
  doneSummaryItem: { fontSize: "16px", color: COLORS.darktext, margin: "6px 0", lineHeight: "1.5" },
  doneIntention: { padding: "16px 20px", backgroundColor: COLORS.lightgray, borderRadius: "3px", marginBottom: "16px" },
  doneIntentionText: { fontSize: "16px", color: COLORS.darktext, margin: "0", fontStyle: "italic", lineHeight: "1.5" },
  doneProgress: { marginBottom: "28px" },
  doneProgressText: { fontSize: "14px", color: COLORS.darktext, marginBottom: "12px" },
  progressBar: { height: "6px", backgroundColor: COLORS.warmgray, borderRadius: "3px", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: "3px", transition: "width 0.5s ease" },
  progressLabels: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: COLORS.midgray, marginTop: "4px", fontFamily: "sans-serif", fontWeight: "500" },

  // ---- Neu: Checkliste mit farbigen Boxen ----
  checklistTitle: { fontSize: "12px", fontWeight: "700", color: COLORS.midgray, textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif", margin: "0 0 12px" },
  checkItemRow: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "8px 0", cursor: "pointer", userSelect: "none" },
  checkBox: { width: "22px", height: "22px", borderRadius: "3px", backgroundColor: "#fff", flexShrink: 0, marginTop: "1px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: "14px", fontWeight: "700", lineHeight: 1, color: "#fff" },
  checkLabel: { fontSize: "15px", lineHeight: "1.5", color: COLORS.darktext },
  checkLabelChecked: { color: COLORS.midgray, textDecoration: "line-through", textDecorationColor: COLORS.warmgray },

  cboxArbeit: { backgroundColor: "rgba(0,131,142,0.08)", borderLeft: `3px solid ${COLORS.primary}` },
  cboxArbeitChecked: { backgroundColor: COLORS.primary },
  cboxPause: { backgroundColor: "rgba(105,240,174,0.32)", borderLeft: `3px solid ${COLORS.accent}` },
  cboxPauseChecked: { backgroundColor: COLORS.accent, color: "#1a6f40" },
  cboxFix: { backgroundColor: "#fff", border: `1.5px solid ${COLORS.warm}`, borderLeft: `3px solid ${COLORS.warm}` },
  cboxFixChecked: { backgroundColor: COLORS.warm, color: "#5c5000" },
  cboxKern: { backgroundColor: "#fff", border: `1.5px solid ${COLORS.primary}`, borderLeft: `3px solid ${COLORS.primary}` },
  cboxKernChecked: { backgroundColor: COLORS.primary },
  cboxPuffer: { backgroundColor: "#fff", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,131,142,0.35) 3px, rgba(0,131,142,0.35) 4px)", border: "1.5px solid rgba(0,131,142,0.4)" },
  cboxPufferChecked: { backgroundColor: COLORS.primary, backgroundImage: "none" },
  cboxNeutral: { backgroundColor: "#fff", border: `2px solid ${COLORS.warmgray}` },
  cboxNeutralChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  // ---- Neu: Kalenderblatt (Wochen-Schema) ----
  kalenderblatt: { backgroundColor: "#fff", border: `1px solid ${COLORS.lightgray}`, borderRadius: "6px", padding: "14px 12px 12px", marginBottom: "20px" },
  schemaHeader: { display: "grid", gridTemplateColumns: "36px repeat(5, 1fr)", gap: "5px", marginBottom: "4px", fontFamily: "sans-serif", fontSize: "10px", fontWeight: "700", color: COLORS.midgray, textAlign: "center", letterSpacing: "0.5px", textTransform: "uppercase" },
  schemaBody: { display: "grid", gridTemplateColumns: "36px repeat(5, 1fr)", gap: "5px", position: "relative" },
  schemaTimes: { display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2px 0", height: "312px", fontFamily: "sans-serif", fontSize: "10px", fontWeight: "500", color: COLORS.midgray, textAlign: "right", paddingRight: "3px" },

  // ---- Neu: Der Rahmen (Legende) ----
  rahmenBlock: { backgroundColor: COLORS.lightgray, borderRadius: "3px", padding: "16px 20px", marginBottom: "20px" },
  rahmenGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", fontFamily: "sans-serif" },
  legendItem: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: COLORS.darktext, lineHeight: "1.4" },
  legendNum: { fontFamily: "sans-serif", fontSize: "10px", fontWeight: "700", color: COLORS.primary, width: "12px", display: "inline-block" },
  legendSwatchBase: { width: "15px", height: "15px", borderRadius: "2px", flexShrink: 0, display: "inline-block" },

  // ---- Neu: Zufriedenheits-Slider ----
  satisfactionBox: { backgroundColor: "#fff", border: `1px solid ${COLORS.warmgray}`, borderRadius: "3px", padding: "20px 22px 18px", marginBottom: "24px" },
  satisfactionQuestion: { fontSize: "16px", fontWeight: "600", margin: "0 0 18px", lineHeight: "1.4" },
  sliderValue: { textAlign: "center", marginBottom: "8px", minHeight: "34px" },
  sliderEmpty: { fontSize: "15px", color: COLORS.midgray, fontStyle: "italic" },
  sliderNum: { fontSize: "32px", fontWeight: "600", color: COLORS.primary, letterSpacing: "-1px", fontFamily: "'Georgia', serif" },
  sliderMax: { fontSize: "15px", color: COLORS.midgray, marginLeft: "2px" },
  rangeInput: { width: "100%", height: "6px", borderRadius: "3px", outline: "none", cursor: "pointer", accentColor: COLORS.primary },
  sliderLabels: { display: "flex", justifyContent: "space-between", marginTop: "8px", fontFamily: "sans-serif", fontSize: "11px", color: COLORS.midgray, fontWeight: "500" },
  sectionHeading: { fontSize: "18px", fontWeight: "600", color: COLORS.black, margin: "4px 0 16px", lineHeight: "1.3" },
};
