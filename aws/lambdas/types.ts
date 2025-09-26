// Proper type definitions to replace 'as any' usage
export interface JamSession {
  jamSessionId: string;
  pin?: string;
  description?: string;
  queue: number[];
  revision: number;
  currentSong?: number;
  currentPage?: number;
  userId: string;
  bandId?: string;
  policy: string;
  setListId?: string;
  admins?: User[];
  members?: User[];
  guests?: User[];
  adminIds?: string[]; // ID arrays for efficient access control
  memberIds?: string[];
  guestIds?: string[];
  active?: Participant[];
  passcode?: string;
  startDate?: number;
  endDate?: number;
  setList?: SetList;
  pageSettings?: PageSettings;
  slideConfigOverrides?: SongSlideConfig[];
  slideTextSize?: string;
}

export interface PageSettings {
  pageMax?: number;
  pageMin?: number;
}

export interface SongSlideConfig {
  songId: string;
  backgroundImg?: string;
  backgroundColor?: string;
  textColor?: string;
  highlightColor?: string;
  highlightOpacity?: string;
}

export interface SetList {
  setListId: string;
  description?: string;
  bandId?: string;
  songs?: JamSong[];
  songCache?: Song[];
  songIds?: string[];
  editors?: User[];
  userId?: string;
}

export interface JamSong {
  songId: string;
  key: string;
  order?: number;
  song?: Song;
}

export interface Song {
  songId: string;
  title: string;
  artist: string;
  album?: string;
  albumCover?: string;
  isApproved: boolean;
  version: number;
  chordSheet: string;
  chordSheetKey: string;
  originPlatorm?: string;
  originLink?: string;
  CCLISongTitle?: string;
  CCLISongWriter?: string;
  CCLICopyrightNotice?: string;
  CCLILicenseNumber?: string;
  userId: string;
  creator?: User;
  editors?: User[];
  viewers?: User[];
  recordings?: Recording[];
  bandIds?: string[];
  primaryBandId?: string;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  providers: string[];
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  recieveUpdatesFromOslyn?: boolean;
  isActivated?: boolean;
  createDate?: number;
  role: string;
  labelledRecording?: Recording[];
  songsCreated?: Song[];
  likedSongs?: JamSong[];
  friends?: User[];
  bandMemberships?: BandMembership[];
}

export interface Participant {
  userId: string;
  participantType: string;
  joinTime: number;
  lastPing?: number;
  username?: string;
  colour?: string;
  ip?: string;
  user?: User;
}

export interface Band {
  bandId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  userId: string;
  adminIds: string[];
  memberIds?: string[];
  setIds?: string[];
  songIds?: string[];
  members?: User[];
  admins?: User[];
  policy: string;
}

export interface BandMembership {
  bandId: string;
  role: string;
  joinedAt: number;
}

export interface Recording {
  recordingId: string;
  jamId: string;
  userId: string;
  sessionId: string;
  songs: RecordingSongSegment[];
  fileName: string;
  samplingRate: number;
  comment?: string;
  status?: string;
  createDate: number;
  updateDate?: number;
}

export interface RecordingSongSegment {
  songId: string;
  startTime: string;
  pageturns: RecordingPageTurn[];
}

export interface RecordingPageTurn {
  page: number;
  time: string;
  turn: string;
}

// Type guards for runtime type checking
export function isJamSession(obj: any): obj is JamSession {
  return obj && typeof obj.jamSessionId === 'string';
}

export function isSetList(obj: any): obj is SetList {
  return obj && typeof obj.setListId === 'string';
}

export function isSong(obj: any): obj is Song {
  return obj && typeof obj.songId === 'string' && typeof obj.title === 'string';
}

export function isUser(obj: any): obj is User {
  return obj && typeof obj.userId === 'string' && typeof obj.username === 'string';
}

export function isParticipant(obj: any): obj is Participant {
  return obj && typeof obj.userId === 'string' && typeof obj.participantType === 'string';
}