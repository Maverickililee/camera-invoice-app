import mongoose from 'mongoose';
import {config} from 'dotenv';
import User from './models/User.js';

config({path: '.env.local'});

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('connected');
    const users = await User.find({});
    console.log(users.length);
    for (const u of users) { console.log(u.username); }
    await mongoose.disconnect();
  } catch(e) { console.error(e.message); }
}

test();
