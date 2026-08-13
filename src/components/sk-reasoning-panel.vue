<script setup lang="ts">
import type { GameEvent } from '@/api/scriptKillTypes'
import { computed } from 'vue'

const props = defineProps<{
  events: GameEvent[]
}>()

// 仅展示 narrator（主持人推理/旁白）与 system 中的推理内容
const reasoning = computed(() => {
  return props.events
    .filter(e => e.type === 'narrator' || (e.type === 'system' && e.text?.includes('推理')))
    .map(e => ({
      id: e.id,
      at: e.at,
      name: e.roleName || '主持人',
      text: e.text || '',
    }))
})
</script>

<template>
  <scroll-view class="sk-reason" scroll-y>
    <view v-if="reasoning.length === 0" class="sk-reason__empty">
      <text>🕵️ 推理面板</text>
      <text class="sk-reason__tip">
        AI 主持人的推理与真相线索会在此浮现
      </text>
    </view>
    <view v-for="r in reasoning" :key="r.id" class="sk-reason__item">
      <view class="sk-reason__head">
        <view class="sk-reason__dot" />
        <text class="sk-reason__name">
          {{ r.name }}
        </text>
      </view>
      <text class="sk-reason__text">
        {{ r.text }}
      </text>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.sk-reason {
  height: 100%;
  padding: 24rpx;
}

.sk-reason__empty {
  margin-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  font-size: 28rpx;
  color: #8a8aa0;
}

.sk-reason__tip {
  font-size: 23rpx;
  color: #6a6a80;
}

.sk-reason__item {
  position: relative;
  padding: 22rpx 24rpx 22rpx 28rpx;
  margin-bottom: 20rpx;
  border-radius: 18rpx;
  background: rgba(124, 58, 237, 0.1);
  border: 1rpx solid rgba(168, 85, 247, 0.22);
  border-left: 4rpx solid #a855f7;
  animation: sk-reason-in 0.4s ease;
}

@keyframes sk-reason-in {
  from {
    opacity: 0;
    transform: translateX(-16rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.sk-reason__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.sk-reason__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #c084fc;
  box-shadow: 0 0 12rpx #c084fc;
}

.sk-reason__name {
  font-size: 24rpx;
  font-weight: 600;
  color: #c084fc;
}

.sk-reason__text {
  display: block;
  font-size: 25rpx;
  line-height: 1.7;
  color: #d8d8e8;
  word-break: break-word;
}
</style>
