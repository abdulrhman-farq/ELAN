"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    hcaptcha?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
const SCRIPT_SRC = "https://js.hcaptcha.com/1/api.js?render=explicit";

/** hCaptcha widget. Fully inert when NEXT_PUBLIC_HCAPTCHA_SITE_KEY is unset:
 *  renders nothing and never loads the script. No npm dependency — the script
 *  is injected and window.hcaptcha.render is driven explicitly. On any failure
 *  it calls onToken(null) and renders nothing. */
export function Captcha({ onToken }: { onToken: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    const el = containerRef.current;
    if (!el) return;

    let widgetId: string | null = null;
    let cancelled = false;

    function renderWidget() {
      if (cancelled || !el || !window.hcaptcha) return;
      try {
        widgetId = window.hcaptcha.render(el, {
          sitekey: SITE_KEY as string,
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(null),
        });
      } catch {
        onToken(null);
      }
    }

    function loadScript() {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_SRC}"]`
      );
      if (window.hcaptcha) {
        renderWidget();
        return existing;
      }
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.src = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
      script.addEventListener("error", () => onToken(null));
      return script;
    }

    const script = loadScript();

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderWidget);
      if (widgetId !== null && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetId);
        } catch {
          /* ignore cleanup failure */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} />;
}
