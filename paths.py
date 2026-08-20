"""GenericAgent filesystem roots — single source of truth.

Two roots, split by responsibility so packaged builds stop "sealing" user data:

- APP_DIR : read-only code + bundled default resources (this repo / the packaged
            bundle). On macOS this lives inside a signed .app and must stay untouched.
- DATA_DIR: user-writable data root (task outputs under temp/, and memory/). Packaged
            builds default it to ``~/GenericAgent_Data`` so users can both *reach* their
            reports (it sits right at the top of the home folder, unlike hidden AppData)
            and rely on it (the home root itself is never OneDrive/Known-Folder
            redirected, unlike ~/Documents); source/dev checkouts keep it in-place
            (== APP_DIR) so the existing developer workflow is unchanged.

Resolution precedence for DATA_DIR (see ``data_dir_for``):
  1. ``GA_DATA_DIR`` environment variable (explicit override, highest priority)
  2. source/dev checkout (the core dir contains ``.git``) -> in-place (== core dir)
  3. packaged run -> ``~/GenericAgent_Data`` (see ``_user_data_root``)

We deliberately do NOT use ``~/Documents``: it depends on the username, is localized,
and is frequently redirected to OneDrive/Known-Folder placeholders that reject
directory creation (observed WinError 2/3 on real machines). We also avoid hidden
platform app-data dirs (``%LOCALAPPDATA%`` / ``~/Library/Application Support``): they
are reliable but not discoverable, and the whole point here is that users can copy
their reports out. The home root (``~``/``%USERPROFILE%``) is both reliably writable
and visible, so a plain ``GenericAgent_Data`` folder there is the best of both.

temp/ and memory/ are relocated together on purpose: the agent reaches memory via
``../memory`` relative to its temp cwd, so they must share the same data root.
"""

import os
import sys
import shutil

APP_DIR = os.path.dirname(os.path.abspath(__file__))


def _user_data_root():
    """Always-writable *and* discoverable data root: ``~/GenericAgent_Data``.

    The home root is resolved from ``%USERPROFILE%`` (win) / ``$HOME`` (unix), so it
    never hardcodes a username and is locale-independent. Unlike ~/Documents, the home
    root itself is never OneDrive/Known-Folder redirected, so directory creation always
    succeeds; unlike hidden AppData dirs, it is right in front of the user."""
    home = os.environ.get("USERPROFILE") if sys.platform == "win32" else None
    home = home or os.path.expanduser("~")
    return os.path.join(home, "GenericAgent_Data")


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
    # relocation). Packaged bundles never ship .git.
    if os.path.isdir(os.path.join(core_dir, ".git")):
        return core_dir
    return _user_data_root()


DATA_DIR = data_dir_for(APP_DIR)
TEMP_DIR = os.path.join(DATA_DIR, "temp")
MEMORY_DIR = os.path.join(DATA_DIR, "memory")


def temp_dir(*parts):
    return os.path.join(TEMP_DIR, *parts) if parts else TEMP_DIR


def memory_dir(*parts):
    return os.path.join(MEMORY_DIR, *parts) if parts else MEMORY_DIR


def app_path(*parts):
    return os.path.join(APP_DIR, *parts)


def mykey_path():
    """User credentials/config file — lives on the writable data side so packaged
    builds can create/edit it and it survives app upgrades (APP_DIR is read-only)."""
    return os.path.join(DATA_DIR, "mykey.py")


def sys_prompt_override(lang_suffix=""):
    """Optional user override for the baseline system prompt (P1-A). When this file
    exists under DATA_DIR its content is layered on top of the bundled sys_prompt."""
    return os.path.join(DATA_DIR, f"sys_prompt_override{lang_suffix}.txt")


def plugin_dirs():
    """Plugin search roots: bundled plugins in APP_DIR plus, for packaged/external
    runs, a user drop-in dir under DATA_DIR so custom plugins survive upgrades and
    don't require touching the read-only bundle. In dev (DATA_DIR == APP_DIR) only
    the single in-place plugins dir is returned."""
    dirs = [os.path.join(APP_DIR, "plugins")]
    if os.path.abspath(DATA_DIR) != os.path.abspath(APP_DIR):
        dirs.append(os.path.join(DATA_DIR, "plugins"))
    return dirs


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
            # User plugin drop-in dir (P1-B): create an empty, obvious place for
            # custom plugins so users don't have to touch the read-only bundle.
            os.makedirs(os.path.join(DATA_DIR, "plugins"), exist_ok=True)
    except Exception:
        pass


ensure_ready()
