const fs = require('fs');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const users = fs.existsSync('users.json') ? JSON.parse(fs.readFileSync('users.json')) : {};
const clients = {}; // { username: WebSocket }

function saveUsers() {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

function randomCaptcha() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

wss.on('connection', ws => {
  ws.captcha = randomCaptcha();
  ws.send(JSON.stringify({ type: 'captcha', captcha: ws.captcha }));

  ws.on('message', msg => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    // Регистрация
    if (data.type === 'register') {
      const { username, password, confirm, captcha } = data;
      if (!username || !password || !confirm || !captcha) {
        return ws.send(JSON.stringify({ type: 'register', success: false, error: 'Все поля обязательны' }));
      }

      if (users[username]) {
        return ws.send(JSON.stringify({ type: 'register', success: false, error: 'Пользователь уже существует' }));
      }

      if (password !== confirm) {
        return ws.send(JSON.stringify({ type: 'register', success: false, error: 'Пароли не совпадают' }));
      }

      if (captcha !== ws.captcha) {
        ws.captcha = randomCaptcha();
        ws.send(JSON.stringify({ type: 'captcha', captcha: ws.captcha }));
        return ws.send(JSON.stringify({ type: 'register', success: false, error: 'Неверная капча' }));
      }

      users[username] = { password };
      saveUsers();
      ws.send(JSON.stringify({ type: 'register', success: true }));
    }

    // Вход
    if (data.type === 'login') {
      const { username, password } = data;
      const user = users[username];

      if (!user || user.password !== password) {
        return ws.send(JSON.stringify({ type: 'login', success: false, error: 'Неверные данные' }));
      }

      if (clients[username]) {
        return ws.send(JSON.stringify({ type: 'login', success: false, error: 'Пользователь уже в сети' }));
      }

      ws.username = username;
      clients[username] = ws;
      ws.send(JSON.stringify({ type: 'login', success: true, username }));
    }

    // Сообщения
    if (data.type === 'message') {
      const { to, text } = data;
      const from = ws.username;
      const msgData = JSON.stringify({ type: 'message', from, to, text });

      if (to === 'all') {
        for (const client of Object.values(clients)) {
          client.send(msgData);
        }
      } else if (clients[to]) {
        clients[to].send(msgData);
        ws.send(msgData); // отправителю
      }
    }
  });

  ws.on('close', () => {
    if (ws.username) {
      delete clients[ws.username];
    }
  });
});

console.log('✅ Сервер работает: ws://localhost:8080');
