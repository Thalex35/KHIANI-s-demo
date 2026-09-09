import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — MAISON NOVA" },
      {
        name: "description",
        content: "Recevez un lien sécurisé pour réinitialiser votre mot de passe.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Adresse e-mail invalide" }).max(255),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
    });
    setLoading(false);
    if (resetError) {
      setError("Impossible d'envoyer le lien. Veuillez réessayer.");
      return;
    }
    setSent(true);
    toast.success("Lien de réinitialisation envoyé");
  };

  return (
    <SiteLayout>
      <div className="container-page flex justify-center py-12 sm:py-16">
        <div className="surface-card w-full max-w-md p-6 sm:p-8">
          <h1 className="text-3xl">Mot de passe oublié</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Saisissez votre e-mail et nous vous enverrons un lien sécurisé.
          </p>
          {sent ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Si un compte existe avec cette adresse, un e-mail vient d'être envoyé. Vérifiez
                aussi vos courriers indésirables.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/connexion">Retour à la connexion</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="reset-email">E-mail</Label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-1.5"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi en cours…" : "Envoyer le lien"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/connexion" className="font-medium text-accent hover:underline">
                  Retour à la connexion
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
