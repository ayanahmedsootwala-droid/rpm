-- ── Toyota Corolla ──────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 GL MT','1.3 GL AT','1.6 XLi MT','1.6 XLi AT','1.6 GLi MT','1.6 GLi AT',
  '1.8 Grande MT','1.8 Grande AT','1.8 Altis MT','1.8 Altis AT',
  '2.0 Altis Grande CVT','1.8 Hybrid','2.0 X Special Edition',
  '1.6 SE Saloon','1.3 SE Saloon','1.6 SE Limited'
]) AS v WHERE b.name='Toyota' AND m.name='Corolla' ON CONFLICT DO NOTHING;

-- ── Toyota Camry ─────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 G AT','2.5 S AT','2.5 G AT','2.5 Grande','3.5 V6 XSE',
  '2.5 Hybrid G','2.5 Hybrid S','2.5 Hybrid Grande','2.5 WS Hybrid','TRD V6'
]) AS v WHERE b.name='Toyota' AND m.name='Camry' ON CONFLICT DO NOTHING;

-- ── Toyota Land Cruiser ──────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'GX 4.0 V6','GXR 4.0 V6','VX 4.5 V8','VXR 4.5 V8','VXS 5.7 V8',
  'ZX 3.3 Twin Turbo','GR Sport 3.3','ZX Full Option',
  '70 Series 4.2 Diesel','200 Series VX','300 Series GX-R'
]) AS v WHERE b.name='Toyota' AND m.name='Land Cruiser' ON CONFLICT DO NOTHING;

-- ── Toyota Fortuner ──────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.7 VVTi MT','2.7 VVTi AT','2.8 Diesel MT','2.8 Diesel AT',
  '2.8 Sigma 4 AT','2.8 Sigma 4 4x4','2.8 GR Sport','Legender 2.8 4x4'
]) AS v WHERE b.name='Toyota' AND m.name='Fortuner' ON CONFLICT DO NOTHING;

-- ── Toyota Hilux / Revo ──────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.4 Single Cab MT','2.4 Extra Cab MT','2.4 Double Cab MT','2.4 Double Cab AT',
  '2.8 SR5 MT','2.8 SR5 AT','2.8 GR Sport MT','2.8 GR Sport AT','2.8 Z AT 4x4',
  '4.0 V6 TRD','2.7 S MT','2.7 E AT'
]) AS v WHERE b.name='Toyota' AND m.name='Hilux' ON CONFLICT DO NOTHING;

-- ── Toyota Prius ─────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.8 S','1.8 A','1.8 G','1.8 Alpha','1.8 G Touring',
  '1.8 E','2.0 Z','2.0 PHV','2.0 U','1.8 S Touring'
]) AS v WHERE b.name='Toyota' AND m.name='Prius' ON CONFLICT DO NOTHING;

-- ── Toyota Aqua ──────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 S','1.5 G','1.5 Z','1.5 GR Sport','1.5 Crossover','1.5 X','1.5 GX'
]) AS v WHERE b.name='Toyota' AND m.name='Aqua' ON CONFLICT DO NOTHING;

-- ── Toyota Yaris / Vitz ───────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.0 E MT','1.0 J MT','1.3 G MT','1.3 G AT','1.5 S MT','1.5 S AT',
  '1.5 Ativ MT','1.5 Ativ AT','1.5 Sport AT'
]) AS v WHERE b.name='Toyota' AND m.name='Yaris' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.0 F','1.3 F','1.3 G','1.5 RS','1.0 U','1.3 U','1.5 GR Sport'
]) AS v WHERE b.name='Toyota' AND m.name='Vitz' ON CONFLICT DO NOTHING;

-- ── Toyota Prado ──────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.7 GX AT','2.7 TX AT','4.0 VX AT','4.0 TZ-G AT','2.8 GDJ TX',
  '2.8 GDJ VX','4.0 TXL','3.0 GX Diesel','2.7 TX-L AT'
]) AS v WHERE b.name='Toyota' AND m.name='Prado' ON CONFLICT DO NOTHING;

