/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // This ensures that path aliases work in both client and server components
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Add support for path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/*': ['./*'],
    };

    return config;
  },
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
