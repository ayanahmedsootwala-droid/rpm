-- ============================================================
-- COMPREHENSIVE PAKISTAN MARKET VEHICLE DATABASE
-- Japanese, Chinese & Pakistani brands with models + variants
-- ============================================================

-- Clean up duplicate brands first (keep first by created_at)
DELETE FROM car_brands WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(name)) ORDER BY created_at) as rn
    FROM car_brands
  ) sub WHERE rn > 1
);

-- ── JAPANESE BRANDS ─────────────────────────────────────────

INSERT INTO car_brands (name, country_of_origin, brand_type, is_active, display_order)
VALUES
  ('Toyota',      'Japan', 'japanese', true, 10),
  ('Honda',       'Japan', 'japanese', true, 11),
  ('Suzuki',      'Japan', 'japanese', true, 12),
  ('Nissan',      'Japan', 'japanese', true, 13),
  ('Mitsubishi',  'Japan', 'japanese', true, 14),
  ('Mazda',       'Japan', 'japanese', true, 15),
  ('Daihatsu',    'Japan', 'japanese', true, 16),
  ('Subaru',      'Japan', 'japanese', true, 17),
  ('Isuzu',       'Japan', 'japanese', true, 18)
ON CONFLICT DO NOTHING;

-- ── CHINESE BRANDS ──────────────────────────────────────────

INSERT INTO car_brands (name, country_of_origin, brand_type, is_active, display_order)
VALUES
  ('Changan',        'China', 'chinese', true, 20),
  ('DFSK',           'China', 'chinese', true, 21),
  ('FAW',            'China', 'chinese', true, 22),
  ('Haval',          'China', 'chinese', true, 23),
  ('MG',             'China', 'chinese', true, 24),
  ('Proton',         'Malaysia/China', 'chinese', true, 25),
  ('BAIC',           'China', 'chinese', true, 26),
  ('Chery',          'China', 'chinese', true, 27),
  ('Regal Automobiles', 'Pakistan/China', 'chinese', true, 28),
  ('United',         'Pakistan/China', 'chinese', true, 29),
  ('Prince',         'Pakistan/China', 'chinese', true, 30),
  ('Master',         'Pakistan/China', 'chinese', true, 31)
ON CONFLICT DO NOTHING;

-- ── KOREAN BRANDS ────────────────────────────────────────────

INSERT INTO car_brands (name, country_of_origin, brand_type, is_active, display_order)
VALUES
  ('Hyundai',    'South Korea', 'korean', true, 40),
  ('Kia',        'South Korea', 'korean', true, 41),
  ('SsangYong',  'South Korea', 'korean', true, 42)
ON CONFLICT DO NOTHING;

-- ── EUROPEAN / OTHER BRANDS ──────────────────────────────────

INSERT INTO car_brands (name, country_of_origin, brand_type, is_active, display_order)
VALUES
  ('Audi',            'Germany',  'european', true, 50),
  ('BMW',             'Germany',  'european', true, 51),
  ('Mercedes-Benz',   'Germany',  'european', true, 52),
  ('Volkswagen',      'Germany',  'european', true, 53),
  ('Porsche',         'Germany',  'european', true, 54),
  ('Land Rover',      'UK',       'european', true, 55),
  ('Jeep',            'USA',      'american', true, 60),
  ('Ford',            'USA',      'american', true, 61),
  ('Chevrolet',       'USA',      'american', true, 62),
  ('Lexus',           'Japan',    'japanese', true, 63),
  ('Peugeot',         'France',   'european', true, 64),
  ('Renault',         'France',   'european', true, 65),
  ('Volvo',           'Sweden',   'european', true, 66),
  ('Other',           'Various',  'other',    true, 999)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- MODELS  (using brand name lookup to get brand_id)
-- ─────────────────────────────────────────────────────────────

