<script setup lang="ts">
import type { RoleSelectInfo } from '@/api/scriptKillTypes'

defineProps<{
  role: RoleSelectInfo
  selected?: boolean
  disabled?: boolean
}>()
defineEmits<{ (e: 'choose', id: string): void }>()
</script>

<template>
  <view
    class="sk-role" :class="{ 'sk-role--active': selected, 'sk-role--disabled': disabled }"
    @tap="!disabled && $emit('choose', role.id)"
  >
    <view class="sk-role__avatar">
      <text>{{ role.name.slice(0, 1) }}</text>
    </view>
    <view class="sk-role__body">
      <text class="sk-role__name">
        {{ role.name }}
      </text>
      <text class="sk-role__public">
        {{ role.public }}
      </text>
      <view class="sk-role__goal">
        <text class="sk-role__goal-label">
          目标
        </text>
        <text class="sk-role__goal-text">
          {{ role.goal }}
        </text>
      </view>
    </view>
    <view v-if="selected" class="sk-role__check">
      ✓
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-role {
  position: relative;
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  margin-bottom: 18rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;

  &--active {
    border-color: #a855f7;
    background: rgba(168, 85, 247, 0.14);
    box-shadow: 0 0 0 2rpx rgba(168, 85, 247, 0.4);
  }

  &--disabled {
    opacity: 0.45;
  }
}

.sk-role__avatar {
  flex-shrink: 0;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
}

.sk-role__body {
  flex: 1;
  min-width: 0;
}

.sk-role__name {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #edeDF5;
  margin-bottom: 6rpx;
}

.sk-role__public {
  display: block;
  font-size: 23rpx;
  line-height: 1.5;
  color: #b8b8c8;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sk-role__goal {
  display: flex;
  gap: 10rpx;
  align-items: flex-start;
}

.sk-role__goal-label {
  flex-shrink: 0;
  padding: 2rpx 12rpx;
  font-size: 20rpx;
  color: #0f0f1a;
  background: #f59e0b;
  border-radius: 999rpx;
}

.sk-role__goal-text {
  font-size: 22rpx;
  line-height: 1.5;
  color: #d8d8e8;
}

.sk-role__check {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
  background: #a855f7;
}
</style>
