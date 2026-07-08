import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getGrammarLesson, toClientExercise } from "@/lib/lessons";
import type { AltRule } from "@/lib/content/schema";
import { splitParagraphs } from "@/lib/ui/text";
import LessonRunner from "./lesson-runner";
import type { ExerciseView, SentenceView } from "./types";

export default async function GrammarLessonPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { code } = await params;
  const lesson = getGrammarLesson(code);

  if (!lesson) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="text-xl font-semibold text-stone-800">
          还没找到「{code}」这节课
        </p>
        <p className="text-base text-stone-500">
          可能是还没准备好，或者链接不对。要不回目录看看？
        </p>
        <Link
          href="/grammar"
          className="mt-2 inline-flex min-h-[48px] items-center rounded-2xl bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700"
        >
          返回目录
        </Link>
      </div>
    );
  }

  const explainParagraphs = splitParagraphs(lesson.point.explainMd);
  const pitfallParagraphs = splitParagraphs(lesson.point.pitfallsMd);

  const exercises: ExerciseView[] = lesson.exercises.map(toClientExercise);

  const sentences: SentenceView[] = lesson.sentences.map((s) => ({
    id: s.id,
    uid: s.uid,
    en: s.en,
    zh: s.zh,
    tokensJson: s.tokensJson,
    alt: (s.altJson ?? []) as AltRule[],
    audioPath: s.audioPath,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-2">
        <Link
          href="/grammar"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-stone-500 hover:text-emerald-600"
        >
          <span aria-hidden>←</span> 返回目录
        </Link>
        <span className="text-sm font-medium uppercase tracking-wide text-emerald-600">
          {lesson.point.code}
        </span>
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">
          {lesson.point.titleZh}
        </h1>
      </header>

      <section className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800">讲解</h2>
        {explainParagraphs.length > 0 ? (
          explainParagraphs.map((p, i) => (
            <p
              key={i}
              className="whitespace-pre-line text-lg leading-relaxed text-stone-700"
            >
              {p}
            </p>
          ))
        ) : (
          <p className="text-base text-stone-500">这节课暂时还没有讲解内容。</p>
        )}
      </section>

      {pitfallParagraphs.length > 0 && (
        <section className="flex flex-col gap-4 rounded-3xl bg-amber-50 p-6">
          <h2 className="text-lg font-bold text-amber-800">常见错误</h2>
          {pitfallParagraphs.map((p, i) => (
            <p
              key={i}
              className="whitespace-pre-line text-base leading-relaxed text-amber-900"
            >
              {p}
            </p>
          ))}
        </section>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-stone-800">开始练习</h2>
        <p className="text-base text-stone-500">
          先做 {exercises.length} 道练习题，再挑战句构关卡，一步一步来。
        </p>
      </div>

      <LessonRunner
        lessonTitle={lesson.point.titleZh}
        exercises={exercises}
        sentences={sentences}
      />
    </div>
  );
}
