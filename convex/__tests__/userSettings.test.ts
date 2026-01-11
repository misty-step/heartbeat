import { test, expect, describe, beforeEach } from "vitest";
import { api, internal } from "../_generated/api";
import { setupBackend } from "../../tests/convex";

const user = {
  name: "Test User",
  subject: "user_123",
  issuer: "clerk",
  email: "test@example.com",
};

const userWithoutEmail = {
  name: "No Email User",
  subject: "user_no_email",
  issuer: "clerk",
};

const otherUser = {
  name: "Other User",
  subject: "user_456",
  issuer: "clerk",
  email: "other@example.com",
};

describe("getOrCreate", () => {
  test("returns defaults for new user", async () => {
    const t = setupBackend();

    const settings = await t
      .withIdentity(user)
      .query(api.userSettings.getOrCreate);

    expect(settings).toMatchObject({
      _id: null,
      userId: user.subject,
      email: user.email,
      emailNotifications: true,
      notifyOnDown: true,
      notifyOnRecovery: true,
      throttleMinutes: 5,
    });
    expect(settings.webhookUrl).toBeUndefined();
  });

  test("extracts email from identity", async () => {
    const t = setupBackend();

    const settings = await t
      .withIdentity(user)
      .query(api.userSettings.getOrCreate);

    expect(settings.email).toBe("test@example.com");
  });

  test("handles identity without email", async () => {
    const t = setupBackend();

    const settings = await t
      .withIdentity(userWithoutEmail)
      .query(api.userSettings.getOrCreate);

    expect(settings.email).toBe("");
  });

  test("returns existing settings if present", async () => {
    const t = setupBackend();

    // First create settings via ensureExists
    await t.withIdentity(user).mutation(api.userSettings.ensureExists);

    // Update a field
    await t.withIdentity(user).mutation(api.userSettings.update, {
      throttleMinutes: 15,
    });

    // Get should return persisted settings
    const settings = await t
      .withIdentity(user)
      .query(api.userSettings.getOrCreate);

    expect(settings._id).not.toBeNull();
    expect(settings.throttleMinutes).toBe(15);
  });

  test("requires authentication", async () => {
    const t = setupBackend();

    await expect(t.query(api.userSettings.getOrCreate)).rejects.toThrow(
      "Unauthorized",
    );
  });

  test("returns user-specific settings", async () => {
    const t = setupBackend();

    // Create settings for both users
    await t.withIdentity(user).mutation(api.userSettings.ensureExists);
    await t.withIdentity(otherUser).mutation(api.userSettings.ensureExists);

    // Update different values
    await t.withIdentity(user).mutation(api.userSettings.update, {
      throttleMinutes: 10,
    });
    await t.withIdentity(otherUser).mutation(api.userSettings.update, {
      throttleMinutes: 30,
    });

    // Verify isolation
    const userSettings = await t
      .withIdentity(user)
      .query(api.userSettings.getOrCreate);
    const otherSettings = await t
      .withIdentity(otherUser)
      .query(api.userSettings.getOrCreate);

    expect(userSettings.throttleMinutes).toBe(10);
    expect(otherSettings.throttleMinutes).toBe(30);
  });
});

describe("ensureExists", () => {
  test("creates settings for new user", async () => {
    const t = setupBackend();

    const settings = await t
      .withIdentity(user)
      .mutation(api.userSettings.ensureExists);

    expect(settings).toBeDefined();
    expect(settings!._id).toBeDefined();
    expect(settings!.userId).toBe(user.subject);
    expect(settings!.email).toBe(user.email);
  });

  test("returns existing settings without modification", async () => {
    const t = setupBackend();

    // Create initial
    const initial = await t
      .withIdentity(user)
      .mutation(api.userSettings.ensureExists);

    // Update
    await t.withIdentity(user).mutation(api.userSettings.update, {
      emailNotifications: false,
    });

    // Ensure exists again should return same record
    const again = await t
      .withIdentity(user)
      .mutation(api.userSettings.ensureExists);

    expect(again!._id).toEqual(initial!._id);
    expect(again!.emailNotifications).toBe(false);
  });

  test("sets correct default values", async () => {
    const t = setupBackend();

    const settings = await t
      .withIdentity(user)
      .mutation(api.userSettings.ensureExists);

    expect(settings).toMatchObject({
      emailNotifications: true,
      notifyOnDown: true,
      notifyOnRecovery: true,
      throttleMinutes: 5,
    });
    expect(settings!.createdAt).toBeDefined();
    expect(settings!.updatedAt).toBeDefined();
  });

  test("requires authentication", async () => {
    const t = setupBackend();

    await expect(t.mutation(api.userSettings.ensureExists)).rejects.toThrow(
      "Unauthorized",
    );
  });
});

