"""Authentication gate shared by desktop_bridge (aiohttp) and conductor (FastAPI).

设计原则
--------
- 密码 **不在仓库**:bcrypt 哈希存到 `~/.ga_auth/password.hash`(0600),目录 0700。
- 签名密钥(HMAC SHA-256)也存 `~/.ga_auth/cookie_secret.key`(0600),首次随机生成。
- Cookie token 格式 `{expiry_ts}.{hex_sig}`,30 天过期,HttpOnly,SameSite=Lax。
- 首次访问:`is_initialized() == False`,前端弹两次输入框 → POST /auth/set。
- 之后:POST /auth/login。两个接口都成功后,Set-Cookie。
- WebSocket 也用同一个 cookie(在 upgrade 请求头里),握手阶段校验。

注意
----
本模块**不读 mykey / 不接触 LLM**,只管"是不是允许通过门"。
"""
from __future__ import annotations
import os, hmac, hashlib, json, secrets, time, base64
from pathlib import Path
from typing import Optional

COOKIE_NAME = "ga_auth"
EXPIRY_SECONDS = 30 * 24 * 3600  # 30 天
MIN_PASSWORD_LEN = 8

# 可通过环境变量自定义目录(便于测试 / 多用户)
_AUTH_DIR_ENV = "GA_AUTH_DIR"
_DEFAULT_AUTH_DIR = Path.home() / ".ga_auth"


def _auth_dir() -> Path:
    p = Path(os.environ.get(_AUTH_DIR_ENV) or _DEFAULT_AUTH_DIR)
    return p


def _ensure_dir() -> Path:
    d = _auth_dir()
    d.mkdir(parents=True, exist_ok=True)
    try: d.chmod(0o700)
    except Exception: pass
    return d


def _hash_path() -> Path: return _auth_dir() / "password.hash"
def _secret_path() -> Path: return _auth_dir() / "cookie_secret.key"


def _get_cookie_secret() -> bytes:
    _ensure_dir()
    p = _secret_path()
    if not p.is_file() or p.stat().st_size < 16:
        p.write_bytes(secrets.token_bytes(32))
        try: p.chmod(0o600)
        except Exception: pass
    return p.read_bytes()


# ── 密码:bcrypt 哈希 ─────────────────────────────────────────────────────────
def _bcrypt():
    """Lazy import,缺少 bcrypt 时给一个清楚的报错。"""
    try:
        import bcrypt
        return bcrypt
    except ImportError as e:
        raise RuntimeError(
            "鉴权模块依赖 bcrypt,请在运行 bridge/conductor 的环境里 `pip install bcrypt`。"
        ) from e


def is_initialized() -> bool:
    p = _hash_path()
    try: return p.is_file() and p.stat().st_size > 0
    except Exception: return False


def set_password(password: str) -> None:
    if not password or len(password) < MIN_PASSWORD_LEN:
        raise ValueError(f"password too short (need ≥ {MIN_PASSWORD_LEN})")
    bcrypt = _bcrypt()
    _ensure_dir()
    h = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12))
    p = _hash_path()
    p.write_bytes(h)
    try: p.chmod(0o600)
    except Exception: pass


def verify_password(password: str) -> bool:
    if not is_initialized() or not password: return False
    bcrypt = _bcrypt()
    try:
        return bcrypt.checkpw(password.encode("utf-8"), _hash_path().read_bytes())
    except Exception:
        return False


# ── Token:HMAC 签名(过期时间戳).(hex) ──────────────────────────────────────
def sign_token(now: Optional[int] = None, ttl: int = EXPIRY_SECONDS) -> str:
    exp = int(now if now is not None else time.time()) + int(ttl)
    secret = _get_cookie_secret()
    sig = hmac.new(secret, str(exp).encode(), hashlib.sha256).hexdigest()
    return f"{exp}.{sig}"


def verify_token(token: str) -> bool:
    if not token or "." not in token: return False
    try:
        exp_s, sig = token.split(".", 1)
        exp = int(exp_s)
        if exp < time.time(): return False
        secret = _get_cookie_secret()
        expected = hmac.new(secret, exp_s.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig, expected)
    except Exception:
        return False


# ── 路由白名单(鉴权之前可访问) ────────────────────────────────────────────
PUBLIC_PATHS = frozenset({
    "/auth", "/auth/", "/auth.html", "/auth.js", "/auth.css",
    "/auth/status", "/auth/set", "/auth/login", "/favicon.ico",
})


def is_public_path(path: str) -> bool:
    if path in PUBLIC_PATHS: return True
    if path.startswith("/static/auth/"): return True
    if path.startswith("/auth/"): return True  # 兜底
    return False


_LOOPBACK_HOSTS = frozenset({"127.0.0.1", "::1", "localhost"})


def is_loopback_client(client_host: str) -> bool:
    """同机进程互调(127.0.0.1 / ::1)直接放行——conductor agent 跟 bridge agent
    都通过 http://127.0.0.1:PORT 调自己的 API,没 cookie 但本质上跟"用户在键盘上敲"
    安全等价。外部走 frp 隧道仍然要 cookie。"""
    return (client_host or "") in _LOOPBACK_HOSTS


def _hostname(request_host: str) -> str:
    value = (request_host or "").strip().lower()
    if value.startswith("["):
        end = value.find("]")
        return value[1:end] if end > 0 else value
    return value.split(":", 1)[0]


def is_loopback_request(client_host: str, request_host: str) -> bool:
    """Only trust loopback traffic addressed to a loopback Host.

    Local reverse tunnels such as FRP connect to the service from 127.0.0.1 while
    retaining the public Host header. Treating client_host alone as trusted would
    therefore bypass authentication for public requests.
    """
    return is_loopback_client(client_host) and is_loopback_client(_hostname(request_host))
