<script setup lang="ts">
import type {
  GameListItem,
  ScriptCard,
  ScriptSelectView,
} from '@/api/scriptKillTypes'
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createGame,
  generateScript,
  getScript,
  listGames,
  listScripts,
} from '@/api/scriptKill'
import { useScriptKillStore } from '@/stores/scriptKill'

const store = useScriptKillStore()

const scripts = ref<ScriptCard[]>([])
const games = ref<GameListItem[]>([])
const loading = ref(false)

const scriptMap = computed(() =>
  Object.fromEntries(scripts.value.map(s => [s.id, s])),
)

// 生成剧本表单
const genForm = reactive({
  showGenerate: false,
  topic: '',
  count: 5,
  genre: '悬疑',
  diff: '普通',
  generating: false,
})
const genres = ['悬疑', '恐怖', '推理', '欢乐', '情感', '科幻']
const diffs = ['简单', '普通', '困难', '烧脑']

// 选角弹窗
const showRole = ref(false)
const roleScript = ref<ScriptSelectView | null>(null)
const selectedRoleId = ref('')

async function loadLobby() {
  loading.value = true
  try {
    const [sRes, gRes] = await Promise.all([listScripts(), listGames()])
    scripts.value = sRes || []
    games.value = gRes || []
  }
  catch {
    uni.showToast({ title: '加载失败，请检查后端', icon: 'none' })
  }
  finally {
    loading.value = false
  }
}

function scriptName(id: string): string {
  return scriptMap.value[id]?.title || '未知剧本'
}

const phaseMap: Record<string, string> = {
  setup: '准备中',
  reading: '阅读中',
  discussion: '讨论中',
  voting: '投票中',
  reveal: '揭晓中',
  finished: '已结束',
}

function phaseText(p: string): string {
  return phaseMap[p] || p
}

async function onGenerate() {
  if (!genForm.topic.trim()) {
    uni.showToast({ title: '请填写题材', icon: 'none' })
    return
  }
  genForm.generating = true
  try {
    const res = await generateScript({
      topic: genForm.topic.trim(),
      playerCount: genForm.count,
      genre: genForm.genre,
      difficulty: genForm.diff,
    })
    uni.showToast({ title: '剧本已生成', icon: 'success' })
    const card = res.card
    scripts.value = [card, ...scripts.value.filter(s => s.id !== card.id)]
    genForm.showGenerate = false
  }
  catch (e: any) {
    uni.showToast({ title: (e?.message || '生成失败'), icon: 'none' })
  }
  finally {
    genForm.generating = false
  }
}

async function openRole(scriptId: string) {
  try {
    const res = await getScript(scriptId)
    roleScript.value = res
    selectedRoleId.value = res.roles[0]?.id || ''
    showRole.value = true
  }
  catch {
    uni.showToast({ title: '获取剧本失败', icon: 'none' })
  }
}

async function onCreate() {
  if (!roleScript.value || !selectedRoleId.value)
    return
  const script = roleScript.value
  try {
    const res = await createGame({ scriptId: script.id, humanRoleId: selectedRoleId.value })
    store.saveSession(res.gameId, selectedRoleId.value)
    store.setScriptView(script)
    showRole.value = false
    uni.navigateTo({ url: `/pages/script-kill/room?gameId=${res.gameId}` })
  }
  catch (e: any) {
    uni.showToast({ title: (e?.message || '创建失败'), icon: 'none' })
  }
}

async function joinGame(g: GameListItem) {
  await openRole(g.scriptId)
}

onMounted(loadLobby)
</script>

<template>
  <view class="lobby">
    <view class="lobby__header">
      <text class="lobby__title">
        🎭 剧本杀工坊
      </text>
      <text class="lobby__sub">
        悬疑之夜，等你入局
      </text>
    </view>

    <!-- 生成剧本 -->
    <view class="lobby__card">
      <view class="lobby__card-head" @tap="genForm.showGenerate = !genForm.showGenerate">
        <text>✨ AI 创作新剧本</text>
        <text class="lobby__arrow">
          {{ genForm.showGenerate ? '收起' : '展开' }}
        </text>
      </view>
      <view v-if="genForm.showGenerate" class="lobby__gen">
        <input v-model="genForm.topic" class="lobby__input" placeholder="题材/背景，如：民国上海滩豪门命案" placeholder-class="lobby__ph">
        <view class="lobby__row">
          <text class="lobby__row-label">
            人数
          </text>
          <u-number-box v-model="genForm.count" :min="3" :max="8" />
        </view>
        <view class="lobby__chips">
          <text class="lobby__chips-label">
            类型
          </text>
          <view
            v-for="g in genres" :key="g"
            class="lobby__chip" :class="{ 'lobby__chip--on': genForm.genre === g }"
            @tap="genForm.genre = g"
          >
            {{ g }}
          </view>
        </view>
        <view class="lobby__chips">
          <text class="lobby__chips-label">
            难度
          </text>
          <view
            v-for="d in diffs" :key="d"
            class="lobby__chip" :class="{ 'lobby__chip--on': genForm.diff === d }"
            @tap="genForm.diff = d"
          >
            {{ d }}
          </view>
        </view>
        <button class="lobby__gen-btn" :disabled="genForm.generating" @tap="onGenerate">
          {{ genForm.generating ? 'AI 创作中…' : '开始创作' }}
        </button>
      </view>
    </view>

    <!-- 房间列表 -->
    <view class="lobby__section">
      <text class="lobby__section-title">
        🔥 进行中的房间
      </text>
      <view v-if="games.length === 0" class="lobby__empty">
        <text>暂无房间，创建一个开始游戏吧</text>
      </view>
      <view v-for="g in games" :key="g.id" class="lobby__room">
        <view class="lobby__room-info">
          <text class="lobby__room-name">
            {{ scriptName(g.scriptId) }}
          </text>
          <view class="lobby__room-phase">
            {{ phaseText(g.phase) }}
          </view>
        </view>
        <button class="lobby__room-join" @tap="joinGame(g)">
          加入
        </button>
      </view>
    </view>

    <!-- 剧本库 -->
    <view class="lobby__section">
      <text class="lobby__section-title">
        📚 剧本库
      </text>
      <view class="lobby__scripts">
        <sk-script-card
          v-for="s in scripts"
          :key="s.id"
          :script="s"
          @select="openRole"
        />
      </view>
    </view>

    <!-- 选角弹窗 -->
    <u-popup v-model="showRole" mode="bottom" :round="20">
      <view class="role-pop">
        <view class="role-pop__head">
          <text class="role-pop__title">
            {{ roleScript?.title }}
          </text>
          <text class="role-pop__close" @tap="showRole = false">
            ✕
          </text>
        </view>
        <scroll-view class="role-pop__list" scroll-y>
          <sk-role-option
            v-for="r in (roleScript?.roles || [])"
            :key="r.id"
            :role="r"
            :selected="selectedRoleId === r.id"
            @choose="selectedRoleId = $event"
          />
        </scroll-view>
        <button class="role-pop__btn" @tap="onCreate">
          进入房间
        </button>
      </view>
    </u-popup>
  </view>
