/**
 * Genera el paquete de producción con solo los archivos necesarios.
 * Excluye scripts de desarrollo, configuraciones de diseño, etc.
 *
 * Ejecutar: node scripts/build-production.mjs
 * Resultado: carpeta timeline-production/ lista para desplegar
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'timeline-production')

const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'timeline-production',
  '*.md',
  '*.log',
  '.env',
  '*.db',
  '.vscode',
  'scripts/build-production',
  'backend/scripts/merge-fuentes-base',
  'check-urls.js',
  'install.js',
  'switch-mode.js',
  'figma-color-tokens.json',
  'figma-component-specs.json',
]

function shouldExclude(relPath) {
  const normalized = relPath.replace(/\\/g, '/')
  return EXCLUDE_PATTERNS.some((pat) => {
    if (normalized.includes(pat)) return true
    if (pat.includes('*')) {
      const regex = pat.replace(/\./g, '\\.').replace(/\*/g, '.*')
      return new RegExp(regex).test(normalized)
    }
    return false
  })
}

function copyRecursive(src, dest, base = '') {
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const relPath = path.join(base, entry.name).replace(/\\/g, '/')
    const destPath = path.join(dest, entry.name)

    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    if (shouldExclude(relPath)) continue

    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true })
      copyRecursive(srcPath, destPath, relPath)
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true })
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function main() {
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true })
  }
  fs.mkdirSync(outDir, { recursive: true })

  const rootFiles = ['.gitignore']
  for (const f of rootFiles) {
    const p = path.join(root, f)
    if (fs.existsSync(p)) fs.copyFileSync(p, path.join(outDir, f))
  }

  const backendSrc = path.join(root, 'backend')
  const backendDest = path.join(outDir, 'backend')
  fs.mkdirSync(backendDest, { recursive: true })
  copyRecursive(backendSrc, backendDest, 'backend')
  const mergeScript = path.join(backendDest, 'scripts', 'merge-fuentes-base.js')
  if (fs.existsSync(mergeScript)) fs.unlinkSync(mergeScript)

  const frontendSrc = path.join(root, 'frontend')
  const frontendDest = path.join(outDir, 'frontend')
  fs.mkdirSync(frontendDest, { recursive: true })
  copyRecursive(frontendSrc, frontendDest, 'frontend')

  // Copiar manuales: producción usa INSTALLATION_MANUAL_PRODUCTION.md (sin build-production)
  const docsSrc = path.join(root, 'docs')
  const docsDest = path.join(outDir, 'docs')
  if (fs.existsSync(docsSrc)) {
    fs.mkdirSync(docsDest, { recursive: true })
    const prodManual = path.join(docsSrc, 'INSTALLATION_MANUAL_PRODUCTION.md')
    const userManual = path.join(docsSrc, 'USER_MANUAL_PRODUCTION.md')
    if (fs.existsSync(prodManual)) {
      fs.copyFileSync(prodManual, path.join(docsDest, 'INSTALLATION_MANUAL.md'))
    }
    if (fs.existsSync(userManual)) {
      fs.copyFileSync(userManual, path.join(docsDest, 'USER_MANUAL.md'))
    }
  }

  const scriptsSrc = path.join(root, 'scripts')
  const scriptsDest = path.join(outDir, 'scripts')
  fs.mkdirSync(scriptsDest, { recursive: true })
  for (const sub of ['linux', 'macos', 'windows']) {
    const subSrc = path.join(scriptsSrc, sub)
    if (fs.existsSync(subSrc)) {
      fs.cpSync(subSrc, path.join(scriptsDest, sub), { recursive: true })
    }
  }
  const readme = path.join(scriptsSrc, 'README.md')
  if (fs.existsSync(readme)) fs.copyFileSync(readme, path.join(scriptsDest, 'README.md'))

  const iniciar = path.join(root, 'iniciar-servidores.ps1')
  if (fs.existsSync(iniciar)) fs.copyFileSync(iniciar, path.join(outDir, 'iniciar-servidores.ps1'))

  console.log('✅ Paquete de producción generado en:', outDir)
  console.log('   Excluidos: merge-fuentes-base.js, check-urls.js, install.js, switch-mode.js, figma-*, node_modules')
  console.log('   Próximos pasos:')
  console.log('   cd timeline-production/backend && npm install')
  console.log('   cd timeline-production/frontend && npm install && npm run build')
}

main()
