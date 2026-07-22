
-- ============================================================
-- v33: Expand vehicle database — more brands, models, variants
-- Uses ON CONFLICT DO NOTHING to be safe against duplicates
-- ============================================================

-- ── 1. New brands ─────────────────────────────────────────────
INSERT INTO car_brands (name, country_of_origin, brand_type, is_active, display_order)
VALUES
  ('BMW',           'Germany',      'luxury',    true, 30),
  ('Mercedes-Benz', 'Germany',      'luxury',    true, 31),
  ('Audi',          'Germany',      'luxury',    true, 32),
  ('Volkswagen',    'Germany',      'standard',  true, 33),
  ('Porsche',       'Germany',      'luxury',    true, 34),
  ('Volvo',         'Sweden',       'luxury',    true, 35),
  ('Jeep',          'USA',          'standard',  true, 36),
  ('Ford',          'USA',          'standard',  true, 37),
  ('Chevrolet',     'USA',          'standard',  true, 38),
  ('MINI',          'UK',           'standard',  true, 39),
  ('Proton',        'Malaysia',     'standard',  true, 40),
  ('Prince',        'Pakistan',     'standard',  true, 41),
  ('United',        'Pakistan',     'standard',  true, 42),
  ('Regal',         'Pakistan',     'standard',  true, 43),
  ('Master',        'Pakistan',     'standard',  true, 44),
  ('Peugeot',       'France',       'standard',  true, 45),
  ('Renault',       'France',       'standard',  true, 46),
  ('Land Rover',    'UK',           'luxury',    true, 47),
  ('Genesis',       'South Korea',  'luxury',    true, 48),
  ('Chery',         'China',        'standard',  true, 49)
ON CONFLICT (name) DO NOTHING;

-- ── 2. BMW models ─────────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('3 Series'), ('5 Series'), ('7 Series'), ('X1'), ('X3'), ('X5'), ('X6'), ('X7'),
  ('2 Series'), ('4 Series'), ('8 Series'), ('Z4'), ('M3'), ('M5'), ('i3'), ('i5'), ('i7')
) AS m(name), car_brands b
WHERE b.name = 'BMW'
ON CONFLICT DO NOTHING;

-- ── 3. Mercedes-Benz models ───────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('C-Class'), ('E-Class'), ('S-Class'), ('GLA'), ('GLC'), ('GLE'), ('GLS'),
  ('A-Class'), ('B-Class'), ('CLA'), ('CLS'), ('AMG GT'), ('EQS'), ('EQE'), ('Maybach S-Class')
) AS m(name), car_brands b
WHERE b.name = 'Mercedes-Benz'
ON CONFLICT DO NOTHING;

-- ── 4. Audi models ────────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('A3'), ('A4'), ('A5'), ('A6'), ('A7'), ('A8'), ('Q2'), ('Q3'), ('Q5'), ('Q7'), ('Q8'),
  ('TT'), ('R8'), ('e-tron'), ('e-tron GT'), ('RS3'), ('RS6')
) AS m(name), car_brands b
WHERE b.name = 'Audi'
ON CONFLICT DO NOTHING;

-- ── 5. Volkswagen models ──────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Golf'), ('Polo'), ('Passat'), ('Tiguan'), ('Touareg'), ('Jetta'), ('Arteon'),
  ('T-Roc'), ('T-Cross'), ('ID.4'), ('ID.3'), ('Phaeton')
) AS m(name), car_brands b
WHERE b.name = 'Volkswagen'
ON CONFLICT DO NOTHING;

-- ── 6. Porsche models ─────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('911'), ('Cayenne'), ('Macan'), ('Panamera'), ('Taycan'), ('Boxster'), ('Cayman')
) AS m(name), car_brands b
WHERE b.name = 'Porsche'
ON CONFLICT DO NOTHING;

-- ── 7. Land Rover models ──────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Defender'), ('Discovery'), ('Discovery Sport'), ('Range Rover'), ('Range Rover Sport'),
  ('Range Rover Evoque'), ('Range Rover Velar'), ('Freelander')
) AS m(name), car_brands b
WHERE b.name = 'Land Rover'
ON CONFLICT DO NOTHING;

