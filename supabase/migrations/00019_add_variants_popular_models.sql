-- ============================================================
-- Variants for Toyota models
-- ============================================================

-- Toyota Corolla variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.3 GL 2019'),('1.3 GL 2020'),('1.3 GL 2021'),('1.3 GL 2022'),('1.3 GL 2023'),
  ('1.6 GLi 2019'),('1.6 GLi 2020'),('1.6 GLi 2021'),('1.6 GLi 2022'),('1.6 GLi 2023'),('1.6 GLi 2024'),
  ('1.6 XLi 2019'),('1.6 XLi 2020'),('1.6 XLi 2021'),('1.6 XLi 2022'),('1.6 XLi 2023'),('1.6 XLi 2024'),
  ('1.8 Grande 2019'),('1.8 Grande 2020'),('1.8 Grande 2021'),('1.8 Grande 2022'),('1.8 Grande 2023'),('1.8 Grande 2024'),
  ('1.8 Altis 2022'),('1.8 Altis 2023'),('1.8 Altis 2024'),
  ('2.0 Altis Grande 2022'),('2.0 Altis Grande 2023'),('2.0 Altis Grande 2024'),
  ('Hybrid 1.8 2022'),('Hybrid 1.8 2023'),('Hybrid 1.8 2024')
) AS v(name)
WHERE b.name = 'Toyota' AND m.name = 'Corolla'
ON CONFLICT DO NOTHING;

-- Toyota Camry variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.5 Standard 2020'),('2.5 Standard 2021'),('2.5 Standard 2022'),('2.5 Standard 2023'),('2.5 Standard 2024'),
  ('2.5 Grande 2020'),('2.5 Grande 2021'),('2.5 Grande 2022'),('2.5 Grande 2023'),('2.5 Grande 2024'),
  ('3.5 V6 2020'),('3.5 V6 2021'),('3.5 V6 2022'),
  ('Hybrid 2.5 2021'),('Hybrid 2.5 2022'),('Hybrid 2.5 2023'),('Hybrid 2.5 2024'),
  ('XSE V6 2022'),('XSE V6 2023'),('TRD 2022'),('TRD 2023')
) AS v(name)
WHERE b.name = 'Toyota' AND m.name = 'Camry'
ON CONFLICT DO NOTHING;

-- Toyota Hilux / Revo variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.4 Single Cab 2020'),('2.4 Single Cab 2021'),('2.4 Single Cab 2022'),('2.4 Single Cab 2023'),
  ('2.4 Extra Cab 2020'),('2.4 Extra Cab 2021'),('2.4 Extra Cab 2022'),('2.4 Extra Cab 2023'),
  ('2.4 Double Cab 2020'),('2.4 Double Cab 2021'),('2.4 Double Cab 2022'),('2.4 Double Cab 2023'),
  ('2.8 SR5 2020'),('2.8 SR5 2021'),('2.8 SR5 2022'),('2.8 SR5 2023'),('2.8 SR5 2024'),
  ('2.8 GR Sport 2022'),('2.8 GR Sport 2023'),('2.8 GR Sport 2024'),
  ('4x4 2.8 Z 2020'),('4x4 2.8 Z 2021'),('4x4 2.8 Z 2022'),('4x4 2.8 Z 2023')
) AS v(name)
WHERE b.name = 'Toyota' AND m.name = 'Hilux'
ON CONFLICT DO NOTHING;

-- Toyota Fortuner variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.7 VVTi 2019'),('2.7 VVTi 2020'),('2.7 VVTi 2021'),('2.7 VVTi 2022'),('2.7 VVTi 2023'),
  ('2.8 Diesel 2019'),('2.8 Diesel 2020'),('2.8 Diesel 2021'),('2.8 Diesel 2022'),('2.8 Diesel 2023'),
  ('2.8 Sigma 4 2020'),('2.8 Sigma 4 2021'),('2.8 Sigma 4 2022'),('2.8 Sigma 4 2023'),('2.8 Sigma 4 2024'),
  ('2.8 GR Sport 2022'),('2.8 GR Sport 2023'),('2.8 GR Sport 2024'),
  ('Legender 2.8 2022'),('Legender 2.8 2023'),('Legender 2.8 2024')
) AS v(name)
WHERE b.name = 'Toyota' AND m.name = 'Fortuner'
ON CONFLICT DO NOTHING;

