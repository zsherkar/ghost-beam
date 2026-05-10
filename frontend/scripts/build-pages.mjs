import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const env = {
  ...process.env,
  VITE_DEPLOY_TARGET: 'pages',
  VITE_STATIC_DEMO_MODE: 'true',
}

function runNodeScript(relativeScript, args) {
  const result = spawnSync(process.execPath, [join(process.cwd(), relativeScript), ...args], {
    stdio: 'inherit',
    shell: false,
    env,
    windowsHide: true,
  })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

runNodeScript(join('node_modules', 'typescript', 'bin', 'tsc'), [])
runNodeScript(join('node_modules', 'vite', 'bin', 'vite.js'), ['build'])
