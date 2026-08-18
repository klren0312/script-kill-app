<script setup lang="ts">
import type { PhaseActions } from './sk-phase-actions'
import { computed } from 'vue'
import { useScriptKillStore } from '@/stores/scriptKill'

const props = defineProps<{ actions: PhaseActions }>()

const store = useScriptKillStore()

const winnerText = computed(() => {
  const w = store.winner
  if (!w)
    return ''
  if (w === 'detective')
    return '🕵️ 侦探方获胜'
  if (w === 'culprit')
    return '🔪 凶手方获胜'
  if (w === 'abstain')
    return '⚖️ 凶手逃脱'
  return w
})

const myRoleName = computed(() => store.myRoleView?.role.name || '我')
</script>

<template>
  <view class="sk-phase sk-phase-finished">
    <view class="sk-phase-finished__banner">
      <text class="sk-phase-finished__banner-text">
        {{ winnerText || '案件终结' }}
      </text>
      <text class="sk-phase-finished__banner-sub">
        结算 · {{ store.scriptView?.title || '剧本杀' }}
      </text>
    </view>

    <scroll-view v-if="store.truth" class="sk-phase-finished__body" scroll-y>
      <view class="sk-phase-finished__block">
        <text class="sk-phase-finished__label">
          真凶
        </text>
        <text class="sk-phase-finished__value sk-phase-finished__value--danger">
          {{ store.truth.culprit }}
        </text>
      </view>
      <view class="sk-phase-finished__block">
        <text class="sk-phase-finished__label">
          动机
        </text>
        <text class="sk-phase-finished__value">
          {{ store.truth.motive }}
        </text>
      </view>
      <view class="sk-phase-finished__block">
        <text class="sk-phase-finished__label">
          手法
        </text>
        <text class="sk-phase-finished__value">
          {{ store.truth.method }}
        </text>
      </view>
      <view class="sk-phase-finished__block">
        <text class="sk-phase-finished__label">
          完整时间线
        </text>
        <view
          v-for="(t, i) in store.truth.timeline"
          :key="i"
          class="sk-phase-finished__timeline"
        >
          <text class="sk-phase-finished__time">
            {{ t.time }}
          </text>
          <text class="sk-phase-finished__event">
            {{ t.event }}
          </text>
        </view>
      </view>
      <view class="sk-phase-finished__me">
        <text>你扮演：{{ myRoleName }}</text>
      </view>
    </scroll-view>

    <view v-else class="sk-phase-finished__empty">
      <text>结算数据加载中…</text>
    </view>

    <view class="sk-phase-finished__footer">
      <button class="sk-phase-finished__cta" @tap="props.actions.onBackToLobby">
        再来一局
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-phase-finished {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sk-phase-finished__banner {
  flex-shrink: 0;
  padding: 40rpx 28rpx;
  text-align: center;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
}

.sk-phase-finished__banner-text {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #fff;
}

.sk-phase-finished__banner-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.8);
}

.sk-phase-finished__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx;
}

.sk-phase-finished__block {
  margin-bottom: 22rpx;
}

.sk-phase-finished__label {
  display: block;
  font-size: 23rpx;
  color: #c084fc;
  margin-bottom: 8rpx;
}

.sk-phase-finished__value {
  display: block;
  font-size: 26rpx;
  line-height: 1.7;
  color: #edeDF5;

  &--danger {
    color: #f87171;
    font-weight: 600;
  }
}

.sk-phase-finished__timeline {
  display: flex;
  gap: 14rpx;
  padding: 10rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.sk-phase-finished__time {
  flex-shrink: 0;
  width: 130rpx;
  font-size: 23rpx;
  color: #f59e0b;
}

.sk-phase-finished__event {
  font-size: 24rpx;
  line-height: 1.6;
  color: #d8d8e8;
}

.sk-phase-finished__me {
  margin-top: 18rpx;
  padding: 14rpx 18rpx;
  font-size: 23rpx;
  color: #b8b8c8;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12rpx;
}

.sk-phase-finished__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #8a8aa0;
}

.sk-phase-finished__footer {
  flex-shrink: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(15, 15, 26, 0.9);
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
}

.sk-phase-finished__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  line-height: 1;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  box-shadow: 0 10rpx 30rpx rgba(124, 58, 237, 0.4);

  &::after {
    border: none;
  }
}
</style>
