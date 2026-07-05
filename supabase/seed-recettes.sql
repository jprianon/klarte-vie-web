-- Seed : 12 recettes du carnet de Jérémy (format « fiche »).
-- À charger sur le VPS :
--   docker exec -i klarte-db psql -U klarte -d klarte < supabase/seed-recettes.sql
-- Idempotent sur le titre : ne réinsère pas une recette déjà présente.

insert into recipes
  (title, category_name, servings, prep_minutes, rest_minutes, cook_minutes,
   difficulty, ingredients, steps, tags, kcal, carbs_g, protein_g, fat_g, source)
select v.title, v.category_name, v.servings, v.prep_minutes, v.rest_minutes, v.cook_minutes,
       v.difficulty, v.ingredients::jsonb, v.steps::jsonb, v.tags::jsonb,
       v.kcal, v.carbs_g, v.protein_g, v.fat_g, 'manual'
from (values
  (
    'Gaufres de patate douce', 'Petit-déj', null, 30, 30, null, 'facile',
    '[{"qty":"400","unit":"g","item":"patates douces"},{"qty":"125","unit":"g","item":"farine"},{"qty":"2","unit":null,"item":"oeufs"},{"qty":"5","unit":"cl","item":"lait"},{"qty":"40","unit":"g","item":"beurre fondu"},{"qty":"1","unit":"sachet","item":"levure chimique"},{"qty":"1","unit":"c.à.s","item":"persil plat haché (optionnel)"},{"qty":null,"unit":null,"item":"sel"},{"qty":null,"unit":null,"item":"poivre"}]',
    '["Épluchez la patate douce et coupez-la en dés.","Faites-la cuire à la vapeur puis réduisez-la en purée.","Dans un saladier, mélangez la farine, la levure, les oeufs, le lait, le persil, le beurre fondu, le sel et le poivre.","Ajoutez la purée de patate douce.","Filmez le saladier et laissez reposer 30 minutes.","Beurrez légèrement un gaufrier et faites-le chauffer.","Faites cuire les gaufres."]',
    '["Petit-déj","Végétarien","Gaufres"]', 1263, 177, 33, 47
  ),
  (
    'Cheesenan', 'Pains', 6, 15, 120, 30, 'moyen',
    '[{"qty":"500","unit":"g","item":"farine de blé"},{"qty":"18","unit":"cl","item":"eau tiède"},{"qty":"1","unit":null,"item":"yaourt à la grecque (120 g)"},{"qty":"4","unit":"c.à.s","item":"huile neutre"},{"qty":"1","unit":"sachet","item":"levure sèche de boulangerie (8 g)"},{"qty":"1","unit":"c.à.c","item":"sel"},{"qty":"1","unit":"c.à.c","item":"sucre en poudre"},{"qty":"280","unit":"g","item":"fromage frais type Vache Qui Rit"}]',
    '["Délayer la levure dans l''eau tiède et laisser reposer 5 à 10 minutes.","Mélanger farine, sel, sucre, yaourt et huile.","Ajouter l''eau avec la levure et pétrir 15 minutes jusqu''à une pâte souple.","Couvrir et laisser lever 2 heures dans un endroit tiède.","Dégazer la pâte et la diviser en 6 boules.","Étaler chaque boule, déposer du fromage au centre, refermer et reformer une boule.","Étaler à nouveau en gardant de l''épaisseur.","Laisser reposer 30 minutes.","Cuire dans une poêle chaude sans matière grasse, 3 minutes par face (couvrir la première face).","Optionnel : badigeonner de beurre fondu, ail et coriandre après cuisson."]',
    '["Pains","Fait maison","Indien"]', 490, 62, 16, 28
  ),
  (
    'Curry d''aubergines', 'Plats', 4, 20, null, 20, 'facile',
    '[{"qty":"2","unit":null,"item":"aubergines"},{"qty":null,"unit":null,"item":"poignée de tomates cerises"},{"qty":"1","unit":"boîte","item":"pois chiches"},{"qty":"1","unit":"c.à.c","item":"paprika"},{"qty":"1","unit":"c.à.s","item":"curry, curcuma"},{"qty":"1","unit":"petite boîte","item":"crème liquide allégée"},{"qty":"1","unit":"petite boîte","item":"lait de coco"},{"qty":"20","unit":"g","item":"beurre"}]',
    '["Découpez les aubergines en morceaux.","Faites-les cuire dans de l''eau bouillante 15 minutes, puis égouttez.","Faites revenir les pois chiches dans un peu d''huile avec du paprika jusqu''à ce qu''ils soient légèrement grillés.","Ajoutez les tomates cerises, les aubergines, le curry et le paprika.","Incorporez le lait de coco et la crème, laissez mijoter à couvert 15 minutes.","À part, faites fondre du beurre avec du piment en poudre.","Versez ce beurre épicé sur le plat juste avant de servir."]',
    '["Plats","Végétarien","Curry"]', 1263, 177, 33, 47
  ),
  (
    'Lentilles au boeuf mijoté', 'Plats', null, 20, null, 60, 'moyen',
    '[{"qty":"600","unit":"g","item":"boeuf à mijoter"},{"qty":"200","unit":"g","item":"lentilles"},{"qty":null,"unit":null,"item":"poivron rouge, 1 tomate, 1 piment, 3 gousses d''ail"},{"qty":"1","unit":null,"item":"oignon"},{"qty":"1","unit":"c.à.c","item":"épices (sel, poivre, curcuma, cumin, piment doux)"},{"qty":"15","unit":"cl","item":"lait de coco"},{"qty":null,"unit":null,"item":"persil et citron vert"}]',
    '["Rince les lentilles à l''eau froide jusqu''à ce que l''eau soit claire.","Émince l''oignon, hache l''ail.","Coupe le poivron, la tomate et le piment, puis mixe-les avec les épices.","Coupe le boeuf en morceaux.","Fais revenir le boeuf à feu moyen jusqu''à ce qu''il soit doré sur toutes les faces.","Ajoute l''oignon et fais revenir jusqu''à ce qu''il devienne translucide.","Ajoute les lentilles et fais revenir quelques minutes.","Ajoute de l''eau (2 fois le volume des lentilles).","Ajoute la mixture préparée.","Couvre et laisse mijoter à feu moyen 45 min à 1 h.","Ajoute le lait de coco et laisse mijoter encore 5 à 10 minutes.","Ajoute le persil ciselé et un filet de citron vert avant de servir."]',
    '["Plats","Mijoté","Boeuf"]', 1263, 177, 33, 47
  ),
  (
    'Crêpes simples', 'Desserts', 2, 5, 30, 10, 'facile',
    '[{"qty":"125","unit":"g","item":"farine de blé"},{"qty":"2","unit":null,"item":"oeufs"},{"qty":"25","unit":"cl","item":"lait"},{"qty":"1","unit":"sachet","item":"sucre vanillé"},{"qty":"1","unit":"pincée","item":"sel"}]',
    '["Verser la farine, le sel et le sucre vanillé dans un saladier et mélanger.","Faire un puits et casser les oeufs au centre.","Fouetter en versant progressivement le lait jusqu''à une pâte lisse.","Laisser reposer la pâte.","Cuire les crêpes dans une poêle chaude."]',
    '["Desserts","Petit-déj","Classique"]', 742, 117, 33, 16
  ),
  (
    'Poulet Yassa', 'Plats', null, 20, 120, 40, 'moyen',
    '[{"qty":"1","unit":null,"item":"poulet entier découpé (6 à 8 morceaux)"},{"qty":"6","unit":null,"item":"à 8 gros oignons"},{"qty":"3","unit":null,"item":"à 4 citrons (≈200 ml de jus)"},{"qty":null,"unit":null,"item":"olives"},{"qty":"3","unit":"c.à.s","item":"moutarde"},{"qty":"4","unit":null,"item":"à 5 gousses d''ail"},{"qty":"4","unit":"c.à.s","item":"à 6 d''huile"},{"qty":null,"unit":null,"item":"sel, poivre"}]',
    '["Nettoyer et découper le poulet en morceaux.","Mixer ou piler l''ail, une partie des oignons et le piment.","Mélanger avec le jus de citron, la moutarde, le sel, le poivre et l''huile.","Inciser les morceaux de poulet et bien les enrober de marinade.","Ajouter le reste des oignons émincés.","Laisser mariner au réfrigérateur au moins 2 heures, idéalement une nuit.","Faire dorer les morceaux de poulet dans une marmite.","Ajouter tous les oignons et la marinade.","Couvrir et laisser mijoter jusqu''à ce que les oignons soient fondants et le poulet cuit.","Ajouter quelques olives.","Rectifier l''assaisonnement et servir chaud avec du riz blanc."]',
    '["Plats","Sénégalais","Poulet"]', 1250, 70, 150, 65
  ),
  (
    'Houmous de betteraves', 'Apéro', null, 15, null, null, 'facile',
    '[{"qty":"1","unit":null,"item":"betterave cuite"},{"qty":"1","unit":"petite boîte","item":"pois chiches (265 g égoutté)"},{"qty":"4","unit":"c.à.s","item":"tahini"},{"qty":"2","unit":"c.à.s","item":"huile d''olive"},{"qty":"3","unit":"c.à.s","item":"jus de citron"},{"qty":"2","unit":null,"item":"gousses d''ail"},{"qty":"4","unit":"c.à.s","item":"eau"},{"qty":null,"unit":null,"item":"cumin"},{"qty":null,"unit":null,"item":"sel"}]',
    '["Mixer la betterave quelques secondes.","Ajouter le jus de citron, l''eau, l''huile d''olive, le tahini, l''ail, le cumin et le sel. Mixer jusqu''à un mélange homogène.","Ajouter les pois chiches égouttés et rincés.","Mixer plusieurs minutes jusqu''à texture lisse.","Ajuster l''assaisonnement et la texture avec un peu d''eau si besoin.","Servir frais avec un filet d''huile d''olive."]',
    '["Apéro","Végétarien","Sans cuisson"]', 930, 78, 30, 58
  ),
  (
    'Batbout', 'Pains', 12, 30, 90, 5, 'moyen',
    '[{"qty":"600","unit":"g","item":"semoule de blé dur extra-fine"},{"qty":"1","unit":"c.à.c","item":"sucre"},{"qty":"1.5","unit":"c.à.c","item":"sel"},{"qty":"20","unit":"g","item":"poudre de lait"},{"qty":"10","unit":"g","item":"levure boulangère sèche"},{"qty":"350","unit":"ml","item":"à 400 d''eau tiède"}]',
    '["Mélanger tous les ingrédients secs.","Ajouter l''eau progressivement et pétrir jusqu''à une pâte lisse.","Former une boule, couvrir et laisser lever jusqu''à doubler de volume.","Dégazer et diviser en 12 boules.","Laisser reposer 10 minutes.","Étaler chaque boule en disque fin (2 à 3 mm).","Laisser reposer 1 heure.","Cuire à sec dans une poêle chaude en retournant plusieurs fois, jusqu''à gonflement.","Couvrir d''un torchon après cuisson pour garder le moelleux."]',
    '["Pains","Marocain","Fait maison"]', 190, 38, 7, 1
  ),
  (
    'Daube de chouchou', 'Plats', null, 10, null, 35, 'facile',
    '[{"qty":"2","unit":null,"item":"chouchous"},{"qty":"1","unit":null,"item":"oignon"},{"qty":"3","unit":null,"item":"gousses d''ail"},{"qty":"1","unit":"morceau","item":"gingembre"},{"qty":"1","unit":"c.à.c","item":"safran"},{"qty":null,"unit":null,"item":"thym"}]',
    '["Couper les chouchous en cubes.","Faire roussir l''oignon.","Piler l''ail et le gingembre.","Ajouter le chouchou, le thym, l''ail et le gingembre.","Ajouter le safran.","Couvrir et cuire à feu moyen pendant 35 minutes."]',
    '["Plats","Réunionnais","Végétarien"]', 160, 38, 4, 1
  ),
  (
    'Poulet sauce d''huître', 'Plats', null, 15, 30, 40, 'moyen',
    '[{"qty":"6","unit":null,"item":"pilons de poulet"},{"qty":"50","unit":"ml","item":"sauce d''huître"},{"qty":"50","unit":"ml","item":"sauce soja"},{"qty":"25","unit":"ml","item":"vin blanc"},{"qty":"2","unit":null,"item":"oignons"},{"qty":"1","unit":null,"item":"gousse d''ail"},{"qty":"2","unit":"cm","item":"gingembre frais"},{"qty":"1","unit":"c.à.s","item":"huile"},{"qty":null,"unit":null,"item":"sel, poivre"}]',
    '["Marinade : hacher ail, oignons et gingembre, puis mélanger avec la sauce d''huître, la sauce soja et le vin blanc.","Inciser les pilons, saler, poivrer et ajouter la marinade. Laisser mariner au frais.","Chauffer l''huile et faire dorer les pilons 10 minutes à feu vif.","Baisser le feu et ajouter la marinade.","Laisser mijoter 30 minutes en retournant régulièrement.","Servir chaud."]',
    '["Plats","Asiatique","Poulet"]', 1350, 35, 150, 65
  ),
  (
    'Tarte aux poireaux', 'Plats', null, 10, null, 50, 'facile',
    '[{"qty":"1","unit":null,"item":"pâte brisée"},{"qty":"1","unit":null,"item":"oignon"},{"qty":"3","unit":null,"item":"blancs de poireaux"},{"qty":"1","unit":"c.à.s","item":"farine"},{"qty":"50","unit":"g","item":"beurre"},{"qty":"1","unit":null,"item":"oeuf"},{"qty":"20","unit":"cl","item":"crème liquide entière"},{"qty":"75","unit":"g","item":"fromage râpé"},{"qty":null,"unit":null,"item":"sel, poivre"}]',
    '["Faites chauffer le four à 150°C.","Coupez les blancs de poireaux en tronçons très fins.","Faites-les étuver avec le beurre à feu doux pendant 10 minutes.","Laissez tiédir puis ajoutez la farine, l''oeuf et la crème. Mélangez.","Abaissez la pâte dans un moule et piquez le fond à la fourchette.","Déposez les poireaux à la crème par-dessus.","Enfournez environ 40 minutes."]',
    '["Plats","Végétarien","Tarte"]', 295, 19, 8, 21
  ),
  (
    'Verrines italiennes au parmesan', 'Apéro', null, 20, 120, null, 'facile',
    '[{"qty":"500","unit":"g","item":"tomates cerises"},{"qty":"1","unit":null,"item":"poivron rouge"},{"qty":null,"unit":null,"item":"ail, sel, poivre, huile d''olive"},{"qty":"20","unit":"cl","item":"à 25 de crème fraîche épaisse"},{"qty":"120","unit":"g","item":"parmesan râpé"},{"qty":null,"unit":null,"item":"jambon de parme ou chorizo"}]',
    '["Faire revenir l''ail avec l''huile d''olive, ajouter les tomates cerises et le poivron pelé.","Saler et poivrer.","Faire chauffer jusqu''à obtenir une compotée.","Verser dans les verrines.","Faire chauffer la crème fraîche avec le parmesan jusqu''à un mélange lisse.","Verser la préparation au parmesan par-dessus.","Mettre 2 h au réfrigérateur.","Avant de servir, ajouter le jambon sur le dessus."]',
    '["Apéro","Italien","Verrines"]', 1650, 55, 85, 135
  )
) as v(title, category_name, servings, prep_minutes, rest_minutes, cook_minutes,
       difficulty, ingredients, steps, tags, kcal, carbs_g, protein_g, fat_g)
where not exists (select 1 from recipes r where r.title = v.title);
