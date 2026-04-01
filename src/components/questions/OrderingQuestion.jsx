export default function OrderingQuestion({ q, orderSelected, clearOrdering, pickOrdering, s, T }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={s.orderLabel}>Your order ({orderSelected.length}/{q.correctOrder.length}):</div>
        {orderSelected.length > 0 && (
          <button style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 12, fontFamily: "monospace" }} onClick={clearOrdering}>
            clear
          </button>
        )}
      </div>
      <div style={s.orderChips}>
        {orderSelected.length === 0
          ? <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>Tap items below to build your sequence...</div>
          : orderSelected.map((item, i) => (
            <div key={item} style={s.orderChip()}>
              <span style={{ fontSize: 10, color: T.muted, fontFamily: "monospace" }}>{i + 1}.</span>{item}
            </div>
          ))
        }
      </div>
      <div style={s.orderGrid}>
        {q.options.map((item) => {
          const sel = orderSelected.includes(item);
          return (
            <button key={item} style={s.orderBtn(sel)} onClick={() => pickOrdering(item)}>
              {sel && <div style={s.orderBadge}>{orderSelected.indexOf(item) + 1}</div>}
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
