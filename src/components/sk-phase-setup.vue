<script setup lang="ts">
import type { PhaseActions } from './sk-phase-actions'
import { computed } from 'vue'
import { useScriptKillStore } from '@/stores/scriptKill'
import SkMarkdown from './sk-markdown.vue'

const props = defineProps<{ actions: PhaseActions }>()

const store = useScriptKillStore()

const setting = computed(() => store.scriptView?.setting)
const roles = computed(() => store.scriptView?.roles ?? [])

// 玩家顺序：优先取快照 order，未开局时退化为剧本角色顺序
const orderNames = computed(() => {
  const ids = store.snapshot?.order?.length ? store.snapshot.order : roles.value.map(r => r.id)
  return ids.map(id => roles.value.find(r => r.id === id)?.name || id)
})

const myRole = computed(() => roles.value.find(r => r.id === store.humanRoleId))
</script>

<template>
  <view class="sk-phase sk-phase-setup">
    <scroll-view class="sk-phase-setup__body" scroll-y>
      <view class="sk-phase-setup__head">
        <view class="sk-phase__pill">
          准备中
        </view>
        <text class="sk-phase-setup__title">
          {{ store.scriptView?.title || '剧本杀' }}
        </text>
        <text v-if="myRole" class="sk-phase-setup__myme">
          你将扮演：{{ myRole.name }}
        </text>
      </view>

      <view v-if="setting" class="sk-phase-setup__block">
        <text class="sk-phase-setup__label">
          📍 案件背景
        </text>
        <view class="sk-phase-setup__setting">
          <text class="sk-phase-setup__setting-item">
            ⏰ {{ setting.time }}
          </text>
          <text class="sk-phase-setup__setting-item">
            🗺️ {{ setting.place }}
          </text>
        </view>
        <SkMarkdown :source="setting.background" />
      </view>

      <view class="sk-phase-setup__block">
        <text class="sk-phase-setup__label">
          🎭 玩家阵容
        </text>
        <view v-if="roles.length === 0" class="sk-phase-setup__none">
          <text>角色分配中…</text>
        </view>
        <view
          v-for="r in roles"
          :key="r.id"
          class="sk-phase-setup__role"
          :class="{ 'sk-phase-setup__role--me': r.id === store.humanRoleId }"
        >
          <view class="sk-phase-setup__role-head">
            <text class="sk-phase-setup__role-name">
              {{ r.name }}
            </text>
            <text v-if="r.id === store.humanRoleId" class="sk-phase-setup__role-tag">
              你
            </text>
          </view>
          <text class="sk-phase-setup__role-public">
            {{ r.public }}
          </text>
        </view>
      </view>

      <view class="sk-phase-setup__block">
        <text class="sk-phase-setup__label">
          🔢 发言顺序
        </text>
        <view class="sk-phase-setup__order">
          <text
            v-for="(name, i) in orderNames"
            :key="i"
            class="sk-phase-setup__order-item"
          >
            {{ i + 1 }}. {{ name }}
          </text>
        </view>
      </view>
    </scroll-view>

    <view class="sk-phase-setup__footer">
      <button class="sk-phase-setup__cta" @tap="props.actions.onStart">
        开始游戏
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-phase-setup {
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
}

.sk-phase-setup__body {
  flex: 1;
  min-height: 0;
  padding: 28rpx;
}

.sk-phase-setup__head {
  margin-bottom: 28rpx;
}

.sk-phase-setup__title {
  display: block;
  margin-top: 16rpx;
  font-size: 38rpx;
  font-weight: 700;
  color: #edeDF5;
}

.sk-phase-setup__myme {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: #c084fc;
}

.sk-phase-setup__block {
  padding: 22rpx;
  margin-bottom: 22rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.07);
}

.sk-phase-setup__label {
  display: block;
  font-size: 25rpx;
  font-weight: 600;
  color: #c084fc;
  margin-bottom: 14rpx;
}

.sk-phase-setup__setting {
  display: flex;
  gap: 20rpx;
  margin-bottom: 12rpx;
}

.sk-phase-setup__setting-item {
  font-size: 24rpx;
  color: #60a5fa;
}

.sk-phase-setup__none {
  font-size: 23rpx;
  color: #ababc6;
}

.sk-phase-setup__role {
  padding: 18rpx 20rpx;
  margin-bottom: 14rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);

  &--me {
    border-color: rgba(168, 85, 247, 0.45);
    background: rgba(124, 58, 237, 0.12);
  }
}

.sk-phase-setup__role-head {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.sk-phase-setup__role-name {
  font-size: 27rpx;
  font-weight: 600;
  color: #edeDF5;
}

.sk-phase-setup__role-tag {
  padding: 2rpx 12rpx;
  font-size: 20rpx;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  border-radius: 999rpx;
}

.sk-phase-setup__role-public {
  font-size: 23rpx;
  line-height: 1.6;
  color: #b8b8c8;
}

.sk-phase-setup__order {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.sk-phase-setup__order-item {
  padding: 8rpx 18rpx;
  font-size: 23rpx;
  color: #d8d8e8;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 999rpx;
}

.sk-phase-setup__footer {
  flex-shrink: 0;
  padding: 20rpx 28rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(15, 15, 26, 0.9);
  border-top: 1rpx solid rgba(255, 255, 255, 0.06);
}

.sk-phase-setup__cta {
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
