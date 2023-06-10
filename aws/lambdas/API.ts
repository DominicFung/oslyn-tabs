/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type User = {
  __typename: "User",
  userId: string,
  username: string,
  firstName?: string | null,
  lastName?: string | null,
  recieveUpdatesFromOslyn?: boolean | null,
  isActivated?: boolean | null,
  createDate?: number | null,
  email: string,
  role: role,
  labelledRecording:  Array<Recording | null >,
  songsCreated:  Array<Song | null >,
  editHistory:  Array<RecordingHistory | null >,
  likedSongs:  Array<JamSong | null >,
};

export enum role {
  USER = "USER",
  ADMIN = "ADMIN",
}


export type Recording = {
  __typename: "Recording",
  recordingId: string,
  songTitle?: string | null,
  formId?: string | null,
  song?: Song | null,
  key?: string | null,
  tabLink?: string | null,
  rawTabs?: string | null,
  prelabelTool?: string | null,
  prelabelToolVersion?: string | null,
  labelTool?: string | null,
  labelToolVersion?: string | null,
  labeller?: User | null,
  isLabelerRejected: boolean,
  labelerRejectionReason?: string | null,
  singerName?: string | null,
  singerEmail?: string | null,
  gender?: gender | null,
  status: recordingStatus,
  editHistory:  Array<RecordingHistory | null >,
  comment?: string | null,
  createDate?: string | null,
  updateDate?: string | null,
  lastOULGenerateDate?: string | null,
};

export type Song = {
  __typename: "Song",
  songId: string,
  title: string,
  artist?: string | null,
  album?: string | null,
  albumCover?: string | null,
  beat?: Beat | null,
  isApproved: boolean,
  version: number,
  creator: User,
  recordings:  Array<Recording | null >,
  chordSheet?: string | null,
  chordSheetKey?: string | null,
  originPlatorm?: chordSheetPlatform | null,
  originLink?: string | null,
};

export type Beat = {
  __typename: "Beat",
  count: number,
  note: number,
};

export enum chordSheetPlatform {
  UG = "UG",
  WORSHIPTOGETHER = "WORSHIPTOGETHER",
  OTHER = "OTHER",
}


export enum gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}


export enum recordingStatus {
  TOLABEL = "TOLABEL",
  INAUDIT = "INAUDIT",
  COMPLETE = "COMPLETE",
}


export type RecordingHistory = {
  __typename: "RecordingHistory",
  recordingHistoryId: string,
  recording: Recording,
  labeller: User,
  date: string,
  actionColumn: string,
  previousAction: string,
  newAction: string,
  comment?: string | null,
};

export type JamSong = {
  __typename: "JamSong",
  song: Song,
  key: string,
};

export type _Beat = {
  count: number,
  note: number,
};

export type Band = {
  __typename: "Band",
  bandId: string,
  songs:  Array<Song | null >,
  members:  Array<User | null >,
  owner: User,
};

export type JamSongInput = {
  songId: string,
  key: string,
};

export type SetList = {
  __typename: "SetList",
  setListId: string,
  description: string,
  songs:  Array<JamSong | null >,
  editors:  Array<User | null >,
  creator: User,
  band?: Band | null,
};

export type JamSession = {
  __typename: "JamSession",
  jamSessionId: string,
  setList: SetList,
  admin: User,
  members:  Array<User | null >,
  currentSong?: JamSong | null,
  currentLine?: number | null,
  startDate?: number | null,
  endDate?: number | null,
};

export type CreateUserMutationVariables = {
  username: string,
  email: string,
  firstName?: string | null,
  lastName?: string | null,
};

