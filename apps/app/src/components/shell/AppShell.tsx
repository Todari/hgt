"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { css } from "_panda/css";

/** Fixed bottom bar height (excl. the safe-area inset the bar adds itself). */
const TAB_BAR_HEIGHT = 64;

type Tab = {
  href: "/home" | "/conversations" | "/settings";
  label: string;
  icon: (active: boolean) => ReactNode;
};

function strokeIcon(active: boolean, paths: ReactNode) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.4 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {paths}
    </svg>
  );
}

const TABS: Tab[] = [
  {
    href: "/home",
    label: "홈",
    icon: (active) =>
      strokeIcon(
        active,
        <path d="M3 10.8 12 3.5l9 7.3V20a1 1 0 0 1-1 1h-5.4v-6.2h-5.2V21H4a1 1 0 0 1-1-1v-9.2Z" />,
      ),
  },
  {
    href: "/conversations",
    label: "대화",
    icon: (active) =>
      strokeIcon(
        active,
        <path d="M21 11.6c0 4.2-4 7.6-9 7.6-1 0-2-.14-2.9-.4L4 20.5l1.2-3.6C3.8 15.5 3 13.6 3 11.6 3 7.4 7 4 12 4s9 3.4 9 7.6Z" />,
      ),
  },
  {
    href: "/settings",
    label: "설정",
    icon: (active) =>
      strokeIcon(
        active,
        <>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.2 12a7.2 7.2 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.3 7.3 0 0 0-2.1-1.3L14.4 3h-4l-.4 2.6a7.3 7.3 0 0 0-2.1 1.3l-2.3-1-2 3.4 2 1.5a7.2 7.2 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1c.64.55 1.35 1 2.1 1.3l.4 2.6h4l.3-2.6a7.3 7.3 0 0 0 2.1-1.3l2.3 1 2-3.4-2-1.5c.07-.4.1-.8.1-1.2Z" />
        </>,
      ),
  },
];

/**
 * Fixed bottom tab bar for authed pages. Solid (non-blur) surface per the GPU
 * budget; hairline top border; respects the home-indicator inset.
 * `unreadDot` puts a badge dot on the 대화 tab.
 */
export function TabBar({ unreadDot = false }: { unreadDot?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className={css({
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "surface.card",
        borderTop: "1px solid",
        borderTopColor: "surface.hairline",
        // fixed elements escape the body's safe-area padding — pad here
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      })}
    >
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          maxWidth: "480px",
          height: `${TAB_BAR_HEIGHT}px`,
          marginX: "auto",
        })}
      >
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={css({
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5",
                minHeight: "44px",
                color: active ? "primary.600" : "ink.500",
              })}
            >
              <span className={css({ position: "relative", display: "inline-flex" })}>
                {tab.icon(active)}
                {tab.href === "/conversations" && unreadDot && (
                  <span
                    aria-label="읽지 않은 메시지 있음"
                    className={css({
                      position: "absolute",
                      top: "-2px",
                      right: "-4px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "primary.500",
                      border: "1.5px solid white",
                    })}
                  />
                )}
              </span>
              <span
                className={css({
                  fontSize: "11px",
                  fontWeight: active ? "black" : "bold",
                })}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Authed-page scaffold: centered mobile-width content column + fixed bottom
 * TabBar. The body already pads `env(safe-area-inset-top)` (globals.css), so
 * the shell only adds its own breathing room on top — no double inset.
 *
 * Usage:
 *   <AppShell unreadDot={conversations.some((c) => c.unreadCount > 0)}>
 *     ...page content...
 *   </AppShell>
 */
export function AppShell({
  children,
  unreadDot = false,
}: {
  children: ReactNode;
  unreadDot?: boolean;
}) {
  return (
    <div className={css({ minHeight: "100dvh" })}>
      <main
        className={css({
          width: "100%",
          maxWidth: "480px",
          marginX: "auto",
          paddingTop: "3",
          paddingX: "4",
          // keep scrolled-to-bottom content clear of the fixed bar
          paddingBottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom) + 16px)`,
        })}
      >
        {children}
      </main>
      <TabBar unreadDot={unreadDot} />
    </div>
  );
}
