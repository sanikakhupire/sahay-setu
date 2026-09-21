const socket = io('http://localhost:5000');
const log = document.getElementById('log');

socket.on('connect', () => {
  log.innerHTML += `Connected: ${socket.id}\n`;
  socket.emit('joinWard', 'Ward 5');
});

socket.on('connect_error', (err) => {
  log.innerHTML += `Connection error: ${err.message}\n`;
});

socket.on('matchConfirmed', (data) => {
  log.innerHTML += `\n🔔 MATCH CONFIRMED: ${JSON.stringify(data, null, 2)}\n`;
});

socket.on('dispatchUpdate', (data) => {
  log.innerHTML += `\n📦 DISPATCH UPDATE: ${JSON.stringify(data, null, 2)}\n`;
});