INSERT INTO car_models (brand_id, name, is_active)
SELECT b.id, m.name, true
FROM (VALUES
  -- TOYOTA
  ('Toyota','Corolla'), ('Toyota','Yaris'), ('Toyota','Camry'), ('Toyota','Land Cruiser'),
  ('Toyota','Prado'), ('Toyota','Fortuner'), ('Toyota','Hilux'), ('Toyota','Rush'),
  ('Toyota','Revo'), ('Toyota','Vitz'), ('Toyota','Prius'), ('Toyota','Chr'),
  ('Toyota','Innova'), ('Toyota','Grandia'), ('Toyota','Corolla Cross'),
  ('Toyota','Aqua'), ('Toyota','Crown'), ('Toyota','Alphard'), ('Toyota','Vellfire'),

  -- HONDA
  ('Honda','City'), ('Honda','Civic'), ('Honda','HR-V'), ('Honda','CR-V'),
  ('Honda','BR-V'), ('Honda','Accord'), ('Honda','Jazz'), ('Honda','Freed'),
  ('Honda','Fit'), ('Honda','Vezel'), ('Honda','N-Box'), ('Honda','Passport'),
  ('Honda','Pilot'), ('Honda','Ridgeline'),

  -- SUZUKI
  ('Suzuki','Alto'), ('Suzuki','Cultus'), ('Suzuki','Wagon R'), ('Suzuki','Swift'),
  ('Suzuki','Ciaz'), ('Suzuki','Jimny'), ('Suzuki','Vitara'), ('Suzuki','Bolan'),
  ('Suzuki','Ravi'), ('Suzuki','Every'), ('Suzuki','Ignis'), ('Suzuki','Baleno'),
  ('Suzuki','Fronx'), ('Suzuki','Grand Vitara'), ('Suzuki','Ertiga'), ('Suzuki','XL7'),

  -- NISSAN
  ('Nissan','Sunny'), ('Nissan','Dayz'), ('Nissan','Note'), ('Nissan','Leaf'),
  ('Nissan','Juke'), ('Nissan','Navara'), ('Nissan','Patrol'), ('Nissan','Kicks'),
  ('Nissan','X-Trail'), ('Nissan','Cube'), ('Nissan','Serena'),

  -- MITSUBISHI
  ('Mitsubishi','Lancer'), ('Mitsubishi','Pajero'), ('Mitsubishi','L200'),
  ('Mitsubishi','Eclipse Cross'), ('Mitsubishi','Outlander'), ('Mitsubishi','ASX'),
  ('Mitsubishi','Attrage'), ('Mitsubishi','Mirage'), ('Mitsubishi','Galant'),
  ('Mitsubishi','Triton'),

  -- MAZDA
  ('Mazda','CX-5'), ('Mazda','CX-3'), ('Mazda','Mazda3'), ('Mazda','Mazda2'),
  ('Mazda','MX-5'), ('Mazda','BT-50'), ('Mazda','CX-30'), ('Mazda','CX-9'),

  -- DAIHATSU
  ('Daihatsu','Hijet'), ('Daihatsu','Mira'), ('Daihatsu','Move'),
  ('Daihatsu','Cuore'), ('Daihatsu','Terios'), ('Daihatsu','Rocky'),
  ('Daihatsu','Copen'), ('Daihatsu','Tanto'),

  -- SUBARU
  ('Subaru','Forester'), ('Subaru','Impreza'), ('Subaru','Outback'),
  ('Subaru','XV'), ('Subaru','BRZ'), ('Subaru','Legacy'), ('Subaru','Ascent'),

  -- CHANGAN
  ('Changan','Alsvin'), ('Changan','Karvaan'), ('Changan','Oshan X7'),
  ('Changan','Hunter'), ('Changan','CS35 Plus'), ('Changan','CS75 Plus'),
  ('Changan','Uni-T'), ('Changan','Uni-K'), ('Changan','M9'),

  -- DFSK
  ('DFSK','Glory 580'), ('DFSK','Glory 500'), ('DFSK','Seres 3'),
  ('DFSK','EC31'), ('DFSK','K01'), ('DFSK','K07'),

  -- FAW
  ('FAW','V2'), ('FAW','V7'), ('FAW','D60'), ('FAW','Carrier'),
  ('FAW','N5'), ('FAW','Sirius'), ('FAW','Besturn B50'),

  -- HAVAL
  ('Haval','H6'), ('Haval','H9'), ('Haval','Jolion'),
  ('Haval','Dargo'), ('Haval','F7'), ('Haval','H2'),

  -- MG
  ('MG','HS'), ('MG','ZS'), ('MG','5'), ('MG','6'),
  ('MG','RX5'), ('MG','3'), ('MG','GT'), ('MG','Cyberster'),

  -- PROTON
  ('Proton','Saga'), ('Proton','X50'), ('Proton','X70'),
  ('Proton','Persona'), ('Proton','Exora'), ('Proton','Perdana'),

  -- BAIC
  ('BAIC','BJ40'), ('BAIC','X25'), ('BAIC','D20'),
  ('BAIC','X55'), ('BAIC','MX5'), ('BAIC','BJ80'),

  -- CHERY
  ('Chery','Tiggo 4'), ('Chery','Tiggo 7'), ('Chery','Tiggo 8'),
  ('Chery','Arrizo 5'), ('Chery','Tiggo 4 Pro'), ('Chery','Omoda 5'),

  -- REGAL AUTOMOBILES
  ('Regal Automobiles','Frontier'),
  ('Regal Automobiles','Changan Karvaan Plus'),

  -- UNITED
  ('United','Bravo'), ('United','Alpha'), ('United','US 65'),
  ('United','US 70'), ('United','US 75'), ('United','US 175'),

  -- PRINCE
  ('Prince','Pearl'), ('Prince','DFSK Glory'), ('Prince','Carrier'),

  -- MASTER
  ('Master','Changan Van'), ('Master','MCV'),

  -- HYUNDAI
  ('Hyundai','Tucson'), ('Hyundai','Elantra'), ('Hyundai','Sonata'),
  ('Hyundai','Santa Fe'), ('Hyundai','Creta'), ('Hyundai','i10'),
  ('Hyundai','i20'), ('Hyundai','Palisade'), ('Hyundai','Venue'),
  ('Hyundai','Ioniq 5'), ('Hyundai','Custo'), ('Hyundai','Porter'),

  -- KIA
  ('Kia','Sportage'), ('Kia','Sorento'), ('Kia','Picanto'),
  ('Kia','Stonic'), ('Kia','Carnival'), ('Kia','EV6'),
  ('Kia','Telluride'), ('Kia','Seltos'), ('Kia','K5'),

  -- AUDI
  ('Audi','A3'), ('Audi','A4'), ('Audi','A6'), ('Audi','Q3'),
  ('Audi','Q5'), ('Audi','Q7'), ('Audi','A5'), ('Audi','Q8'),
  ('Audi','e-tron'),

  -- BMW
  ('BMW','3 Series'), ('BMW','5 Series'), ('BMW','7 Series'),
  ('BMW','X3'), ('BMW','X5'), ('BMW','X6'), ('BMW','X7'),
  ('BMW','i4'), ('BMW','iX'),

  -- MERCEDES-BENZ
  ('Mercedes-Benz','C-Class'), ('Mercedes-Benz','E-Class'), ('Mercedes-Benz','S-Class'),
  ('Mercedes-Benz','GLC'), ('Mercedes-Benz','GLE'), ('Mercedes-Benz','GLS'),
  ('Mercedes-Benz','A-Class'), ('Mercedes-Benz','EQS'),

  -- LEXUS
  ('Lexus','LX'), ('Lexus','RX'), ('Lexus','ES'), ('Lexus','NX'),
  ('Lexus','GX'), ('Lexus','IS'), ('Lexus','LS'),

  -- VOLKSWAGEN
  ('Volkswagen','Golf'), ('Volkswagen','Passat'), ('Volkswagen','Tiguan'),
  ('Volkswagen','Touareg'), ('Volkswagen','Polo'), ('Volkswagen','ID.4'),

  -- LAND ROVER
  ('Land Rover','Defender'), ('Land Rover','Discovery'), ('Land Rover','Range Rover'),
  ('Land Rover','Range Rover Sport'), ('Land Rover','Freelander'),

  -- ISUZU
  ('Isuzu','D-Max'), ('Isuzu','MU-X'), ('Isuzu','Trooper'),
  ('Isuzu','Forward'), ('Isuzu','NKR'),

  -- JEEP
  ('Jeep','Wrangler'), ('Jeep','Cherokee'), ('Jeep','Grand Cherokee'),
  ('Jeep','Compass'), ('Jeep','Gladiator'),

  -- OTHER
  ('Other','Other')
) AS m(brand_name, name)
JOIN car_brands b ON LOWER(TRIM(b.name)) = LOWER(TRIM(m.brand_name))
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- VARIANTS (key Pakistan-market variants)
-- ─────────────────────────────────────────────────────────────

