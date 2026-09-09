import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/reinitialiser-mot-de-passe")({
  head: () => ({
    meta: [
      { title: "Réinitialiser le mot de passe — MAISON NOVA" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte." },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
      .max(72),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !session) {
      setError("Le lien est invalide ou a expiré. Demandez un nouveau lien.");
    }
  }, [loading, session]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setSaving(false);
    if (updateError) {
      setError("La mise à jour a échoué. Demandez un nouveau lien et réessayez.");
      return;
    }
    toast.success("Votre mot de passe a été mis à jour");
    void navigate({ to: "/compte" });
  };

  return (
    <SiteLayout>
      <div className="container-page flex justify-center py-12 sm:py-16">
        <div className="surface-card w-full max-w-md p-6 sm:p-8">
          <h1 className="text-3xl">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choisissez un mot de passe d'au moins 8 caractères.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmation</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving || loading || !session}>
              {saving ? "Mise à jour…" : "Enregistrer le mot de passe"}
            </Button>
            {!session && !loading && (
              <Button asChild variant="outline" className="w-full">
                <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
              </Button>
            )}
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
