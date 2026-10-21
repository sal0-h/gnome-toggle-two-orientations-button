// Run only through gnome-shell-test-tool --headless with an isolated extension.
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {sleep} from 'resource:///org/gnome/shell/ui/scripting.js';

export const METRICS = {};
const UUID = 'toggle-two-orientations@sal0-h';

async function waitFor(predicate) {
    for (let i = 0; i < 80; i++) {
        if (predicate())
            return;
        await sleep(100);
    }
    throw new Error(`Extension did not reach expected state: ${Main.extensionManager.lookup(UUID)?.error}`);
}

async function transform() {
    return new Promise((resolve, reject) => Gio.DBus.session.call('org.gnome.Mutter.DisplayConfig',
        '/org/gnome/Mutter/DisplayConfig', 'org.gnome.Mutter.DisplayConfig', 'GetCurrentState',
        null, null, Gio.DBusCallFlags.NONE, 5000, null, (connection, result) => {
            try { resolve(connection.call_finish(result).recursiveUnpack()[2].find(entry => entry[4])[3]); }
            catch (error) { reject(error); }
        }));
}

export async function run() {
    await waitFor(() => Main.extensionManager.lookup(UUID)?.state === 1);
    const extension = Main.extensionManager.lookup(UUID).stateObj;
    const before = await transform();
    await extension._rotator.rotate();
    if (await transform() === before)
        throw new Error('Virtual display did not rotate');
    await extension._rotator.rotate();
    if (await transform() !== before)
        throw new Error('Virtual display did not rotate back');
    const pending = extension._rotate();
    Main.extensionManager.disableExtension(UUID);
    await waitFor(() => Main.extensionManager.lookup(UUID)?.state === 2);
    await pending;
    Main.extensionManager.enableExtension(UUID);
    await waitFor(() => Main.extensionManager.lookup(UUID)?.state === 1);
    print('PASS: virtual display rotation, cancellation and extension enable/disable');
}
