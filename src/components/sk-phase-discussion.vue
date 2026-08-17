<script setup lang="ts">
import type { PhaseActions } from './sk-phase-actions'
import { computed, ref } from 'vue'
import { useScriptKillStore } from '@/stores/scriptKill'
import SkChatPanel from './sk-chat-panel.vue'
import SkCluePanel from './sk-clue-panel.vue'
import SkReasoningPanel from './sk-reasoning-panel.vue'

const props = defineProps<{ actions: PhaseActions }>()

const store = useScriptKillStore()

const chatMode = ref<'public' | 'whisper'>('public')
const clueOpen = ref(false)
const reasonOpen = ref(false)

// 线索速览：轮到且未调查时可出示线索 / 调查他人（契约 §4 恢复原 tab 交互）
const myClueTexts = computed(() => store.myRoleView?.clueTexts ?? [])
const roles = computed(() => store.scriptView?.roles ?? [])
const investigatedIds = computed(() => {
  const used = store.snapshot?.usedInvestigation ?? {}
  return Object.keys(used).filter(id => used[id])
})
const canInvestigate = computed(() =>
  store.phase === 'discussion' && store.isMyTurn && !store.hasInvestigated,
)

const currentTurnName = computed(() => {
  const id = store.currentTurn
  if (!id)
    return '主持人'
  if (id === store.humanRoleId)
    return '你'
  return store.scriptView?.roles.find(r => r.id === id)?.name || id
})
</script>

<template>
  <view class="sk-phase sk-phase-disc">
    <view class="sk-phase-disc__fold">
      <view
        class="sk-phase-disc__fold-item"
        :class="{ 'sk-phase-disc__fold-item--on': clueOpen }"
        @tap="clueOpen = !clueOpen"
      >
        <text>🔑 线索速览</text>
        <text class="sk-phase-disc__fold-arrow">
          {{ clueOpen ? '▴' : '▾' }}
        </text>
      </view>
      <view
        class="sk-phase-disc__fold-item"
        :class="{ 'sk-phase-disc__fold-item--on': reasonOpen }"
        @tap="reasonOpen = !reasonOpen"
      >
        <text>🧠 推理</text>
      </view>
    </view>

    <view v-show="clueOpen" class="sk-phase-disc__clue">
      <sk-clue-panel
        :my-clue-texts="myClueTexts"
        :roles="roles"
        :investigated-ids="investigatedIds"
        :can-investigate="canInvestigate"
        @investigate="props.actions.onInvestigate"
        @show="props.actions.onShow"
      />
    </view>

    <view class="sk-phase-disc__chat">
      <view class="sk-phase-disc__switch">
        <view
          class="sk-phase-disc__switch-item"
          :class="{ 'sk-phase-disc__switch-item--on': chatMode === 'public' }"
          @tap="chatMode = 'public'"
        >
          公开发言
        </view>
        <view
          class="sk-phase-disc__switch-item"
          :class="{ 'sk-phase-disc__switch-item--on': chatMode === 'whisper' }"
          @tap="chatMode = 'whisper'"
        >
          🤫 私聊
        </view>
      </view>
      <sk-chat-panel
        class="sk-phase-disc__chat-panel"
        :events="store.allEvents"
        :my-role-id="store.humanRoleId"
        :can-speak="store.isMyTurn"
        :mode="chatMode"
        :whisper-target-name="currentTurnName"
        @send="props.actions.onChatSend"
      />
    </view>

    <view class="sk-phase-disc__foot">
      <view v-if="store.isMyTurn" class="sk-phase-disc__endturn" @tap="props.actions.onEndTurn">
        <text>结束我的回合 ▶</text>
      </view>
      <text v-else class="sk-phase-disc__wait">
        等待 {{ currentTurnName }} 发言…
      </text>
    </view>

    <view v-if="reasonOpen" class="sk-phase-disc__overlay" @tap.self="reasonOpen = false">
      <view class="sk-phase-disc__sheet">
        <view class="sk-phase-disc__sheet-head">
          <text class="sk-phase-disc__sheet-title">
            🧠 推理面板
          </text>
          <text class="sk-phase-disc__sheet-close" @tap="reasonOpen = false">
            ✕
          </text>
        </view>
        <view class="sk-phase-disc__sheet-body">
          <sk-reasoning-panel :events="store.allEvents" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-phase-disc {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sk-phase-disc__fold {
  flex-shrink: 0;
  display: flex;
  gap: 14rpx;
  padding: 16rpx 24rpx 0;
}

.sk-phase-disc__fold-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 24rpx;
  font-size: 24rpx;
  color: #b8b8c8;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
  transition: all 0.2s ease;

  &--on {
    color: #fff;
    background: rgba(168, 85, 247, 0.28);
    border-color: rgba(168, 85, 247, 0.45);
  }
}

.sk-phase-disc__fold-arrow {
  font-size: 20rpx;
  color: #8a8aa0;
}

.sk-phase-disc__clue {
  flex-shrink: 0;
  height: 480rpx;
  margin: 14rpx 24rpx 0;
  border-radius: 18rpx;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
}

.sk-phase-disc__chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sk-phase-disc__chat-panel {
  flex: 1;
  min-height: 0;
}

.sk-phase-disc__switch {
  flex-shrink: 0;
  display: flex;
  gap: 14rpx;
  padding: 16rpx 24rpx 0;
}

.sk-phase-disc__switch-item {
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

.sk-phase-disc__foot {
  flex-shrink: 0;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
}

.sk-phase-disc__endturn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 27rpx;
  font-weight: 600;
  color: #fff;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  box-shadow: 0 8rpx 24rpx rgba(239, 68, 68, 0.3);
}

.sk-phase-disc__wait {
  display: block;
  text-align: center;
  padding: 22rpx 0;
  font-size: 24rpx;
  color: #8a8aa0;
}

.sk-phase-disc__overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.6);
}

.sk-phase-disc__sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 70vh;
  border-radius: 28rpx 28rpx 0 0;
  overflow: hidden;
  background: linear-gradient(160deg, #1a1a2e, #0f0f1a);
  border-top: 1rpx solid rgba(168, 85, 247, 0.4);
}

.sk-phase-disc__sheet-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.sk-phase-disc__sheet-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #c084fc;
}

.sk-phase-disc__sheet-close {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #b8b8c8;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.sk-phase-disc__sheet-body {
  flex: 1;
  min-height: 0;
}
</style>