-- Toyota Prius variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.8 Alpha 2018'),('1.8 Alpha 2019'),('1.8 Alpha 2020'),('1.8 Alpha 2021'),
  ('1.8 S 2019'),('1.8 S 2020'),('1.8 S 2021'),('1.8 S 2022'),
  ('1.8 A 2019'),('1.8 A 2020'),('1.8 A 2021'),('1.8 A 2022'),('1.8 A 2023'),
  ('2.0 PHV 2022'),('2.0 PHV 2023'),('2.0 PHV 2024'),
  ('1.8 G Touring 2020'),('1.8 G Touring 2021'),('1.8 G Touring 2022')
) AS v(name)
WHERE b.name = 'Toyota' AND m.name = 'Prius'
ON CONFLICT DO NOTHING;

-- Toyota Land Cruiser variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('VX 4.5 V8 2018'),('VX 4.5 V8 2019'),('VX 4.5 V8 2020'),('VX 4.5 V8 2021'),
  ('GXR 4.0 V6 2020'),('GXR 4.0 V6 2021'),('GXR 4.0 V6 2022'),('GXR 4.0 V6 2023'),
  ('ZX 3.3 Twin Turbo 2022'),('ZX 3.3 Twin Turbo 2023'),('ZX 3.3 Twin Turbo 2024'),
  ('GX-R 3.3 V6 2022'),('GX-R 3.3 V6 2023'),('GX-R 3.3 V6 2024'),
  ('VX 2020'),('VXR 2020'),('VXR 2021'),('VXR 2022')
) AS v(name)
WHERE b.name = 'Toyota' AND m.name = 'Land Cruiser'
ON CONFLICT DO NOTHING;

-- Toyota Aqua / Vitz variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.5 G 2018'),('1.5 G 2019'),('1.5 G 2020'),('1.5 G 2021'),('1.5 G 2022'),
  ('1.5 S 2019'),('1.5 S 2020'),('1.5 S 2021'),('1.5 S 2022'),('1.5 S 2023'),
  ('1.5 GR Sport 2022'),('1.5 GR Sport 2023'),
  ('1.5 Crossover 2022'),('1.5 Crossover 2023'),
  ('1.5 Z 2022'),('1.5 Z 2023'),('1.5 Z 2024')
) AS v(name)
WHERE b.name = 'Toyota' AND m.name = 'Aqua'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Honda models
-- ============================================================

-- Honda Civic variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.5 RS Turbo 2020'),('1.5 RS Turbo 2021'),('1.5 RS Turbo 2022'),('1.5 RS Turbo 2023'),('1.5 RS Turbo 2024'),
  ('1.5 Oriel Turbo 2021'),('1.5 Oriel Turbo 2022'),('1.5 Oriel Turbo 2023'),
  ('1.8 Oriel 2019'),('1.8 Oriel 2020'),('1.8 Oriel 2021'),
  ('1.8 VTi 2019'),('1.8 VTi 2020'),('1.8 VTi Prosmatec 2020'),('1.8 VTi Prosmatec 2021'),
  ('1.5 EXi 2022'),('1.5 EXi 2023'),('1.5 EXi 2024'),
  ('Type R 2023'),('Type R 2024'),
  ('1.5 Sport 2022'),('1.5 Sport 2023'),('1.5 Sport 2024')
) AS v(name)
WHERE b.name = 'Honda' AND m.name = 'Civic'
ON CONFLICT DO NOTHING;

-- Honda City variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.2 Aspire 2020'),('1.2 Aspire 2021'),('1.2 Aspire 2022'),('1.2 Aspire 2023'),('1.2 Aspire 2024'),
  ('1.2 Standard 2020'),('1.2 Standard 2021'),('1.2 Standard 2022'),('1.2 Standard 2023'),
  ('1.5 RS Turbo 2022'),('1.5 RS Turbo 2023'),('1.5 RS Turbo 2024'),
  ('1.5 e:HEV Hybrid 2022'),('1.5 e:HEV Hybrid 2023'),('1.5 e:HEV Hybrid 2024'),
  ('1.3 i-VTEC 2019'),('1.3 i-VTEC 2020'),('1.5 VTEC Plus 2020'),('1.5 VTEC Plus 2021')
) AS v(name)
WHERE b.name = 'Honda' AND m.name = 'City'
ON CONFLICT DO NOTHING;

