# Display Orientation Toggle

A GNOME Shell 51 Quick Settings button that switches a display between your
preferred landscape and portrait orientations. This fork is maintained by
[sal0-h](https://github.com/sal0-h).

The button rotates the active built-in display. If there is no active built-in
display, it rotates the primary display. Use the extension's preferences to
choose normal or upside-down landscape and left or right portrait.

## Install

Download `toggle-two-orientations@sal0-h.shell-extension.zip` from
[Releases](https://github.com/sal0-h/gnome-toggle-two-orientations-button/releases)
and install it:

```sh
gnome-extensions install --force toggle-two-orientations@sal0-h.shell-extension.zip
```

Log out and back in, then enable **Display Orientation Toggle** in Extensions.
Disable the original `toggle-two-orientations@rotopenguin.net` extension so only
one rotation button is active. The fork uses its own extension ID and settings
schema; upstream updates cannot replace it.

For the original settings, `orientation-a` and `orientation-b` map directly to
the same two keys in `org.gnome.shell.extensions.toggle-two-orientations.sal0-h`.
New installations default to normal landscape and left portrait.

## Behavior and limits

Changes use Mutter's temporary display configuration method and do not write a
saved monitor layout. Active display modes, scales, primary display, color
settings, and mirrored groups are retained. Displays to the right and below
move with the rotated display's edge so common multi-monitor layouts stay
connected. Mutter verifies the proposed configuration before applying it.

Complex arrangements may be rejected by Mutter. The extension shows the error
and leaves the displays as they were if verification fails. Rapid clicks are
ignored while a rotation is pending; disabling the extension cancels pending
requests. GNOME's automatic rotation can still change orientation when enabled.

Only GNOME Shell 51 is currently supported. Additional Shell versions should be
added after testing them.

## Development

```sh
make check  # Model tests, JavaScript syntax, and settings validation
make pack   # Also creates the installable zip under dist/
```

Requirements: Node.js 22 or newer, Python 3, and `glib-compile-schemas`.
There are no npm dependencies. CI runs the same checks and packages the extension.
GNOME runtime testing should cover repeated enable/disable, both orientation
preferences, cancellation, a single display, and multiple displays. Record which
Shell version and monitor arrangements were tested when reporting a bug.

On a GNOME 51 machine, the isolated runtime smoke test rotates a virtual display:

```sh
dbus-run-session -- gnome-shell-test-tool --headless --disable-animations \
  --extension dist/toggle-two-orientations@sal0-h.shell-extension.zip tests/shell-smoke.js
```

## Credits and license

Forked from [Rotopenguin's Toggle Between Two Display Orientations](https://github.com/rotopenguin/gnome-toggle-two-orientations-button),
with the upstream Git history preserved. The original extension credits
shyzus, kosmospredanie, and efosmark and was inspired by
[screen-autorotate](https://github.com/shyzus/gnome-shell-extension-screen-autorotate).

This fork updates the Shell integration, display configuration handling,
preferences, cleanup, tests, and packaging. The upstream GPL license is retained
in [LICENSE](LICENSE).
