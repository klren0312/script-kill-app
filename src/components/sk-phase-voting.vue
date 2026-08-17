<script setup lang="ts">
import type { PhaseActions } from './sk-phase-actions'
import { computed } from 'vue'
import { useScriptKillStore } from '@/stores/scriptKill'
import SkVotePanel from './sk-vote-panel.vue'

const props = defineProps<{ actions: PhaseActions }>()

const store = useScriptKillStore()

const roles = computed(() => store.scriptView?.roles ?? [])
const alreadyVoted = computed(() => store.humanRoleId in store.votes)
const votedCount = computed(() => Object.keys(store.votes).length)
const totalCount = computed(() => roles.value.length)
</script>

<template>
  <view class="sk-phase sk-phase-voting">
    <view class="sk-phase-voting__head">
      <view class="sk-phase__pill sk-phase__pill--voting">
        投票中
      </view>
      <text class="sk-phase-voting__suspense">
        🔮 已有 {{ votedCount }}/{{ totalCount }} 位玩家完成表决…
      </text>
    </view>

    <view class="sk-phase-voting__panel">
      <sk-vote-panel
        :roles="roles"
        :votes="store.votes"
        :already-voted="alreadyVoted"
        @vote="props.actions.onVote"
      />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-phase-voting {
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

  &--voting {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.5);
  }
}

.sk-phase-voting__head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx 28rpx 0;
}

.sk-phase-voting__suspense {
  font-size: 23rpx;
  color: #f59e0b;
}

.sk-phase-voting__panel {
  flex: 1;
  min-height: 0;
}
</style>
