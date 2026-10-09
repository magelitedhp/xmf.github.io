import { App } from './app'
import './style.css'

const canvas = document.getElementById('game') as HTMLCanvasElement
const app = new App(canvas)
const q = new URLSearchParams(location.search)
if (q.has('demo')) app.showcase()
else app.openFromQuery(q)
app.start()

const loader = document.getElementById('boot')
if (loader) {
  loader.classList.add('done')
  window.setTimeout(() => loader.remove(), 600)
}
