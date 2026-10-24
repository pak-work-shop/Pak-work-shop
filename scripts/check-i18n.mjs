import fs from 'node:fs';
import path from 'node:path';

const localesDir = path.resolve('src/i18n/locales');
const enPath = path.join(localesDir, 'en.json');
const urPath = path.join(localesDir, 'ur.json');
const urRomanPath = path.join(localesDir, 'ur-roman.json');

console.log('===> PAK AUTO WORKS: i18n Key Tree & Completeness Audit');

if (!fs.existsSync(enPath) || !fs.existsSync(urPath) || !fs.existsSync(urRomanPath)) {
  console.error('ERROR: Missing one of en.json, ur.json, or ur-roman.json in', localesDir);
  process.exit(1);
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ur = JSON.parse(fs.readFileSync(urPath, 'utf8'));
const urRoman = JSON.parse(fs.readFileSync(urRomanPath, 'utf8'));

/**
 * Recursively extracts all dot-notation paths and values
 */
function extractLeafKeys(obj, prefix = '') {
  let leaves = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(leaves, extractLeafKeys(value, fullPath));
    } else {
      leaves[fullPath] = value;
    }
  }
  return leaves;
}

const enLeaves = extractLeafKeys(en);
const urLeaves = extractLeafKeys(ur);
const urRomanLeaves = extractLeafKeys(urRoman);

const enKeySet = new Set(Object.keys(enLeaves));
const urKeySet = new Set(Object.keys(urLeaves));
const urRomanKeySet = new Set(Object.keys(urRomanLeaves));

let hasErrors = false;

// 1. Missing in Urdu
const missingInUr = [...enKeySet].filter((k) => !urKeySet.has(k));
if (missingInUr.length > 0) {
  console.error(`[FAIL] ${missingInUr.length} keys in en.json are missing in ur.json:`);
  missingInUr.slice(0, 10).forEach((k) => console.error(`  - ${k}`));
  if (missingInUr.length > 10) console.error(`  ... and ${missingInUr.length - 10} more`);
  hasErrors = true;
}

// 2. Extra in Urdu
const extraInUr = [...urKeySet].filter((k) => !enKeySet.has(k));
if (extraInUr.length > 0) {
  console.error(`[FAIL] ${extraInUr.length} keys in ur.json are missing in en.json:`);
  extraInUr.slice(0, 10).forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
}

// 3. Missing in Roman Urdu
const missingInUrRoman = [...enKeySet].filter((k) => !urRomanKeySet.has(k));
if (missingInUrRoman.length > 0) {
  console.error(`[FAIL] ${missingInUrRoman.length} keys in en.json are missing in ur-roman.json:`);
  missingInUrRoman.slice(0, 10).forEach((k) => console.error(`  - ${k}`));
  if (missingInUrRoman.length > 10) console.error(`  ... and ${missingInUrRoman.length - 10} more`);
  hasErrors = true;
}

// 4. Extra in Roman Urdu
const extraInUrRoman = [...urRomanKeySet].filter((k) => !enKeySet.has(k));
if (extraInUrRoman.length > 0) {
  console.error(`[FAIL] ${extraInUrRoman.length} keys in ur-roman.json are missing in en.json:`);
  extraInUrRoman.slice(0, 10).forEach((k) => console.error(`  - ${k}`));
  hasErrors = true;
}

// 5. Empty values check
const emptyInEn = Object.entries(enLeaves).filter(([, v]) => typeof v === 'string' && !v.trim());
if (emptyInEn.length > 0) {
  console.error(`[FAIL] ${emptyInEn.length} keys in en.json have empty values:`, emptyInEn.map(([k]) => k));
  hasErrors = true;
}

const emptyInUr = Object.entries(urLeaves).filter(([, v]) => typeof v === 'string' && !v.trim());
if (emptyInUr.length > 0) {
  console.error(`[FAIL] ${emptyInUr.length} keys in ur.json have empty values:`, emptyInUr.map(([k]) => k));
  hasErrors = true;
}

const emptyInUrRoman = Object.entries(urRomanLeaves).filter(([, v]) => typeof v === 'string' && !v.trim());
if (emptyInUrRoman.length > 0) {
  console.error(`[FAIL] ${emptyInUrRoman.length} keys in ur-roman.json have empty values:`, emptyInUrRoman.map(([k]) => k));
  hasErrors = true;
}

if (!hasErrors) {
  console.log(`[PASS] Key tree structure matches 100% across en, ur, and ur-roman (${enKeySet.size} leaf keys).`);
}

// 6. Heuristic scan for hard-coded user-visible text in .tsx files (excluding comments, imports, icons)
console.log('===> Heuristic Scan for Un-internationalized strings in TSX files...');
const tsxFiles = [];
function findTsxFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        findTsxFiles(full);
      }
    } else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
      tsxFiles.push(full);
    }
  }
}
findTsxFiles('src');

let flaggedCount = 0;
// Heuristic: raw English words > 4 chars directly inside JSX tags without t() or variable
for (const file of tsxFiles) {
  // Check for common obvious un-translated tags like <p>Some text</p> or <h1>Some Heading</h1>
  const content = fs.readFileSync(file, 'utf8');
  // Match simple JSX text nodes that contain 3+ English words without curly braces
  const lines = content.split('\n');
  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (line.includes('//') || line.includes('/*') || line.includes('import ') || line.includes('console.')) continue;
    // Heuristic pattern: >Some Plain English Sentence<
    const match = line.match(/>([A-Z][a-z]+(\s+[a-z]+){3,})</);
    if (match && !match[1].includes('{') && !match[1].includes('t(')) {
      flaggedCount++;
      // Informational note
    }
  }
}
console.log(`[INFO] Heuristic scan examined ${tsxFiles.length} TSX components. Flagged occurrences: ${flaggedCount}`);

if (hasErrors) {
  console.error('FAILED: i18n validation encountered errors.');
  process.exit(1);
} else {
  console.log('SUCCESS: All translation keys are synchronized and non-empty.');
  process.exit(0);
}
