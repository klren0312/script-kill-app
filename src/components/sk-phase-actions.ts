// 阶段视图与 PhaseFlow 之间的行为句柄契约（契约 §4）。
// 仅导出 interface，无实现副作用；T1 的 sk-phase-flow.vue 与各阶段视图均从本文件 import。
export interface PhaseActions {
  /** setup / reading：开始（或恢复）游戏 */
  onStart: () => void
  /** discussion：发送公开 / 私聊消息 */
  onChatSend: (payload: { content: string, type: 'speak' | 'whisper' }) => void
  /** discussion：调查某人（每回合 1 次） */
  onInvestigate: (roleId: string) => void
  /** discussion：出示线索 */
  onShow: (clueId: string) => void
  /** voting：投凶（target）或弃权（null） */
  onVote: (target: string | null) => void
  /** discussion：结束我的回合 */
  onEndTurn: () => void
  /** finished：回大厅（清空 session + navigateBack） */
  onBackToLobby: () => void
}
