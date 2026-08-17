<script setup lang="ts">
// 阶段调度黑盒（契约 §3）：按 store.phase 渲染对应阶段视图，接管阶段切换过渡、
// 状态胶囊与轮次/回合展示；业务数据全部从 store 自取，room.vue 只传 connecting。
import type { Component } from 'vue'
import { computed } from 'vue'
import type { PhaseActions } from './sk-phase-actions'
import { resumeGame, sendAction, startGame, vote as voteApi } from '@/api/scriptKill'
import type { GameEvent, HumanActionType, Phase } from '@/api/scriptKillTypes'
import { useScriptKillStore } from '@/stores/scriptKill'

import skPhaseSetup from './sk-phase-setup.vue'
import skPhaseReading from './sk-phase-reading.vue'
import skPhaseDiscussion from './sk-phase-discussion.vue'
import skPhaseVoting from './sk-phase-voting.vue'
import skPhaseReveal from './sk-phase-reveal.vue'
import skPhaseFinished from './sk-phase-finished.vue'

defineProps<{ connecting: boolean }>()

const store = useScriptKillStore()

// 阶段 → 视图映射（契约 §2 单一真源，与 T2 组件名严格一致）
const phaseViewMap: Record<Phase, Component> = {
  setup: skPhaseSetup,
  reading: skPhaseReading,
  discussion: skPhaseDiscussion,
  voting: skPhaseVoting,
  reveal: skPhaseReveal,
  finished: skPhaseFinished,
}

const phaseTextMap: Record<Phase, string> = {
  setup: '准备中',
  reading: '阅读中',
  discussion: '讨论中',
  voting: '投票中',
  reveal: '揭晓中',
  finished: '已结束',
}

const phaseColorMap: Record<Phase, string> = {
  setup: '#8a8aa0',
  reading: '#60a5fa',
  discussion: '#a855f7',
  voting: '#f59e0b',
  reveal: '#f87171',
  finished: '#34d399',
}

const currentView = computed(() => phaseViewMap[store.phase])
const phaseText = computed(() => phaseTextMap[store.phase])
const phaseColor = computed(() => phaseColorMap[store.phase])
const round = computed(() => store.round)
const maxRounds = computed(() => store.maxRounds)
const currentTurnName = computed(() => {
  const id = store.currentTurn
  if (!id)
    return '—'
  if (id === store.humanRoleId)
    return '你'
  return store.scriptView?.roles.find(r => r.id === id)?.name || id
})

// ---- 行为句柄（契约 §3） ----

async function onStart() {
  try {
    if (store.phase === 'setup' || store.phase === 'reading')
      await startGame(store.gameId)
    else
      await resumeGame(store.gameId)
  }
  catch (e: any) {
    uni.showToast({ title: (e?.message || '操作失败'), icon: 'none' })
  }
}

/** 乐观插入占位消息 + sendAction，照搬原 room.vue 的 doSend */
function doSend(content: string, type: 'speak' | 'whisper', target?: string) {
  const tempId = `tmp-${Date.now()}`
  const targetName = target ? store.scriptView?.roles.find(r => r.id === target)?.name : undefined
  const optimistic: GameEvent = {
    id: tempId,
    at: Date.now(),
    type,
    roleId: store.humanRoleId,
    roleName: store.myRoleView?.role.name || '我',
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

function onInvestigate(roleId: string) {
  sendAction(store.gameId, { type: 'investigate', target: roleId })
    .catch((e: any) => uni.showToast({ title: (e?.message || '调查失败'), icon: 'none' }))
}

function onShow(clueId: string) {
  sendAction(store.gameId, { type: 'show', clueId })
    .catch((e: any) => uni.showToast({ title: (e?.message || '出示失败'), icon: 'none' }))
}

function onVote(target: string | null) {
  voteApi(store.gameId, target)
    .catch((e: any) => uni.showToast({ title: (e?.message || '投票失败'), icon: 'none' }))
}

function onEndTurn() {
  sendAction(store.gameId, { type: 'endTurn' })
    .catch(() => uni.showToast({ title: '操作失败', icon: 'none' }))
}

function onBackToLobby() {
  store.clearSession()
  uni.navigateBack().catch(() => uni.redirectTo({ url: '/pages/script-kill/index' }))
}

const actions: PhaseActions = {
  onStart,
  onChatSend,
  onInvestigate,
  onShow,
  onVote,
  onEndTurn,
  onBackToLobby,
}
</script>

<template>
  <view class="sk-phase">
    <!-- 阶段状态胶囊 + 轮次/当前回合（复用原 room__phase 视觉语言） -->
    <view class="sk-phase__status">
      <view class="sk-phase__pill" :style="{ color: phaseColor, borderColor: phaseColor }">
        {{ phaseText }}
      </view>
      <text class="sk-phase__round">
        第 {{ round }}/{{ maxRounds }} 轮
      </text>
      <text class="sk-phase__turn">
        当前：{{ currentTurnName }}
      </text>
    </view>

    <!-- 阶段视图：按 phase 切换，带 fade/slide 过渡 -->
    <view class="sk-phase__view">
      <Transition name="sk-phase-slide" mode="out-in">
        <component :is="currentView" :key="store.phase" :actions="actions" />
      </Transition>
    </view>

    <!-- 连接中遮罩 -->
    <view v-if="connecting" class="sk-phase__loading">
      <text class="sk-phase__loading-text">
        连接中…
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-phase {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.sk-phase__status {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 28rpx;
}

.sk-phase__pill {
  padding: 4rpx 18rpx;
  font-size: 23rpx;
  border: 1rpx solid;
  border-radius: 999rpx;
}

.sk-phase__round,
.sk-phase__turn {
  font-size: 23rpx;
  color: #b8b8c8;
}

.sk-phase__view {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sk-phase-slide-enter-active,
.sk-phase-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.sk-phase-slide-enter-from {
  opacity: 0;
  transform: translateX(24rpx);
}

.sk-phase-slide-leave-to {
  opacity: 0;
  transform: translateX(-24rpx);
}

.sk-phase__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 15, 26, 0.6);
  z-index: 10;
}

.sk-phase__loading-text {
  font-size: 28rpx;
  color: #edeDF5;
}
</style>
