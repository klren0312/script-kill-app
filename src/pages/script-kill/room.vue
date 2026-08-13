<script setup lang="ts">
import type { GameEvent, HumanActionType } from '@/api/scriptKillTypes'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  getGame,
  getMe,
  getScript,
  resumeGame,
  sendAction,
  startGame,
  vote as voteApi,
} from '@/api/scriptKill'
import { useGameSocket } from '@/composables/useGameSocket'
import { useScriptKillStore } from '@/stores/scriptKill'

const store = useScriptKillStore()
const socket = useGameSocket()

const tabs = [
  { key: 'chat', label: '聊天' },
  { key: 'reason', label: '推理' },
  { key: 'clue', label: '线索' },
  { key: 'role', label: '角色' },
  { key: 'vote', label: '投票' },
] as const
type TabKey = typeof tabs[number]['key']
const activeTab = ref<TabKey>('chat')

const chatMode = ref<'public' | 'whisper'>('public')
const showResult = ref(false)

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

const phaseMap: Record<string, string> = {
  setup: '准备中',
  reading: '阅读中',
  discussion: '讨论中',
  voting: '投票中',
  reveal: '揭晓中',
  finished: '已结束',
}

const phaseColorMap: Record<string, string> = {
  setup: '#8a8aa0',
  reading: '#60a5fa',
  discussion: '#a855f7',
  voting: '#f59e0b',
  reveal: '#f87171',
  finished: '#34d399',
}

const phaseText = computed(() => phaseMap[store.phase] || store.phase)

const phaseColor = computed(() => phaseColorMap[store.phase] || '#8a8aa0')

const myRoleName = computed(() => store.myRoleView?.role.name || '我')
const currentTurnName = computed(() => {
  const id = store.currentTurn
  if (!id)
    return '—'
  if (id === store.humanRoleId)
    return '你'
  return store.scriptView?.roles.find(r => r.id === id)?.name || id
})

const canSpeak = computed(() => store.phase === 'discussion' && store.isMyTurn)
const canInvestigate = computed(() => store.phase === 'discussion' && store.isMyTurn && !store.hasInvestigated)
const alreadyVoted = computed(() => store.humanRoleId in store.votes)

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
  }
  catch {
    uni.showToast({ title: '加载房间失败', icon: 'none' })
  }
  connectWs()
}

