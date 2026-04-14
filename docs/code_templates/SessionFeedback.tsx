"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, BookOpen, RotateCcw, ArrowRight, Flame, Star } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

type ErrorCategory = "grammar" | "vocabulary" | "word-order" | "fluency"

interface SessionError {
  id: string
  category: ErrorCategory
  label: string
  repeatCount: number
  said: string
  correct: string
  rule: string
  examples: { correct: boolean; text: string }[]
}

interface VocabItem {
  word: string
  translation: string
  contextSentence: string
}

interface TranscriptTurn {
  speaker: "user" | "maya"
  text: string
  errorId?: string
}

interface QuizOption {
  id: number
  text: string
  correct: boolean
}

interface SessionFeedbackProps {
  duration: string
  turnsCompleted: number
  turnsTotal: number
  errorCount: number
  newWordsCount: number
  wentWell: string[]
  errors: SessionError[]
  alternatives: { instead: string; tryThis: string[] }[]
  vocabulary: VocabItem[]
  quiz: { question: string; options: QuizOption[]; explanation: string }
  comparison: { label: string; current: string | number; delta: number | null }[]
  transcript: TranscriptTurn[]
  nextScenario: { title: string; description: string }
  xpEarned: number
  xpToNext: number
  xpTotal: number
  streakDays: number
}

// ─── Category config ──────────────────────────────────────────────────────────

const categoryConfig: Record<ErrorCategory, { label: string; color: string; bg: string; text: string }> = {
  grammar:      { label: "Grammar",     color: "border-red-200",    bg: "bg-red-50",    text: "text-red-700" },
  vocabulary:   { label: "Vocabulary",  color: "border-blue-200",   bg: "bg-blue-50",   text: "text-blue-700" },
  "word-order": { label: "Word Order",  color: "border-amber-200",  bg: "bg-amber-50",  text: "text-amber-700" },
  fluency:      { label: "Fluency",     color: "border-purple-200", bg: "bg-purple-50", text: "text-purple-700" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: "green" | "amber" }) {
  const valueClass = accent === "green"
    ? "text-emerald-600"
    : accent === "amber"
    ? "text-amber-600"
    : "text-zinc-900"
  return (
    <div className="bg-zinc-50 rounded-xl p-3">
      <p className="text-xs text-zinc-400 mb-1 font-medium tracking-wide uppercase">{label}</p>
      <p className={`text-xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-zinc-400 tracking-widest uppercase mb-3">{children}</p>
  )
}

function ErrorCard({ error, defaultOpen = false }: { error: SessionError; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const cfg = categoryConfig[error.category]
  const isRepeating = error.repeatCount >= 2

  return (
    <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
      >
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
        {isRepeating && (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
            {error.repeatCount}× this week
          </span>
        )}
        <span className="ml-auto text-zinc-300">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-zinc-50 pt-3 space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-400 font-medium">You said</p>
            <p className="text-sm text-zinc-400 line-through leading-relaxed">{error.said}</p>
            <div className="flex items-start gap-2">
              <span className="text-zinc-300 text-xs mt-0.5">→</span>
              <p className="text-sm font-semibold text-zinc-800 leading-relaxed">{error.correct}</p>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-zinc-500 leading-relaxed">{error.rule}</p>
          </div>

          {error.examples.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Examples</p>
              {error.examples.map((ex, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className={`text-xs mt-0.5 font-bold ${ex.correct ? "text-emerald-500" : "text-red-400"}`}>
                    {ex.correct ? "✓" : "✗"}
                  </span>
                  <p className="text-sm text-zinc-600">{ex.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button className="text-xs px-3 py-1.5 border border-zinc-200 rounded-lg text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors flex items-center gap-1.5">
              <BookOpen size={11} />
              Save to notes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function VocabCard({ item }: { item: VocabItem }) {
  const [saved, setSaved] = useState(false)

  return (
    <div className="border border-zinc-100 rounded-xl p-3.5 bg-white space-y-2">
      <div>
        <p className="text-sm font-semibold text-zinc-800">{item.word}</p>
        <p className="text-xs text-zinc-400">{item.translation}</p>
      </div>
      <p className="text-xs text-zinc-500 italic leading-relaxed border-l-2 border-zinc-200 pl-2.5">
        {item.contextSentence}
      </p>
      <button
        onClick={() => setSaved(!saved)}
        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
          saved
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "border-zinc-200 text-zinc-400 hover:bg-zinc-50"
        }`}
      >
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  )
}

