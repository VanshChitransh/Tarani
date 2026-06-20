"use client";

import { useEffect, useState } from "react";

/**
 * Fires a one-shot warning toast when a mint carries zero Token-2022 extensions.
 * Rendered inside the (server) report page; all the visibility/timer state lives
 * here on the client. Renders nothing when the token actually has extensions.
 */
export function NoExtensionsToast({ extensionCount }: { extensionCount: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (extensionCount > 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [extensionCount]);

  if (extensionCount > 0 || !visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm transition-all duration-300">
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 shadow-lg shadow-amber-900/5">
        <span className="mt-0.5 text-amber-500">⚠</span>
        <div className="flex-1 text-sm">
          <p className="font-medium text-amber-900">No Token-2022 extensions</p>
          <p className="mt-0.5 text-amber-700 leading-relaxed">
            This is a standard token with no extensions configured. There&apos;s nothing
            extension-specific to flag here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-amber-400 hover:text-amber-700 transition-colors"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
