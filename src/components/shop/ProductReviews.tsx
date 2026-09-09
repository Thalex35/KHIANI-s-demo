import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/shop";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  user?: { email: string };
};

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(10, { message: "L'avis doit contenir au moins 10 caractères" }).max(1000),
});

type ReviewFormData = z.infer<typeof schema>;

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "" });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*, user:auth.users(email)")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Review[]) || [];
    },
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rate) => ({
    rating: rate,
    count: reviews.filter((r) => r.rating === rate).length,
    percentage: reviews.length > 0 
      ? Math.round((reviews.filter((r) => r.rating === rate).length / reviews.length) * 100)
      : 0,
  }));

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Vous devez être connecté pour laisser un avis.");
      return;
    }

    const parsed = schema.safeParse({
      rating,
      title: form.title || undefined,
      content: form.content,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    setSaving(true);
    try {
      const { error: insertError } = await supabase
        .from("product_reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          rating: parsed.data.rating,
          title: parsed.data.title || null,
          content: parsed.data.content,
          is_approved: false,
          is_hidden: false,
        });

      if (insertError) throw insertError;

      toast.success("Merci pour votre avis ! Il sera affiché après approbation.");
      setForm({ title: "", content: "" });
      setRating(5);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    } catch (err) {
      setSaving(false);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  const markHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    try {
      await supabase.from("review_helpfulness").upsert({
        review_id: reviewId,
        user_id: user.id,
        is_helpful: isHelpful,
      });

      await queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
    } catch (err) {
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <section className="py-12 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">Avis clients</h2>

        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-bold">{avgRating}</span>
                <div>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className={`size-4 ${
                          i < Math.round(Number(avgRating))
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {reviews.length} avis
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm w-12 text-right">{rating}★</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Review Form */}
        {!showForm ? (
          <div className="mb-8">
            <Button onClick={() => setShowForm(true)}>
              {user ? "Laisser un avis" : "Se connecter pour laisser un avis"}
            </Button>
          </div>
        ) : (
          <form onSubmit={submitReview} className="mb-8 p-6 border border-border rounded-lg">
            <h3 className="font-semibold mb-4">Votre avis</h3>

            <div className="mb-4">
              <Label className="block mb-2">Note</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                  >
                    <Star
                      className={`size-6 cursor-pointer transition ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <Label htmlFor="title">Titre (optionnel)</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="ex: Excellent produit"
                maxLength={120}
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="content">Votre avis</Label>
              <Textarea
                id="content"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Décrivez votre expérience avec ce produit..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {form.content.length}/1000 caractères
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Envoi..." : "Publier l'avis"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Aucun avis pour le moment. Soyez le premier à laisser un avis !
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Star
                            key={i}
                            className={`size-3 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-semibold">{review.rating}/5</span>
                    </div>
                    {review.title && (
                      <h4 className="font-semibold mb-1">{review.title}</h4>
                    )}
                    <p className="text-sm text-foreground mb-2">{review.content}</p>
                    <p className="text-xs text-muted-foreground">
                      Par {review.user?.email || "Utilisateur"} le{" "}
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Utile ?</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markHelpful(review.id, true)}
                    className="gap-1 text-xs h-7"
                  >
                    <ThumbsUp className="size-3" />
                    {review.helpful_count}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markHelpful(review.id, false)}
                    className="gap-1 text-xs h-7"
                  >
                    <ThumbsDown className="size-3" />
                    {review.unhelpful_count}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
