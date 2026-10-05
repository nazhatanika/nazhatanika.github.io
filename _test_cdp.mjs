
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
  const page = list.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const evalJs = expr => new Promise(res => { const i = ++id; pending.set(i, m => res(m.result && m.result.result ? m.result.result.value : null)); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } })); });
  const probe = "JSON.stringify({l: parseInt(document.querySelector('.kitty').style.left), y: parseInt(document.querySelector('.kitty').style.top), step: (document.querySelector('.kitty-text')||{}).textContent ? document.querySelector('.kitty-text').textContent.slice(0,26) : null})";
  for (let i = 0; i < 9; i++) { await sleep(4000); console.log('t=' + ((i+1)*4) + 's', await evalJs(probe)); }
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