-- ── Toyota Alphard / Vellfire ─────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.5 G','2.5 S','2.5 SC','3.5 Executive Lounge','2.5 Hybrid G','2.5 Hybrid SR',
  '3.5 Hybrid Executive Lounge','3.5 Hybrid E4'
]) AS v WHERE b.name='Toyota' AND m.name='Alphard' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.5 Z','2.5 V','2.5 ZA','2.5 Hybrid V','2.5 Hybrid ZR','3.5 ZR G-Edition'
]) AS v WHERE b.name='Toyota' AND m.name='Vellfire' ON CONFLICT DO NOTHING;

-- ── Toyota Harrier ─────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 G','2.0 Z','2.0 S','2.5 Hybrid G','2.5 Hybrid Z','2.5 Hybrid GF',
  '2.0 Z Leather Package','2.0 Turbo Z'
]) AS v WHERE b.name='Toyota' AND m.name='Harrier' ON CONFLICT DO NOTHING;

-- ── Toyota CHR ─────────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.2 G Turbo','1.2 S Turbo','1.8 Hybrid G','1.8 Hybrid GR Sport',
  '2.0 Hybrid GR Sport','1.2 S-T','2.0 Z'
]) AS v WHERE b.name='Toyota' AND m.name='Chr' ON CONFLICT DO NOTHING;

-- ── Toyota Noah / Voxy ─────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 X MT','2.0 G MT','2.0 G AT','2.0 ZS AT','1.8 Hybrid X','1.8 Hybrid ZS'
]) AS v WHERE b.name='Toyota' AND m.name='Noah' ON CONFLICT DO NOTHING;

-- ── Honda Civic ────────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 EXi MT','1.5 EXi CVT','1.5 RS Turbo CVT','1.5 Oriel Turbo CVT',
  '1.8 VTi MT','1.8 VTi AT','1.8 VTi Prosmatec','1.8 Oriel MT','1.8 Oriel AT',
  '2.0 Sport','Type R 2.0 Turbo','1.5 Sport Hatchback','1.5 e:HEV'
]) AS v WHERE b.name='Honda' AND m.name='Civic' ON CONFLICT DO NOTHING;

-- ── Honda City ─────────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.2 Standard MT','1.2 Aspire CVT','1.3 i-VTEC MT','1.3 i-VTEC AT',
  '1.5 VTEC Plus MT','1.5 VTEC Plus AT','1.5 RS Turbo CVT','1.5 e:HEV Hybrid'
]) AS v WHERE b.name='Honda' AND m.name='City' ON CONFLICT DO NOTHING;

-- ── Honda BR-V ─────────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 S MT','1.5 S AT','1.5 V AT','1.5 V Sensing AT',
  '1.5 i-VTEC S MT','1.5 i-VTEC V AT'
]) AS v WHERE b.name='Honda' AND m.name='BR-V' ON CONFLICT DO NOTHING;

-- ── Honda HR-V / Vezel ─────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 G MT','1.5 G AT','1.5 Z AT','1.5 RS AT',
  'Hybrid G','Hybrid Z','Hybrid RS','e:HEV RS Z','e:HEV Z'
]) AS v WHERE b.name='Honda' AND m.name='Vezel' ON CONFLICT DO NOTHING;

-- ── Honda Accord ───────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.4 MT','2.4 AT','2.0 Sport','2.0 Touring','2.4 VTi MT','2.4 VTi AT',
  '1.5 Turbo Sport','1.5 Turbo Touring','2.0 e:HEV Hybrid','3.5 V6 Touring'
]) AS v WHERE b.name='Honda' AND m.name='Accord' ON CONFLICT DO NOTHING;

-- ── Honda CR-V ─────────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 MT','2.0 AT','1.5 Turbo EX','1.5 Turbo EX-L','1.5 Turbo Sport',
  '2.0 e:HEV Hybrid','2.0 Hybrid S','2.0 Hybrid ZS','2.0 PHEV Advance'
]) AS v WHERE b.name='Honda' AND m.name='CR-V' ON CONFLICT DO NOTHING;

