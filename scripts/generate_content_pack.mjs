import fs from 'fs';
import path from 'path';

// 16 Categories (Preserving existing slugs and sort orders 1 to 16)
const CATEGORIES = [
  {
    num: 1,
    slug: 'tyres-wheels',
    name: { en: 'Tyres & Wheels', ur: 'ٹائرز اور ویلز', 'ur-roman': 'Tyres & Wheels' },
    desc: {
      en: 'Passenger car radial tyres, alloy rims, steel wheels, and tyre accessories.',
      ur: 'گاڑیوں کے ریڈیل ٹائرز، الائے رِمز، اسٹیل ویلز اور ٹائر کے لوازمات۔',
      'ur-roman': 'Gaariyon ke radial tyres, alloy rims, steel wheels aur tyre accessories.'
    },
    icon: 'CircleDot',
    sort_order: 1
  },
  {
    num: 2,
    slug: 'batteries',
    name: { en: 'Batteries', ur: 'بیٹریاں', 'ur-roman': 'Batteries' },
    desc: {
      en: 'Maintenance-free dry and lead-acid automotive batteries and terminal hardware.',
      ur: 'مینٹیننس فری ڈرائی اور روایتی کار بیٹریاں اور ٹرمینل پرزے۔',
      'ur-roman': 'Maintenance-free dry aur car batteries aur terminal hardware.'
    },
    icon: 'BatteryCharging',
    sort_order: 2
  },
  {
    num: 3,
    slug: 'oils-lubricants',
    name: { en: 'Engine Oil & Fluids', ur: 'انجن آئل اور فلوئڈز', 'ur-roman': 'Engine Oil & Fluids' },
    desc: {
      en: 'Synthetic and semi-synthetic motor oils, transmission fluids, and radiator coolants.',
      ur: 'سنتھیٹک اور سیمی سنتھیٹک انجن آئل، ٹرانسمیشن فلوئڈز اور کولنٹس۔',
      'ur-roman': 'Synthetic aur semi-synthetic engine oil, transmission fluids aur coolants.'
    },
    icon: 'Droplet',
    sort_order: 3
  },
  {
    num: 4,
    slug: 'filters',
    name: { en: 'Filters', ur: 'فلٹرز', 'ur-roman': 'Filters' },
    desc: {
      en: 'Engine oil filters, air filter elements, AC cabin filters, and fuel filters.',
      ur: 'انجن آئل فلٹرز، ایئر فلٹر ایلیمنٹس، اے سی کیبن فلٹرز اور فیول فلٹرز۔',
      'ur-roman': 'Engine oil filters, air filter elements, AC cabin filters aur fuel filters.'
    },
    icon: 'Filter',
    sort_order: 4
  },
  {
    num: 5,
    slug: 'brakes',
    name: { en: 'Braking System', ur: 'بریکنگ سسٹم', 'ur-roman': 'Braking System' },
    desc: {
      en: 'Front brake pad sets, rear brake shoe sets, brake discs, and hydraulic fluids.',
      ur: 'فرنٹ بریک پیڈ سیٹ، ریئر بریک شو سیٹ، بریک ڈسک اور بریک آئل۔',
      'ur-roman': 'Front brake pad sets, rear brake shoe sets, brake discs aur brake oil.'
    },
    icon: 'Disc3',
    sort_order: 5
  },
  {
    num: 6,
    slug: 'electrical-lighting',
    name: { en: 'Lighting & Bulbs', ur: 'لائٹنگ اور بلب', 'ur-roman': 'Lighting & Bulbs' },
    desc: {
      en: 'Halogen headlight bulbs, LED conversion kits, and vehicle tail light assemblies.',
      ur: 'ہیلوجن ہیڈ لائٹ بلب، ایل ای ڈی کٹس اور پچھلی لائٹس کی اسمبلیاں۔',
      'ur-roman': 'Halogen headlight bulbs, LED kits aur tail light assemblies.'
    },
    icon: 'Zap',
    sort_order: 6
  },
  {
    num: 7,
    slug: 'wipers',
    name: { en: 'Wipers', ur: 'وائپرز', 'ur-roman': 'Wipers' },
    desc: {
      en: 'Flat wiper blades, paired windscreen wiper sets, and washer fluids.',
      ur: 'فلیٹ وائپر بلیڈز، ونڈ اسکرین وائپر پیئرز اور ونڈ شیلڈ واشر فلوئڈ۔',
      'ur-roman': 'Flat wiper blades, windscreen wiper pairs aur washer fluids.'
    },
    icon: 'Shield',
    sort_order: 7
  },
  {
    num: 8,
    slug: 'suspension-steering',
    name: { en: 'Suspension & Steering', ur: 'سسپنشن اور اسٹیئرنگ', 'ur-roman': 'Suspension & Steering' },
    desc: {
      en: 'Shock absorbers, sway bar stabilizer links, and steering tie rod ends.',
      ur: 'شاک ایبزاربرز، اسٹیبلائزر لنکس اور اسٹیئرنگ ٹائی راڈ اینڈز۔',
      'ur-roman': 'Shock absorbers, stabilizer links aur tie rod ends.'
    },
    icon: 'Wrench',
    sort_order: 8
  },
  {
    num: 9,
    slug: 'ac-cooling',
    name: { en: 'AC Parts', ur: 'اے سی پارٹس', 'ur-roman': 'AC Parts' },
    desc: {
      en: 'Automotive air conditioning refill kits, condenser fan motors, and cabin blowers.',
      ur: 'گاڑیوں کے اے سی ری فل کٹس، کنڈینسر فین موٹرز اور کیبن بلور موٹرز۔',
      'ur-roman': 'Car AC refill kits, condenser fan motors aur cabin blower motors.'
    },
    icon: 'Snowflake',
    sort_order: 9
  },
  {
    num: 10,
    slug: 'engine-parts',
    name: { en: 'Ignition & Electrical', ur: 'اگنیشن اور الیکٹریکل', 'ur-roman': 'Ignition & Electrical' },
    desc: {
      en: 'Iridium spark plug sets, ignition coils, relays, and fuse assortment kits.',
      ur: 'اسپارک پلگ سیٹس، اگنیشن کوائلز، ریلے اور فیوز کٹس۔',
      'ur-roman': 'Spark plug sets, ignition coils, relays aur fuse kits.'
    },
    icon: 'Cog',
    sort_order: 10
  },
  {
    num: 11,
    slug: 'belts-cooling',
    name: { en: 'Belts & Cooling', ur: 'بیلٹس اور کولنگ', 'ur-roman': 'Belts & Cooling' },
    desc: {
      en: 'Engine timing belt kits, serpentine drive belts, and cooling thermostats with gaskets.',
      ur: 'انجن ٹائمنگ بیلٹ کٹس، ڈرائیو بیلٹس اور تھرموسٹیٹ والوز بمعہ گیسکٹ۔',
      'ur-roman': 'Engine timing belt kits, drive belts aur thermostats with gaskets.'
    },
    icon: 'Cog',
    sort_order: 11
  },
  {
    num: 12,
    slug: 'exhaust-intake',
    name: { en: 'Exhaust & Intake', ur: 'ایگزاسٹ اور انٹیک', 'ur-roman': 'Exhaust & Intake' },
    desc: {
      en: 'Rear silencer mufflers, flexible exhaust pipes, and oxygen exhaust sensors.',
      ur: 'ریئر سائلنسرز، فلیکسیبل ایگزاسٹ پائپ اور آکسیجن سینسرز۔',
      'ur-roman': 'Rear silencer mufflers, flexible exhaust pipes aur oxygen sensors.'
    },
    icon: 'Shield',
    sort_order: 12
  },
  {
    num: 13,
    slug: 'body-exterior-accessories',
    name: { en: 'Body & Trim', ur: 'باڈی اور ٹرم', 'ur-roman': 'Body & Trim' },
    desc: {
      en: 'Manual side mirrors, protective mud flap sets, and chrome door handle covers.',
      ur: 'سائیڈ مررز، حفاظتی مڈ فلیپ سیٹ اور کروم ڈور ہینڈل کورز۔',
      'ur-roman': 'Side mirrors, mud flap sets aur chrome door handle covers.'
    },
    icon: 'Shield',
    sort_order: 13
  },
  {
    num: 14,
    slug: 'seat-covers-mats',
    name: { en: 'Seat Covers & Mats', ur: 'سیٹ کورز اور میٹس', 'ur-roman': 'Seat Covers & Mats' },
    desc: {
      en: 'Fitted leatherette seat cover sets, all-weather rubber floor mats, and steering wheel covers.',
      ur: 'لیدرٹ سیٹ کور سیٹ، ربر فلور میٹس اور اسٹیرنگ ویل کورز۔',
      'ur-roman': 'Leatherette seat cover sets, rubber floor mats aur steering wheel covers.'
    },
    icon: 'Armchair',
    sort_order: 14
  },
  {
    num: 15,
    slug: 'tools-equipment',
    name: { en: 'Tools & Equipment', ur: 'اوزار اور آلات', 'ur-roman': 'Tools & Equipment' },
    desc: {
      en: 'Mechanic socket sets, hydraulic floor jacks, and portable 12V tyre inflators.',
      ur: 'میکینک ساکٹ سیٹس، ہائیڈرولک فلور جیکس اور پورٹیبل 12 وولٹ ٹائر انفلریٹرز۔',
      'ur-roman': 'Mechanic socket sets, hydraulic floor jacks aur portable tyre inflators.'
    },
    icon: 'Wrench',
    sort_order: 15
  },
  {
    num: 16,
    slug: 'interior-car-care',
    name: { en: 'Car Care & Accessories', ur: 'کار کیئر اور لوازمات', 'ur-roman': 'Car Care & Accessories' },
    desc: {
      en: 'Automotive wash shampoos, interior dashboard polish, and microfiber cleaning cloth packs.',
      ur: 'کار شیمپو، اندرونی ڈیش بورڈ پالش اور مائیکرو فائبر کلیننگ کپڑے کے پیک۔',
      'ur-roman': 'Car wash shampoo, dashboard polish aur microfiber cloth packs.'
    },
    icon: 'Sparkles',
    sort_order: 16
  }
];

