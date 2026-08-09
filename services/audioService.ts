import { geminiService } from './geminiService';

/** Cached English voices — populated once voices are available. */
let cachedEnglishVoice: SpeechSynthesisVoice | null = null;

/**
 * Resolve the best available English voice from the browser's synthesis engine.
 * Handles Chrome/WebKit's async voice loading by waiting on `onvoiceschanged`.
 */
function getEnglishVoice(): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    const pick = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
      // Preference order: natural en-US → any en-US → any en-GB → any English
      const prefer = [
        voices.find((v) => /en-US/i.test(v.lang) && /natural|enhanced|premium/i.test(v.name)),
        voices.find((v) => /en-US/i.test(v.lang)),
        voices.find((v) => /en-GB/i.test(v.lang)),
        voices.find((v) => /^en/i.test(v.lang)),
      ];
      return prefer.find(Boolean) ?? null;
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(pick(voices));
      return;
    }

    // Chrome / WebKit defers voice loading — listen for the event
    const onchange = () => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve(pick(window.speechSynthesis.getVoices()));
    };
    window.speechSynthesis.onvoiceschanged = onchange;

    // Safety timeout: resolve null after 3 s so we can still try Gemini fallback
    setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve(null);
    }, 3000);
  });
}

export interface PlaybackCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Play the pronunciation of a word using the browser's native Web Speech API.
 *
 * Falls back to Gemini TTS only when:
 *  1. `window.speechSynthesis` / `SpeechSynthesisUtterance` is unsupported.
 *  2. No valid English voice could be loaded.
 *  3. The native utterance fires an `onerror` event.
 *
 * @param text                 The word / phrase to pronounce.
 * @param onFallbackUsage      Called **before** the Gemini fallback attempt so the
 *                             caller can enforce / increment the `tts_used` quota.
 *                             Return `false` to abort the Gemini fallback (quota exceeded).
 * @param callbacks            Optional lifecycle hooks for spinner UI states.
 */
export async function playWordPronunciation(
  text: string,
  onFallbackUsage?: () => boolean | Promise<boolean>,
  callbacks?: PlaybackCallbacks,
): Promise<void> {
  const { onStart, onEnd, onError } = callbacks ?? {};

  // ── Primary: native Web Speech API ────────────────────────────────────────
  const nativeSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  if (nativeSupported) {
    try {
      if (!cachedEnglishVoice) {
        cachedEnglishVoice = await getEnglishVoice();
      }

      if (cachedEnglishVoice) {
        await new Promise<void>((resolve, reject) => {
          // Cancel any queued utterances first to avoid stacking
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = cachedEnglishVoice!;
          utterance.lang = cachedEnglishVoice!.lang;
          utterance.pitch = 1;
          utterance.rate = 0.9;

          utterance.onstart = () => onStart?.();
          utterance.onend = () => {
            onEnd?.();
            resolve();
          };
          utterance.onerror = (evt) => {
            // Suppress benign "interrupted" events (e.g. rapid consecutive calls)
            if (evt.error === 'interrupted') {
              onEnd?.();
              resolve();
              return;
            }
            reject(evt);
          };

          window.speechSynthesis.speak(utterance);
        });
        return; // ✅ Native succeeded — done.
      }
      // No English voice found → fall through to Gemini TTS
    } catch (nativeErr) {
      console.warn('[audioService] Native TTS failed, trying Gemini fallback:', nativeErr);
      onError?.(nativeErr);
      // Fall through to Gemini TTS below
    }
  }

  // ── Fallback: Gemini TTS ───────────────────────────────────────────────────
  if (onFallbackUsage) {
    const allowed = await onFallbackUsage();
    if (!allowed) {
      // Caller signalled quota exhausted — abort gracefully
      return;
    }
  }

  onStart?.();
  try {
    await geminiService.textToSpeech(text);
  } catch (geminiErr) {
    console.error('[audioService] Gemini TTS fallback also failed:', geminiErr);
    onError?.(geminiErr);
  } finally {
    onEnd?.();
  }
}