-- ── Honda Fit / Jazz ───────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 G MT','1.3 G AT','1.5 RS MT','1.5 RS AT','1.5 Hybrid Basic',
  '1.5 Hybrid S','1.5 Hybrid L','1.5 Hybrid Ness','1.5 Crosstar Hybrid'
]) AS v WHERE b.name='Honda' AND m.name='Fit' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 VTi MT','1.3 VTi AT','1.5 V MT','1.5 V AT','RS Hybrid','Mugen RS'
]) AS v WHERE b.name='Honda' AND m.name='Jazz' ON CONFLICT DO NOTHING;

-- ── Honda N-Box ────────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'G MT','G AT','G L AT','Custom G AT','Custom G L Turbo','Custom EX Turbo','JOY Plus Turbo'
]) AS v WHERE b.name='Honda' AND m.name='N-Box' ON CONFLICT DO NOTHING;

-- ── Honda Freed ───────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 B MT','1.5 G AT','1.5 Hybrid G','1.5 Hybrid B','Crosstar Hybrid B','Crosstar Hybrid G'
]) AS v WHERE b.name='Honda' AND m.name='Freed' ON CONFLICT DO NOTHING;

-- ── Daihatsu Mira / Cuore ────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 L MT','660 X MT','660 X SA III AT','660 RS SA III AT',
  '660 ES MT','660 GII MT','660 GII SA AT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Mira' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '850 EFi MT','850 EFi AT','1000 CX MT','1000 CX AT','1000 SX AT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Cuore' ON CONFLICT DO NOTHING;

-- ── Daihatsu Move / Cast / Tanto ──────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 L MT','660 X SA III AT','660 Custom RS SA III AT','660 Custom G SA III AT',
  '660 LA MT','660 Canbus MT','660 Custom Hybrid X'
]) AS v WHERE b.name='Daihatsu' AND m.name='Move' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 X SA III MT','660 X SA III AT','660 Activa G SA III AT','660 Style G SA III AT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Cast' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 G SA III AT','660 Custom G SA III AT','660 L SA III MT',
  '660 Custom RS SA III Turbo','660 X SA III MT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Tanto' ON CONFLICT DO NOTHING;

-- ── Daihatsu Rocky / Terios / Boon ───────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.0 Turbo G AT','1.2 L AT','1.2 G AT','1.0 Turbo Premium Hybrid','1.2 Premium AT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Rocky' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 CX MT','1.5 CX AT','1.5 CX Sport','1.5 Wild AT','1.5 4x4 AT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Terios' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.0 L MT','1.0 G MT','1.0 G AT','1.0 Silk MT','1.0 Silk AT','1.3 TI AT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Boon' ON CONFLICT DO NOTHING;

-- ── Daihatsu Hijet / Wake / Gran Max ─────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 Standard MT','660 Deluxe MT','660 Cargo MT','660 Cargo AT','660 Jumbo AT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Hijet' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 G SA III AT','660 G Turbo SA III','660 X SA III MT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Wake' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 D MT','1.5 D MT','1.5 G MT','1.5 G AT','1.5 STD MT'
]) AS v WHERE b.name='Daihatsu' AND m.name='Gran Max' ON CONFLICT DO NOTHING;

-- ── Suzuki Alto ──────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'VX MT','VXR MT','VXL MT','AGS VXR','AGS VXL',
  '660 L MT','660 G MT','660 Works Turbo RS',
  'Alto 10th Gen MT','Alto 10th Gen CVT'
]) AS v WHERE b.name='Suzuki' AND m.name='Alto' ON CONFLICT DO NOTHING;

-- ── Suzuki Swift ─────────────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 GL MT','1.3 GLX MT','1.2 GL CVT','1.2 GLX CVT',
  '1.4 Turbo Sport MT','Hybrid GL CVT','Hybrid GLX CVT','ALLGRIP 4x4'
]) AS v WHERE b.name='Suzuki' AND m.name='Swift' ON CONFLICT DO NOTHING;

