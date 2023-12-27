/** @type {import('next').NextConfig} */
// const withInterceptStdout = require('next-intercept-stdout');
const path = require("path")

const withMDX = require('@next/mdx')()

const nextConfig = {
  webpack: (config, options) => {
    config.resolve.alias['aws-crt'] = path.resolve(__dirname, 'node_modules/aws-crt')
    return config
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
module.exports = withMDX(nextConfig)
