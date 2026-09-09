import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminNewsletterSubscribersQuery } from "@/lib/admin";
import { formatDateTime } from "@/lib/shop";

export const Route = createFileRoute("/admin/newsletter")({
  component: AdminNewsletterPage,
});

function AdminNewsletterPage() {
  const { data: subscribers = [] } = useQuery(adminNewsletterSubscribersQuery());

  return (
    <AdminLayout title="Newsletter" description="Liste des abonnés à la newsletter.">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Abonnés newsletter</h2>
          <span className="text-xs text-muted-foreground">{subscribers.length} inscrit(s)</span>
        </div>

        {subscribers.length === 0 ? (
          <div className="rounded border border-dashed border-border p-8 text-sm text-muted-foreground">
            Aucun abonné pour le moment.
          </div>
        ) : (
          <div className="space-y-2">
            {subscribers.map((subscriber) => (
              <div key={subscriber.id} className="flex flex-wrap items-center justify-between border-b border-border pb-3 last:border-b-0">
                <div>
                  <div className="font-medium">{subscriber.email}</div>
                  <div className="text-xs text-muted-foreground">
                    Abonné le {formatDateTime(subscriber.subscribed_at)}
                  </div>
                </div>
                <span className="rounded bg-muted px-2 py-1 text-xs uppercase">{subscriber.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
