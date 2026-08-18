<script setup lang="ts">
import type { RoleSelectInfo } from '@/api/scriptKillTypes'
import SkMarkdown from './sk-markdown.vue'

defineProps<{
  myClueTexts: { id: string, text: string }[]
  roles: RoleSelectInfo[]
  investigatedIds: string[]
  canInvestigate: boolean
}>()

const emit = defineEmits<{
  (e: 'investigate', roleId: string): void
  (e: 'show', clueId: string): void
}>()
</script>

<template>
  <scroll-view class="sk-clue" scroll-y>
    <!-- 我的线索 -->
    <view class="sk-clue__section">
      <text class="sk-clue__title">
        🔑 我的线索（可出示）
      </text>
      <view v-if="myClueTexts.length === 0" class="sk-clue__none">
        <text>暂无线索，先在讨论中调查或获取证据</text>
      </view>
      <view v-for="c in myClueTexts" :key="c.id" class="sk-clue__item">
        <SkMarkdown :source="c.text" />
        <button
          v-if="canInvestigate"
          class="sk-clue__show"
          @tap="emit('show', c.id)"
        >
          出示
        </button>
      </view>
    </view>

    <!-- 调查 -->
    <view class="sk-clue__section">
      <text class="sk-clue__title">
        🔍 调查某人（每回合 1 次）
      </text>
      <view class="sk-clue__grid">
        <view
          v-for="r in roles"
          :key="r.id"
          class="sk-clue__role"
          :class="{ 'sk-clue__role--done': investigatedIds.includes(r.id) }"
          @tap="!investigatedIds.includes(r.id) && canInvestigate && emit('investigate', r.id)"
        >
          <text class="sk-clue__role-name">
            {{ r.name }}
          </text>
          <text class="sk-clue__role-state">
            {{ investigatedIds.includes(r.id) ? '已调查' : (canInvestigate ? '调查' : '未轮到') }}
          </text>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.sk-clue {
  height: 100%;
  padding: 24rpx;
}

.sk-clue__section {
  margin-bottom: 30rpx;
}

.sk-clue__title {
  display: block;
  font-size: 27rpx;
  font-weight: 600;
  color: #c084fc;
  margin-bottom: 16rpx;
}

.sk-clue__none {
  font-size: 23rpx;
  color: #8a8aa0;
}

.sk-clue__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 14rpx;
  border-radius: 16rpx;
  background: rgba(245, 158, 11, 0.1);
  border: 1rpx solid rgba(245, 158, 11, 0.28);
}

.sk-clue__show {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  height: 56rpx;
  line-height: 1;
  padding: 0 24rpx;
  font-size: 22rpx;
  color: #0f0f1a;
  background: #f59e0b;
  border: none;
  border-radius: 999rpx;

  &::after {
    border: none;
  }
}

.sk-clue__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.sk-clue__role {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 22rpx 12rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;

  &--done {
    opacity: 0.5;
    border-color: rgba(16, 185, 129, 0.4);
  }
}

.sk-clue__role-name {
  font-size: 26rpx;
  color: #edeDF5;
}

.sk-clue__role-state {
  font-size: 20rpx;
  color: #8a8aa0;
}
</style>