-- Honda BR-V variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.5 S MT 2022'),('1.5 S AT 2022'),('1.5 V AT 2022'),('1.5 V Sensing 2022'),
  ('1.5 S MT 2023'),('1.5 S AT 2023'),('1.5 V AT 2023'),('1.5 V Sensing 2023'),
  ('1.5 S MT 2024'),('1.5 V AT 2024'),
  ('1.5 i-VTEC 2019'),('1.5 i-VTEC 2020'),('1.5 i-VTEC S 2020'),('1.5 i-VTEC V 2021')
) AS v(name)
WHERE b.name = 'Honda' AND m.name = 'BR-V'
ON CONFLICT DO NOTHING;

-- Honda HR-V / Vezel variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.5 G 2018'),('1.5 G 2019'),('1.5 G 2020'),('1.5 G 2021'),('1.5 G 2022'),
  ('1.5 Z 2021'),('1.5 Z 2022'),('1.5 Z 2023'),('1.5 Z 2024'),
  ('1.5 e:HEV RS 2021'),('1.5 e:HEV RS 2022'),('1.5 e:HEV RS 2023'),('1.5 e:HEV RS 2024'),
  ('Hybrid G 2021'),('Hybrid Z 2021'),('Hybrid Z 2022'),('Hybrid Z 2023')
) AS v(name)
WHERE b.name = 'Honda' AND m.name = 'Vezel'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Nissan models
-- ============================================================

-- Nissan Sunny variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.3 EX Saloon 2018'),('1.3 EX Saloon 2019'),('1.3 EX Saloon 2020'),('1.3 EX Saloon 2021'),
  ('1.5 EX Saloon 2018'),('1.5 EX Saloon 2019'),('1.5 EX Saloon 2020'),('1.5 EX Saloon 2021'),
  ('1.5 SE Saloon 2020'),('1.5 SE Saloon 2021'),('1.5 SE Saloon 2022'),
  ('1.6 S 2020'),('1.6 S 2021'),('1.6 SV 2020'),('1.6 SV 2021'),('1.6 SL 2021')
) AS v(name)
WHERE b.name = 'Nissan' AND m.name = 'Sunny'
ON CONFLICT DO NOTHING;

-- Nissan X-Trail variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.0 S 2WD 2020'),('2.0 SE 2WD 2020'),('2.0 SE 4WD 2020'),
  ('2.5 Platinum 2021'),('2.5 Platinum 2022'),('2.5 Platinum 2023'),
  ('1.5 e-Power 2023'),('1.5 e-Power 2024'),
  ('2.0 ST 2019'),('2.5 SL 2022'),('2.5 SL 2023'),('Ti 2.5 AWD 2022')
) AS v(name)
WHERE b.name = 'Nissan' AND m.name = 'X-Trail'
ON CONFLICT DO NOTHING;

-- Nissan GT-R variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('3.8 V6 Premium 2017'),('3.8 V6 Premium 2018'),('3.8 V6 Premium 2019'),('3.8 V6 Premium 2020'),
  ('3.8 Track Edition 2019'),('3.8 Track Edition 2020'),('3.8 Track Edition 2022'),
  ('3.8 NISMO 2020'),('3.8 NISMO 2022'),('3.8 NISMO 2023'),
  ('3.8 Black Edition 2017'),('3.8 Black Edition 2018')
) AS v(name)
WHERE b.name = 'Nissan' AND m.name = 'GT-R'
ON CONFLICT DO NOTHING;

-- Nissan Patrol variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('4.8 GX 2019'),('4.8 GX 2020'),('4.8 GX 2021'),
  ('4.0 SE 2020'),('4.0 SE 2021'),('4.0 SE 2022'),('4.0 SE 2023'),
  ('5.6 V8 Platinum 2020'),('5.6 V8 Platinum 2021'),('5.6 V8 Platinum 2022'),('5.6 V8 Platinum 2023'),
  ('4.0 Titanium 2022'),('4.0 Titanium 2023'),('4.0 Titanium 2024'),
  ('NISMO 5.6 V8 2020'),('NISMO 5.6 V8 2022')
) AS v(name)
WHERE b.name = 'Nissan' AND m.name = 'Patrol'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Mitsubishi models
-- ============================================================

