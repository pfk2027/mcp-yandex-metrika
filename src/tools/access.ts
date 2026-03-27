import { z } from "zod";
import type { Ctx } from "../api.js";
import * as S from "../schemas.js";

export function register(ctx: Ctx): void {
  const { server, mgmt, fmt, parseJson } = ctx;

  // ==================== GRANTS (access permissions) ====================

  server.registerTool("grants_get", {
    description: "List all access grants for a counter. Shows who has access and their permission level.",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/grants`));
  });

  server.registerTool("grant_create", {
    description: "Grant access to a counter for another Yandex user.",
    inputSchema: {
      counterId: S.counterId,
      userLogin: S.userLogin.describe("Yandex login of the user to grant access"),
      perm: S.perm,
      comment: S.optionalComment,
    },
  }, async ({ counterId, userLogin, perm, comment }) => {
    const grant: Record<string, unknown> = { user_login: userLogin, perm };
    if (comment) grant.comment = comment;
    return fmt(await mgmt("POST", `counter/${counterId}/grants`, undefined, { grant }));
  });

  server.registerTool("grant_update", {
    description: "Change permission level for an existing grant.",
    inputSchema: {
      counterId: S.counterId,
      userLogin: S.userLogin,
      perm: S.perm.describe("New permission level"),
      comment: S.optionalComment.describe("Updated comment"),
    },
  }, async ({ counterId, userLogin, perm, comment }) => {
    const grant: Record<string, unknown> = { perm };
    if (comment) grant.comment = comment;
    return fmt(await mgmt("PUT", `counter/${counterId}/grant/${userLogin}`, undefined, { grant }));
  });

  server.registerTool("grant_delete", {
    description: "Revoke access to a counter for a user.",
    inputSchema: {
      counterId: S.counterId,
      userLogin: S.userLogin.describe("Yandex login of the user to revoke"),
    },
  }, async ({ counterId, userLogin }) => {
    return fmt(await mgmt("DELETE", `counter/${counterId}/grant/${userLogin}`));
  });

  // ==================== DELEGATES ====================

  server.registerTool("delegates_get", {
    description: "List delegates — users who have access to your account's counters.",
    inputSchema: {},
  }, async () => {
    return fmt(await mgmt("GET", "delegates"));
  });

  server.registerTool("delegate_add", {
    description: "Add a delegate — grant account-level access to another Yandex user.",
    inputSchema: {
      userLogin: S.userLogin.describe("Yandex login of the delegate"),
      comment: S.optionalComment,
    },
  }, async ({ userLogin, comment }) => {
    const delegate: Record<string, unknown> = { user_login: userLogin };
    if (comment) delegate.comment = comment;
    return fmt(await mgmt("POST", "delegates", undefined, { delegate }));
  });

  server.registerTool("delegate_delete", {
    description: "Remove a delegate — revoke account-level access.",
    inputSchema: {
      userLogin: S.userLogin.describe("Yandex login of the delegate to remove"),
    },
  }, async ({ userLogin }) => {
    return fmt(await mgmt("DELETE", `delegate/${userLogin}`));
  });

  // ==================== ACCOUNTS ====================

  server.registerTool("accounts_get", {
    description: "List all accounts accessible to the current user (as delegate). Shows which accounts you have delegate access to.",
    inputSchema: {},
  }, async () => {
    return fmt(await mgmt("GET", "accounts"));
  });

  // ==================== SEGMENTS ====================

  server.registerTool("segments_get", {
    description: "List saved segments for a counter. Segments are reusable audience filters for reports.",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/apisegment/segments`));
  });

  server.registerTool("segment_info", {
    description: "Get details of a specific segment.",
    inputSchema: {
      counterId: S.counterId,
      segmentId: S.segmentId,
    },
  }, async ({ counterId, segmentId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/apisegment/segment/${segmentId}`));
  });

  server.registerTool("segment_create", {
    description: "Create a saved segment for a counter. Use filter expressions to define the audience.",
    inputSchema: {
      counterId: S.counterId,
      name: z.string().describe("Segment name"),
      expression: z.string().describe("Filter expression defining the segment. Example: ym:s:regionCity==213 (Moscow)"),
    },
  }, async ({ counterId, name, expression }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/apisegment/segments`, undefined, {
      segment: { name, expression },
    }));
  });

  server.registerTool("segment_update", {
    description: "Update a saved segment (name or expression).",
    inputSchema: {
      counterId: S.counterId,
      segmentId: S.segmentId,
      data: S.segmentData,
    },
  }, async ({ counterId, segmentId, data }) => {
    const [parsed, err] = parseJson(data);
    if (err) return err;
    return fmt(await mgmt("PUT", `counter/${counterId}/apisegment/segment/${segmentId}`, undefined, { segment: parsed }));
  });

  server.registerTool("segment_delete", {
    description: "Delete a saved segment.",
    inputSchema: {
      counterId: S.counterId,
      segmentId: S.segmentId,
    },
  }, async ({ counterId, segmentId }) => {
    return fmt(await mgmt("DELETE", `counter/${counterId}/apisegment/segment/${segmentId}`));
  });
}
