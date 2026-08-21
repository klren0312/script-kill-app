// 剧本杀后端契约类型（对齐 apps/script-kill 后端 game/types.ts 与 domain/schema.ts）

export type Phase = 'setup' | 'reading' | 'discussion' | 'voting' | 'reveal' | 'finished'

export type EventType
  = | 'narrator'
    | 'speak'
    | 'whisper'
    | 'investigate'
    | 'show'
    | 'vote'
    | 'phase'
    | 'turn'
    | 'system'
    | 'game_end'

export interface GameEvent {
  id: string
  at: number
  type: EventType
  roleId?: string
  roleName?: string
  target?: string | null
  targetName?: string
  text?: string
  phase?: Phase
  scope?: 'public' | string
  winner?: string
  votes?: Record<string, string | null>
  truth?: Truth
  round?: number
  currentTurn?: string | null
  humanTurn?: boolean
}

export interface TimelineEntry {
  time: string
  event: string
}

export interface Truth {
  culprit: string
  motive: string
  method: string
  timeline: TimelineEntry[]
}

export interface RoleSelectInfo {
  id: string
  name: string
  public: string
  goal: string
}

export interface ScriptCard {
  id: string
  title: string
  genre: string
  description: string
  playerCount: number
  estimatedMinutes: number
  difficulty: string
}

export interface ScriptSelectView {
  id: string
  title: string
  genre: string
  description: string
  difficulty: string
  playerCount: number
  estimatedMinutes: number
  setting: { time: string, place: string, background: string }
  roles: RoleSelectInfo[]
  locations: { id: string, name: string, description: string }[]
  publicClues: { id: string, text: string }[]
}

export interface HumanRoleView {
  role: {
    id: string
    name: string
    public: string
    secret: string
    goal: string
    relationships: Record<string, string>
  }
  clueTexts: { id: string, text: string }[]
  publicClues: { id: string, text: string }[]
}

export interface PublicSnapshot {
  id: string
  scriptId: string
  phase: Phase
  createdAt: number
  updatedAt: number
  humanRoleId: string
  order: string[]
  turnIndex: number
  round: number
  maxRounds: number
  currentTurn: string | null
  usedInvestigation: Record<string, boolean>
  roleClues: Record<string, string[]>
  votes: Record<string, string | null>
  publicEvents: GameEvent[]
  myPrivateEvents: GameEvent[]
  winner?: string
}

export interface GameListItem {
  id: string
  scriptId: string
  phase: Phase
  updatedAt: number
}

export interface SnapshotEnvelope {
  type: 'snapshot'
  snapshot: PublicSnapshot
}

/** 服务端心跳帧（预留）：后端当前以 `: heartbeat` 注释保活，若改为可观察的 ping 帧则命中此类型。
 * 注意：type 必须是单字面量（不能写成 'ping' | 'heartbeat' 联合），
 * 否则 TS 判别联合收窄无法在排除分支中消除该成员。 */
export interface PingEnvelope {
  type: 'ping'
}

export interface HeartbeatEnvelope {
  type: 'heartbeat'
}

export type WsMessage = SnapshotEnvelope | GameEvent | PingEnvelope | HeartbeatEnvelope

export type HumanActionType = 'speak' | 'whisper' | 'investigate' | 'show' | 'endTurn'