-- ── Suzuki Cultus / Wagon R / Baleno ─────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'VXR MT','VXL MT','AGS VXR','AGS VXL'
]) AS v WHERE b.name='Suzuki' AND m.name='Cultus' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'VXR MT','VXL MT','AGS VXR','AGS VXL','Stingray Turbo T','Hybrid VXR','Hybrid VXL'
]) AS v WHERE b.name='Suzuki' AND m.name='Wagon R' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.2 GL MT','1.2 GL AT','1.2 Alpha MT','1.2 Alpha AT','1.2 Zeta AT',
  '1.2 Delta AT','1.4 RS Turbo AT','1.4 Hybrid Alpha'
]) AS v WHERE b.name='Suzuki' AND m.name='Baleno' ON CONFLICT DO NOTHING;

-- ── Suzuki Jimny / Grand Vitara / Fronx ──────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 XG MT','660 XL AT','660 XC AT 4x4','1.5 XL MT 4x4','1.5 XC AT 4x4','Heritage Edition'
]) AS v WHERE b.name='Suzuki' AND m.name='Jimny' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 GL MT','1.5 GL AT','1.5 GLX AT','1.5 Alpha MT Hybrid','1.5 Zeta AT Hybrid',
  '1.5 Sigma AT 4WD','2.4 ZXI AT 4x4'
]) AS v WHERE b.name='Suzuki' AND m.name='Grand Vitara' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.2 GL AT','1.2 GLX AT','1.4 Turbo Alpha AT','1.4 Turbo Zeta AT Hybrid'
]) AS v WHERE b.name='Suzuki' AND m.name='Fronx' ON CONFLICT DO NOTHING;

-- ── Nissan Sunny / Note / March ───────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 EX Saloon MT','1.5 EX Saloon MT','1.5 SE Saloon MT','1.5 SE AT',
  '1.6 S MT','1.6 SV AT','1.6 SL AT'
]) AS v WHERE b.name='Nissan' AND m.name='Sunny' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.2 E MT','1.2 S MT','1.5 Nismo S AT','e-Power S','e-Power X','e-Power Autech'
]) AS v WHERE b.name='Nissan' AND m.name='Note' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '660 S MT','660 X MT','660 G MT','660 Nismo MT','1.2 S MT','1.2 G MT','1.2 SR AT'
]) AS v WHERE b.name='Nissan' AND m.name='March' ON CONFLICT DO NOTHING;

-- ── Nissan X-Trail / Kicks / Juke ───────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 S 2WD AT','2.0 SE 4WD AT','2.5 SL AWD AT','1.5 e-Power 2WD','1.5 e-Power 4WD',
  '2.5 Platinum AWD','2.5 Ti AWD'
]) AS v WHERE b.name='Nissan' AND m.name='X-Trail' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 S AT','1.5 SV AT','1.6 RS Turbo AT','e-Power X','e-Power B','e-Power Nismo'
]) AS v WHERE b.name='Nissan' AND m.name='Kicks' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.6 S AT','1.6 SV AT','1.6 SL AT','1.0 Turbo N-Sport AT','1.3 Hybrid N-Sport'
]) AS v WHERE b.name='Nissan' AND m.name='Juke' ON CONFLICT DO NOTHING;

-- ── Nissan Navara / Patrol ───────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.5 S MT','2.5 SL MT 4x4','2.3 ST MT','2.3 Titanium AT 4x4','VL Black Series AT 4x4'
]) AS v WHERE b.name='Nissan' AND m.name='Navara' ON CONFLICT DO NOTHING;

-- ── Mitsubishi Pajero / Outlander / Lancer ───────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '3.0 GLS SWB AT','3.5 GLS LWB AT','3.2 DI-D GLS LWB','3.5 V6 Exceed AT',
  '2.4 GLS AT','3.2 DI-D Dakar','3.5 Final Edition'
]) AS v WHERE b.name='Mitsubishi' AND m.name='Pajero' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 GLX FWD MT','2.5 GLS AWD AT','PHEV 2.4 S AWC','PHEV 2.4 SE AWC',
  '2.5 SE AWC AT','2.5 SEL AWC AT','1.3 Turbo MIVEC MT'
]) AS v WHERE b.name='Mitsubishi' AND m.name='Outlander' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3 GLX MT','1.6 GLX AT','1.8 Exceed AT','2.0 Evolution X','1.5 MIVEC GT','2.0 Ralliart'
]) AS v WHERE b.name='Mitsubishi' AND m.name='Lancer' ON CONFLICT DO NOTHING;

