import { describe, expect, it } from "vitest";
import {
  estimateModelCostCents,
  normalizePlanTier,
  resolveModelPolicy,
} from "@/lib/utils/ai-model-policy";
import { createTestUser } from "../test-support";

describe("ai-model-policy", () => {
  const litePlanTier = normalizePlanTier(
    createTestUser({ plan: { name: "Lite" } }).plan.name,
  );
  const proPlanTier = normalizePlanTier(
    createTestUser({ plan: { name: "Pro" } }).plan.name,
  );
  const premiumPlanTier = normalizePlanTier(
    createTestUser({ plan: { name: "Premium" } }).plan.name,
  );

  it("normalizes plan names and defaults to lite when missing", () => {
    expect(normalizePlanTier()).toBe("lite");
    expect(normalizePlanTier(null)).toBe("lite");
    expect(normalizePlanTier("Pro")).toBe("pro");
    expect(normalizePlanTier("premium")).toBe("premium");
  });

  it("pins title generation to the utility rule model", () => {
    const policy = resolveModelPolicy({
      plan: litePlanTier,
      feature: "title_generation",
      taskClass: "complex",
    });

    expect(policy.taskClass).toBe("utility");
    expect(policy.model).toBe("gpt-6-luna");
    expect(policy.fallbackModel).toBeUndefined();
    expect(policy.reasoningEffort).toBe("none");
    expect(policy.hardBlocked).toBe(false);
  });

  it("never resolves a retired or retiring model (TTS excepted)", () => {
    // OpenAI shutdowns: gpt-4.1-nano and gpt-image-1 2026-10-23; gpt-image-1-mini
    // and gpt-image-1.5 2026-12-01; gpt-4o-mini, gpt-4.1 and gpt-4.1-mini
    // 2027-01-14; gpt-audio-mini 2027-01-20. gpt-4o-mini-tts (2027-01-06) has
    // no Speech API successor and stays until the TTS path moves.
    const unavailableModels = [
      "gpt-4.1-nano",
      "gpt-4.1-mini",
      "gpt-4.1",
      "gpt-4o-mini",
      "gpt-image-1",
      "gpt-image-1-mini",
      "gpt-image-1.5",
      "gpt-audio-mini",
    ];
    const plans = [litePlanTier, proPlanTier, premiumPlanTier];
    const features = [
      "title_generation",
      "chat",
      "image_generation",
      "audio_generation",
    ] as const;
    const taskClasses = [
      "utility",
      "simple",
      "standard",
      "complex",
      "preview",
      "final",
    ] as const;
    const signals = [
      {},
      { retryAttempt: 1 },
      { budgetState: "soft_limit_reached" as const },
      { highLatency: true },
      { explicitPremium: true },
      { audioMode: "tts" as const },
      { audioMode: "audio_in_out" as const },
    ];
    const resolvedModels = new Set<string>();

    for (const plan of plans) {
      for (const feature of features) {
        for (const taskClass of taskClasses) {
          for (const signal of signals) {
            const policy = resolveModelPolicy({
              plan,
              feature,
              taskClass,
              ...signal,
            });
            resolvedModels.add(policy.model);
            if (policy.fallbackModel) {
              resolvedModels.add(policy.fallbackModel);
            }
          }
        }
      }
    }

    for (const model of unavailableModels) {
      expect(resolvedModels).not.toContain(model);
    }
  });

  it("keeps lite chat on gpt-6-luna when retried, as no cheaper model is available", () => {
    const policy = resolveModelPolicy({
      plan: litePlanTier,
      feature: "chat",
      taskClass: "standard",
      retryAttempt: 1,
    });

    expect(policy.model).toBe("gpt-6-luna");
    expect(policy.wasDowngraded).toBe(false);
  });

  it("downgrades premium complex chat to gpt-6-luna on retry", () => {
    const policy = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "chat",
      taskClass: "complex",
      retryAttempt: 1,
    });

    expect(policy.model).toBe("gpt-6-luna");
    expect(policy.wasDowngraded).toBe(true);
    expect(policy.downgradeReasons).toEqual(["retry_attempt"]);
  });

  it("hard blocks requests when budget hard limit is reached", () => {
    const policy = resolveModelPolicy({
      plan: proPlanTier,
      feature: "chat",
      budgetState: "hard_limit_reached",
    });

    expect(policy.hardBlocked).toBe(true);
    expect(policy.wasDowngraded).toBe(false);
    expect(policy.downgradeReasons).toEqual(["hard_limit_reached"]);
    expect(policy.notes).toContain("hard budget limit");
  });

  it("blocks lite audio_in_out requests", () => {
    const policy = resolveModelPolicy({
      plan: litePlanTier,
      feature: "audio_generation",
      audioMode: "audio_in_out",
    });

    expect(policy.hardBlocked).toBe(true);
    expect(policy.model).toBe("gpt-4o-mini-tts");
    expect(policy.notes).toContain("Lite audio_in_out requests are blocked");
  });

  it("forces the TTS model path for tts audio mode", () => {
    const policy = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "audio_generation",
      audioMode: "tts",
    });

    expect(policy.model).toBe("gpt-4o-mini-tts");
    expect(policy.fallbackModel).toBe("gpt-4o-mini-tts");
    expect(policy.isTtsOnly).toBe(true);
    expect(policy.hardBlocked).toBe(false);
  });

  it("upgrades premium complex chat to gpt-5.4 only when explicitly requested", () => {
    const normalPolicy = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "chat",
      taskClass: "complex",
      explicitPremium: false,
    });
    const upgradedPolicy = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "chat",
      taskClass: "complex",
      explicitPremium: true,
    });

    expect(normalPolicy.model).toBe("gpt-6-sol");
    expect(upgradedPolicy.model).toBe("gpt-5.4");
    expect(upgradedPolicy.fallbackModel).toBe("gpt-6-sol");
    expect(upgradedPolicy.reasoningEffort).toBeUndefined();
  });

  it("applies downgrade signals for chat when a fallback is available", () => {
    const simpleProPolicy = resolveModelPolicy({
      plan: proPlanTier,
      feature: "chat",
      taskClass: "simple",
    });
    const pressuredPremiumPolicy = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "chat",
      taskClass: "standard",
      budgetState: "soft_limit_reached",
      highLatency: true,
      retryAttempt: 1,
    });

    expect(simpleProPolicy.model).toBe("gpt-6-luna");
    expect(simpleProPolicy.wasDowngraded).toBe(true);
    expect(simpleProPolicy.downgradeReasons).toEqual(["simple_task"]);

    expect(pressuredPremiumPolicy.model).toBe("gpt-6-luna");
    expect(pressuredPremiumPolicy.wasDowngraded).toBe(true);
    expect(pressuredPremiumPolicy.downgradeReasons).toEqual([
      "soft_limit_reached",
      "high_latency",
      "retry_attempt",
    ]);
  });

  it("keeps full-audio model when audio_in_out fallback is tts-only", () => {
    const policy = resolveModelPolicy({
      plan: proPlanTier,
      feature: "audio_generation",
      audioMode: "audio_in_out",
      retryAttempt: 2,
    });

    expect(policy.model).toBe("gpt-audio-1.5");
    expect(policy.wasDowngraded).toBe(false);
    expect(policy.downgradeReasons).toEqual([]);
    expect(policy.notes).toContain("TTS fallback blocked");
  });

  it("applies updated chat token limits by plan and task class", () => {
    const liteSimple = resolveModelPolicy({
      plan: litePlanTier,
      feature: "chat",
      taskClass: "simple",
    });
    const liteStandard = resolveModelPolicy({
      plan: litePlanTier,
      feature: "chat",
      taskClass: "standard",
    });
    const liteComplex = resolveModelPolicy({
      plan: litePlanTier,
      feature: "chat",
      taskClass: "complex",
    });
    const proSimple = resolveModelPolicy({
      plan: proPlanTier,
      feature: "chat",
      taskClass: "simple",
    });
    const proStandard = resolveModelPolicy({
      plan: proPlanTier,
      feature: "chat",
      taskClass: "standard",
    });
    const proComplex = resolveModelPolicy({
      plan: proPlanTier,
      feature: "chat",
      taskClass: "complex",
    });
    const premiumSimple = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "chat",
      taskClass: "simple",
    });
    const premiumStandard = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "chat",
      taskClass: "standard",
    });
    const premiumComplex = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "chat",
      taskClass: "complex",
    });

    expect(liteSimple.maxInputTokens).toBe(32_000);
    expect(liteSimple.maxOutputTokens).toBe(4_096);
    expect(liteStandard.maxInputTokens).toBe(64_000);
    expect(liteStandard.maxOutputTokens).toBe(8_192);
    expect(liteComplex.maxInputTokens).toBe(128_000);
    expect(liteComplex.maxOutputTokens).toBe(16_384);
    expect(proSimple.maxInputTokens).toBe(64_000);
    expect(proSimple.maxOutputTokens).toBe(8_192);
    expect(proStandard.maxInputTokens).toBe(128_000);
    expect(proStandard.maxOutputTokens).toBe(16_384);
    expect(proComplex.maxInputTokens).toBe(200_000);
    expect(proComplex.maxOutputTokens).toBe(32_768);
    expect(premiumSimple.maxInputTokens).toBe(128_000);
    expect(premiumSimple.maxOutputTokens).toBe(16_384);
    expect(premiumStandard.maxInputTokens).toBe(200_000);
    expect(premiumStandard.maxOutputTokens).toBe(32_768);
    expect(premiumComplex.maxInputTokens).toBe(500_000);
    expect(premiumComplex.maxOutputTokens).toBe(32_768);
  });

  it("applies per-feature admin model overrides", () => {
    const chatPolicy = resolveModelPolicy({
      plan: proPlanTier,
      feature: "chat",
      modelOverrides: {
        chat: {
          pro: "gpt-4.1-mini",
        },
      },
    });
    const imagePolicy = resolveModelPolicy({
      plan: litePlanTier,
      feature: "image_generation",
      modelOverrides: {
        imageGenerationModel: "gpt-image-custom",
      },
    });
    const audioPolicy = resolveModelPolicy({
      plan: premiumPlanTier,
      feature: "audio_generation",
      audioMode: "audio_in_out",
      modelOverrides: {
        audioGenerationModel: "gpt-audio-custom",
      },
    });

    expect(chatPolicy.model).toBe("gpt-4.1-mini");
    expect(chatPolicy.notes).toContain(
      "Admin override applied for chat model.",
    );
    expect(imagePolicy.model).toBe("gpt-image-custom");
    expect(audioPolicy.model).toBe("gpt-audio-custom");
  });

  it("asks gpt-6 chat models for no reasoning so temperature and tools stay valid", () => {
    const liteChat = resolveModelPolicy({
      plan: litePlanTier,
      feature: "chat",
    });
    const proChat = resolveModelPolicy({ plan: proPlanTier, feature: "chat" });
    const legacyOverride = resolveModelPolicy({
      plan: proPlanTier,
      feature: "chat",
      modelOverrides: { chat: { pro: "gpt-4o-mini" } },
    });
    const gpt6Override = resolveModelPolicy({
      plan: litePlanTier,
      feature: "chat",
      modelOverrides: { chat: { lite: "gpt-6-sol" } },
    });

    expect(liteChat.model).toBe("gpt-6-luna");
    expect(liteChat.reasoningEffort).toBe("none");
    expect(proChat.model).toBe("gpt-6-sol");
    expect(proChat.reasoningEffort).toBe("none");
    expect(legacyOverride.reasoningEffort).toBeUndefined();
    expect(gpt6Override.reasoningEffort).toBe("none");
  });

  it("uses the GPT-Image-2.6 tiers for image generation", () => {
    const liteImage = resolveModelPolicy({
      plan: litePlanTier,
      feature: "image_generation",
    });
    const proImage = resolveModelPolicy({
      plan: proPlanTier,
      feature: "image_generation",
    });

    expect(liteImage.model).toBe("gpt-image-2.6-flare");
    expect(proImage.model).toBe("gpt-image-2.6-sunburst");
    expect(proImage.fallbackModel).toBe("gpt-image-2.6-flare");
  });

  it("prices the replacement models", () => {
    expect(
      estimateModelCostCents({ model: "gpt-6-luna", tokensIn: 1_000_000 }),
    ).toBe(10);
    expect(
      estimateModelCostCents({ model: "gpt-6-sol", tokensOut: 1_000_000 }),
    ).toBe(1_000);
    expect(estimateModelCostCents({ model: "gpt-image-2.6-flare" })).toBe(11);
    expect(estimateModelCostCents({ model: "gpt-image-2.6-sunburst" })).toBe(
      11,
    );
  });

  it("estimates flat and token pricing in cents", () => {
    expect(estimateModelCostCents({ model: "gpt-image-1-mini" })).toBe(1.1);
    expect(
      estimateModelCostCents({
        model: "gpt-4.1",
        tokensIn: 1_000_000,
        tokensOut: 0,
      }),
    ).toBe(200);
  });

  it("returns undefined when pricing cannot be computed", () => {
    expect(estimateModelCostCents({ model: "unknown-model" })).toBeUndefined();
    expect(estimateModelCostCents({ model: "gpt-4.1" })).toBeUndefined();
  });
});
