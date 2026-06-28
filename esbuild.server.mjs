// Bundle the WebSocket server (and the engine/ai/net TS it imports) into a single ESM file that
// `node` can run directly — no tsx or source tree needed in the runtime image. `ws` is bundled;
// its optional native deps are left external (ws falls back to pure JS when they're absent).
import { build } from 'esbuild'

await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile: 'dist-server/index.mjs',
  external: ['bufferutil', 'utf-8-validate'],
  banner: {
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  logLevel: 'info',
})