-- ── Mazda CX-5 / CX-30 / Mazda3 ─────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 Core FWD AT','2.5 Elite AWD AT','2.5 Signature AWD AT',
  '2.5 Turbo AWD AT','2.2 Diesel AWD AT','2.5 S Carbon Edition AWD'
]) AS v WHERE b.name='Mazda' AND m.name='CX-5' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 S AT','2.0 X AT','2.0 Touring AT','2.0 GX FWD AT','2.0 Turbo AWD'
]) AS v WHERE b.name='Mazda' AND m.name='CX-30' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 Pure MT','2.0 Touring AT','2.0 Premium AT','2.5 Carbon Turbo AWD','Fastback 2.5 AT'
]) AS v WHERE b.name='Mazda' AND m.name='Mazda3' ON CONFLICT DO NOTHING;

-- ── Subaru Forester / Outback / XV / WRX ─────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.5i Premium CVT','2.5i Sport CVT','2.5i Touring CVT','2.5i Limited CVT',
  'e-Boxer Hybrid 2.0i-L','e-Boxer Hybrid 2.0i-S','2.0T STI Sport'
]) AS v WHERE b.name='Subaru' AND m.name='Forester' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.5i Premium CVT','2.5i Touring CVT','2.5i Limited CVT','2.5i Wilderness CVT','3.6R Touring CVT'
]) AS v WHERE b.name='Subaru' AND m.name='Outback' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0i Lineartronic CVT','2.0i-S EyeSight CVT','2.0 i-L EyeSight','e-Boxer Hybrid 2.0'
]) AS v WHERE b.name='Subaru' AND m.name='XV' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.4 GT MT','2.4 GT CVT','2.4 GT-S CVT','2.4 VB MT','STI S209','WRX 2.4 TR MT'
]) AS v WHERE b.name='Subaru' AND m.name='WRX' ON CONFLICT DO NOTHING;

-- ── Lexus ES / RX / LX / NX ─────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'ES 250 Base','ES 250 Luxury','ES 300h Hybrid','ES 300h Luxury',
  'ES 350 F Sport','ES 250 Black Line Special Edition','ES 300h Ultra Luxury'
]) AS v WHERE b.name='Lexus' AND m.name='ES' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'RX 300 FWD','RX 350 AWD','RX 350h F Sport','RX 350h Luxury',
  'RX 450h AWD','RX 500h F Sport Performance','RX 450h+ PHEV'
]) AS v WHERE b.name='Lexus' AND m.name='RX' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'LX 570 Base','LX 570 Black Edition','LX 600 GX-R','LX 600 Luxury',
  'LX 600 F Sport','LX 600 Ultra Luxury','LX 600 Overtrail'
]) AS v WHERE b.name='Lexus' AND m.name='LX' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'NX 200t Base','NX 250 FWD','NX 350 F Sport AWD','NX 350h Luxury AWD',
  'NX 450h+ F Sport PHEV','NX 300h Hybrid'
]) AS v WHERE b.name='Lexus' AND m.name='NX' ON CONFLICT DO NOTHING;

-- ── Changan Alsvin / CS75 / CS35 / Uni-T ────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 MT Comfort','1.5 MT Lumiere','1.5 AT Lumiere','1.5 AT Premier'
]) AS v WHERE b.name='Changan' AND m.name='Alsvin' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5T MT','1.5T AT','2.0T AT 4WD','2.0T Sporty AT','Hybrid 1.5T AT'
]) AS v WHERE b.name='Changan' AND m.name='CS75 Plus' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.4T MT','1.4T AT','1.4T Pro MT','1.4T Pro AT'
]) AS v WHERE b.name='Changan' AND m.name='CS35 Plus' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5T MT','1.5T AT','2.0T AT 4WD','Pro 1.5T AT','Pro Max AT'
]) AS v WHERE b.name='Changan' AND m.name='Uni-T' ON CONFLICT DO NOTHING;

