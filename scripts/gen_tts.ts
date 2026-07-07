/**
 * pnpm content:tts — scan content for audio-needing text and generate mp3s
 * via edge-tts into data/audio/tts/{sha1(text)}.mp3 (PLAN §5H SYS-2).
 *
 * M0 placeholder: reports what would be generated and exits 0.
 * Real edge-tts integration is scheduled within M0 (TTS pipeline step).
 */
import { discoverContent, loadSentencePack } from "@/lib/content/load";

const files = discoverContent(process.cwd());
let texts = 0;
for (const f of files.packs) {
  try {
    texts += loadSentencePack(f).sentences.length;
  } catch {
    // invalid files are content:validate's job to report
  }
}
console.log(`content:tts (placeholder) — ${texts} sentence audio files would be generated`);
