<script setup lang="ts">
import type { RoleSelectInfo } from '@/api/scriptKillTypes'
import { computed } from 'vue'

const props = defineProps<{
  roles: RoleSelectInfo[]
  votes: Record<string, string | null>
  alreadyVoted: boolean
}>()

const emit = defineEmits<{
  (e: 'vote', target: string | null): void
}>()

// 谁投了谁（仅展示已投票人数，不泄露具体指向以保持悬念）
const voteCount = computed(() => {
  const c: Record<string, number> = {}
  Object.values(props.votes).forEach((v) => {
    if (v)
      c[v] = (c[v] || 0) + 1
  })
  return c
})
</script>

<template>
  <view class="sk-vote">
    <view class="sk-vote__head">
      <text class="sk-vote__title">
        🗳 投凶表决
      </text>
      <text class="sk-vote__sub">
        指认你心中的真凶，也可选择弃权
      </text>
    </view>

    <view class="sk-vote__list">
      <view
        v-for="r in roles"
        :key="r.id"
        class="sk-vote__item"
        :class="{ 'sk-vote__item--done': alreadyVoted }"
        @tap="!alreadyVoted && emit('vote', r.id)"
      >
        <text class="sk-vote__name">
          {{ r.name }}
        </text>
        <view v-if="voteCount[r.id]" class="sk-vote__count">
          <text>{{ voteCount[r.id] }} 票</text>
        </view>
      </view>

      <view class="sk-vote__item sk-vote__item--abstain" @tap="!alreadyVoted && emit('vote', null)">
        <text class="sk-vote__name">
          🚫 弃权
        </text>
      </view>
    </view>

    <view v-if="alreadyVoted" class="sk-vote__done">
      <text>✓ 你已投票，等待其他玩家…</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-vote {
  height: 100%;
  padding: 28rpx;
}

.sk-vote__head {
  margin-bottom: 24rpx;
}

.sk-vote__title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #edeDF5;
}

.sk-vote__sub {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: #8a8aa0;
}

.sk-vote__list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.sk-vote__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 26rpx 28rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;

  &:active {
    border-color: #a855f7;
    background: rgba(168, 85, 247, 0.14);
  }

  &--done {
    opacity: 0.55;
  }

  &--abstain {
    border-style: dashed;
    border-color: rgba(239, 68, 68, 0.4);
  }
}

.sk-vote__name {
  font-size: 28rpx;
  color: #edeDF5;
}

.sk-vote__count {
  padding: 4rpx 16rpx;
  font-size: 22rpx;
  color: #c084fc;
  background: rgba(168, 85, 247, 0.16);
  border-radius: 999rpx;
}

.sk-vote__done {
  margin-top: 28rpx;
  text-align: center;
  font-size: 24rpx;
  color: #34d399;
}
</style>
