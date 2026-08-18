import type { WsMessage } from '@/api/scriptKillTypes'
// 跨端 WebSocket 客户端：H5 用原生 WebSocket，小程序/App 用 uni.connectSocket
import { buildWsUrl } from '@/common/http.interceptor'

export type SocketStatus = 'connecting' | 'open' | 'closed' | 'error'

interface GameSocketOptions {
  gameId: string
  roleId: string
  onEvent: (msg: WsMessage) => void
  onStatus?: (status: SocketStatus, attempt: number, maxAttempts: number) => void
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
// 单次握手超时：防止目标主机不可达时既不发 open 也不发 close，卡在"连接中"。
const HANDSHAKE_TIMEOUT = 8000

/**
 * 游戏 WebSocket 连接管理。connect 后可接收 snapshot / GameEvent，
 * close 断开。断线后自动指数退避重连。
 */
export function useGameSocket() {
  let nativeWs: WebSocket | null = null
  let uniTask: any = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let handshakeTimer: ReturnType<typeof setTimeout> | null = null
  let closedByUser = false
  let opts: GameSocketOptions | null = null
  let retryCount = 0

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function clearHandshake() {
    if (handshakeTimer) {
      clearTimeout(handshakeTimer)
      handshakeTimer = null
    }
  }

  function teardown() {
    clearTimer()
    clearHandshake()
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
    options.onStatus?.('connecting', retryCount + 1, MAX_RETRIES + 1)

    if (isNativeWsAvailable()) {
      const ws = new WebSocket(url)
      nativeWs = ws
      ws.onopen = () => {
        retryCount = 0
        clearHandshake()
        options.onStatus?.('open', 0, MAX_RETRIES + 1)
      }
      ws.onmessage = (e: MessageEvent) => handleMessage(String(e.data))
      // 单次握手超时兜底：主机不可达时触发 error→close→退避重连，避免卡在 connecting。
      handshakeTimer = setTimeout(() => {
        clearHandshake()
        if (!closedByUser) {
          try {
            ws.close()
          }
          catch {
            // ignore
          }
        }
      }, HANDSHAKE_TIMEOUT)
      ws.onerror = () => {
        clearHandshake()
        // error 只表示本此握手失败，本身不会触发 onclose——主动关闭以进入
        // onclose 的统一路径，由它决定是否退避重连（避免 error 回调只上报不重连的卡死）。
        try {
          ws.close()
        }
        catch {
          // ignore
        }
      }
      ws.onclose = () => {
        if (closedByUser) {
          options.onStatus?.('closed', MAX_RETRIES + 1, MAX_RETRIES + 1)
          return
        }
        options.onStatus?.('closed', retryCount + 1, MAX_RETRIES + 1)
        scheduleReconnect()
      }
    }
    else {
      // 微信小程序 / App：uni.connectSocket
      const task = uni.connectSocket({ url, complete: undefined } as any) as any
      uniTask = task
      handshakeTimer = setTimeout(() => {
        clearHandshake()
        if (!closedByUser) {
          try {
            uniTask?.close()
          }
          catch {
            // ignore
          }
        }
      }, HANDSHAKE_TIMEOUT)
      task.onOpen(() => {
        retryCount = 0
        clearHandshake()
        options.onStatus?.('open', 0, MAX_RETRIES + 1)
      })
      task.onMessage((res: any) => handleMessage(String(res.data)))
      task.onError(() => {
        // 同原生：error 后主动关闭，交给 onClose 统一退避重连，避免只上报不重连。
        try {
          uniTask?.close()
        }
        catch {
          // ignore
        }
      })
      task.onClose(() => {
        if (closedByUser) {
          options.onStatus?.('closed', MAX_RETRIES + 1, MAX_RETRIES + 1)
          return
        }
        options.onStatus?.('closed', retryCount + 1, MAX_RETRIES + 1)
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
