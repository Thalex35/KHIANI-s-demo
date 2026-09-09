import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { AccountLayout } from "@/components/site/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/shop";

export const Route = createFileRoute("/compte/profil")({
  head: () => ({
    meta: [
      { title: "Mes informations — MAISON NOVA" },
      {
        name: "description",
        content: "Modifiez vos coordonnées et vos informations de livraison MAISON NOVA.",
      },
      { property: "og:title", content: "Mes informations — MAISON NOVA" },
      { property: "og:description", content: "Coordonnées et adresse de livraison." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  first_name: z.string().trim().min(1, { message: "Le prénom est requis" }).max(60),
  last_name: z.string().trim().min(1, { message: "Le nom est requis" }).max(60),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
});

function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      first_name: profile.first_name ?? "",
      last_name: profile.last_name ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
      city: profile.city ?? "",
      country: profile.country ?? "",
    });
  }, [profile]);

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
    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update(parsed.data)
      .eq("id", user!.id);
    setSaving(false);
    if (updateError) {
      setError("La mise à jour a échoué. Veuillez réessayer.");
      return;
    }
    await refreshProfile();
    toast.success("Vos informations ont été enregistrées");
  };

  return (
    <AccountLayout title="Mes informations" description="Coordonnées et informations de livraison.">
      <form onSubmit={submit} className="surface-card max-w-2xl p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="first_name">Prénom</Label>
            <Input id="first_name" value={form.first_name} onChange={set("first_name")} className="mt-1.5" required />
          </div>
          <div>
            <Label htmlFor="last_name">Nom</Label>
            <Input id="last_name" value={form.last_name} onChange={set("last_name")} className="mt-1.5" required />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={profile?.email ?? ""} className="mt-1.5" disabled />
            <p className="mt-1 text-xs text-muted-foreground">
              L'adresse e-mail de connexion ne peut pas être modifiée dans cette démonstration.
            </p>
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={form.phone} onChange={set("phone")} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="city">Ville</Label>
            <Input id="city" value={form.city} onChange={set("city")} className="mt-1.5" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Adresse de livraison</Label>
            <Input id="address" value={form.address} onChange={set("address")} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="country">Pays</Label>
            <Input id="country" value={form.country} onChange={set("country")} className="mt-1.5" />
          </div>
        </div>
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
          {profile && (
            <p className="text-xs text-muted-foreground">
              Compte créé le {formatDate(profile.created_at)}
            </p>
          )}
        </div>
      </form>
    </AccountLayout>
  );
}
