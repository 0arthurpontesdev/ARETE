export interface ParticipantInfo {
  identity: string;
  name: string;
  isLocal: boolean;
  isHost: boolean;
  isCoHost?: boolean;
  isSpeaking: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  avatarUrl?: string;
  isHandRaised?: boolean;
  activeReaction?: string;
  audioLevel?: number;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'unknown';
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  sizeFormatted?: string;
  mimeType: string;
  uploadedAt: string;
  senderIdentity?: string;
  senderName?: string;
}

export interface ChatMessageData {
  id: string;
  senderIdentity: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isLocal: boolean;
  isPrivate?: boolean;
  recipientIdentity?: string;
  recipientName?: string;
  replyToId?: string;
  replyToText?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentSize?: string;
  attachment?: ChatAttachment;
  reactions?: { emoji: string; count: number }[];
  replyCount?: number;
}

export interface FloatingReaction {
  id: string;
  senderIdentity: string;
  senderName: string;
  emoji: string;
  timestamp: number;
}

export interface PinnedMessageInfo {
  messageId: string;
  pinnedBy: string;
  pinnedText: string;
  linkUrl?: string;
}

export interface SecuritySettings {
  isLocked: boolean;
  waitingRoomEnabled: boolean;
  hideProfilePics: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowRename: boolean;
  allowUnmute: boolean;
}

export interface WaitingParticipant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  participantIdentities: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters?: string[];
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creatorIdentity?: string;
  creatorName?: string;
  isMultipleChoice?: boolean;
  isActive: boolean;
  totalVotes: number;
  votedIdentities?: string[];
}

export interface AnnotationPoint {
  x: number;
  y: number;
  tool: 'pen' | 'highlighter' | 'stamp_star' | 'stamp_check' | 'stamp_arrow' | 'eraser';
  color: string;
  strokeWidth: number;
}

export type RecordingStatus = 'idle' | 'recording_local' | 'recording_cloud';

export interface MeetingPreferences {
  dualMonitors: boolean;
  darkMode: boolean;
  hdVideo: boolean;
  mirrorVideo: boolean;
  lowLightAdjustment: boolean;
  smoothSkin: boolean;
  noiseSuppression: 'low' | 'medium' | 'high';
  originalSound: boolean;
  virtualBackground: string; // 'none' | 'blur_low' | 'blur_high' | 'office' | 'beach' | 'modern'
  videoFilter: string; // 'normal' | 'warm' | 'cool' | 'sepia' | 'bw'
  saveSeparateAudioTracks: boolean;
  recordingDirectory: string;
  closedCaptionsEnabled: boolean;
}

export interface LoomClip {
  id: string;
  title: string;
  durationSeconds: number;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface ScheduleBooking {
  id: string;
  title: string;
  hostName: string;
  hostEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  guestName: string;
  guestEmail: string;
  meetingCode: string;
}

export interface OrganizationAccount {
  orgName: string;
  plan: 'Pro' | 'Business' | 'Enterprise';
  licensesUsed: number;
  totalLicenses: number;
  domain: string;
  billingCycle: 'Mensal' | 'Anual';
  nextBillingDate: string;
}

export interface MeetingReportItem {
  id: string;
  meetingId: string;
  topic: string;
  startTime: string;
  duration: string;
  participantCount: number;
  pollCount: number;
  recordingUrl?: string;
  attendees: Array<{
    name: string;
    email: string;
    joinTime: string;
    leaveTime: string;
    duration: string;
  }>;
}

export interface MeetingRoomState {
  roomId: string;
  token: string;
  wsUrl: string;
  userName: string;
  isHost: boolean;
}

export type ActivePanel =
  | 'chat'
  | 'participants'
  | 'settings'
  | 'security'
  | 'breakout'
  | 'polls'
  | 'recording'
  | 'invite'
  | 'copilot'
  | null;

export interface TranscriptItem {
  id?: string;
  speaker: string;
  text: string;
  timestamp: string;
  isLocal?: boolean;
}

export interface CopilotSummary {
  topic: string;
  executive_summary: string;
  key_points: string[];
  main_decisions: string[];
  sentiment?: string;
  engagement_level?: string;
  generated_at?: string;
  source?: 'gemini' | 'heuristic_fallback';
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  priority: 'Alta' | 'Média' | 'Baixa' | string;
  status: 'pending' | 'completed';
}

export interface MeetingMinutes {
  title: string;
  date: string;
  start_time: string;
  duration: string;
  host: string;
  attendees: string[];
  agenda: string[];
  discussions: string[];
  decisions: string[];
  action_items: ActionItem[];
  closing_statement: string;
  formatted_document: string;
  generated_at?: string;
  source?: 'gemini' | 'heuristic_fallback';
}

export interface CopilotQAMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  citations?: string[];
}

export type ViewMode = 'gallery' | 'speaker';
