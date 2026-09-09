import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="border-b border-border bg-sand/40">
      <div className="container-page py-10 sm:py-14">
        {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        )}
      </div>
    </div>
  );
}
