import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import User from '../../../models/User.js';

export async function GET(request) {
  try {
    const res = { env: !!process.env.MONGODB_URI };
    try {
      await connectToDatabase();
      res.db = 'ok';
      try {
        const count = await User.countDocuments();
        res.count = count;
        res.users = await User.find({}).limit(3).lean();
      } catch (e) {
        res.ue = e.message;
      }
    } catch (e) {
      res.db = 'err';
      res.em = e.message;
    }
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
