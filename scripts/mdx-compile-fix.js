#!/usr/bin/env node
/**
 * scripts/mdx-compile-fix.js
 *
 * Comprehensive MDX compatibility fixes for .md files under docs/ and blog/:
 *   1. Escape all < characters in plain text (prevents MDX tag parsing errors)
 *   2. Convert HTML comments to JSX comments
 *   3. Fix self-closing HTML tags (e.g. <img> becomes <img />)
 *   4. Fix relative markdown links (remove docs/ prefix)
 *   5. Detect and warn about problematic curly braces
 *
 * Uses remark/unified for AST-based processing to avoid breaking code blocks.
 *
 * Usage:
 *   node scripts/mdx-compile-fix.js              -> dry-run (prints candidates)
 *   node scripts/mdx-compile-fix.js --apply      -> modifies files in-place with .bak backups
 *   node scripts/mdx-compile-fix.js --no-backup  -> modifies without backups
 */

const fs = require('fs').promises;
const path = require('path');
const process = require('process');

const { unified } = require('unified');
const remarkParse = require('remark-parse').default || require('remark-parse');
const remarkStringify = require('remark-stringify').default || require('remark-stringify');
const { visit } = require('unist-util-visit');

const ROOTS = ['docs', 'blog'];
const APPLY = process.argv.includes('--apply') || process.argv.includes('-a');
const NO_BACKUP = process.argv.includes('--no-backup');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const ENCODING = 'utf8';

// Self-closing HTML tags that must end with />
const SELF_CLOSING_TAGS = [
  'img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base',
  'col', 'embed', 'param', 'source', 'track', 'wbr'
];

function log(...args) { console.log(...args); }
function verbose(...args) { if (VERBOSE) console.log('  [VERBOSE]', ...args); }

async function findMdFiles(dir) {
  const results = [];
  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (err) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(current, ent.name);
      if (ent.isDirectory()) {
        await walk(full);
      } else if (ent.isFile() && full.endsWith('.md')) {
        results.push(full);
      }
    }
  }
  await walk(dir);
  return results;
}

function escapeLessThanInTextNodes(tree) {
  let changed = false;
  // Escape all < characters in text nodes that could be problematic:
  // - < followed by digit: <2, <500
  // - < followed by $: <$1,000
  // - < followed by <: <<
  // - < followed by letter or other char that could start a tag name: <Budget
  // Pattern: < not followed by a space (to preserve "< " in comparisons if needed)
  // Actually, safer to just escape all < in plain text since text nodes shouldn't contain HTML
  const pattern = /</g;

  visit(tree, 'text', (node) => {
    if (!node || typeof node.value !== 'string') return;
    const original = node.value;
    const updated = original.replace(pattern, '&lt;');
    if (original !== updated) {
      node.value = updated;
      changed = true;
      verbose(`Escaped < in text: "${original.substring(0, 50)}..."`);
    }
  });

  return changed;
}

function convertHtmlCommentsToJsx(tree) {
  let changed = false;
  
  visit(tree, 'html', (node) => {
    if (!node || typeof node.value !== 'string') return;
    const original = node.value;
    
    // Match HTML comments: <!-- comment -->
    const commentPattern = /<!--\s*(.*?)\s*-->/gs;
    const updated = original.replace(commentPattern, '{/* $1 */}');
    
    if (original !== updated) {
      node.value = updated;
      changed = true;
      verbose(`Converted HTML comment to JSX`);
    }
  });

  return changed;
}

function fixSelfClosingTags(tree) {
  let changed = false;
  
  visit(tree, 'html', (node) => {
    if (!node || typeof node.value !== 'string') return;
    const original = node.value;
    let updated = original;
    
    // Fix self-closing tags that don't end with />
    for (const tag of SELF_CLOSING_TAGS) {
      // Match tags like <img ...> but not <img ... /> or <img.../>
      const pattern = new RegExp(`<(${tag}\\s+[^>]*[^/])>`, 'gi');
      updated = updated.replace(pattern, '<$1 />');
    }
    
    if (original !== updated) {
      node.value = updated;
      changed = true;
      verbose(`Fixed self-closing tags in HTML node`);
    }
  });

  return changed;
}

