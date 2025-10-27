/*
  Script #2: Detect and optionally fix common TS import/type issues for the minimal app check.
  - Runs tsc with tsconfig.app.json
  - Classifies errors
  - If --fix-icons is passed, replaces invalid lucide-react icon imports/usages with mapped alternatives
  - Prints JSON summary with actions taken and remaining errors
*/
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ClassifiedError = {
  file: string
  code: string
  message: string
}

type Summary = {
  ok: boolean
  durationMs: number
  actions: string[]
  classified: ClassifiedError[]
  rawTail?: string[]
}

function runTscOnce(): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolvePromise) => {
    const require = createRequire(import.meta.url)
    let tscBin: string
    try {
      tscBin = require.resolve('typescript/bin/tsc')
    } catch {
      tscBin = 'tsc'
    }
    const nodeExec = process.execPath
    const args = [tscBin, '-p', 'tsconfig.app.json', '--noEmit']
    const child = spawn(nodeExec, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (err += d.toString()))
    child.on('close', (code) => {
      resolvePromise({ ok: code === 0, output: (out + '\n' + err).trim() })
    })
  })
}

const iconFixMap: Record<string, string> = {
  // missing icons -> alternatives
  Queue: 'List',
  Pulse: 'Activity'
}

function fixLucideIconsInFile(filePath: string): string[] {
  const actions: string[] = []
  if (!existsSync(filePath)) return actions
  const original = readFileSync(filePath, 'utf8')
  let updated = original
  let changed = false

  // Update import list from 'lucide-react'
  const importRegex = /from\s+'lucide-react'\s*\}?/g
  // A bit more precise: capture named import block
  const namedImportRegex = /import\s*\{([\s\S]*?)\}\s*from\s+'lucide-react'/
  const m = updated.match(namedImportRegex)
  if (m) {
    let block = m[1]
    Object.entries(iconFixMap).forEach(([bad, good]) => {
      const hasBad = new RegExp(`(^|[\n\r\s,])${bad}(?=\s|,)`).test(block)
      if (hasBad) {
        block = block.replace(new RegExp(`\b${bad}\b`, 'g'), good)
        actions.push(`icons: import ${bad} -> ${good} in ${filePath}`)
        changed = true
      }
    })
    if (changed) {
      updated = updated.replace(namedImportRegex, `import {${block}} from 'lucide-react'`)
    }
  }

  // Replace component usages in JSX
  Object.entries(iconFixMap).forEach(([bad, good]) => {
    const usage = new RegExp(`<${bad}(\n|\r|\s|>)`, 'g')
    if (usage.test(updated)) {
      updated = updated.replace(new RegExp(`\b${bad}\b`, 'g'), good)
      actions.push(`icons: usage <${bad} /> -> <${good} /> in ${filePath}`)
      changed = true
    }
  })

  if (changed && updated !== original) {
    writeFileSync(filePath, updated, 'utf8')
  }
  return actions
}

function classify(output: string): ClassifiedError[] {
  const lines = output.split(/\r?\n/)
  const result: ClassifiedError[] = []
  for (const line of lines) {
    // Example: src/components/audio/audio-player.tsx(39,3): error TS2305: ...
    const m = line.match(/^(.*?\.tsx?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/)
    if (m) {
      const file = m[1]
      const code = m[4]
      const message = m[5]
      result.push({ file, code, message })
    }
  }
  return result
}

async function main() {
  const args = process.argv.slice(2)
  const doFixIcons = args.includes('--fix-icons')
  const start = Date.now()
  const first = await runTscOnce()
  const actions: string[] = []
  let classified = classify(first.output)

  if (!first.ok && doFixIcons) {
    // Find files that have lucide-react missing exports
    const lucideErrors = classified.filter((e) =>
      e.message.includes('lucide-react') && (e.message.includes('no exported member') || e.message.includes('has no exported member'))
    )
    const files = Array.from(new Set(lucideErrors.map((e) => e.file)))
    for (const f of files) {
      const abs = resolve(f)
      actions.push(...fixLucideIconsInFile(abs))
    }
  }

  let finalRes = first
  if (actions.length > 0) {
    finalRes = await runTscOnce()
    classified = classify(finalRes.output)
  }

  const durationMs = Date.now() - start
  const summary: Summary = {
    ok: finalRes.ok,
    durationMs,
    actions,
    classified,
    rawTail: finalRes.ok ? undefined : finalRes.output.split('\n').slice(-50)
  }
  try {
    const line = JSON.stringify({ ts: new Date().toISOString(), script: 'detect-and-fix', ...summary })
    appendFileSync('logs.rxt', line + '\n', { encoding: 'utf8' })
  } catch {}
  console.log(JSON.stringify(summary, null, 2))
  process.exit(finalRes.ok ? 0 : 1)
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }, null, 2))
  process.exit(1)
})


