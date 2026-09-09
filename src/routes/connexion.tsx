import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — MAISON NOVA" },
      {
        name: "description",
        content: "Connectez-vous à votre compte MAISON NOVA pour suivre vos commandes et favoris.",
      },
      { property: "og:title", content: "Connexion — MAISON NOVA" },
      { property: "og:description", content: "Accédez à votre compte client MAISON NOVA." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Adresse e-mail invalide" }).max(255),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (authError) {
      setError("E-mail ou mot de passe incorrect.");
      return;
    }
    toast.success("Bienvenue !");
    void navigate({ to: "/compte" });
  };

  const fill = (mail: string, pass: string) => {
    setEmail(mail);
    setPassword(pass);
  };

  return (
    <SiteLayout>
      <div className="container-page flex justify-center py-12 sm:py-16">
        <div className="w-full max-w-md">
          <div className="surface-card p-6 sm:p-8">
            <h1 className="text-3xl">Connexion</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Accédez à vos commandes, vos favoris et vos informations.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion en cours…" : "Se connecter"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/inscription" className="font-medium text-accent hover:underline">
                Créer un compte
              </Link>
            </p>
            <p className="mt-2 text-center text-sm">
              <Link
                to="/mot-de-passe-oublie"
                className="text-muted-foreground hover:text-accent hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </p>
          </div>

          <div className="surface-card mt-4 p-4 text-sm">
            <p className="eyebrow text-muted-foreground">Comptes de démonstration</p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => fill("demo.user@example.com", "DemoUser123!")}
                className="w-full rounded-md border border-border px-3 py-2 text-left hover:border-foreground"
              >
                <span className="font-medium">Client</span> — demo.user@example.com / DemoUser123!
              </button>
              <button
                type="button"
                onClick={() => fill("demo.admin@example.com", "DemoAdmin123!")}
                className="w-full rounded-md border border-border px-3 py-2 text-left hover:border-foreground"
              >
                <span className="font-medium">Administrateur</span> — demo.admin@example.com /
                DemoAdmin123!
              </button>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
