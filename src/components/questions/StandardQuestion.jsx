import styles from "./StandardQuestion.module.css";

export default function StandardQuestion({ q, ua, select }) {
  return (
    <>
      {q.type === "tf" && (
        <div className={styles.tfRow}>
          {[true, false].map((v) => (
            <button key={String(v)} className={ua === v ? `${styles.tfBtn} ${styles.tfBtnSelected}` : styles.tfBtn} onClick={() => select(v)}>
              {v ? "TRUE" : "FALSE"}
            </button>
          ))}
        </div>
      )}
      {(q.type === "mc" || q.type === "def") && (
        <div className={styles.opts}>
          {q.options.map((opt, i) => {
            const sel = ua === i;
            return (
              <button key={i} className={sel ? `${styles.opt} ${styles.optSelected}` : styles.opt} onClick={() => select(i)}>
                <div className={sel ? `${styles.dot} ${styles.dotSelected}` : styles.dot}>{sel ? "✓" : ""}</div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
