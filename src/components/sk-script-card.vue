<script setup lang="ts">
import type { ScriptCard } from '@/api/scriptKillTypes'

defineProps<{
	script: ScriptCard
}>()
defineEmits<{ (e: 'select', id: string): void }>()
</script>

<template>
	<view class="sk-card" @tap="$emit('select', script.id)">
		<view class="sk-card__glow" />
		<view class="sk-card__head">
			<text class="sk-card__title">{{ script.title }}</text>
			<view class="sk-card__genre">{{ script.genre }}</view>
		</view>
		<text class="sk-card__desc">{{ script.description }}</text>
		<view class="sk-card__meta">
			<view class="sk-chip">
				<text class="sk-chip__icon">👥</text>
				<text>{{ script.playerCount }} 人</text>
			</view>
			<view class="sk-chip">
				<text class="sk-chip__icon">⏱</text>
				<text>{{ script.estimatedMinutes }} 分钟</text>
			</view>
			<view class="sk-chip sk-chip--diff">{{ script.difficulty }}</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
.sk-card {
	position: relative;
	overflow: hidden;
	padding: 28rpx;
	border-radius: 24rpx;
	background: linear-gradient(160deg, rgba(122, 58, 237, 0.18), rgba(15, 15, 26, 0.92));
	border: 1rpx solid rgba(168, 85, 247, 0.28);
	box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.45);
	transition: transform 0.2s ease, border-color 0.2s ease;

	&:active {
		transform: scale(0.98);
		border-color: rgba(192, 132, 252, 0.6);
	}
}

.sk-card__glow {
	position: absolute;
	top: -60rpx;
	right: -60rpx;
	width: 180rpx;
	height: 180rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(168, 85, 247, 0.5), transparent 70%);
	pointer-events: none;
}

.sk-card__head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16rpx;
	margin-bottom: 14rpx;
}

.sk-card__title {
	font-size: 34rpx;
	font-weight: 700;
	color: #edeDF5;
}

.sk-card__genre {
	flex-shrink: 0;
	padding: 4rpx 16rpx;
	font-size: 22rpx;
	color: #c084fc;
	background: rgba(168, 85, 247, 0.16);
	border-radius: 999rpx;
}

.sk-card__desc {
	display: block;
	font-size: 24rpx;
	line-height: 1.6;
	color: #b8b8c8;
	margin-bottom: 20rpx;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.sk-card__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 14rpx;
}

.sk-chip {
	display: flex;
	align-items: center;
	gap: 6rpx;
	padding: 6rpx 16rpx;
	font-size: 22rpx;
	color: #d8d8e8;
	background: rgba(255, 255, 255, 0.06);
	border-radius: 999rpx;

	&__icon {
		font-size: 20rpx;
	}
}

.sk-chip--diff {
	color: #f59e0b;
	background: rgba(245, 158, 11, 0.14);
}
</style>
