#!/usr/bin/env node
/**
 * scripts/add-repo.mjs
 *
 * Automatically adds a new repository to the documentation site.
 * Updates the sync-docs.yml workflow to include checkout and sync steps.
 *
 * Usage:
 *   node scripts/add-repo.mjs <repo-name>
 *   node scripts/add-repo.mjs nextinvestment
 *   node scripts/add-repo.mjs https://github.com/mwinfiel0331/nextinvestment
 */

import fs from 'fs/promises';
import path from 'path';
import process from 'process';

const WORKFLOW_PATH = '.github/workflows/sync-docs.yml';
const SIDEBARS_PATH = 'sidebars.ts';
const CONFIG_PATH = 'docusaurus.config.ts';
const OWNER = 'mwinfiel0331';

function toTitleCase(str) {
  // Convert kebab-case, snake_case, or camelCase to Title Case
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
    .replace(/[-_]/g, ' ') // kebab-case and snake_case to spaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function extractRepoName(input) {
  // Handle full GitHub URLs
  const urlMatch = input.match(/github\.com\/[^\/]+\/([^\/\s]+)/);
  if (urlMatch) {
    return urlMatch[1].replace(/\.git$/, '');
  }
  // Handle plain repo name
  return input.trim();
}

async function readWorkflow() {
  const content = await fs.readFile(WORKFLOW_PATH, 'utf-8');
  return content;
}

async function writeWorkflow(content) {
  await fs.writeFile(WORKFLOW_PATH, content, 'utf-8');
}

function generateCheckoutStep(repoName) {
  return `
      - name: Checkout ${repoName}
        uses: actions/checkout@v4
        with:
          repository: ${OWNER}/${repoName}
          ref: main
          path: _source_${repoName}
          token: \${{ secrets.DOCS_REPO_TOKEN }}`;
}

function generateSyncSection(repoName) {
  return `
          # Sync ${repoName} docs
          if [ -d "_source_${repoName}/docs" ]; then
            rm -rf docs/${repoName}
            mkdir -p docs/${repoName}
            rsync -a --delete _source_${repoName}/docs/ docs/${repoName}/
          fi
`;
}

function generateCleanupLine(repoName) {
  return `          rm -rf _source_${repoName}`;
}

async function addRepoToWorkflow(repoName) {
  let workflow = await readWorkflow();
  
  // Check if repo already exists - match exact checkout name with word boundary
  const checkoutPattern = new RegExp(`- name: Checkout ${repoName}\\s*$`, 'm');
  if (checkoutPattern.test(workflow)) {
    console.log(`❌ Repository "${repoName}" already exists in workflow`);
    return false;
  }

  // Find the birddogger checkout section and insert after it
  const birddoggerCheckoutIndex = workflow.indexOf('- name: Checkout birddogger');
  if (birddoggerCheckoutIndex === -1) {
    console.log('❌ Could not find birddogger checkout step');
    return false;
  }
  
  // Find the end of the birddogger checkout (look for the next "- name:" or "- name: Sync")
  const afterBirddogger = workflow.indexOf('\n      - name:', birddoggerCheckoutIndex + 1);
  if (afterBirddogger === -1) {
    console.log('❌ Could not find insertion point after birddogger');
    return false;
  }

  const checkoutStep = generateCheckoutStep(repoName);
  workflow = workflow.slice(0, afterBirddogger) + checkoutStep + workflow.slice(afterBirddogger);

  // Find the sync docs section - look for "# Sync birddogger docs" and add after the complete block
  const birddoggerSyncStart = '# Sync birddogger docs';
  const birddoggerSyncIndex = workflow.indexOf(birddoggerSyncStart);
  if (birddoggerSyncIndex === -1) {
    console.log('❌ Could not find birddogger sync section');
    return false;
  }
  
  // Find the closing "fi" of this block - accounting for Windows (\r\n) or Unix (\n) line endings
  const searchStart = birddoggerSyncIndex + birddoggerSyncStart.length;
  const nextSectionPattern = /\n          fi\r?\n\s*\r?\n/;
  const match = workflow.slice(searchStart).match(nextSectionPattern);
  
  if (!match) {
    console.log('❌ Could not find end of birddogger sync section');
    return false;
  }
  
  const syncEndIndex = searchStart + match.index + match[0].length;
  const syncSection = generateSyncSection(repoName);
  workflow = workflow.slice(0, syncEndIndex) + syncSection + workflow.slice(syncEndIndex);

  // Find cleanup section and add new cleanup line
  const cleanupIndex = workflow.indexOf('rm -rf _source_birddogger');
  if (cleanupIndex === -1) {
    console.log('❌ Could not find birddogger cleanup line');
    return false;
  }
  
  const cleanupEndIndex = workflow.indexOf('\n', cleanupIndex);
  const cleanupLine = '\n' + generateCleanupLine(repoName);
  workflow = workflow.slice(0, cleanupEndIndex) + cleanupLine + workflow.slice(cleanupEndIndex);

  await writeWorkflow(workflow);
  return true;
}

