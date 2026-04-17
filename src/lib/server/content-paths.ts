import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = dirname(fileURLToPath(import.meta.url));

/** `src/lib/content` — course markdown, indicator source files (not publicly served). */
export const LIB_CONTENT_ROOT = join(serverDir, `..`, `content`);
