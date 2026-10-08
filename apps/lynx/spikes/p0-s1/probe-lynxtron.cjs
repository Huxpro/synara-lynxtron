// P0-S1 probe: dump the native `lynxtron` binding keys at runtime.
// Run: npx lynxtron probe-lynxtron.cjs  (cwd = app dir)
try {
  const lt = require('lynxtron');
  const keys = Object.keys(lt).sort();
  console.log('LYNXTRON_KEYS=' + keys.join(','));
  console.log('HAS_UTILITY_PROCESS=' + (typeof lt.utilityProcess));
  if (lt.utilityProcess) {
    console.log('UTILITY_PROCESS_KEYS=' + Object.keys(lt.utilityProcess).join(','));
  }
  console.log('HAS_IPC_MAIN=' + (typeof lt.ipcMain));
  console.log('HAS_GLOBAL_SHORTCUT=' + (typeof lt.globalShortcut));
  console.log('HAS_SESSION=' + (typeof lt.session));
  console.log('HAS_AUTO_UPDATER=' + (typeof lt.autoUpdater));
  console.log('PROCESS_VERSIONS=' + JSON.stringify(process.versions));
} catch (e) {
  console.log('PROBE_ERROR=' + (e && e.message));
}
// App may keep running (event loop); force quit.
setTimeout(() => process.exit(0), 500);