-- ── 8. Jeep models ────────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Wrangler'), ('Grand Cherokee'), ('Cherokee'), ('Renegade'), ('Compass'),
  ('Gladiator'), ('Wagoneer'), ('Grand Wagoneer')
) AS m(name), car_brands b
WHERE b.name = 'Jeep'
ON CONFLICT DO NOTHING;

-- ── 9. Ford models ────────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('F-150'), ('Ranger'), ('Explorer'), ('Mustang'), ('Edge'), ('Escape'),
  ('EcoSport'), ('Bronco'), ('Everest'), ('Transit'), ('Puma')
) AS m(name), car_brands b
WHERE b.name = 'Ford'
ON CONFLICT DO NOTHING;

-- ── 10. Chevrolet models ──────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Malibu'), ('Camaro'), ('Corvette'), ('Silverado'), ('Tahoe'), ('Suburban'),
  ('Equinox'), ('Blazer'), ('Trailblazer'), ('Trax'), ('Spark')
) AS m(name), car_brands b
WHERE b.name = 'Chevrolet'
ON CONFLICT DO NOTHING;

-- ── 11. Volvo models ──────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('S60'), ('S90'), ('V60'), ('V90'), ('XC40'), ('XC60'), ('XC90'), ('C40'), ('EX90')
) AS m(name), car_brands b
WHERE b.name = 'Volvo'
ON CONFLICT DO NOTHING;

-- ── 12. Proton models ─────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Saga'), ('X50'), ('X70'), ('Persona'), ('Iriz'), ('Exora'), ('Waja'), ('Preve')
) AS m(name), car_brands b
WHERE b.name = 'Proton'
ON CONFLICT DO NOTHING;

-- ── 13. Prince models ─────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Pearl'), ('Hero'), ('Cargo'), ('Mini Truck')
) AS m(name), car_brands b
WHERE b.name = 'Prince'
ON CONFLICT DO NOTHING;

-- ── 14. United models ─────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Bravo'), ('Alpha'), ('US-700'), ('US-800')
) AS m(name), car_brands b
WHERE b.name = 'United'
ON CONFLICT DO NOTHING;

-- ── 15. Peugeot models ────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('208'), ('308'), ('408'), ('508'), ('2008'), ('3008'), ('5008'), ('Partner')
) AS m(name), car_brands b
WHERE b.name = 'Peugeot'
ON CONFLICT DO NOTHING;

-- ── 16. Renault models ────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Clio'), ('Megane'), ('Laguna'), ('Kadjar'), ('Duster'), ('Koleos'), ('Captur'), ('Zoe')
) AS m(name), car_brands b
WHERE b.name = 'Renault'
ON CONFLICT DO NOTHING;

-- ── 17. Genesis models ────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('G70'), ('G80'), ('G90'), ('GV70'), ('GV80'), ('GV60')
) AS m(name), car_brands b
WHERE b.name = 'Genesis'
ON CONFLICT DO NOTHING;

-- ── 18. More Toyota models ────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Avanza'), ('Rush'), ('Innova Crysta'), ('GR86'), ('Supra'), ('Century'),
  ('Hiace'), ('Land Cruiser 70'), ('C-HR'), ('Cross'), ('GR Yaris'),
  ('Tundra'), ('Sequoia'), ('4Runner'), ('RAV4'), ('Camry Hybrid'), ('Alphard Z'),
  ('Townace'), ('Probox'), ('Succeed')
) AS m(name), car_brands b
WHERE b.name = 'Toyota'
ON CONFLICT DO NOTHING;

-- ── 19. More Honda models ─────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Passport'), ('Odyssey'), ('Ridgeline'), ('Insight'), ('HR-V'), ('ZR-V'),
  ('Pilot'), ('Prologue'), ('e:Ny1'), ('Civic Type R'), ('Jazz Hybrid'), ('N-One')
) AS m(name), car_brands b
WHERE b.name = 'Honda'
ON CONFLICT DO NOTHING;

