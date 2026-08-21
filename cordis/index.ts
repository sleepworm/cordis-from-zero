import { Context, Service } from 'cordis'

// Context：整个运行时的世界，所有能力都挂在它上面（ctx.xxx）。
// Service：Plugin 提供给别人消费的具体能力，比如这里的 ctx.greeter。
abstract class Greeter extends Service {
  constructor(ctx: Context) {
    // super(ctx, 'greeter') 就是向 ctx 注册一个叫 'greeter' 的能力——
    // 这一句是 Cordis 里"提供能力"的官方方式，等价于 vanilla 版本里那个
    // 裸的 `let greeter = ...`，区别是这里注册到了 Context 统一管理，
    // 不是随便哪里都能改的模块级变量。
    super(ctx, 'greeter')
  }

  abstract greet(name: string): string
}

// 只影响编译期类型提示，不影响运行时行为——让 ctx.greeter 有类型，
// 而不是 any。删掉这段代码依然能跑，只是 TypeScript 不再知道
// ctx.greeter 是什么类型。
declare module 'cordis' {
  interface Context {
    greeter: Greeter
  }
}

class EnglishGreeter extends Greeter {
  greet(name: string) {
    return `Hello, ${name}!`
  }
}

class ChineseGreeter extends Greeter {
  greet(name: string) {
    return `你好，${name}！`
  }
}

// app() 只碰 ctx.greeter，不 import EnglishGreeter/ChineseGreeter——
// 这是全篇要验证的架构约束：消费者依赖能力名字，不依赖具体实现类。
function app(ctx: Context) {
  console.log('[App]', ctx.greeter.greet('Alex'))
}

async function main() {
  const ctx = new Context()

  // Plugin：向 Context 增加/移除能力的模块。ctx.plugin() 安装一个 Plugin，
  // 返回一个 Fiber 对象，代表这次安装的生命周期。
  let greeterFiber = await ctx.plugin(EnglishGreeter)
  app(ctx)

  // Lifecycle：换实现不是重新赋值一个变量，而是先卸载旧 Plugin
  // （fiber.dispose()，撤销这次安装注册过的一切），再安装新 Plugin。
  await greeterFiber.dispose()
  greeterFiber = await ctx.plugin(ChineseGreeter)
  app(ctx)
}

main()
