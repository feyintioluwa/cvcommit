import { createAdminClient } from "@/lib/supabase/admin";
import type { CareerOSCVAccess } from "@/lib/access/server-access";

/*
 * Usage limits for ONE paid CV unlock.
 * Change these two numbers to raise or lower the limits.
 * No database change is needed.
 */
export const CV_UNLOCK_LIMITS = {
  fix: 60,
  download: 30,
} as const;

export const CV_LIMIT_MESSAGE =
  "You have reached the usage limit for this CV unlock. Please contact CVCommit support if you need more.";

export type CVQuotaKind =
  keyof typeof CV_UNLOCK_LIMITS;

/*
 * Counts one use of a paid unlock (a Fix request or a download).
 * The counting happens in the database function consume_cv_quota,
 * which can only be called by the server.
 *
 * - Accounts on the older account-wide "pro" plan have no per-CV
 *   record, so they are not limited here.
 * - If the check itself fails (for example a database problem),
 *   the request is allowed and the error is logged, so a paying
 *   user is never blocked by a technical fault.
 */
export async function consumeCVQuota(
  access: CareerOSCVAccess,
  kind: CVQuotaKind
): Promise<{ allowed: boolean }> {
  if (access.plan === "pro") {
    return { allowed: true };
  }

  if (!access.userId || !access.cvHash) {
    return { allowed: true };
  }

  try {
    const { data, error } =
      await createAdminClient().rpc(
        "consume_cv_quota",
        {
          p_user:
            access.userId,
          p_cv_hash:
            access.cvHash,
          p_kind:
            kind,
          p_limit:
            CV_UNLOCK_LIMITS[kind],
        }
      );

    if (error) {
      console.error(
        "CVCommit: Usage check failed. Allowing the request.",
        error.message
      );

      return { allowed: true };
    }

    return {
      allowed:
        data !== "limit",
    };
  } catch (quotaError) {
    console.error(
      "CVCommit: Usage check failed. Allowing the request.",
      quotaError
    );

    return { allowed: true };
  }
}