-- ── 20. More Suzuki models ────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Ciaz'), ('Ertiga'), ('Dzire'), ('S-Presso'), ('Ignis'), ('XL6'), ('S-Cross'),
  ('Vitara'), ('Celerio'), ('Splash'), ('Ritz'), ('Kizashi')
) AS m(name), car_brands b
WHERE b.name = 'Suzuki'
ON CONFLICT DO NOTHING;

-- ── 21. More Kia models ───────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Cerato'), ('K5'), ('K8'), ('K9'), ('Carnival'), ('Telluride'),
  ('Soul'), ('Stinger'), ('EV6'), ('EV9'), ('Niro'), ('Sorento'), ('Mohave')
) AS m(name), car_brands b
WHERE b.name = 'Kia'
ON CONFLICT DO NOTHING;

-- ── 22. More Hyundai models ───────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('i10'), ('i20'), ('i30'), ('Ioniq'), ('Ioniq 5'), ('Ioniq 6'), ('Creta'),
  ('Venue'), ('Palisade'), ('Santa Fe'), ('Santa Cruz'), ('Kona'), ('Sonata')
) AS m(name), car_brands b
WHERE b.name = 'Hyundai'
ON CONFLICT DO NOTHING;

-- ── 23. More MG models ────────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('3'), ('5'), ('6'), ('HS'), ('RX5'), ('RX8'), ('HS Plus'), ('One'),
  ('Cyberster'), ('4'), ('Marvel R'), ('MG3 Hybrid+')
) AS m(name), car_brands b
WHERE b.name = 'MG'
ON CONFLICT DO NOTHING;

-- ── 24. More Changan models ───────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Oshan X7'), ('Uni-K'), ('Uni-V'), ('Uni-Z'), ('Deepal S7'),
  ('Hunter'), ('Kaicene F70'), ('CS15'), ('CS55 Plus')
) AS m(name), car_brands b
WHERE b.name = 'Changan'
ON CONFLICT DO NOTHING;

-- ── 25. More Haval models ─────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('H2'), ('H4'), ('H8'), ('Dargo'), ('Big Dog'), ('Shenshou'), ('M6 Plus')
) AS m(name), car_brands b
WHERE b.name = 'Haval'
ON CONFLICT DO NOTHING;

-- ── 26. More BYD models ───────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Han'), ('Tang'), ('Song Plus'), ('Song Pro'), ('Yuan Plus'), ('Destroyer 05'),
  ('Sea Lion 6'), ('Sea Lion 07'), ('e2'), ('e6'), ('Sealion'), ('Shark')
) AS m(name), car_brands b
WHERE b.name = 'BYD'
ON CONFLICT DO NOTHING;

-- ── 27. More Nissan models ────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Frontier'), ('Armada'), ('Titan'), ('Murano'), ('Rogue'), ('Sentra'), ('Versa'),
  ('Leaf'), ('Ariya'), ('Terra'), ('Navara King Cab'), ('Livina')
) AS m(name), car_brands b
WHERE b.name = 'Nissan'
ON CONFLICT DO NOTHING;

-- ── 28. More Mitsubishi models ────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Eclipse Cross'), ('Galant'), ('Sigma'), ('Attrage'), ('Mirage'), ('Xpander'),
  ('L200 Triton'), ('Strada'), ('ASX'), ('Colt'), ('Outlander PHEV')
) AS m(name), car_brands b
WHERE b.name = 'Mitsubishi'
ON CONFLICT DO NOTHING;

-- ── 29. More Chery models ─────────────────────────────────────
INSERT INTO car_models (name, brand_id, is_active)
SELECT m.name, b.id, true
FROM (VALUES
  ('Tiggo 4'), ('Tiggo 7 Pro'), ('Tiggo 8 Pro'), ('Omoda 5'), ('Omoda C5'),
  ('Arrizo 5'), ('Arrizo 6 Pro'), ('eQ7')
) AS m(name), car_brands b
WHERE b.name = 'Chery'
ON CONFLICT DO NOTHING;

