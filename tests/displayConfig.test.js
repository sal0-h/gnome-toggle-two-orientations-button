import assert from 'node:assert/strict';
import test from 'node:test';
import {buildRotationRequest} from '../toggle-two-orientations@sal0-h/displayConfig.js';

function monitor(connector, width, height, properties = {}) {
    return [[connector, 'Test', 'Display', connector],
        [[`${width}x${height}`, width, height, 60, 1, [1, 1.25, 1.75], {'is-current': true}]],
        properties];
}

function logical(display, x, y, scale = 1, transform = 0, primary = false) {
    return [x, y, scale, transform, primary, [display[0]], {}];
}

function sideBySide() {
    const builtin = monitor('eDP-1', 1920, 1080, {'is-builtin': true, 'color-mode': 0});
    const tablet = monitor('Meta-0', 2296, 1428, {'rgb-range': 0});
    return [42, [builtin, tablet], [
        logical(builtin, 0, 0, 1.25, 2, true),
        logical(tablet, 1536, 0, 1.75),
    ], {'layout-mode': 1, 'supports-changing-layout-mode': true}];
}

test('fractional-scale laptop rotation keeps the adjacent tablet attached', () => {
    const state = sideBySide();
    const original = structuredClone(state);
    const request = buildRotationRequest(state, 2, 3);
    assert.equal(request.serial, 42);
    assert.equal(request.logicalMonitors[0][3], 3);
    assert.equal(request.logicalMonitors[1][0], 864);
    assert.equal(request.logicalMonitors[1][2], 1.75);
    assert.equal(request.logicalMonitors[0][4], true);
    assert.deepEqual(request.logicalMonitors[0][5][0], ['eDP-1', '1920x1080', {'color-mode': 0}]);
    assert.deepEqual(request.logicalMonitors[1][5][0][2], {'rgb-range': 0});
    assert.deepEqual(state, original);
});

test('rotating back restores the adjacent display position', () => {
    const state = sideBySide();
    const first = buildRotationRequest(state, 2, 3);
    state[2] = state[2].map((entry, index) => [...first.logicalMonitors[index].slice(0, 5), entry[5], entry[6]]);
    const second = buildRotationRequest(state, 2, 3);
    assert.equal(second.logicalMonitors[0][3], 2);
    assert.equal(second.logicalMonitors[1][0], 1536);
});

test('displays below the target move with its bottom edge', () => {
    const state = sideBySide();
    state[2][1][0] = 0;
    state[2][1][1] = 864;
    const request = buildRotationRequest(state, 2, 3);
    assert.equal(request.logicalMonitors[1][1], 1536);
});

test('external-only configurations rotate the primary display', () => {
    const first = monitor('DP-1', 1920, 1080);
    const primary = monitor('HDMI-1', 1920, 1080);
    const state = [1, [first, primary], [logical(first, 0, 0), logical(primary, 1920, 0, 1, 0, true)], {}];
    const request = buildRotationRequest(state, 0, 1);
    assert.equal(request.logicalMonitors[0][3], 0);
    assert.equal(request.logicalMonitors[1][3], 1);
});

test('a disabled built-in display does not override the active primary display', () => {
    const builtin = monitor('eDP-1', 1920, 1080, {'is-builtin': true});
    builtin[1][0][6]['is-current'] = false;
    const external = monitor('DP-1', 1920, 1080);
    const request = buildRotationRequest([1, [builtin, external], [logical(external, 0, 0, 1, 0, true)], {}], 0, 1);
    assert.equal(request.logicalMonitors[0][3], 1);
    assert.equal(request.logicalMonitors[0][5].length, 1);
});

test('mirrored monitors retain their group and individual settings', () => {
    const first = monitor('eDP-1', 1920, 1080, {'is-builtin': true});
    const second = monitor('HDMI-1', 1920, 1080, {'is-underscanning': false});
    const group = logical(first, 0, 0, 1, 0, true);
    group[5].push(second[0]);
    const request = buildRotationRequest([1, [first, second], [group], {}], 0, 3);
    assert.equal(request.logicalMonitors[0][3], 3);
    assert.equal(request.logicalMonitors[0][5].length, 2);
    assert.deepEqual(request.logicalMonitors[0][5][1][2], {underscanning: false});
});

test('physical layout coordinates do not divide by display scale', () => {
    const state = sideBySide();
    state[3]['layout-mode'] = 2;
    state[2][1][0] = 1920;
    const request = buildRotationRequest(state, 2, 3);
    assert.equal(request.logicalMonitors[1][0], 1080);
});

test('leased displays remain leased and unsupported layout changes are omitted', () => {
    const state = sideBySide();
    const leased = monitor('DP-9', 1920, 1080, {'is-for-lease': true});
    state[1].push(leased);
    state[3]['supports-changing-layout-mode'] = false;
    const request = buildRotationRequest(state, 2, 3);
    assert.deepEqual(request.properties, {'monitors-for-lease': [leased[0]]});
});

test('invalid settings, empty layouts, and missing modes fail before applying', () => {
    assert.throws(() => buildRotationRequest(sideBySide(), 1, 3), /Invalid/);
    assert.throws(() => buildRotationRequest([1, [], [], {}], 0, 1), /No active/);
    const state = sideBySide();
    state[1][0][1][0][6]['is-current'] = false;
    assert.throws(() => buildRotationRequest(state, 0, 1), /No active display mode/);
});
