<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { GameEvent } from '@/api/scriptKillTypes'

const props = defineProps<{
	events: GameEvent[]
	myRoleId: string
	canSpeak: boolean
	mode: 'public' | 'whisper'
	whisperTargetName?: string
}>()

const emit = defineEmits<{
	(e: 'send', payload: { content: string; type: 'speak' | 'whisper' })
}>()

const input = ref('')
const scrollTop = ref(0)
const scrollView = ref<any>(null)

function scrollToBottom() {
	nextTick(() => {
		scrollTop.value = 999999
	})
}

watch(() => props.events.length, scrollToBottom, { immediate: true })

function onSend() {
	const text = input.value.trim()
	if (!text) return
	if (!props.canSpeak) {
		uni.showToast({ title: '现在不是你的回合', icon: 'none' })
		return
	}
	emit('send', { content: text, type: props.mode })
	input.value = ''
}
</script>

<template>
	<view class="sk-chat">
		<scroll-view
			ref="scrollView"
			class="sk-chat__list"
			scroll-y
			:scroll-top="scrollTop"
			:scroll-with-animation="true"
		>
			<view v-if="events.length === 0" class="sk-chat__empty">
				<text>夜幕降临，尚无声响……</text>
			</view>
			<sk-msg-bubble
				v-for="ev in events"
				:key="ev.id"
				:event="ev"
				:is-mine="ev.roleId === myRoleId"
			/>
		</scroll-view>

		<view class="sk-chat__input">
			<view v-if="mode === 'whisper'" class="sk-chat__mode">
				🤫 私聊 {{ whisperTargetName || '某人' }}
			</view>
			<view class="sk-chat__row">
				<input
					v-model="input"
					class="sk-chat__field"
					:placeholder="mode === 'whisper' ? '悄悄说点什么…' : '公开发言…'"
					placeholder-class="sk-chat__ph"
					confirm-type="send"
					@confirm="onSend"
				>
				<button class="sk-chat__send" @tap="onSend">发送</button>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
.sk-chat {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.sk-chat__list {
	flex: 1;
	padding: 24rpx;
	overflow-y: auto;
}

.sk-chat__empty {
	margin-top: 120rpx;
	text-align: center;
	font-size: 24rpx;
	color: #6a6a80;
}

.sk-chat__input {
	padding: 16rpx 20rpx calc(16rpx + env(safe-area-inset-bottom));
	background: rgba(15, 15, 26, 0.9);
	border-top: 1rpx solid rgba(255, 255, 255, 0.08);
}

.sk-chat__mode {
	font-size: 22rpx;
	color: #60a5fa;
	margin-bottom: 10rpx;
}

.sk-chat__row {
	display: flex;
	gap: 14rpx;
	align-items: center;
}

.sk-chat__field {
	flex: 1;
	height: 72rpx;
	padding: 0 24rpx;
	font-size: 26rpx;
	color: #edeDF5;
	background: rgba(255, 255, 255, 0.06);
	border: 1rpx solid rgba(168, 85, 247, 0.3);
	border-radius: 999rpx;
}

.sk-chat__ph {
	color: #6a6a80;
}

.sk-chat__send {
	flex-shrink: 0;
	height: 72rpx;
	padding: 0 36rpx;
	font-size: 26rpx;
	color: #fff;
	border: none;
	border-radius: 999rpx;
	background: linear-gradient(135deg, #7c3aed, #a855f7);

	&::after {
		border: none;
	}
}
</style>