-- Mitsubishi Pajero variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('3.5 GLS 2018'),('3.5 GLS 2019'),('3.5 GLS 2020'),('3.5 GLS 2021'),
  ('3.2 Diesel GLS 2019'),('3.2 Diesel GLS 2020'),('3.2 Diesel GLS 2021'),
  ('3.0 GLS Short Body 2019'),('3.0 GLS Short Body 2020'),
  ('3.5 V6 Exceed 2020'),('3.5 V6 Exceed 2021'),('3.5 V6 Exceed 2022'),
  ('2.4 GLS AT 2019'),('2.4 GLS AT 2020'),('3.2 DI-D Dakar 2021')
) AS v(name)
WHERE b.name = 'Mitsubishi' AND m.name = 'Pajero'
ON CONFLICT DO NOTHING;

-- Mitsubishi Outlander variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.0 GLX 2019'),('2.0 GLS 2019'),('2.4 GLS 2020'),
  ('2.5 GLX 2WD 2021'),('2.5 GLS 4WD 2021'),('2.5 GLS 4WD 2022'),
  ('PHEV 2.4 2021'),('PHEV 2.4 2022'),('PHEV 2.4 2023'),('PHEV 2.4 2024'),
  ('2.5 SE AWC 2022'),('2.5 SE AWC 2023'),('2.5 SEL AWC 2023')
) AS v(name)
WHERE b.name = 'Mitsubishi' AND m.name = 'Outlander'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Suzuki models
-- ============================================================

-- Suzuki Alto variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('VX 2019'),('VX 2020'),('VX 2021'),('VX 2022'),('VX 2023'),('VX 2024'),
  ('VXR 2019'),('VXR 2020'),('VXR 2021'),('VXR 2022'),('VXR 2023'),('VXR 2024'),
  ('VXL 2019'),('VXL 2020'),('VXL 2021'),('VXL 2022'),('VXL 2023'),('VXL 2024'),
  ('AGS VXR 2020'),('AGS VXR 2021'),('AGS VXR 2022'),('AGS VXR 2023'),
  ('AGS VXL 2020'),('AGS VXL 2021'),('AGS VXL 2022'),('AGS VXL 2023'),('AGS VXL 2024')
) AS v(name)
WHERE b.name = 'Suzuki' AND m.name = 'Alto'
ON CONFLICT DO NOTHING;

-- Suzuki Swift variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.3 GL 2019'),('1.3 GL 2020'),('1.3 GL 2021'),
  ('1.3 GLX 2019'),('1.3 GLX 2020'),('1.3 GLX 2021'),('1.3 GLX 2022'),
  ('1.2 GL CVT 2022'),('1.2 GL CVT 2023'),('1.2 GL CVT 2024'),
  ('1.2 GLX CVT 2022'),('1.2 GLX CVT 2023'),('1.2 GLX CVT 2024'),
  ('1.4 Sport Turbo 2022'),('1.4 Sport Turbo 2023'),('1.4 Sport Turbo 2024'),
  ('Hybrid 1.2 2022'),('Hybrid 1.2 2023'),('Hybrid 1.2 2024'),
  ('1.2 ALLGRIP 2023'),('1.2 ALLGRIP 2024')
) AS v(name)
WHERE b.name = 'Suzuki' AND m.name = 'Swift'
ON CONFLICT DO NOTHING;

-- Suzuki Cultus variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('VXR 2019'),('VXR 2020'),('VXR 2021'),('VXR 2022'),('VXR 2023'),('VXR 2024'),
  ('VXL 2019'),('VXL 2020'),('VXL 2021'),('VXL 2022'),('VXL 2023'),('VXL 2024'),
  ('AGS VXR 2020'),('AGS VXR 2021'),('AGS VXR 2022'),('AGS VXR 2023'),
  ('AGS VXL 2020'),('AGS VXL 2021'),('AGS VXL 2022'),('AGS VXL 2023')
) AS v(name)
WHERE b.name = 'Suzuki' AND m.name = 'Cultus'
ON CONFLICT DO NOTHING;

