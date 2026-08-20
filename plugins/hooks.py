import os
import sys
import importlib

# 模块级注册表: event_name -> [callback, ...]
_registry = {}
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def register(event):
    def decorator(fn):
        _registry.setdefault(event, []).append(fn)
        return fn
    return decorator


def trigger(event, ctx: dict):
    for fn in _registry.get(event, []):
        try:
            r = fn(ctx)
            if isinstance(r, dict):
                ctx = r
        except Exception as e:
            sys.stderr.write(f"[hooks] {event} callback error: {e}\n")
    return ctx


def unregister(event, fn):
    try:
        _registry[event] = [f for f in _registry[event] if f is not fn]
    except KeyError:
        pass


def clear(event=None):
    if event:
        _registry.pop(event, None)
    else:
        _registry.clear()


def has(event):
    return bool(_registry.get(event))


def discover_and_load(plugin_dir=None):
    # Bundled plugins: the real ``plugins`` package under APP_DIR.
    if plugin_dir is None:
        plugin_dir = os.path.join(_PROJECT_ROOT, 'plugins')
    if os.path.isdir(plugin_dir):
        parent = os.path.dirname(plugin_dir)
        if parent not in sys.path:
            sys.path.insert(0, parent)
        for fn in sorted(os.listdir(plugin_dir)):
            if fn.startswith('_') or not fn.endswith('.py'):
                continue
            load(fn[:-3])
    # P1-B: user drop-in plugins from the writable data root, so custom plugins
    # survive upgrades and don't require touching the read-only bundle.
    _load_user_plugins()


def _load_user_plugins():
    try:
        import paths
        dirs = paths.plugin_dirs()
    except Exception:
        return
    bundled = os.path.abspath(os.path.join(_PROJECT_ROOT, 'plugins'))
    for d in dirs:
        if os.path.abspath(d) == bundled or not os.path.isdir(d):
            continue  # bundled dir already handled above
        for fn in sorted(os.listdir(d)):
            if fn.startswith('_') or not fn.endswith('.py'):
                continue
            load_file(os.path.join(d, fn))


def load(name):
    try:
        importlib.import_module(f'plugins.{name}')
        return True
    except Exception as e:
        sys.stderr.write(f"[hooks] plugin '{name}' load failed: {e}\n")
        return False


def load_file(path):
    """Load a standalone user plugin by file path (outside the ``plugins`` package).

    Registers under a unique synthetic module name so it never collides with a bundled
    ``plugins.<name>``. The file only needs ``from plugins.hooks import register`` to hook
    into the shared registry, so any module name works."""
    import importlib.util
    name = 'ga_user_plugin_' + os.path.splitext(os.path.basename(path))[0]
    try:
        spec = importlib.util.spec_from_file_location(name, path)
        mod = importlib.util.module_from_spec(spec)
        sys.modules[name] = mod
        spec.loader.exec_module(mod)
        return True
    except Exception as e:
        sys.stderr.write(f"[hooks] user plugin '{path}' load failed: {e}\n")
        return False