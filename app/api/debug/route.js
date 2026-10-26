import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';
import User from '../../../models/User.js';

export async function GET(request) {
  try {
    const res = { env_ok: !!process.env.MONGODB_URI && !!process.env.JWT_SECRET };
    try {
      await connectToDatabase();
      res.db = 'ok';
      try {
        const count = await User.countDocuments();
        res.count = count;
        const users = await User.find({}).select('username').lean();
        res.users = users;
      } catch (e) {
        res.user_err = e.message;
      }
    } catch (e) {
      res.db = 'err';
      res.db_msg = e.message;
    }
    return NextResponse.json(res);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
