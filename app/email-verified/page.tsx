"use client";

import * as React from "react";

export default function EmailVerifiedPage() {
  React.useEffect(() => {
    // Auto-close after 3 seconds (optional)
    const timer = setTimeout(() => {
      window.close();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-xl p-12 max-w-md w-full text-center">
        <div className="text-7xl mb-6 animate-bounce">✅</div>

        <h1 className="text-3xl font-bold text-neutral-900 mb-4">
          Email Verified!
        </h1>

        <p className="text-lg text-neutral-700 mb-6">
          Thanks for verifying your email address.
        </p>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-emerald-800 font-medium">
            You can close this tab and continue setting up your widget in the original window.
          </p>
        </div>

        <button
          onClick={() => window.close()}
          className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 transition-colors"
        >
          Close This Tab
        </button>

        <p className="text-xs text-neutral-500 mt-4">
          This window will close automatically in 5 seconds
        </p>
      </div>
    </div>
  );
}
