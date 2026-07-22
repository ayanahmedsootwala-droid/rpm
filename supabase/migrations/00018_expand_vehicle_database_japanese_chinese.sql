-- ============================================================
-- STEP 1: Add missing brands
-- ============================================================
INSERT INTO car_brands (name, country_of_origin, brand_type, is_active, display_order)
VALUES
  ('Infiniti',  'Japan',  'Japanese', true, 100),
  ('Acura',     'Japan',  'Japanese', true, 101),
  ('Hi-Speed',  'Pakistan','Domestic', true, 102),
  ('JAC',       'China',  'Chinese',  true, 103),
  ('Hino',      'Japan',  'Japanese', true, 104),
  ('Daewoo',    'South Korea','Korean', true, 105),
  ('SsangYong', 'South Korea','Korean', true, 106)
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 2: Add models for NEW brands
-- ============================================================

-- Infiniti
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Q50'),('Q60'),('Q70'),('Q30'),('QX30'),('QX50'),('QX55'),('QX60'),('QX70'),('QX80'),
  ('G35'),('G37'),('M35'),('M45'),('EX35'),('FX35'),('FX37'),('FX50'),('JX35'),('EX37')
) AS m(name)
WHERE b.name = 'Infiniti'
ON CONFLICT DO NOTHING;

-- Acura
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('TL'),('TLX'),('CL'),('RL'),('RLX'),('MDX'),('RDX'),('ZDX'),('CDX'),('ILX'),('NSX'),('RSX'),('TSX'),('Integra')
) AS m(name)
WHERE b.name = 'Acura'
ON CONFLICT DO NOTHING;

-- Hi-Speed
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Loader 70'),('Mini Loader'),('HR-70'),('Cargo Van'),('Loader 100')
) AS m(name)
WHERE b.name = 'Hi-Speed'
ON CONFLICT DO NOTHING;

-- JAC
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('J7'),('J4'),('S3'),('S4'),('S7'),('T8'),('T9'),('iEV7S'),('Refine A60'),('Sei 4'),('Sei 7'),('Gallop')
) AS m(name)
WHERE b.name = 'JAC'
ON CONFLICT DO NOTHING;

-- Hino
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Dutro'),('Ranger'),('500 Series'),('300 Series'),('700 Series'),('Profia')
) AS m(name)
WHERE b.name = 'Hino'
ON CONFLICT DO NOTHING;

-- Daewoo
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Nexia'),('Racer'),('Cielo'),('Tacuma'),('Nubira'),('Matiz'),('Lacetti'),('Gentra')
) AS m(name)
WHERE b.name = 'Daewoo'
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 3: Add MORE models for existing Japanese brands
-- ============================================================

-- Toyota
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Harrier'),('FJ Cruiser'),('Estima'),('Wish'),('Noah'),('Voxy'),('Esquire'),('Succeed'),
  ('Probox'),('Auris'),('Verso'),('Town Ace'),('Regius Ace'),('Markhor'),('Raum'),('Sienta'),
  ('Porte'),('Spade'),('Tank'),('Roomy'),('Passo'),('Belta'),('Allion'),('Premio'),
  ('Blade'),('Axio'),('Fielder'),('Avanza'),('Veloz'),('Yaris Cross'),('bZ4X'),('Century')
) AS m(name)
WHERE b.name = 'Toyota'
ON CONFLICT DO NOTHING;

-- Honda
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Elysion'),('Odyssey'),('Stepwgn'),('Shuttle'),('N-One'),('N-WGN'),('Life'),('Zest'),
  ('Inspire'),('Airwave'),('Mobilio'),('Mobilio Spike'),('Edix'),('Element'),('Crossroad'),
  ('MDX'),('Legend'),('Jade'),('Grace'),('S2000'),('S660'),('Type R'),('WR-V'),('ZR-V')
) AS m(name)
WHERE b.name = 'Honda'
ON CONFLICT DO NOTHING;

-- Nissan
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('GT-R'),('370Z'),('350Z'),('Wingroad'),('AD Van'),('Caravan'),('NV200'),('NV350'),
  ('Teana'),('Bluebird'),('Primera'),('Murano'),('Pathfinder'),('Armada'),('Titan'),
  ('Elgrand'),('Presage'),('Liberty'),('Pulsar'),('Tiida'),('Latio'),('Sylphy'),('March'),
  ('Roox'),('Moco'),('Otti'),('Pixo'),('Pino'),('Otti')
) AS m(name)
WHERE b.name = 'Nissan'
ON CONFLICT DO NOTHING;

