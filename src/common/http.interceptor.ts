import type { RequestConfig, RequestInterceptor, RequestMeta, RequestOptions } from 'uview-pro'

// 示例：演示如何使用token
const token = ''
// 后端 REST 基地址：H5 开发期直连后端，生产改为 https://your-domain.com
const baseUrl = import.meta.env.VITE_APP_API_BASE || 'http://127.0.0.1:3000'
// 后端 WebSocket 基地址（ws/wss 协议）
const wsBase = import.meta.env.VITE_APP_WS_BASE || 'ws://127.0.0.1:3000'

/**
 * 拼接 SSE 连接地址：GET /api/games/:id/events
 * 注意：后端 SSE 路由不读取 roleId（按服务端存储的 humanRoleId 过滤，更安全），
 * 因此这里不拼接 roleId 查询参数，避免误导。
 */
export function buildSseUrl(gameId: string): string {
  return `${baseUrl.replace(/\/$/, '')}/api/games/${encodeURIComponent(gameId)}/events`
}

/** 拼接 WebSocket 连接地址：GET /ws/games/:id?roleId=xxx（小程序降级用） */
export function buildWsUrl(gameId: string, roleId: string): string {
  return `${wsBase.replace(/\/$/, '')}/ws/games/${encodeURIComponent(gameId)}?roleId=${encodeURIComponent(roleId)}`
}

// 全局配置
const httpRequestConfig: RequestConfig = {
  baseUrl,
  header: {
    'content-type': 'application/json',
  },
  timeout: 50000,
  meta: {
    originalData: true,
    toast: true,
    loading: true,
  },
}

// 请求/响应拦截器
const httpInterceptor: RequestInterceptor = {
  // 请求拦截器
  request: (config: RequestOptions) => {
    const meta: RequestMeta = config.meta || {}
    meta.loading && showLoading()
    if (token) {
      config.header.Authorization = `Bearer ${token}`
    }
    return config
  },
  // 响应拦截器
  response: async (response: any) => {
    const meta: RequestMeta = response.config?.meta || {}
    meta.loading && hideLoading()
    const { statusCode, data: rawData, errMsg } = response as any
    // 网络错误
    if (errMsg && errMsg.includes('Failed to connect')) {
      meta.toast && showToast('网络错误', 'error')
      throw new Error('网络错误')
    }
    if (errMsg && errMsg.includes('request:fail')) {
      meta.toast && showToast('请求错误：未知', 'error')
      throw new Error('请求错误：未知')
    }
    // 请求错误
    if (!(statusCode >= 200 && statusCode < 300)) {
      const errorMessage = `请求错误[${statusCode}]`
      meta.toast && showToast(errorMessage, 'error')
      throw new Error(`${errorMessage}：${errMsg}`)
    }
    return rawData
  },
}

// 显示加载中，可以替换为uview-pro的u-loading-popup组件
function showLoading() {
  uni.showLoading({
    title: '加载中...',
    mask: true,
  })
}

// 隐藏加载中，可以替换为uview-pro的u-loading-popup组件
function hideLoading() {
  uni.hideLoading()
}

// 显示toast，可以替换为uview-pro的u-toast组件
function showToast(
  title = '',
  icon: 'success' | 'error' | 'none' = 'none',
  options: { duration: number } = { duration: 2000 },
) {
  if (title.length === 0) {
    return
  }
  uni.showToast({
    title,
    icon: title.length > 7 ? 'none' : icon,
    duration: options.duration || 2000,
  })
}

// 导出
export { httpInterceptor, httpRequestConfig }
