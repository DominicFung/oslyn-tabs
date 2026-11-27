/** @type {import('next').NextConfig} */
// const withInterceptStdout = require('next-intercept-stdout');
const path = require("path")

const withMDX = require('@next/mdx')()

const nextConfig = {
  env: {
    NEXT_PUBLIC_GIT_SHA: process.env.AWS_COMMIT_ID || process.env.NEXT_PUBLIC_GIT_SHA || '',
  },
  webpack: (config, options) => {
    config.resolve.alias['aws-crt'] = path.resolve(__dirname, 'node_modules/aws-crt')
    return config
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co'
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery'
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com'
      },
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com'
      },
      {
        protocol: 'https',
        hostname: 'pbxt.replicate.delivery'
      }, 
      {
        protocol: 'https',
        hostname: 'oslynstudio-s3stack-oslynstudiobucket4f3f730f-de5ih4nnn90k.s3.amazonaws.com'
      }
    ]
  },
  reactStrictMode: false
}

// module.exports = withInterceptStdout(nextConfig, (text) => (text.includes('Critical dependency: the request of a dependency is an expression') ? '' : text))
module.exports = async () => {
  const { default: withSerwistInit } = await import("@serwist/next")
  const withSerwist = withSerwistInit({
    swSrc: "worker/index.ts",
    swDest: "public/sw.js",
    // The client only calls register() in production. Skip emitting a worker in dev.
    disable: process.env.NODE_ENV !== "production",
    register: false,
    // Coming back online should not reload a jam that is already on screen.
    reloadOnOnline: false,
    maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
  })
  return withSerwist(withMDX(nextConfig))
}
