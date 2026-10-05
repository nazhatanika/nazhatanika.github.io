
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  const list = await (await fetch('http://127.0.0.1:9223/json/list')).json();
  const page = list.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const evalJs = expr => new Promise(res => { const i = ++id; pending.set(i, m => res(m.result && m.result.result ? m.result.result.value : null)); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } })); });
  const probe = "(()=>{const c=document.querySelector('.kitty');const y=parseInt(c.style.top)-window.scrollY;const b=document.querySelector('.kitty-bubble');const bt=b.style.display!=='none'?parseInt(b.style.top)-window.scrollY:null;return JSON.stringify({vy:y,vbot:y+128,ih:window.innerHeight,bubbleTop:bt,fullyVisible:(y>=0&&y+128<=window.innerHeight)})})()";
  for (let i = 0; i < 12; i++) { await sleep(5000); console.log(await evalJs(probe)); }
} catch (e) { console.log('ERR', e.message); }
process.exit(0);
