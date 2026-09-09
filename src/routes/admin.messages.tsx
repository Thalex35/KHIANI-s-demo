import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminContactMessagesQuery } from "@/lib/admin";
import { formatDateTime } from "@/lib/shop";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const { data: messages = [] } = useQuery(adminContactMessagesQuery());

  return (
    <AdminLayout title="Messages" description="Messages de contact entrants et demandes de service client.">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages reçus</h2>
          <span className="text-xs text-muted-foreground">{messages.length} message(s)</span>
        </div>

        {messages.length === 0 ? (
          <div className="rounded border border-dashed border-border p-8 text-sm text-muted-foreground">
            Aucun message de contact pour le moment.
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <article key={message.id} className="rounded border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{message.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {message.email} · {message.subject}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-1 text-xs uppercase">{message.status}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(message.created_at)}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{message.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
