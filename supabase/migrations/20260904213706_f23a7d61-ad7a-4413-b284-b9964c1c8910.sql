
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.order_status AS ENUM ('en_attente','confirmee','en_preparation','expediee','livree','annulee');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text,
  address text,
  city text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profils_lecture_perso" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profils_insert_perso" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profils_update_perso" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "roles_lecture" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name',''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',''),
    COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  subcategory text NOT NULL,
  brand text NOT NULL DEFAULT 'MAISON NOVA',
  price numeric(10,2) NOT NULL,
  sale_price numeric(10,2),
  cover_url text NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  material text,
  composition text,
  fit text,
  care text,
  origin text,
  sku text,
  is_new boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  views integer NOT NULL DEFAULT 0,
  cart_adds integer NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produits_publics" ON public.products FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "produits_admin_insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "produits_admin_update" ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "produits_admin_delete" ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, size, color)
);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variantes_publiques" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "variantes_admin" ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favoris_lecture" ON public.favorites FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "favoris_insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favoris_delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text NOT NULL UNIQUE DEFAULT ('CMD-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  status public.order_status NOT NULL DEFAULT 'en_attente',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'demo',
  full_name text NOT NULL DEFAULT '',
  phone text,
  address text,
  city text,
  country text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commandes_lecture" ON public.orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "commandes_insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "commandes_update_admin" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  image_url text,
  size text NOT NULL,
  color text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL DEFAULT 1
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lignes_lecture" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "lignes_insert" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.increment_product_metric(_product_id uuid, _metric text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _metric = 'views' THEN UPDATE public.products SET views = views + 1 WHERE id = _product_id;
  ELSIF _metric = 'cart_adds' THEN UPDATE public.products SET cart_adds = cart_adds + 1 WHERE id = _product_id;
  ELSIF _metric = 'purchases' THEN UPDATE public.products SET purchases = purchases + 1 WHERE id = _product_id;
  END IF;
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_product_metric(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.decrement_variant_stock(_product_id uuid, _size text, _color text, _qty integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.product_variants SET stock = GREATEST(stock - _qty, 0)
  WHERE product_id = _product_id AND size = _size AND color = _color;
END; $$;
GRANT EXECUTE ON FUNCTION public.decrement_variant_stock(uuid, text, text, integer) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

INSERT INTO public.products (name, slug, description, category, subcategory, brand, price, sale_price, cover_url, images, sizes, colors, material, composition, fit, care, origin, sku, is_new, is_featured, views, cart_adds, purchases, created_at) VALUES
('T-shirt Essential Premium','t-shirt-essential-premium','Un T-shirt en coton peigné à la coupe impeccable, pensé pour durer saison après saison.','Hommes','T-shirt','MAISON NOVA',39.99,29.99,'/images/tshirt-noir.jpg','{"/images/tshirt-noir.jpg","/images/tshirt-blanc.jpg"}','{"XS","S","M","L","XL","XXL"}','{"Noir","Blanc","Gris"}','Coton peigné','100% coton biologique','Coupe droite','Lavage à 30°C, séchage à plat','Portugal','MN-TS-001',true,true,860,120,64,now() - interval '2 days'),
('T-shirt Oversize Urban','t-shirt-oversize-urban','Silhouette oversize et tombé épais pour un style street assumé.','Hommes','T-shirt','MAISON NOVA',34.99,NULL,'/images/tshirt-blanc.jpg','{"/images/tshirt-blanc.jpg"}','{"S","M","L","XL"}','{"Blanc","Noir","Beige"}','Jersey épais','100% coton','Coupe oversize','Lavage à 30°C','Portugal','MN-TS-002',true,false,540,80,31,now() - interval '4 days'),
('T-shirt Col Rond Femme','t-shirt-col-rond-femme','Basique féminin en coton doux, parfait à porter au quotidien.','Femmes','T-shirt','MAISON NOVA',29.99,NULL,'/images/tshirt-blanc.jpg','{"/images/tshirt-blanc.jpg"}','{"XS","S","M","L"}','{"Blanc","Rose","Noir"}','Coton doux','95% coton, 5% élasthanne','Coupe ajustée','Lavage à 30°C','Portugal','MN-TS-003',false,false,320,44,22,now() - interval '20 days'),
('Chemise Oxford Classic','chemise-oxford-classic','La chemise Oxford intemporelle, tissée pour un rendu structuré et élégant.','Hommes','Chemise','MAISON NOVA',69.99,54.99,'/images/chemise.jpg','{"/images/chemise.jpg"}','{"S","M","L","XL","XXL"}','{"Blanc","Bleu","Beige"}','Coton Oxford','100% coton','Coupe régulière','Lavage à 40°C, repassage moyen','Italie','MN-CH-001',false,true,720,96,48,now() - interval '12 days'),
('Chemise Lin Été','chemise-lin-ete','Chemise en lin léger et respirant pour les journées chaudes.','Hommes','Chemise','MAISON NOVA',74.99,NULL,'/images/chemise.jpg','{"/images/chemise.jpg"}','{"S","M","L","XL"}','{"Blanc","Beige","Bleu"}','Lin lavé','100% lin','Coupe droite','Lavage délicat à 30°C','Portugal','MN-CH-002',true,false,410,52,18,now() - interval '3 days'),
('Chemise Fluide Femme','chemise-fluide-femme','Une chemise fluide au tombé élégant, idéale du bureau au dîner.','Femmes','Chemise','MAISON NOVA',64.99,49.99,'/images/chemise.jpg','{"/images/chemise.jpg"}','{"XS","S","M","L"}','{"Blanc","Noir","Beige"}','Viscose','100% viscose','Coupe fluide','Lavage délicat','Italie','MN-CH-003',false,false,290,38,14,now() - interval '25 days'),
('Jean Slim Denim','jean-slim-denim','Denim stretch confortable à la coupe slim, un incontournable du vestiaire.','Hommes','Jean','MAISON NOVA',89.99,69.99,'/images/jean.jpg','{"/images/jean.jpg"}','{"S","M","L","XL","XXL"}','{"Bleu","Noir","Gris"}','Denim stretch','98% coton, 2% élasthanne','Coupe slim','Lavage à l''envers à 30°C','Turquie','MN-JN-001',false,true,980,140,72,now() - interval '15 days'),
('Jean Straight Fit','jean-straight-fit','Jean droit en denim brut, structuré et durable.','Hommes','Jean','MAISON NOVA',94.99,NULL,'/images/jean.jpg','{"/images/jean.jpg"}','{"S","M","L","XL"}','{"Bleu","Noir"}','Denim brut','100% coton','Coupe droite','Lavage à 30°C','Turquie','MN-JN-002',true,false,460,60,25,now() - interval '5 days'),
('Jean Mom Femme','jean-mom-femme','Taille haute et coupe mom pour une allure rétro moderne.','Femmes','Jean','MAISON NOVA',84.99,NULL,'/images/jean.jpg','{"/images/jean.jpg"}','{"XS","S","M","L","XL"}','{"Bleu","Blanc","Noir"}','Denim rigide','100% coton','Taille haute','Lavage à 30°C','Turquie','MN-JN-003',false,true,650,88,40,now() - interval '18 days'),
('Pantalon Cargo Urban','pantalon-cargo-urban','Pantalon cargo à poches utilitaires, coupe décontractée.','Hommes','Pantalon','MAISON NOVA',79.99,59.99,'/images/pantalon.jpg','{"/images/pantalon.jpg"}','{"S","M","L","XL","XXL"}','{"Beige","Noir","Vert"}','Twill de coton','100% coton','Coupe décontractée','Lavage à 30°C','Portugal','MN-PT-001',true,true,720,110,55,now() - interval '6 days'),
('Pantalon Chino Classic','pantalon-chino-classic','Chino élégant et polyvalent, du bureau au week-end.','Hommes','Pantalon','MAISON NOVA',69.99,NULL,'/images/pantalon.jpg','{"/images/pantalon.jpg"}','{"S","M","L","XL"}','{"Beige","Bleu","Noir"}','Coton stretch','97% coton, 3% élasthanne','Coupe droite','Lavage à 30°C','Portugal','MN-PT-002',false,false,380,42,19,now() - interval '30 days'),
('Pantalon Tailleur Femme','pantalon-tailleur-femme','Pantalon de tailleur à pinces, pour une silhouette nette.','Femmes','Pantalon','MAISON NOVA',89.99,NULL,'/images/pantalon.jpg','{"/images/pantalon.jpg"}','{"XS","S","M","L"}','{"Noir","Beige","Gris"}','Crêpe','65% viscose, 35% polyester','Coupe droite','Nettoyage à sec','Italie','MN-PT-003',false,false,310,36,15,now() - interval '28 days'),
('Robe Élégance','robe-elegance','Robe midi à la coupe fluide, parfaite pour les grandes occasions.','Femmes','Robe','MAISON NOVA',119.99,89.99,'/images/robe.jpg','{"/images/robe.jpg"}','{"XS","S","M","L","XL"}','{"Noir","Rouge","Beige"}','Satin','100% polyester recyclé','Coupe cintrée','Nettoyage à sec','Italie','MN-RB-001',true,true,1100,150,80,now() - interval '1 day'),
('Robe Casual','robe-casual','Robe en coton légère et confortable pour tous les jours.','Femmes','Robe','MAISON NOVA',69.99,NULL,'/images/robe-casual.jpg','{"/images/robe-casual.jpg"}','{"XS","S","M","L"}','{"Blanc","Bleu","Rose"}','Coton','100% coton','Coupe droite','Lavage à 30°C','Portugal','MN-RB-002',false,true,540,70,33,now() - interval '10 days'),
('Robe Longue Bohème','robe-longue-boheme','Robe longue imprimée à l''esprit bohème, taille élastiquée.','Femmes','Robe','MAISON NOVA',99.99,74.99,'/images/robe.jpg','{"/images/robe.jpg"}','{"S","M","L","XL"}','{"Beige","Vert","Rouge"}','Viscose','100% viscose','Coupe ample','Lavage délicat','Inde','MN-RB-003',false,false,420,55,21,now() - interval '22 days'),
('Veste Denim','veste-denim','La veste en jean iconique, denim épais et finitions soignées.','Hommes','Veste','MAISON NOVA',129.99,99.99,'/images/veste-denim.jpg','{"/images/veste-denim.jpg"}','{"S","M","L","XL","XXL"}','{"Bleu","Noir"}','Denim','100% coton','Coupe régulière','Lavage à 30°C','Turquie','MN-VS-001',false,true,880,120,58,now() - interval '14 days'),
('Veste Bomber','veste-bomber','Bomber matelassé au style aviateur, doublure satinée.','Hommes','Veste','MAISON NOVA',149.99,NULL,'/images/bomber.jpg','{"/images/bomber.jpg"}','{"S","M","L","XL"}','{"Noir","Vert","Beige"}','Nylon','100% nylon recyclé','Coupe droite','Lavage à froid','Vietnam','MN-VS-002',true,true,760,95,44,now() - interval '7 days'),
('Veste Blazer Femme','veste-blazer-femme','Blazer structuré à boutonnage simple, essentiel du dressing.','Femmes','Veste','MAISON NOVA',159.99,119.99,'/images/bomber.jpg','{"/images/bomber.jpg"}','{"XS","S","M","L"}','{"Noir","Beige","Gris"}','Crêpe','65% viscose, 35% polyester','Coupe ajustée','Nettoyage à sec','Italie','MN-VS-003',false,false,340,40,17,now() - interval '26 days'),
('Sweatshirt Classic','sweatshirt-classic','Sweat col rond en molleton gratté, doux et chaud.','Hommes','Sweatshirt','MAISON NOVA',59.99,44.99,'/images/sweat.jpg','{"/images/sweat.jpg"}','{"S","M","L","XL","XXL"}','{"Gris","Noir","Beige"}','Molleton','80% coton, 20% polyester','Coupe régulière','Lavage à 30°C','Portugal','MN-SW-001',false,true,690,98,47,now() - interval '16 days'),
('Hoodie Premium','hoodie-premium','Sweat à capuche épais 400g, cordons métalliques et poche kangourou.','Hommes','Sweatshirt','MAISON NOVA',79.99,NULL,'/images/hoodie.jpg','{"/images/hoodie.jpg"}','{"S","M","L","XL","XXL"}','{"Noir","Gris","Vert"}','Molleton lourd','85% coton, 15% polyester','Coupe oversize','Lavage à 30°C','Portugal','MN-SW-002',true,true,930,135,66,now() - interval '3 days'),
('Hoodie Enfant','hoodie-enfant','Sweat à capuche douillet pour les plus jeunes.','Enfants','Sweatshirt','MAISON NOVA',39.99,29.99,'/images/enfant.jpg','{"/images/enfant.jpg"}','{"XS","S","M"}','{"Bleu","Rose","Gris"}','Molleton','80% coton, 20% polyester','Coupe confort','Lavage à 30°C','Portugal','MN-SW-003',false,false,260,32,16,now() - interval '19 days'),
('Pull Knit','pull-knit','Pull en maille fine côtelée, chaud et léger.','Femmes','Pull','MAISON NOVA',89.99,NULL,'/images/pull.jpg','{"/images/pull.jpg"}','{"XS","S","M","L","XL"}','{"Beige","Noir","Vert"}','Maille','50% laine, 50% acrylique','Coupe droite','Lavage laine à froid','Italie','MN-PL-001',false,false,470,58,26,now() - interval '21 days'),
('Pull Col Roulé','pull-col-roule','Col roulé en maille douce, indispensable de l''hiver.','Hommes','Pull','MAISON NOVA',94.99,69.99,'/images/pull.jpg','{"/images/pull.jpg"}','{"S","M","L","XL"}','{"Noir","Gris","Beige"}','Maille douce','60% laine mérinos, 40% acrylique','Coupe régulière','Lavage laine','Italie','MN-PL-002',false,true,520,66,30,now() - interval '24 days'),
('Jupe Plissée','jupe-plissee','Jupe midi plissée au mouvement fluide.','Femmes','Jupe','MAISON NOVA',69.99,49.99,'/images/jupe.jpg','{"/images/jupe.jpg"}','{"XS","S","M","L"}','{"Noir","Beige","Rose"}','Polyester recyclé','100% polyester recyclé','Taille haute','Lavage délicat','Portugal','MN-JP-001',true,false,380,48,20,now() - interval '8 days'),
('Short Casual','short-casual','Short en coton léger, coupe confortable pour l''été.','Hommes','Pantalon','MAISON NOVA',44.99,NULL,'/images/short.jpg','{"/images/short.jpg"}','{"S","M","L","XL"}','{"Beige","Bleu","Noir"}','Coton','100% coton','Coupe droite','Lavage à 30°C','Portugal','MN-SH-001',false,false,300,36,15,now() - interval '27 days'),
('Sneakers Urban','sneakers-urban','Sneakers minimalistes en cuir grainé, semelle confort.','Accessoires','Sneakers','MAISON NOVA',129.99,99.99,'/images/sneakers.jpg','{"/images/sneakers.jpg"}','{"S","M","L","XL"}','{"Blanc","Noir","Beige"}','Cuir grainé','Dessus cuir, semelle caoutchouc','Chaussant standard','Nettoyer avec un chiffon humide','Portugal','MN-SN-001',true,true,1250,180,90,now() - interval '2 days'),
('Sneakers Runner','sneakers-runner','Sneakers running lifestyle, amorti léger.','Accessoires','Sneakers','MAISON NOVA',119.99,NULL,'/images/sneakers.jpg','{"/images/sneakers.jpg"}','{"S","M","L","XL"}','{"Gris","Noir","Bleu"}','Mesh technique','Textile et synthétique','Chaussant standard','Nettoyage à la main','Vietnam','MN-SN-002',false,false,600,70,32,now() - interval '17 days'),
('Casquette Classic','casquette-classic','Casquette 6 panneaux en coton lavé, réglable.','Accessoires','Accessoires','MAISON NOVA',24.99,19.99,'/images/casquette.jpg','{"/images/casquette.jpg"}','{"M"}','{"Noir","Beige","Bleu"}','Coton lavé','100% coton','Taille unique réglable','Lavage à la main','Chine','MN-AC-001',false,false,290,42,24,now() - interval '23 days'),
('Sac à main Cuir','sac-a-main-cuir','Sac à main en cuir pleine fleur, doublure textile.','Accessoires','Accessoires','MAISON NOVA',189.99,149.99,'/images/sac.jpg','{"/images/sac.jpg"}','{"M"}','{"Noir","Beige","Rouge"}','Cuir pleine fleur','100% cuir','Format moyen','Entretenir avec un lait pour cuir','Italie','MN-AC-002',true,true,840,105,50,now() - interval '4 days'),
('Ceinture Premium','ceinture-premium','Ceinture en cuir avec boucle métal brossé.','Accessoires','Accessoires','MAISON NOVA',49.99,NULL,'/images/ceinture.jpg','{"/images/ceinture.jpg"}','{"S","M","L"}','{"Noir","Beige"}','Cuir','100% cuir','Largeur 3,5 cm','Éviter l''humidité','Italie','MN-AC-003',false,false,220,26,12,now() - interval '29 days'),
('Lunettes de soleil Solar','lunettes-de-soleil-solar','Lunettes de soleil monture acétate, verres catégorie 3.','Accessoires','Accessoires','MAISON NOVA',79.99,59.99,'/images/lunettes.jpg','{"/images/lunettes.jpg"}','{"M"}','{"Noir","Beige"}','Acétate','Monture acétate, verres polycarbonate','Taille unique','Nettoyer avec un chiffon microfibre','France','MN-AC-004',true,false,510,64,28,now() - interval '9 days'),
('T-shirt Enfant Play','t-shirt-enfant-play','T-shirt en coton doux et résistant pour les enfants.','Enfants','T-shirt','MAISON NOVA',19.99,14.99,'/images/enfant.jpg','{"/images/enfant.jpg"}','{"XS","S","M"}','{"Blanc","Bleu","Rouge"}','Coton','100% coton biologique','Coupe confort','Lavage à 30°C','Portugal','MN-EN-001',false,false,240,30,14,now() - interval '13 days'),
('Jean Enfant Comfort','jean-enfant-comfort','Jean enfant en denim stretch, taille élastiquée.','Enfants','Jean','MAISON NOVA',39.99,NULL,'/images/enfant.jpg','{"/images/enfant.jpg"}','{"XS","S","M"}','{"Bleu","Noir"}','Denim stretch','98% coton, 2% élasthanne','Coupe confort','Lavage à 30°C','Turquie','MN-EN-002',false,false,180,22,9,now() - interval '11 days');

INSERT INTO public.product_variants (product_id, size, color, stock)
SELECT p.id, s.size, c.color,
  CASE WHEN random() < 0.12 THEN 0 ELSE (2 + floor(random()*14))::int END
FROM public.products p, unnest(p.sizes) AS s(size), unnest(p.colors) AS c(color);
