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

// Centralized typography scale. Use spread: style={{ ...TYPO.body, color: COLORS.darktext }}
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
          <p style={ip}>Die Routine besteht aus drei Schritten: Erst die Woche reflektieren und abschließen, dann den Terminplan aktualisieren, dann die Aufgabenliste organisieren.</p>
          <p style={ip}><strong>Schritt 1 — Die Woche reflektieren (~10 Min):</strong> 5-Finger-Reflexion und Plan-Check. Wie war die Woche? Wie gut hat der Plan zur Realität gepasst?</p>
          <p style={ip}><strong>Schritt 2 — Den Terminplan aktualisieren (~10 Min):</strong> Mit dem 5-Elemente-Stundenplan die kommende Woche strukturieren: Arbeitszeiten, Pausen, Fixtermine, Kernaktivitäten, Zeitpuffer.</p>
          <p style={ip}><strong>Schritt 3 — Die Aufgabenliste organisieren (~10 Min):</strong> Nach dem Kanban-Prinzip: Sammeln, Organisieren, Erledigen. Abschluss mit Vorhaben und Haltung für die Woche.</p>
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
  // Steps: -1=welcome, 0=start, 1=finger, 2=plancheck, 3=terminplan, 4=aufgabenliste, 5=vorhaben, 6=done
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
    weekGoals: ["", "", ""], weekIntention: "", weekAttention: "",
    nextPlanDate: getNextSunday(), nextPlanTime: "09:00",
    completed: false,
  });

  const startRoutine = () => { const data = weekData || initWeekData(); setWeekData(data); setStep(1); setTimerStart(Date.now()); };
  const updateField = (field, value) => setWeekData({ ...weekData, [field]: value });
  const updateFinger = (i, v) => { const f = [...weekData.fingers]; f[i] = v; updateField("fingers", f); };
  const updateGoal = (i, v) => { const g = [...weekData.weekGoals]; g[i] = v; updateField("weekGoals", g); };
  const nextStep = async (to) => { await saveData(weekData); setStep(to); };
  const finishRoutine = async () => { const final = { ...weekData, completed: true, completedAt: new Date().toISOString(), durationSeconds: elapsed }; await saveData(final); setStep(6); };
  const getCompletedWeeks = () => Object.entries(allWeeks).filter(([, d]) => d.completed).sort(([a], [b]) => b.localeCompare(a));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(allWeeks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `wochenroutine-backup-${getWeekKey()}.json`; a.click(); URL.revokeObjectURL(url);
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
            <p style={{ fontSize: "16px", color: COLORS.midgray, lineHeight: "1.55", margin: "20px 0 0", whiteSpace: "pre-line", fontFamily: "'Georgia', serif" }}>{"30 Minuten pro Woche.\nReflektieren. Planen. Organisieren."}</p>
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
              {completedCount > 0 && <button onClick={() => setHistoryOpen(!historyOpen)} style={styles.historyBtn}>{historyOpen ? "Schließen" : `Verlauf (${completedCount})`}</button>}
            </div>
            {historyOpen ? <HistoryView weeks={allWeeks} /> : (
              <>
                <div style={styles.heroSection}>
                  <h1 style={styles.heroTitle}>3×3 Wochenroutine <BetaBadge /></h1>
                  <p style={styles.heroSub}>{"30 Minuten für deine Woche.\nReflektieren. Planen. Organisieren."}</p>
                </div>
                <div style={styles.stepsPreview}>
                  <StepPreview num="1" title="Die Woche reflektieren" time="~10 Min" desc="Rückblick und Abschluss" />
                  <StepPreview num="2" title="Den Terminplan aktualisieren" time="~10 Min" desc="Stundenplan für die neue Woche" />
                  <StepPreview num="3" title="Die Aufgabenliste organisieren" time="~10 Min" desc="Aufgaben ordnen, Haltung setzen" />
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
        <StepHeader step="1" title="Die Woche reflektieren" timeHint="5-Finger-Reflexion · ~7 Min" elapsed={elapsed} formatTime={formatTime} />
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
        <StepHeader step="1" title="Die Woche reflektieren" timeHint="Plan-Check · ~3 Min" elapsed={elapsed} formatTime={formatTime} />
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
              <button key={s.value} onClick={() => updateField("planCheckScore", s.value)} style={{ ...styles.scaleBtn, backgroundColor: weekData.planCheckScore === s.value ? COLORS.primary : COLORS.lightgray, color: weekData.planCheckScore === s.value ? "#fff" : COLORS.darktext }}>
                <span style={{ fontSize: "16px", fontWeight: "600" }}>{s.value}</span>
                <span style={{ fontSize: "12px", marginTop: "4px", fontWeight: "500" }}>{s.label}</span>
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
          <button onClick={() => nextStep(3)} style={styles.primaryBtnSmall}>Zum Terminplan →</button>
        </div>
      </div></div>
    );
  }

  // ==================== STEP 2: TERMINPLAN AKTUALISIEREN ====================
  if (step === 3) {
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="2" title="Den Terminplan aktualisieren" timeHint="~10 Minuten" elapsed={elapsed} formatTime={formatTime} />

        {weekData.planCheckTakeaway && (
          <div style={styles.reminder}>
            <p style={styles.reminderLabel}>Dein Vorsatz aus dem Plan-Check:</p>
            <p style={styles.reminderText}>„{weekData.planCheckTakeaway}"</p>
          </div>
        )}

        <p style={styles.stepIntro}>Öffne deinen Kalender und aktualisiere deinen Stundenplan für die nächste Woche. Ein guter Wochenplan berücksichtigt fünf Elemente:</p>

        <div style={styles.checklist}>
          <p style={styles.checkItem}><strong style={{ color: COLORS.primary }}>1.</strong> <strong>Arbeitszeiten</strong> — wann beginnt dein Tag, wann endet er</p>
          <p style={styles.checkItem}><strong style={{ color: COLORS.primary }}>2.</strong> <strong>Pausen und Freizeit</strong> — bewusst eingeplant, nicht als Restposten</p>
          <p style={styles.checkItem}><strong style={{ color: COLORS.primary }}>3.</strong> <strong>Fixtermine</strong> — Besprechungen, Verpflichtungen</p>
          <p style={styles.checkItem}><strong style={{ color: COLORS.primary }}>4.</strong> <strong>Kernaktivitäten</strong> — feste Zeitblöcke für deine wichtigsten Tätigkeiten</p>
          <p style={{ ...styles.checkItem, borderTop: `1px solid ${COLORS.warmgray}`, paddingTop: "8px", marginTop: "8px" }}><strong style={{ color: COLORS.primary }}>5.</strong> <strong>Zeitpuffer</strong> — mindestens eine Stunde pro Tag unverplant lassen</p>
        </div>

        <SmartTipp>
          Bau dir einmal einen 5-Elemente-Stundenplan für deine typische Woche. Im Rahmen der Wochenplanung passt du ihn nur noch an — du musst die Woche nicht jedes Mal neu erfinden.
        </SmartTipp>

        <p style={{ fontSize: "16px", color: COLORS.midgray, lineHeight: "1.55", margin: "0 0 0", fontStyle: "italic" }}>
          Das Ergebnis: dein Terminplan für die nächste Woche.
        </p>

        <div style={styles.fingerNav}>
          <button onClick={() => setStep(2)} style={styles.secondaryBtn}>Zurück</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => nextStep(4)} style={styles.primaryBtnSmall}>Zur Aufgabenliste →</button>
        </div>
      </div></div>
    );
  }

  // ==================== STEP 3a: AUFGABENLISTE ORGANISIEREN ====================
  if (step === 4) {
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="3" title="Die Aufgabenliste organisieren" timeHint="~10 Minuten" elapsed={elapsed} formatTime={formatTime} />

        <p style={styles.stepIntro}>Wie deine Termine einen fixen Platz haben — den Kalender — so brauchen auch deine Aufgaben einen fixen Ort. Organisiere deine Aufgabenliste nach dem Kanban-Prinzip mit drei Spalten:</p>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "130px", padding: "14px 12px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderTop: `3px solid ${COLORS.midgray}` }}>
            <p style={{ fontSize: "13px", color: COLORS.midgray, margin: "0 0 6px", fontWeight: "700", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Aufgabenspeicher</p>
            <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", lineHeight: "1.5" }}>Alles was anfällt, landet zuerst hier.</p>
          </div>
          <div style={{ flex: 1, minWidth: "130px", padding: "14px 12px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderTop: `3px solid ${COLORS.primary}` }}>
            <p style={{ fontSize: "13px", color: COLORS.primary, margin: "0 0 6px", fontWeight: "700", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Diese Woche</p>
            <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", lineHeight: "1.5" }}>Was du diese Woche erledigen willst.</p>
          </div>
          <div style={{ flex: 1, minWidth: "130px", padding: "14px 12px", backgroundColor: COLORS.lightgray, borderRadius: "3px", borderTop: `3px solid ${COLORS.accent}` }}>
            <p style={{ fontSize: "13px", color: COLORS.darktext, margin: "0 0 6px", fontWeight: "700", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: "0.5px" }}>Heute</p>
            <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", lineHeight: "1.5" }}>Was heute dran ist. Nicht mehr.</p>
          </div>
        </div>

        <div style={styles.checklist}>
          <p style={{ fontSize: "13px", color: COLORS.midgray, margin: "0 0 8px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "sans-serif" }}>Jetzt in deinem Tool:</p>
          <p style={styles.checkItem}>○ Lösche oder delegiere, was nicht mehr relevant ist</p>
          <p style={styles.checkItem}>○ Achte auf selbsterklärende Formulierungen</p>
          <p style={styles.checkItem}>○ Weise den Aufgaben konkrete Zeitabschätzungen zu</p>
          <p style={styles.checkItem}>○ Verschiebe Aufgaben in die Spalte „Diese Woche"</p>
        </div>

        <SmartTipp>
          Collect — Organize — Do: Zuerst sammeln, dann organisieren, dann erledigen. Die Aufgaben wandern Schritt für Schritt von links nach rechts.
        </SmartTipp>

        <p style={{ fontSize: "16px", color: COLORS.midgray, lineHeight: "1.55", margin: "0", fontStyle: "italic" }}>
          Das Ergebnis: eine übersichtliche Liste — geordnet nach Woche und Tag, bereit zur Umsetzung.
        </p>

        <div style={styles.fingerNav}>
          <button onClick={() => setStep(3)} style={styles.secondaryBtn}>Zurück</button>
          <div style={{ flex: 1 }} />
          <button onClick={() => nextStep(5)} style={styles.primaryBtnSmall}>Vorhaben & Haltung →</button>
        </div>
      </div></div>
    );
  }

  // ==================== STEP 3b: VORHABEN & HALTUNG ====================
  if (step === 5) {
    return (
      <div style={styles.container}><div style={styles.card}>
        <StepHeader step="3" title="Vorhaben & Haltung" timeHint="" elapsed={elapsed} formatTime={formatTime} />
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
    return (
      <>
        <div style={styles.container}><div style={styles.card}>

          {/* Confirmation */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={styles.doneCheck}>✓</div>
            <h2 style={styles.doneTitle}>Woche geplant.</h2>
            <p style={styles.doneTime}>{formatTime(elapsed)} Minuten</p>
          </div>

          {/* Vorhaben summary */}
          {weekData.weekGoals.filter(g => g).length > 0 && (
            <div style={styles.doneSummary}>
              <p style={styles.doneSummaryLabel}>Deine Vorhaben:</p>
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

          {/* Streak / 12 week grid */}
          <div style={{ borderTop: `1px solid ${COLORS.lightgray}`, paddingTop: "16px", marginBottom: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "3px", marginBottom: "8px" }}>
              {Array.from({ length: 12 }, (_, i) => {
                const weekKeys = Object.keys(allWeeks).filter(k => allWeeks[k].completed).sort();
                const startIdx = Math.max(0, weekKeys.length - 12);
                const relevantKeys = weekKeys.slice(startIdx);
                const isCurrent = i === Math.min(count, 11);
                const isCompleted = i < count;
                return (
                  <div key={i} style={{
                    aspectRatio: "1",
                    borderRadius: "3px",
                    backgroundColor: isCompleted ? COLORS.primary : isCurrent ? "transparent" : COLORS.lightgray,
                    border: isCurrent && !isCompleted ? `1.5px dashed ${COLORS.midgray}` : "none",
                  }} />
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: "14px", color: COLORS.darktext, margin: "0", fontWeight: "600" }}>{count} von 12 Wochen</p>
              <p style={{ fontSize: "14px", color: COLORS.primary, margin: "0", fontWeight: "600" }}>
                {count >= 2 ? `${(() => {
                  const keys = Object.keys(allWeeks).filter(k => allWeeks[k].completed).sort().reverse();
                  let streak = 1;
                  for (let i = 0; i < keys.length - 1; i++) {
                    const curr = keys[i];
                    const prev = getPreviousWeekKey(curr);
                    if (keys[i + 1] === prev) streak++;
                    else break;
                  }
                  return streak;
                })()} Wochen in Folge` : ""}
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

function HistoryView({ weeks }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const completed = Object.entries(weeks).filter(([, d]) => d.completed).sort(([a], [b]) => b.localeCompare(a));
  const scores = completed.filter(([, d]) => d.planCheckScore).reverse();
  const last12 = scores.slice(-12);

  // Aggregated stats
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
    if (s >= 4) return COLORS.accent;
    if (s >= 3) return COLORS.primary;
    return COLORS.warmgray;
  };

  const scoreBadgeStyle = (s) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    fontSize: "14px",
    fontWeight: "700",
    flexShrink: 0,
    fontFamily: "sans-serif",
    backgroundColor: s >= 4 ? COLORS.accent : s >= 3 ? COLORS.primary : COLORS.warmgray,
    color: s >= 4 ? COLORS.black : s >= 3 ? "#fff" : COLORS.darktext,
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
              <span style={statUnit}>/ 5</span>
            </div>
            <div style={statBarWrap}>
              <div style={{ ...statBar, width: `${(avgScore / 5) * 100}%`, backgroundColor: COLORS.primary }} />
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {scores.length >= 3 && (
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
            <p style={{ fontSize: "16px", fontWeight: "600", color: COLORS.darktext, margin: "0", lineHeight: "1.35" }}>Plan-Umsetzung</p>
            <span style={{ fontSize: "12px", color: COLORS.midgray, fontFamily: "sans-serif", fontWeight: "500" }}>Skala 1–5</span>
          </div>
          <p style={{ fontSize: "14px", color: COLORS.midgray, fontStyle: "italic", margin: "0 0 16px", lineHeight: "1.45" }}>
            Wie gut hat dein Plan zur Realität gepasst?
          </p>

          <div style={{ display: "flex", gap: "8px" }}>
            {/* Y-axis */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: "22px", height: "130px", flexShrink: 0 }}>
              {[5, 4, 3, 2, 1].map(n => (
                <span key={n} style={{ fontSize: "11px", color: COLORS.midgray, fontFamily: "sans-serif", lineHeight: "1", fontWeight: "600" }}>{n}</span>
              ))}
            </div>
            {/* Chart area */}
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "8px", height: "130px", borderLeft: `1px solid ${COLORS.lightgray}`, paddingLeft: "8px", position: "relative" }}>
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} style={{ position: "absolute", left: "8px", right: "0", borderTop: `1px dashed ${COLORS.lightgray}`, height: "0", bottom: `${22 + (level - 1) * 23.5}px`, pointerEvents: "none" }} />
              ))}
              {last12.map(([key, d]) => (
                <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", position: "relative", zIndex: 1 }}>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: COLORS.darktext, fontFamily: "sans-serif", marginBottom: "4px" }}>{d.planCheckScore}</span>
                  <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${(d.planCheckScore / 5) * 94}px`, backgroundColor: scoreColor(d.planCheckScore), minHeight: "4px" }} />
                  <span style={{ fontSize: "11px", color: COLORS.midgray, marginTop: "6px", fontFamily: "sans-serif", fontWeight: "600" }}>{parseInt(key.split("-W")[1])}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "14px", marginTop: "14px", flexWrap: "wrap", fontFamily: "sans-serif", fontSize: "12px", color: COLORS.midgray, fontWeight: "500" }}>
            <div style={legendItem}><span style={{ ...legendSwatch, backgroundColor: COLORS.accent }} />Gut umgesetzt (4–5)</div>
            <div style={legendItem}><span style={{ ...legendSwatch, backgroundColor: COLORS.primary }} />Teilweise (3)</div>
            <div style={legendItem}><span style={{ ...legendSwatch, backgroundColor: COLORS.warmgray }} />Wenig (1–2)</div>
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

// Stat-card style fragments for HistoryView
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
  chartSection: { marginBottom: "28px" },
  miniChart: { display: "flex", alignItems: "flex-end", gap: "6px", height: "100px", padding: "8px 0" },
  chartCol: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" },
  chartBar: { width: "100%", maxWidth: "32px", borderRadius: "2px 2px 0 0", transition: "height 0.3s ease" },
  chartLabel: { fontSize: "11px", color: COLORS.midgray, marginTop: "6px", fontFamily: "sans-serif", fontWeight: "600" },
  historyCard: { padding: "16px 0", borderBottom: `1px solid ${COLORS.lightgray}` },
  historyHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  historyWeek: { fontSize: "16px", fontWeight: "700", color: COLORS.darktext },
  historyScore: { fontSize: "14px", color: COLORS.primary, fontFamily: "sans-serif", fontWeight: "600" },
  historyGoal: { fontSize: "16px", color: COLORS.darktext, margin: "4px 0", lineHeight: "1.5" },
  historyIntention: { fontSize: "15px", color: COLORS.darktext, fontStyle: "italic", marginTop: "10px", lineHeight: "1.5" },
};
