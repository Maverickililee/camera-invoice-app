/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    ZARINPAL_MERCHANT_ID: process.env.ZARINPAL_MERCHANT_ID,
    ZARINPAL_MODE: process.env.ZARINPAL_MODE,
  },
}

export default nextConfig