-- Suzuki Wagon R variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('VXR 2019'),('VXR 2020'),('VXR 2021'),('VXR 2022'),('VXR 2023'),('VXR 2024'),
  ('VXL 2019'),('VXL 2020'),('VXL 2021'),('VXL 2022'),('VXL 2023'),('VXL 2024'),
  ('AGS VXR 2020'),('AGS VXR 2021'),('AGS VXR 2022'),('AGS VXR 2023'),
  ('AGS VXL 2020'),('AGS VXL 2021'),('AGS VXL 2022'),('AGS VXL 2023'),('AGS VXL 2024'),
  ('Stingray T Turbo 2021'),('Stingray T Turbo 2022'),('Stingray T Turbo 2023')
) AS v(name)
WHERE b.name = 'Suzuki' AND m.name = 'Wagon R'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Lexus models
-- ============================================================

-- Lexus ES variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('ES 250 Base 2019'),('ES 250 Ultra Luxury 2019'),('ES 250 Base 2020'),('ES 250 Ultra Luxury 2020'),
  ('ES 300h Hybrid 2020'),('ES 300h Hybrid 2021'),('ES 300h Hybrid 2022'),('ES 300h Hybrid 2023'),('ES 300h Hybrid 2024'),
  ('ES 300h Luxury 2022'),('ES 300h Luxury 2023'),('ES 300h Luxury 2024'),
  ('ES 350 F Sport 2021'),('ES 350 F Sport 2022'),('ES 350 F Sport 2023'),
  ('ES 250 Black Line 2022'),('ES 250 Black Line 2023')
) AS v(name)
WHERE b.name = 'Lexus' AND m.name = 'ES'
ON CONFLICT DO NOTHING;

-- Lexus LX variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('LX 570 Base 2018'),('LX 570 Base 2019'),('LX 570 Base 2020'),('LX 570 Base 2021'),
  ('LX 570 Black Edition 2020'),('LX 570 Black Edition 2021'),
  ('LX 600 Ultra Luxury 2022'),('LX 600 Ultra Luxury 2023'),('LX 600 Ultra Luxury 2024'),
  ('LX 600 F Sport 2022'),('LX 600 F Sport 2023'),('LX 600 F Sport 2024'),
  ('LX 600 Overtrail 2023'),('LX 600 Overtrail 2024')
) AS v(name)
WHERE b.name = 'Lexus' AND m.name = 'LX'
ON CONFLICT DO NOTHING;

-- Lexus RX variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('RX 300 Base 2019'),('RX 300 Luxury 2019'),('RX 350 F Sport 2020'),
  ('RX 350h Hybrid 2023'),('RX 350h Hybrid 2024'),('RX 500h F Sport 2023'),('RX 500h F Sport 2024'),
  ('RX 450h Luxury 2021'),('RX 450h Luxury 2022'),('RX 450h F Sport 2021'),('RX 450h F Sport 2022')
) AS v(name)
WHERE b.name = 'Lexus' AND m.name = 'RX'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Infiniti models
-- ============================================================
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.0t Pure 2017'),('2.0t Luxe 2018'),('2.0t Sport 2019'),('3.0t Red Sport 400 2020'),
  ('3.0t Red Sport 400 2021'),('3.0t Sensory 2022'),('2.0t 2023')
) AS v(name)
WHERE b.name = 'Infiniti' AND m.name = 'Q50'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('3.5 Hybrid 2017'),('3.5 Hybrid 2018'),('3.5 Hybrid 2019'),('3.5 Hybrid 2020'),
  ('2.0t Pure 2018'),('2.0t Luxe 2019'),('2.0t 2020')
) AS v(name)
WHERE b.name = 'Infiniti' AND m.name = 'Q70'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('5.6 Base 2018'),('5.6 Luxe 2019'),('5.6 Luxe 2020'),('5.6 Luxe 2021'),('5.6 Luxe 2022'),
  ('5.6 Sensory 2020'),('5.6 Sensory 2021'),('5.6 Sensory 2022'),('5.6 Sensory 2023'),
  ('5.6 Pro 4x 2021'),('5.6 Pro 4x 2022'),('5.6 Pro 4x 2023')
) AS v(name)
WHERE b.name = 'Infiniti' AND m.name = 'QX80'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Acura models
-- ============================================================
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('3.7 Base 2016'),('3.7 Advance 2017'),('3.7 SH-AWD Elite 2017'),('3.7 SH-AWD 2018'),
  ('Hybrid SH-AWD 2018'),('3.5 Base 2022'),('3.5 A-Spec 2022'),('3.5 A-Spec SH-AWD 2023')
) AS v(name)
WHERE b.name = 'Acura' AND m.name = 'MDX'
ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.0t Base 2019'),('2.0t A-Spec 2020'),('2.5 Hybrid 2021'),('2.5 Hybrid A-Spec 2022'),
  ('2.5 Hybrid 2023'),('2.5 Hybrid A-Spec SH-AWD 2023'),('2.5 A-Spec SH-AWD 2024')
) AS v(name)
WHERE b.name = 'Acura' AND m.name = 'RDX'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Changan Alsvin/CS75
-- ============================================================
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.5 MT Comfort 2021'),('1.5 MT Lumiere 2021'),('1.5 AT Lumiere 2021'),('1.5 AT Lumiere 2022'),
  ('1.5 MT Comfort 2022'),('1.5 MT Lumiere 2022'),('1.5 AT Lumiere 2022'),
  ('1.5 MT Comfort 2023'),('1.5 MT Lumiere 2023'),('1.5 AT Lumiere 2023'),('1.5 AT Lumiere 2024')
) AS v(name)
WHERE b.name = 'Changan' AND m.name = 'Alsvin'
ON CONFLICT DO NOTHING;