// 15 Fictional Brands
const BRANDS = [
  { slug: 'roadmax', name: 'RoadMax', usedFor: 'Tyres and wheel accessories' },
  { slug: 'griptech', name: 'GripTech', usedFor: 'Performance tyres' },
  { slug: 'powercell', name: 'PowerCell', usedFor: 'Batteries and terminals' },
  { slug: 'ecolube', name: 'EcoLube', usedFor: 'Engine oils and fluids' },
  { slug: 'airpure', name: 'AirPure', usedFor: 'Filters' },
  { slug: 'stopwell', name: 'StopWell', usedFor: 'Brake parts' },
  { slug: 'clearview', name: 'ClearView', usedFor: 'Lighting and wipers' },
  { slug: 'coolflow', name: 'CoolFlow', usedFor: 'AC and cooling parts' },
  { slug: 'torqueworks', name: 'TorqueWorks', usedFor: 'Suspension and tools' },
  { slug: 'voltedge', name: 'VoltEdge', usedFor: 'Ignition and electrical' },
  { slug: 'flexdrive', name: 'FlexDrive', usedFor: 'Belts and drive parts' },
  { slug: 'silentflow', name: 'SilentFlow', usedFor: 'Exhaust and intake' },
  { slug: 'bodycraft', name: 'BodyCraft', usedFor: 'Body and trim parts' },
  { slug: 'shinepro', name: 'ShinePro', usedFor: 'Car care products' },
  { slug: 'cozyride', name: 'CozyRide', usedFor: 'Seat covers and mats' }
];

