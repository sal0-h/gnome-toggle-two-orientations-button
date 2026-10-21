// SPDX-License-Identifier: GPL-3.0-or-later
// Original display state model: Copyright 2024 kosmospredanie and shyzus.
// Mutter DisplayConfig model, derived from the original orientation toggle.

function currentMode(monitor) {
    const mode = monitor[1].find(entry => entry[6]['is-current']);
    if (!mode)
        throw new Error(`No active display mode for ${monitor[0][0]}.`);
    return mode;
}

function dimensions(logical, monitors, layoutMode) {
    const monitor = monitors.find(entry => entry[0][0] === logical[5][0][0]);
    if (!monitor)
        throw new Error('An active display was disconnected. Try again.');
    const mode = currentMode(monitor);
    const rotated = logical[3] % 2 === 1;
    const scale = layoutMode === 2 ? 1 : logical[2];
    return {
        width: Math.round((rotated ? mode[2] : mode[1]) / scale),
        height: Math.round((rotated ? mode[1] : mode[2]) / scale),
    };
}

export function buildRotationRequest(state, landscape, portrait) {
    if (![0, 2].includes(landscape) || ![1, 3].includes(portrait))
        throw new Error('Invalid landscape or portrait orientation.');
    const [serial, monitors, originalLogical, properties] = state;
    if (!originalLogical.length)
        throw new Error('No active displays are available.');

    const logical = originalLogical.map(entry => [...entry]);
    const active = new Set(logical.flatMap(entry => entry[5].map(spec => spec[0])));
    const builtin = monitors.find(monitor => active.has(monitor[0][0]) && monitor[2]['is-builtin']);
    const target = builtin
        ? logical.find(entry => entry[5].some(spec => spec[0] === builtin[0][0]))
        : logical.find(entry => entry[4]) ?? logical[0];
    const layoutMode = properties['layout-mode'] ?? 1;
    const before = dimensions(target, monitors, layoutMode);
    target[3] = target[3] === landscape ? portrait : landscape;
    const after = dimensions(target, monitors, layoutMode);

    // Keep monitors to the right and below attached when width/height changes.
    for (const entry of logical) {
        if (entry === target)
            continue;
        if (entry[0] >= target[0] + before.width)
            entry[0] += after.width - before.width;
        if (entry[1] >= target[1] + before.height)
            entry[1] += after.height - before.height;
    }

    const assignments = logical.map(entry => [
        ...entry.slice(0, 5),
        entry[5].map(spec => {
            const monitor = monitors.find(candidate => candidate[0][0] === spec[0]);
            if (!monitor)
                throw new Error('An active display was disconnected. Try again.');
            const options = {};
            for (const [source, destination] of [
                ['is-underscanning', 'underscanning'],
                ['color-mode', 'color-mode'],
                ['rgb-range', 'rgb-range'],
            ]) {
                if (source in monitor[2])
                    options[destination] = monitor[2][source];
            }
            return [spec[0], currentMode(monitor)[0], options];
        }),
    ]);
    const options = {};
    if (properties['supports-changing-layout-mode'] && 'layout-mode' in properties)
        options['layout-mode'] = properties['layout-mode'];
    const leased = monitors.filter(monitor => monitor[2]['is-for-lease']).map(monitor => monitor[0]);
    if (leased.length)
        options['monitors-for-lease'] = leased;
    return {serial, logicalMonitors: assignments, properties: options};
}