-- Mitsubishi
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Delica'),('Delica D5'),('RVR'),('Challenger'),('Pajero Mini'),('Pajero Junior'),
  ('eK Wagon'),('eK Space'),('Colt'),('Colt Plus'),('Grandis'),('Sigma'),('GTO'),
  ('3000GT'),('FTO'),('Eclipse'),('Galant Fortis'),('Dion'),('Chariot'),('Airtrek')
) AS m(name)
WHERE b.name = 'Mitsubishi'
ON CONFLICT DO NOTHING;

-- Mazda
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Atenza'),('Axela'),('Biante'),('Premacy'),('MPV'),('Capella'),('Familia'),
  ('Tribute'),('Verisa'),('CX-8'),('CX-60'),('CX-90'),('Roadster'),('RX-8'),('MX-30')
) AS m(name)
WHERE b.name = 'Mazda'
ON CONFLICT DO NOTHING;

-- Subaru
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('WRX'),('WRX STI'),('Stella'),('Pleo'),('Lucra'),('Exiga'),('Dias Wagon'),
  ('Sambar'),('Trezia'),('Justy'),('R1'),('R2'),('Solterra'),('Crosstrek')
) AS m(name)
WHERE b.name = 'Subaru'
ON CONFLICT DO NOTHING;

-- Daihatsu
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('YRV'),('Max'),('Atrai'),('Cast'),('Taft'),('Wake'),('Thor'),('Boon'),('Sirion'),
  ('Gran Max'),('Delta'),('Luxio'),('Xenia'),('Ayla'),('Sigra'),('Alya'),('Be-go')
) AS m(name)
WHERE b.name = 'Daihatsu'
ON CONFLICT DO NOTHING;

-- Isuzu
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Elf'),('Bighorn'),('Rodeo'),('Wizard'),('Vehicross'),('Piazza'),('Gemini'),
  ('Axiom'),('FRR'),('FSR'),('FTR'),('FVR'),('GXZ')
) AS m(name)
WHERE b.name = 'Isuzu'
ON CONFLICT DO NOTHING;

-- Lexus
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('UX'),('RC'),('CT'),('LC'),('GS'),('HS'),('SC'),('LFA'),('LM'),('TX')
) AS m(name)
WHERE b.name = 'Lexus'
ON CONFLICT DO NOTHING;

-- Suzuki
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Liana'),('Kizashi'),('Burgman'),('APV'),('Carry'),('Super Carry'),('SX4'),('Across'),
  ('Swace'),('Spacia'),('Hustler'),('Lapin'),('MR Wagon'),('Palette'),('Solio'),('Landy'),
  ('Escudo'),('Samurai'),('Sidekick')
) AS m(name)
WHERE b.name = 'Suzuki'
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 4: Add MORE models for existing Chinese brands
-- ============================================================

-- Changan extra models
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Star 7'),('Lumin'),('Deepal S07'),('Uni-V'),('Eado Plus'),('CS55 Plus'),('Shenlan SL03')
) AS m(name)
WHERE b.name = 'Changan'
ON CONFLICT DO NOTHING;

-- Haval extra
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('H1'),('H4'),('H5'),('H8'),('Big Dog'),('Xiaolong'),('Cool Dog')
) AS m(name)
WHERE b.name = 'Haval'
ON CONFLICT DO NOTHING;

-- MG extra
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('MG 4'),('MG 7'),('MG One'),('EHS'),('Marvel R'),('VS'),('GS'),('360')
) AS m(name)
WHERE b.name = 'MG'
ON CONFLICT DO NOTHING;

-- BYD extra
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('e2'),('e5'),('Destroyer 05'),('Song Pro'),('Yuan Plus'),('Frigate 07'),('Ocean-X')
) AS m(name)
WHERE b.name = 'BYD'
ON CONFLICT DO NOTHING;

-- Geely extra
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Boyue'),('Binyue'),('Jiaji'),('Preface'),('GC9'),('Vision X6'),('Azkarra'),('Xingyue L')
) AS m(name)
WHERE b.name = 'Geely'
ON CONFLICT DO NOTHING;

-- Chery extra
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('Tiggo 4 Pro'),('Tiggo 6 Pro'),('Tiggo 8 Pro'),('Arrizo 6'),('QQ'),('Fengyun T9')
) AS m(name)
WHERE b.name = 'Chery'
ON CONFLICT DO NOTHING;

-- DFSK extra
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('C31'),('C35'),('C37'),('Glory 330'),('Sokon'),('Star V')
) AS m(name)
WHERE b.name = 'DFSK'
ON CONFLICT DO NOTHING;

-- FAW extra
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM car_brands b, (VALUES
  ('R7'),('X80'),('Oley'),('Besturn B30'),('Besturn X40'),('Jiefang Truck'),('HongQi H5')
) AS m(name)
WHERE b.name = 'FAW'
ON CONFLICT DO NOTHING;