</template>

<style lang="scss" scoped>
.lobby {
  position: relative;
  min-height: 100vh;
  padding: 0 28rpx 60rpx;
  background:
    radial-gradient(800rpx 500rpx at 80% -10%, rgba(168, 85, 247, 0.18), transparent 70%),
    radial-gradient(700rpx 500rpx at -10% 20%, rgba(59, 130, 246, 0.12), transparent 70%),
    linear-gradient(180deg, #0f0f1a, #1a1a2e);
}

.lobby__header {
  padding: calc(env(safe-area-inset-top) + 36rpx) 8rpx 36rpx;
}

.lobby__title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #edeDF5;
}

.lobby__sub {
  display: block;
  margin-top: 10rpx;
  font-size: 25rpx;
  color: #8a8aa0;
}

.lobby__card {
  padding: 24rpx;
  margin-bottom: 30rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(168, 85, 247, 0.25);
}

.lobby__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28rpx;
  color: #c084fc;
}

.lobby__arrow {
  font-size: 24rpx;
  color: #8a8aa0;
}

.lobby__gen {
  margin-top: 24rpx;
}

.lobby__input {
  height: 76rpx;
  padding: 0 24rpx;
  font-size: 26rpx;
  color: #edeDF5;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(168, 85, 247, 0.3);
  border-radius: 16rpx;
}

.lobby__ph {
  color: #6a6a80;
}
.lobby__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22rpx;
}

.lobby__row-label {
  font-size: 26rpx;
  color: #d8d8e8;
}

.lobby__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14rpx;
  margin-top: 22rpx;
}

.lobby__chips-label {
  font-size: 26rpx;
  color: #d8d8e8;
}

.lobby__chip {
  padding: 10rpx 24rpx;
  font-size: 24rpx;
  color: #b8b8c8;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid transparent;
  border-radius: 999rpx;

  &--on {
    color: #fff;
    background: rgba(168, 85, 247, 0.28);
    border-color: #a855f7;
  }
}

.lobby__gen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 30rpx;
  height: 84rpx;
  line-height: 1;
  font-size: 28rpx;
  color: #fff;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7c3aed, #a855f7);

  &::after {
    border: none;
  }
  &[disabled] {
    opacity: 0.6;
  }
}

.lobby__section {
  margin-bottom: 30rpx;
}

.lobby__section-title {
  display: block;
  margin-bottom: 18rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #edeDF5;
}

.lobby__empty {
  font-size: 23rpx;
  color: #6a6a80;
}

.lobby__room {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  margin-bottom: 14rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.lobby__room-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.lobby__room-name {
  font-size: 28rpx;
  color: #edeDF5;
}

.lobby__room-phase {
  align-self: flex-start;
  padding: 2rpx 14rpx;
  font-size: 20rpx;
  color: #34d399;
  background: rgba(16, 185, 129, 0.14);
  border-radius: 999rpx;
}

.lobby__room-join {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60rpx;
  line-height: 1;
  padding: 0 32rpx;
  font-size: 24rpx;
  color: #fff;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #7c3aed, #a855f7);

  &::after {
    border: none;
  }
}

.lobby__scripts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
}

.role-pop {
  padding: 30rpx 28rpx calc(30rpx + env(safe-area-inset-bottom));
  background: #16162a;
}

.role-pop__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.role-pop__title {
  font-size: 32rpx;
  font-weight: 700;
  color: #edeDF5;
}

.role-pop__close {
  font-size: 32rpx;
  color: #8a8aa0;
  padding: 0 10rpx;
}

.role-pop__list {
  max-height: 60vh;
}

.role-pop__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;
  height: 84rpx;
  line-height: 1;
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

<style lang="scss">
/* 页面根背景色兜底，防止下拉回弹露出白底 */
page {
  background-color: #0f0f1a;
}

/* placeholder 挂在原生 input 内部节点，scoped 属性选择器命中不到，必须放在非 scoped 块 */
.lobby__ph {
  color: #6a6a80;
}
</style>
