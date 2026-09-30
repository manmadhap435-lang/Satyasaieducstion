import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/academics", label: "Academics" },
  { to: "/admissions", label: "Admissions" },
  { to: "/contact", label: "Contact" },
  { to: "/admin", label: "Admin" },
] as const;

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/95 backdrop-blur">
      <div className="container-site flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">
            SS
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg text-primary sm:text-xl">
              Satya Sai Educational Society
            </span>
            <span className="block text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Plakonda · Vizianagaram Dist. · A.P.
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-foreground/80">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "text-primary font-semibold" }}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-primary/20 bg-secondary">
      <div className="container-site grid gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <h3 className="font-display text-xl text-primary">
            Satya Sai Educational Society
          </h3>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Providing quality Intermediate, Degree and SSC education to
            students of Plakonda and surrounding villages of Vizianagaram
            district, Andhra Pradesh.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/70">
            Quick Links
          </h4>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/70">
            Reach Us
          </h4>
          <address className="mt-4 space-y-2 text-sm not-italic text-muted-foreground">
            <p>
              Satya Sai Educational Society
              <br />
              Plakonda, Vizianagaram District,
              <br />
              Andhra Pradesh, India
            </p>
            <p>
              Office hours: Monday – Saturday,
              <br />
              9:00 AM – 5:00 PM
            </p>
          </address>
        </div>
      </div>
      <div className="border-t border-primary/10 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Satya Sai Educational Society, Plakonda.
        All rights reserved.
      </div>
    </footer>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 font-display text-2xl text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back
          home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Satya Sai Educational Society" },
      {
        name: "description",
        content:
          "Satya Sai Educational Society, Plakonda — quality Intermediate, Degree and SSC education in Vizianagaram district, Andhra Pradesh.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@300;400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}
