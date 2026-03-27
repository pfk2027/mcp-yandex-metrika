import { z } from "zod";
import type { Ctx } from "../api.js";
import * as S from "../schemas.js";

export function register(ctx: Ctx): void {
  const { server, mgmt, fmt, parseJson } = ctx;

  // ==================== GOALS ====================

  server.registerTool("goals_get", {
    description: "Get all goals for a counter. Returns goal IDs, names, types — needed for goal metrics like ym:s:goal<ID>reaches.",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/goals`));
  });

  server.registerTool("goal_info", {
    description: "Get detailed info about a specific goal.",
    inputSchema: {
      counterId: S.counterId,
      goalId: S.goalId,
    },
  }, async ({ counterId, goalId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/goal/${goalId}`));
  });

  server.registerTool("goal_create", {
    description: "Create a new goal for a counter. Supports URL, event, composite, and other goal types.",
    inputSchema: {
      counterId: S.counterId,
      name: z.string().describe("Goal name"),
      type: z.enum(["url", "number", "step", "action", "phone", "email", "form", "messenger", "file", "search", "payment_system", "social", "button"]).describe("Goal type"),
      conditions: z.string().optional().describe('JSON array of conditions. For url: [{"type":"contain","url":"thank-you"}]. For action: [{"type":"exact","url":"purchase"}]. For step: [{"type":"contain","url":"/step1"}]'),
      isRetargeting: z.boolean().default(false).describe("Use for retargeting in Yandex Direct"),
    },
  }, async ({ counterId, name, type, conditions, isRetargeting }) => {
    const goal: Record<string, unknown> = { name, type, is_retargeting: isRetargeting ? 1 : 0 };
    if (conditions) {
      const [parsed, err] = parseJson(conditions);
      if (err) return err;
      goal.conditions = parsed;
    }
    return fmt(await mgmt("POST", `counter/${counterId}/goals`, undefined, { goal }));
  });

  server.registerTool("goal_update", {
    description: "Update an existing goal (name, conditions, retargeting flag).",
    inputSchema: {
      counterId: S.counterId,
      goalId: S.goalId,
      data: S.goalData,
    },
  }, async ({ counterId, goalId, data }) => {
    const [parsed, err] = parseJson(data);
    if (err) return err;
    return fmt(await mgmt("PUT", `counter/${counterId}/goal/${goalId}`, undefined, { goal: parsed }));
  });

  server.registerTool("goal_delete", {
    description: "Delete a goal from a counter.",
    inputSchema: {
      counterId: S.counterId,
      goalId: S.goalId,
    },
  }, async ({ counterId, goalId }) => {
    return fmt(await mgmt("DELETE", `counter/${counterId}/goal/${goalId}`));
  });
}
