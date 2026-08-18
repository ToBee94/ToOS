import { useEffect, useState } from "react";
import { useSiteConfig } from "../lib/siteConfig";
import { useChrome } from "../lib/useChrome";

const STORAGE_KEY = (host: string) => `toos-${host}-cookie-ack`;

/** Terminal-style cookie notice. Copy defaults to ToOS's own generic chrome
 *  text (see lib/chrome) and merges in `SiteConfig.cookie` overrides — that
 *  default is filler, not real compliance text, so override at least
 *  `line1`/`line2` for anything that needs to be accurate. `onDetails` opens
 *  whatever the site's privacy page/module is. */
export default function CookieBanner({ onDetails, reopen = 0 }: { onDetails: () => void; reopen?: number }) {
  const { host, cookie } = useSiteConfig();
  const t = { ...useChrome().cookie, ...cookie };
  const key = STORAGE_KEY(host);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let acked = false;
    try {
      acked = localStorage.getItem(key) === "1";
    } catch {
      acked = false;
    }
    if (!acked) {
      const id = setTimeout(() => setShow(true), 900);
      return () => clearTimeout(id);
    }
  }, [key]);

  // `open cookie` from the shell re-shows the notice even after acknowledgement.
  useEffect(() => {
    if (reopen > 0) setShow(true);
  }, [reopen]);

  const accept = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      role="region"
      aria-label={t.title}
      className="fixed bottom-4 right-4 z-[80] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-line bg-ink-2/95 font-mono text-[12.5px] leading-relaxed shadow-2xl shadow-black/60 backdrop-blur-xl sm:w-96"
    >
      <div className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </span>
        <span className="ml-1 truncate text-faint">{t.title}</span>
        <button onClick={accept} aria-label="close" className="ml-auto text-faint transition-colors hover:text-paper">
          ✕
        </button>
      </div>
      <div className="space-y-1.5 px-4 py-4 text-muted">
        <p className="text-paper">
          <span className="text-green">❯</span> {t.command}
        </p>
        <p>{t.line1}</p>
        <p>{t.line2}</p>
        <p className="text-amber">{t.output}</p>
        <p className="flex items-center gap-3 pt-2">
          <button onClick={accept} className="rounded-md bg-accent px-3 py-1.5 font-semibold text-ink transition-transform hover:-translate-y-px">
            {t.accept}
          </button>
          <button onClick={onDetails} className="text-faint underline-offset-2 hover:text-paper hover:underline">
            {t.details}
          </button>
          <span className="caret ml-auto" />
        </p>
      </div>
    </aside>
  );
}
