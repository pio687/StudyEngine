export function getAnswerDisplay(q, a) {
  let ua = "—", ca = "";
  if (q.type==="tf")                    { ua=a===undefined?"—":a?"True":"False"; ca=q.answer?"True":"False"; }
  else if (q.type==="mc"||q.type==="def") { ua=a!==undefined?q.options[a]:"—"; ca=q.options[q.answer]; }
  else if (q.type==="calc")             { ua=a??"—"; ca=q.answerDisplay; }
  else if (q.type==="fitb")             { ua=a??"—"; ca=q.accepted[0]; }
  else if (q.type==="ordering")         { ua=Array.isArray(a)?a.join(" → "):"—"; ca=q.correctOrder.join(" → "); }
  else if (q.type==="match")            { ua="(matching answer)"; ca="All pairs matched"; }
  return { ua, ca };
}

export function getWrongAnswerDisplay(q, a) {
  let ua = "No answer", ca = "";
  if (q.type==="tf")                    { ua=a===undefined?"No answer":a?"True":"False"; ca=q.answer?"True":"False"; }
  else if (q.type==="mc"||q.type==="def") { ua=a!==undefined?q.options[a]:"No answer"; ca=q.options[q.answer]; }
  else if (q.type==="calc")             { ua=a??"No answer"; ca=q.answerDisplay; }
  else if (q.type==="fitb")             { ua=a??"No answer"; ca=q.accepted[0]; }
  else if (q.type==="ordering")         { ua=Array.isArray(a)?a.join(" → "):"No answer"; ca=q.correctOrder.join(" → "); }
  else if (q.type==="match")            { ua="(matching answer)"; ca=q.pairs.map(p=>p.term+" → "+p.desc).join(" | "); }
  return { ua, ca };
}
