from frontends import auth_gate


def test_loopback_request_requires_loopback_host():
    assert auth_gate.is_loopback_request("127.0.0.1", "127.0.0.1:14168")
    assert auth_gate.is_loopback_request("::1", "[::1]:14168")
    assert auth_gate.is_loopback_request("127.0.0.1", "localhost:14168")


def test_reverse_tunnel_with_public_host_is_not_trusted():
    assert not auth_gate.is_loopback_request("127.0.0.1", "frp-fee.com:14168")
    assert not auth_gate.is_loopback_request("::1", "ga.example.com")


def test_remote_client_is_not_trusted_with_loopback_host():
    assert not auth_gate.is_loopback_request("203.0.113.8", "127.0.0.1:14168")
