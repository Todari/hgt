/** @type {import('next').NextConfig} */
const nextConfig = {
  // Workspace packages ship TypeScript source, so Next must transpile them.
  transpilePackages: ["@hgt-client/contract", "@hgt-client/ui"],
};

export default nextConfig;
