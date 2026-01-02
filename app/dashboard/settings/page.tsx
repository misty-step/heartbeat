"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArrowLeft, Mail, Webhook, Bell, BellOff, Send } from "lucide-react";
import Link from "next/link";

type ThrottleMinutes = 5 | 15 | 30 | 60;

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const settings = useQuery(
    api.userSettings.getOrCreate,
    isAuthenticated ? {} : "skip",
  );
  const updateSettings = useMutation(api.userSettings.update);
  const ensureExists = useMutation(api.userSettings.ensureExists);
  const sendTestEmail = useAction(api.notifications.sendTestEmail);
  const sendTestWebhook = useAction(api.notifications.sendTestWebhook);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(
    null,
  );
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [isSendingTestWebhook, setIsSendingTestWebhook] = useState(false);

  // Form state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notifyOnDown, setNotifyOnDown] = useState(true);
  const [notifyOnRecovery, setNotifyOnRecovery] = useState(true);
  const [throttleMinutes, setThrottleMinutes] = useState<ThrottleMinutes>(5);
  const [webhookUrl, setWebhookUrl] = useState("");

  // Sync form state when settings load
  useEffect(() => {
    if (settings) {
      setEmailNotifications(settings.emailNotifications);
      setNotifyOnDown(settings.notifyOnDown);
      setNotifyOnRecovery(settings.notifyOnRecovery);
      setThrottleMinutes(settings.throttleMinutes as ThrottleMinutes);
      setWebhookUrl(settings.webhookUrl || "");
    }
  }, [settings]);

  // Ensure settings exist on first visit
  useEffect(() => {
    if (isAuthenticated && settings && !settings._id) {
      ensureExists();
    }
  }, [isAuthenticated, settings, ensureExists]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateSettings({
        emailNotifications,
        notifyOnDown,
        notifyOnRecovery,
        throttleMinutes,
        webhookUrl: webhookUrl.trim() || undefined,
      });
      setSaveMessage("Settings saved");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save settings";
      setSaveMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if form has unsaved changes
  const hasChanges =
    settings &&
    (emailNotifications !== settings.emailNotifications ||
      notifyOnDown !== settings.notifyOnDown ||
      notifyOnRecovery !== settings.notifyOnRecovery ||
      throttleMinutes !== settings.throttleMinutes ||
      (webhookUrl.trim() || undefined) !== (settings.webhookUrl || undefined));

  const handleTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);

    try {
      const result = await sendTestEmail();
      if (result.success) {
        setTestEmailStatus("Test email sent!");
      } else {
        setTestEmailStatus(result.error || "Failed to send test email");
      }
    } catch (error) {
      setTestEmailStatus(
        error instanceof Error ? error.message : "Failed to send test email",
      );
    } finally {
      setIsSendingTestEmail(false);
      setTimeout(() => setTestEmailStatus(null), 5000);
    }
  };

  const handleTestWebhook = async () => {
    setIsSendingTestWebhook(true);
    setTestWebhookStatus(null);

    try {
      const result = await sendTestWebhook();
      if (result.success) {
        setTestWebhookStatus("Webhook sent successfully!");
      } else {
        setTestWebhookStatus(result.error || "Failed to send test webhook");
      }
    } catch (error) {
      setTestWebhookStatus(
        error instanceof Error ? error.message : "Failed to send test webhook",
      );
    } finally {
      setIsSendingTestWebhook(false);
      setTimeout(() => setTestWebhookStatus(null), 5000);
    }
  };

  if (authLoading || settings === undefined) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground/60 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-foreground/50">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-12 lg:px-24 py-8 sm:py-12">
      <div className="max-w-2xl space-y-8">
        {/* Header with back link */}
        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl tracking-tight text-foreground">
            Notification Settings
          </h1>
          <p className="text-foreground/60">
            Configure how you want to be notified when your monitors go down or
            recover.
          </p>
        </div>

        {/* Email section */}
        <section className="space-y-6 pt-6 border-t border-foreground/10">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-foreground/60" />
            <h2 className="font-serif text-xl text-foreground">
              Email Notifications
            </h2>
          </div>

          {/* Email address (read-only) + Test button */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/70">
              Email Address
            </label>
            <div className="flex gap-3">
              <div className="flex-1 px-4 py-3 bg-foreground/5 border border-foreground/10 text-foreground/70">
                {settings.email || "No email on file"}
              </div>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={isSendingTestEmail || !settings.email}
                className="px-4 py-2 border border-foreground/20 text-foreground/70 hover:bg-foreground/5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSendingTestEmail ? "Sending..." : "Test"}
              </button>
            </div>
            {testEmailStatus && (
              <p
                className={`text-sm ${
                  testEmailStatus === "Test email sent!"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {testEmailStatus}
              </p>
            )}
            <p className="text-xs text-foreground/40">
              This is your account email from Clerk. Contact support to change
              it.
            </p>
          </div>

          {/* Master toggle */}
          <label className="flex items-center justify-between py-3 cursor-pointer group">
            <div className="flex items-center gap-3">
              {emailNotifications ? (
                <Bell className="h-5 w-5 text-foreground/60" />
              ) : (
                <BellOff className="h-5 w-5 text-foreground/40" />
              )}
              <div>
                <span className="text-foreground font-medium">
                  Enable email notifications
                </span>
                <p className="text-sm text-foreground/50">
                  Receive email alerts when monitors change status
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-5 h-5 accent-foreground cursor-pointer"
            />
          </label>

          {/* Conditional settings when enabled */}
          {emailNotifications && (
            <div className="pl-8 space-y-4 border-l-2 border-foreground/10">
              {/* Notify on down */}
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <span className="text-foreground">
                    Notify when monitor goes down
                  </span>
                  <p className="text-sm text-foreground/50">
                    After 3 consecutive failed checks
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnDown}
                  onChange={(e) => setNotifyOnDown(e.target.checked)}
                  className="w-4 h-4 accent-foreground cursor-pointer"
                />
              </label>

              {/* Notify on recovery */}
              <label className="flex items-center justify-between py-2 cursor-pointer">
                <div>
                  <span className="text-foreground">
                    Notify when monitor recovers
                  </span>
                  <p className="text-sm text-foreground/50">
                    When a down monitor comes back up
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnRecovery}
                  onChange={(e) => setNotifyOnRecovery(e.target.checked)}
                  className="w-4 h-4 accent-foreground cursor-pointer"
                />
              </label>

              {/* Throttle */}
              <div className="space-y-2 py-2">
                <label className="block text-foreground">
                  Minimum time between alerts
                </label>
                <select
                  value={throttleMinutes}
                  onChange={(e) =>
                    setThrottleMinutes(
                      Number(e.target.value) as ThrottleMinutes,
                    )
                  }
                  className="w-full max-w-xs px-4 py-2 bg-transparent border border-foreground/20 text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
                >
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
                <p className="text-sm text-foreground/50">
                  Prevents notification spam if a monitor flaps up and down
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Webhook section */}
        <section className="space-y-6 pt-6 border-t border-foreground/10">
          <div className="flex items-center gap-3">
            <Webhook className="h-5 w-5 text-foreground/60" />
            <h2 className="font-serif text-xl text-foreground">Webhook</h2>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground/70">
              Webhook URL
              <span className="ml-2 text-foreground/40 font-normal">
                (optional)
              </span>
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="flex-1 px-4 py-3 bg-transparent border border-foreground/20 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-foreground/50 transition-colors"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={isSendingTestWebhook || !settings.webhookUrl}
                className="px-4 py-2 border border-foreground/20 text-foreground/70 hover:bg-foreground/5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSendingTestWebhook ? "Sending..." : "Test"}
              </button>
            </div>
            {testWebhookStatus && (
              <p
                className={`text-sm ${
                  testWebhookStatus === "Webhook sent successfully!"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {testWebhookStatus}
              </p>
            )}
            <p className="text-xs text-foreground/40">
              We'll POST a JSON payload to this URL when incidents open or
              resolve. Must use HTTPS.
            </p>
          </div>
        </section>

        {/* Save button */}
        <div className="flex items-center gap-4 pt-6 border-t border-foreground/10">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-6 py-2 bg-foreground text-background font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          {saveMessage && (
            <span
              className={`text-sm ${
                saveMessage === "Settings saved"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {saveMessage}
            </span>
          )}
          {!hasChanges && !saveMessage && (
            <span className="text-sm text-foreground/40">
              No unsaved changes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
