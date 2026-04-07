import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Backend base URL — used for the /api/* edge rewrite below. Strip a trailing
// slash so the joined path doesn't end up with `//`.
const BACKEND_URL = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://grhog-api-production-0161.up.railway.app'
).replace(/\/$/, '');

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8989'
      }
    ]
  },
  transpilePackages: ['geist'],
  async rewrites() {
    // beforeFiles runs before Next.js filesystem routes, so /api/* requests
    // are forwarded to the backend at the edge and never hit a serverless
    // function. This matches how the mobile app talks to the backend and
    // sidesteps the Next.js API route handlers entirely on Vercel.
    //
    // /api/auth/* is intentionally excluded — those routes still need to run
    // through the local handlers because they set/clear the `auth-token`
    // cookie that middleware.ts checks for protected pages.
    return {
      beforeFiles: [
        {
          // Wildcard `+` modifier on the named param matches one-or-more
          // segments, so the destination's `:path*` substitution receives a
          // segment array instead of a single string with embedded slashes.
          // The custom regex excludes `/api/auth` and `/api/auth/*` so those
          // still flow through the local route handlers (which set the
          // `auth-token` cookie that middleware.ts checks).
          source: '/api/:path((?!auth$|auth/).+)+',
          destination: `${BACKEND_URL}/:path*`
        }
      ],
      afterFiles: [],
      fallback: []
    };
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerkstage.dev https://*.clerk.accounts.dev; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.com https://*.clerkstage.dev https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'self' https: http: ws: wss: http://device.grhog.mn https://*.clerk.com https://*.clerkstage.dev https://*.clerk.accounts.dev; worker-src 'self' blob: https://*.clerk.com https://*.clerkstage.dev https://*.clerk.accounts.dev; font-src 'self' data:; object-src 'none'; media-src 'self'; frame-src 'self' https://*.clerk.com https://*.clerkstage.dev https://*.clerk.accounts.dev;"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          }
        ]
      }
    ];
  }
};

let configWithPlugins = baseConfig;

// Conditionally enable Sentry configuration
if (!process.env.NEXT_PUBLIC_SENTRY_DISABLED) {
  configWithPlugins = withSentryConfig(configWithPlugins, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options
    // FIXME: Add your Sentry organization and project names
    org: process.env.NEXT_PUBLIC_SENTRY_ORG,
    project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    reactComponentAnnotation: {
      enabled: true
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Disable Sentry telemetry
    telemetry: false
  });
}

const nextConfig = configWithPlugins;
export default nextConfig;
