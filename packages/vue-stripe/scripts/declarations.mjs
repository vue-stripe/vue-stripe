// Post-build step for dist/types (run after `tsc -p tsconfig.build.json`).
//
// The package is "type": "module", so under moduleResolution node16 / nodenext TypeScript
// reads dist/types/*.d.ts as ES modules, where a relative import needs its file extension
// (TS2834) and a CommonJS consumer cannot load them at all (TS1479) (#660). tsc copies the
// extensionless specifiers of the source, so this step:
//   1. rewrites each relative specifier in dist/types/**/*.d.ts to './x.js' or './x/index.js';
//   2. writes a CommonJS twin of every file, *.d.cts with './x.cjs' specifiers, which the
//      "require" condition of package.json "exports" points at;
//   3. names the file of '@stripe/stripe-js/pure' in the ES declarations, as vite.config.ts
//      does in the ES bundle: the package has no "exports" map, so an ES module cannot
//      import the directory, and `loadStripe` would resolve to `any`.
// Only module specifiers are touched (found through the TypeScript AST, so the import
// examples in JSDoc comments stay as they are). A specifier that names no emitted
// declaration fails the build.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import ts from 'typescript'

const root = resolve(import.meta.dirname, '../dist/types')

/** Bare specifiers an ES module cannot resolve, and the file each one means. */
const esmFiles = { '@stripe/stripe-js/pure': '@stripe/stripe-js/pure/index.js' }

const declarations = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return declarations(path)
    return entry.name.endsWith('.d.ts') ? [path] : []
  })

/** The string literals naming a module: import / export ... from, and import('...') types. */
const moduleSpecifiers = (source) => {
  const found = []
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      found.push(node.moduleSpecifier)
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteral(node.argument.literal)
    ) {
      found.push(node.argument.literal)
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

/** './x' -> './x' or './x/index', whichever declaration tsc emitted. */
const target = (file, specifier) => {
  const path = resolve(dirname(file), specifier)
  if (existsSync(`${path}.d.ts`)) return specifier
  if (existsSync(join(path, 'index.d.ts'))) return `${specifier}/index`
  throw new Error(`[Vue Stripe] ${file}: '${specifier}' names no emitted declaration file`)
}

const files = declarations(root)
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const specifiers = moduleSpecifiers(source)
    // Back to front, so earlier positions stay valid while replacing.
    .sort((a, b) => b.getStart(source) - a.getStart(source))
  const rewrite = (format) =>
    specifiers.reduce((out, literal) => {
      const name = literal.text
      let next = name
      if (/^\.\.?\//.test(name) && !/\.c?js$/.test(name)) {
        next = `${target(file, name)}${format === 'esm' ? '.js' : '.cjs'}`
      } else if (format === 'esm' && name in esmFiles) {
        next = esmFiles[name]
      }
      return `${out.slice(0, literal.getStart(source) + 1)}${next}${out.slice(literal.getEnd() - 1)}`
    }, text)
  writeFileSync(file, rewrite('esm'))
  writeFileSync(file.replace(/\.d\.ts$/, '.d.cts'), rewrite('cjs'))
}
