import type { WsMessage } from '@/api/scriptKillTypes'
// 跨端 WebSocket 客户端：H5 用原生 WebSocket，小程序/App 用 uni.connectSocket
import { buildWsUrl } from '@/common/http.interceptor'

export type SocketStatus = 'connecting' | 'open' | 'closed' | 'error'

interface GameSocketOptions {
  gameId: string
  roleId: string
  onEvent: (msg: WsMessage) => void
  onStatus?: (status: SocketStatus) => void
}

interface WsLike {
  send: (data: string) => void
  close: () => void
}

// 判断运行平台（小程序/App 无原生 WebSocket 全局对象，用 uni.connectSocket）
function isNativeWsAvailable(): boolean {
  return typeof (globalThis as any).WebSocket !== 'undefined'
}

const MAX_RETRIES = 5
const BASE_DELAY = 1000

/**
 * 游戏 WebSocket 连接管理。connect 后可接收 snapshot / GameEvent，
 * close 断开。断线后自动指数退避重连。
 */
export function useGameSocket() {
  let nativeWs: WebSocket | null = null
  let uniTask: any = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let closedByUser = false
  let opts: GameSocketOptions | null = null
  let retryCount = 0

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function teardown() {
    clearTimer()
    if (nativeWs) {
      nativeWs.onopen = nativeWs.onmessage = nativeWs.onclose = nativeWs.onerror = null
      try {
        nativeWs.close()
      }
      catch {
        // ignore
      }
      nativeWs = null
    }
    if (uniTask) {
      try {
        uniTask.close()
      }
      catch {
        // ignore
      }
      uniTask = null
    }
  }

  function scheduleReconnect() {
    if (closedByUser || !opts || retryCount >= MAX_RETRIES)
      return
    clearTimer()
    const delay = BASE_DELAY * 2 ** retryCount++
    timer = setTimeout(() => {
      if (!closedByUser && opts)
        connect(opts)
    }, delay)
  }

  function handleMessage(raw: string) {
    if (!opts)
      return
    let msg: WsMessage
    try {
      msg = JSON.parse(raw) as WsMessage
    }
    catch {
      return
    }
    opts.onEvent(msg)
  }

  function connect(options: GameSocketOptions) {
    opts = options
    closedByUser = false
    retryCount = 0
    teardown()
    const url = buildWsUrl(options.gameId, options.roleId)
    options.onStatus?.('connecting')

    if (isNativeWsAvailable()) {
      const ws = new WebSocket(url)
      nativeWs = ws
      ws.onopen = () => options.onStatus?.('open')
      ws.onmessage = (e: MessageEvent) => handleMessage(String(e.data))
      ws.onerror = () => options.onStatus?.('error')
      ws.onclose = () => {
        if (closedByUser) {
          options.onStatus?.('closed')
          return
        }
        options.onStatus?.('closed')
        scheduleReconnect()
      }
    }
    else {
      // 微信小程序 / App：uni.connectSocket
      const task = uni.connectSocket({ url, complete: undefined } as any) as any
      uniTask = task
      task.onOpen(() => options.onStatus?.('open'))
      task.onMessage((res: any) => handleMessage(String(res.data)))
      task.onError(() => options.onStatus?.('error'))
      task.onClose(() => {
        if (closedByUser) {
          options.onStatus?.('closed')
          return
        }
        options.onStatus?.('closed')
        scheduleReconnect()
      })
    }
  }

  function sendRaw(data: string) {
    if (nativeWs && nativeWs.readyState === WebSocket.OPEN) {
      nativeWs.send(data)
      return
    }
    if (uniTask && typeof uniTask.send === 'function') {
      uniTask.send({ data })
      return
    }
    throw new Error('WebSocket 未连接')
  }

  function close() {
    closedByUser = true
    teardown()
  }

  return {
    connect,
    close,
    sendRaw,
  }
}
