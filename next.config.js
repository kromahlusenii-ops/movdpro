/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Allow images from any property website (scraped building photos)
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google.com https://*.googleadservices.com https://*.doubleclick.net https://connect.facebook.net https://www.redditstatic.com https://*.googleapis.com https://va.vercel-scripts.com",
              "connect-src 'self' https://*.stripe.com https://*.google.com https://*.google-analytics.com https://*.googleadservices.com https://*.doubleclick.net https://*.reddit.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.googleapis.com",
              "frame-src 'self' https://*.stripe.com https://www.facebook.com https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com",
              "img-src 'self' data: https: blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
