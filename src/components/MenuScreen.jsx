import sharedStyles from './Shared.module.css';
import styles from './MenuScreen.module.css';

export default function MenuScreen({
  QUIZ_SUBJECT,
  QUIZ_TITLE,
  resumeSession,
  resumeSessionNum,
  selectMode,
  lightMode,
  toggleLight,
  goToBank,
}) {
  return (
    <div className={sharedStyles.app}>
      <div className={sharedStyles.wrap}>
        <div className={sharedStyles.logo}>
          <div className={sharedStyles.logoTop}>{QUIZ_SUBJECT}</div>
          <div className={sharedStyles.logoTitle}>{QUIZ_TITLE}</div>
        </div>

        {resumeSession && (
          <div className={styles.resumeBanner}>
            <div className={styles.resumeTitle}>Welcome back 👋</div>
            <div className={styles.resumeText}>
              Session {resumeSessionNum} is ready. Click Study Mode to continue
              where you left off.
            </div>
          </div>
        )}

        <div className={styles.buttonGroup}>
          <button onClick={() => selectMode("study")} className={`${styles.modeButton} ${styles.studyButton}`}>
            <div className={`${styles.modeTitle} ${styles.studyTitle}`}>
              📚 Study Mode
              {resumeSession && (
                <span className={styles.sessionBadge}>Session {resumeSessionNum}</span>
              )}
            </div>
            <div className={styles.modeDesc}>
              Full mastery system · Confidence tracking · 3-session structure with sleep breaks · Highest retention
            </div>
          </button>
          
          <button onClick={() => selectMode("practice")} className={`${styles.modeButton} ${styles.practiceButton}`}>
            <div className={`${styles.modeTitle} ${styles.practiceTitle}`}>⚡ Practice Mode</div>
            <div className={styles.modeDesc}>
              Answer every question correctly once · No session structure · Single run to completion
            </div>
          </button>
        </div>
        
        <div style={{ textAlign:"center", marginTop:8, fontSize:11, color:"var(--muted)", fontFamily:"monospace", display:"flex", justifyContent:"center", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ cursor:"pointer", textDecoration:"underline" }} onClick={goToBank}>question bank</span>
          <label className={styles.toggleLabel}>
            <input type="checkbox" checked={lightMode} onChange={toggleLight} style={{ cursor: "pointer" }} />
            light mode
          </label>
        </div>

      </div>
    </div>
  );
}
