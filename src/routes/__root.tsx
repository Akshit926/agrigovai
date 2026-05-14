import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AgriGov AI — Smart Agriculture Administration" },
      { name: "description", content: "AI-powered platform connecting farmers and agriculture officers — apply for schemes, file grievances, and accelerate decisions." },
      { property: "og:title", content: "AgriGov AI — Smart Agriculture Administration" },
      { property: "og:description", content: "AI-powered platform connecting farmers and agriculture officers — apply for schemes, file grievances, and accelerate decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "AgriGov AI — Smart Agriculture Administration" },
      { name: "twitter:description", content: "AI-powered platform connecting farmers and agriculture officers — apply for schemes, file grievances, and accelerate decisions." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/55cda719-6663-462c-8727-43d4a48639e3/id-preview-36ad2c1f--56ade6a8-877e-449f-b24b-e0be0a9034c2.lovable.app-1778436626216.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/55cda719-6663-462c-8727-43d4a48639e3/id-preview-36ad2c1f--56ade6a8-877e-449f-b24b-e0be0a9034c2.lovable.app-1778436626216.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
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
  return (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