function detectProblematicCurlyBraces(tree, filePath) {
  const warnings = [];
  
  visit(tree, 'text', (node, index, parent) => {
    if (!node || typeof node.value !== 'string') return;
    
    // Look for curly braces that aren't part of JSX expressions
    // Simple heuristic: { followed by non-JSX content and }
    const curlyPattern = /\{[^/*\s][^}]*\}/g;
    const matches = node.value.match(curlyPattern);
    
    if (matches && matches.length > 0) {
      warnings.push({
        file: filePath,
        text: node.value.substring(0, 100),
        matches: matches
      });
    }
  });
  
  return warnings;
}

function fixRelativeMarkdownLinks(tree) {
  let changed = false;
  
  visit(tree, 'link', (node) => {
    if (!node || typeof node.url !== 'string') return;
    const original = node.url;
    
    // Fix links that start with "docs/" - remove that prefix
    // Examples: 
    //   docs/01-architecture.md -> 01-architecture.md
    //   docs/01-architecture.md#section -> 01-architecture.md#section
    if (original.startsWith('docs/')) {
      node.url = original.replace(/^docs\//, '');
      changed = true;
      verbose(`Fixed relative link: "${original}" -> "${node.url}"`);
    }
  });
  
  return changed;
}

async function processFile(file) {
  const raw = await fs.readFile(file, ENCODING);

  const processor = unified()
    .use(remarkParse)
    .use(remarkStringify, {
      fences: true,
      fence: '`',
      listItemIndent: '1',
    });

  const tree = processor.parse(raw);
  
  // Apply all fixes
  let hasChanges = false;
  hasChanges = escapeLessThanInTextNodes(tree) || hasChanges;
  hasChanges = convertHtmlCommentsToJsx(tree) || hasChanges;
  hasChanges = fixSelfClosingTags(tree) || hasChanges;
  hasChanges = fixRelativeMarkdownLinks(tree) || hasChanges;
  
  // Detect warnings (doesn't modify tree)
  const curlyBraceWarnings = detectProblematicCurlyBraces(tree, file);

  if (!hasChanges && curlyBraceWarnings.length === 0) {
    return { changed: false };
  }

  const newContent = hasChanges ? String(processor.stringify(tree)) : raw;
  return { 
    changed: hasChanges, 
    raw, 
    newContent,
    warnings: curlyBraceWarnings
  };
}

(async function main() {
  const repoRoot = process.cwd();
  const allFiles = [];
  
  log('MDX Compile Fix - AST-based Markdown/MDX compatibility fixer');
  log('Mode:', APPLY ? 'APPLY (will modify files)' : 'DRY-RUN (preview only)');
  log('Backup:', NO_BACKUP ? 'disabled' : 'enabled (.bak files)');
  log('');

  for (const root of ROOTS) {
    const rootPath = path.join(repoRoot, root);
    try {
      const st = await fs.stat(rootPath);
      if (!st.isDirectory()) continue;
    } catch (err) {
      continue;
    }
    const files = await findMdFiles(rootPath);
    allFiles.push(...files);
  }

  if (allFiles.length === 0) {
    log('No .md files found in docs/ or blog/');
    process.exit(0);
  }

  log(`Found ${allFiles.length} .md files to process\n`);

  let totalChanged = 0;
  let totalWarnings = 0;
  const allWarnings = [];

  for (const file of allFiles) {
    try {
      const { changed, raw, newContent, warnings } = await processFile(file);
      
      if (changed) {
        totalChanged++;
        log(`[MODIFY] ${file}`);
        
        if (APPLY) {
          if (!NO_BACKUP) {
            const bak = `${file}.bak`;
            await fs.writeFile(bak, raw, ENCODING);
            verbose(`Created backup: ${path.basename(bak)}`);
          }
          await fs.writeFile(file, newContent, ENCODING);
          log(`  ✓ File updated`);
        } else {
          log(`  -> Would modify this file (use --apply to make changes)`);
        }
      } else {
        verbose(`[OK]     ${file}`);
      }
      
      if (warnings && warnings.length > 0) {
        totalWarnings += warnings.length;
        allWarnings.push(...warnings);
        log(`[WARN]   ${file}`);
        log(`  ⚠ Found ${warnings.length} potential curly brace issue(s)`);
      }
      
    } catch (err) {
      log(`[ERROR]  ${file} -> ${err.message}`);
      if (VERBOSE) console.error(err.stack);
    }
  }

  log('');
  log('━'.repeat(60));
  log(`Summary: Processed ${allFiles.length} files`);
  log(`  Changed: ${totalChanged} file(s) ${APPLY ? '(modified)' : '(dry-run)'}`);
  log(`  Warnings: ${totalWarnings} curly brace issue(s) detected`);
  
  if (allWarnings.length > 0 && !APPLY) {
    log('');
    log('⚠ Curly Brace Warnings (manual review recommended):');
    const uniqueWarnings = allWarnings.slice(0, 5); // Show first 5
    uniqueWarnings.forEach(w => {
      log(`  ${w.file}`);
      log(`    Matches: ${w.matches.join(', ')}`);
    });
    if (allWarnings.length > 5) {
      log(`  ... and ${allWarnings.length - 5} more`);
    }
  }
  
  log('━'.repeat(60));
  
  if (!APPLY && totalChanged > 0) {
    log('\nRun with --apply to make changes');
  }
  
  process.exit(0);
})();