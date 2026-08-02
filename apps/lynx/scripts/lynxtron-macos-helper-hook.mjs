import { access, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

const SOURCE_APP = 'Lynxtron.app'
const SOURCE_HELPER = 'Lynxtron Helper.app'
const PACKAGED_HELPER = 'Synara Lynx Helper.app'
const MARKER = '.synara-lynxtron-missing-helper-shim'

async function exists(target) {
  try {
    await access(target)
    return true
  } catch {
    return false
  }
}

export async function afterExtract({ appOutDir, electronPlatformName }) {
  if (electronPlatformName !== 'darwin') return

  const frameworks = path.join(appOutDir, SOURCE_APP, 'Contents', 'Frameworks')
  const helper = path.join(frameworks, SOURCE_HELPER)
  if (await exists(helper)) return

  const executableDir = path.join(helper, 'Contents', 'MacOS')
  await mkdir(executableDir, { recursive: true })
  await writeFile(path.join(executableDir, 'Lynxtron Helper'), '')
  await writeFile(path.join(helper, MARKER), '')
}

export async function afterPack({ appOutDir, electronPlatformName }) {
  if (electronPlatformName !== 'darwin') return

  const helper = path.join(
    appOutDir,
    'Synara Lynx.app',
    'Contents',
    'Frameworks',
    PACKAGED_HELPER,
  )
  const marker = path.join(helper, MARKER)
  if (!(await exists(marker))) return

  await rm(helper, { recursive: true })
}