export type CreateUserMutation = {
  createUser:  {
    __typename: "User",
    userId: string,
    username: string,
    firstName?: string | null,
    lastName?: string | null,
    recieveUpdatesFromOslyn?: boolean | null,
    isActivated?: boolean | null,
    createDate?: number | null,
    email: string,
    role: role,
    labelledRecording:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    songsCreated:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    editHistory:  Array< {
      __typename: "RecordingHistory",
      recordingHistoryId: string,
      date: string,
      actionColumn: string,
      previousAction: string,
      newAction: string,
      comment?: string | null,
    } | null >,
    likedSongs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
  },
};

export type CreateSongMutationVariables = {
  title: string,
  userId: string,
  artist?: string | null,
  album?: string | null,
  albumCover?: string | null,
  chordSheet: string,
  chordSheetKey: string,
};

export type CreateSongMutation = {
  createSong:  {
    __typename: "Song",
    songId: string,
    title: string,
    artist?: string | null,
    album?: string | null,
    albumCover?: string | null,
    beat?:  {
      __typename: "Beat",
      count: number,
      note: number,
    } | null,
    isApproved: boolean,
    version: number,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    recordings:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    chordSheet?: string | null,
    chordSheetKey?: string | null,
    originPlatorm?: chordSheetPlatform | null,
    originLink?: string | null,
  },
};

export type UpdateSongMutationVariables = {
  songId: string,
  ownerId: string,
  title?: string | null,
  artist?: string | null,
  album?: string | null,
  albumCover?: string | null,
  beat?: _Beat | null,
  approved?: boolean | null,
  chordSheet?: string | null,
  chordSheetKey?: string | null,
  originalPlatorm?: chordSheetPlatform | null,
  originalLink?: string | null,
};

export type UpdateSongMutation = {
  updateSong:  {
    __typename: "Song",
    songId: string,
    title: string,
    artist?: string | null,
    album?: string | null,
    albumCover?: string | null,
    beat?:  {
      __typename: "Beat",
      count: number,
      note: number,
    } | null,
    isApproved: boolean,
    version: number,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    recordings:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    chordSheet?: string | null,
    chordSheetKey?: string | null,
    originPlatorm?: chordSheetPlatform | null,
    originLink?: string | null,
  },
};

export type AddRecordingToSongMutationVariables = {
  songId: string,
  recordingId: string,
};

export type AddRecordingToSongMutation = {
  addRecordingToSong:  {
    __typename: "Song",
    songId: string,
    title: string,
    artist?: string | null,
    album?: string | null,
    albumCover?: string | null,
    beat?:  {
      __typename: "Beat",
      count: number,
      note: number,
    } | null,
    isApproved: boolean,
    version: number,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    recordings:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    chordSheet?: string | null,
    chordSheetKey?: string | null,
    originPlatorm?: chordSheetPlatform | null,
    originLink?: string | null,
  },
};

export type RemoveRecordingFromSongMutationVariables = {
  songId: string,
  recordingId: string,
};

export type RemoveRecordingFromSongMutation = {
  removeRecordingFromSong:  {
    __typename: "Song",
    songId: string,
    title: string,
    artist?: string | null,
    album?: string | null,
    albumCover?: string | null,
    beat?:  {
      __typename: "Beat",
      count: number,
      note: number,
    } | null,
    isApproved: boolean,
    version: number,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    recordings:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    chordSheet?: string | null,
    chordSheetKey?: string | null,
    originPlatorm?: chordSheetPlatform | null,
    originLink?: string | null,
  },
};

export type CreateBandMutationVariables = {
  ownerId: string,
  name?: string | null,
};

export type CreateBandMutation = {
  createBand:  {
    __typename: "Band",
    bandId: string,
    songs:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    owner:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
  },
};

export type AddBandMembersMutationVariables = {
  bandId: string,
  userIds: Array< string | null >,
};

export type AddBandMembersMutation = {
  addBandMembers:  {
    __typename: "Band",
    bandId: string,
    songs:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    owner:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
  },
};

export type RemoveBandMembersMutationVariables = {
  bandId: string,
  userIds: Array< string | null >,
};

