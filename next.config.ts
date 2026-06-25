import { execSync } from 'child_process';
import type { NextConfig } from 'next';

const gitHash = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: '0.1.0',
    NEXT_PUBLIC_GIT_HASH: gitHash,
  },
};

export default nextConfig;
