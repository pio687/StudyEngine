export default function StandardQuestion({ q, ua, select, s, T, lm, mobile }) {
  return (
    <>
      {q.type === "tf" && (
        <div style={s.tfRow}>
          {[true, false].map((v) => (
            <button key={String(v)} style={s.tfBtn(ua === v)} onClick={() => select(v)}>
              {v ? "TRUE" : "FALSE"}
            </button>
          ))}
        </div>
      )}
      {(q.type === "mc" || q.type === "def") && (
        <div style={s.opts}>
          {q.options.map((opt, i) => {
            const sel = ua === i;
            return (
              <button key={i} style={s.opt(sel)} onClick={() => select(i)}>
                <div style={s.dot(sel)}>{sel ? "✓" : ""}</div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