INSERT INTO car_variants (model_id, name, is_active)
SELECT mo.id, v.name, true
FROM (VALUES
  -- Toyota Corolla
  ('Corolla','Altis 1.6'), ('Corolla','Altis 1.8'), ('Corolla','Altis Grande'),
  ('Corolla','X 1.6'), ('Corolla','X 1.8'), ('Corolla','GLI 1.3'),
  ('Corolla','XLI 1.3'), ('Corolla','Cross 1.8 Hybrid'),

  -- Toyota Yaris
  ('Yaris','ATIV X MT'), ('Yaris','ATIV X CVT'), ('Yaris','ATIV MT'),
  ('Yaris','ATIV CVT'), ('Yaris','1.3 GLI MT'), ('Yaris','1.5 ATIV X'),

  -- Toyota Fortuner
  ('Fortuner','2.7 VVTi MT'), ('Fortuner','2.7 VVTi AT'),
  ('Fortuner','2.8 Sigma 4'), ('Fortuner','Legender'), ('Fortuner','GR Sport'),

  -- Toyota Land Cruiser
  ('Land Cruiser','ZX V8'), ('Land Cruiser','AX V8'), ('Land Cruiser','VX V6'),
  ('Land Cruiser','VXR V6'), ('Land Cruiser','ZX V6 2022'),

  -- Toyota Prado
  ('Prado','TZ-G'), ('Prado','TX'), ('Prado','TXL'), ('Prado','TX Limited'),

  -- Toyota Hilux
  ('Hilux','Revo G'), ('Hilux','Revo V'), ('Hilux','GR Sport'),

  -- Toyota Prius
  ('Prius','1.5 Hybrid'), ('Prius','1.8 S'), ('Prius','1.8 S LED'),
  ('Prius','Alpha S'), ('Prius','Alpha G'),

  -- Honda City
  ('City','1.2L MT'), ('City','1.2L CVT'), ('City','1.5L MT'),
  ('City','1.5L CVT'), ('City','1.5L Aspire MT'), ('City','1.5L Aspire CVT'),

  -- Honda Civic
  ('Civic','1.5T RS Turbo'), ('Civic','1.8 Oriel'), ('Civic','1.8 VTi'),
  ('Civic','1.8 VTi Oriel'), ('Civic','Turbo Oriel CVT'), ('Civic','e:HEV'),

  -- Honda HR-V
  ('HR-V','1.5 SOHC MT'), ('HR-V','1.5 SOHC CVT'), ('HR-V','RS e:HEV'),

  -- Honda BR-V
  ('BR-V','1.5 i-VTEC MT'), ('BR-V','1.5 i-VTEC CVT'), ('BR-V','Oriel'),

  -- Suzuki Alto
  ('Alto','VX'), ('Alto','VXR'), ('Alto','VXL'), ('Alto','AGS'),

  -- Suzuki Cultus
  ('Cultus','VXR MT'), ('Cultus','VXL MT'), ('Cultus','VXL AGS'),
  ('Cultus','Auto Gear Shift'),

  -- Suzuki Wagon R
  ('Wagon R','VXR'), ('Wagon R','VXL'), ('Wagon R','AGS'),

  -- Suzuki Swift
  ('Swift','GLX MT'), ('Swift','GLX CVT'), ('Swift','DLX'), ('Swift','Sport'),

  -- Suzuki Ciaz
  ('Ciaz','1.4 AT'), ('Ciaz','1.4 MT'),

  -- Suzuki Jimny
  ('Jimny','JLX'), ('Jimny','JX'), ('Jimny','1.3 MT'),

  -- Suzuki Bolan
  ('Bolan','Standard'), ('Bolan','Carry Daba'), ('Bolan','VX'),

  -- Changan Alsvin
  ('Alsvin','1.5L Comfort MT'), ('Alsvin','1.5L Comfort CVT'),
  ('Alsvin','1.5L Lumiere MT'), ('Alsvin','1.5L Lumiere CVT'),
  ('Alsvin','1.5L Noir MT'), ('Alsvin','1.5L Noir CVT'),

  -- Changan Karvaan
  ('Karvaan','Standard'), ('Karvaan','Plus'),

  -- Changan Oshan X7
  ('Oshan X7','1.5T Comfort'), ('Oshan X7','1.5T Premium'),

  -- Hyundai Tucson
  ('Tucson','1.6T GDi AWD'), ('Tucson','2.0L FWD AT'),
  ('Tucson','FWD MT'), ('Tucson','N Line'), ('Tucson','Smartstream'),

  -- Hyundai Elantra
  ('Elantra','1.6 GLS MT'), ('Elantra','1.6 GLS AT'), ('Elantra','2.0 Exec'),

  -- Kia Sportage
  ('Sportage','2.0L AWD Alpha'), ('Sportage','2.0L FWD Alpha'),
  ('Sportage','2.0L AT FWD'), ('Sportage','1.5T X-Line'), ('Sportage','Hybrid'),

  -- Kia Picanto
  ('Picanto','1.0L MT'), ('Picanto','1.0L AT'), ('Picanto','1.25L AT'),

  -- MG HS
  ('HS','1.5T Comfort'), ('HS','1.5T Essence'), ('HS','2.0T Trophy'), ('HS','Plug-in Hybrid'),

  -- MG ZS
  ('ZS','1.5L MT'), ('ZS','1.5L AT'), ('ZS','EV'), ('ZS','EV Excite'), ('ZS','EV Exclusive'),

  -- Haval H6
  ('H6','1.5T HEV Prem'), ('H6','DCT Lux'), ('H6','PHEV'),

  -- Haval Jolion
  ('Jolion','1.5T Comfort'), ('Jolion','1.5T Lux'), ('Jolion','1.5T HEV'),

  -- Proton X50
  ('X50','Standard'), ('X50','Executive'), ('X50','Premium'),

  -- Proton Saga
  ('Saga','Standard MT'), ('Saga','Standard AT'), ('Saga','Premium AT'),

  -- FAW V2
  ('V2','Hatchback'), ('V2','Wagon'),

  -- Nissan Sunny
  ('Sunny','EX MT'), ('Sunny','EX AT'), ('Sunny','GX AT'),

  -- Other
  ('Other','Other')
) AS v(model_name, name)
JOIN car_models mo ON LOWER(TRIM(mo.name)) = LOWER(TRIM(v.model_name))
ON CONFLICT DO NOTHING;
