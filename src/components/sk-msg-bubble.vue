<script setup lang="ts">
import type { EventType, GameEvent } from '@/api/scriptKillTypes'
import SkMarkdown from './sk-markdown.vue'

defineProps<{
  event: GameEvent
  isMine: boolean
}>()

// 仅个人消息类事件（发言/私聊/调查/出示）应用"我的消息"右对齐与渐变样式；
// turn/phase/system 等游戏广播事件即使 roleId 命中当前玩家也不右对齐，避免错位
const MINE_TYPES: ReadonlySet<EventType> = new Set(['speak', 'whisper', 'investigate', 'show'])

const labelMap: Record<string, string> = {
  narrator: '📜 主持人',
  speak: '💬 发言',
  whisper: '🤫 私语',
  investigate: '🔍 调查',
  show: '📂 出示',
  vote: '🗳 投票',
  phase: '🌗 阶段',
  turn: '▶ 行动',
  system: '⚙ 系统',
  game_end: '🏁 结局',
}
</script>

<template>
  <view class="sk-msg" :class="[`sk-msg--${event.type}`, { 'sk-msg--mine': isMine && MINE_TYPES.has(event.type) }]">
    <view v-if="event.roleName && (event.type === 'narrator' || event.type === 'speak' || event.type === 'whisper' || event.type === 'show')" class="sk-msg__name">
      {{ event.roleName }}
      <text v-if="event.type === 'whisper'" class="sk-msg__tag">
        私聊
      </text>
    </view>
    <view v-else class="sk-msg__type">
      {{ labelMap[event.type] || event.type }}
    </view>

    <view class="sk-msg__bubble">
      <template v-if="event.type === 'investigate'">
        <text class="sk-msg__text">
          {{ event.roleName }} 调查了 {{ event.targetName }}：
        </text>
        <SkMarkdown v-if="event.text" :source="event.text" :color="'#f59e0b'" />
      </template>
      <template v-else-if="event.type === 'show'">
        <text class="sk-msg__text">
          {{ event.roleName }} 出示了线索：
        </text>
        <SkMarkdown v-if="event.text" :source="event.text" :color="'#f59e0b'" />
      </template>
      <template v-else-if="event.type === 'vote'">
        <SkMarkdown :source="event.text || `${event.roleName} 已投票`" />
      </template>
      <template v-else>
        <SkMarkdown v-if="event.text" :source="event.text" />
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sk-msg {
  margin-bottom: 20rpx;
  display: flex;
  flex-direction: column;
  animation: sk-msg-in 0.3s ease;

  &--mine {
    align-items: flex-end;
  }
}

@keyframes sk-msg-in {
  from {
    opacity: 0;
    transform: translateY(12rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sk-msg__name {
  font-size: 23rpx;
  color: #c084fc;
  margin-bottom: 6rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.sk-msg__tag {
  padding: 1rpx 10rpx;
  font-size: 18rpx;
  color: #0f0f1a;
  background: #c084fc;
  border-radius: 999rpx;
}

.sk-msg__type {
  font-size: 22rpx;
  color: #8a8aa0;
  margin-bottom: 6rpx;
}

.sk-msg__bubble {
  max-width: 84%;
  padding: 18rpx 22rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #edeDF5;
  background: rgba(255, 255, 255, 0.07);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.sk-msg--mine .sk-msg__bubble {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(168, 85, 247, 0.4));
  border-color: rgba(192, 132, 252, 0.4);
}

.sk-msg--narrator .sk-msg__bubble {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(15, 15, 26, 0.9));
  border-color: rgba(245, 158, 11, 0.3);
}

.sk-msg--system .sk-msg__bubble {
  background: transparent;
  border: none;
  color: #8a8aa0;
  font-size: 23rpx;
  padding: 6rpx 0;
}

.sk-msg--whisper .sk-msg__bubble {
  background: rgba(59, 130, 246, 0.14);
  border-color: rgba(59, 130, 246, 0.3);
}

.sk-msg__text {
  display: block;
  word-break: break-word;
}
</style>