function connectWs() {
  socket.connect({
    gameId: store.gameId,
    roleId: store.humanRoleId,
    onEvent: msg => store.applyMessage(msg),
    onStatus: (s) => {
      store.setStatus(s)
      if (s === 'open') {
        if (store.phase === 'setup' || store.phase === 'reading') {
          onStart()
        }
        else if (store.phase !== 'finished') {
          resumeGame(store.gameId).catch(() => {})
        }
      }
    },
  })
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

function onChatSend(payload: { content: string, type: 'speak' | 'whisper' }) {
  if (payload.type === 'whisper') {
    const others = (store.scriptView?.roles || []).filter(r => r.id !== store.humanRoleId)
    if (others.length === 0) {
      uni.showToast({ title: '没有可私聊的对象', icon: 'none' })
      return
    }
    uni.showActionSheet({
      itemList: others.map(r => r.name),
      success: res => doSend(payload.content, 'whisper', others[res.tapIndex].id),
    })
    return
  }
  doSend(payload.content, 'speak', undefined)
}

function doSend(content: string, type: 'speak' | 'whisper', target?: string) {
  const tempId = `tmp-${Date.now()}`
  const targetName = target ? store.scriptView?.roles.find(r => r.id === target)?.name : undefined
  const optimistic: GameEvent = {
    id: tempId,
    at: Date.now(),
    type,
    roleId: store.humanRoleId,
    roleName: myRoleName.value,
    target,
    targetName,
    text: content,
    scope: type === 'whisper' ? store.humanRoleId : 'public',
  }
  store.pushOptimistic(optimistic)
  sendAction(store.gameId, {
    type: type as HumanActionType,
    content,
    target,
  }).catch(() => uni.showToast({ title: '发送失败', icon: 'none' }))
}

function onInvestigate(roleId: string) {
  sendAction(store.gameId, { type: 'investigate', target: roleId })
    .catch((e: any) => uni.showToast({ title: (e?.message || '调查失败'), icon: 'none' }))
}

function onShowClue(clueId: string) {
  sendAction(store.gameId, { type: 'show', clueId })
    .catch(() => uni.showToast({ title: '出示失败', icon: 'none' }))
}

function onVote(target: string | null) {
  voteApi(store.gameId, target)
    .catch((e: any) => uni.showToast({ title: (e?.message || '投票失败'), icon: 'none' }))
}

function onEndTurn() {
  sendAction(store.gameId, { type: 'endTurn' })
    .catch(() => uni.showToast({ title: '操作失败', icon: 'none' }))
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
  <view class="room">
    <view class="room__bg" />

    <!-- 自定义顶部状态栏 -->
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
      </view>
      <view class="room__status">
        <view class="room__phase" :style="{ color: phaseColor, borderColor: phaseColor }">
          {{ phaseText }}
        </view>
        <text class="room__round">
          第 {{ store.round }}/{{ store.maxRounds }} 轮
        </text>
        <text class="room__turn">
          当前：{{ currentTurnName }}
        </text>
      </view>
      <view
        v-if="store.phase === 'setup' || store.phase === 'reading' || store.phase === 'finished'"
        class="room__action"
        @tap="onStart"
      >
        {{ store.phase === 'finished' ? '重新开始' : '开始游戏' }}
      </view>
    </view>

    <!-- 内容区 -->
    <view class="room__body">
      <view v-show="activeTab === 'chat'" class="room__pane">
        <view class="room__chat-switch">
          <view
            class="room__chat-tab" :class="{ 'room__chat-tab--on': chatMode === 'public' }"
            @tap="chatMode = 'public'"
          >
            公开发言
          </view>
          <view
            class="room__chat-tab" :class="{ 'room__chat-tab--on': chatMode === 'whisper' }"
            @tap="chatMode = 'whisper'"
          >
            🤫 私聊
          </view>
        </view>
        <sk-chat-panel
          :events="store.allEvents"
          :my-role-id="store.humanRoleId"
          :can-speak="canSpeak"
          :mode="chatMode"
          :whisper-target-name="currentTurnName"
          @send="onChatSend"
        />
      </view>

      <view v-show="activeTab === 'reason'" class="room__pane">
        <sk-reasoning-panel :events="store.allEvents" />
      </view>

      <view v-show="activeTab === 'clue'" class="room__pane">
        <sk-clue-panel
          :my-clue-texts="store.myRoleView?.clueTexts || []"
          :roles="store.scriptView?.roles || []"
          :investigated-ids="store.snapshot?.usedInvestigation ? Object.keys(store.snapshot.usedInvestigation).filter(id => store.snapshot!.usedInvestigation![id]) : []"
          :can-investigate="canInvestigate"
          @investigate="onInvestigate"
          @show="onShowClue"
        />
      </view>

      <view v-show="activeTab === 'role'" class="room__pane">
        <sk-role-card :view="store.myRoleView" />
      </view>

      <view v-show="activeTab === 'vote'" class="room__pane">
        <sk-vote-panel
          :roles="store.scriptView?.roles || []"
          :votes="store.votes"
          :already-voted="alreadyVoted"
          @vote="onVote"
        />
      </view>
    </view>

    <!-- 结束回合（讨论阶段且轮到自己时） -->
    <view v-if="canSpeak" class="room__endturn" @tap="onEndTurn">
      <text>结束我的回合 ▶</text>
    </view>

    <!-- 底部 tab -->
    <view class="room__tabbar">
      <view
        v-for="t in tabs"
        :key="t.key"
        class="room__tab" :class="{ 'room__tab--on': activeTab === t.key }"
        @tap="activeTab = t.key"
      >
        <text class="room__tab-label">
          {{ t.label }}
        </text>
      </view>
    </view>

    <!-- 结算弹窗 -->
    <sk-result-dialog
      :show="showResult || store.phase === 'finished'"
      :winner="store.winner"
      :truth="store.truth"
      :my-role-name="myRoleName"
      @close="showResult = false"
    />
  </view>
</template>

<style lang="scss" scoped>
.room {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.room__bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(700rpx 400rpx at 90% 0%, rgba(168, 85, 247, 0.16), transparent 70%),
    linear-gradient(180deg, #0f0f1a, #16162a);
}

.room__nav {
  padding: calc(env(safe-area-inset-top) + 20rpx) 28rpx 16rpx;
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

.room__status {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 14rpx;
}

.room__phase {
  padding: 4rpx 18rpx;
  font-size: 23rpx;
  border: 1rpx solid;
  border-radius: 999rpx;
}

.room__round,
.room__turn {
  font-size: 23rpx;
  color: #b8b8c8;
}

.room__action {
  margin-top: 14rpx;
  align-self: flex-start;
  padding: 12rpx 36rpx;
  font-size: 26rpx;
  color: #fff;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
}

.room__body {
  flex: 1;
  overflow: hidden;
}

.room__pane {
  height: 100%;
}

.room__chat-switch {
  display: flex;
  gap: 14rpx;
  padding: 16rpx 24rpx 0;
}

.room__chat-tab {
  padding: 10rpx 26rpx;
  font-size: 24rpx;
  color: #b8b8c8;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999rpx;

  &--on {
    color: #fff;
    background: rgba(168, 85, 247, 0.28);
  }
}

.room__endturn {
  margin: 0 28rpx;
  padding: 20rpx;
  text-align: center;
  font-size: 27rpx;
  color: #fff;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
}

.room__tabbar {
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(15, 15, 26, 0.95);
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.room__tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22rpx 0;
  transition: color 0.2s ease;

  &--on .room__tab-label {
    color: #c084fc;
    font-weight: 600;
  }
}

.room__tab-label {
  font-size: 26rpx;
  color: #8a8aa0;
}
</style>
