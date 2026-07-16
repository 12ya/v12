import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  installCommand: "npm install -g vite-plus && vp install --filter '@v12code/marketing'",
  buildCommand: "vp run --filter @v12code/marketing build",
  outputDirectory: "dist",
};
