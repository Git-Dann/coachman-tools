import Link from "next/link";
import { FOOTER, MASTHEAD, VIEWS, type ViewId } from "@/content/views";

/**
 * Header with desktop tabs, mobile bottom nav, and the footer.
 *
 * The nav is real links, so every view is separately shareable and the browser
 * back button works. Keyboard users get a skip link straight to the content.
 */
export function Shell({
  view,
  children,
}: {
  view: ViewId;
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="mast">
        <div className="mast-in">
          <div className="lock">
            <b>{MASTHEAD.client}</b>
            <span>{MASTHEAD.work}</span>
          </div>
          <nav className="switch" aria-label="View">
            {VIEWS.map((v) => (
              <Link
                key={v.id}
                href={v.path}
                aria-current={v.id === view ? "page" : undefined}
              >
                {v.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <nav className="mnav" aria-label="View">
        <div className="mnav-in">
          {VIEWS.map((v) => (
            <Link
              key={v.id}
              href={v.path}
              aria-current={v.id === view ? "page" : undefined}
            >
              {v.name}
            </Link>
          ))}
        </div>
      </nav>

      <main id="main">{children}</main>

      <footer className="wrap">
        {FOOTER.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </footer>
    </>
  );
}

/** Hero block at the top of each view. Readable at rest, nothing on scroll. */
export function Hero({
  eyebrow,
  h1,
  standfirst,
  children,
}: {
  eyebrow: string;
  h1: string;
  standfirst: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="hero">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{h1}</h1>
      <p className="stand">{standfirst}</p>
      {children}
    </div>
  );
}

/** Numbered section heading. */
export function SectionHead({
  n,
  title,
  id,
}: {
  n: string;
  title: string;
  id?: string;
}) {
  return (
    <div className="sec-h">
      <span className="sec-n">{n}</span>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

/** The only italic serif on the site. Quotes from the call, nothing else. */
export function Quote({ text, cite }: { text: string; cite: string }) {
  return (
    <blockquote>
      <p>{text}</p>
      <cite>{cite}</cite>
    </blockquote>
  );
}
