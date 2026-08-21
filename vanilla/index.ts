interface Greeter {
  greet(name: string): string
}

const englishGreeter: Greeter = {
  greet: (name) => `Hello, ${name}!`,
}

const chineseGreeter: Greeter = {
  greet: (name) => `你好，${name}！`,
}

let greeter: Greeter = englishGreeter

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
  console.log('[App]', greeter.greet('Alex'))
  emitGreet('Alex')
}

function logger(name: string) {
  console.log(`[LOG] greeted ${name}`)
}

app() // 还没人订阅 greet，emitGreet 是个空转

onGreet(logger)
app() // logger 开始收到通知

greeter = chineseGreeter
app() // 换语言和记日志互不影响——两件事已经解耦
