/**
 * To see more options: https://paka.dev/npm/tsup@6.7.0/api#3f9e3391ce3e9914
 */
import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'tsup-config',
  entry: { browser: 'src/index.ts' },
  outExtension({ format }) {
    return {
      js: '.js'
    }
  },
  splitting: false,
  sourcemap: false,
  target: 'es5',
  minify: true,
  watch: false,
  outDir: 'public',
  platform: 'browser',
  replaceNodeEnv: true,
  globalName: 'FrontLogs',
  format: ['iife']
})
