/**
 * The grammar syllabus skeleton (PLAN §5B): all 42 lessons across 4 stages.
 * This drives the lesson directory's structure so the whole learning path is
 * visible even before every lesson is authored — the DB (seeded, approved
 * lessons) tells us which entries are actually learnable vs "coming soon".
 *
 * Titles here are the syllabus labels; for a seeded lesson the DB title_zh
 * (from the approved content file) is the source of truth and overrides these.
 */

export interface CurriculumStage {
  stage: number;
  name: string;
  weeks: string;
}

export interface CurriculumEntry {
  code: string; // L01..L42
  stage: number; // 1..4
  ord: number; // 1..42, global order
  title: string;
}

export const STAGES: CurriculumStage[] = [
  { stage: 1, name: "句子的骨架", weeks: "第 1-2 周" },
  { stage: 2, name: "表达的扩展", weeks: "第 3-4 周" },
  { stage: 3, name: "复杂句与地道化", weeks: "第 5-6 周" },
  { stage: 4, name: "输出巩固", weeks: "第 7-8 周" },
];

export const CURRICULUM: CurriculumEntry[] = [
  // 阶段 1 · 句子的骨架
  { code: "L01", stage: 1, ord: 1, title: "词性总览与句子成分" },
  { code: "L02", stage: 1, ord: 2, title: "五大基本句型" },
  { code: "L03", stage: 1, ord: 3, title: "be 动词 vs 实义动词" },
  { code: "L04", stage: 1, ord: 4, title: "一般现在时与三单 -s" },
  { code: "L05", stage: 1, ord: 5, title: "名词单复数与可数性" },
  { code: "L06", stage: 1, ord: 6, title: "冠词 a/an/the 入门" },
  { code: "L07", stage: 1, ord: 7, title: "人称代词与物主代词" },
  { code: "L08", stage: 1, ord: 8, title: "一般过去时" },
  { code: "L09", stage: 1, ord: 9, title: "现在进行时" },
  { code: "L10", stage: 1, ord: 10, title: "否定句与 do/does/did" },
  { code: "L11", stage: 1, ord: 11, title: "疑问句构成" },
  { code: "L12", stage: 1, ord: 12, title: "there be 句型" },
  { code: "L13", stage: 1, ord: 13, title: "时间地点介词 in/on/at" },
  { code: "L14", stage: 1, ord: 14, title: "并列连词 and/but/or/so/because" },
  // 阶段 2 · 表达的扩展
  { code: "L15", stage: 2, ord: 15, title: "will / be going to" },
  { code: "L16", stage: 2, ord: 16, title: "现在完成时入门" },
  { code: "L17", stage: 2, ord: 17, title: "过去进行时" },
  { code: "L18", stage: 2, ord: 18, title: "情态动词 can/could/must/should" },
  { code: "L19", stage: 2, ord: 19, title: "频度副词及其位置" },
  { code: "L20", stage: 2, ord: 20, title: "比较级与最高级" },
  { code: "L21", stage: 2, ord: 21, title: "some/any/no/every 及复合词" },
  { code: "L22", stage: 2, ord: 22, title: "much/many/a few/a little" },
  { code: "L23", stage: 2, ord: 23, title: "祈使句" },
  { code: "L24", stage: 2, ord: 24, title: "动名词 vs 不定式基础" },
  { code: "L25", stage: 2, ord: 25, title: "宾语从句（陈述语序）" },
  { code: "L26", stage: 2, ord: 26, title: "时间状语从句" },
  { code: "L27", stage: 2, ord: 27, title: "形容词 vs 副词" },
  { code: "L28", stage: 2, ord: 28, title: "It 形式主语" },
  // 阶段 3 · 复杂句与地道化
  { code: "L29", stage: 3, ord: 29, title: "定语从句 who/which/that" },
  { code: "L30", stage: 3, ord: 30, title: "现在完成 vs 一般过去" },
  { code: "L31", stage: 3, ord: 31, title: "现在完成进行时" },
  { code: "L32", stage: 3, ord: 32, title: "过去完成时" },
  { code: "L33", stage: 3, ord: 33, title: "被动语态" },
  { code: "L34", stage: 3, ord: 34, title: "条件句 1 类" },
  { code: "L35", stage: 3, ord: 35, title: "条件句 2 类（虚拟入门）" },
  { code: "L36", stage: 3, ord: 36, title: "间接引语（陈述句）" },
  { code: "L37", stage: 3, ord: 37, title: "使役与感官动词" },
  { code: "L38", stage: 3, ord: 38, title: "run-on 句与标点" },
  // 阶段 4 · 输出巩固
  { code: "L39", stage: 4, ord: 39, title: "中式英语总对照专题" },
  { code: "L40", stage: 4, ord: 40, title: "口语功能句型包" },
  { code: "L41", stage: 4, ord: 41, title: "段落写作" },
  { code: "L42", stage: 4, ord: 42, title: "总复习与错题清零" },
];
