import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — MAISON NOVA" },
      {
        name: "description",
        content:
          "Une question sur une commande, une taille ou un retour ? L'équipe MAISON NOVA vous répond sous 24 h.",
      },
      { property: "og:title", content: "Contact — MAISON NOVA" },
      { property: "og:description", content: "Notre service client vous répond sous 24 h." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, { message: "Votre nom est requis" }).max(100),
  email: z.string().trim().email({ message: "Adresse e-mail invalide" }).max(255),
  subject: z.string().trim().min(2, { message: "Objet requis" }).max(120),
  message: z.string().trim().min(10, { message: "Votre message est trop court" }).max(1000),
});

const INFOS = [
  { icon: Mail, label: "E-mail", value: "bonjour@maisonnova.fr" },
  { icon: Phone, label: "Téléphone", value: "+33 1 23 45 67 89" },
  { icon: MapPin, label: "Atelier", value: "18 rue des Tisserands, 75011 Paris" },
];

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast.success("Message envoyé ! Nous vous répondons sous 24 h.");
    }, 600);
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Service client"
        title="Nous contacter"
        description="Une question sur une taille, une commande ou un retour ? Écrivez-nous."
      />
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="surface-card p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input id="name" value={form.name} onChange={set("name")} className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={set("email")}
                className="mt-1.5"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="subject">Objet</Label>
              <Input id="subject" value={form.subject} onChange={set("subject")} className="mt-1.5" required />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={6}
                value={form.message}
                onChange={set("message")}
                className="mt-1.5"
                required
              />
            </div>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <Button type="submit" className="mt-6" disabled={sending}>
            {sending ? "Envoi en cours…" : "Envoyer le message"}
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Démonstration : le message n'est pas réellement envoyé.
          </p>
        </form>

        <aside className="space-y-4">
          {INFOS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="surface-card flex items-start gap-3 p-4">
              <Icon className="mt-0.5 size-5 text-accent" />
              <div>
                <p className="eyebrow text-muted-foreground">{label}</p>
                <p className="mt-1 text-sm">{value}</p>
              </div>
            </div>
          ))}
          <div className="surface-card p-4 text-sm text-muted-foreground">
            <p className="eyebrow text-muted-foreground">Horaires</p>
            <p className="mt-2">Du lundi au vendredi, 9 h – 18 h</p>
            <p>Samedi, 10 h – 16 h</p>
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}
