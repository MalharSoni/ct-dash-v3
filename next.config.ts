import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin workspace root to this directory. Without this, Turbopack walks up
  // to a parent package-lock.json (notably on Netlify's build env) and
  // hoists resolution upward, which breaks Tailwind/PostCSS module loading
  // and leaves the CSS chunk missing from the deployed CDN.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
