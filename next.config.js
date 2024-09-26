/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals = ['googleapis', 'google-auth-library', ...config.externals];
      }
      return config;
    },
    // Add any other Next.js config options you need here
    env: {
      ROUND_NUMBER: process.env.ROUND_NUMBER,
    },
  };
  
export default nextConfig;