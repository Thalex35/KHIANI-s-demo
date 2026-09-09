import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Créer un compte — MAISON NOVA" },
      {
        name: "description",
        content:
          "Créez votre compte MAISON NOVA pour enregistrer vos favoris et suivre vos commandes.",
      },
      { property: "og:title", content: "Créer un compte — MAISON NOVA" },
      { property: "og:description", content: "Rejoignez MAISON NOVA en une minute." },
    ],
  }),
  component: SignupPage,
});

const schema = z
  .object({
    first_name: z.string().trim().min(1, { message: "Le prénom est requis" }).max(60),
    last_name: z.string().trim().min(1, { message: "Le nom est requis" }).max(60),
    email: z.string().trim().email({ message: "Adresse e-mail invalide" }).max(255),
    password: z
      .string()
      .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" })
      .max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirm"],
  });

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: parsed.data.first_name, last_name: parsed.data.last_name },
      },
    });
    setLoading(false);
    if (authError) {
      setError(
        authError.message.toLowerCase().includes("already")
          ? "Un compte existe déjà avec cette adresse e-mail."
          : "La création du compte a échoué. Veuillez réessayer.",
      );
      return;
    }
    if (!data.session) {
      toast.success("Compte créé ! Vérifiez votre e-mail pour confirmer votre inscription.");
      void navigate({ to: "/connexion" });
      return;
    }
    toast.success("Votre compte a été créé, bienvenue !");
    void navigate({ to: "/compte" });
  };

  return (
    <SiteLayout>
      <div className="container-page flex justify-center py-12 sm:py-16">
        <div className="w-full max-w-md surface-card p-6 sm:p-8">
          <h1 className="text-3xl">Créer un compte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enregistrez vos favoris et suivez vos commandes.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={set("first_name")}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={form.last_name}
                  onChange={set("last_name")}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set("email")}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={set("password")}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirmation du mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={set("confirm")}
                className="mt-1.5"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Création en cours…" : "Créer mon compte"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Déjà client ?{" "}
            <Link to="/connexion" className="font-medium text-accent hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
