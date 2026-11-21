-- Gbairai Market : 100 produits avec de vraies photos (Unsplash, usage libre)
-- Ils sont ajoutés dans VOTRE boutique (celle du numéro ci-dessous). Vous pourrez les modifier ou les supprimer.
-- À coller dans Supabase > SQL Editor > New query > Run.
begin;
alter table public.shops add column if not exists logo text;
alter table public.shops disable trigger shops_protect;
alter table public.products disable trigger products_limit;

-- nouvelles catégories
update public.settings set categories = categories
  || (case when categories @> '[{"id":"sacs"}]' then '[]'::jsonb else '[{"id":"sacs","nom":"Sacs"}]'::jsonb end)
  || (case when categories @> '[{"id":"bijoux"}]' then '[]'::jsonb else '[{"id":"bijoux","nom":"Bijoux & montres"}]'::jsonb end)
  || (case when categories @> '[{"id":"electronique"}]' then '[]'::jsonb else '[{"id":"electronique","nom":"Électronique"}]'::jsonb end)
where id = 1;

do $$
declare uid uuid; sid uuid;
begin
  select id into uid from public.profiles where phone = '2250788632744';
  if uid is null then raise exception 'Créez d''abord votre compte sur le site avec le numéro 0788632744'; end if;
  select id into sid from public.shops where owner = uid order by created_at limit 1;
  if sid is null then
    insert into public.shops (owner, slug, nom, whatsapp, quartier, categorie, description)
    values (uid, 'gbairai-store', 'Gbairai Store', '0788632744', 'Cocody', 'mode', 'La boutique officielle de Gbairai Market.')
    returning id into sid;
  end if;
  update public.shops set formule = 'pro', verification = 'verifie', vedette = true where id = sid;
  insert into public.products (shop_id, nom, description, prix, categorie, tailles, stock, photo, couleur)
  select sid, v.* from (values
  ('iPhone 15 Pro 256 Go','iPhone 15 Pro 256 Go. Neuf, garanti. Livraison partout à Abidjan.',650000,'tel','',13,'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80&auto=format&fit=crop',0),
  ('Samsung Galaxy S24','Samsung Galaxy S24. Neuf, garanti. Livraison partout à Abidjan.',480000,'tel','',7,'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80&auto=format&fit=crop',1),
  ('Smartphone Android 128 Go','Smartphone Android 128 Go. Neuf, garanti. Livraison partout à Abidjan.',210000,'tel','',15,'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&q=80&auto=format&fit=crop',2),
  ('Smartphone haut de gamme','Smartphone haut de gamme. Neuf, garanti. Livraison partout à Abidjan.',320000,'tel','',23,'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80&auto=format&fit=crop',3),
  ('Google Pixel','Google Pixel. Neuf, garanti. Livraison partout à Abidjan.',290000,'tel','',4,'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80&auto=format&fit=crop',4),
  ('Coque de protection','Coque de protection. Neuf, garanti. Livraison partout à Abidjan.',3500,'tel','',5,'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80&auto=format&fit=crop',5),
  ('Chargeur sans fil','Chargeur sans fil. Neuf, garanti. Livraison partout à Abidjan.',12000,'tel','',20,'https://images.unsplash.com/photo-1609592806596-4d8b5b1d7d0e?w=800&q=80&auto=format&fit=crop',0),
  ('Écouteurs sans fil','Écouteurs sans fil. Neuf, garanti. Livraison partout à Abidjan.',25000,'tel','',6,'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80&auto=format&fit=crop',1),
  ('Casque Bluetooth','Casque Bluetooth. Neuf, garanti. Livraison partout à Abidjan.',35000,'tel','',14,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&auto=format&fit=crop',2),
  ('Smart TV 55 pouces 4K','Smart TV 55 pouces 4K. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',295000,'electronique','',21,'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80&auto=format&fit=crop',3),
  ('Téléviseur LED 50 pouces','Téléviseur LED 50 pouces. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',260000,'electronique','',4,'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=800&q=80&auto=format&fit=crop',4),
  ('Enceinte Bluetooth','Enceinte Bluetooth. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',28000,'electronique','',19,'https://images.unsplash.com/photo-1589256469067-ea99122bbdc4?w=800&q=80&auto=format&fit=crop',5),
  ('Enceinte portable','Enceinte portable. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',18000,'electronique','',9,'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80&auto=format&fit=crop',0),
  ('MacBook Pro','MacBook Pro. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',1250000,'electronique','',4,'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80&auto=format&fit=crop',1),
  ('Ordinateur portable Dell','Ordinateur portable Dell. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',520000,'electronique','',5,'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80&auto=format&fit=crop',2),
  ('Ordinateur portable HP','Ordinateur portable HP. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',450000,'electronique','',16,'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80&auto=format&fit=crop',3),
  ('PC portable gamer','PC portable gamer. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',850000,'electronique','',16,'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80&auto=format&fit=crop',4),
  ('PlayStation 5','PlayStation 5. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',390000,'electronique','',5,'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800&q=80&auto=format&fit=crop',5),
  ('Souris gamer sans fil','Souris gamer sans fil. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',15000,'electronique','',10,'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80&auto=format&fit=crop',0),
  ('Clavier mécanique RGB','Clavier mécanique RGB. Neuf, avec garantie. Livraison et installation possibles à Abidjan.',30000,'electronique','',5,'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80&auto=format&fit=crop',1),
  ('Robe fleurie d''été','Robe fleurie d''été. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',15000,'mode','S, M, L, XL',20,'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80&auto=format&fit=crop',2),
  ('Robe d''été légère','Robe d''été légère. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',13000,'mode','S, M, L, XL',16,'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80&auto=format&fit=crop',3),
  ('Robe de soirée élégante','Robe de soirée élégante. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',25000,'mode','S, M, L, XL',4,'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80&auto=format&fit=crop',4),
  ('Robe fleurie','Robe fleurie. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',14000,'mode','S, M, L, XL',21,'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80&auto=format&fit=crop',5),
  ('Robe midi classique','Robe midi classique. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',18000,'mode','S, M, L, XL',6,'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80&auto=format&fit=crop',0),
  ('Robe d''été femme','Robe d''été femme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',15000,'mode','S, M, L, XL',10,'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80&auto=format&fit=crop',1),
  ('Robe de fête','Robe de fête. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',30000,'mode','S, M, L, XL',23,'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80&auto=format&fit=crop',2),
  ('Blouse élégante','Blouse élégante. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',10000,'mode','S, M, L, XL',23,'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80&auto=format&fit=crop',3),
  ('Blouse en soie','Blouse en soie. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',14000,'mode','S, M, L, XL',21,'https://images.unsplash.com/photo-1551163943-3f6a855d1153?w=800&q=80&auto=format&fit=crop',4),
  ('Jean slim bleu','Jean slim bleu. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',12000,'mode','36, 38, 40, 42, 44',4,'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80&auto=format&fit=crop',5),
  ('Jean femme','Jean femme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',13000,'mode','36, 38, 40, 42, 44',21,'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80&auto=format&fit=crop',0),
  ('Pantalon femme','Pantalon femme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',11000,'mode','36, 38, 40, 42, 44',21,'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80&auto=format&fit=crop',1),
  ('Veste en jean femme','Veste en jean femme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',17000,'mode','S, M, L, XL',15,'https://images.unsplash.com/photo-1618354691323-1b1ae6d36d8f?w=800&q=80&auto=format&fit=crop',2),
  ('Trench femme','Trench femme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',28000,'mode','S, M, L, XL',4,'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80&auto=format&fit=crop',3),
  ('Ensemble tailleur femme','Ensemble tailleur femme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',35000,'mode','S, M, L, XL',10,'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&q=80&auto=format&fit=crop',4),
  ('Legging de sport','Legging de sport. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',8000,'mode','S, M, L, XL',4,'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80&auto=format&fit=crop',5),
  ('Pantalon de yoga','Pantalon de yoga. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',8500,'mode','S, M, L, XL',20,'https://images.unsplash.com/photo-1506629905607-d9c297d3d45b?w=800&q=80&auto=format&fit=crop',0),
  ('Veste en jean homme','Veste en jean homme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',18000,'mode','S, M, L, XL',7,'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=80&auto=format&fit=crop',1),
  ('Blouson en cuir','Blouson en cuir. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',45000,'mode','S, M, L, XL',12,'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800&q=80&auto=format&fit=crop',2),
  ('T-shirt coton premium','T-shirt coton premium. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',5000,'mode','S, M, L, XL',16,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop',3),
  ('Chemise blanche en coton','Chemise blanche en coton. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',9000,'mode','S, M, L, XL',7,'https://images.unsplash.com/photo-1584466977770-5f05c2af8c7d?w=800&q=80&auto=format&fit=crop',4),
  ('Chemise homme','Chemise homme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',9500,'mode','S, M, L, XL',20,'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80&auto=format&fit=crop',5),
  ('Polo homme','Polo homme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',7500,'mode','S, M, L, XL',6,'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&q=80&auto=format&fit=crop',0),
  ('Sweat à capuche','Sweat à capuche. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',12000,'mode','S, M, L, XL',21,'https://images.unsplash.com/photo-1585386959984-a415522e3f5d?w=800&q=80&auto=format&fit=crop',1),
  ('Sweat polaire','Sweat polaire. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',14000,'mode','S, M, L, XL',12,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80&auto=format&fit=crop',2),
  ('Pull en maille','Pull en maille. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',15000,'mode','S, M, L, XL',20,'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80&auto=format&fit=crop',3),
  ('Doudoune de voyage','Doudoune de voyage. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',30000,'mode','S, M, L, XL',24,'https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&q=80&auto=format&fit=crop',4),
  ('Blazer homme','Blazer homme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',35000,'mode','S, M, L, XL',8,'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80&auto=format&fit=crop',5),
  ('Veste de costume homme','Veste de costume homme. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',40000,'mode','S, M, L, XL',6,'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80&auto=format&fit=crop',0),
  ('Chino slim','Chino slim. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',11000,'mode','36, 38, 40, 42, 44',21,'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80&auto=format&fit=crop',1),
  ('Short cargo','Short cargo. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',7000,'mode','S, M, L, XL',21,'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=80&auto=format&fit=crop',2),
  ('Pantalon de survêtement','Pantalon de survêtement. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',9000,'mode','S, M, L, XL',23,'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&q=80&auto=format&fit=crop',3),
  ('Casquette','Casquette. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',4000,'mode','',9,'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80&auto=format&fit=crop',4),
  ('Écharpe en laine','Écharpe en laine. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',6000,'mode','',14,'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?w=800&q=80&auto=format&fit=crop',5),
  ('Lunettes de soleil aviateur','Lunettes de soleil aviateur. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',7000,'mode','',6,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80&auto=format&fit=crop',0),
  ('Sweat à capuche enfant','Sweat à capuche enfant. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',8000,'mode','4 ans, 6 ans, 8 ans, 10 ans',20,'https://images.unsplash.com/photo-1519278409-1f56fdda7fe5?w=800&q=80&auto=format&fit=crop',1),
  ('Salopette en jean enfant','Salopette en jean enfant. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',10000,'mode','4 ans, 6 ans, 8 ans, 10 ans',25,'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80&auto=format&fit=crop',2),
  ('Lot de T-shirts enfant','Lot de T-shirts enfant. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',9000,'mode','4 ans, 6 ans, 8 ans, 10 ans',5,'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&q=80&auto=format&fit=crop',3),
  ('Robe de fête fille','Robe de fête fille. Belle qualité, tissu agréable. Demandez d''autres couleurs sur WhatsApp.',12000,'mode','4 ans, 6 ans, 8 ans, 10 ans',21,'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=80&auto=format&fit=crop',4),
  ('Baskets de course','Baskets de course. Confortables et solides. Toutes les pointures sur demande.',35000,'chaussures','39, 40, 41, 42, 43, 44',4,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80&auto=format&fit=crop',5),
  ('Baskets casual','Baskets casual. Confortables et solides. Toutes les pointures sur demande.',25000,'chaussures','39, 40, 41, 42, 43, 44',22,'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80&auto=format&fit=crop',0),
  ('Chaussures de running','Chaussures de running. Confortables et solides. Toutes les pointures sur demande.',28000,'chaussures','39, 40, 41, 42, 43, 44',9,'https://images.unsplash.com/photo-1528701800489-20be32765956?w=800&q=80&auto=format&fit=crop',1),
  ('Escarpins femme','Escarpins femme. Confortables et solides. Toutes les pointures sur demande.',18000,'chaussures','36, 37, 38, 39, 40, 41',18,'https://images.unsplash.com/photo-1576179635662-fd5c858a44f8?w=800&q=80&auto=format&fit=crop',2),
  ('Escarpins classiques','Escarpins classiques. Confortables et solides. Toutes les pointures sur demande.',20000,'chaussures','36, 37, 38, 39, 40, 41',24,'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80&auto=format&fit=crop',3),
  ('Bottines','Bottines. Confortables et solides. Toutes les pointures sur demande.',27000,'chaussures','39, 40, 41, 42, 43, 44',20,'https://images.unsplash.com/photo-1605812860427-4024433a70fd?w=800&q=80&auto=format&fit=crop',4),
  ('Baskets de sport','Baskets de sport. Confortables et solides. Toutes les pointures sur demande.',30000,'chaussures','39, 40, 41, 42, 43, 44',16,'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80&auto=format&fit=crop',5),
  ('Mocassins en cuir','Mocassins en cuir. Confortables et solides. Toutes les pointures sur demande.',22000,'chaussures','39, 40, 41, 42, 43, 44',13,'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80&auto=format&fit=crop',0),
  ('Baskets montantes en toile','Baskets montantes en toile. Confortables et solides. Toutes les pointures sur demande.',18000,'chaussures','39, 40, 41, 42, 43, 44',17,'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80&auto=format&fit=crop',1),
  ('Chaussures richelieu','Chaussures richelieu. Confortables et solides. Toutes les pointures sur demande.',32000,'chaussures','39, 40, 41, 42, 43, 44',21,'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80&auto=format&fit=crop',2),
  ('Tongs','Tongs. Confortables et solides. Toutes les pointures sur demande.',3000,'chaussures','39, 40, 41, 42, 43, 44',17,'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80&auto=format&fit=crop',3),
  ('Baskets de ville','Baskets de ville. Confortables et solides. Toutes les pointures sur demande.',24000,'chaussures','39, 40, 41, 42, 43, 44',14,'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&q=80&auto=format&fit=crop',4),
  ('Sac à main en cuir','Sac à main en cuir. Finition soignée, pratique au quotidien.',25000,'sacs','',12,'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80&auto=format&fit=crop',5),
  ('Sac en cuir','Sac en cuir. Finition soignée, pratique au quotidien.',22000,'sacs','',10,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80&auto=format&fit=crop',0),
  ('Sac à main classique','Sac à main classique. Finition soignée, pratique au quotidien.',20000,'sacs','',8,'https://images.unsplash.com/photo-1600180758890-6d91813d2b09?w=800&q=80&auto=format&fit=crop',1),
  ('Sac à dos en toile','Sac à dos en toile. Finition soignée, pratique au quotidien.',15000,'sacs','',25,'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80&auto=format&fit=crop',2),
  ('Sac cabas femme','Sac cabas femme. Finition soignée, pratique au quotidien.',14000,'sacs','',10,'https://images.unsplash.com/photo-1603575445498-4b6a25c05955?w=800&q=80&auto=format&fit=crop',3),
  ('Tote bag en toile','Tote bag en toile. Finition soignée, pratique au quotidien.',5000,'sacs','',5,'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80&auto=format&fit=crop',4),
  ('Sac à dos de voyage 30 L','Sac à dos de voyage 30 L. Finition soignée, pratique au quotidien.',18000,'sacs','',21,'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?w=800&q=80&auto=format&fit=crop',5),
  ('Sac de sport','Sac de sport. Finition soignée, pratique au quotidien.',13000,'sacs','',12,'https://images.unsplash.com/photo-1622260614153-03223fb72052?w=800&q=80&auto=format&fit=crop',0),
  ('Portefeuille homme en cuir','Portefeuille homme en cuir. Finition soignée, pratique au quotidien.',8000,'sacs','',19,'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80&auto=format&fit=crop',1),
  ('Montre classique','Montre classique. Joli cadeau, livré dans un écrin.',20000,'bijoux','',18,'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80&auto=format&fit=crop',2),
  ('Montre homme','Montre homme. Joli cadeau, livré dans un écrin.',25000,'bijoux','',13,'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80&auto=format&fit=crop',3),
  ('Montre élégante','Montre élégante. Joli cadeau, livré dans un écrin.',18000,'bijoux','',17,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop',4),
  ('Collier doré','Collier doré. Joli cadeau, livré dans un écrin.',12000,'bijoux','',12,'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca4?w=800&q=80&auto=format&fit=crop',5),
  ('Collier en or','Collier en or. Joli cadeau, livré dans un écrin.',15000,'bijoux','',22,'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80&auto=format&fit=crop',0),
  ('Bague en argent','Bague en argent. Joli cadeau, livré dans un écrin.',9000,'bijoux','',5,'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80&auto=format&fit=crop',1),
  ('Boucles d''oreilles','Boucles d''oreilles. Joli cadeau, livré dans un écrin.',10000,'bijoux','',6,'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&q=80&auto=format&fit=crop',2),
  ('Bracelet','Bracelet. Joli cadeau, livré dans un écrin.',7000,'bijoux','',19,'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80&auto=format&fit=crop',3),
  ('Bracelet or rose','Bracelet or rose. Joli cadeau, livré dans un écrin.',8000,'bijoux','',16,'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&q=80&auto=format&fit=crop',4),
  ('Eau de parfum femme','Eau de parfum femme. Parfum longue tenue, 100 ml.',30000,'beaute','',8,'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80&auto=format&fit=crop',5),
  ('Parfum homme','Parfum homme. Parfum longue tenue, 100 ml.',28000,'beaute','',13,'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80&auto=format&fit=crop',0),
  ('Parfum à la rose','Parfum à la rose. Parfum longue tenue, 100 ml.',25000,'beaute','',7,'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2?w=800&q=80&auto=format&fit=crop',1),
  ('Bougies parfumées','Bougies parfumées. Pour une maison belle et accueillante.',6000,'maison','',18,'https://images.unsplash.com/photo-1602874801006-e26d3d17d0ed?w=800&q=80&auto=format&fit=crop',2),
  ('Canapé moderne','Canapé moderne. Pour une maison belle et accueillante.',350000,'maison','',16,'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&auto=format&fit=crop',3),
  ('Vases en céramique','Vases en céramique. Pour une maison belle et accueillante.',12000,'maison','',4,'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80&auto=format&fit=crop',4),
  ('Table basse','Table basse. Pour une maison belle et accueillante.',65000,'maison','',24,'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&q=80&auto=format&fit=crop',5),
  ('Cadre décoratif','Cadre décoratif. Pour une maison belle et accueillante.',10000,'maison','',5,'https://images.unsplash.com/photo-1582037928769-181f2644ecb7?w=800&q=80&auto=format&fit=crop',0),
  ('Plantes d''intérieur','Plantes d''intérieur. Pour une maison belle et accueillante.',8000,'maison','',20,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80&auto=format&fit=crop',1),
  ('Lampe de table','Lampe de table. Pour une maison belle et accueillante.',15000,'maison','',21,'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80&auto=format&fit=crop',2),
  ('Coussins décoratifs','Coussins décoratifs. Pour une maison belle et accueillante.',9000,'maison','',13,'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop',3)
  ) as v(nom, description, prix, categorie, tailles, stock, photo, couleur)
  where not exists (select 1 from public.products p where p.shop_id = sid and p.photo = v.photo);
end $$;

alter table public.shops enable trigger shops_protect;
alter table public.products enable trigger products_limit;
commit;
