/** @type {import('next').NextConfig} */
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : "http://localhost:3000";
}

const nextConfig = {
  allowedDevOrigins: ['192.168.1.78'],
};

export default nextConfig;
