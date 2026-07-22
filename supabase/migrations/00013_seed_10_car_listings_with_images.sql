
-- Seed 10 Pakistani market car listings with real images
INSERT INTO cars (
  title, brand_name, model_name, variant_name,
  year, price, is_negotiable, mileage, condition,
  fuel_type, transmission, body_type, color,
  engine_capacity, assembly, is_imported,
  registration_city, city, location,
  description, features, images,
  status, is_featured, views,
  show_contact_type, created_at
) VALUES
-- 1. Toyota Corolla
(
  '2023 Toyota Corolla Altis 1.8 X CVT',
  'Toyota', 'Corolla', 'Altis 1.8 X CVT',
  2023, 6500000, true, 8000, 'used',
  'petrol', 'automatic', 'sedan', 'White',
  '1800cc', 'local', false,
  'Lahore', 'Lahore', 'DHA Phase 5, Lahore',
  'Excellent condition 2023 Toyota Corolla Altis 1.8 X CVT in pearl white. Single owner, full service history at Toyota authorized workshop. All features fully functional. Keyless entry, push start, cruise control, lane departure warning, pre-collision system. Imported leather seats. No accidents, no smoke. Ready for immediate transfer.',
  ARRAY['Keyless Entry', 'Push Start', 'Cruise Control', 'Lane Departure Warning', 'Pre-Collision System', 'LED Headlights', 'Reverse Camera', 'Apple CarPlay', 'Leather Seats', 'Sunroof', '7-inch Touchscreen', 'Dual Climate Control'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_92201b86-3d7c-4db5-8ebe-593b5d49c6e8.jpg'],
  'active', true, 245,
  'admin', NOW() - INTERVAL '2 days'
),
-- 2. Honda Civic
(
  '2022 Honda Civic RS Turbo 1.5L',
  'Honda', 'Civic', 'RS Turbo',
  2022, 8200000, true, 22000, 'used',
  'petrol', 'automatic', 'sedan', 'Silver',
  '1500cc', 'local', false,
  'Karachi', 'Karachi', 'Clifton, Karachi',
  'Well-maintained 2022 Honda Civic RS Turbo 1.5L in lunar silver metallic. Second owner, all original parts, never repainted. Honda Sensing safety suite included. 1.5L VTEC Turbo engine delivers excellent performance. Honda Connect infotainment, wireless Apple CarPlay/Android Auto. Service done at Honda authorized dealership.',
  ARRAY['Honda Sensing', 'Wireless CarPlay', 'Android Auto', 'Lane Watch Camera', 'Adaptive Cruise Control', 'LED Headlights', 'Sunroof', 'Heated Seats', 'Push Start', 'Keyless Entry', 'Turbocharged Engine', 'Alloy Wheels'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b0f0e689-3208-4e86-9155-6659d82662f5.jpg'],
  'active', true, 189,
  'admin', NOW() - INTERVAL '3 days'
),
-- 3. Suzuki Alto
(
  '2023 Suzuki Alto VXR AGS',
  'Suzuki', 'Alto', 'VXR AGS',
  2023, 2150000, true, 3500, 'used',
  'petrol', 'automatic', 'hatchback', 'Red',
  '660cc', 'local', false,
  'Rawalpindi', 'Rawalpindi', 'Saddar, Rawalpindi',
  'Brand new condition 2023 Suzuki Alto VXR with AGS Auto Gear Shift. Perfect city car with outstanding fuel economy — up to 22 km/l. Only 3,500 km driven. Original factory paint, no repair work. Ideal for first-time buyers and daily commuters. All standard features intact. Immediate delivery.',
  ARRAY['AGS Transmission', 'Power Steering', 'Power Windows', 'Central Locking', 'ABS', 'Airbags', 'Digital Cluster', 'USB Charging', 'Rear Wiper', 'Keyless Entry'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_982a600f-1b4e-4764-b787-8a4e7c04b2de.jpg'],
  'active', false, 312,
  'admin', NOW() - INTERVAL '1 day'
),
-- 4. Toyota Fortuner
(
  '2022 Toyota Fortuner Sigma 4 2.7L 4x4',
  'Toyota', 'Fortuner', 'Sigma 4 2.7L',
  2022, 14500000, true, 35000, 'used',
  'petrol', 'automatic', 'suv', 'Black',
  '2700cc', 'local', false,
  'Islamabad', 'Islamabad', 'F-7, Islamabad',
  'Stunning 2022 Toyota Fortuner Sigma 4 in Attitude Black Mica. 4WD with diff-lock, 7-seater premium SUV. Full option with panoramic sunroof, premium leather seats, JBL audio system. Toyota Safety Sense included. Comprehensive service records. Perfect for families and off-road adventures across Pakistan.',
  ARRAY['4WD', 'Diff Lock', 'Panoramic Sunroof', 'JBL Audio', 'Leather Seats', 'Toyota Safety Sense', 'Parking Sensors', 'Reverse Camera', 'Terrain Mode', '7-Seater', 'LED Headlights', 'Power Tailgate', 'Wireless Charger'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_72d9b7be-b7cf-4cac-b9fd-fa6d1701acab.jpg'],
  'active', true, 421,
  'admin', NOW() - INTERVAL '5 days'
),
-- 5. Honda BR-V
(
  '2023 Honda BR-V S CVT i-VTEC',
  'Honda', 'BR-V', 'S CVT',
  2023, 5450000, true, 15000, 'used',
  'petrol', 'automatic', 'suv', 'White',
  '1500cc', 'local', false,
  'Lahore', 'Lahore', 'Johar Town, Lahore',
  'Excellent condition 2023 Honda BR-V S CVT. 7-seater crossover SUV perfect for Pakistani families. 1.5L i-VTEC engine with 119 PS power output. Spacious boot and foldable 3rd row seats. Honda Lane Watch, LaneKeep Assist, Collision Mitigation Braking. Full option package. Registered in Lahore.',
  ARRAY['7-Seater', 'CVT Transmission', 'Honda Lane Watch', 'Collision Mitigation', 'Push Start', 'Keyless Entry', 'Rear AC Vents', 'Touchscreen', 'Reverse Camera', 'LED Headlights', 'Alloy Wheels', 'Cruise Control'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_993b1fba-49ea-416c-958f-835058b703f4.jpg'],
  'active', false, 178,
  'admin', NOW() - INTERVAL '4 days'
),
-- 6. Suzuki Cultus
(
  '2022 Suzuki Cultus VXL AGS',
  'Suzuki', 'Cultus', 'VXL AGS',
  2022, 2850000, true, 28000, 'used',
  'petrol', 'automatic', 'hatchback', 'Blue',
  '1000cc', 'local', false,
  'Faisalabad', 'Faisalabad', 'People Colony, Faisalabad',
  'Well-maintained 2022 Suzuki Cultus VXL with AGS automatic transmission. Popular and reliable hatchback with good fuel economy. Original paint, minor touchup only on front bumper (not structural). Alloy wheels, touchscreen multimedia with rear camera. Service record available. Family-owned, non-smoker vehicle.',
  ARRAY['AGS Transmission', 'Alloy Wheels', 'Touchscreen', 'Reverse Camera', 'Power Steering', 'Power Windows', 'ABS', 'Driver Airbag', 'Central Locking', 'LED DRLs', 'Keyless Entry', 'USB/Aux'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_12448102-9c6b-4f4e-8d41-74b3e14930b5.jpg'],
  'active', false, 267,
  'admin', NOW() - INTERVAL '6 days'
),
-- 7. Kia Sportage
(
  '2023 Kia Sportage AWD Alpha 2.0L',
  'Kia', 'Sportage', 'AWD Alpha',
  2023, 9800000, true, 12000, 'used',
  'petrol', 'automatic', 'suv', 'Silver',
  '2000cc', 'local', false,
  'Karachi', 'Karachi', 'Defence, Karachi',
  'Immaculate 2023 Kia Sportage AWD Alpha in Glacial White Pearl. All-wheel drive with terrain management system. Panoramic sunroof, Kia advanced driver assistance system, Bose premium sound, wireless charging, heads-up display. Never taken off-road, always garage kept. First owner, service at Kia authorized center.',
  ARRAY['AWD', 'Panoramic Sunroof', 'Bose Audio', 'Heads-Up Display', 'Wireless Charging', 'ADAS', 'Lane Keeping', 'Blind Spot Monitor', 'Heated/Ventilated Seats', 'Digital Cockpit', 'Ambient Lighting', 'Power Tailgate'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_74d31286-4c2e-45ba-b848-4402d410bb27.jpg'],
  'active', true, 356,
  'admin', NOW() - INTERVAL '7 days'
),
-- 8. Toyota Hilux
(
  '2022 Toyota Hilux Revo V 2.8L 4x4 Manual',
  'Toyota', 'Hilux', 'Revo V 2.8L',
  2022, 12800000, false, 42000, 'used',
  'diesel', 'manual', 'truck', 'White',
  '2800cc', 'local', false,
  'Peshawar', 'Peshawar', 'Ring Road, Peshawar',
  'Rugged 2022 Toyota Hilux Revo V in Super White. 2.8L diesel engine with 4WD and differential lock. Used for transport business in Khyber Pakhtunkhwa region. Well-maintained, engine and gearbox in perfect condition. Canopy included. Towing package installed. Ideal for business or adventure use.',
  ARRAY['4WD', 'Diff Lock', 'Diesel Engine', 'Canopy', 'Towing Package', 'Power Steering', 'Air Conditioning', 'Power Windows', 'Central Locking', 'ABS', 'Reverse Camera', 'Alloy Wheels'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_09b1b7aa-37a9-49cd-beec-09e833645ac8.jpg'],
  'active', false, 198,
  'admin', NOW() - INTERVAL '8 days'
),
-- 9. Hyundai Tucson
(
  '2023 Hyundai Tucson GLS Turbo AWD',
  'Hyundai', 'Tucson', 'GLS Turbo AWD',
  2023, 8900000, true, 9500, 'used',
  'petrol', 'automatic', 'suv', 'Red',
  '1600cc', 'local', false,
  'Islamabad', 'Islamabad', 'G-11, Islamabad',
  'Striking 2023 Hyundai Tucson GLS Turbo AWD in Lava Orange. 1.6T turbocharged engine with AWD, panoramic sunroof, heated/ventilated seats, 10.25-inch touchscreen. Hyundai SmartSense driver assistance. Second owner, bought from original owner. Fully registered, transfer ready. Upgraded to Hyundai genuine accessories.',
  ARRAY['AWD', '1.6T Turbo', 'Panoramic Sunroof', 'Heated Seats', 'Ventilated Seats', 'SmartSense ADAS', '10.25-inch Touchscreen', 'Wireless CarPlay', 'Ambient Lighting', 'Parking Assist', 'Blind Spot Warning', 'Rear Cross Traffic Alert'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6c719d8e-2f1c-464f-9f74-3842aca6df70.jpg'],
  'active', true, 289,
  'admin', NOW() - INTERVAL '9 days'
),
-- 10. MG HS
(
  '2022 MG HS Exclusive 1.5T DCT',
  'MG', 'HS', 'Exclusive 1.5T DCT',
  2022, 7200000, true, 31000, 'used',
  'petrol', 'automatic', 'suv', 'Black',
  '1500cc', 'local', false,
  'Lahore', 'Lahore', 'Gulberg III, Lahore',
  'Feature-packed 2022 MG HS Exclusive in Starry Black. 7DCT dual-clutch transmission with smooth shifts. Panoramic sunroof, iSMART connectivity, 10.1-inch touchscreen. Genuine leather seats, 360-degree cameras, level 2 ADAS. Lane Change Assist, Traffic Jam Assist included. First owner, pristine interior, zero accidents.',
  ARRAY['iSMART Connected', '360 Camera', 'Panoramic Sunroof', 'Level 2 ADAS', 'Traffic Jam Assist', 'Lane Change Assist', 'Leather Seats', '10.1-inch Screen', 'Wireless Charging', 'Keyless Entry', 'Heated Seats', 'Sport Mode'],
  ARRAY['https://miaoda-site-img.s3cdn.medo.dev/images/KLing_55d214f2-e414-40ed-864b-c52b86a59cab.jpg'],
  'active', true, 334,
  'admin', NOW() - INTERVAL '10 days'
);