export type RemoveBandMembersMutation = {
  removeBandMembers:  {
    __typename: "Band",
    bandId: string,
    songs:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    owner:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
  },
};

export type AddSongsToBandMutationVariables = {
  bandId: string,
  songIds: Array< string | null >,
};

export type AddSongsToBandMutation = {
  addSongsToBand:  {
    __typename: "Band",
    bandId: string,
    songs:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    owner:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
  },
};

export type RemoveSongsFromBandMutationVariables = {
  bandId: string,
  songIds: Array< string | null >,
};

export type RemoveSongsFromBandMutation = {
  removeSongsFromBand:  {
    __typename: "Band",
    bandId: string,
    songs:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    owner:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
  },
};

export type CreateSetMutationVariables = {
  userId: string,
  description: string,
  songs: Array< JamSongInput | null >,
};

export type CreateSetMutation = {
  createSet:  {
    __typename: "SetList",
    setListId: string,
    description: string,
    songs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
    editors:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    band?:  {
      __typename: "Band",
      bandId: string,
    } | null,
  },
};

export type AddEditorToSetMutationVariables = {
  setListId: string,
  userId: string,
};

export type AddEditorToSetMutation = {
  addEditorToSet:  {
    __typename: "SetList",
    setListId: string,
    description: string,
    songs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
    editors:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    band?:  {
      __typename: "Band",
      bandId: string,
    } | null,
  },
};

export type RemoveEditorFromSetMutationVariables = {
  setListId: string,
  userId: string,
};

export type RemoveEditorFromSetMutation = {
  removeEditorFromSet:  {
    __typename: "SetList",
    setListId: string,
    description: string,
    songs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
    editors:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    band?:  {
      __typename: "Band",
      bandId: string,
    } | null,
  },
};

export type AddSongToSetMutationVariables = {
  setListId: string,
  songId: string,
  key?: string | null,
};

export type AddSongToSetMutation = {
  addSongToSet:  {
    __typename: "SetList",
    setListId: string,
    description: string,
    songs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
    editors:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    band?:  {
      __typename: "Band",
      bandId: string,
    } | null,
  },
};

export type RemoveSongFromSetMutationVariables = {
  setListId: string,
  jamSongId: Array< string | null >,
};

export type RemoveSongFromSetMutation = {
  removeSongFromSet:  {
    __typename: "SetList",
    setListId: string,
    description: string,
    songs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
    editors:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    band?:  {
      __typename: "Band",
      bandId: string,
    } | null,
  },
};

export type StartJamSessionMutationVariables = {
  setListId: string,
};

export type StartJamSessionMutation = {
  startJamSession:  {
    __typename: "JamSession",
    jamSessionId: string,
    setList:  {
      __typename: "SetList",
      setListId: string,
      description: string,
    },
    admin:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    currentSong?:  {
      __typename: "JamSong",
      key: string,
    } | null,
    currentLine?: number | null,
    startDate?: number | null,
    endDate?: number | null,
  },
};

export type EndJamSessionMutationVariables = {
  jamSessionId: string,
};

export type EndJamSessionMutation = {
  endJamSession:  {
    __typename: "JamSession",
    jamSessionId: string,
    setList:  {
      __typename: "SetList",
      setListId: string,
      description: string,
    },
    admin:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    currentSong?:  {
      __typename: "JamSong",
      key: string,
    } | null,
    currentLine?: number | null,
    startDate?: number | null,
    endDate?: number | null,
  },
};

export type NextLineMutationVariables = {
  hash: string,
};

export type NextLineMutation = {
  nextLine?:  {
    __typename: "JamSession",
    jamSessionId: string,
    setList:  {
      __typename: "SetList",
      setListId: string,
      description: string,
    },
    admin:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    currentSong?:  {
      __typename: "JamSong",
      key: string,
    } | null,
    currentLine?: number | null,
    startDate?: number | null,
    endDate?: number | null,
  } | null,
};

