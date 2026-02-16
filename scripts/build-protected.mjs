import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';
import { minify as minifyHtml } from 'html-minifier-terser';
import CleanCSS from 'clean-css';
import esbuild from 'esbuild';
import JavaScriptObfuscator from 'javascript-obfuscator';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');

const COPY_EXCLUDE = new Set([
  '.git',
  '.github',
  'node_modules',
  'dist',
  '.DS_Store',
  'scripts',
  'package.json',
  'package-lock.json',
  '.gitignore',
  'BUILD-PROTECTED.md'
]);

const APP_BUILDS = [
  {
    name: 'LiteEdit',
    entry: 'projects/liteedit-app/js/app-core.js',
    outFile: 'projects/liteedit-app/js/app-core.bundle.js',
    htmlFile: 'projects/liteedit-app/index.html',
    scriptRegex: /<script(?:\s+type=["']module["'])?\s+src=["']\.\/js\/app-core\.js["']><\/script>/i,
    replacement: '<script type="module" src="./js/app-core.bundle.js"></script>'
  },
  {
    name: 'SurSight',
    entry: 'projects/sursight-studio-app/js/app.js',
    outFile: 'projects/sursight-studio-app/js/app.bundle.js',
    htmlFile: 'projects/sursight-studio-app/index.html',
    skipObfuscation: true,
    scriptRegex: /<script\s+type=["']module["']\s+src=["']js\/app\.js["']><\/script>/i,
    replacement: '<script type="module" src="js/app.bundle.js"></script>'
  }
];

const MAIN_SITE_BUILD = {
  name: 'MainSite',
  htmlFile: 'index.html',
  outFile: 'js/site.bundle.js',
  sourceScripts: [
    'js/config.js',
    'js/analytics.js',
    'js/audio.js',
    'js/pathfinding.js',
    'js/data/projects.js',
    'js/components/Navbar.js',
    'js/components/About.js',
    'js/components/PathfinderGame.js',
    'js/components/Journey.js',
    'js/components/Projects.js',
    'js/components/Resume.js',
    'js/components/Contact.js',
    'js/components/PrivacyPolicy.js',
    'js/App.js'
  ]
};

function shouldCopy(srcPath) {
  const relative = path.relative(ROOT, srcPath);
  if (!relative || relative.startsWith('..')) return false;
  const first = relative.split(path.sep)[0];
  return !COPY_EXCLUDE.has(first);
}

async function copyProjectToDist() {
  await fs.remove(DIST_DIR);
  await fs.ensureDir(DIST_DIR);
  const topLevelEntries = await fs.readdir(ROOT);

  for (const entry of topLevelEntries) {
    const srcPath = path.join(ROOT, entry);
    if (!shouldCopy(srcPath)) continue;
    const destPath = path.join(DIST_DIR, entry);
    await fs.copy(srcPath, destPath, {
      filter: (itemPath) => {
        const base = path.basename(itemPath);
        return base !== '.DS_Store';
      }
    });
  }
}

function obfuscateCode(sourceCode) {
  return JavaScriptObfuscator.obfuscate(sourceCode, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.2,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: false,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 8,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayShuffle: true,
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
  }).getObfuscatedCode();
}

async function buildAppBundles() {
  for (const app of APP_BUILDS) {
    const entryAbs = path.join(ROOT, app.entry);
    const outAbs = path.join(DIST_DIR, app.outFile);

    await esbuild.build({
      entryPoints: [entryAbs],
      outfile: outAbs,
      bundle: true,
      format: 'esm',
      target: ['es2020'],
      minify: true,
      legalComments: 'none',
      sourcemap: false,
      charset: 'utf8',
      logLevel: 'silent'
    });

    if (!app.skipObfuscation) {
      const bundled = await fs.readFile(outAbs, 'utf8');
      const obfuscated = obfuscateCode(bundled);
      await fs.writeFile(outAbs, obfuscated, 'utf8');
    }

    const htmlAbs = path.join(DIST_DIR, app.htmlFile);
    let html = await fs.readFile(htmlAbs, 'utf8');
    if (!app.scriptRegex.test(html)) {
      throw new Error(`Could not update script reference for ${app.name} in ${app.htmlFile}`);
    }
    html = html.replace(app.scriptRegex, app.replacement);
    await fs.writeFile(htmlAbs, html, 'utf8');
  }
}

async function buildMainSiteBundle() {
  const transformedParts = [];

  for (const scriptRel of MAIN_SITE_BUILD.sourceScripts) {
    const absPath = path.join(ROOT, scriptRel);
    const source = await fs.readFile(absPath, 'utf8');
    const transformed = await esbuild.transform(source, {
      loader: 'jsx',
      minify: true,
      target: 'es2018',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
      legalComments: 'none',
      sourcefile: scriptRel,
      charset: 'utf8'
    });
    transformedParts.push(transformed.code);
  }

  const bundled = transformedParts.join('\n');
  const obfuscated = obfuscateCode(bundled);
  const outAbs = path.join(DIST_DIR, MAIN_SITE_BUILD.outFile);
  await fs.ensureDir(path.dirname(outAbs));
  await fs.writeFile(outAbs, obfuscated, 'utf8');

  const htmlAbs = path.join(DIST_DIR, MAIN_SITE_BUILD.htmlFile);
  let html = await fs.readFile(htmlAbs, 'utf8');

  html = html.replace(
    /<script\s+src=["']https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js["']><\/script>\s*/i,
    ''
  );
  html = html.replace(/<script\s+type=["']text\/babel["']\s+src=["']js\/[^"']+["']><\/script>\s*/gi, '');
  html = html.replace(/<script\s+src=["']js\/analytics\.js["']><\/script>\s*/i, '');

  if (/<script>\s*\/\/ Security scripts/i.test(html)) {
    html = html.replace(
      /<script>\s*\/\/ Security scripts/i,
      '<script src="js/site.bundle.js"></script>\n  <script>\n    // Security scripts'
    );
  } else if (!/<script\s+src=["']js\/site\.bundle\.js["']><\/script>/i.test(html)) {
    html = html.replace(/<\/body>/i, '  <script src="js/site.bundle.js"></script>\n</body>');
  }

  await fs.writeFile(htmlAbs, html, 'utf8');
}

async function pruneReadableSourceFiles() {
  const keepByFolder = new Map([
    ['js', new Set(['site.bundle.js'])],
    ['projects/liteedit-app/js', new Set(['app-core.bundle.js'])],
    ['projects/sursight-studio-app/js', new Set(['app.bundle.js'])]
  ]);

  for (const [folderRel, keepSet] of keepByFolder.entries()) {
    const folderAbs = path.join(DIST_DIR, folderRel);
    if (!(await fs.pathExists(folderAbs))) continue;
    const entries = await fs.readdir(folderAbs);
    for (const fileName of entries) {
      const fullPath = path.join(folderAbs, fileName);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        await fs.remove(fullPath);
        continue;
      }

      if (!fileName.endsWith('.js')) continue;
      if (keepSet.has(fileName)) continue;
      await fs.remove(fullPath);
    }
  }
}

async function pruneDistNoise() {
  const dsStoreFiles = await fg('**/.DS_Store', {
    cwd: DIST_DIR,
    dot: true,
    absolute: true
  });
  await Promise.all(dsStoreFiles.map((filePath) => fs.remove(filePath)));
}

async function minifyCssFiles() {
  const cssFiles = await fg('**/*.css', {
    cwd: DIST_DIR,
    dot: false,
    absolute: true
  });

  const cleaner = new CleanCSS({ level: 2 });

  await Promise.all(cssFiles.map(async (cssFile) => {
    const source = await fs.readFile(cssFile, 'utf8');
    const output = cleaner.minify(source);
    if (output.errors.length) {
      throw new Error(`CSS minify failed for ${path.relative(DIST_DIR, cssFile)}: ${output.errors.join('; ')}`);
    }
    await fs.writeFile(cssFile, output.styles, 'utf8');
  }));
}

async function minifyHtmlFiles() {
  const htmlFiles = await fg('**/*.html', {
    cwd: DIST_DIR,
    dot: false,
    absolute: true
  });

  await Promise.all(htmlFiles.map(async (htmlFile) => {
    const source = await fs.readFile(htmlFile, 'utf8');
    const minified = await minifyHtml(source, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      keepClosingSlash: true,
      minifyCSS: false,
      minifyJS: false,
      processConditionalComments: false,
      ignoreCustomFragments: [/<%[\s\S]*?%>/, /\{\{[\s\S]*?\}\}/]
    });
    await fs.writeFile(htmlFile, minified, 'utf8');
  }));
}

async function main() {
  console.log('Creating protected build...');
  await copyProjectToDist();
  await buildAppBundles();
  await buildMainSiteBundle();
  await pruneReadableSourceFiles();
  await pruneDistNoise();
  await minifyCssFiles();
  await minifyHtmlFiles();
  console.log('Protected build ready at dist/.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