-- ── 30. BMW variants ──────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('320i'),('330i'),('340i'),('M340i'),('320d')) AS v(name)
JOIN car_models m ON m.name = '3 Series'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'BMW'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('520i'),('530i'),('540i'),('M550i'),('520d'),('530d')) AS v(name)
JOIN car_models m ON m.name = '5 Series'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'BMW'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('xDrive28i'),('xDrive30i'),('xDrive40i'),('M40i')) AS v(name)
JOIN car_models m ON m.name = 'X3'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'BMW'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('xDrive40i'),('xDrive50i'),('M50i'),('xDrive45e')) AS v(name)
JOIN car_models m ON m.name = 'X5'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'BMW'
ON CONFLICT DO NOTHING;

-- ── 31. Mercedes variants ─────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('C200','C300','C43 AMG','C63 AMG','C200d')) AS v(name)
JOIN car_models m ON m.name = 'C-Class'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Mercedes-Benz'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('E200','E300','E43 AMG','E63 AMG','E200d','E300d')) AS v(name)
JOIN car_models m ON m.name = 'E-Class'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Mercedes-Benz'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('GLC200','GLC300','GLC43 AMG','GLC63 AMG','GLC300d')) AS v(name)
JOIN car_models m ON m.name = 'GLC'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Mercedes-Benz'
ON CONFLICT DO NOTHING;

-- ── 32. Toyota extra variants ─────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('G'),('XLi'),('GLi'),('Altis 1.6'),('Altis Grande'),('Cross'),('Hybrid')) AS v(name)
JOIN car_models m ON m.name = 'Corolla'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Toyota'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('1.2 G'),('1.2 E'),('1.5 V'),('1.5 S'),('Cross CVT')) AS v(name)
JOIN car_models m ON m.name = 'Yaris'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Toyota'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('2.4 G MT'),('2.4 V AT'),('2.8 GD-6 MT'),('2.8 GD-6 AT'),('4x4 Rocco')) AS v(name)
JOIN car_models m ON m.name = 'Hilux'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Toyota'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('2.0 Sigma 4'),('2.0 V4x2'),('2.7 V4x4'),('2.8 Legender'),('2.8 GR Sport')) AS v(name)
JOIN car_models m ON m.name = 'Fortuner'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Toyota'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('A'),('S'),('GR'),('Active'),('Z')) AS v(name)
JOIN car_models m ON m.name = 'Prius'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Toyota'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('GX'),('VX'),('VXR'),('ZX'),('200 Series'),('300 Series')) AS v(name)
JOIN car_models m ON m.name = 'Land Cruiser'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Toyota'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('Executive'),('Luxury'),('Luxury Executive'),('Royal Lounge')) AS v(name)
JOIN car_models m ON m.name = 'Alphard'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Toyota'
ON CONFLICT DO NOTHING;

-- ── 33. Honda extra variants ──────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('1.2 i-VTEC'),('1.5 Turbo'),('RS'),('Oriel'),('VTi'),('VTi-S'),('VTi Oriel')) AS v(name)
JOIN car_models m ON m.name = 'Civic'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Honda'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('Aspire 1.3'),('Aspire 1.5 MT'),('Aspire 1.5 AT'),('Classic'),('RS Turbo')) AS v(name)
JOIN car_models m ON m.name = 'City'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Honda'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('LX'),('EX'),('EX-L'),('Touring'),('Sport'),('Black Edition')) AS v(name)
JOIN car_models m ON m.name = 'CR-V'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Honda'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('e:HEV'),('Hybrid'),('1.5 Turbo'),('2.0 Standard')) AS v(name)
JOIN car_models m ON m.name = 'Accord'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Honda'
ON CONFLICT DO NOTHING;

