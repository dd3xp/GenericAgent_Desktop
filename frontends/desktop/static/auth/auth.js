(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  var hint = $('hint'), p1 = $('p1'), p2 = $('p2'),
      submit = $('submit'), err = $('err'), form = $('form');

  var initialized = false;

  function setErr(msg) { err.textContent = msg || ''; }

  function lock(locked) {
    submit.disabled = !!locked;
    p1.disabled = !!locked;
    p2.disabled = !!locked;
  }

  function refreshUI() {
    if (initialized) {
      hint.textContent = '请输入密码登录。';
      p2.hidden = true;
      submit.textContent = '登录';
    } else {
      hint.textContent = '首次访问,请设置密码 —— 需要输入两次确认,设置后用它登录。';
      p2.hidden = false;
      submit.textContent = '设置密码';
    }
    submit.disabled = false;
  }

  function fetchJSON(url, opts) {
    opts = opts || {};
    opts.credentials = 'same-origin';
    if (opts.body && typeof opts.body !== 'string') {
      opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
      opts.body = JSON.stringify(opts.body);
    }
    return fetch(url, opts).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, status: r.status, body: j }; },
                           function () { return { ok: r.ok, status: r.status, body: {} }; });
    });
  }

  function gotoApp() {
    // 登录成功后回到桌面端入口;直接换路径让浏览器重新走一次根
    location.replace('/');
  }

  function doSubmit() {
    setErr('');
    var v1 = p1.value, v2 = p2.value;
    if (!v1) { setErr('请输入密码'); return; }

    if (!initialized) {
      if (v1 !== v2) { setErr('两次输入不一致'); return; }
      if (v1.length < 8) { setErr('密码至少需要 8 个字符'); return; }
      lock(true);
      fetchJSON('/auth/set', { method: 'POST', body: { password1: v1, password2: v2 } })
        .then(function (r) {
          if (r.ok && r.body.ok) { gotoApp(); return; }
          lock(false);
          setErr((r.body && r.body.error) ? labelFor(r.body.error) : '设置失败');
        })
        .catch(function () { lock(false); setErr('网络错误,请重试'); });
    } else {
      lock(true);
      fetchJSON('/auth/login', { method: 'POST', body: { password: v1 } })
        .then(function (r) {
          if (r.ok && r.body.ok) { gotoApp(); return; }
          lock(false);
          setErr(r.status === 401 ? '密码不正确' : '登录失败');
          p1.select();
        })
        .catch(function () { lock(false); setErr('网络错误,请重试'); });
    }
  }

  function labelFor(code) {
    switch (code) {
      case 'already_initialized': return '密码已设置过(刷新页面切换到登录)';
      case 'passwords_mismatch':  return '两次输入不一致';
      case 'password_too_short':  return '密码至少需要 8 个字符';
      case 'invalid':             return '密码不正确';
      default: return code || '出错了';
    }
  }

  // 初始化:问后端"是否已设置过密码",切换 UI
  fetchJSON('/auth/status')
    .then(function (r) { initialized = !!(r.body && r.body.initialized); refreshUI(); })
    .catch(function () { initialized = true; refreshUI(); setErr('无法连接后端。'); });

  form.addEventListener('submit', function (e) { e.preventDefault(); doSubmit(); });
  submit.addEventListener('click', function (e) { e.preventDefault(); doSubmit(); });
})();
