import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { sendEmail, formatTimestamp, formatDuration } from "./lib/email";

/**
 * Send notification for an incident (opened or resolved).
 * Checks user preferences, throttling, and sends email/webhook.
 */
export const sendIncidentNotification = internalAction({
  args: {
    incidentId: v.id("incidents"),
    type: v.union(v.literal("opened"), v.literal("resolved")),
  },
  handler: async (ctx, args) => {
    // Load incident
    const incident = await ctx.runQuery(internal.notifications.getIncident, {
      incidentId: args.incidentId,
    });

    if (!incident) {
      console.error(`[Notification] Incident ${args.incidentId} not found`);
      return;
    }

    // Load monitor
    const monitor = await ctx.runQuery(internal.monitors.getInternal, {
      id: incident.monitorId,
    });

    if (!monitor) {
      console.error(`[Notification] Monitor ${incident.monitorId} not found`);
      return;
    }

    // Load user settings
    const settings = await ctx.runQuery(internal.userSettings.getByUserId, {
      userId: monitor.userId,
    });

    // If no settings exist, user hasn't configured notifications yet
    if (!settings) {
      console.log(
        `[Notification] No settings for user ${monitor.userId}, skipping`,
      );
      return;
    }

    // Check if notifications are enabled
    if (!settings.emailNotifications) {
      console.log(
        `[Notification] Email notifications disabled for user ${monitor.userId}`,
      );
      return;
    }

    // Check type-specific preference
    if (args.type === "opened" && !settings.notifyOnDown) {
      console.log(`[Notification] notifyOnDown disabled, skipping`);
      return;
    }

    if (args.type === "resolved" && !settings.notifyOnRecovery) {
      console.log(`[Notification] notifyOnRecovery disabled, skipping`);
      return;
    }

    // Check throttling (only for opened notifications)
    if (args.type === "opened" && incident.notifiedAt) {
      const throttleMs = settings.throttleMinutes * 60 * 1000;
      const timeSinceLastNotification = Date.now() - incident.notifiedAt;

      if (timeSinceLastNotification < throttleMs) {
        console.log(
          `[Notification] Throttled: ${timeSinceLastNotification}ms < ${throttleMs}ms`,
        );
        return;
      }
    }

    // Build email content
    const { subject, text } = buildEmailContent(args.type, monitor, incident);

    // Send email
    console.log(
      `[Notification] Sending ${args.type} email to ${settings.email}`,
    );

    const result = await sendEmail({
      to: settings.email,
      subject,
      text,
    });

    if (result.success) {
      console.log(`[Notification] Email sent: ${result.id}`);

      // Mark incident as notified
      await ctx.runMutation(internal.notifications.markNotified, {
        incidentId: args.incidentId,
      });
    } else {
      console.error(`[Notification] Email failed: ${result.error}`);
    }

    // Send webhook if configured
    if (settings.webhookUrl) {
      await sendWebhook(settings.webhookUrl, args.type, monitor, incident);
    }
  },
});

/**
 * Build email subject and body for notification.
 */
function buildEmailContent(
  type: "opened" | "resolved",
  monitor: { name: string; url: string },
  incident: { startedAt: number; resolvedAt?: number },
): { subject: string; text: string } {
  if (type === "opened") {
    return {
      subject: `[Heartbeat] ${monitor.name} is down`,
      text: `${monitor.name} has gone down after 3 consecutive failed checks.

Monitor: ${monitor.name}
URL: ${monitor.url}
Started: ${formatTimestamp(incident.startedAt)}

---
Heartbeat Uptime Monitoring`,
    };
  }

  // Resolved
  const duration = incident.resolvedAt
    ? formatDuration(incident.resolvedAt - incident.startedAt)
    : "unknown";

  return {
    subject: `[Heartbeat] ${monitor.name} is back up`,
    text: `${monitor.name} has recovered and is now responding normally.

Monitor: ${monitor.name}
URL: ${monitor.url}
Down for: ${duration}
Resolved: ${formatTimestamp(incident.resolvedAt ?? Date.now())}

---
Heartbeat Uptime Monitoring`,
  };
}

/**
 * Send webhook notification.
 */
async function sendWebhook(
  url: string,
  type: "opened" | "resolved",
  monitor: { _id: string; name: string; url: string },
  incident: {
    _id: string;
    title: string;
    startedAt: number;
    resolvedAt?: number;
  },
): Promise<void> {
  const payload = {
    event: type === "opened" ? "incident.opened" : "incident.resolved",
    monitor: {
      id: monitor._id,
      name: monitor.name,
      url: monitor.url,
    },
    incident: {
      id: incident._id,
      title: incident.title,
      startedAt: incident.startedAt,
      ...(type === "resolved" && incident.resolvedAt
        ? { resolvedAt: incident.resolvedAt }
        : {}),
    },
    timestamp: Date.now(),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Heartbeat/1.0",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[Notification] Webhook sent to ${url}`);
    } else {
      console.error(
        `[Notification] Webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Notification] Webhook error: ${message}`);
  }
}

/**
 * Internal query to get incident by ID.
 */
export const getIncident = internalQuery({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.incidentId);
  },
});

/**
 * Mark an incident as notified.
 */
export const markNotified = internalMutation({
  args: { incidentId: v.id("incidents") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.incidentId, {
      notifiedAt: Date.now(),
    });
  },
});

/**
 * Send a test notification email.
 * Used to verify email setup is working.
 */
export const sendTestEmail = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const settings = await ctx.runQuery(internal.userSettings.getByUserId, {
      userId: identity.subject,
    });

    if (!settings) {
      return { success: false, error: "No notification settings found" };
    }

    if (!settings.email) {
      return { success: false, error: "No email address on file" };
    }

    const result = await sendEmail({
      to: settings.email,
      subject: "[Heartbeat] Test Notification",
      text: `This is a test notification from Heartbeat.

If you're receiving this, your email notifications are working correctly.

---
Heartbeat Uptime Monitoring`,
    });

    return result;
  },
});

/**
 * Send a test webhook.
 * Used to verify webhook setup is working.
 */
export const sendTestWebhook = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const settings = await ctx.runQuery(internal.userSettings.getByUserId, {
      userId: identity.subject,
    });

    if (!settings) {
      return { success: false, error: "No notification settings found" };
    }

    if (!settings.webhookUrl) {
      return { success: false, error: "No webhook URL configured" };
    }

    const payload = {
      event: "test",
      message: "This is a test webhook from Heartbeat",
      timestamp: Date.now(),
    };

    try {
      const response = await fetch(settings.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Heartbeat/1.0",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: `Webhook returned ${response.status} ${response.statusText}`,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: message };
    }
  },
});
