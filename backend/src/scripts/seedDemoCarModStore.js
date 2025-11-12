// Car-Modifications Retail Store Demo Seeder
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";
import { Sale } from "../models/sale.model.js";
import Purchase from "../models/purchase.model.js";
import RfidTag from "../models/rfidTag.model.js";
import connectDB from "../db/index.js";

const categoriesData = [
  { name: "Performance Parts", slug: "performance-parts" },
  { name: "Exterior Mods", slug: "exterior-mods" },
  { name: "Lighting", slug: "lighting" },
  { name: "Interior Accessories", slug: "interior-accessories" },
  { name: "Wheels & Tires", slug: "wheels-tires" },
  { name: "Audio Systems", slug: "audio-systems" },
  { name: "Suspension Kits", slug: "suspension-kits" },
  { name: "Detailing & Care", slug: "detailing-care" }
];

const productsData = [
  // Performance Parts
  {
    name: "K&N Cold Air Intake Kit",
    description: "Boosts horsepower and acceleration for Honda Civic.",
    retailPrice: 320,
    wholesalePrice: 270,
    wholesaleThreshold: 5,
    stock: 15,
    brand: "K&N",
    variant: "Honda Civic, Honda City",
    compatibility: "Direct Fit",
    barcode: "KN-CAI-001",
    buyingPrice: 250,
    lowStockThreshold: 3,
    categorySlug: "performance-parts"
  },
  {
    name: "Brembo Brake Pads",
    description: "High-performance brake pads for sports cars.",
    retailPrice: 180,
    wholesalePrice: 150,
    wholesaleThreshold: 8,
    stock: 20,
    brand: "Brembo",
    variant: "BMW M3, Audi RS5",
    compatibility: "Performance",
    barcode: "BR-BRAKE-006",
    buyingPrice: 120,
    lowStockThreshold: 4,
    categorySlug: "performance-parts"
  },
  // Exterior Mods
  {
    name: "Sparco Carbon Fiber Spoiler",
    description: "Aerodynamic spoiler for Toyota Corolla and Camry.",
    retailPrice: 450,
    wholesalePrice: 390,
    wholesaleThreshold: 3,
    stock: 8,
    brand: "Sparco",
    variant: "Toyota Corolla, Toyota Camry",
    compatibility: "Universal",
    barcode: "SP-SPOILER-002",
    buyingPrice: 350,
    lowStockThreshold: 2,
    categorySlug: "exterior-mods"
  },
  {
    name: "3M Window Tint",
    description: "Premium window tint for UV protection.",
    retailPrice: 90,
    wholesalePrice: 75,
    wholesaleThreshold: 12,
    stock: 40,
    brand: "3M",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "3M-TINT-007",
    buyingPrice: 60,
    lowStockThreshold: 6,
    categorySlug: "exterior-mods"
  },
  // Lighting
  {
    name: "Philips LED Headlight Kit",
    description: "Bright white LED headlights for improved night driving.",
    retailPrice: 120,
    wholesalePrice: 100,
    wholesaleThreshold: 10,
    stock: 30,
    brand: "Philips",
    variant: "All Sedan, SUV",
    compatibility: "Universal",
    barcode: "PH-LED-003",
    buyingPrice: 90,
    lowStockThreshold: 5,
    categorySlug: "lighting"
  },
  {
    name: "Osram Fog Lamps",
    description: "High-visibility fog lamps for rainy conditions.",
    retailPrice: 85,
    wholesalePrice: 70,
    wholesaleThreshold: 15,
    stock: 25,
    brand: "Osram",
    variant: "SUV, Pickup",
    compatibility: "Universal",
    barcode: "OS-FL-008",
    buyingPrice: 60,
    lowStockThreshold: 5,
    categorySlug: "lighting"
  },
  // Interior Accessories
  {
    name: "Autoform Leather Seat Covers",
    description: "Premium leather seat covers for comfort and style.",
    retailPrice: 180,
    wholesalePrice: 150,
    wholesaleThreshold: 6,
    stock: 25,
    brand: "Autoform",
    variant: "Hyundai Verna, Honda City",
    compatibility: "Custom Fit",
    barcode: "AF-SEAT-005",
    buyingPrice: 120,
    lowStockThreshold: 5,
    categorySlug: "interior-accessories"
  },
  {
    name: "GODREJ Car Organizer",
    description: "Multi-pocket organizer for car interiors.",
    retailPrice: 35,
    wholesalePrice: 28,
    wholesaleThreshold: 20,
    stock: 50,
    brand: "Godrej",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "GD-ORG-009",
    buyingPrice: 20,
    lowStockThreshold: 10,
    categorySlug: "interior-accessories"
  },
  // Wheels & Tires
  {
    name: "Michelin Pilot Sport 4 Tires",
    description: "High-performance tires for sports cars.",
    retailPrice: 200,
    wholesalePrice: 180,
    wholesaleThreshold: 4,
    stock: 20,
    brand: "Michelin",
    variant: "BMW 3 Series, Audi A4",
    compatibility: "Performance",
    barcode: "MIC-TIRE-004",
    buyingPrice: 160,
    lowStockThreshold: 4,
    categorySlug: "wheels-tires"
  },
  {
    name: "MRF ZV2K Tires",
    description: "Durable tires for Indian road conditions.",
    retailPrice: 110,
    wholesalePrice: 95,
    wholesaleThreshold: 10,
    stock: 35,
    brand: "MRF",
    variant: "Maruti Swift, Hyundai i20",
    compatibility: "Standard",
    barcode: "MRF-TIRE-010",
    buyingPrice: 80,
    lowStockThreshold: 7,
    categorySlug: "wheels-tires"
  },
  // Audio Systems
  {
    name: "Sony XAV-AX5000 Head Unit",
    description: "Touchscreen head unit with Apple CarPlay & Android Auto.",
    retailPrice: 350,
    wholesalePrice: 300,
    wholesaleThreshold: 4,
    stock: 10,
    brand: "Sony",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "SONY-HU-011",
    buyingPrice: 250,
    lowStockThreshold: 2,
    categorySlug: "audio-systems"
  },
  {
    name: "JBL Stage3 607CF Speakers",
    description: "Component speakers for crisp sound quality.",
    retailPrice: 120,
    wholesalePrice: 100,
    wholesaleThreshold: 8,
    stock: 18,
    brand: "JBL",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "JBL-SPK-012",
    buyingPrice: 80,
    lowStockThreshold: 4,
    categorySlug: "audio-systems"
  },
  // Suspension Kits
  {
    name: "Bilstein B6 Shock Absorber",
    description: "Performance shock absorber for SUVs.",
    retailPrice: 220,
    wholesalePrice: 190,
    wholesaleThreshold: 5,
    stock: 12,
    brand: "Bilstein",
    variant: "Toyota Fortuner, Ford Endeavour",
    compatibility: "Performance",
    barcode: "BIL-SUS-013",
    buyingPrice: 160,
    lowStockThreshold: 3,
    categorySlug: "suspension-kits"
  },
  {
    name: "KYB Excel-G Suspension Kit",
    description: "Reliable suspension kit for sedans.",
    retailPrice: 180,
    wholesalePrice: 155,
    wholesaleThreshold: 7,
    stock: 16,
    brand: "KYB",
    variant: "Honda Accord, Skoda Superb",
    compatibility: "Standard",
    barcode: "KYB-SUS-014",
    buyingPrice: 130,
    lowStockThreshold: 4,
    categorySlug: "suspension-kits"
  },
  // Detailing & Care
  {
    name: "Meguiar's Ultimate Polish",
    description: "Premium polish for a glossy finish.",
    retailPrice: 25,
    wholesalePrice: 20,
    wholesaleThreshold: 30,
    stock: 60,
    brand: "Meguiar's",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "MEG-POL-015",
    buyingPrice: 15,
    lowStockThreshold: 15,
    categorySlug: "detailing-care"
  },
  {
    name: "Armor All Protectant",
    description: "Protects and shines car interiors.",
    retailPrice: 18,
    wholesalePrice: 15,
    wholesaleThreshold: 40,
    stock: 80,
    brand: "Armor All",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "ARM-PRO-016",
    buyingPrice: 10,
    lowStockThreshold: 20,
    categorySlug: "detailing-care"
  }
];

