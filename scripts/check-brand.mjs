#!/usr/bin/env node
// Guarda anti-marca: falha (exit 1) se encontrar a marca antiga em conteudo,
// nome de arquivo ou nome de pasta. Node 22+, sem dependencias.
// Uso: node check-brand.mjs <raiz> [--exclude item1,item2]
// Itens do --exclude: nome de pasta/arquivo (em qualquer nivel) ou caminho relativo a raiz (com "/").
// Os padroes sao montados por partes para que este arquivo nao se auto-detecte.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const OLD_BRAND = new RegExp('bar' + 'r+' + 'os', 'i'); // cobre todas as variantes e o erro de digitacao com 3 'r'

const DEFAULT_EXCLUDED_DIRS = new Set(['.git', 'node_modules', 'bin', 'obj', 'dist', '.next']);
const EXCLUDED_FILES = new Set(['package-lock.json', 'yarn.lock']);
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.avif', '.pdf', '.zip', '.gz', '.tar',
  '.7z', '.rar', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp3', '.mp4', '.mov', '.webm',
  '.dll', '.exe', '.pdb', '.so', '.dylib', '.class', '.jar', '.bin', '.dat', '.sqlite', '.db',
]);

function isBinaryBuffer(buffer) {
  return buffer.subarray(0, 8000).includes(0);
}

/** Retorna lista de ocorrencias { path, line? } (path relativo, separador "/"). */
export function scanForOldBrand(rootDir, extraExcludedDirs = []) {
  const excludedDirs = new Set([...DEFAULT_EXCLUDED_DIRS, ...extraExcludedDirs]);
  const findings = [];
  const root = resolve(rootDir);

  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      const relPath = relative(root, fullPath).split('\\').join('/');

      if (entry.isDirectory()) {
        if (excludedDirs.has(entry.name) || excludedDirs.has(relPath)) continue;
        if (OLD_BRAND.test(entry.name)) findings.push({ path: relPath + '/' });
        visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (EXCLUDED_FILES.has(entry.name) || excludedDirs.has(entry.name) || excludedDirs.has(relPath)) continue;

      if (OLD_BRAND.test(entry.name)) findings.push({ path: relPath });
      if (BINARY_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;

      const buffer = readFileSync(fullPath);
      if (isBinaryBuffer(buffer)) continue;
      buffer.toString('utf8').split(/\r?\n/).forEach((text, index) => {
        if (OLD_BRAND.test(text)) findings.push({ path: relPath, line: index + 1 });
      });
    }
  }

  visit(root);
  return findings;
}

function parseArgs(argv) {
  const positional = [];
  let extraExcluded = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--exclude') {
      const value = argv[++i];
      if (!value) throw new Error('--exclude requer lista separada por virgula (ex.: --exclude board,context)');
      extraExcluded = value.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      positional.push(argv[i]);
    }
  }
  if (positional.length !== 1) throw new Error('Uso: node check-brand.mjs <raiz> [--exclude dir1,dir2]');
  return { root: positional[0], extraExcluded };
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
    if (!statSync(args.root).isDirectory()) throw new Error(`Raiz nao e um diretorio: ${args.root}`);
  } catch (error) {
    console.error(`check-brand: ${error.code === 'ENOENT' ? `raiz nao encontrada: ${process.argv[2]}` : error.message}`);
    process.exit(2);
  }

  const findings = scanForOldBrand(args.root, args.extraExcluded);
  for (const f of findings) console.log(f.line ? `${f.path}:${f.line}` : f.path);
  if (findings.length > 0) {
    console.error(`check-brand: ${findings.length} ocorrencia(s) da marca antiga.`);
    process.exit(1);
  }
  console.log('check-brand: 0 ocorrencias.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
