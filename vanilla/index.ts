type Period = 'morning' | 'afternoon' | 'evening'

interface Clock {
  period: Period
}

let clock: Clock | undefined

function loadClock(period: Period = 'morning') {
  clock = { period }
}

function unloadClock() {
  clock = undefined
}

function englishText(period: Period) {
  if (period === 'morning') return 'Good morning'
  if (period === 'afternoon') return 'Good afternoon'
  return 'Good evening'
}

function chineseText(period: Period) {
  if (period === 'morning') return '早上好'
  if (period === 'afternoon') return '下午好'
  return '晚上好'
}

interface Greeter {
  greet(name: string): string
}

function makeEnglishGreeter(clock: Clock): Greeter {
  return { greet: (name) => `${englishText(clock.period)}, ${name}!` }
}

function makeChineseGreeter(clock: Clock): Greeter {
  return { greet: (name) => `${chineseText(clock.period)}，${name}！` }
}

// greeter 存不存在，取决于 clock 存不存在——但 clock 自己不知道 greeter 的存在，
// 所以每次 clock 变化后都要有人手动调用 refreshGreeter() 来同步这两者。
let useEnglish = true
let greeter: Greeter | undefined

function refreshGreeter() {
  greeter = clock ? (useEnglish ? makeEnglishGreeter(clock) : makeChineseGreeter(clock)) : undefined
}

function switchToChinese() {
  useEnglish = false
  refreshGreeter()
}

type GreetListener = (name: string) => void
const greetListeners: GreetListener[] = []

function onGreet(fn: GreetListener) {
  greetListeners.push(fn)
}

function offGreet(fn: GreetListener) {
  const i = greetListeners.indexOf(fn)
  if (i >= 0) greetListeners.splice(i, 1)
}

function emitGreet(name: string) {
  for (const fn of greetListeners) fn(name)
}

function app() {
  if (!greeter) {
    console.log('[App] greeter unavailable, skip greeting')
    return
  }
  console.log('[App]', greeter.greet('Alex'))
  emitGreet('Alex')
}

function logger(name: string) {
  console.log(`[LOG] greeted ${name}`)
}

onGreet(logger)

app() // clock 还没加载，greeter 也就没法用

loadClock()
refreshGreeter() // 别忘了：clock 一变化就要手动刷新 greeter，没有任何机制替你做这件事
app()

switchToChinese()
app()

unloadClock()
refreshGreeter() // 卸载也要记得刷新，忘了 greeter 就会停在过期状态，继续用旧的 clock
app()

loadClock('evening')
refreshGreeter()
app()