function QuizSection({
  quiz,
}: {
  quiz: SessionFeedbackProps["quiz"]
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const answered = selected !== null

  return (
    <div className="border border-zinc-100 rounded-xl p-4 bg-white space-y-3">
      <p className="text-sm font-semibold text-zinc-800">{quiz.question}</p>
      <div className="space-y-2">
        {quiz.options.map((opt) => {
          const isSelected = selected === opt.id
          const showResult = answered && isSelected
          const baseClass = "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all"
          const stateClass = !answered
            ? "border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 text-zinc-700"
            : showResult && opt.correct
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : showResult && !opt.correct
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-zinc-100 text-zinc-400"

          return (
            <button
              key={opt.id}
              disabled={answered}
              onClick={() => setSelected(opt.id)}
              className={`${baseClass} ${stateClass}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-all ${
                showResult && opt.correct
                  ? "bg-emerald-500 border-emerald-500"
                  : showResult && !opt.correct
                  ? "bg-red-400 border-red-400"
                  : "border-zinc-300"
              }`} />
              {opt.text}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`text-xs px-3 py-2 rounded-lg leading-relaxed ${
          quiz.options.find(o => o.id === selected)?.correct
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-600"
        }`}>
          {quiz.explanation}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SessionFeedback({
  duration,
  turnsCompleted,
  turnsTotal,
  errorCount,
  newWordsCount,
  wentWell,
  errors,
  alternatives,
  vocabulary,
  quiz,
  comparison,
  transcript,
  nextScenario,
  xpEarned,
  xpToNext,
  xpTotal,
  streakDays,
}: SessionFeedbackProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  const [showAllErrors, setShowAllErrors] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const visibleErrors = showAllErrors ? errors : errors.slice(0, 2)
  const hiddenCount = errors.length - 2

  const xpProgress = Math.min((xpTotal / (xpTotal + xpToNext)) * 100, 100)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 font-sans">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Session complete</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Here's how it went</p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard label="Duration" value={duration} />
        <MetricCard label="Turns" value={`${turnsCompleted}/${turnsTotal}`} accent="green" />
        <MetricCard label="Errors" value={errorCount} accent={errorCount > 4 ? "amber" : undefined} />
        <MetricCard label="New words" value={newWordsCount} />
      </div>

      {/* What went well */}
      <div>
        <SectionHeading>What went well</SectionHeading>
        <div className="bg-white border border-zinc-100 rounded-xl p-4 border-l-4 border-l-emerald-400 space-y-2.5">
          {wentWell.map((item, i) => (
            <div key={i} className="flex gap-2.5 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <p className="text-sm text-zinc-700 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Watch out for */}
      <div>
        <SectionHeading>Watch out for</SectionHeading>
        <div className="space-y-2">
          {visibleErrors.map((err, i) => (
            <ErrorCard key={err.id} error={err} defaultOpen={i === 0} />
          ))}
          {hiddenCount > 0 && !showAllErrors && (
            <button
              onClick={() => setShowAllErrors(true)}
              className="w-full text-sm text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 hover:bg-zinc-100 hover:text-zinc-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>+{hiddenCount} more {hiddenCount === 1 ? "error" : "errors"}</span>
              <ChevronDown size={13} />
            </button>
          )}
          {showAllErrors && hiddenCount > 0 && (
            <button
              onClick={() => setShowAllErrors(false)}
              className="w-full text-sm text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 hover:bg-zinc-100 transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      </div>

      {/* You could have said */}
      {alternatives.length > 0 && (
        <div>
          <SectionHeading>You could have said</SectionHeading>
          <div className="bg-white border border-zinc-100 rounded-xl p-4 space-y-3">
            {alternatives.map((alt, i) => (
              <div key={i} className={i > 0 ? "pt-3 border-t border-zinc-50" : ""}>
                <p className="text-xs text-zinc-400 mb-1.5">Instead of <span className="text-zinc-500 font-medium">"{alt.instead}"</span></p>
                <div className="flex flex-wrap gap-2">
                  {alt.tryThis.map((t, j) => (
                    <span key={j} className="text-sm text-zinc-700 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-lg">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vocabulary */}
      {vocabulary.length > 0 && (
        <div>
          <SectionHeading>Vocabulary from this session</SectionHeading>
          <div className="grid grid-cols-2 gap-2">
            {vocabulary.map((item, i) => (
              <VocabCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Quick quiz */}
      <div>
        <SectionHeading>Quick check</SectionHeading>
        <QuizSection quiz={quiz} />
      </div>

      {/* Compared to last session */}
      {comparison.length > 0 && (
        <div>
          <SectionHeading>Compared to last session</SectionHeading>
          <div className="bg-white border border-zinc-100 rounded-xl divide-y divide-zinc-50">
            {comparison.map((row, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm text-zinc-500">{row.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-800">{row.current}</span>
                  {row.delta !== null && (
                    <span className={`text-xs font-medium ${
                      row.delta < 0 ? "text-emerald-500" : row.delta > 0 ? "text-red-400" : "text-zinc-400"
                    }`}>
                      {row.delta > 0 ? `↑ +${row.delta}` : row.delta < 0 ? `↓ ${row.delta}` : "—"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      <div>
        <SectionHeading>Session transcript</SectionHeading>
        <button
          onClick={() => setShowTranscript(!showTranscript)}
          className="w-full flex items-center justify-between text-sm text-zinc-400 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 hover:bg-zinc-100 transition-colors"
        >
          <span>{showTranscript ? "Hide conversation" : "Show full conversation"}</span>
          {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showTranscript && (
          <div className="mt-2 bg-white border border-zinc-100 rounded-xl p-4 space-y-3">
            {transcript.map((turn, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
                  {turn.speaker === "maya" ? "Maya" : "You"}
                </p>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {turn.errorId ? (
                    <span
                      className="border-b-2 border-dashed border-red-300 cursor-pointer hover:bg-red-50 rounded px-0.5 transition-colors"
                      onClick={() => setActiveTooltip(activeTooltip === turn.errorId ? null : turn.errorId!)}
                    >
                      {turn.text}
                    </span>
                  ) : (
                    turn.text
                  )}
                </p>
                {turn.errorId && activeTooltip === turn.errorId && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5 mt-1.5">
                    Error here — see "Watch out for" above for the correction.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next steps */}
      <div>
        <SectionHeading>What to do next</SectionHeading>
        <div className="grid grid-cols-2 gap-2">
          <button className="text-left bg-white border border-zinc-100 rounded-xl p-3.5 hover:border-zinc-200 hover:bg-zinc-50 transition-all group">
            <p className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1">
              <RotateCcw size={10} /> Replay
            </p>
            <p className="text-sm font-semibold text-zinc-800 mb-1">Same scenario</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Practice what you learned today</p>
          </button>
          <button className="text-left bg-white border border-zinc-100 rounded-xl p-3.5 hover:border-zinc-200 hover:bg-zinc-50 transition-all group">
            <p className="text-xs text-zinc-400 mb-1.5 flex items-center gap-1">
              <ArrowRight size={10} /> Next
            </p>
            <p className="text-sm font-semibold text-zinc-800 mb-1">{nextScenario.title}</p>
            <p className="text-xs text-zinc-400 leading-relaxed">{nextScenario.description}</p>
          </button>
        </div>
      </div>

      {/* XP + streak */}
      <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-semibold text-zinc-900">+{xpEarned}</span>
            <span className="text-sm text-zinc-400">XP earned</span>
          </div>
          <div className="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-xs text-zinc-400 mt-1">{xpToNext} XP to next level</p>
        </div>
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
          <Flame size={14} className="text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">{streakDays}</span>
          <span className="text-xs text-amber-500">days</span>
        </div>
      </div>

    </div>
  )
}

// ─── Example usage (remove in production) ────────────────────────────────────

export function SessionFeedbackExample() {
  const exampleData: SessionFeedbackProps = {
    duration: "8:42",
    turnsCompleted: 11,
    turnsTotal: 12,
    errorCount: 3,
    newWordsCount: 4,
    wentWell: [
      "You expressed your interests clearly, which helps find common ground in conversation.",
      "You used specific examples like 'natürlichen Wegen in Wien' — that level of detail makes conversations feel real.",
    ],
    errors: [
      {
        id: "e1",
        category: "grammar",
        label: "Perfekt Tense",
        repeatCount: 3,
        said: "Ich viele gegessen heute.",
        correct: "Ich habe heute viel gegessen.",
        rule: "Perfekt needs a helper verb — haben or sein — in position 2. The past participle goes to the end of the sentence.",
        examples: [
          { correct: true,  text: "Ich habe Kaffee getrunken." },
          { correct: true,  text: "Sie sind nach Hause gegangen." },
          { correct: false, text: "Ich Kaffee getrunken heute." },
        ],
      },
      {
        id: "e2",
        category: "word-order",
        label: "Word Order",
        repeatCount: 1,
        said: "Ich spiele Videospiele gerne und ich spazieren gegangen, gehe mit meinen Freunden.",
        correct: "Ich spiele gerne Videospiele und gehe mit meinen Freunden spazieren.",
        rule: "In German, the verb comes second in the main clause. When two verbs are connected with 'und', the second verb moves to the end.",
        examples: [],
      },
      {
        id: "e3",
        category: "vocabulary",
        label: "Vocabulary",
        repeatCount: 1,
        said: "Ich mag sehr spazieren.",
        correct: "Ich gehe gerne spazieren.",
        rule: "'Spazieren' is used with 'gehen' — 'spazieren gehen' is the natural phrasing in German.",
        examples: [],
      },
    ],
    alternatives: [
      { instead: "Das ist gut",       tryThis: ["Das klingt super!", "Das freut mich!"] },
      { instead: "Ich verstehe nicht", tryThis: ["Wie bitte?", "Könnten Sie das wiederholen?"] },
    ],
    vocabulary: [
      { word: "spazieren gehen", translation: "to go for a walk",    contextSentence: "Ich gehe gerne in Wien spazieren." },
      { word: "sich interessieren", translation: "to be interested in", contextSentence: "Ich interessiere mich für Sprachen." },
    ],
    quiz: {
      question: "Which sentence is correct?",
      options: [
        { id: 1, text: "Ich gegessen viel heute.",      correct: false },
        { id: 2, text: "Ich habe heute viel gegessen.", correct: true  },
        { id: 3, text: "Ich viel habe gegessen heute.", correct: false },
      ],
      explanation: "Correct! Haben + past participle at the end — that's the Perfekt pattern.",
    },
    comparison: [
      { label: "Errors",            current: 3,    delta: -2 },
      { label: "New vocabulary",    current: 4,    delta: 2  },
      { label: "Perfekt errors",    current: 2,    delta: 1  },
      { label: "Scenario completed", current: "Yes", delta: null },
    ],
    transcript: [
      { speaker: "maya", text: "Hallo! Schön dich kennenzulernen. Was machst du gerne in deiner Freizeit?" },
      { speaker: "user", text: "Ich spiele Videospiele gerne und ich spazieren gegangen, gehe mit meinen Freunden.", errorId: "e2" },
      { speaker: "maya", text: "Oh interessant! Spielst du lieber online oder mit Freunden zusammen?" },
      { speaker: "user", text: "Ich viele gegessen heute nach dem Spielen.", errorId: "e1" },
      { speaker: "maya", text: "Oh, was hast du gegessen? Kochst du gerne?" },
    ],
    nextScenario: {
      title: "At the doctor",
      description: "Similar difficulty, new vocabulary challenge",
    },
    xpEarned: 45,
    xpToNext: 340,
    xpTotal: 1260,
    streakDays: 7,
  }

  return <SessionFeedback {...exampleData} />
}
