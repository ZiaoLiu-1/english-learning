"use client";

import { useState } from "react";
import ProgressBar from "./progress-bar";
import SentenceTyper from "./sentence-typer";
import type { SentenceView } from "./types";

export default function SentencePack({
  sentences,
  onAllDone,
}: {
  sentences: SentenceView[];
  onAllDone: () => void;
}) {
  const [index, setIndex] = useState(0);

  if (sentences.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center">
        <p className="text-lg text-stone-600">
          这节课的句构关卡还没准备好，先去复习一下前面的练习吧。
        </p>
      </div>
    );
  }

  const current = sentences[index];

  function handleCompleted() {
    if (index + 1 >= sentences.length) {
      onAllDone();
    } else {
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ProgressBar done={index} total={sentences.length} label="句构关卡" />
      <SentenceTyper
        key={current.id}
        sentence={current}
        onCompleted={handleCompleted}
      />
    </div>
  );
}
