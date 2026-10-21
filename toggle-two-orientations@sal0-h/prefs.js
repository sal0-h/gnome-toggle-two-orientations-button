// SPDX-License-Identifier: GPL-3.0-or-later
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class OrientationPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Display orientations',
            description: 'Rotate the built-in display, or the primary display when no built-in display is active.',
        });
        const signals = [];
        for (const [key, title, labels] of [
            ['orientation-a', 'Landscape orientation', ['Normal (0°)', 'Upside down (180°)']],
            ['orientation-b', 'Portrait orientation', ['Left (90°)', 'Right (270°)']],
        ]) {
            const row = new Adw.ComboRow({
                title,
                model: Gtk.StringList.new(labels),
                selected: settings.get_boolean(key) ? 0 : 1,
            });
            row.connect('notify::selected', () => settings.set_boolean(key, row.selected === 0));
            signals.push(settings.connect(`changed::${key}`, () => {
                row.selected = settings.get_boolean(key) ? 0 : 1;
            }));
            group.add(row);
        }
        page.add(group);
        window.add(page);
        window.connect('close-request', () => {
            for (const signal of signals)
                settings.disconnect(signal);
            return false;
        });
    }
}
