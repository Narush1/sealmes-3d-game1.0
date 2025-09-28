const ws = new WebSocket('ws://localhost:8080');

const username = document.getElementById('username');
const password = document.getElementById('password');
const confirm = document.getElementById('confirm');
const captchaText = document.getElementById('captchaText');
const captchaInput = document.getElementById('captchaInput');
const authStatus = document.getElementById('authStatus');
const meSpan = document.getElementById('me');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const authDiv = document.getElementById('auth');
const chatDiv = document.getElementById('chat');
const messageInput = document.getElementById('message');
const messagesDiv = document.getElementById('messages');
const recipient = document.getElementById('recipient');
const sendBtn = document.getElementById('sendBtn');

registerBtn.onclick = () => {
  ws.send(JSON.stringify({
    type: 'register',
    username: username.value.trim(),
    password: password.value.trim(),
    confirm: confirm.value.trim(),
    captcha: captchaInput.value.trim().toUpperCase()
  }));
};

loginBtn.onclick = () => {
  ws.send(JSON.stringify({
    type: 'login',
    username: username.value.trim(),
    password: password.value.trim()
  }));
};

sendBtn.onclick = () => {
  const to = recipient.value;
  const text = messageInput.value.trim();
  if (text) {
    ws.send(JSON.stringify({ type: 'message', to, text }));
    messageInput.value = '';
  }
};

ws.onmessage = (e) => {
  const data = JSON.parse(e.data);

  if (data.type === 'captcha') {
    captchaText.textContent = data.captcha;
  }

  if (data.type === 'register') {
    authStatus.textContent = data.success ? '✅ Регистрация успешна' : '❌ ' + data.error;
  }

  if (data.type === 'login') {
    if (data.success) {
      authDiv.style.display = 'none';
      chatDiv.style.display = 'block';
      meSpan.textContent = data.username;
    } else {
      authStatus.textContent = '❌ ' + data.error;
    }
  }

  if (data.type === 'message') {
    const line = document.createElement('div');
    line.textContent = `[${data.from} → ${data.to}]: ${data.text}`;
    messagesDiv.appendChild(line);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    if (data.from !== username.value && ![...recipient.options].some(o => o.value === data.from)) {
      const opt = document.createElement('option');
      opt.value = data.from;
      opt.textContent = data.from;
      recipient.appendChild(opt);
    }
  }
};
