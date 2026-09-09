import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AccountLayout } from "@/components/site/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/compte/adresses")({
  head: () => ({
    meta: [
      { title: "Mes adresses — MAISON NOVA" },
      { name: "description", content: "Gérez vos adresses de livraison enregistrées." },
    ],
  }),
  component: AddressesPage,
});

type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  is_default: boolean;
};

const schema = z.object({
  label: z.string().trim().min(1, { message: "Un nom est requis" }).max(60),
  full_name: z.string().trim().min(2, { message: "Le nom complet est requis" }).max(120),
  phone: z.string().trim().min(6, { message: "Le téléphone est requis" }).max(30),
  address: z.string().trim().min(5, { message: "L'adresse est requise" }).max(200),
  city: z.string().trim().min(2, { message: "La ville est requise" }).max(80),
  country: z.string().trim().min(2, { message: "Le pays est requis" }).max(80),
});

type Draft = z.infer<typeof schema> & { is_default: boolean };

const emptyDraft: Draft = {
  label: "Adresse principale",
  full_name: "",
  phone: "",
  address: "",
  city: "",
  country: "France",
  is_default: false,
};

function AddressesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["saved-addresses", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("saved_addresses")
        .select("id, label, full_name, phone, address, city, country, is_default")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return (data ?? []) as Address[];
    },
  });

  const set = (key: keyof Draft) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }));

  const reset = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
  };

  const edit = (address: Address) => {
    setEditingId(address.id);
    setDraft({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      country: address.country,
      is_default: address.is_default,
    });
    setError(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setSaving(true);
    const payload = { ...parsed.data, is_default: draft.is_default };
    const result = editingId
      ? await supabase.from("saved_addresses").update(payload).eq("id", editingId)
      : await supabase.from("saved_addresses").insert({ ...payload, user_id: user!.id });
    setSaving(false);
    if (result.error) {
      setError("L'adresse n'a pas pu être enregistrée. Réessayez.");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["saved-addresses", user?.id] });
    toast.success(editingId ? "Adresse mise à jour" : "Adresse ajoutée");
    reset();
  };

  const remove = async (id: string) => {
    const { error: deleteError } = await supabase.from("saved_addresses").delete().eq("id", id);
    if (deleteError) {
      toast.error("L'adresse n'a pas pu être supprimée");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["saved-addresses", user?.id] });
    toast.success("Adresse supprimée");
  };

  return (
    <AccountLayout
      title="Mes adresses"
      description="Enregistrez vos adresses de livraison pour gagner du temps."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section>
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          ) : addresses.length === 0 ? (
            <div className="surface-card p-6 text-sm text-muted-foreground">
              Aucune adresse enregistrée.
            </div>
          ) : (
            <ul className="space-y-3">
              {addresses.map((address) => (
                <li key={address.id} className="surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{address.label}</p>
                        {address.is_default && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                            <Star className="size-3" /> Par défaut
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {address.full_name}
                        <br />
                        {address.address}
                        <br />
                        {address.city}, {address.country}
                        <br />
                        {address.phone}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Modifier"
                        onClick={() => edit(address)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Supprimer"
                        onClick={() => void remove(address.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <form onSubmit={save} className="surface-card h-fit p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl">{editingId ? "Modifier l'adresse" : "Ajouter une adresse"}</h2>
            {!editingId && <Plus className="size-5 text-accent" />}
          </div>
          <div className="mt-4 space-y-4">
            {(
              [
                ["label", "Nom de l'adresse"],
                ["full_name", "Nom complet"],
                ["phone", "Téléphone"],
                ["address", "Adresse"],
                ["city", "Ville"],
                ["country", "Pays"],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={`address-${key}`}>{label}</Label>
                <Input
                  id={`address-${key}`}
                  value={draft[key]}
                  onChange={set(key)}
                  className="mt-1.5"
                  required
                />
              </div>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_default}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, is_default: event.target.checked }))
                }
                className="size-4 accent-(--color-accent)"
              />
              Utiliser comme adresse par défaut
            </label>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement…" : editingId ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={reset}>
                Annuler
              </Button>
            )}
          </div>
        </form>
      </div>
    </AccountLayout>
  );
}