export type GetSongQueryVariables = {
  songId: string,
};

export type GetSongQuery = {
  getSong:  {
    __typename: "Song",
    songId: string,
    title: string,
    artist?: string | null,
    album?: string | null,
    albumCover?: string | null,
    beat?:  {
      __typename: "Beat",
      count: number,
      note: number,
    } | null,
    isApproved: boolean,
    version: number,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    recordings:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    chordSheet?: string | null,
    chordSheetKey?: string | null,
    originPlatorm?: chordSheetPlatform | null,
    originLink?: string | null,
  },
};

export type ListSongsQueryVariables = {
  userId: string,
  limit?: number | null,
  filter?: string | null,
  nextToken?: string | null,
};

export type ListSongsQuery = {
  listSongs:  Array< {
    __typename: "Song",
    songId: string,
    title: string,
    artist?: string | null,
    album?: string | null,
    albumCover?: string | null,
    beat?:  {
      __typename: "Beat",
      count: number,
      note: number,
    } | null,
    isApproved: boolean,
    version: number,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    recordings:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    chordSheet?: string | null,
    chordSheetKey?: string | null,
    originPlatorm?: chordSheetPlatform | null,
    originLink?: string | null,
  } | null >,
};

export type GetUserByIdQueryVariables = {
  userId: string,
};

export type GetUserByIdQuery = {
  getUserById:  {
    __typename: "User",
    userId: string,
    username: string,
    firstName?: string | null,
    lastName?: string | null,
    recieveUpdatesFromOslyn?: boolean | null,
    isActivated?: boolean | null,
    createDate?: number | null,
    email: string,
    role: role,
    labelledRecording:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    songsCreated:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    editHistory:  Array< {
      __typename: "RecordingHistory",
      recordingHistoryId: string,
      date: string,
      actionColumn: string,
      previousAction: string,
      newAction: string,
      comment?: string | null,
    } | null >,
    likedSongs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
  },
};

export type GetUserByEmailQueryVariables = {
  email?: string | null,
};

export type GetUserByEmailQuery = {
  getUserByEmail:  {
    __typename: "User",
    userId: string,
    username: string,
    firstName?: string | null,
    lastName?: string | null,
    recieveUpdatesFromOslyn?: boolean | null,
    isActivated?: boolean | null,
    createDate?: number | null,
    email: string,
    role: role,
    labelledRecording:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    songsCreated:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    editHistory:  Array< {
      __typename: "RecordingHistory",
      recordingHistoryId: string,
      date: string,
      actionColumn: string,
      previousAction: string,
      newAction: string,
      comment?: string | null,
    } | null >,
    likedSongs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
  },
};

export type ListUsersQueryVariables = {
  limit?: number | null,
  filter?: string | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers:  Array< {
    __typename: "User",
    userId: string,
    username: string,
    firstName?: string | null,
    lastName?: string | null,
    recieveUpdatesFromOslyn?: boolean | null,
    isActivated?: boolean | null,
    createDate?: number | null,
    email: string,
    role: role,
    labelledRecording:  Array< {
      __typename: "Recording",
      recordingId: string,
      songTitle?: string | null,
      formId?: string | null,
      key?: string | null,
      tabLink?: string | null,
      rawTabs?: string | null,
      prelabelTool?: string | null,
      prelabelToolVersion?: string | null,
      labelTool?: string | null,
      labelToolVersion?: string | null,
      isLabelerRejected: boolean,
      labelerRejectionReason?: string | null,
      singerName?: string | null,
      singerEmail?: string | null,
      gender?: gender | null,
      status: recordingStatus,
      comment?: string | null,
      createDate?: string | null,
      updateDate?: string | null,
      lastOULGenerateDate?: string | null,
    } | null >,
    songsCreated:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    editHistory:  Array< {
      __typename: "RecordingHistory",
      recordingHistoryId: string,
      date: string,
      actionColumn: string,
      previousAction: string,
      newAction: string,
      comment?: string | null,
    } | null >,
    likedSongs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
  } | null >,
};

