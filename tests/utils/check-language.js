/**
 * Language Check Script
 * 
 * This script scans the frontend source files to check for any Chinese text content
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// Chinese character detection regex
const chineseRegex = /[\u4e00-\u9fa5]/;
const chineseRegexInJSX = /["'`]([^"'`]*[\u4e00-\u9fa5][^"'`]*)["`']/g;

// Directories to exclude
const excludeDirs = ['node_modules', 'dist', 'build', '.git'];

// File extensions to check
const extensions = ['.js', '.jsx', '.ts', '.tsx', '.html', '.css'];

async function scanDirectory(dir) {
  console.log(`Scanning directory: ${dir}`);
  const entries = await readdir(dir);
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = await stat(fullPath);
    
    // Skip excluded directories
    if (stats.isDirectory() && !excludeDirs.includes(entry)) {
      await scanDirectory(fullPath);
      continue;
    }
    
    // Check if file has an extension we want to scan
    const ext = path.extname(fullPath);
    if (stats.isFile() && extensions.includes(ext)) {
      await checkFile(fullPath);
    }
  }
}

async function checkFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const matches = content.match(chineseRegexInJSX);
    
    if (matches) {
      console.log(`\nFound Chinese text in: ${filePath}`);
      
      // Find all occurrences of Chinese text
      let match;
      while ((match = chineseRegexInJSX.exec(content)) !== null) {
        if (chineseRegex.test(match[1])) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          console.log(`  Line ${lineNumber}: ${match[1]}`);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
}

async function main() {
  const rootDir = './src';
  console.log('Checking for Chinese text in frontend source files...');
  await scanDirectory(rootDir);
  console.log('\nScan complete!');
}

main().catch(console.error); 