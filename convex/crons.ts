import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run heartbeat every minute to check due monitors
crons.interval(
  "heartbeat",
  { minutes: 1 },
  internal.monitoring.runHeartbeat
);

// Cleanup old checks daily at 2 AM UTC
crons.daily(
  "cleanup-old-checks",
  { hourUTC: 2, minuteUTC: 0 },
  internal.monitoring.cleanupOldChecks
);

export default crons;
