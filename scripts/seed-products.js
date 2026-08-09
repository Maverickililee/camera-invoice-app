import mongoose from 'mongoose';
import Product from '../models/Product.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/camera-invoice';

async function seedProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = [
      {
        name: 'دوربین Canon EOS R5',
        price: 85000000,
        description: 'دوربین حرفه‌ای با کیفیت 45 مگاپیکسل',
        imageUrl: ''
      },
      {
        name: 'لنز Canon RF 24-70mm',
        price: 42000000,
        description: 'لنز زوم استاندارد با کیفیت بالا',
        imageUrl: ''
      },
      {
        name: 'کارت حافظه CFexpress 256GB',
        price: 8500000,
        description: 'کارت حافظه پرسرعت برای فیلمبرداری',
        imageUrl: ''
      },
      {
        name: 'سه‌پایه Manfrotto',
        price: 12000000,
        description: 'سه‌پایه حرفه‌ای با پایداری بالا',
        imageUrl: ''
      },
      {
        name: 'فلش Canon Speedlite',
        price: 18000000,
        description: 'فلش حرفه‌ای با قدرت بالا',
        imageUrl: ''
      }
    ];

    await Product.deleteMany({});
    await Product.insertMany(products);
    console.log('Products seeded successfully');
    console.log(`Created ${products.length} products`);
  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
