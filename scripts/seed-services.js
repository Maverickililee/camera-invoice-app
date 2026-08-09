import mongoose from 'mongoose';
import Service from '../models/Service.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/camera-invoice';

async function seedServices() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const services = [
      {
        name: 'عکاسی عروسی',
        price: 150000000,
        description: 'عکاسی کامل مراسم عروسی با تیم حرفه‌ای',
        imageUrl: ''
      },
      {
        name: 'ویرایش عکس',
        price: 5000000,
        description: 'ویرایش حرفه‌ای عکس‌ها با نرم‌افزار Lightroom',
        imageUrl: ''
      },
      {
        name: 'فیلمبرداری مراسم',
        price: 200000000,
        description: 'فیلمبرداری کامل مراسم با کیفیت 4K',
        imageUrl: ''
      },
      {
        name: 'تدوین فیلم',
        price: 30000000,
        description: 'تدوین حرفه‌ای فیلم مراسم',
        imageUrl: ''
      },
      {
        name: 'آتلیه عکاسی',
        price: 20000000,
        description: 'ساخت عکس‌های پرتره در آتلیه',
        imageUrl: ''
      }
    ];

    await Service.deleteMany({});
    await Service.insertMany(services);
    console.log('Services seeded successfully');
    console.log(`Created ${services.length} services`);
  } catch (error) {
    console.error('Error seeding services:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedServices();
