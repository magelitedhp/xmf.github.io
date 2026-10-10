// Browser verification helper. Uses an existing Chrome/Edge remote debugger.
// Start a headless browser with --remote-debugging-port=9227 before running.
const port=process.env.MARIO_CDP_PORT||9227
const target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json()
const ws=new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject})
let id=0;const pending=new Map();export const errors=[]
ws.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const p=pending.get(message.id);if(!p)return;pending.delete(message.id);message.error?p.reject(message.error):p.resolve(message.result)}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails)}
export const send=(method,params={})=>new Promise((resolve,reject)=>{const seq=++id;pending.set(seq,{resolve,reject});ws.send(JSON.stringify({id:seq,method,params}))})
export const sleep=ms=>new Promise(r=>setTimeout(r,ms))
export async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
export async function viewport(width,height,mobile=false){await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile})}
export async function navigate(path){await send('Page.navigate',{url:(process.env.MARIO_BASE_URL||'http://127.0.0.1:5173/')+path});await sleep(1100)}
export async function key(code,down=true){const names={Space:' ',ArrowRight:'ArrowRight',ArrowLeft:'ArrowLeft',ShiftLeft:'Shift',KeyX:'x',Escape:'Escape'};await send('Input.dispatchKeyEvent',{type:down?'keyDown':'keyUp',key:names[code]||code,code})}
export async function close(){ws.close();await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`)}
await send('Page.enable');await send('Runtime.enable')
