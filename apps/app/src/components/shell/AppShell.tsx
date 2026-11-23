"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { css, cx } from "_panda/css";

/** Floating Liquid Glass tab bar height (excl. the home-indicator safe area). */
const TAB_BAR_HEIGHT = 62;

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
 * Floating iOS 26-inspired tab chrome. The bar is inset from the viewport like
 * a single glass volume and each selected tab gets a tinted liquid capsule.
 * Coarse-pointer blur is capped globally for the WebView GPU budget.
 * `unreadDot` puts a badge dot on the 대화 tab.
 */
export function TabBar({ unreadDot = false }: { unreadDot?: boolean }) {
  const pathname = usePathname();
  const activeIndex = pathname.startsWith("/conversations")
    ? 1
    : pathname.startsWith("/settings") || pathname.startsWith("/safety")
      ? 2
      : 0;

  useEffect(() => {
    const nativeHandler = (
      window as typeof window & {
        webkit?: {
          messageHandlers?: {
            hgtNativeTabs?: { postMessage: (value: unknown) => void };
          };
        };
      }
    ).webkit?.messageHandlers?.hgtNativeTabs;

    nativeHandler?.postMessage({
      visible: true,
      activeIndex,
      unread: unreadDot,
    });
  }, [activeIndex, unreadDot]);

  useEffect(() => {
    return () => {
      const nativeHandler = (
        window as typeof window & {
          webkit?: {
            messageHandlers?: {
              hgtNativeTabs?: { postMessage: (value: unknown) => void };
            };
          };
        }
      ).webkit?.messageHandlers?.hgtNativeTabs;
      nativeHandler?.postMessage({ visible: false });
    };
  }, []);

  return (
    <nav
      aria-label="주요 메뉴"
      className={cx("hgt-web-tab-bar", css({
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingX: "3",
        paddingTop: "2",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
        paddingLeft: "max(12px, env(safe-area-inset-left))",
        paddingRight: "max(12px, env(safe-area-inset-right))",
        pointerEvents: "none",
        _before: {
          content: '""',
          position: "absolute",
          left: 0,
          right: 0,
          top: "-24px",
          height: "34px",
          pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent, rgba(246,240,228,.78))",
        },
      }))}
    >
      <div
        className={cx(
          "liquid-glass",
          css({
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            width: "100%",
            maxWidth: "430px",
            height: `${TAB_BAR_HEIGHT}px`,
            marginX: "auto",
            padding: "1",
            borderRadius: "30px",
            overflow: "hidden",
            pointerEvents: "auto",
          }),
        )}
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
                gap: "0",
                minHeight: "44px",
                color: active ? "primary.600" : "ink.500",
                // 30px outer radius - 4px shell padding = 26px.
                borderRadius: "26px",
                border: "1px solid",
                borderColor: active ? "rgba(255,255,255,.82)" : "transparent",
                background: active
                  ? "linear-gradient(145deg, rgba(255,255,255,.72), rgba(255,79,63,.18))"
                  : "transparent",
                boxShadow: active
                  ? "0 7px 18px rgba(217,54,41,.12), inset 0 1px 0 rgba(255,255,255,.86)"
                  : "none",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Pretendard Variable', sans-serif",
                WebkitTapHighlightColor: "transparent",
                transition:
                  "color 160ms ease, opacity 120ms ease, background 180ms ease, transform 180ms cubic-bezier(.16,1,.3,1)",
                _active: { opacity: 0.68, transform: "scale(.96)" },
              })}
            >
              <span
                className={css({
                  position: "relative",
                  display: "inline-flex",
                  transform: active ? "translateY(-1px)" : "none",
                  transition: "transform 140ms ease",
                })}
              >
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
                  marginTop: "-1px",
                  fontSize: "10px",
                  fontWeight: active ? "semibold" : "medium",
                  letterSpacing: "-0.01em",
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
    <div className={css({ minHeight: "var(--hgt-page-height)" })}>
      <main
        className={css({
          width: "100%",
          maxWidth: "480px",
          marginX: "auto",
          paddingTop: "3",
          paddingX: "4",
          // keep scrolled-to-bottom content clear of the fixed bar
          paddingBottom: `calc(${TAB_BAR_HEIGHT}px + env(safe-area-inset-bottom) + 28px)`,
        })}
      >
        {children}
      </main>
      <TabBar unreadDot={unreadDot} />
    </div>
  );
}
