import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["esbuild", "pdfkit"],
  },
  webpack(config) {
    const ortBrowserBundle = path.resolve(process.cwd(), "node_modules/onnxruntime-web/dist/ort.min.js");
    config.resolve.alias["onnxruntime-web$"] = ortBrowserBundle;
    config.resolve.alias["onnxruntime-web/webgpu$"] = ortBrowserBundle;
    return config;
  },
};

export default nextConfig;
