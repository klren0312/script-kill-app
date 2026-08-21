<script setup lang="ts">
import type { HumanRoleView } from '@/api/scriptKillTypes'
import SkMarkdown from './sk-markdown.vue'

defineProps<{
  view: HumanRoleView | null
}>()
</script>

<template>
  <scroll-view v-if="view" class="sk-rolecard" scroll-y>
    <view class="sk-rolecard__hero">
      <view class="sk-rolecard__avatar">
        <text>{{ view.role.name.slice(0, 1) }}</text>
      </view>
      <view>
        <text class="sk-rolecard__name">
          {{ view.role.name }}
        </text>
        <view class="sk-rolecard__secret-badge">
          <text>🔒 私密档案</text>
        </view>
      </view>
    </view>

    <view class="sk-rolecard__block">
      <text class="sk-rolecard__label">
        📖 人设
      </text>
      <SkMarkdown :source="view.role.public" />
    </view>

    <view class="sk-rolecard__block sk-rolecard__block--secret">
      <text class="sk-rolecard__label sk-rolecard__label--secret">
        🤫 秘密（仅你可见）
      </text>
      <SkMarkdown :source="view.role.secret" />
    </view>

    <view class="sk-rolecard__block">
      <text class="sk-rolecard__label sk-rolecard__label--goal">
        🎯 你的目标
      </text>
      <SkMarkdown :source="view.role.goal" />
    </view>

    <view v-if="Object.keys(view.role.relationships).length" class="sk-rolecard__block">
      <text class="sk-rolecard__label">
        🔗 人物关系
      </text>
      <view
        v-for="(rel, name) in view.role.relationships"
        :key="name"
        class="sk-rolecard__rel"
      >
        <text class="sk-rolecard__rel-name">
          {{ name }}
        </text>
        <SkMarkdown :source="rel" class="sk-rolecard__rel-text" />
      </view>
    </view>

    <view class="sk-rolecard__block">
      <text class="sk-rolecard__label">
        🔑 我的线索
      </text>
      <view v-if="view.clueTexts.length === 0" class="sk-rolecard__none">
        <text>尚无线索</text>
      </view>
      <view
        v-for="c in view.clueTexts"
        :key="c.id"
        class="sk-rolecard__clue"
      >
        <SkMarkdown :source="c.text" />
      </view>
    </view>
  </scroll-view>
  <view v-else class="sk-rolecard__loading">
    <text>加载角色档案…</text>
  </view>
</template>

<style lang="scss" scoped>
.sk-rolecard {
  height: 100%;
  padding: 28rpx;
}

.sk-rolecard__hero {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(15, 15, 26, 0.9));
  border: 1rpx solid rgba(168, 85, 247, 0.3);
}

.sk-rolecard__avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  box-shadow: 0 0 24rpx rgba(168, 85, 247, 0.5);
}

.sk-rolecard__name {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #edeDF5;
  margin-bottom: 10rpx;
}

.sk-rolecard__secret-badge {
  align-self: flex-start;
  padding: 4rpx 16rpx;
  font-size: 20rpx;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.16);
  border: 1rpx solid rgba(245, 158, 11, 0.4);
  border-radius: 999rpx;
}

.sk-rolecard__block {
  padding: 20rpx 22rpx;
  margin-bottom: 18rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.07);

  &--secret {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.3);
    animation: sk-pulse 2.4s ease-in-out infinite;
  }
}

@keyframes sk-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
  50% {
    box-shadow: 0 0 18rpx rgba(245, 158, 11, 0.25);
  }
}

.sk-rolecard__label {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #c084fc;
  margin-bottom: 12rpx;

  &--secret {
    color: #f59e0b;
  }
  &--goal {
    color: #34d399;
  }
}

.sk-rolecard__rel {
  display: flex;
  gap: 14rpx;
  margin-top: 12rpx;
}

.sk-rolecard__rel-name {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #c084fc;
}

.sk-rolecard__rel-text {
  min-width: 0;
  font-size: 24rpx;
  line-height: 1.6;
  color: #b8b8c8;
  word-break: break-word;
}

.sk-rolecard__none {
  font-size: 22rpx;
  color: #ababc6;
}

.sk-rolecard__clue {
  padding: 14rpx 16rpx;
  margin-top: 12rpx;
  font-size: 23rpx;
  line-height: 1.6;
  color: #edeDF5;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 12rpx;
}

.sk-rolecard__loading {
  margin-top: 160rpx;
  text-align: center;
  color: #ababc6;
  font-size: 24rpx;
}
</style>