// 48 Products
const PRODUCTS = [
  {
    code: 'TYR-01',
    name: { en: 'RoadMax Comfort 185/65 R15 Tyre', ur: 'روڈ میکس کمفرٹ 185/65 R15 ٹائر', 'ur-roman': 'RoadMax Comfort 185/65 R15 Tyre' },
    cat: 'tyres-wheels',
    brand: 'roadmax',
    price: 14500,
    sale: null,
    stock: 24,
    feat: true,
    fit: 'S',
    specs: [
      { label: { en: 'Size', ur: 'سائز', 'ur-roman': 'Size' }, value: { en: '185/65 R15', ur: '185/65 R15', 'ur-roman': '185/65 R15' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Comfort touring', ur: 'کمفرٹ ٹورنگ', 'ur-roman': 'Comfort touring' } },
      { label: { en: 'Use', ur: 'استعمال', 'ur-roman': 'Use' }, value: { en: 'Passenger car', ur: 'پیسنجر کار', 'ur-roman': 'Passenger car' } }
    ],
    desc: {
      en: 'Passenger car radial tyre engineered for daily highway and urban commutes with balanced tread life.',
      ur: 'روزمرہ ڈرائیونگ اور ہائی وے کے لیے متوازن ٹریڈ لائف والا ریڈیل ٹائر۔',
      'ur-roman': 'Rozmarrah driving aur highway ke liye balanced tread life wala radial tyre.'
    }
  },
  {
    code: 'TYR-02',
    name: { en: 'GripTech Sport 205/55 R16 Tyre', ur: 'گرپ ٹیک اسپورٹ 205/55 R16 ٹائر', 'ur-roman': 'GripTech Sport 205/55 R16 Tyre' },
    cat: 'tyres-wheels',
    brand: 'griptech',
    price: 16500,
    sale: 17800,
    stock: 12,
    feat: false,
    fit: 'S',
    specs: [
      { label: { en: 'Size', ur: 'سائز', 'ur-roman': 'Size' }, value: { en: '205/55 R16', ur: '205/55 R16', 'ur-roman': '205/55 R16' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Sport touring', ur: 'اسپورٹ ٹورنگ', 'ur-roman': 'Sport touring' } },
      { label: { en: 'Use', ur: 'استعمال', 'ur-roman': 'Use' }, value: { en: 'Passenger car', ur: 'پیسنجر کار', 'ur-roman': 'Passenger car' } }
    ],
    desc: {
      en: 'Wide contact pattern tyre providing responsive cornering control and firm dry road grip.',
      ur: 'موڑ کاٹنے میں مستحکم کنٹرول اور خشک سڑکوں پر مضبوط گرفت فراہم کرنے والا ٹائر۔',
      'ur-roman': 'Cornering control aur khushk sarak par mazboot grip faraham karne wala tyre.'
    }
  },
  {
    code: 'TYR-03',
    name: { en: 'RoadMax Chrome Wheel Nut Set (20 pcs)', ur: 'روڈ میکس کروم ویل نٹ سیٹ (20 عدد)', 'ur-roman': 'RoadMax Chrome Wheel Nut Set (20 pcs)' },
    cat: 'tyres-wheels',
    brand: 'roadmax',
    price: 2400,
    sale: null,
    stock: 40,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Pieces', ur: 'تعداد', 'ur-roman': 'Pieces' }, value: { en: '20', ur: '20', 'ur-roman': '20' } },
      { label: { en: 'Finish', ur: 'فنش', 'ur-roman': 'Finish' }, value: { en: 'Chrome', ur: 'کروم', 'ur-roman': 'Chrome' } },
      { label: { en: 'Includes', ur: 'شامل ہے', 'ur-roman': 'Includes' }, value: { en: 'Wheel nut wrench', ur: 'ویل نٹ رینچ', 'ur-roman': 'Wheel nut wrench' } }
    ],
    desc: {
      en: 'Triple-plated chrome wheel lug nut pack suitable for aftermarket alloy and steel wheels.',
      ur: 'الائے رمز اور اسٹیل پہیوں کے لیے ٹرپل پلیٹڈ کروم نٹس کا مکمل سیٹ۔',
      'ur-roman': 'Alloy rims aur steel wheels ke liye triple-plated chrome nuts ka mukammal set.'
    }
  },
  {
    code: 'BAT-01',
    name: { en: 'PowerCell 12V 45Ah Maintenance-Free Battery', ur: 'پاور سیل 12V 45Ah مینٹیننس فری بیٹری', 'ur-roman': 'PowerCell 12V 45Ah Maintenance-Free Battery' },
    cat: 'batteries',
    brand: 'powercell',
    price: 13500,
    sale: null,
    stock: 15,
    feat: false,
    fit: 'H',
    specs: [
      { label: { en: 'Voltage', ur: 'وولٹیج', 'ur-roman': 'Voltage' }, value: { en: '12V', ur: '12 وولٹ', 'ur-roman': '12V' } },
      { label: { en: 'Capacity', ur: 'گنجائش', 'ur-roman': 'Capacity' }, value: { en: '45Ah', ur: '45 ایمپیئر گھنٹہ', 'ur-roman': '45Ah' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Maintenance-free', ur: 'مینٹیننس فری', 'ur-roman': 'Maintenance-free' } }
    ],
    desc: {
      en: 'Sealed starter battery for small cars with consistent cold crank and zero top-up requirements.',
      ur: 'چھوٹی گاڑیوں کے لیے سیل شدہ اسٹارٹر بیٹری جس میں پانی ڈالنے کی ضرورت نہیں ہوتی۔',
      'ur-roman': 'Chhoti gaariyon ke liye sealed starter battery jisme paani daalne ki zaroorat nahi.'
    }
  },
  {
    code: 'BAT-02',
    name: { en: 'PowerCell 12V 65Ah Maintenance-Free Battery', ur: 'پاور سیل 12V 65Ah مینٹیننس فری بیٹری', 'ur-roman': 'PowerCell 12V 65Ah Maintenance-Free Battery' },
    cat: 'batteries',
    brand: 'powercell',
    price: 18900,
    sale: 19800,
    stock: 9,
    feat: true,
    fit: 'S',
    specs: [
      { label: { en: 'Voltage', ur: 'وولٹیج', 'ur-roman': 'Voltage' }, value: { en: '12V', ur: '12 وولٹ', 'ur-roman': '12V' } },
      { label: { en: 'Capacity', ur: 'گنجائش', 'ur-roman': 'Capacity' }, value: { en: '65Ah', ur: '65 ایمپیئر گھنٹہ', 'ur-roman': '65Ah' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Maintenance-free', ur: 'مینٹیننس فری', 'ur-roman': 'Maintenance-free' } }
    ],
    desc: {
      en: 'High reserve capacity maintenance-free battery suited for modern sedans with electronic accessories.',
      ur: 'اضافی الیکٹرانک لوازمات رکھنے والی سیڈان گاڑیوں کے لیے زیادہ گنجائش والی بیٹری۔',
      'ur-roman': 'Electronic accessories wali modern sedan gaariyon ke liye high capacity battery.'
    }
  },
  {
    code: 'BAT-03',
    name: { en: 'PowerCell Terminal Clamp Pair + Anti-Corrosion Spray', ur: 'پاور سیل ٹرمینل کلیمپ جوڑا اور اینٹی کروشن اسپرے', 'ur-roman': 'PowerCell Terminal Clamp Pair + Anti-Corrosion Spray' },
    cat: 'batteries',
    brand: 'powercell',
    price: 950,
    sale: null,
    stock: 60,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Contents', ur: 'مشمولات', 'ur-roman': 'Contents' }, value: { en: '2 terminal clamps and 1 anti-corrosion spray', ur: '2 ٹرمینل کلیمپ اور 1 اینٹی کروشن اسپرے', 'ur-roman': '2 terminal clamps aur 1 anti-corrosion spray' } },
      { label: { en: 'Fit', ur: 'فٹمنٹ', 'ur-roman': 'Fit' }, value: { en: 'Universal', ur: 'یونیورسل', 'ur-roman': 'Universal' } }
    ],
    desc: {
      en: 'Heavy brass battery post clamps paired with protective grease aerosol for clean terminal contacts.',
      ur: 'بیٹری کھمبوں پر زنگ سے بچاؤ اور صاف کرنٹ بہاؤ کے لیے براس کلیمپ اور حفاظتی اسپرے۔',
      'ur-roman': 'Battery terminals par zang se hifazat aur clean current contact ke liye brass clamps.'
    }
  },
  {
    code: 'OIL-01',
    name: { en: 'EcoLube 5W-30 Synthetic Engine Oil 4L', ur: 'ایکو لیوب 5W-30 سنتھیٹک انجن آئل 4L', 'ur-roman': 'EcoLube 5W-30 Synthetic Engine Oil 4L' },
    cat: 'oils-lubricants',
    brand: 'ecolube',
    price: 9800,
    sale: null,
    stock: 40,
    feat: true,
    fit: 'U',
    specs: [
      { label: { en: 'Grade', ur: 'گریڈ', 'ur-roman': 'Grade' }, value: { en: '5W-30', ur: '5W-30', 'ur-roman': '5W-30' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Synthetic', ur: 'سنتھیٹک', 'ur-roman': 'Synthetic' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '4 L', ur: '4 لیٹر', 'ur-roman': '4 L' } }
    ],
    desc: {
      en: 'Multigrade motor lubricant formulated for smooth piston action and high thermal protection in warm climates.',
      ur: 'گرم موسم میں اندرونی انجن پرزوں کے تحفظ اور ہموار کارکردگی کے لیے سنتھیٹک انجن آئل۔',
      'ur-roman': 'Garam mosam mein internal engine protection aur smooth performance ke liye synthetic oil.'
    }
  },
  {
    code: 'OIL-02',
    name: { en: 'EcoLube 10W-40 Semi-Synthetic Engine Oil 4L', ur: 'ایکو لیوب 10W-40 سیمی سنتھیٹک انجن آئل 4L', 'ur-roman': 'EcoLube 10W-40 Semi-Synthetic Engine Oil 4L' },
    cat: 'oils-lubricants',
    brand: 'ecolube',
    price: 6800,
    sale: 7200,
    stock: 3,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Grade', ur: 'گریڈ', 'ur-roman': 'Grade' }, value: { en: '10W-40', ur: '10W-40', 'ur-roman': '10W-40' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Semi-synthetic', ur: 'سیمی سنتھیٹک', 'ur-roman': 'Semi-synthetic' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '4 L', ur: '4 لیٹر', 'ur-roman': '4 L' } }
    ],
    desc: {
      en: 'Semi-synthetic lubricant designed for high-mileage engines and mixed stop-and-go driving conditions.',
      ur: 'زیادہ مائلیج والے انجنوں اور روزمرہ ٹریفک کے لیے سیمی سنتھیٹک موٹر لبریکنٹ۔',
      'ur-roman': 'Zyada mileage walay engines aur city driving ke liye semi-synthetic lubricant.'
    }
  },
  {
    code: 'OIL-03',
    name: { en: 'EcoLube Ready-Mix Coolant 1L', ur: 'ایکو لیوب ریڈی مکس کولنٹ 1L', 'ur-roman': 'EcoLube Ready-Mix Coolant 1L' },
    cat: 'oils-lubricants',
    brand: 'ecolube',
    price: 1100,
    sale: null,
    stock: 0,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Ready-mix coolant', ur: 'ریڈی مکس کولنٹ', 'ur-roman': 'Ready-mix coolant' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '1 L', ur: '1 لیٹر', 'ur-roman': '1 L' } },
      { label: { en: 'Colour', ur: 'رنگ', 'ur-roman': 'Colour' }, value: { en: 'Green', ur: 'سبز', 'ur-roman': 'Green' } }
    ],
    desc: {
      en: 'Pre-diluted radiator fluid providing anti-boil and corrosion defense across the cooling circuit.',
      ur: 'ریڈی ایٹر میں زنگ اور بوائلنگ روکنے کے لیے تیار شدہ پری ڈائلوٹڈ کولنٹ فلوئڈ۔',
      'ur-roman': 'Radiator mein rust aur boiling rokne ke liye pre-diluted green coolant fluid.'
    }
  },
  {
    code: 'FLT-01',
    name: { en: 'AirPure Spin-On Oil Filter', ur: 'ایئر پیور اسپن آن آئل فلٹر', 'ur-roman': 'AirPure Spin-On Oil Filter' },
    cat: 'filters',
    brand: 'airpure',
    price: 650,
    sale: null,
    stock: 80,
    feat: true,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Spin-on oil filter', ur: 'اسپن آن آئل فلٹر', 'ur-roman': 'Spin-on oil filter' } },
      { label: { en: 'Fit', ur: 'فٹمنٹ', 'ur-roman': 'Fit' }, value: { en: 'Selected petrol engines', ur: 'منتخب پیٹرول انجن', 'ur-roman': 'Selected petrol engines' } }
    ],
    desc: {
      en: 'Canister oil filter containing dense pleated paper media to trap carbon residue and engine debris.',
      ur: 'انجن آئل سے کاربن اور باریک ذرات صاف کرنے کے لیے پلیٹڈ فلٹریشن فلٹر۔',
      'ur-roman': 'Engine oil se carbon aur particles clean karne ke liye pleated filter.'
    }
  },
  {
    code: 'FLT-02',
    name: { en: 'AirPure Air Filter Element', ur: 'ایئر پیور ایئر فلٹر ایلیمنٹ', 'ur-roman': 'AirPure Air Filter Element' },
    cat: 'filters',
    brand: 'airpure',
    price: 1250,
    sale: null,
    stock: 45,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Panel air filter element', ur: 'پینل ایئر فلٹر ایلیمنٹ', 'ur-roman': 'Panel air filter element' } },
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Pleated paper', ur: 'پلیٹڈ پیپر', 'ur-roman': 'Pleated paper' } }
    ],
    desc: {
      en: 'Engine intake filter block designed to catch airborne dust without constricting manifold airflow.',
      ur: 'ہوا سے گرد و غبار روکنے اور انجن تک صاف ہوا پہنچانے والا ایئر فلٹر۔',
      'ur-roman': 'Air se dust rok kar engine tak saaf air pohanchane wala intake air filter.'
    }
  },
  {
    code: 'FLT-03',
    name: { en: 'AirPure Carbon Cabin AC Filter', ur: 'ایئر پیور کاربن کیبن اے سی فلٹر', 'ur-roman': 'AirPure Carbon Cabin AC Filter' },
    cat: 'filters',
    brand: 'airpure',
    price: 1290,
    sale: 1450,
    stock: 30,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Cabin filter', ur: 'کیبن فلٹر', 'ur-roman': 'Cabin filter' } },
      { label: { en: 'Layer', ur: 'تہہ', 'ur-roman': 'Layer' }, value: { en: 'Activated carbon', ur: 'ایکٹیویٹڈ کاربن', 'ur-roman': 'Activated carbon' } }
    ],
    desc: {
      en: 'Dual-layer cabin filter incorporating activated charcoal to minimize outside road fumes and fine dust.',
      ur: 'باہر کے دھوئیں اور دھول کو کیبن کے اندر آنے سے روکنے کے لیے چارکول کیبن فلٹر۔',
      'ur-roman': 'Bahar ke dhuen aur dust ko cabin se door rakhne ke liye charcoal cabin filter.'
    }
  },
  {
    code: 'BRK-01',
    name: { en: 'StopWell Front Brake Pad Set', ur: 'اسٹاپ ویل فرنٹ بریک پیڈ سیٹ', 'ur-roman': 'StopWell Front Brake Pad Set' },
    cat: 'brakes',
    brand: 'stopwell',
    price: 4200,
    sale: null,
    stock: 20,
    feat: true,
    fit: 'A',
    specs: [
      { label: { en: 'Position', ur: 'پوزیشن', 'ur-roman': 'Position' }, value: { en: 'Front', ur: 'سامنے', 'ur-roman': 'Front' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Semi-metallic', ur: 'سیمی میٹالک', 'ur-roman': 'Semi-metallic' } },
      { label: { en: 'Contents', ur: 'مشمولات', 'ur-roman': 'Contents' }, value: { en: '1 axle set', ur: '1 ایکسل سیٹ', 'ur-roman': '1 axle set' } }
    ],
    desc: {
      en: 'Front axle friction pads with bonded backing plates for consistent deceleration and wear life.',
      ur: 'سامنے والے ایکسل کے لیے یکساں روک تھام فراہم کرنے والے فرنٹ بریک پیڈز۔',
      'ur-roman': 'Front axle ke liye balanced stopping aur lambi service life walay brake pads.'
    }
  },
  {
    code: 'BRK-02',
    name: { en: 'StopWell Rear Brake Shoe Set', ur: 'اسٹاپ ویل ریئر بریک شو سیٹ', 'ur-roman': 'StopWell Rear Brake Shoe Set' },
    cat: 'brakes',
    brand: 'stopwell',
    price: 3600,
    sale: null,
    stock: 14,
    feat: false,
    fit: 'H',
    specs: [
      { label: { en: 'Position', ur: 'پوزیشن', 'ur-roman': 'Position' }, value: { en: 'Rear', ur: 'پیچھے', 'ur-roman': 'Rear' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Drum brake shoe set', ur: 'ڈرم بریک شو سیٹ', 'ur-roman': 'Drum brake shoe set' } }
    ],
    desc: {
      en: 'Curved friction shoes engineered for passenger vehicle rear drum brake enclosures.',
      ur: 'پچھلے وہیل ڈرم بریک سسٹم کے لیے معیاری فرکشن مٹیریل والے بریک شوز۔',
      'ur-roman': 'Rear drum brake system ke liye durable friction material walay brake shoes.'
    }
  },
  {
    code: 'BRK-03',
    name: { en: 'StopWell DOT 4 Brake Fluid 500ml', ur: 'اسٹاپ ویل DOT 4 بریک فلوئڈ 500ml', 'ur-roman': 'StopWell DOT 4 Brake Fluid 500ml' },
    cat: 'brakes',
    brand: 'stopwell',
    price: 850,
    sale: null,
    stock: 55,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'DOT 4', ur: 'ڈاٹ 4', 'ur-roman': 'DOT 4' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '500 ml', ur: '500 ملی لیٹر', 'ur-roman': '500 ml' } }
    ],
    desc: {
      en: 'Hydraulic fluid with high wet-boiling resistance formulated for modern ABS disc and drum brake setups.',
      ur: 'ہائیڈرولک پریشر اور ہائی بوائلنگ پوائنٹ کے حامل ڈسک اور ڈرم بریک سسٹمز کے لیے بریک آئل۔',
      'ur-roman': 'Disc aur drum brake systems ke liye high boiling point DOT 4 hydraulic brake fluid.'
    }
  },
  {
    code: 'LGT-01',
    name: { en: 'ClearView H4 Halogen Headlight Bulb (Pair)', ur: 'کلیئر ویو H4 ہیلوجن ہیڈ لائٹ بلب (جوڑا)', 'ur-roman': 'ClearView H4 Halogen Headlight Bulb (Pair)' },
    cat: 'electrical-lighting',
    brand: 'clearview',
    price: 1600,
    sale: null,
    stock: 35,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'H4 halogen', ur: 'H4 ہیلوجن', 'ur-roman': 'H4 halogen' } },
      { label: { en: 'Voltage', ur: 'وولٹیج', 'ur-roman': 'Voltage' }, value: { en: '12V', ur: '12 وولٹ', 'ur-roman': '12V' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '2 bulbs', ur: '2 بلب', 'ur-roman': '2 bulbs' } }
    ],
    desc: {
      en: 'Dual-filament quartz halogen replacement bulbs providing standard high and low headlight beams.',
      ur: 'ہائی اور لو بیم کے لیے اسٹینڈرڈ کوارٹز گلاس ہیلوجن ہیڈ لائٹ بلب کا جوڑا۔',
      'ur-roman': 'High aur low beam headlight illumination ke liye standard H4 halogen bulbs.'
    }
  },
  {
    code: 'LGT-02',
    name: { en: 'ClearView LED Headlight Kit H11', ur: 'کلیئر ویو ایل ای ڈی ہیڈ لائٹ کٹ H11', 'ur-roman': 'ClearView LED Headlight Kit H11' },
    cat: 'electrical-lighting',
    brand: 'clearview',
    price: 5900,
    sale: 6500,
    stock: 6,
    feat: true,
    fit: 'U',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'LED conversion kit', ur: 'ایل ای ڈی کنورژن کٹ', 'ur-roman': 'LED conversion kit' } },
      { label: { en: 'Socket', ur: 'ساکٹ', 'ur-roman': 'Socket' }, value: { en: 'H11', ur: 'H11', 'ur-roman': 'H11' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '2 bulbs with drivers', ur: '2 بلب بمعہ ڈرائیورز', 'ur-roman': '2 bulbs with drivers' } }
    ],
    desc: {
      en: 'Compact solid-state LED headlight assembly with heat-sink base and integrated driver module.',
      ur: 'ہیٹ سنک بیس اور انٹیگریٹڈ ڈرائیور کے ساتھ سفید روشنی دینے والی ایل ای ڈی ہیڈ لائٹ کٹ۔',
      'ur-roman': 'Heat sink base aur driver ke sath crisp beam output wali LED headlight kit.'
    }
  },
  {
    code: 'LGT-03',
    name: { en: 'ClearView Tail Light Assembly (Right)', ur: 'کلیئر ویو ٹیل لائٹ اسمبلی (دائیں)', 'ur-roman': 'ClearView Tail Light Assembly (Right)' },
    cat: 'electrical-lighting',
    brand: 'clearview',
    price: 5400,
    sale: null,
    stock: 0,
    feat: false,
    fit: 'S',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Rear tail lamp assembly', ur: 'ریئر ٹیل لیمپ اسمبلی', 'ur-roman': 'Rear tail lamp assembly' } },
      { label: { en: 'Side', ur: 'سائیڈ', 'ur-roman': 'Side' }, value: { en: 'Right', ur: 'دائیں', 'ur-roman': 'Right' } }
    ],
    desc: {
      en: 'Moulded polycarbonate rear signal housing with pre-installed reflective lenses and wiring harness.',
      ur: 'ریفلیکٹر لینز اور وائرنگ کے ساتھ دائیں جانب کی پچھلی اشارہ و بریک لائٹ باڈی۔',
      'ur-roman': 'Right side indicator aur brake light ke liye moulded rear tail lamp housing.'
    }
  },
  {
    code: 'WPR-01',
    name: { en: 'ClearView Flat Wiper Blade 22in', ur: 'کلیئر ویو فلیٹ وائپر بلیڈ 22 انچ', 'ur-roman': 'ClearView Flat Wiper Blade 22in' },
    cat: 'wipers',
    brand: 'clearview',
    price: 900,
    sale: null,
    stock: 50,
    feat: true,
    fit: 'U',
    specs: [
      { label: { en: 'Length', ur: 'لمبائی', 'ur-roman': 'Length' }, value: { en: '22 in', ur: '22 انچ', 'ur-roman': '22 in' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Flat blade', ur: 'فلیٹ بلیڈ', 'ur-roman': 'Flat blade' } }
    ],
    desc: {
      en: 'Aerodynamic frameless windscreen wiper with rubber edge designed for streak-free rain clearing.',
      ur: 'بارش میں ونڈ اسکرین صاف رکھنے کے لیے ایئرو ڈائنامک فریم لیس ربر وائپر بلیڈ۔',
      'ur-roman': 'Baarish mein windscreen saaf rakhne ke liye frameless rubber wiper blade.'
    }
  },
  {
    code: 'WPR-02',
    name: { en: 'ClearView Wiper Blade Pair 24in + 16in', ur: 'کلیئر ویو وائپر بلیڈ جوڑا 24 انچ + 16 انچ', 'ur-roman': 'ClearView Wiper Blade Pair 24in + 16in' },
    cat: 'wipers',
    brand: 'clearview',
    price: 1700,
    sale: null,
    stock: 28,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Sizes', ur: 'سائزز', 'ur-roman': 'Sizes' }, value: { en: '24 in + 16 in', ur: '24 انچ + 16 انچ', 'ur-roman': '24 in + 16 in' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Flat blade pair', ur: 'فلیٹ بلیڈ جوڑا', 'ur-roman': 'Flat blade pair' } }
    ],
    desc: {
      en: 'Matched driver and passenger wiper blade set pre-assembled with common hook adapters.',
      ur: 'ڈرائیور اور پیسنجر سائیڈ کے لیے ہک اڈاپٹر کے ساتھ دو عدد وائپر بلیڈز کا سیٹ۔',
      'ur-roman': 'Driver aur passenger sides ke liye hook adapters ke sath wiper blades ka pair.'
    }
  },
  {
    code: 'WPR-03',
    name: { en: 'ClearView Windshield Washer Fluid 1L', ur: 'کلیئر ویو ونڈ شیلڈ واشر فلوئڈ 1L', 'ur-roman': 'ClearView Windshield Washer Fluid 1L' },
    cat: 'wipers',
    brand: 'clearview',
    price: 550,
    sale: null,
    stock: 70,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Ready-to-use washer fluid', ur: 'ریڈی ٹو یوز واشر فلوئڈ', 'ur-roman': 'Ready-to-use washer fluid' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '1 L', ur: '1 لیٹر', 'ur-roman': '1 L' } }
    ],
    desc: {
      en: 'Mild glass cleaning solution intended for vehicle washer reservoirs to clear road spray and bug marks.',
      ur: 'شیشے سے مٹی اور نشانات صاف کرنے کے لیے واشر ٹینکی میں ڈالنے والا محلول۔',
      'ur-roman': 'Windscreen se dirt aur spots saaf karne ke liye ready-to-use washer bottle fluid.'
    }
  },
  {
    code: 'SUS-01',
    name: { en: 'TorqueWorks Front Shock Absorber (Each)', ur: 'ٹارک ورکس فرنٹ شاک ایبزاربر (فی عدد)', 'ur-roman': 'TorqueWorks Front Shock Absorber (Each)' },
    cat: 'suspension-steering',
    brand: 'torqueworks',
    price: 6800,
    sale: null,
    stock: 12,
    feat: true,
    fit: 'S',
    specs: [
      { label: { en: 'Position', ur: 'پوزیشن', 'ur-roman': 'Position' }, value: { en: 'Front', ur: 'سامنے', 'ur-roman': 'Front' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Gas shock absorber', ur: 'گیس شاک ایبزاربر', 'ur-roman': 'Gas shock absorber' } },
      { label: { en: 'Sold', ur: 'فروخت', 'ur-roman': 'Sold' }, value: { en: 'Each', ur: 'فی عدد', 'ur-roman': 'Each' } }
    ],
    desc: {
      en: 'Twin-tube hydraulic gas damper intended to absorb road impacts and support front suspension stability.',
      ur: 'سڑک کے جھٹکوں کو جذب کرنے اور فرنٹ سسپنشن کو مستحکم رکھنے کے لیے گیس ڈیمپر۔',
      'ur-roman': 'Road bumps ko absorb karne aur front suspension stability ke liye gas shock absorber.'
    }
  },
  {
    code: 'SUS-02',
    name: { en: 'TorqueWorks Stabilizer Link Pair', ur: 'ٹارک ورکس اسٹیبلائزر لنک جوڑا', 'ur-roman': 'TorqueWorks Stabilizer Link Pair' },
    cat: 'suspension-steering',
    brand: 'torqueworks',
    price: 2300,
    sale: null,
    stock: 22,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Stabilizer (sway bar) link', ur: 'اسٹیبلائزر لنک', 'ur-roman': 'Stabilizer (sway bar) link' } },
      { label: { en: 'Sold', ur: 'فروخت', 'ur-roman': 'Sold' }, value: { en: 'Pair', ur: 'جوڑا', 'ur-roman': 'Pair' } }
    ],
    desc: {
      en: 'Front sway bar connection rods equipped with sealed ball joints for body roll mitigation.',
      ur: 'موڑ کاٹتے وقت باڈی کو جھکاؤ سے محفوظ رکھنے والے اسٹیبلائزر راڈ لنکس کا جوڑا۔',
      'ur-roman': 'Turns par body roll kam karne ke liye sealed joints walay sway bar links pair.'
    }
  },
  {
    code: 'SUS-03',
    name: { en: 'TorqueWorks Tie Rod End (Each)', ur: 'ٹارک ورکس ٹائی راڈ اینڈ (فی عدد)', 'ur-roman': 'TorqueWorks Tie Rod End (Each)' },
    cat: 'suspension-steering',
    brand: 'torqueworks',
    price: 1900,
    sale: null,
    stock: 5,
    feat: false,
    fit: 'H',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Tie rod end', ur: 'ٹائی راڈ اینڈ', 'ur-roman': 'Tie rod end' } },
      { label: { en: 'Sold', ur: 'فروخت', 'ur-roman': 'Sold' }, value: { en: 'Each', ur: 'فی عدد', 'ur-roman': 'Each' } }
    ],
    desc: {
      en: 'Steering rack linkage terminal joint manufactured with threaded steel shaft and dust boot.',
      ur: 'اسٹیئرنگ ریک اور وہیل ہب کو درست زاویے پر جوڑنے والا اسٹیل ٹائی راڈ اینڈ۔',
      'ur-roman': 'Steering rack linkage ke liye threaded shaft aur dust boot wala tie rod end.'
    }
  },
  {
    code: 'ACP-01',
    name: { en: 'CoolFlow AC Gas Refill Kit', ur: 'کول فلو اے سی گیس ری فل کٹ', 'ur-roman': 'CoolFlow AC Gas Refill Kit' },
    cat: 'ac-cooling',
    brand: 'coolflow',
    price: 4800,
    sale: null,
    stock: 18,
    feat: true,
    fit: 'U',
    specs: [
      { label: { en: 'Contents', ur: 'مشمولات', 'ur-roman': 'Contents' }, value: { en: 'Refrigerant can, hose and gauge', ur: 'ریفریجرینٹ کین، ہوز اور گیج', 'ur-roman': 'Refrigerant can, hose and gauge' } },
      { label: { en: 'Use', ur: 'استعمال', 'ur-roman': 'Use' }, value: { en: 'Top-up service', ur: 'ٹاپ اپ سروس', 'ur-roman': 'Top-up service' } }
    ],
    desc: {
      en: 'Vehicle air conditioning refrigerant top-up bottle bundled with low-pressure charging hose and pressure gauge.',
      ur: 'کار اے سی سسٹم میں گیس کی سطح بحال کرنے کے لیے ریفریجرینٹ کین اور پریشر گیج کٹ۔',
      'ur-roman': 'Car AC cooling circuit mein pressure restore karne ke liye refrigerant aur gauge kit.'
    }
  },
  {
    code: 'ACP-02',
    name: { en: 'CoolFlow AC Condenser Fan Motor', ur: 'کول فلو اے سی کنڈینسر فین موٹر', 'ur-roman': 'CoolFlow AC Condenser Fan Motor' },
    cat: 'ac-cooling',
    brand: 'coolflow',
    price: 9500,
    sale: null,
    stock: 7,
    feat: false,
    fit: 'S',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Condenser fan motor', ur: 'کنڈینسر فین موٹر', 'ur-roman': 'Condenser fan motor' } },
      { label: { en: 'Voltage', ur: 'وولٹیج', 'ur-roman': 'Voltage' }, value: { en: '12V', ur: '12 وولٹ', 'ur-roman': '12V' } }
    ],
    desc: {
      en: 'Direct-current auxiliary cooling fan motor designed to draw ambient air over the condenser core.',
      ur: 'اے سی کنڈینسر کے درجہ حرارت کو اعتدال پر رکھنے کے لیے 12 وولٹ کولنگ فین موٹر۔',
      'ur-roman': 'AC condenser se heat nikalne ke liye 12V auxiliary condenser fan motor.'
    }
  },
  {
    code: 'ACP-03',
    name: { en: 'CoolFlow Cabin Blower Motor', ur: 'کول فلو کیبن بلور موٹر', 'ur-roman': 'CoolFlow Cabin Blower Motor' },
    cat: 'ac-cooling',
    brand: 'coolflow',
    price: 6700,
    sale: 7200,
    stock: 10,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Cabin blower motor', ur: 'کیبن بلور موٹر', 'ur-roman': 'Cabin blower motor' } },
      { label: { en: 'Voltage', ur: 'وولٹیج', 'ur-roman': 'Voltage' }, value: { en: '12V', ur: '12 وولٹ', 'ur-roman': '12V' } }
    ],
    desc: {
      en: 'Interior climate control ventilation fan responsible for moving heated or air-conditioned air into cabin vents.',
      ur: 'ڈیش بورڈ گرلز کے ذریعے کیبن کے اندر ہوا پہنچانے والی 12 وولٹ بلور موٹر۔',
      'ur-roman': 'Cabin vents ke zariye thandi ya garm hawa circulate karne wali blower fan motor.'
    }
  },
  {
    code: 'ELC-01',
    name: { en: 'VoltEdge Iridium Spark Plug Set (4 pcs)', ur: 'وولٹ ایج اریڈیم اسپارک پلگ سیٹ (4 عدد)', 'ur-roman': 'VoltEdge Iridium Spark Plug Set (4 pcs)' },
    cat: 'engine-parts',
    brand: 'voltedge',
    price: 4600,
    sale: null,
    stock: 25,
    feat: true,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Iridium spark plugs', ur: 'اریڈیم اسپارک پلگز', 'ur-roman': 'Iridium spark plugs' } },
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '4 pcs', ur: '4 عدد', 'ur-roman': '4 pcs' } }
    ],
    desc: {
      en: 'Fine-wire iridium tip spark plugs built for reliable combustion ignition in four-cylinder petrol engines.',
      ur: 'چار سلنڈر پیٹرول انجنوں میں یکساں اگنیشن کے لیے اریڈیم ٹپ اسپارک پلگز۔',
      'ur-roman': 'Chaar-cylinder petrol engines mein ignition spark ke liye fine-wire iridium plugs.'
    }
  },
  {
    code: 'ELC-02',
    name: { en: 'VoltEdge Ignition Coil', ur: 'وولٹ ایج اگنیشن کوائل', 'ur-roman': 'VoltEdge Ignition Coil' },
    cat: 'engine-parts',
    brand: 'voltedge',
    price: 3900,
    sale: null,
    stock: 16,
    feat: false,
    fit: 'S',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Ignition coil', ur: 'اگنیشن کوائل', 'ur-roman': 'Ignition coil' } },
      { label: { en: 'Voltage', ur: 'وولٹیج', 'ur-roman': 'Voltage' }, value: { en: '12V', ur: '12 وولٹ', 'ur-roman': '12V' } }
    ],
    desc: {
      en: 'Direct ignition transformer boot supplying high secondary voltage straight to the combustion spark plug.',
      ur: 'اسپارک پلگ کو مطلوبہ ہائی وولٹیج فراہم کرنے والی انفرادی اگنیشن کوائل۔',
      'ur-roman': 'Spark plug tak high secondary voltage deliver karne wali individual ignition coil.'
    }
  },
  {
    code: 'ELC-03',
    name: { en: 'VoltEdge Fuse & Relay Assortment Kit', ur: 'وولٹ ایج فیوز اور ریلے کٹ', 'ur-roman': 'VoltEdge Fuse & Relay Assortment Kit' },
    cat: 'engine-parts',
    brand: 'voltedge',
    price: 1200,
    sale: null,
    stock: 40,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Contents', ur: 'مشمولات', 'ur-roman': 'Contents' }, value: { en: 'Assorted fuses and relays', ur: 'مختلف ایمپیئر فیوز اور ریلے', 'ur-roman': 'Assorted fuses and relays' } },
      { label: { en: 'Case', ur: 'ڈبہ', 'ur-roman': 'Case' }, value: { en: 'Organiser box', ur: 'آرگنائزر بکس', 'ur-roman': 'Organiser box' } }
    ],
    desc: {
      en: 'Multi-amperage mini automotive blade fuse set packed in a clear partitioned plastic container.',
      ur: 'گاڑی کے برقی سرکٹس کے تحفظ کے لیے مختلف ایمپیئر کے بلیڈ فیوز اور ریلے باکس۔',
      'ur-roman': 'Car electrical circuits ki hifazat ke liye multi-amperage blade fuses aur relay kit.'
    }
  },
  {
    code: 'BLT-01',
    name: { en: 'FlexDrive Timing Belt Kit', ur: 'فلیکس ڈرائیو ٹائمنگ بیلٹ کٹ', 'ur-roman': 'FlexDrive Timing Belt Kit' },
    cat: 'belts-cooling',
    brand: 'flexdrive',
    price: 7900,
    sale: null,
    stock: 11,
    feat: false,
    fit: 'S',
    specs: [
      { label: { en: 'Contents', ur: 'مشمولات', 'ur-roman': 'Contents' }, value: { en: 'Timing belt, tensioner, idler', ur: 'ٹائمنگ بیلٹ، ٹینشنر، آئیڈلر', 'ur-roman': 'Timing belt, tensioner, idler' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Kit', ur: 'کٹ', 'ur-roman': 'Kit' } }
    ],
    desc: {
      en: 'Engine timing synchronisation package including toothed drive belt and matching tensioner pulley.',
      ur: 'کیم شافٹ اور کرینک شافٹ ٹائمنگ کو ہم آہنگ رکھنے کے لیے ٹائمنگ بیلٹ اور ٹینشنر بیرنگ کٹ۔',
      'ur-roman': 'Camshaft aur crankshaft timing sync ke liye toothed timing belt aur tensioner kit.'
    }
  },
  {
    code: 'BLT-02',
    name: { en: 'FlexDrive Serpentine Drive Belt', ur: 'فلیکس ڈرائیو سرپنٹائن ڈرائیو بیلٹ', 'ur-roman': 'FlexDrive Serpentine Drive Belt' },
    cat: 'belts-cooling',
    brand: 'flexdrive',
    price: 2200,
    sale: null,
    stock: 26,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Serpentine (ribbed) drive belt', ur: 'سرپنٹائن (ربڈ) ڈرائیو بیلٹ', 'ur-roman': 'Serpentine (ribbed) drive belt' } }
    ],
    desc: {
      en: 'Multi-ribbed accessory drive belt connecting the engine crankshaft pulley to alternator and water pump.',
      ur: 'الٹرنیٹر اور واٹر پمپ چلانے کے لیے معیاری ربڑ سے تیار شدہ ریبڈ فین بیلٹ۔',
      'ur-roman': 'Alternator aur water pump chalane ke liye multi-ribbed accessory fan belt.'
    }
  },
  {
    code: 'BLT-03',
    name: { en: 'CoolFlow Thermostat with Gasket', ur: 'کول فلو تھرموسٹیٹ والو بمعہ گیسکٹ', 'ur-roman': 'CoolFlow Thermostat with Gasket' },
    cat: 'belts-cooling',
    brand: 'coolflow',
    price: 1350,
    sale: null,
    stock: 19,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Contents', ur: 'مشمولات', 'ur-roman': 'Contents' }, value: { en: 'Thermostat with gasket', ur: 'تھرموسٹیٹ بمعہ گیسکٹ', 'ur-roman': 'Thermostat with gasket' } }
    ],
    desc: {
      en: 'Temperature-sensitive coolant flow valve supplied with sealing rubber gasket ring.',
      ur: 'انجن کے آپریٹنگ درجہ حرارت کو کنٹرول کرنے والا تھرموسٹیٹ والو بمعہ ربڑ گیسکٹ۔',
      'ur-roman': 'Engine temperature regulate karne ke liye coolant flow thermostat valve with seal.'
    }
  },
  {
    code: 'EXH-01',
    name: { en: 'SilentFlow Rear Muffler (Silencer)', ur: 'سائلنٹ فلو ریئر مفلر (سائلنسر)', 'ur-roman': 'SilentFlow Rear Muffler (Silencer)' },
    cat: 'exhaust-intake',
    brand: 'silentflow',
    price: 8500,
    sale: null,
    stock: 8,
    feat: false,
    fit: 'S',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Rear muffler', ur: 'ریئر مفلر', 'ur-roman': 'Rear muffler' } },
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Steel', ur: 'اسٹیل', 'ur-roman': 'Steel' } }
    ],
    desc: {
      en: 'Acoustic baffle chamber welded from corrosion-resistant steel to dampen engine exhaust pulsation noise.',
      ur: 'ایگزاسٹ کی آواز کو مدہم اور پرسکون رکھنے کے لیے مضبوط اسٹیل سے بنا پچھلا سائلنسر۔',
      'ur-roman': 'Exhaust sound ko control aur quiet rakhne ke liye steel acoustic rear muffler.'
    }
  },
  {
    code: 'EXH-02',
    name: { en: 'SilentFlow Exhaust Flex Pipe', ur: 'سائلنٹ فلو ایگزاسٹ فلیکس پائپ', 'ur-roman': 'SilentFlow Exhaust Flex Pipe' },
    cat: 'exhaust-intake',
    brand: 'silentflow',
    price: 3200,
    sale: null,
    stock: 13,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Flexible exhaust pipe', ur: 'لچکدار ایگزاسٹ پائپ', 'ur-roman': 'Flexible exhaust pipe' } },
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Braided steel', ur: 'بریڈڈ اسٹیل', 'ur-roman': 'Braided steel' } }
    ],
    desc: {
      en: 'Braided stainless steel flex section designed to isolate engine movement from the rigid exhaust line.',
      ur: 'انجن کی وائبریشن کو سائلنسر لائن تک پہنچنے سے روکنے کے لیے لچکدار فلیکس پائپ۔',
      'ur-roman': 'Engine vibration ko exhaust line se alag rakhne ke liye braided steel flex section.'
    }
  },
  {
    code: 'EXH-03',
    name: { en: 'SilentFlow Oxygen Sensor', ur: 'سائلنٹ فلو آکسیجن سینسر', 'ur-roman': 'SilentFlow Oxygen Sensor' },
    cat: 'exhaust-intake',
    brand: 'silentflow',
    price: 6100,
    sale: null,
    stock: 9,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Oxygen (lambda) sensor', ur: 'آکسیجن (لیمبڈا) سینسر', 'ur-roman': 'Oxygen (lambda) sensor' } },
      { label: { en: 'Wires', ur: 'تاریں', 'ur-roman': 'Wires' }, value: { en: '4', ur: '4', 'ur-roman': '4' } }
    ],
    desc: {
      en: 'Four-wire exhaust manifold lambda sensor communicating fuel-air ratio feedback to the engine control unit.',
      ur: 'ای سی یو کو فیول اور ایئر مکسچر کا ڈیٹا فراہم کرنے والا 4 وائر آکسیجن سینسر۔',
      'ur-roman': 'Engine computer ko air-fuel mixture feedback dene wala 4-wire oxygen sensor.'
    }
  },
  {
    code: 'BDY-01',
    name: { en: 'BodyCraft Side Mirror (Right)', ur: 'باڈی کرافٹ سائیڈ مرر (دائیں)', 'ur-roman': 'BodyCraft Side Mirror (Right)' },
    cat: 'body-exterior-accessories',
    brand: 'bodycraft',
    price: 3400,
    sale: null,
    stock: 10,
    feat: false,
    fit: 'H',
    specs: [
      { label: { en: 'Side', ur: 'سائیڈ', 'ur-roman': 'Side' }, value: { en: 'Right', ur: 'دائیں', 'ur-roman': 'Right' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Manual adjust side mirror', ur: 'دستی ایڈجسٹ سائیڈ مرر', 'ur-roman': 'Manual adjust side mirror' } }
    ],
    desc: {
      en: 'Exterior door mirror with clear optical glass and black finish unpainted plastic housing.',
      ur: 'درست سائیڈ ویو کے لیے بلیک باڈی والا مینوئل ایڈجسٹمنٹ سائیڈ مرر۔',
      'ur-roman': 'Clear rear view ke liye unpainted plastic housing wala manual adjust side mirror.'
    }
  },
  {
    code: 'BDY-02',
    name: { en: 'BodyCraft Mud Flap Set (4 pcs)', ur: 'باڈی کرافٹ مڈ فلیپ سیٹ (4 عدد)', 'ur-roman': 'BodyCraft Mud Flap Set (4 pcs)' },
    cat: 'body-exterior-accessories',
    brand: 'bodycraft',
    price: 2100,
    sale: null,
    stock: 20,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Pieces', ur: 'تعداد', 'ur-roman': 'Pieces' }, value: { en: '4', ur: '4', 'ur-roman': '4' } },
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Moulded plastic', ur: 'مولڈڈ پلاسٹک', 'ur-roman': 'Moulded plastic' } }
    ],
    desc: {
      en: 'Flexible contoured wheel arch splash guards designed to prevent road mud and gravel spray.',
      ur: 'پہیوں سے اچھلنے والی کیچڑ اور پتھروں سے باڈی کو محفوظ رکھنے والے مڈ فلیپس۔',
      'ur-roman': 'Wheels se mud aur pathar uchhalne se body panel ko mehfooz rakhne walay mud flaps.'
    }
  },
  {
    code: 'BDY-03',
    name: { en: 'BodyCraft Chrome Door Handle Cover Set', ur: 'باڈی کرافٹ کروم ڈور ہینڈل کور سیٹ', 'ur-roman': 'BodyCraft Chrome Door Handle Cover Set' },
    cat: 'body-exterior-accessories',
    brand: 'bodycraft',
    price: 1300,
    sale: null,
    stock: 33,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Pieces', ur: 'تعداد', 'ur-roman': 'Pieces' }, value: { en: '4 handle covers', ur: '4 ہینڈل کورز', 'ur-roman': '4 handle covers' } },
      { label: { en: 'Finish', ur: 'فنش', 'ur-roman': 'Finish' }, value: { en: 'Chrome', ur: 'کروم', 'ur-roman': 'Chrome' } }
    ],
    desc: {
      en: 'Decorative electroplated exterior handle trims featuring pre-applied adhesive backing.',
      ur: 'دروازوں کے ہینڈلز کی خوبصورتی اور خراشوں سے تحفظ کے لیے کروم کور سیٹ۔',
      'ur-roman': 'Door handles ki decoration aur scratches se protection ke liye chrome handle covers.'
    }
  },
  {
    code: 'SCM-01',
    name: { en: 'CozyRide Leatherette Seat Cover Set (Full)', ur: 'کوزی رائڈ لیدرٹ سیٹ کور سیٹ (مکمل)', 'ur-roman': 'CozyRide Leatherette Seat Cover Set (Full)' },
    cat: 'seat-covers-mats',
    brand: 'cozyride',
    price: 16900,
    sale: 18500,
    stock: 5,
    feat: true,
    fit: 'S',
    specs: [
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Leatherette', ur: 'لیدرٹ', 'ur-roman': 'Leatherette' } },
      { label: { en: 'Coverage', ur: 'کوریج', 'ur-roman': 'Coverage' }, value: { en: 'Full set', ur: 'مکمل سیٹ', 'ur-roman': 'Full set' } },
      { label: { en: 'Colour', ur: 'رنگ', 'ur-roman': 'Colour' }, value: { en: 'Black with orange stitching', ur: 'سیاہ بمعہ نارنجی سلائی', 'ur-roman': 'Black with orange stitching' } }
    ],
    desc: {
      en: 'Full vehicle tailored seat upholstery set crafted from wipe-clean faux leather with contrast stitching.',
      ur: 'گاڑی کی اگلی اور پچھلی سیٹوں کے لیے صاف کرنے میں آسان پائیدار لیدرٹ سیٹ کورز۔',
      'ur-roman': 'Gaari ki seats ke liye wipe-clean durable leatherette seat cover set.'
    }
  },
  {
    code: 'SCM-02',
    name: { en: 'CozyRide Rubber Floor Mat Set (5 pcs)', ur: 'کوزی رائڈ ربر فلور میٹ سیٹ (5 عدد)', 'ur-roman': 'CozyRide Rubber Floor Mat Set (5 pcs)' },
    cat: 'seat-covers-mats',
    brand: 'cozyride',
    price: 4200,
    sale: null,
    stock: 25,
    feat: false,
    fit: 'A',
    specs: [
      { label: { en: 'Pieces', ur: 'تعداد', 'ur-roman': 'Pieces' }, value: { en: '5', ur: '5', 'ur-roman': '5' } },
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Rubber', ur: 'ربر', 'ur-roman': 'Rubber' } },
      { label: { en: 'Colour', ur: 'رنگ', 'ur-roman': 'Colour' }, value: { en: 'Black', ur: 'سیاہ', 'ur-roman': 'Black' } }
    ],
    desc: {
      en: 'Deep-channel washable floor liners for cabin footwells designed to trap moisture, sand, and dust.',
      ur: 'پاؤں کی مٹی، ریت اور پانی کو فرش کے کارپٹ تک پہنچنے سے روکنے والے واش ایبل ربر میٹس۔',
      'ur-roman': 'Cabin carpet ko dirt, sand aur paani se mehfooz rakhne walay washable rubber floor mats.'
    }
  },
  {
    code: 'SCM-03',
    name: { en: 'CozyRide Steering Wheel Cover', ur: 'کوزی رائڈ اسٹیرنگ ویل کور', 'ur-roman': 'CozyRide Steering Wheel Cover' },
    cat: 'seat-covers-mats',
    brand: 'cozyride',
    price: 1100,
    sale: null,
    stock: 45,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Leather-look', ur: 'لیدر لک', 'ur-roman': 'Leather-look' } },
      { label: { en: 'Size', ur: 'سائز', 'ur-roman': 'Size' }, value: { en: 'Standard (38 cm)', ur: 'اسٹینڈرڈ (38 سینٹی میٹر)', 'ur-roman': 'Standard (38 cm)' } }
    ],
    desc: {
      en: 'Non-slip inner rubber ring grip cover tailored for passenger vehicle steering wheels.',
      ur: 'اسٹیرنگ ویل پر مضبوط گرفت اور دھوپ کی گرمی سے بچاؤ کے لیے نان سلپ ویل کور۔',
      'ur-roman': 'Steering wheel par comfortable non-slip grip ke liye leather-look steering cover.'
    }
  },
  {
    code: 'TOL-01',
    name: { en: 'TorqueWorks 46-Piece Socket Set', ur: 'ٹارک ورکس 46 پیس ساکٹ سیٹ', 'ur-roman': 'TorqueWorks 46-Piece Socket Set' },
    cat: 'tools-equipment',
    brand: 'torqueworks',
    price: 6900,
    sale: null,
    stock: 14,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Pieces', ur: 'تعداد', 'ur-roman': 'Pieces' }, value: { en: '46', ur: '46', 'ur-roman': '46' } },
      { label: { en: 'Drive', ur: 'ڈرائیو', 'ur-roman': 'Drive' }, value: { en: '1/4 in and 1/2 in', ur: '1/4 انچ اور 1/2 انچ', 'ur-roman': '1/4 in and 1/2 in' } },
      { label: { en: 'Case', ur: 'ڈبہ', 'ur-roman': 'Case' }, value: { en: 'Included', ur: 'شامل ہے', 'ur-roman': 'Included' } }
    ],
    desc: {
      en: 'Hand tool collection containing metric drive sockets, ratchet wrench handle, extensions, and bit holders.',
      ur: 'گاڑی کی مرمت اور بولٹ کھولنے کے لیے ریچٹ رینچ، ایکسٹینشنز اور ساکٹس کا مکمل ٹول بکس۔',
      'ur-roman': 'Automotive maintenance aur bolts ke liye ratchet wrench, extensions aur sockets tool set.'
    }
  },
  {
    code: 'TOL-02',
    name: { en: 'TorqueWorks Hydraulic Floor Jack 2 Ton', ur: 'ٹارک ورکس ہائیڈرولک فلور جیک 2 ٹن', 'ur-roman': 'TorqueWorks Hydraulic Floor Jack 2 Ton' },
    cat: 'tools-equipment',
    brand: 'torqueworks',
    price: 10900,
    sale: 11500,
    stock: 6,
    feat: true,
    fit: 'U',
    specs: [
      { label: { en: 'Capacity', ur: 'گنجائش', 'ur-roman': 'Capacity' }, value: { en: '2 ton', ur: '2 ٹن', 'ur-roman': '2 ton' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Hydraulic trolley jack', ur: 'ہائیڈرولک ٹرالی جیک', 'ur-roman': 'Hydraulic trolley jack' } }
    ],
    desc: {
      en: 'Steel hydraulic trolley jack with swivel casters and pumping lever suited for vehicle tyre changing.',
      ur: 'پہیے تبدیل کرنے اور گاڑی کو محفوظ طور پر اٹھانے کے لیے 2 ٹن ہائیڈرولک ٹرالی جیک۔',
      'ur-roman': 'Tyre changing aur workshop use ke liye 2-ton heavy-duty hydraulic trolley jack.'
    }
  },
  {
    code: 'TOL-03',
    name: { en: 'TorqueWorks 12V Portable Tyre Inflator', ur: 'ٹارک ورکس 12V پورٹیبل ٹائر انفلریٹر', 'ur-roman': 'TorqueWorks 12V Portable Tyre Inflator' },
    cat: 'tools-equipment',
    brand: 'torqueworks',
    price: 3800,
    sale: null,
    stock: 0,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Power', ur: 'پاور', 'ur-roman': 'Power' }, value: { en: '12V car socket', ur: '12 وولٹ کار ساکٹ', 'ur-roman': '12V car socket' } },
      { label: { en: 'Gauge', ur: 'گیج', 'ur-roman': 'Gauge' }, value: { en: 'Digital', ur: 'ڈیجیٹل', 'ur-roman': 'Digital' } }
    ],
    desc: {
      en: 'Compact air compressor powered via vehicle accessory outlet with digital target pressure display.',
      ur: 'گاڑی کے 12 وولٹ سگریٹ لائٹر ساکٹ سے چلنے والا ڈیجیٹل پریشر گیج ایئر کمپریسر۔',
      'ur-roman': '12V cigarette lighter socket se chalne wala portable digital tyre air compressor.'
    }
  },
  {
    code: 'CCA-01',
    name: { en: 'ShinePro Car Shampoo 1L', ur: 'شائن پرو کار شیمپو 1L', 'ur-roman': 'ShinePro Car Shampoo 1L' },
    cat: 'interior-car-care',
    brand: 'shinepro',
    price: 750,
    sale: null,
    stock: 60,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '1 L', ur: '1 لیٹر', 'ur-roman': '1 L' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Car shampoo', ur: 'کار شیمپو', 'ur-roman': 'Car shampoo' } }
    ],
    desc: {
      en: 'Neutral formulation vehicle washing liquid for dissolving road grime without stripping existing wax layers.',
      ur: 'گاڑی کی پینٹ چمک برقرار رکھتے ہوئے مٹی اور چکنائی صاف کرنے والا واشنگ شیمپو۔',
      'ur-roman': 'Paint gloss ko nuksan pohanchaye baghair dirt saaf karne wala car washing shampoo.'
    }
  },
  {
    code: 'CCA-02',
    name: { en: 'ShinePro Dashboard Polish 300ml', ur: 'شائن پرو ڈیش بورڈ پالش 300ml', 'ur-roman': 'ShinePro Dashboard Polish 300ml' },
    cat: 'interior-car-care',
    brand: 'shinepro',
    price: 650,
    sale: null,
    stock: 48,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Pack', ur: 'پیکنگ', 'ur-roman': 'Pack' }, value: { en: '300 ml', ur: '300 ملی لیٹر', 'ur-roman': '300 ml' } },
      { label: { en: 'Type', ur: 'قسم', 'ur-roman': 'Type' }, value: { en: 'Dashboard polish', ur: 'ڈیش بورڈ پالش', 'ur-roman': 'Dashboard polish' } }
    ],
    desc: {
      en: 'Interior cabin conditioning spray designed to clean plastic dashboard surfaces and leave a matte finish.',
      ur: 'ڈیش بورڈ، ڈور پینلز اور اندرونی پلاسٹک کو نیا لک دینے کے لیے انٹیریئر پالش۔',
      'ur-roman': 'Dashboard aur interior plastic parts ko clean aur shine dene ke liye aerosol polish.'
    }
  },
  {
    code: 'CCA-03',
    name: { en: 'ShinePro Microfiber Cloth Pack (6 pcs)', ur: 'شائن پرو مائیکرو فائبر کلاتھ پیک (6 عدد)', 'ur-roman': 'ShinePro Microfiber Cloth Pack (6 pcs)' },
    cat: 'interior-car-care',
    brand: 'shinepro',
    price: 900,
    sale: null,
    stock: 70,
    feat: false,
    fit: 'U',
    specs: [
      { label: { en: 'Pieces', ur: 'تعداد', 'ur-roman': 'Pieces' }, value: { en: '6', ur: '6', 'ur-roman': '6' } },
      { label: { en: 'Material', ur: 'مٹیریل', 'ur-roman': 'Material' }, value: { en: 'Microfiber', ur: 'مائیکرو فائبر', 'ur-roman': 'Microfiber' } }
    ],
    desc: {
      en: 'Lint-free soft microfibre detailing towels for vehicle drying, glass cleaning, and wax buffing.',
      ur: 'گاڑی دھونے کے بعد صفائی، گلاس پالش اور ویکس چمکانے کے لیے 6 عدد نرم مائیکرو فائبر تولیے۔',
      'ur-roman': 'Gaari drying, glass cleaning aur wax buffing ke liye 6-piece soft microfiber cloths.'
    }
  }
];

