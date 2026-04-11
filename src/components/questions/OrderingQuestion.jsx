import styles from "./OrderingQuestion.module.css";

export default function OrderingQuestion({ q, orderSelected, clearOrdering, pickOrdering }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div className={styles.orderLabel}>Your order ({orderSelected.length}/{q.correctOrder.length}):</div>
        {orderSelected.length > 0 && (
          <button style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 12, fontFamily: "monospace" }} onClick={clearOrdering}>
            clear
          </button>
        )}
      </div>
      <div className={styles.orderChips}>
        {orderSelected.length === 0
          ? <div style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>Tap items below to build your sequence...</div>
          : orderSelected.map((item, i) => (
            <div key={item} className={styles.orderChip}>
              <span style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>{i + 1}.</span>{item}
            </div>
          ))
        }
      </div>
      <div className={styles.orderGrid}>
        {q.options.map((item) => {
          const sel = orderSelected.includes(item);
          return (
            <button key={item} className={sel ? `${styles.orderBtn} ${styles.orderBtnSelected}` : styles.orderBtn} onClick={() => pickOrdering(item)}>
              {sel && <div className={styles.orderBadge}>{orderSelected.indexOf(item) + 1}</div>}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
