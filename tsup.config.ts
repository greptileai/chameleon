import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'bin/run.ts'],
  format: ['cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
}) 