describe("update", () => {
  describe("basic updates", () => {
    test("updates emailNotifications", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        emailNotifications: false,
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.emailNotifications).toBe(false);
    });

    test("updates notifyOnDown", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        notifyOnDown: false,
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.notifyOnDown).toBe(false);
    });

    test("updates notifyOnRecovery", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        notifyOnRecovery: false,
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.notifyOnRecovery).toBe(false);
    });

    test("updates throttleMinutes", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        throttleMinutes: 30,
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.throttleMinutes).toBe(30);
    });

    test("updates multiple fields at once", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        emailNotifications: false,
        notifyOnDown: false,
        throttleMinutes: 15,
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.emailNotifications).toBe(false);
      expect(settings.notifyOnDown).toBe(false);
      expect(settings.throttleMinutes).toBe(15);
    });

    test("creates settings if they don't exist", async () => {
      const t = setupBackend();

      // Update without calling ensureExists first
      const result = await t
        .withIdentity(user)
        .mutation(api.userSettings.update, {
          throttleMinutes: 20,
        });

      expect(result).toBeDefined();
      expect(result!._id).toBeDefined();
      expect(result!.throttleMinutes).toBe(20);
    });

    test("updates updatedAt timestamp", async () => {
      const t = setupBackend();

      const initial = await t
        .withIdentity(user)
        .mutation(api.userSettings.ensureExists);
      const initialUpdatedAt = initial!.updatedAt;

      // Small delay to ensure timestamp differs
      await new Promise((resolve) => setTimeout(resolve, 10));

      await t.withIdentity(user).mutation(api.userSettings.update, {
        throttleMinutes: 30,
      });

      const updated = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(updated.updatedAt).toBeGreaterThan(initialUpdatedAt);
    });
  });

  describe("webhook URL validation", () => {
    test("accepts valid HTTPS webhook URL", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        webhookUrl: "https://example.com/webhook",
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.webhookUrl).toBe("https://example.com/webhook");
    });

    test("rejects HTTP webhook URL", async () => {
      const t = setupBackend();

      await expect(
        t.withIdentity(user).mutation(api.userSettings.update, {
          webhookUrl: "http://example.com/webhook",
        }),
      ).rejects.toThrow("Webhook URL must use HTTPS");
    });

    test("rejects invalid webhook URL", async () => {
      const t = setupBackend();

      await expect(
        t.withIdentity(user).mutation(api.userSettings.update, {
          webhookUrl: "not-a-url",
        }),
      ).rejects.toThrow("Invalid webhook URL");
    });

    test("allows empty string to clear webhook", async () => {
      const t = setupBackend();

      // First set a webhook
      await t.withIdentity(user).mutation(api.userSettings.update, {
        webhookUrl: "https://example.com/webhook",
      });

      // Then clear it
      await t.withIdentity(user).mutation(api.userSettings.update, {
        webhookUrl: "",
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.webhookUrl).toBeUndefined();
    });

    test("accepts webhook URL with path and query params", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        webhookUrl: "https://example.com/api/v1/webhook?token=abc123",
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.webhookUrl).toBe(
        "https://example.com/api/v1/webhook?token=abc123",
      );
    });
  });

  describe("throttle validation", () => {
    test("accepts minimum throttle (5 minutes)", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        throttleMinutes: 5,
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.throttleMinutes).toBe(5);
    });

    test("accepts maximum throttle (60 minutes)", async () => {
      const t = setupBackend();

      await t.withIdentity(user).mutation(api.userSettings.update, {
        throttleMinutes: 60,
      });

      const settings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(settings.throttleMinutes).toBe(60);
    });

    test("rejects throttle below minimum", async () => {
      const t = setupBackend();

      await expect(
        t.withIdentity(user).mutation(api.userSettings.update, {
          throttleMinutes: 4,
        }),
      ).rejects.toThrow("Throttle must be between 5 and 60 minutes");
    });

    test("rejects throttle above maximum", async () => {
      const t = setupBackend();

      await expect(
        t.withIdentity(user).mutation(api.userSettings.update, {
          throttleMinutes: 61,
        }),
      ).rejects.toThrow("Throttle must be between 5 and 60 minutes");
    });

    test("rejects negative throttle", async () => {
      const t = setupBackend();

      await expect(
        t.withIdentity(user).mutation(api.userSettings.update, {
          throttleMinutes: -1,
        }),
      ).rejects.toThrow("Throttle must be between 5 and 60 minutes");
    });
  });

  describe("authentication", () => {
    test("requires authentication", async () => {
      const t = setupBackend();

      await expect(
        t.mutation(api.userSettings.update, {
          emailNotifications: false,
        }),
      ).rejects.toThrow("Unauthorized");
    });

    test("users cannot update other users' settings", async () => {
      const t = setupBackend();

      // Create settings for user
      await t.withIdentity(user).mutation(api.userSettings.ensureExists);
      await t.withIdentity(user).mutation(api.userSettings.update, {
        throttleMinutes: 10,
      });

      // Other user updates their own settings
      await t.withIdentity(otherUser).mutation(api.userSettings.update, {
        throttleMinutes: 30,
      });

      // Verify original user's settings unchanged
      const userSettings = await t
        .withIdentity(user)
        .query(api.userSettings.getOrCreate);

      expect(userSettings.throttleMinutes).toBe(10);
    });
  });
});

describe("getByUserId (internal)", () => {
  test("returns settings for user", async () => {
    const t = setupBackend();

    // Create settings
    await t.withIdentity(user).mutation(api.userSettings.ensureExists);

    // Query internally
    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: user.subject,
    });

    expect(settings).toBeDefined();
    expect(settings!.userId).toBe(user.subject);
  });

  test("returns null for user without settings", async () => {
    const t = setupBackend();

    const settings = await t.query(internal.userSettings.getByUserId, {
      userId: "nonexistent_user",
    });

    expect(settings).toBeNull();
  });
});
