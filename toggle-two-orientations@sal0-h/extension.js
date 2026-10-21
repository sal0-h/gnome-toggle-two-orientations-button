// SPDX-License-Identifier: GPL-3.0-or-later
// Original extension: Copyright 2025 Rotopenguin.
// Maintained fork of Rotopenguin's orientation toggle; see README.md for credits.
import Gio from 'gi://Gio';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

import {Rotator} from './rotator.js';

export default class OrientationExtension extends Extension {
    enable() {
        this._rotator = new Rotator(this.getSettings());
        this._toggle = new QuickSettings.QuickToggle({
            title: 'Rotate display',
            iconName: 'object-rotate-left-symbolic',
            toggleMode: false,
        });
        this._toggle.connect('clicked', () => this._rotate());
        this._indicator = new QuickSettings.SystemIndicator();
        this._indicator.quickSettingsItems.push(this._toggle);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
    }

    async _rotate() {
        const toggle = this._toggle;
        if (!toggle?.reactive)
            return;
        toggle.reactive = false;
        try {
            await this._rotator.rotate();
            if (this._toggle === toggle)
                Main.panel.statusArea.quickSettings.menu.close();
        } catch (error) {
            if (this._toggle === toggle && !error.matches?.(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) {
                this.getLogger().error(error);
                Main.notifyError('Could not rotate display', error.message);
            }
        } finally {
            if (this._toggle === toggle)
                toggle.reactive = true;
        }
    }

    disable() {
        this._rotator?.destroy();
        this._rotator = null;
        this._toggle?.destroy();
        this._toggle = null;
        if (this._indicator) {
            this._indicator.quickSettingsItems.length = 0;
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