function toKebab(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'null';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function generateDemoSql() {
  let sql = `-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 5 DEMO DATA (PARTS & ACCESSORIES CATALOGUE)
-- =============================================================================
-- Content Pack: 16 Categories, 15 Fictional Brands, 48 Products.
-- Runs ONLY if public.site_settings.demo_mode = true.
-- Safe to re-run multiple times (idempotent via upserts and slug/sku matching).
-- =============================================================================

do $$
declare
  v_demo_mode boolean := false;

  -- 16 Category IDs
  v_cat_tyres uuid;
  v_cat_batteries uuid;
  v_cat_oils uuid;
  v_cat_filters uuid;
  v_cat_brakes uuid;
  v_cat_lighting uuid;
  v_cat_wipers uuid;
  v_cat_suspension uuid;
  v_cat_ac uuid;
  v_cat_ignition uuid;
  v_cat_belts uuid;
  v_cat_exhaust uuid;
  v_cat_body uuid;
  v_cat_seatcovers uuid;
  v_cat_tools uuid;
  v_cat_carcare uuid;

  -- 15 Brand IDs
  v_brand_roadmax uuid;
  v_brand_griptech uuid;
  v_brand_powercell uuid;
  v_brand_ecolube uuid;
  v_brand_airpure uuid;
  v_brand_stopwell uuid;
  v_brand_clearview uuid;
  v_brand_coolflow uuid;
  v_brand_torqueworks uuid;
  v_brand_voltedge uuid;
  v_brand_flexdrive uuid;
  v_brand_silentflow uuid;
  v_brand_bodycraft uuid;
  v_brand_shinepro uuid;
  v_brand_cozyride uuid;

  v_prod_id uuid;
begin
  select coalesce(demo_mode, false)
  into v_demo_mode
  from public.site_settings
  where id = 1;

  if not coalesce(v_demo_mode, false) then
    raise notice 'Skipping Phase 5 demo catalogue data because site_settings.demo_mode is false.';
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- 1. Ensure all 16 Categories exist with trilingual metadata & correct sort orders
  -- ---------------------------------------------------------------------------
`;

  for (const cat of CATEGORIES) {
    const nameJson = JSON.stringify(cat.name).replace(/'/g, "''");
    const descJson = JSON.stringify(cat.desc).replace(/'/g, "''");
    sql += `  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('${cat.slug}', '${nameJson}'::jsonb, '${descJson}'::jsonb, '${cat.icon}', ${cat.sort_order}, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

`;
  }

  sql += `  -- Category ID lookups
  select id into v_cat_tyres from public.product_categories where slug = 'tyres-wheels';
  select id into v_cat_batteries from public.product_categories where slug = 'batteries';
  select id into v_cat_oils from public.product_categories where slug = 'oils-lubricants';
  select id into v_cat_filters from public.product_categories where slug = 'filters';
  select id into v_cat_brakes from public.product_categories where slug = 'brakes';
  select id into v_cat_lighting from public.product_categories where slug = 'electrical-lighting';
  select id into v_cat_wipers from public.product_categories where slug = 'wipers';
  select id into v_cat_suspension from public.product_categories where slug = 'suspension-steering';
  select id into v_cat_ac from public.product_categories where slug = 'ac-cooling';
  select id into v_cat_ignition from public.product_categories where slug = 'engine-parts';
  select id into v_cat_belts from public.product_categories where slug = 'belts-cooling';
  select id into v_cat_exhaust from public.product_categories where slug = 'exhaust-intake';
  select id into v_cat_body from public.product_categories where slug = 'body-exterior-accessories';
  select id into v_cat_seatcovers from public.product_categories where slug = 'seat-covers-mats';
  select id into v_cat_tools from public.product_categories where slug = 'tools-equipment';
  select id into v_cat_carcare from public.product_categories where slug = 'interior-car-care';

  -- ---------------------------------------------------------------------------
  -- 2. Clean up old real-name demo products and brands before seeding fictional ones
  -- ---------------------------------------------------------------------------
  delete from public.products
  where is_demo = true
    and (sku not like 'DEMO-%' or sku in (
      'PAW-OIL-001', 'PAW-OIL-002', 'PAW-FLT-001', 'PAW-FLT-002', 'PAW-FLT-005', 'PAW-FLT-009',
      'PAW-BRK-001', 'PAW-BRK-002', 'PAW-SPK-001', 'PAW-IGN-001', 'PAW-BELT-001', 'PAW-SHK-001',
      'PAW-LUB-001', 'DEMO-P01', 'DEMO-P02', 'DEMO-P03', 'DEMO-P04', 'DEMO-P05'
    ) or slug in (
      'ngk-laser-iridium-spark-plug-set-4pc', 'toyota-genuine-engine-mount-rh-corolla',
      'denso-ignition-coil-suzuki-r06a-k10b', 'shell-helix-ultra-5w40-fully-synthetic-4l',
      'toyota-genuine-motor-oil-0w20-sp-4l', 'honda-genuine-cvtf-transmission-fluid-4l',
      'toyota-genuine-oil-filter-90915-yzze1', 'guard-engine-air-filter-honda-civic-x',
      'denso-carbon-cabin-ac-filter-toyota-suzuki', 'toyota-genuine-front-ceramic-brake-pads-corolla-yaris',
      'honda-genuine-front-brake-disc-rotors-pair-city-civic', 'suzuki-genuine-front-control-arm-chimta-pair-alto-wagonr',
      'denso-jhorn-power-tone-waterproof-horn-pair-12v', 'denso-multi-flow-ac-condenser-toyota-corolla',
      'toyota-genuine-super-long-life-pink-coolant-4l', 'denso-hybrid-graphite-wiper-blade-pair-universal'
    ));

  delete from public.brands
  where is_demo = true
    and slug in (
      'toyota-genuine', 'honda-genuine', 'suzuki-genuine', 'denso', 'ngk',
      'kyb', 'ags-batteries', 'shell-helix', 'guard-filters', 'general-tyre'
    );

  -- ---------------------------------------------------------------------------
  -- 3. Seed 15 Fictional Brands (is_demo = true)
  -- ---------------------------------------------------------------------------
`;

  for (const b of BRANDS) {
    sql += `  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('${b.slug}', '${b.name}', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
`;
  }

  sql += `
  select id into v_brand_roadmax from public.brands where slug = 'roadmax';
  select id into v_brand_griptech from public.brands where slug = 'griptech';
  select id into v_brand_powercell from public.brands where slug = 'powercell';
  select id into v_brand_ecolube from public.brands where slug = 'ecolube';
  select id into v_brand_airpure from public.brands where slug = 'airpure';
  select id into v_brand_stopwell from public.brands where slug = 'stopwell';
  select id into v_brand_clearview from public.brands where slug = 'clearview';
  select id into v_brand_coolflow from public.brands where slug = 'coolflow';
  select id into v_brand_torqueworks from public.brands where slug = 'torqueworks';
  select id into v_brand_voltedge from public.brands where slug = 'voltedge';
  select id into v_brand_flexdrive from public.brands where slug = 'flexdrive';
  select id into v_brand_silentflow from public.brands where slug = 'silentflow';
  select id into v_brand_bodycraft from public.brands where slug = 'bodycraft';
  select id into v_brand_shinepro from public.brands where slug = 'shinepro';
  select id into v_brand_cozyride from public.brands where slug = 'cozyride';

  -- ---------------------------------------------------------------------------
  -- 4. Seed 48 Products (SKU DEMO-..., Trilingual Names, Descriptions, Specs)
  -- ---------------------------------------------------------------------------
`;

  const catVarMap = {
    'tyres-wheels': 'v_cat_tyres',
    'batteries': 'v_cat_batteries',
    'oils-lubricants': 'v_cat_oils',
    'filters': 'v_cat_filters',
    'brakes': 'v_cat_brakes',
    'electrical-lighting': 'v_cat_lighting',
    'wipers': 'v_cat_wipers',
    'suspension-steering': 'v_cat_suspension',
    'ac-cooling': 'v_cat_ac',
    'engine-parts': 'v_cat_ignition',
    'belts-cooling': 'v_cat_belts',
    'exhaust-intake': 'v_cat_exhaust',
    'body-exterior-accessories': 'v_cat_body',
    'seat-covers-mats': 'v_cat_seatcovers',
    'tools-equipment': 'v_cat_tools',
    'interior-car-care': 'v_cat_carcare'
  };

  const brandVarMap = {
    'roadmax': 'v_brand_roadmax',
    'griptech': 'v_brand_griptech',
    'powercell': 'v_brand_powercell',
    'ecolube': 'v_brand_ecolube',
    'airpure': 'v_brand_airpure',
    'stopwell': 'v_brand_stopwell',
    'clearview': 'v_brand_clearview',
    'coolflow': 'v_brand_coolflow',
    'torqueworks': 'v_brand_torqueworks',
    'voltedge': 'v_brand_voltedge',
    'flexdrive': 'v_brand_flexdrive',
    'silentflow': 'v_brand_silentflow',
    'bodycraft': 'v_brand_bodycraft',
    'shinepro': 'v_brand_shinepro',
    'cozyride': 'v_brand_cozyride'
  };

  for (const p of PRODUCTS) {
    const sku = 'DEMO-' + p.code;
    const slug = toKebab(p.name.en);
    const catVar = catVarMap[p.cat];
    const brandVar = brandVarMap[p.brand];
    const nameJson = JSON.stringify(p.name).replace(/'/g, "''");
    const descJson = JSON.stringify(p.desc).replace(/'/g, "''");
    const specsJson = JSON.stringify(p.specs).replace(/'/g, "''");
    const compareAt = p.sale !== null ? p.sale : 'null';
    const isUniversal = p.fit === 'U';

    sql += `  -- Product ${sku}: ${p.name.en}
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    '${sku}',
    '${slug}',
    '${nameJson}'::jsonb,
    '${descJson}'::jsonb,
    '${descJson}'::jsonb,
    '${specsJson}'::jsonb,
    ${catVar},
    ${brandVar},
    'aftermarket',
    ${p.price},
    ${compareAt},
    ${p.stock},
    5,
    ${isUniversal},
    'Warranty terms are confirmed by the workshop.',
    ${p.feat},
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, ${p.stock}, 'initial', 'Initial demo stock opening balance');

`;

    // Fitment
    if (p.fit === 'U') {
      sql += `  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

`;
    } else {
      let slugFilter = '';
      if (p.fit === 'S') {
        slugFilter = "m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga')";
      } else if (p.fit === 'H') {
        slugFilter = "m.slug in ('alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz')";
      } else if (p.fit === 'A') {
        slugFilter = "m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz')";
      }

      sql += `  -- Fitment group '${p.fit}'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where ${slugFilter};

`;
    }
  }

  sql += `  raise notice 'Successfully seeded Phase 5 Content Pack: 16 categories, 15 brands, 48 products.';
end;
$$;

-- =============================================================================
-- VERIFICATION QUERIES (Check after running seed)
-- Expected counts:
--   Categories: 16 (all active)
--   Brands: 15 (all is_demo = true)
--   Products: 48 (all is_demo = true)
--   Out of stock: exactly 3 (DEMO-OIL-03, DEMO-LGT-03, DEMO-TOL-03)
--   Low stock (<= 5): exactly 3 (DEMO-OIL-02, DEMO-SUS-03, DEMO-SCM-01)
--   Featured: exactly 12
--   Sale price: exactly 8
-- =============================================================================
-- select count(*) as total_categories from public.product_categories where is_active = true;
-- select count(*) as demo_brands from public.brands where is_demo = true;
-- select count(*) as demo_products from public.products where is_demo = true;
-- select count(*) as out_of_stock from public.products where is_demo = true and stock_qty = 0;
-- select count(*) as low_stock from public.products where is_demo = true and stock_qty > 0 and stock_qty <= 5;
-- select count(*) as featured_products from public.products where is_demo = true and is_featured = true;
-- select count(*) as on_sale from public.products where is_demo = true and compare_at_price is not null and compare_at_price > price;
`;

  return sql;
}

function generateRemoveDemoSql() {
  return `-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 5 DEMO DATA REMOVAL SCRIPT
-- =============================================================================
-- Cleanly removes all Phase 5 demo products, fictional brands, fitment links,
-- images, stock movements, and categories tagged with is_demo = true.
-- Safe to re-run multiple times (idempotent).
-- =============================================================================

do $$
begin
  if to_regclass('public.stock_movements') is not null then
    delete from public.stock_movements
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.product_vehicles') is not null then
    delete from public.product_vehicles
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.product_services') is not null then
    delete from public.product_services
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.product_images') is not null then
    delete from public.product_images
    where product_id in (select id from public.products where is_demo = true);
  end if;

  if to_regclass('public.products') is not null then
    delete from public.products where is_demo = true;
  end if;

  if to_regclass('public.brands') is not null then
    delete from public.brands where is_demo = true;
  end if;

  if to_regclass('public.product_categories') is not null then
    delete from public.product_categories where is_demo = true;
  end if;

  raise notice 'Phase 5 demo catalogue data removed successfully.';
end;
$$;
`;
}

function generateApplyProductImagesSql() {
  let sql = `-- =============================================================================
-- PAK AUTO WORKS & PARTS — APPLY PRODUCT & CATEGORY IMAGES
-- =============================================================================
-- How to use:
--   1. To add real photos later, paste the direct image URLs into the LINK:
--      slots below or into the values list in this script.
--   2. Paste this file into the Supabase SQL Editor and execute.
--   3. Safe to re-run multiple times (idempotent). Empty strings ('') are ignored
--      and will NEVER overwrite existing non-empty images.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- (a) Category Images (16 Categories)
-- -----------------------------------------------------------------------------
with cat_updates (cat_slug, img_url) as (
  values
`;

  const catValues = CATEGORIES.map((c) => `    ('${c.slug}', '')`).join(',\n');
  sql += catValues + `
)
update public.product_categories c
set image_url = u.img_url,
    updated_at = now()
from cat_updates u
where c.slug = u.cat_slug
  and u.img_url is not null
  and trim(u.img_url) != '';

-- -----------------------------------------------------------------------------
-- (b) Product Primary Images (48 Products by SKU)
-- -----------------------------------------------------------------------------
with prod_updates (prod_sku, img_url) as (
  values
`;

  const prodValues = PRODUCTS.map((p) => `    ('DEMO-${p.code}', '')`).join(',\n');
  sql += prodValues + `
)
update public.products p
set updated_at = now()
from prod_updates u
where p.sku = u.prod_sku
  and u.img_url is not null
  and trim(u.img_url) != '';

-- Upsert primary gallery image rows for non-empty URLs
with prod_updates (prod_sku, img_url) as (
  values
`;

  sql += prodValues + `
)
insert into public.product_images (product_id, url, alt, sort_order, is_primary)
select
  p.id,
  u.img_url,
  p.sku,
  0,
  true
from prod_updates u
join public.products p on p.sku = u.prod_sku
where u.img_url is not null
  and trim(u.img_url) != ''
on conflict do nothing;
`;

  return sql;
}

// Generate files
const phase5DemoSql = generateDemoSql();
fs.writeFileSync(path.resolve('supabase/phase5_demo_data.sql'), phase5DemoSql);
console.log('Written supabase/phase5_demo_data.sql');

const removeDemoSql = generateRemoveDemoSql();
fs.writeFileSync(path.resolve('supabase/remove_demo_data_phase5.sql'), removeDemoSql);
console.log('Written supabase/remove_demo_data_phase5.sql');

const applyImgSql = generateApplyProductImagesSql();
fs.writeFileSync(path.resolve('supabase/apply_product_images.sql'), applyImgSql);
console.log('Written supabase/apply_product_images.sql');
