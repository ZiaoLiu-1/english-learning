"use client";

import { useState, type FormEvent } from "react";
import { expectedNext, startTyping, typeToken, type TypingState } from "@/lib/tokenize";
import type { SentenceView } from "./types";

export default function SentenceTyper({
  sentence,
  onCompleted,
}: {
  sentence: SentenceView;
  onCompleted: () => void;
}) {
  const [typingState, setTypingState] = useState<TypingState>(() =>
    startTyping(sentence.tokensJson, sentence.alt),
  );
  const [typed, setTyped] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [rejected, setRejected] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const candidates = expectedNext(typingState);
  const hintText =
    hintLevel === 0
      ? null
      : hintLevel === 1
        ? `提示：以 “${candidates[0]?.[0] ?? "?"}” 开头`
        : `提示：${candidates.join(" / ")}`;

  function handleChange(value: string) {
    setInput(value);
    if (rejected) setRejected(false);
  }

  function submitWord(e: FormEvent) {
    e.preventDefault();
    const word = input.trim();
    if (!word || completed) return;
    const { state, result } = typeToken(typingState, word);
    if (result === "rejected") {
      setRejected(true);
      return;
    }
    setTyped((prev) => [...prev, word]);
    setTypingState(state);
    setInput("");
    setHintLevel(0);
    if (result === "completed") {
      setCompleted(true);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-xl font-medium leading-relaxed text-stone-900">
        {sentence.zh}
      </p>

      <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2">
        {typed.map((w, i) => (
          <span
            key={i}
            className="rounded-lg bg-emerald-50 px-3 py-1 text-lg font-medium text-emerald-700"
          >
            {w}
          </span>
        ))}
        {!completed && (
          <span className="text-lg text-stone-300">…</span>
        )}
      </div>

      {completed ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-emerald-50 px-5 py-4">
          <p className="text-lg font-semibold text-emerald-700">
            完成！这句话是：
          </p>
          <p className="text-lg text-stone-800">{sentence.en}</p>
          <button
            type="button"
            onClick={onCompleted}
            className="mt-1 min-h-[48px] w-fit rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
          >
            下一句 →
          </button>
        </div>
      ) : (
        <form onSubmit={submitWord} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="输入下一个英文单词"
              className={`h-14 flex-1 rounded-2xl border-2 px-4 text-lg outline-none focus:border-emerald-500 ${
                rejected
                  ? "border-rose-400 bg-rose-50 text-rose-800"
                  : "border-stone-300 bg-white"
              }`}
            />
            <button
              type="submit"
              className="min-h-[56px] rounded-2xl bg-emerald-600 px-5 text-lg font-semibold text-white hover:bg-emerald-700"
            >
              确认
            </button>
          </div>
          {rejected && (
            <p role="alert" className="text-base text-rose-600">
              这个词不对，再想想～
            </p>
          )}
          <div>
            <button
              type="button"
              onClick={() => setHintLevel((h) => Math.min(h + 1, 2))}
              disabled={hintLevel >= 2}
              className="min-h-[40px] rounded-xl px-3 text-base font-medium text-emerald-700 underline decoration-dotted disabled:opacity-50"
            >
              提示
            </button>
            {hintText && (
              <span className="ml-2 text-base text-stone-500">{hintText}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