-- ============================================================
-- Variants for Hyundai Tucson
-- ============================================================
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('1.6 Smart 2021'),('2.0 GLS 2021'),('2.0 Executive 2021'),
  ('1.6 Smart 2022'),('2.0 GLS 2022'),('2.0 Executive 2022'),
  ('1.6T Smart 2023'),('2.0 GLS 2023'),('2.0 Executive 2023'),('2.0 Ultimate 2023'),
  ('1.6T Smart 2024'),('2.0 GLS 2024'),('2.0 Executive 2024'),('2.0 Ultimate 2024'),
  ('1.6 Hybrid Smart 2022'),('1.6 Hybrid Executive 2023'),('1.6 PHEV 2023')
) AS v(name)
WHERE b.name = 'Hyundai' AND m.name = 'Tucson'
ON CONFLICT DO NOTHING;

-- Kia Sportage variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.0 Alpha MT 2021'),('2.0 FWD AT 2021'),('2.0 AWD AT 2021'),
  ('2.0 Alpha MT 2022'),('2.0 FWD AT 2022'),('2.0 AWD AT 2022'),
  ('1.6T GT-Line 2023'),('1.6T EX AWD 2023'),('1.6T SX AWD 2023'),
  ('1.6T GT-Line 2024'),('1.6T EX AWD 2024'),('1.6T SX AWD 2024'),
  ('Hybrid 1.6T 2023'),('Hybrid 1.6T 2024'),('PHEV 1.6T 2023')
) AS v(name)
WHERE b.name = 'Kia' AND m.name = 'Sportage'
ON CONFLICT DO NOTHING;

-- Mazda CX-5 variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.0 Core FWD 2020'),('2.5 Elite AWD 2020'),('2.5 Signature AWD 2020'),
  ('2.0 Core FWD 2021'),('2.5 Elite AWD 2021'),('2.5 Signature AWD 2021'),
  ('2.5 S AWD 2022'),('2.5 S Preferred AWD 2022'),('2.5 Turbo AWD 2022'),
  ('2.5 S 2023'),('2.5 S Premium 2023'),('2.5 Turbo 2023'),('2.5 Turbo 2024'),
  ('2.2 Diesel AWD 2021'),('2.2 Diesel AWD 2022')
) AS v(name)
WHERE b.name = 'Mazda' AND m.name = 'CX-5'
ON CONFLICT DO NOTHING;

-- Subaru Forester variants
INSERT INTO car_variants (name, model_id, is_active)
SELECT v.name, m.id, true
FROM car_models m
JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN (VALUES
  ('2.0i Base 2019'),('2.5i Premium 2020'),('2.5i Sport 2021'),
  ('2.5i Touring 2021'),('2.5i Touring 2022'),('2.5i Limited 2022'),
  ('2.5i Premium 2023'),('2.5i Sport 2023'),('2.5i Touring 2023'),('2.5i Limited 2023'),
  ('e-Boxer Hybrid 2020'),('e-Boxer Hybrid 2021'),('e-Boxer Hybrid 2022'),
  ('2.5i 2024'),('2.5i Touring 2024')
) AS v(name)
WHERE b.name = 'Subaru' AND m.name = 'Forester'
ON CONFLICT DO NOTHING;