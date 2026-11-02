/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
    outputFileTracingIncludes: {
      "/api/haftalik-rapor-pdf": ["./lib/fonts/**"],
    },
  },
};

export default nextConfig;
