import { Context, Service } from 'cordis'

type Period = 'morning' | 'afternoon' | 'evening'

// Clock 是一个普通 Service，和 Greeter 一样只是 super(ctx, 'clock') 注册了
// 一个能力——它自己完全不知道有谁依赖它，这一点后面会很关键。
class Clock extends Service {
  constructor(ctx: Context, public period: Period = 'morning') {
    super(ctx, 'clock')
  }

  setPeriod(period: Period) {
    this.period = period
  }
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

// Context：整个运行时的世界，所有能力都挂在它上面（ctx.xxx）。
// Service：Plugin 提供给别人消费的具体能力，比如这里的 ctx.greeter。
abstract class Greeter extends Service {
  // static inject = ['clock']：声明这个 Service 依赖 clock 这个能力。
  // clock 没就绪之前，这个 Service 不会被激活；clock 消失/恢复时，
  // 这个 Service 会自动跟着失效/重新激活——不需要任何手动同步代码。
  static inject = ['clock']

  constructor(ctx: Context) {
    // super(ctx, 'greeter') 就是向 ctx 注册一个叫 'greeter' 的能力——
    // 这一句是 Cordis 里"提供能力"的官方方式，等价于 vanilla 版本里那个
    // 裸的 `let greeter = ...`，区别是这里注册到了 Context 统一管理，
    // 不是随便哪里都能改的模块级变量。
    super(ctx, 'greeter')
  }

  abstract greet(name: string): string
}

// 只影响编译期类型提示，不影响运行时行为——让 ctx.greeter/ctx.clock 有类型，
// 而不是 any。删掉这段代码依然能跑，只是 TypeScript 不再知道
// ctx.greeter 是什么类型。Events 接口同理，给 ctx.emit/ctx.on 加类型约束。
declare module 'cordis' {
  interface Context {
    greeter: Greeter
    clock: Clock
  }
  interface Events {
    greet(name: string): void
  }
}

class EnglishGreeter extends Greeter {
  greet(name: string) {
    return `${englishText(this.ctx.clock.period)}, ${name}!`
  }
}

class ChineseGreeter extends Greeter {
  greet(name: string) {
    return `${chineseText(this.ctx.clock.period)}，${name}！`
  }
}

// app() 只碰 ctx.greeter，不 import EnglishGreeter/ChineseGreeter——
// 这是全篇要验证的架构约束：消费者依赖能力名字，不依赖具体实现类。
// 和 v0.2.1/v0.2.2 不同的是，这里重新出现了 v0.1.x 那种 if (!x) 判断——
// clock 没就绪时 ctx.greeter 会是 undefined，这一点和 vanilla 版本一致，
// Cordis 不会替我们消灭"能力可能不存在"这个问题，只是不需要手动同步了。
function app(ctx: Context) {
  if (!ctx.greeter) {
    console.log('[App] ctx.greeter is unavailable, skip greeting')
    return
  }
  console.log('[App]', ctx.greeter.greet('Alex'))
  ctx.emit('greet', 'Alex')
}

// Event：模块之间不用互相认识就能通信。logger 是一个普通的函数式 Plugin，
// 只是它做的事情是订阅 greet 事件，而不是 provide 一个 Service。
function logger(ctx: Context) {
  ctx.on('greet', (name) => {
    console.log(`[LOG] greeted ${name}`)
  })
}

async function main() {
  const ctx = new Context()

  await ctx.plugin(logger)

  // Plugin：向 Context 增加/移除能力的模块。ctx.plugin() 安装一个 Plugin，
  // 返回一个 Fiber 对象，代表这次安装的生命周期。
  let greeterFiber = await ctx.plugin(EnglishGreeter)
  app(ctx) // clock 还没加载，static inject 阻塞 Greeter 激活，ctx.greeter 不存在

  let clockFiber = await ctx.plugin(Clock)
  app(ctx) // clock 一就绪，Greeter 自动激活——没有任何等价于 refreshGreeter() 的代码

  // Lifecycle：换实现不是重新赋值一个变量，而是先卸载旧 Plugin
  // （fiber.dispose()，撤销这次安装注册过的一切），再安装新 Plugin。
  await greeterFiber.dispose()
  greeterFiber = await ctx.plugin(ChineseGreeter)
  app(ctx) // 换语言和记日志互不影响——两件事已经解耦

  await clockFiber.dispose()
  app(ctx) // clock 消失，greeter 自动跟着不可用——级联卸载是内建的，不用手写

  clockFiber = await ctx.plugin(Clock, 'evening')
  app(ctx) // clock 恢复且带新时段，greeter 自动恢复并读到新值
}

main()
