// 剧本杀 REST 接口封装（对齐后端 apps/script-kill/src/server/routes.ts）
import { http } from 'uview-pro'
import type {
	ScriptCard,
	ScriptSelectView,
	GameListItem,
	PublicSnapshot,
	HumanRoleView,
	HumanActionType,
} from './scriptKillTypes'

// 统一关闭全局 toast，错误由调用方处理，避免打断游戏体验
const meta = { toast: false, loading: false } as const

/** 剧本库列表 */
export function listScripts() {
	return http.get<ScriptCard[]>('/api/scripts', {}, { meta })
}

/** 剧本详情（选角视图，不含 secret/线索/真相） */
export function getScript(id: string) {
	return http.get<ScriptSelectView>(`/api/scripts/${id}`, {}, { meta })
}

/** AI 生成新剧本（耗时较长，约 16s+） */
export function generateScript(body: {
	topic: string
	playerCount?: number
	genre?: string
	difficulty?: string
	id?: string
}) {
	return http.post<{ card: ScriptCard; select: ScriptSelectView }>('/api/scripts/generate', body, { meta })
}

/** 房间列表（仅 id/scriptId/phase，需前端关联 /api/scripts 补全剧本名） */
export function listGames() {
	return http.get<GameListItem[]>('/api/games', {}, { meta })
}

/** 创建房间：返回 gameId 与所选角色的完整视图 */
export function createGame(body: { scriptId: string; humanRoleId: string }) {
	return http.post<{ gameId: string; humanRole: HumanRoleView }>('/api/games', body, { meta })
}

/** 房间公开快照 */
export function getGame(id: string) {
	return http.get<PublicSnapshot>(`/api/games/${id}`, {}, { meta })
}

/** 当前角色完整视角（背景/线索/目标） */
export function getMe(id: string) {
	return http.get<HumanRoleView>(`/api/games/${id}/me`, {}, { meta })
}

/** 开始游戏 */
export function startGame(id: string) {
	return http.post<{ ok: boolean }>(`/api/games/${id}/start`, {}, { meta })
}

/** 继续游戏（断线/刷新后恢复推进） */
export function resumeGame(id: string) {
	return http.post<{ ok: boolean }>(`/api/games/${id}/resume`, {}, { meta })
}

/** 发送动作：speak / whisper / investigate / show / endTurn */
export function sendAction(
	id: string,
	body: { type: HumanActionType; content?: string; target?: string; clueId?: string },
) {
	return http.post<{ ok: boolean }>(`/api/games/${id}/action`, body, { meta })
}

/** 投票投凶（target 为空串视为弃权） */
export function vote(id: string, target: string | null) {
	return http.post<{ ok: boolean }>(`/api/games/${id}/vote`, { target }, { meta })
}

/** AI 润色发言文本 */
export function polish(id: string, text: string) {
	return http.post<{ polished: string }>(`/api/games/${id}/polish`, { text }, { meta })
}
