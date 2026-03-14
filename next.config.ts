import type { NextConfig } from 'next';
import { config } from '@/lib/config';

const isWindows = process.platform === 'win32';

const nextConfig: NextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: config.app.env === 'production',
  },

  // Optimize images and assets
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Standalone output uses symlinks that often fail on Windows without elevated privileges.
  output: isWindows ? undefined : 'standalone',

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ];
  },
};

export default nextConfig;
