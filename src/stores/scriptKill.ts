// 剧本杀游戏状态：快照、公开/私密事件、角色视角、事件归并与乐观更新
import { defineStore } from 'pinia'
import type {
	PublicSnapshot,
	GameEvent,
	WsMessage,
	ScriptSelectView,
	HumanRoleView,
	Phase,
	Truth,
} from '@/api/scriptKillTypes'

const STORAGE_KEY = 'sk_current'

interface State {
	gameId: string
	humanRoleId: string
	snapshot: PublicSnapshot | null
	scriptView: ScriptSelectView | null
	myRoleView: HumanRoleView | null
	publicEvents: GameEvent[]
	privateEvents: GameEvent[]
	phase: Phase
	status: 'idle' | 'connecting' | 'open' | 'closed' | 'error'
	winner: string | undefined
	truth: Truth | undefined
}

export const useScriptKillStore = defineStore('scriptKill', {
	state: (): State => ({
		gameId: '',
		humanRoleId: '',
		snapshot: null,
		scriptView: null,
		myRoleView: null,
		publicEvents: [],
		privateEvents: [],
		phase: 'setup',
		status: 'idle',
		winner: undefined,
		truth: undefined,
	}),
	persist: {
		key: STORAGE_KEY,
		paths: ['gameId', 'humanRoleId'],
	},
	getters: {
		isMyTurn: (s) => s.snapshot?.currentTurn === s.humanRoleId,
		round: (s) => s.snapshot?.round ?? 0,
		maxRounds: (s) => s.snapshot?.maxRounds ?? 0,
		currentTurn: (s) => s.snapshot?.currentTurn ?? null,
		votes: (s) => s.snapshot?.votes ?? {},
		myClues: (s) => s.snapshot?.roleClues?.[s.humanRoleId] ?? [],
		hasInvestigated: (s) => !!s.snapshot?.usedInvestigation?.[s.humanRoleId],
		// 合并公开与私密事件用于聊天/推理面板渲染
		allEvents(): GameEvent[] {
			return [...this.publicEvents, ...this.privateEvents].sort((a, b) => a.at - b.at)
		},
	},
	actions: {
		saveSession(gameId: string, humanRoleId: string) {
			this.gameId = gameId
			this.humanRoleId = humanRoleId
		},
		clearSession() {
			uni.removeStorageSync(STORAGE_KEY)
			this.gameId = ''
			this.humanRoleId = ''
			this.resetGame()
		},
		loadSessionFromStorage(): boolean {
			const v = uni.getStorageSync(STORAGE_KEY) as Partial<State> | ''
			if (!v || typeof v !== 'object' || !v.gameId || !v.humanRoleId) return false
			this.gameId = v.gameId
			this.humanRoleId = v.humanRoleId
			return true
		},
		resetGame() {
			this.snapshot = null
			this.scriptView = null
			this.myRoleView = null
			this.publicEvents = []
			this.privateEvents = []
			this.phase = 'setup'
			this.status = 'idle'
			this.winner = undefined
			this.truth = undefined
		},
		setScriptView(v: ScriptSelectView) {
			this.scriptView = v
		},
		setMyRoleView(v: HumanRoleView) {
			this.myRoleView = v
		},
		setStatus(s: State['status']) {
			this.status = s
		},
		/** 处理 WS 消息：snapshot 整体替换，GameEvent 增量归并 */
		applyMessage(msg: WsMessage) {
			if ('snapshot' in msg && msg.type === 'snapshot') {
				this.applySnapshot(msg.snapshot)
				return
			}
			this.applyEvent(msg)
		},
		applySnapshot(snap: PublicSnapshot) {
			this.snapshot = snap
			this.phase = snap.phase
			this.winner = snap.winner
			this.publicEvents = [...snap.publicEvents]
			this.privateEvents = [...snap.myPrivateEvents]
		},
		applyEvent(ev: GameEvent) {
			// game_end 记录真相与胜负
			if (ev.type === 'game_end') {
				this.winner = ev.winner
				this.truth = ev.truth
				this.phase = 'finished'
			}
			if (ev.type === 'phase' && ev.phase) {
				this.phase = ev.phase
			}
			// 去重：若已存在相同 id 的事件（如乐观更新占位），替换而非追加
			const list = ev.scope && ev.scope !== 'public' && ev.scope === this.humanRoleId
				? this.privateEvents
				: this.publicEvents
			const existing = list.findIndex((e) => e.id === ev.id)
			if (existing >= 0) {
				list.splice(existing, 1, ev)
			}
			else {
				list.push(ev)
			}
		},
		/** 乐观更新：先插入占位消息，收到真实事件后按 id 替换 */
		pushOptimistic(ev: GameEvent) {
			if (ev.scope && ev.scope !== 'public' && ev.scope === this.humanRoleId) {
				this.privateEvents.push(ev)
			}
			else {
				this.publicEvents.push(ev)
			}
		},
		replaceOptimistic(tempId: string, real: GameEvent) {
			const list = real.scope && real.scope !== 'public' && real.scope === this.humanRoleId
				? this.privateEvents
				: this.publicEvents
			const idx = list.findIndex((e) => e.id === tempId)
			if (idx >= 0) list.splice(idx, 1, real)
		},
	},
})
