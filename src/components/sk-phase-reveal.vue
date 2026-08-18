<script setup lang="ts">
import type { PhaseActions } from './sk-phase-actions'
import { computed } from 'vue'
import { useScriptKillStore } from '@/stores/scriptKill'

// 本阶段无 CTA，仅按契约收 actions props
defineProps<{ actions: PhaseActions }>()

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
</script>

<template>
  <view class="sk-phase sk-phase-reveal">
    <view class="sk-phase-reveal__core">
      <view class="sk-phase-reveal__halo">
        <view class="sk-phase-reveal__halo-dot" />
      </view>
      <text class="sk-phase-reveal__title">
        真相即将揭晓
        <text class="sk-phase-reveal__dots">
          …
        </text>
      </text>
      <text class="sk-phase-reveal__sub">
        主持人正在核对证词与时间线
      </text>

      <view v-if="winnerText" class="sk-phase-reveal__hint">
        <text class="sk-phase-reveal__hint-line">
          {{ winnerText }}
        </text>
        <text v-if="store.truth?.culprit" class="sk-phase-reveal__culprit">
          真凶似乎就是…… {{ store.truth.culprit }}
        </text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-phase-reveal {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40rpx;
}

.sk-phase-reveal__core {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sk-phase-reveal__halo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 220rpx;
  height: 220rpx;
  margin-bottom: 40rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(168, 85, 247, 0.4);
  animation: sk-reveal-halo 2.4s ease-in-out infinite;
}

.sk-phase-reveal__halo-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #c084fc;
  box-shadow: 0 0 30rpx #c084fc;
}

@keyframes sk-reveal-halo {
  0%, 100% {
    transform: scale(0.85);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
}

.sk-phase-reveal__title {
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1.4;
  background: linear-gradient(90deg, #a855f7, #c084fc, #60a5fa, #a855f7);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: sk-reveal-shimmer 4s linear infinite;
}

@keyframes sk-reveal-shimmer {
  from {
    background-position: 0% 0;
  }
  to {
    background-position: 300% 0;
  }
}

.sk-phase-reveal__dots {
  display: inline-block;
  animation: sk-reveal-blink 1.4s ease-in-out infinite;
}

@keyframes sk-reveal-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

.sk-phase-reveal__sub {
  margin-top: 18rpx;
  font-size: 25rpx;
  color: #b8b8c8;
}

.sk-phase-reveal__hint {
  margin-top: 48rpx;
  padding: 24rpx 32rpx;
  border-radius: 18rpx;
  background: rgba(168, 85, 247, 0.1);
  border: 1rpx solid rgba(168, 85, 247, 0.3);
}

.sk-phase-reveal__hint-line {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #c084fc;
}

.sk-phase-reveal__culprit {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #f87171;
}
</style>
