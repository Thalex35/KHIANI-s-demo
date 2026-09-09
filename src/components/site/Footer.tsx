import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-sand/40">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="font-display text-xl tracking-[0.2em]">MAISON NOVA</span>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Une mode élégante et durable, pensée pour durer bien au-delà des saisons.
          </p>
          <div className="mt-4 flex gap-3">
            <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-accent">
              <Instagram className="size-5" />
            </a>
            <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-accent">
              <Facebook className="size-5" />
            </a>
            <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-accent">
              <Twitter className="size-5" />
            </a>
          </div>
        </div>
        <div>
          <h3 className="eyebrow text-muted-foreground">Navigation</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-accent">
                Accueil
              </Link>
            </li>
            <li>
              <Link to="/boutique" className="hover:text-accent">
                Boutique
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-accent">
                Catégories
              </Link>
            </li>
            <li>
              <Link to="/panier" className="hover:text-accent">
                Panier
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow text-muted-foreground">La maison</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/a-propos" className="hover:text-accent">
                À propos
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-accent">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/conditions" className="hover:text-accent">
                Conditions générales
              </Link>
            </li>
            <li>
              <Link to="/confidentialite" className="hover:text-accent">
                Politique de confidentialité
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="eyebrow text-muted-foreground">Service client</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Livraison offerte dès 80 €</li>
            <li>Retours sous 30 jours</li>
            <li>bonjour@maisonnova.fr</li>
            <li>+33 1 84 80 00 00</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5">
        <p className="container-page text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} MAISON NOVA — Démonstration e-commerce. Aucun paiement réel
          n'est traité.
        </p>
      </div>
    </footer>
  );
}
