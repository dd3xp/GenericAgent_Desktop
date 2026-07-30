"""GenericAgent filesystem roots — single source of truth.

Two roots, split by responsibility so packaged builds stop "sealing" user data:

- APP_DIR : read-only code + bundled default resources (this repo / the packaged
            bundle). On macOS this lives inside a signed .app and must stay untouched.
- DATA_DIR: user-writable data root (task outputs under temp/, and memory/). Packaged
            builds default it to ``~/Documents/GenericAgent`` so users can actually
            reach their reports and customize memory; source/dev checkouts keep it
            in-place (== APP_DIR) so the existing developer workflow is unchanged.

Resolution precedence for DATA_DIR (see ``data_dir_for``):
  1. ``GA_DATA_DIR`` environment variable (explicit override, highest priority)
  2. source/dev checkout (the core dir contains ``.git``) -> in-place (== core dir)
  3. packaged run -> ``~/Documents/GenericAgent``

temp/ and memory/ are relocated together on purpose: the agent reaches memory via
``../memory`` relative to its temp cwd, so they must share the same data root.
"""

import os
import shutil

APP_DIR = os.path.dirname(os.path.abspath(__file__))


def data_dir_for(core_dir):
    """Resolve the writable data root for a given code/core directory.

    Kept as a pure function so separate processes (desktop bridge + the spawned
    agent core) can compute an identical DATA_DIR from the same core directory.
    """
    env = (os.environ.get("GA_DATA_DIR") or "").strip()
    if env:
        return os.path.abspath(os.path.expanduser(env))
    core_dir = os.path.abspath(core_dir)
    # A git checkout means a source/developer run -> keep data in-place (no surprise
    # relocation to Documents). Packaged bundles never ship .git.
    if os.path.isdir(os.path.join(core_dir, ".git")):
        return core_dir
    return os.path.join(os.path.expanduser("~"), "Documents", "GenericAgent")


DATA_DIR = data_dir_for(APP_DIR)
TEMP_DIR = os.path.join(DATA_DIR, "temp")
MEMORY_DIR = os.path.join(DATA_DIR, "memory")


def temp_dir(*parts):
    return os.path.join(TEMP_DIR, *parts) if parts else TEMP_DIR


def memory_dir(*parts):
    return os.path.join(MEMORY_DIR, *parts) if parts else MEMORY_DIR


def app_path(*parts):
    return os.path.join(APP_DIR, *parts)


_READY = False


def ensure_ready():
    """Create the data root and seed default memory on first run (idempotent).

    - Always ensures ``DATA_DIR/temp`` exists.
    - When data is external (DATA_DIR != APP_DIR) and memory has not been seeded
      yet, copies the bundled ``memory/`` defaults over so the agent's ``../memory``
      access and get_global_memory keep working. Existing user edits are never
      overwritten (we only seed when the whole memory dir is absent).
    Note: the ``memory`` Python package is still imported from APP_DIR, so helper
    ``.py`` under memory/ keep tracking app upgrades; only file-based ``.md``/``.txt``
    reads/writes use DATA_DIR.
    """
    global _READY
    if _READY:
        return
    _READY = True
    try:
        os.makedirs(TEMP_DIR, exist_ok=True)
    except Exception:
        pass
    try:
        if os.path.abspath(DATA_DIR) != os.path.abspath(APP_DIR):
            src = os.path.join(APP_DIR, "memory")
            if os.path.isdir(src) and not os.path.isdir(MEMORY_DIR):
                shutil.copytree(src, MEMORY_DIR)
    except Exception:
        pass


ensure_ready()
