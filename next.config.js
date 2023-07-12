/** @type {import('next').NextConfig} */
require("dotenv").config();
const nextConfig = {
  reactStrictMode: true,
  env: {
    WEB3_API_TOKEN: process.env.WEB3_API_TOKEN,
  }
}

module.exports = nextConfig