-- ── Haval H6 / Jolion / H9 ──────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5T DCT','2.0T DCT','2.0T 4WD DCT','Hybrid DCT','Supreme+ PHEV 4WD'
]) AS v WHERE b.name='Haval' AND m.name='H6' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5T DCT Standard','1.5T DCT Luxury','1.5T DCT Supreme','Hybrid Premium DCT'
]) AS v WHERE b.name='Haval' AND m.name='Jolion' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0T DCT 4WD','3.0T DCT 4WD','Elite 2.0T','Luxury 3.0T 4WD'
]) AS v WHERE b.name='Haval' AND m.name='H9' ON CONFLICT DO NOTHING;

-- ── MG HS / ZS / 6 / 5 ──────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5T DCT Standard','1.5T DCT Luxury','1.5T DCT Trophy','PHEV 1.5T Trophy','2.0T Trophy 4WD'
]) AS v WHERE b.name='MG' AND m.name='HS' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.3T Essence MT','1.3T Excite MT','1.5T Elite AT','EV Standard Range','EV Long Range Trophy'
]) AS v WHERE b.name='MG' AND m.name='ZS' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5T DCT Standard','1.5T DCT Essence','PHEV Trophy 10.5kWh','1.5T DCT Trophy'
]) AS v WHERE b.name='MG' AND m.name='6' ON CONFLICT DO NOTHING;

-- ── BYD Atto 3 / Seal / Dolphin / Han ───────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  'Standard Range','Extended Range','Long Range AWD'
]) AS v WHERE b.name='BYD' AND m.name='Atto 3' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '50 kWh RWD','82.5 kWh RWD','82.5 kWh AWD Performance'
]) AS v WHERE b.name='BYD' AND m.name='Seal' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '44.9 kWh Standard','60.5 kWh Extended'
]) AS v WHERE b.name='BYD' AND m.name='Dolphin' ON CONFLICT DO NOTHING;

-- ── Hyundai Tucson / Elantra / Sonata ────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.6T Smart FWD MT','2.0 GLS AT','2.0 Executive AT','2.0 Ultimate AT',
  '1.6T AWD DCT','Hybrid 1.6T Smart','Hybrid 1.6T Executive','PHEV AWD'
]) AS v WHERE b.name='Hyundai' AND m.name='Tucson' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.6 Smart MT','1.6 GLS MT','1.6 GLS AT','1.6 N Line DCT','Hybrid 1.6 Premium'
]) AS v WHERE b.name='Hyundai' AND m.name='Elantra' ON CONFLICT DO NOTHING;

-- ── Kia Sportage / Picanto / Seltos ──────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0 Alpha FWD MT','2.0 FWD AT','2.0 AWD AT','1.6T GT-Line AWD DCT',
  'Hybrid 1.6T FWD','Hybrid 1.6T AWD','PHEV AWD 1.6T'
]) AS v WHERE b.name='Kia' AND m.name='Sportage' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.0 STD MT','1.0 EX MT','1.2 EX AT','1.0 Turbo GT Line DCT'
]) AS v WHERE b.name='Kia' AND m.name='Picanto' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '1.5 HTK MT','1.5 HTK+ AT','1.4T GTX+ DCT','1.5 X-Line AT','Hybrid 1.5T FWD'
]) AS v WHERE b.name='Kia' AND m.name='Seltos' ON CONFLICT DO NOTHING;

-- ── Infiniti Q50 / QX80 ──────────────────────────────────────
INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '2.0t Pure AT','2.0t Luxe AT','3.0t Sensory AWD','3.0t Red Sport 400 AWD','3.5 Hybrid Sport'
]) AS v WHERE b.name='Infiniti' AND m.name='Q50' ON CONFLICT DO NOTHING;

INSERT INTO car_variants (name, model_id, is_active)
SELECT v, m.id, true FROM car_models m JOIN car_brands b ON b.id = m.brand_id
CROSS JOIN unnest(ARRAY[
  '5.6 V8 Luxe AT','5.6 V8 Sensory AT','5.6 V8 Pro 4x AT','5.6 V8 Autograph'
]) AS v WHERE b.name='Infiniti' AND m.name='QX80' ON CONFLICT DO NOTHING;