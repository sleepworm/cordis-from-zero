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

function farewellText(period: Period) {
  if (period === 'morning') return 'Have a great day'
  if (period === 'afternoon') return 'Have a great afternoon'
  return 'Good night'
}

interface Farewell {
  farewell(name: string): string
}

function makeFarewell(clock: Clock): Farewell {
  return { farewell: (name) => `${farewellText(clock.period)}, ${name}!` }
}

// 和 refreshGreeter 逐行一样的形状——farewell 也依赖 clock，也需要一个
// "clock 变了就手动同步"的函数。这不是巧合，是手写依赖管理时几乎躲不掉的复制。
let farewell: Farewell | undefined

function refreshFarewell() {
  farewell = clock ? makeFarewell(clock) : undefined
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

function appFarewell() {
  if (!farewell) {
    console.log('[App] farewell unavailable, skip farewell')
    return
  }
  console.log('[App]', farewell.farewell('Alex'))
}

function logger(name: string) {
  console.log(`[LOG] greeted ${name}`)
}

onGreet(logger)

app() // clock 还没加载，greeter 也就没法用
appFarewell() // 同理，farewell 也没法用

loadClock()
refreshGreeter()  // clock 一变化，两个依赖方都要手动刷新——
refreshFarewell() // 这一行是上一步 refreshGreeter() 的原样复制，只是换了个名字
app()
appFarewell()

switchToChinese()
app()

unloadClock()
refreshGreeter()  // 卸载同样要刷新两次，忘记其中一个，那一个就会停在过期状态
refreshFarewell()
app()
appFarewell()

loadClock('evening')
refreshGreeter()
refreshFarewell()
app()
appFarewell()