-- ── 34. Suzuki extra variants ─────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('VXL AGS'),('VXL MT'),('VXR'),('VXR AGS'),('GL')) AS v(name)
JOIN car_models m ON m.name = 'Swift'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Suzuki'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('VXR'),('VXL'),('VXL AGS'),('AGS')) AS v(name)
JOIN car_models m ON m.name = 'Wagon R'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Suzuki'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('VX'),('VXR'),('VXL'),('AGS Standard'),('AGS Boosted')) AS v(name)
JOIN car_models m ON m.name = 'Alto'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Suzuki'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('GL'),('GLX'),('GLXS'),('Allgrip Pro'),('3 Door')) AS v(name)
JOIN car_models m ON m.name = 'Jimny'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Suzuki'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('GL'),('GLX AT'),('S'),('Sport Hybrid')) AS v(name)
JOIN car_models m ON m.name = 'Cultus'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Suzuki'
ON CONFLICT DO NOTHING;

-- ── 35. Kia extra variants ────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('EX MT'),('EX AT'),('GT Line'),('GT AWD')) AS v(name)
JOIN car_models m ON m.name = 'Sportage'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Kia'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('FWD'),('AWD'),('EX'),('GT Line'),('GT Line AWD')) AS v(name)
JOIN car_models m ON m.name = 'Seltos'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Kia'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('1.0 MT'),('1.0 AT'),('1.2 MT')) AS v(name)
JOIN car_models m ON m.name = 'Picanto'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Kia'
ON CONFLICT DO NOTHING;

-- ── 36. Hyundai extra variants ────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('GLS'),('GLS Sport'),('Signature'),('Ultimate'),('AWD')) AS v(name)
JOIN car_models m ON m.name = 'Tucson'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Hyundai'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('SE'),('GL'),('GLS'),('N Line'),('Sport')) AS v(name)
JOIN car_models m ON m.name = 'Elantra'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Hyundai'
ON CONFLICT DO NOTHING;

-- ── 37. MG extra variants ─────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('Comfort'),('Luxury'),('Trophy'),('Savvy'),('RS')) AS v(name)
JOIN car_models m ON m.name = 'HS'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'MG'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('Standard'),('Excite'),('Exclusive'),('Trophy EV')) AS v(name)
JOIN car_models m ON m.name = 'ZS'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'MG'
ON CONFLICT DO NOTHING;

-- ── 38. Changan extra variants ────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('1.5T MT'),('1.5T AT'),('2.0T'),('Blue Whale')) AS v(name)
JOIN car_models m ON m.name = 'CS75 Plus'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Changan'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('1.4T MT'),('1.4T AT'),('Comfort'),('Luxury')) AS v(name)
JOIN car_models m ON m.name = 'Alsvin'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Changan'
ON CONFLICT DO NOTHING;

-- ── 39. BYD extra variants ────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('Standard Range'),('Extended Range'),('AWD')) AS v(name)
JOIN car_models m ON m.name = 'Atto 3'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'BYD'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('Active'),('Comfort'),('Excellence')) AS v(name)
JOIN car_models m ON m.name = 'Dolphin'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'BYD'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('Comfort'),('Excellence'),('Ultra AWD')) AS v(name)
JOIN car_models m ON m.name = 'Seal'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'BYD'
ON CONFLICT DO NOTHING;

-- ── 40. Nissan extra variants ─────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('1.2 Acenta'),('1.5 Visia'),('1.5 Acenta'),('1.5 dCi Tekna')) AS v(name)
JOIN car_models m ON m.name = 'March'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Nissan'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('1.5 S MT'),('1.5 SV AT'),('1.5 SL AT'),('Nismo')) AS v(name)
JOIN car_models m ON m.name = 'Sunny'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Nissan'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('SV'),('SL'),('Midnight Edition'),('Rock Creek'),('Platinum')) AS v(name)
JOIN car_models m ON m.name = 'Patrol'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Nissan'
ON CONFLICT DO NOTHING;

-- ── 41. Mitsubishi extra variants ─────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('GLX'),('GLS'),('GT'),('Ralliart')) AS v(name)
JOIN car_models m ON m.name = 'Lancer'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Mitsubishi'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM (VALUES ('2.4 GL'),('3.0 GLS'),('3.5 V6'),('3.8 GLS'),('Sports Edition')) AS v(name)
JOIN car_models m ON m.name = 'Pajero'
JOIN car_brands b ON b.id = m.brand_id AND b.name = 'Mitsubishi'
ON CONFLICT DO NOTHING;
