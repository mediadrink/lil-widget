"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LilHelperButton } from "@/components/LilHelperButton";

type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<User | null>(null);

  // Edit modes
  const [editingEmail, setEditingEmail] = React.useState(false);
  const [editingPassword, setEditingPassword] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);

  // Form values
  const [newEmail, setNewEmail] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [subscriptionTier, setSubscriptionTier] = React.useState<"free" | "paid">("free");

  // UI state
  const [saving, setSaving] = React.useState(false);
  const [toast, setToast] = React.useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  function showSuccessToast(message: string) {
    setToast({ message, type: "success" });
    setTimeout(() => setToast(null), 3000);
  }

  function showErrorToast(message: string) {
    setToast({ message, type: "error" });
    setTimeout(() => setToast(null), 5000);
  }

  React.useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const res = await fetch("/api/auth/user", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Not authenticated");
      }

      const data = await res.json();
      setUser(data.user);
      setNewEmail(data.user.email || "");
      setFullName(data.user.user_metadata?.full_name || "");
      setSubscriptionTier(data.user.user_metadata?.subscription_tier || "free");
    } catch (err) {
      console.error("Load user error:", err);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function updateEmail() {
    if (!newEmail.trim()) {
      showErrorToast("Email is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update email");
      }

      showSuccessToast("✅ Email updated! Check your inbox to confirm.");
      setEditingEmail(false);
      await loadUser();
    } catch (err: any) {
      showErrorToast(err.message || "Failed to update email");
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword() {
    if (!newPassword || !confirmPassword) {
      showErrorToast("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast("Passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password");
      }

      showSuccessToast("✅ Password updated successfully!");
      setEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showErrorToast(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  async function updateName() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update name");
      }

      showSuccessToast("✅ Name updated!");
      setEditingName(false);
      await loadUser();
    } catch (err: any) {
      showErrorToast(err.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  async function updateSubscriptionTier(tier: "free" | "paid") {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_tier: tier }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update subscription tier");
      }

      setSubscriptionTier(tier);
      showSuccessToast(`✅ Subscription updated to ${tier === "paid" ? "Paid" : "Free"} tier!`);
      await loadUser();
    } catch (err: any) {
      showErrorToast(err.message || "Failed to update subscription");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Top Level Navigation */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Lil' Widget</div>
          <div className="flex items-center gap-6">
            <a
              className="text-sm font-medium hover:text-black text-neutral-500"
              href="/dashboard/widgets"
            >
              My Widgets
            </a>
            <a
              className="text-sm font-medium hover:text-black border-b-2 border-black"
              href="/dashboard/account"
            >
              Account
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
        <p className="text-neutral-600 text-base mb-12">
          Manage your account information and security
        </p>

        <div className="space-y-8">
          {/* Full Name */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Full Name</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Your display name for the dashboard
                </p>
              </div>
              {!editingName && (
                <button
                  onClick={() => setEditingName(true)}
                  className="rounded-lg border-2 border-neutral-900 px-4 py-2 text-sm text-neutral-900 font-medium hover:bg-neutral-50 transition-colors"
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {!editingName ? (
              <div className="text-base text-neutral-900">
                {user?.user_metadata?.full_name || fullName || "Not set"}
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={updateName}
                    disabled={saving}
                    className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setFullName(user?.user_metadata?.full_name || "");
                    }}
                    className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Email */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Email Address</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Your email for login and notifications
                </p>
              </div>
              {!editingEmail && (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="rounded-lg border-2 border-neutral-900 px-4 py-2 text-sm text-neutral-900 font-medium hover:bg-neutral-50 transition-colors"
                >
                  ✏️ Edit
                </button>
              )}
            </div>

            {!editingEmail ? (
              <div className="text-base text-neutral-900">{user?.email || "Not set"}</div>
            ) : (
              <div className="space-y-4">
                <input
                  type="email"
                  className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                  placeholder="you@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <p className="text-xs text-neutral-600">
                  You'll receive a confirmation email at the new address
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={updateEmail}
                    disabled={saving}
                    className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmail(false);
                      setNewEmail(user?.email || "");
                    }}
                    className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Password */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Password</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Change your password to keep your account secure
                </p>
              </div>
              {!editingPassword && (
                <button
                  onClick={() => setEditingPassword(true)}
                  className="rounded-lg border-2 border-neutral-900 px-4 py-2 text-sm text-neutral-900 font-medium hover:bg-neutral-50 transition-colors"
                >
                  ✏️ Change
                </button>
              )}
            </div>

            {!editingPassword ? (
              <div className="text-base text-neutral-900">••••••••</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-lg border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none px-4 py-2.5 text-sm transition-colors"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <p className="text-xs text-neutral-600">
                  Password must be at least 6 characters
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={updatePassword}
                    disabled={saving}
                    className="rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingPassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Subscription Tier */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Subscription Tier</h2>
              <p className="text-sm text-neutral-600 mt-1">
                Toggle between free and paid tier for testing
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => updateSubscriptionTier("free")}
                disabled={saving || subscriptionTier === "free"}
                className={`flex-1 rounded-lg border-2 px-6 py-4 font-medium transition-all ${
                  subscriptionTier === "free"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-900 hover:border-neutral-400"
                } disabled:opacity-50`}
              >
                <div className="text-lg mb-1">Free Tier</div>
                <div className="text-xs opacity-75">Basic crawl only</div>
              </button>

              <button
                onClick={() => updateSubscriptionTier("paid")}
                disabled={saving || subscriptionTier === "paid"}
                className={`flex-1 rounded-lg border-2 px-6 py-4 font-medium transition-all ${
                  subscriptionTier === "paid"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-neutral-200 text-neutral-900 hover:border-neutral-400"
                } disabled:opacity-50`}
              >
                <div className="text-lg mb-1">Paid Tier</div>
                <div className="text-xs opacity-75">Expanded crawl enabled</div>
              </button>
            </div>

            <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-700">
                <strong>Current tier:</strong> {subscriptionTier === "paid" ? "Paid (Expanded Crawl)" : "Free (Basic Crawl)"}
              </p>
            </div>
          </section>

          {/* Sign Out */}
          <section className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Session</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Sign out of your account
                </p>
              </div>
              <button
                onClick={signOut}
                className="rounded-lg border-2 border-neutral-900 text-neutral-900 font-medium px-6 py-2.5 hover:bg-neutral-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </section>

          {/* Future: Danger Zone */}
          {/* Uncomment when we add account deletion */}
          {/*
          <section className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
              Danger Zone
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Permanent actions that cannot be undone
            </p>
            <button
              className="rounded-lg border border-red-300 text-red-700 text-sm px-4 py-2 hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          </section>
          */}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg text-sm px-4 py-3 shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-[slideUp_0.3s_ease-out] ${
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-blue-500 text-white"
          }`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lil' Helper */}
      <LilHelperButton />
    </div>
  );
}