const vendors = [
  { name: "Speedy Auto Supplies", contact: "9876543210" },
  { name: "ModZone Distributors", contact: "9123456789" },
  { name: "AutoHub Traders", contact: "9812345678" },
  { name: "CarePro Imports", contact: "9765432101" }
];

const additionalProducts = [
  {
    name: "Car Air Freshener",
    description: "Long-lasting fragrance for car interiors.",
    retailPrice: 10,
    wholesalePrice: 8,
    wholesaleThreshold: 50,
    stock: 200,
    brand: "Ambi Pur",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "AP-FRESH-001",
    buyingPrice: 6,
    lowStockThreshold: 20,
    categorySlug: "interior-accessories"
  },
  {
    name: "Dashboard Polish",
    description: "Protects and shines dashboards.",
    retailPrice: 15,
    wholesalePrice: 12,
    wholesaleThreshold: 40,
    stock: 150,
    brand: "Armor All",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "AA-POLISH-002",
    buyingPrice: 10,
    lowStockThreshold: 15,
    categorySlug: "interior-accessories"
  },
  {
    name: "Car Vacuum Cleaner",
    description: "Compact vacuum cleaner for car interiors.",
    retailPrice: 50,
    wholesalePrice: 45,
    wholesaleThreshold: 10,
    stock: 30,
    brand: "Black+Decker",
    variant: "All Cars",
    compatibility: "Universal",
    barcode: "BD-VAC-003",
    buyingPrice: 40,
    lowStockThreshold: 5,
    categorySlug: "interior-accessories"
  }
];

