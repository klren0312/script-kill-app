<script setup lang="ts">
// 房间页 = 流程驱动单视图。只负责 init / WS 连接 / CTA 兜底 / 返回大厅；
// 界面渲染全部委托给 <sk-phase-flow>（阶段调度黑盒，见契约 §3）。
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getGame, getMe, getScript, resumeGame, startGame } from '@/api/scriptKill'
import { useGameSSE } from '@/composables/useGameSSE'
import { useSafeTop } from '@/composables/useSafeTop'
import { useScriptKillStore } from '@/stores/scriptKill'
import SkPhaseFlow from '@/components/sk-phase-flow.vue'

const store = useScriptKillStore()
const socket = useGameSSE()
const { statusBarHeight } = useSafeTop()

// 传输方式：EventSource 不可用时降级为 WebSocket，需在页面上提示用户。
const transport = socket.transport
const isWsFallback = computed(() => transport.value === 'ws')
let fallbackNotified = false
watch(
  () => transport.value,
  (t) => {
    if (t === 'ws' && !fallbackNotified) {
      fallbackNotified = true
      uni.showToast({ title: '当前环境不支持 SSE，已降级为 WebSocket', icon: 'none' })
    }
  },
)

const statusDot = computed(() => {
  switch (store.status) {
    case 'open':
      return '#34d399'
    case 'connecting':
      return '#f59e0b'
    default:
      return '#6b7280'
  }
})

// 连接尝试计数（用 onStatus 的 attempt 参数驱动），用于"连接中"遮罩的倒计时/提示。
const attemptsLeft = ref(0)
const maxAttempts = ref(0)

async function init() {
  if (!store.gameId) {
    uni.showToast({ title: '缺少房间信息', icon: 'none' })
    return
  }
  try {
    // 并行拉取快照、角色视角、剧本视图
    const [gRes, meRes] = await Promise.all([
      getGame(store.gameId),
      getMe(store.gameId),
    ])
    store.applySnapshot(gRes)
    store.setMyRoleView(meRes)
    if (!store.scriptView) {
      const sRes = await getScript(gRes.scriptId)
      store.setScriptView(sRes)
    }
    // 仅在快照加载成功后建立实时连接：init 失败（房间/剧本不存在）时继续连接
    // 会触发 SSE 对不存在的 game 无限重连，故此处不放外层。
    connectWs()
  }
  catch {
    uni.showToast({ title: '加载房间失败', icon: 'none' })
  }
}

// 自动开局仅发生在首次连接且仍处于 setup 时；reading 不再自动推进，
// 由阅读视图"开始讨论"CTA 显式触发，避免重连/晚加入被快进跳过阅读门槛（T3 评审 MINOR）。
// 重连（WS open 再次触发）仅在非 setup/finished 阶段走 resumeGame 恢复。
let didAutoStart = false

function connectWs() {
  socket.connect({
    gameId: store.gameId,
    roleId: store.humanRoleId,
    onEvent: msg => store.applyMessage(msg),
    onStatus: (s, attempt, max) => {
      store.setStatus(s)
      if (attempt !== undefined)
        attemptsLeft.value = Math.max(0, max - attempt + 1)
      if (max !== undefined)
        maxAttempts.value = max
      if (s !== 'open')
        return
      if (!didAutoStart) {
        didAutoStart = true
        if (store.phase === 'setup') {
          onStart()
        }
        else if (store.phase !== 'finished') {
          resumeGame(store.gameId).catch(() => {})
        }
      }
      else if (store.phase !== 'setup' && store.phase !== 'finished') {
        resumeGame(store.gameId).catch(() => {})
      }
    },
  })
}

async function onStart() {
  try {
    if (store.phase === 'setup' || store.phase === 'reading') {
      await startGame(store.gameId)
    }
    else {
      await resumeGame(store.gameId)
    }
  }
  catch (e: any) {
    uni.showToast({ title: (e?.message || '操作失败'), icon: 'none' })
  }
}

function backToLobby() {
  uni.showModal({
    title: '返回大厅',
    content: '确定要离开房间吗？游戏进度已保存，可再次进入。',
    success: (r) => {
      if (r.confirm) {
        socket.close()
        uni.navigateBack().catch(() => uni.redirectTo({ url: '/pages/script-kill/index' }))
      }
    },
  })
}

onMounted(() => {
  // 从 URL 或本地存储恢复会话
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1] as any
  const gid = cur?.$page?.options?.gameId
  if (gid) {
    store.gameId = gid
    store.loadSessionFromStorage()
  }
  else {
    store.loadSessionFromStorage()
  }
  init()
})

onBeforeUnmount(() => {
  socket.close()
})
</script>

<template>
  <view class="room" :style="{ '--safe-top': `${statusBarHeight}px` }">
    <!-- 自定义顶部状态栏（返回键 + 剧本名 + 状态点） -->
    <view class="room__nav">
      <view class="room__nav-top">
        <text class="room__back" @tap="backToLobby">
          ‹
        </text>
        <view class="room__nav-title">
          <text class="room__script">
            {{ store.scriptView?.title || '游戏房间' }}
          </text>
        </view>
        <view class="room__dot" :style="{ backgroundColor: statusDot }" />
        <text v-if="isWsFallback" class="room__transport">
          WS 降级
        </text>
      </view>
    </view>

    <!-- 内容区：阶段调度黑盒，连接态交给 PhaseFlow 的 connecting 遮罩 -->
    <view class="room__body">
      <sk-phase-flow
        :connecting="store.status === 'connecting' || store.status === 'closed' || store.status === 'error'"
        :attempts-left="attemptsLeft"
        :max-attempts="maxAttempts"
        :store-status="store.status"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.room {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(700rpx 400rpx at 90% 0%, rgba(168, 85, 247, 0.16), transparent 70%),
    linear-gradient(180deg, #0f0f1a, #16162a);
}

.room__nav {
  flex-shrink: 0;
  padding: calc(var(--safe-top, env(safe-area-inset-top)) + 20rpx) 28rpx 16rpx;
  background: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(10rpx);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.room__nav-top {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.room__back {
  font-size: 52rpx;
  line-height: 1;
  color: #edeDF5;
  width: 56rpx;
}

.room__nav-title {
  flex: 1;
  text-align: center;
}

.room__script {
  font-size: 32rpx;
  font-weight: 700;
  color: #edeDF5;
}

.room__dot {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
}

.room__transport {
  margin-left: 10rpx;
  padding: 2rpx 14rpx;
  font-size: 20rpx;
  line-height: 1.4;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.14);
  border: 1rpx solid rgba(251, 191, 36, 0.35);
  border-radius: 999rpx;
}

.room__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  /* 顶部状态栏避让已由 room__nav 的 --safe-top 处理，这里不再重复下沉，
     避免导航栏与内容区双重叠加状态栏高度。 */
  padding-top: 0;
  box-sizing: border-box;
}
</style>

<style lang="scss">
/* 页面根背景色兜底，防止下拉回弹露出白底 */
page {
  background-color: #0f0f1a;
}
</style>
