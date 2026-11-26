import { describe, expect, it } from "vitest";
import {
  AUDIO_MODEL_OPTIONS,
  CHAT_MODEL_OPTIONS,
  IMAGE_MODEL_OPTIONS,
} from "@/constants/admin-options";

describe("admin model options", () => {
  it("offers only chat models that OpenAI is not retiring", () => {
    // gpt-4.1-nano shut down 2026-10-23; gpt-4o-mini, gpt-4.1 and gpt-4.1-mini
    // shut down 2027-01-14.
    for (const retired of [
      "gpt-4.1-nano",
      "gpt-4.1-mini",
      "gpt-4.1",
      "gpt-4o-mini",
    ]) {
      expect(CHAT_MODEL_OPTIONS).not.toContain(retired);
    }
    expect(CHAT_MODEL_OPTIONS).toEqual(["gpt-6-luna", "gpt-6-sol", "gpt-5.4"]);
  });

  it("offers only image models that OpenAI is not retiring", () => {
    // gpt-image-1 shut down 2026-10-23; gpt-image-1-mini and gpt-image-1.5
    // shut down 2026-12-01.
    expect(IMAGE_MODEL_OPTIONS).toEqual([
      "gpt-image-2.6-flare",
      "gpt-image-2.6-sunburst",
    ]);
  });

  it("offers the full-audio replacement instead of gpt-audio-mini", () => {
    // gpt-audio-mini shuts down 2027-01-20.
    expect(AUDIO_MODEL_OPTIONS).toEqual(["gpt-4o-mini-tts", "gpt-audio-1.5"]);
  });
});
