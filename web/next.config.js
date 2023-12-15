/** @type {import('next').NextConfig} */
const withInterceptStdout = require('next-intercept-stdout');
const path = require("path")

const nextConfig = {
  webpack: (config, options) => {
    config.resolve.alias['aws-crt'] = path.resolve(__dirname, 'node_modules/aws-crt')
    return config
  },
  // async headers() {
  //   return [
  //     {
  //         // matching all API routes
  //         source: "/api/:path*",
  //         headers: [
  //             { key: "Access-Control-Allow-Credentials", value: "true" },
  //             { key: "Access-Control-Allow-Origin", value: "chrome-extension://*" }, // replace this your actual origin
  //             { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
  //             { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
  //         ]
  //     }
  //   ]
  // },
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

module.exports = withInterceptStdout(nextConfig, (text) => (text.includes('Critical dependency: the request of a dependency is an expression') ? '' : text))
