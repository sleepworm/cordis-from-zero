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

function app() {
  console.log('[App]', greeter.greet('Alex'))
}

app()

greeter = chineseGreeter
app()