async function createDocsFolder(repoName) {
  const docsPath = path.join('docs', repoName);
  try {
    await fs.mkdir(docsPath, { recursive: true });
    console.log(`✓ Created docs folder: docs/${repoName}/`);
  } catch (err) {
    console.log(`⚠ Could not create docs folder: ${err.message}`);
  }
}

async function addToSidebars(repoName) {
  try {
    let sidebars = await fs.readFile(SIDEBARS_PATH, 'utf-8');
    
    // Check if sidebar already exists
    const sidebarKey = `${repoName}Sidebar`;
    if (sidebars.includes(sidebarKey)) {
      console.log(`⚠ Sidebar "${sidebarKey}" already exists`);
      return false;
    }

    // Generate new sidebar entry
    // Quote the key if it contains hyphens or other special characters
    const quotedKey = /[^a-zA-Z0-9_$]/.test(sidebarKey) ? `'${sidebarKey}'` : sidebarKey;
    const sidebarEntry = `  // ${repoName} sidebar
  ${quotedKey}: [
    {
      type: 'autogenerated',
      dirName: '${repoName}',
    },
  ],`;

    // Find the last sidebar entry (before the closing brace and export)
    const exportIndex = sidebars.indexOf('export default sidebars;');
    if (exportIndex === -1) {
      console.log('❌ Could not find export statement in sidebars.ts');
      return false;
    }

    // Find the closing brace before export
    const closingBraceIndex = sidebars.lastIndexOf('};', exportIndex);
    if (closingBraceIndex === -1) {
      console.log('❌ Could not find closing brace in sidebars.ts');
      return false;
    }

    // Insert new sidebar entry before the closing brace
    sidebars = sidebars.slice(0, closingBraceIndex) + sidebarEntry + '\n' + sidebars.slice(closingBraceIndex);

    await fs.writeFile(SIDEBARS_PATH, sidebars, 'utf-8');
    console.log(`✓ Added ${sidebarKey} to ${SIDEBARS_PATH}`);
    return true;
  } catch (err) {
    console.log(`❌ Failed to update sidebars: ${err.message}`);
    return false;
  }
}

async function addToNavbar(repoName) {
  try {
    let config = await fs.readFile(CONFIG_PATH, 'utf-8');
    
    const sidebarId = `${repoName}Sidebar`;
    
    // Check if navbar item already exists
    if (config.includes(`sidebarId: '${sidebarId}'`) || config.includes(`sidebarId: "${sidebarId}"`)) {
      console.log(`⚠ Navbar item for "${repoName}" already exists`);
      return false;
    }

    // Generate human-readable label
    const label = toTitleCase(repoName);

    // Find the GitHub link in navbar (we'll insert before it)
    const githubPattern = /\s*\{\s*href:\s*['"]https:\/\/github\.com/;
    const githubMatch = config.match(githubPattern);
    
    if (!githubMatch) {
      console.log('❌ Could not find GitHub link in navbar');
      return false;
    }

    const insertIndex = config.indexOf(githubMatch[0]);
    
    // Generate navbar entry
    const navbarEntry = `        {
          type: 'docSidebar',
          sidebarId: '${sidebarId}',
          position: 'left',
          label: '${label}',
        },
`;

    config = config.slice(0, insertIndex) + navbarEntry + config.slice(insertIndex);

    await fs.writeFile(CONFIG_PATH, config, 'utf-8');
    console.log(`✓ Added navbar entry "${label}" to ${CONFIG_PATH}`);
    return true;
  } catch (err) {
    console.log(`❌ Failed to update navbar: ${err.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/add-repo.mjs <repo-name>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/add-repo.mjs nextinvestment');
    console.log('  node scripts/add-repo.mjs https://github.com/mwinfiel0331/nextinvestment');
    process.exit(1);
  }

  const input = args[0];
  const repoName = extractRepoName(input);
  
  console.log('');
  console.log('Adding repository to documentation site');
  console.log('━'.repeat(60));
  console.log(`Repository: ${OWNER}/${repoName}`);
  console.log('');

  // Add to workflow
  const success = await addRepoToWorkflow(repoName);
  if (!success) {
    process.exit(1);
  }

  console.log(`✓ Updated ${WORKFLOW_PATH}`);
  console.log(`  - Added checkout step for ${repoName}`);
  console.log(`  - Added sync section for ${repoName} docs`);
  console.log(`  - Added cleanup for _source_${repoName}`);

  // Create docs folder
  await createDocsFolder(repoName);

  // Add to sidebars
  await addToSidebars(repoName);

  // Add to navbar
  await addToNavbar(repoName);

  console.log('');
  console.log('━'.repeat(60));
  console.log('✅ Repository added successfully!');
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Ensure ${repoName} has a /docs folder with markdown files`);
  console.log('  2. Commit the changes');
  console.log('  3. Run the "Sync project docs" workflow in GitHub Actions');
  console.log('');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
