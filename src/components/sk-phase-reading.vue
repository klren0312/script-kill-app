<script setup lang="ts">
import type { PhaseActions } from './sk-phase-actions'
import { computed, ref } from 'vue'
import { useScriptKillStore } from '@/stores/scriptKill'
import SkMarkdown from './sk-markdown.vue'
import SkRoleCard from './sk-role-card.vue'

const props = defineProps<{ actions: PhaseActions }>()

const store = useScriptKillStore()

const confirmed = ref(false)
const setting = computed(() => store.scriptView?.setting)
</script>

<template>
  <view class="sk-phase sk-phase-reading">
    <view class="sk-phase-reading__head">
      <view class="sk-phase__pill sk-phase__pill--reading">
        阅读中
      </view>
      <text class="sk-phase-reading__title">
        {{ store.scriptView?.title || '剧本杀' }}
      </text>
      <text class="sk-phase-reading__tip">
        请仔细阅读剧本背景与你的角色档案
      </text>
    </view>

    <view v-if="setting" class="sk-phase-reading__setting">
      <text class="sk-phase-reading__label">
        📍 案件背景
      </text>
      <view class="sk-phase-reading__meta">
        <text class="sk-phase-reading__meta-item">
          ⏰ {{ setting.time }}
        </text>
        <text class="sk-phase-reading__meta-item">
          🗺️ {{ setting.place }}
        </text>
      </view>
      <SkMarkdown :source="setting.background" />
    </view>

    <view class="sk-phase-reading__role">
      <sk-role-card :view="store.myRoleView" />
    </view>

    <view class="sk-phase-reading__footer">
      <view
        class="sk-phase-reading__confirm"
        :class="{ 'sk-phase-reading__confirm--on': confirmed }"
        @tap="confirmed = !confirmed"
      >
        <text class="sk-phase-reading__confirm-check">
          {{ confirmed ? '✓' : '' }}
        </text>
        <text>我已读完角色档案</text>
      </view>
      <button
        class="sk-phase-reading__cta"
        :class="{ 'sk-phase-reading__cta--disabled': !confirmed }"
        :disabled="!confirmed"
        @tap="confirmed && props.actions.onStart()"
      >
        开始讨论 ▶
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-phase-reading {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sk-phase__pill {
  align-self: flex-start;
  padding: 4rpx 18rpx;
  font-size: 23rpx;
  color: #b8b8c8;
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 999rpx;

  &--reading {
    color: #60a5fa;
    border-color: rgba(96, 165, 250, 0.5);
  }
}

.sk-phase-reading__head {
  flex-shrink: 0;
  padding: 28rpx 28rpx 8rpx;
}

.sk-phase-reading__title {
  display: block;
  margin-top: 14rpx;
  font-size: 34rpx;
  font-weight: 700;
  color: #edeDF5;
}

.sk-phase-reading__tip {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #8a8aa0;
}

.sk-phase-reading__setting {
  flex-shrink: 0;
  margin: 12rpx 28rpx 0;
  padding: 20rpx 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
}

.sk-phase-reading__label {
  display: block;
  font-size: 25rpx;
  font-weight: 600;
  color: #c084fc;
  margin-bottom: 12rpx;
}

.sk-phase-reading__meta {
  display: flex;
  gap: 20rpx;
  margin-bottom: 10rpx;
}

.sk-phase-reading__meta-item {
  font-size: 24rpx;
  color: #60a5fa;
}

.sk-phase-reading__role {
  flex: 1;
  min-height: 0;
}

.sk-phase-reading__footer {
  flex-shrink: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(15, 15, 26, 0.9);
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
}

.sk-phase-reading__confirm {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 12rpx 0;
  margin-bottom: 16rpx;
  font-size: 25rpx;
  color: #8a8aa0;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 999rpx;
  transition: all 0.2s ease;

  &--on {
    color: #34d399;
    border-color: rgba(52, 211, 153, 0.4);
    background: rgba(52, 211, 153, 0.1);
  }
}

.sk-phase-reading__confirm-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  font-size: 22rpx;
  color: #0f0f1a;
  border-radius: 50%;
  background: transparent;
}

.sk-phase-reading__confirm--on .sk-phase-reading__confirm-check {
  background: #34d399;
}

.sk-phase-reading__cta {
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
  transition: opacity 0.2s ease;

  &::after {
    border: none;
  }

  &--disabled {
    opacity: 0.4;
    box-shadow: none;
  }
}
</style>
