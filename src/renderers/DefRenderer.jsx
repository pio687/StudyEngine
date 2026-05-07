import MCRenderer from './MCRenderer'

// Def questions are structurally identical to MC.
// Kept as a separate file so it can be styled differently later.
export default function DefRenderer({ question, onSubmit, showAnswer }) {
  return <MCRenderer question={question} onSubmit={onSubmit} showAnswer={showAnswer} />
}
