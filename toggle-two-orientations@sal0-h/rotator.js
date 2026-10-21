// SPDX-License-Identifier: GPL-3.0-or-later
// Original rotator: Copyright 2022 kosmospredanie and shyzus.
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {buildRotationRequest} from './displayConfig.js';

const NAME = 'org.gnome.Mutter.DisplayConfig';
const PATH = '/org/gnome/Mutter/DisplayConfig';
const SIGNATURE = '(uua(iiduba(ssa{sv}))a{sv})';

export function packRotationRequest(request, method) {
    const logical = request.logicalMonitors.map(entry => [
        ...entry.slice(0, 5),
        entry[5].map(([connector, mode, options]) => [connector, mode,
            Object.fromEntries(Object.entries(options).map(([key, value]) => [
                key, new GLib.Variant(key === 'underscanning' ? 'b' : 'u', value),
            ])),
        ]),
    ]);
    const options = Object.fromEntries(Object.entries(request.properties).map(([key, value]) => [
        key, new GLib.Variant(key === 'monitors-for-lease' ? 'a(ssss)' : 'u', value),
    ]));
    return new GLib.Variant(SIGNATURE, [request.serial, method, logical, options]);
}

export class Rotator {
    constructor(settings) {
        this._settings = settings;
        this._connection = Gio.DBus.session;
        this._cancellable = new Gio.Cancellable();
    }

    _call(method, parameters = null) {
        return new Promise((resolve, reject) => {
            this._connection.call(NAME, PATH, NAME, method, parameters, null,
                Gio.DBusCallFlags.NONE, 10000, this._cancellable, (connection, result) => {
                    try {
                        resolve(connection.call_finish(result));
                    } catch (error) {
                        reject(error);
                    }
                });
        });
    }

    async rotate() {
        const landscape = this._settings.get_boolean('orientation-a') ? 0 : 2;
        const portrait = this._settings.get_boolean('orientation-b') ? 1 : 3;
        const state = (await this._call('GetCurrentState')).recursiveUnpack();
        const request = buildRotationRequest(state, landscape, portrait);
        await this._call('ApplyMonitorsConfig', packRotationRequest(request, 0));
        await this._call('ApplyMonitorsConfig', packRotationRequest(request, 1));
    }

    destroy() {
        this._cancellable.cancel();
        this._settings = null;
    }
}
