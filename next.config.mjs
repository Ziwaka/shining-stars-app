/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https', 
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  // GAS CORS Fix: /api/gas ကို GAS URL သို့ server-side rewrite လုပ်သည်
  // Browser → /api/gas (same origin) → GAS (server-side, no CORS)
  async rewrites() {
    return [
      {
        source: '/api/gas',
        destination:
          'https://script.google.com/macros/s/AKfycbwebk9Jh15hK4ioWmbHySroAU5mc8gRFeyHwvIHQTIX7_os13S6qQR4cXz5DtDPHVM5/exec',
      },
    ];
  },
};

export default nextConfig;