export type GetBandQueryVariables = {
  bandId: string,
  userId: string,
};

export type GetBandQuery = {
  getBand:  {
    __typename: "Band",
    bandId: string,
    songs:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    owner:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
  },
};

export type ListBandsQueryVariables = {
  limit?: number | null,
  filter?: string | null,
  nextToken?: string | null,
};

export type ListBandsQuery = {
  listBands:  Array< {
    __typename: "Band",
    bandId: string,
    songs:  Array< {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    } | null >,
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    owner:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
  } | null >,
};

export type GetSetQueryVariables = {
  setListId: string,
  userId: string,
};

export type GetSetQuery = {
  getSet:  {
    __typename: "SetList",
    setListId: string,
    description: string,
    songs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
    editors:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    band?:  {
      __typename: "Band",
      bandId: string,
    } | null,
  },
};

export type ListSetsQueryVariables = {
  userId: string,
  limit?: number | null,
  filter?: string | null,
  nextToken?: string | null,
};

export type ListSetsQuery = {
  listSets:  Array< {
    __typename: "SetList",
    setListId: string,
    description: string,
    songs:  Array< {
      __typename: "JamSong",
      key: string,
    } | null >,
    editors:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    creator:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    band?:  {
      __typename: "Band",
      bandId: string,
    } | null,
  } | null >,
};

export type GetJamSongQueryVariables = {
  jamSongId: string,
  userId: string,
};

export type GetJamSongQuery = {
  getJamSong:  {
    __typename: "JamSong",
    song:  {
      __typename: "Song",
      songId: string,
      title: string,
      artist?: string | null,
      album?: string | null,
      albumCover?: string | null,
      isApproved: boolean,
      version: number,
      chordSheet?: string | null,
      chordSheetKey?: string | null,
      originPlatorm?: chordSheetPlatform | null,
      originLink?: string | null,
    },
    key: string,
  },
};

export type GetJamSessionQueryVariables = {
  jamSessionId: string,
  userId: string,
};

export type GetJamSessionQuery = {
  getJamSession:  {
    __typename: "JamSession",
    jamSessionId: string,
    setList:  {
      __typename: "SetList",
      setListId: string,
      description: string,
    },
    admin:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    currentSong?:  {
      __typename: "JamSong",
      key: string,
    } | null,
    currentLine?: number | null,
    startDate?: number | null,
    endDate?: number | null,
  },
};

export type ListJamSessionsQueryVariables = {
  bandId: string,
  limit?: number | null,
  filter?: string | null,
  nextToken?: string | null,
};

export type ListJamSessionsQuery = {
  listJamSessions:  Array< {
    __typename: "JamSession",
    jamSessionId: string,
    setList:  {
      __typename: "SetList",
      setListId: string,
      description: string,
    },
    admin:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    currentSong?:  {
      __typename: "JamSong",
      key: string,
    } | null,
    currentLine?: number | null,
    startDate?: number | null,
    endDate?: number | null,
  } | null >,
};

export type OnNextLineSubscriptionVariables = {
  hash: string,
};

export type OnNextLineSubscription = {
  onNextLine?:  {
    __typename: "JamSession",
    jamSessionId: string,
    setList:  {
      __typename: "SetList",
      setListId: string,
      description: string,
    },
    admin:  {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    },
    members:  Array< {
      __typename: "User",
      userId: string,
      username: string,
      firstName?: string | null,
      lastName?: string | null,
      recieveUpdatesFromOslyn?: boolean | null,
      isActivated?: boolean | null,
      createDate?: number | null,
      email: string,
      role: role,
    } | null >,
    currentSong?:  {
      __typename: "JamSong",
      key: string,
    } | null,
    currentLine?: number | null,
    startDate?: number | null,
    endDate?: number | null,
  } | null,
};
