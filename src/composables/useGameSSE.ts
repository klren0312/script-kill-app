import type { WsMessage } from '@/api/scriptKillTypes'
import { buildSseUrl, buildWsUrl } from '@/common/http.interceptor'

export type SocketStatus = 'connecting' | 'open' | 'closed' | 'error'

interface GameSocketOptions {
  gameId: string
  roleId: string
  onEvent: (msg: WsMessage) => void
  onStatus?: (status: SocketStatus, attempt: number, maxAttempts: number) => void
}

const MAX_RETRIES = 5
const BASE_DELAY = 1000
const HANDSHAKE_TIMEOUT = 8000

function isEventSourceAvailable(): boolean {
  return typeof globalThis.EventSource !== 'undefined'
}

/**
 * 游戏实时连接管理：优先 SSE（H5/App），小程序降级 WebSocket。
 * connect 后接收 snapshot / GameEvent，close 断开，断线自动指数退避重连。
 */
export function useGameSSE() {
  let es: EventSource | null = null
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
    if (es) {
      es.onopen = es.onmessage = es.onerror = null
      es.close()
      es = null
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

  function connectSSE(options: GameSocketOptions) {
    const url = buildSseUrl(options.gameId, options.roleId)
    const source = new EventSource(url)
    es = source

    handshakeTimer = setTimeout(() => {
      clearHandshake()
      if (!closedByUser) {
        source.close()
      }
    }, HANDSHAKE_TIMEOUT)

    source.onopen = () => {
      retryCount = 0
      clearHandshake()
      options.onStatus?.('open', 0, MAX_RETRIES + 1)
    }
    source.onmessage = (e: MessageEvent) => handleMessage(String(e.data))
    source.onerror = () => {
      clearHandshake()
      source.close()
    }
  }

  function connectWS(options: GameSocketOptions) {
    const url = buildWsUrl(options.gameId, options.roleId)
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

  function connect(options: GameSocketOptions) {
    opts = options
    closedByUser = false
    retryCount = 0
    teardown()
    options.onStatus?.('connecting', retryCount + 1, MAX_RETRIES + 1)

    if (isEventSourceAvailable()) {
      connectSSE(options)
    }
    else {
      connectWS(options)
    }
  }

  function close() {
    closedByUser = true
    teardown()
  }

  return { connect, close }
}
