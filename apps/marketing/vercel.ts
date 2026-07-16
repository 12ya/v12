import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  installCommand: "npm install -g vite-plus && vp install --filter '@v12/marketing'",
  buildCommand: "vp run --filter @v12/marketing build",
  outputDirectory: "dist",
};
