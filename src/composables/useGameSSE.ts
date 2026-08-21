import type { WsMessage } from '@/api/scriptKillTypes'
import { ref } from 'vue'
import { buildSseUrl, buildWsUrl } from '@/common/http.interceptor'

export type SocketTransport = 'sse' | 'ws' | ''

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

// 心跳判活：后端 SseHub 每 30s 写一行 `: heartbeat`（SSE 注释，EventSource 不触发任何
// 事件，仅在网络层保活）。因此客户端无法直接观测注释心跳，判活阈值按是否见过
// 「可观察 ping」自适应：见过（后端改为 event: ping / data: {"type":"ping"}）→ 3 个
// 心跳周期内无数据判死；否则退化为 10 分钟兜底，捕获永不触发 onerror 的半开连接。
const PING_STALE_MS = 90_000
const IDLE_STALE_MS = 600_000
const WATCHDOG_INTERVAL = 15_000
const FOREGROUND_STALE_MS = 60_000

function isEventSourceAvailable(): boolean {
  return typeof globalThis.EventSource !== 'undefined'
}

/**
 * 游戏实时连接管理：优先 SSE（H5/App），小程序降级 WebSocket。
 * connect 后接收 snapshot / GameEvent，close 断开，断线自动指数退避重连。
 * 心跳对接：后端 30s 注释心跳保活；客户端以 lastActivity 判活——
 * - 看门狗周期检查，超阈值（见 PING_STALE_MS / IDLE_STALE_MS）强制重连；
 * - checkAlive() 供页面 onShow 回前台时调用，捕获后台挂起导致的静默断连。
 */
export function useGameSSE() {
  let es: EventSource | null = null
  let uniTask: any = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let handshakeTimer: ReturnType<typeof setTimeout> | null = null
  let watchdogTimer: ReturnType<typeof setInterval> | null = null
  let closedByUser = false
  let opts: GameSocketOptions | null = null
  let retryCount = 0
  let isOpen = false
  let lastActivityAt = 0
  let seenPing = false
  const transport = ref<SocketTransport>('')

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

  function clearWatchdog() {
    if (watchdogTimer) {
      clearInterval(watchdogTimer)
      watchdogTimer = null
    }
  }

  /** 记录连接活跃：任何真实数据帧 / open / 可观察 ping 都刷新 lastActivityAt */
  function touch(isPing = false) {
    lastActivityAt = Date.now()
    if (isPing)
      seenPing = true
  }

  function startWatchdog() {
    clearWatchdog()
    watchdogTimer = setInterval(() => {
      if (!isOpen || closedByUser || !opts)
        return
      const threshold = seenPing ? PING_STALE_MS : IDLE_STALE_MS
      if (Date.now() - lastActivityAt > threshold) {
        // 连接看似存活但长期无任何数据：判死并强制重连（connect 内部会先 teardown）
        isOpen = false
        opts.onStatus?.('error', retryCount + 1, MAX_RETRIES + 1)
        connect(opts)
      }
    }, WATCHDOG_INTERVAL)
  }

  /**
   * 页面回前台时的活性检查：移动端后台挂起后 SSE 常被静默断开且不触发 onerror，
   * 超过 FOREGROUND_STALE_MS 无活跃则立即重连，否则视为连接健康。
   */
  function checkAlive() {
    if (closedByUser || !opts || !isOpen)
      return
    if (Date.now() - lastActivityAt > FOREGROUND_STALE_MS) {
      isOpen = false
      opts.onStatus?.('error', retryCount + 1, MAX_RETRIES + 1)
      connect(opts)
    }
  }

  function teardown() {
    clearTimer()
    clearHandshake()
    clearWatchdog()
    isOpen = false
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
    // 字节到达即证明连接存活（即使 JSON 解析失败也计入活跃）
    touch()
    if (!opts)
      return
    let msg: WsMessage
    try {
      msg = JSON.parse(raw) as WsMessage
    }
    catch {
      return
    }
    // 心跳帧只作活性信号，不下发 store，避免污染事件列表
    if (msg.type === 'ping' || msg.type === 'heartbeat') {
      touch(true)
      return
    }
    opts.onEvent(msg)
  }

  function connectSSE(options: GameSocketOptions) {
    const url = buildSseUrl(options.gameId)
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
      isOpen = true
      touch()
      clearHandshake()
      options.onStatus?.('open', 0, MAX_RETRIES + 1)
    }
    source.onmessage = (e: MessageEvent) => handleMessage(String(e.data))
    // 兼容后端将来把心跳改为命名事件（event: ping）：计入活跃，不触发 onmessage
    source.addEventListener('ping', () => touch(true))
    source.onerror = () => {
      clearHandshake()
      isOpen = false
      source.close()
      if (closedByUser || !opts)
        return
      // 连接断开后上报错误态并自动重连，否则断开后房间会一直卡死（见连接态遮罩）。
      options.onStatus?.('error', retryCount + 1, MAX_RETRIES + 1)
      scheduleReconnect()
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
      isOpen = true
      touch()
      clearHandshake()
      options.onStatus?.('open', 0, MAX_RETRIES + 1)
    })
    task.onMessage((res: any) => handleMessage(String(res.data)))
    task.onError(() => {
      isOpen = false
      try {
        uniTask?.close()
      }
      catch {
        // ignore
      }
    })
    task.onClose(() => {
      isOpen = false
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
    // 重置活跃基线：避免陈旧的 lastActivityAt 让看门狗立即误判
    lastActivityAt = Date.now()
    startWatchdog()
    const useSse = isEventSourceAvailable()
    transport.value = useSse ? 'sse' : 'ws'
    options.onStatus?.('connecting', retryCount + 1, MAX_RETRIES + 1)

    if (useSse) {
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

  return { connect, close, transport, checkAlive }
}
