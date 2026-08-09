import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb.js';

export async function GET(request) {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    const response = {
      mongodb_uri_exists: !!MONGODB_URI,
      mongodb_uri_length: MONGODB_URI ? MONGODB_URI.length : 0,
      mongodb_uri_prefix: MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : null,
      jwt_secret_exists: !!process.env.JWT_SECRET,
      zarinpal_merchant_id_exists: !!process.env.ZARINPAL_MERCHANT_ID,
      zarinpal_mode: process.env.ZARINPAL_MODE,
    };

    // Try to connect to database
    try {
      await connectToDatabase();
      response.db_connection = 'success';
    } catch (error) {
      response.db_connection = 'failed';
      response.db_error = error.message;
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
