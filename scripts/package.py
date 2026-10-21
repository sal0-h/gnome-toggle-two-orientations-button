#!/usr/bin/env python3
"""Package the extension and compiled settings without development files."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
uuid = "toggle-two-orientations@sal0-h"
output = root / "dist" / f"{uuid}.shell-extension.zip"
output.parent.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory() as temporary:
    staging = Path(temporary) / uuid
    shutil.copytree(root / uuid, staging, ignore=shutil.ignore_patterns("gschemas.compiled"))
    shutil.copy2(root / "LICENSE", staging / "LICENSE")
    shutil.copy2(root / "README.md", staging / "README.md")
    subprocess.run(["glib-compile-schemas", "--strict", str(staging / "schemas")], check=True)
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(staging.rglob("*")):
            if path.is_file():
                archive.write(path, path.relative_to(staging))
print(output)
