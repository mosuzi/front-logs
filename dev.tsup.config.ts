/**
 * To see more options: https://paka.dev/npm/tsup@6.7.0/api#3f9e3391ce3e9914
 */
import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'tsup-config',
  entry: [
    'src/index.ts',
    // 'src/browser.ts',
    'src/log-bean.ts',
    'src/log-engine.ts',
    'src/log-handler.ts',
    'src/log-request.ts'
  ],
  splitting: false,
  sourcemap: false,
  clean: true,
  target: 'es5',
  // onSuccess: () => Promise.resolve(console.log('==========built==========')),
  // minify: true,
  // terserOptions: {
  //   module: true
  // },
  watch: false,
  outDir: 'dist',
  dts: true,
  platform: 'browser',
  // external: ['@x-apaas/x-dcloud-database-api'],
  // inject: [],
  replaceNodeEnv: true,
  legacyOutput: true,
  format: ['esm', 'cjs', 'iife']
})
