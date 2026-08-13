<script setup lang="ts">
import { computed } from 'vue'
import type { Truth } from '@/api/scriptKillTypes'

const props = defineProps<{
	show: boolean
	winner: string | undefined
	truth: Truth | undefined
	myRoleName: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const winnerText = computed(() => {
	if (!props.winner) return ''
	if (props.winner === 'detective') return '🕵️ 侦探方获胜'
	if (props.winner === 'culprit') return '🔪 凶手方获胜'
	if (props.winner === 'abstain') return '⚖️ 凶手逃脱'
	return props.winner
})
</script>

<template>
	<u-popup :value="show" mode="center" :mask="true" @input="emit('close')">
		<view class="sk-result">
			<view class="sk-result__banner">
				<text class="sk-result__banner-text">{{ winnerText || '案件终结' }}</text>
			</view>

			<scroll-view v-if="truth" class="sk-result__body" scroll-y>
				<view class="sk-result__block">
					<text class="sk-result__label">真凶</text>
					<text class="sk-result__value sk-result__value--danger">{{ truth.culprit }}</text>
				</view>
				<view class="sk-result__block">
					<text class="sk-result__label">动机</text>
					<text class="sk-result__value">{{ truth.motive }}</text>
				</view>
				<view class="sk-result__block">
					<text class="sk-result__label">手法</text>
					<text class="sk-result__value">{{ truth.method }}</text>
				</view>
				<view class="sk-result__block">
					<text class="sk-result__label">完整时间线</text>
					<view
						v-for="(t, i) in truth.timeline"
						:key="i"
						class="sk-result__timeline"
					>
						<text class="sk-result__time">{{ t.time }}</text>
						<text class="sk-result__event">{{ t.event }}</text>
					</view>
				</view>
				<view class="sk-result__me">
					<text>你扮演：{{ myRoleName }}</text>
				</view>
			</scroll-view>

			<button class="sk-result__btn" @tap="emit('close')">合上卷宗</button>
		</view>
	</u-popup>
</template>

<style lang="scss" scoped>
.sk-result {
	width: 620rpx;
	max-height: 80vh;
	border-radius: 28rpx;
	overflow: hidden;
	background: linear-gradient(160deg, #1a1a2e, #0f0f1a);
	border: 1rpx solid rgba(168, 85, 247, 0.4);
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.6);
}

.sk-result__banner {
	padding: 36rpx 28rpx;
	text-align: center;
	background: linear-gradient(135deg, #7c3aed, #a855f7);
}

.sk-result__banner-text {
	font-size: 36rpx;
	font-weight: 700;
	color: #fff;
}

.sk-result__body {
	max-height: 56vh;
	padding: 28rpx;
}

.sk-result__block {
	margin-bottom: 22rpx;
}

.sk-result__label {
	display: block;
	font-size: 23rpx;
	color: #c084fc;
	margin-bottom: 8rpx;
}

.sk-result__value {
	display: block;
	font-size: 26rpx;
	line-height: 1.7;
	color: #edeDF5;

	&--danger {
		color: #f87171;
		font-weight: 600;
	}
}

.sk-result__timeline {
	display: flex;
	gap: 14rpx;
	padding: 10rpx 0;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.sk-result__time {
	flex-shrink: 0;
	width: 130rpx;
	font-size: 23rpx;
	color: #f59e0b;
}

.sk-result__event {
	font-size: 24rpx;
	line-height: 1.6;
	color: #d8d8e8;
}

.sk-result__me {
	margin-top: 18rpx;
	padding: 14rpx 18rpx;
	font-size: 23rpx;
	color: #8a8aa0;
	background: rgba(255, 255, 255, 0.04);
	border-radius: 12rpx;
}

.sk-result__btn {
	margin: 0 28rpx 28rpx;
	height: 80rpx;
	font-size: 28rpx;
	color: #fff;
	border: none;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #7c3aed, #a855f7);

	&::after {
		border: none;
	}
}
</style>