productsData.push(...additionalProducts);

async function seedDemoData() {
  await connectDB();
  await Category.deleteMany();
  await Product.deleteMany();
  await Sale.deleteMany();
  await Purchase.deleteMany();
  await RfidTag.deleteMany();

  // Seed categories
  const categories = await Category.insertMany(categoriesData);
  const categoryMap = {};
  categories.forEach(cat => categoryMap[cat.slug] = cat._id);

  // Seed products
  const productsToInsert = productsData.map(p => ({
    ...p,
    category: categoryMap[p.categorySlug]
  }));
  const products = await Product.insertMany(productsToInsert);

  await RfidTag.create({
    tagId: "TEST_TAG_123",
    productId: products[0]._id,
    status: "active",
  });

  // Seed purchases
  let purchasesData = [
    // Existing purchases
    {
      purchasedProducts: [
        { productId: products[0]._id, quantity: 10 },
        { productId: products[2]._id, quantity: 20 },
        { productId: products[8]._id, quantity: 5 }
      ],
      saleCost: 3400,
      vendorCompanyName: vendors[0].name,
      vendorContact: vendors[0].contact,
      purchaseDate: new Date(Date.now() - 30*24*60*60*1000),
      shelfLife: "2 years"
    },
    {
      purchasedProducts: [
        { productId: products[1]._id, quantity: 5 },
        { productId: products[3]._id, quantity: 10 },
        { productId: products[12]._id, quantity: 8 }
      ],
      saleCost: 3900,
      vendorCompanyName: vendors[1].name,
      vendorContact: vendors[1].contact,
      purchaseDate: new Date(Date.now() - 15*24*60*60*1000),
      shelfLife: "3 years"
    },
    {
      purchasedProducts: [
        { productId: products[4]._id, quantity: 12 },
        { productId: products[6]._id, quantity: 7 }
      ],
      saleCost: 2100,
      vendorCompanyName: vendors[2].name,
      vendorContact: vendors[2].contact,
      purchaseDate: new Date(Date.now() - 7*24*60*60*1000),
      shelfLife: "1 year"
    },
    {
      purchasedProducts: [
        { productId: products[10]._id, quantity: 20 },
        { productId: products[14]._id, quantity: 30 }
      ],
      saleCost: 1200,
      vendorCompanyName: vendors[3].name,
      vendorContact: vendors[3].contact,
      purchaseDate: new Date(Date.now() - 3*24*60*60*1000),
      shelfLife: "6 months"
    }
  ];
  purchasesData = purchasesData.concat(Array.from({ length: 200 }, (_, i) => ({
    purchasedProducts: [
      { productId: products[(i % products.length)]._id, quantity: Math.floor(Math.random() * 20) + 1 },
      { productId: products[(i * 2 % products.length)]._id, quantity: Math.floor(Math.random() * 15) + 1 }
    ],
    saleCost: Math.floor(Math.random() * 5000) + 500,
    vendorCompanyName: vendors[i % vendors.length].name,
    vendorContact: vendors[i % vendors.length].contact,
    purchaseDate: new Date(Date.now() - (Math.floor(Math.random() * 60) + 1) * 24 * 60 * 60 * 1000),
    shelfLife: `${Math.floor(Math.random() * 3) + 1} years`
  })));
  await Purchase.insertMany(purchasesData);

  // Seed sales
  let salesData = [
    // Existing sales
    {
      soldProducts: [
        { productId: products[0]._id, quantity: 2, unitPrice: products[0].retailPrice, totalPrice: products[0].retailPrice * 2 },
        { productId: products[2]._id, quantity: 1, unitPrice: products[2].retailPrice, totalPrice: products[2].retailPrice * 1 },
        { productId: products[8]._id, quantity: 1, unitPrice: products[8].retailPrice, totalPrice: products[8].retailPrice * 1 }
      ],
      subtotal: products[0].retailPrice*2 + products[2].retailPrice + products[8].retailPrice,
      discountType: "percentage",
      discountValue: 10,
      taxAmount: 30,
      customerName: "Rahul Sharma",
      customerContact: "9988776655",
      customerEmail: "rahul.sharma@example.com",
      customerAddress: "Delhi, India",
      paymentMethod: "upi",
      paymentStatus: "paid",
      notes: "Requested installation",
      status: "completed"
    },
    {
      soldProducts: [
        { productId: products[1]._id, quantity: 1, unitPrice: products[1].retailPrice, totalPrice: products[1].retailPrice * 1 },
        { productId: products[3]._id, quantity: 4, unitPrice: products[3].retailPrice, totalPrice: products[3].retailPrice * 4 },
        { productId: products[12]._id, quantity: 2, unitPrice: products[12].retailPrice, totalPrice: products[12].retailPrice * 2 }
      ],
      subtotal: products[1].retailPrice + products[3].retailPrice*4 + products[12].retailPrice*2,
      discountType: "fixed",
      discountValue: 50,
      taxAmount: 40,
      customerName: "Priya Verma",
      customerContact: "8877665544",
      customerEmail: "priya.verma@example.com",
      customerAddress: "Mumbai, India",
      paymentMethod: "card",
      paymentStatus: "paid",
      notes: "Express delivery",
      status: "completed"
    },
    {
      soldProducts: [
        { productId: products[4]._id, quantity: 3, unitPrice: products[4].retailPrice, totalPrice: products[4].retailPrice * 3 },
        { productId: products[6]._id, quantity: 2, unitPrice: products[6].retailPrice, totalPrice: products[6].retailPrice * 2 }
      ],
      subtotal: products[4].retailPrice*3 + products[6].retailPrice*2,
      discountType: "none",
      discountValue: 0,
      taxAmount: 15,
      customerName: "Amit Singh",
      customerContact: "9001122334",
      customerEmail: "amit.singh@example.com",
      customerAddress: "Bangalore, India",
      paymentMethod: "cash",
      paymentStatus: "paid",
      notes: "Walk-in customer",
      status: "completed"
    },
    {
      soldProducts: [
        { productId: products[10]._id, quantity: 1, unitPrice: products[10].retailPrice, totalPrice: products[10].retailPrice * 1 },
        { productId: products[14]._id, quantity: 5, unitPrice: products[14].retailPrice, totalPrice: products[14].retailPrice * 5 }
      ],
      subtotal: products[10].retailPrice + products[14].retailPrice*5,
      discountType: "percentage",
      discountValue: 5,
      taxAmount: 10,
      customerName: "Sneha Rao",
      customerContact: "9887766554",
      customerEmail: "sneha.rao@example.com",
      customerAddress: "Hyderabad, India",
      paymentMethod: "upi",
      paymentStatus: "paid",
      notes: "Requested demo",
      status: "completed"
    }
  ];
  salesData = salesData.concat(Array.from({ length: 1000 }, (_, i) => {
    const prodIdx1 = (i * 3) % products.length;
    const prodIdx2 = (i * 5) % products.length;
    const quantity1 = Math.floor(Math.random() * 5) + 1;
    const quantity2 = Math.floor(Math.random() * 3) + 1;
    return {
      soldProducts: [
        { productId: products[prodIdx1]._id, quantity: quantity1, unitPrice: products[prodIdx1].retailPrice, totalPrice: products[prodIdx1].retailPrice * quantity1 },
        { productId: products[prodIdx2]._id, quantity: quantity2, unitPrice: products[prodIdx2].retailPrice, totalPrice: products[prodIdx2].retailPrice * quantity2 }
      ],
      subtotal: products[prodIdx1].retailPrice * quantity1 + products[prodIdx2].retailPrice * quantity2,
      discountType: ["none", "percentage", "fixed"][i % 3],
      discountValue: i % 3 === 0 ? 0 : Math.floor(Math.random() * 20) + 5,
      taxAmount: Math.floor(Math.random() * 50) + 10,
      customerName: `Customer ${i + 1}`,
      customerContact: `90000000${i + 10}`,
      customerEmail: `customer${i + 1}@example.com`,
      customerAddress: ["Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai"][i % 5] + ", India",
      paymentMethod: ["upi", "card", "cash"][i % 3],
      paymentStatus: "paid",
      notes: "Auto-generated sale",
      status: "completed"
    };
  }));
  for (const sale of salesData) {
    await Sale.create(sale);
  }

  console.log("✅ Car-Modifications Retail Store demo data seeded successfully!");
  mongoose.connection.close();
}

seedDemoData().catch(e => { console.error(e); mongoose.connection.close(); });