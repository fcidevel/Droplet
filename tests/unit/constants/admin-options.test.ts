import { describe, expect, it } from "vitest";
import { CHAT_MODEL_OPTIONS } from "@/constants/admin-options";

describe("admin model options", () => {
  it("does not offer chat models that OpenAI no longer serves to this project", () => {
    // gpt-4.1-nano was shut down on 2026-10-23; gpt-4.1-mini is not enabled
    // for the project (and shuts down on 2027-01-14).
    expect(CHAT_MODEL_OPTIONS).not.toContain("gpt-4.1-nano");
    expect(CHAT_MODEL_OPTIONS).not.toContain("gpt-4.1-mini");
  });
});
