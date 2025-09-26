import 'package:json_annotation/json_annotation.dart';

part 'jam_session.g.dart';

@JsonSerializable()
class PageSettings {
  final int? pageMax;
  final int? pageMin;

  PageSettings({
    this.pageMax,
    this.pageMin,
  });

  factory PageSettings.fromJson(Map<String, dynamic> json) => _$PageSettingsFromJson(json);
  Map<String, dynamic> toJson() => _$PageSettingsToJson(this);
}

@JsonSerializable()
class JamSession {
  final String jamSessionId;
  final String? pin;
  final String? description;
  final List<int>? queue;
  final int? revision;
  final int? currentSong;
  final int? currentPage;
  final List<User> admins;
  final List<User> members;
  final List<User> guests;
  final String? policy;
  final List<Participant> active;
  final String? passcode;
  final int? startDate;
  final int? endDate;
  final String? bandId;
  final String? userId; // Creator/owner of the jam session
  final SetList? setList;
  final PageSettings? pageSettings;
  final List<SongSlideConfig>? slideConfigOverrides;
  final String? slideTextSize;

  JamSession({
    required this.jamSessionId,
    this.pin,
    this.description,
    this.queue,
    this.revision,
    this.currentSong,
    this.currentPage,
    required this.admins,
    required this.members,
    required this.guests,
    this.policy,
    required this.active,
    this.passcode,
    this.startDate,
    this.endDate,
    this.bandId,
    this.userId,
    this.setList,
    this.pageSettings,
    this.slideConfigOverrides,
    this.slideTextSize,
  });

  factory JamSession.fromJson(Map<String, dynamic> json) => JamSession(
    jamSessionId: json['jamSessionId'] as String,
    pin: json['pin'] as String?,
    description: json['description'] as String?,
    queue: (json['queue'] as List<dynamic>?)?.map((e) => e as int).toList(),
    revision: json['revision'] as int?,
    currentSong: json['currentSong'] as int?,
    currentPage: json['currentPage'] as int?,
    admins: (json['admins'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    members: (json['members'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    guests: (json['guests'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    policy: json['policy'] as String?,
    active: (json['active'] as List<dynamic>?)?.map((e) => Participant.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    passcode: json['passcode'] as String?,
    startDate: json['startDate'] as int?,
    endDate: json['endDate'] as int?,
    bandId: json['bandId'] as String?,
    userId: json['userId'] as String?,
    setList: json['setList'] != null ? SetList.fromJson(json['setList'] as Map<String, dynamic>) : null,
    pageSettings: json['pageSettings'] != null ? PageSettings.fromJson(json['pageSettings'] as Map<String, dynamic>) : null,
    slideConfigOverrides: (json['slideConfigOverrides'] as List<dynamic>?)?.map((e) => SongSlideConfig.fromJson(e as Map<String, dynamic>)).toList(),
    slideTextSize: json['slideTextSize'] as String?,
  );

  Map<String, dynamic> toJson() => _$JamSessionToJson(this);
}

@JsonSerializable()
class SetList {
  final String setListId;
  final String? description;
  final String? bandId;
  final List<JamSong>? songs;
  final List<User>? editors;
  final List<Song>? songCache;
  final List<String>? songIds;

  // Add getter for backward compatibility
  List<JamSong>? get songsList => songs;

  SetList({
    required this.setListId,
    this.description,
    this.bandId,
    this.songs,
    this.editors,
    this.songCache,
    this.songIds,
  });

  factory SetList.fromJson(Map<String, dynamic> json) => SetList(
    setListId: json['setListId'] as String,
    description: json['description'] as String?,
    bandId: json['bandId'] as String?,
    songs: (json['songs'] as List<dynamic>?)?.map((e) => JamSong.fromJson(e as Map<String, dynamic>)).toList(),
    editors: (json['editors'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList(),
    songCache: (json['songCache'] as List<dynamic>?)?.map((e) => Song.fromJson(e as Map<String, dynamic>)).toList(),
    songIds: (json['songIds'] as List<dynamic>?)?.map((e) => e as String).toList(),
  );

  Map<String, dynamic> toJson() => _$SetListToJson(this);
}

@JsonSerializable()
class JamSong {
  final String key;
  final Song song;
  final SongSlideConfig? defaultSlideConfig;
  final int? order;

  JamSong({
    required this.key,
    required this.song,
    this.defaultSlideConfig,
    this.order,
  });

  factory JamSong.fromJson(Map<String, dynamic> json) =>
      _$JamSongFromJson(json);

  Map<String, dynamic> toJson() => _$JamSongToJson(this);
}

@JsonSerializable()
class Song {
  final String songId;
  final String title;
  final String artist;
  final String? album;
  final String? albumCover;
  final bool isApproved;
  final int version;
  final String chordSheet;
  final String chordSheetKey;
  final String? originPlatorm;
  final String? originLink;
  final String? CCLISongTitle;
  final String? CCLISongWriter;
  final String? CCLICopyrightNotice;
  final String? CCLILicenseNumber;
  final List<String>? bandIds;
  final String? primaryBandId;

  Song({
    required this.songId,
    required this.title,
    required this.artist,
    this.album,
    this.albumCover,
    required this.isApproved,
    required this.version,
    required this.chordSheet,
    required this.chordSheetKey,
    this.originPlatorm,
    this.originLink,
    this.CCLISongTitle,
    this.CCLISongWriter,
    this.CCLICopyrightNotice,
    this.CCLILicenseNumber,
    this.bandIds,
    this.primaryBandId,
  });

  factory Song.fromJson(Map<String, dynamic> json) =>
      _$SongFromJson(json);

  Map<String, dynamic> toJson() => _$SongToJson(this);
}

@JsonSerializable()
class SongSlideConfig {
  final String songId;
  final String? backgroundImg;
  final String? backgroundColor;
  final String? textColor;
  final String? highlightColor;
  final double? highlightOpacity;

  SongSlideConfig({
    required this.songId,
    this.backgroundImg,
    this.backgroundColor,
    this.textColor,
    this.highlightColor,
    this.highlightOpacity,
  });

  factory SongSlideConfig.fromJson(Map<String, dynamic> json) =>
      _$SongSlideConfigFromJson(json);

  Map<String, dynamic> toJson() => _$SongSlideConfigToJson(this);
}

@JsonSerializable()
class BandMembership {
  final String bandId;
  final String role;
  final String joinedAt;

  BandMembership({
    required this.bandId,
    required this.role,
    required this.joinedAt,
  });

  factory BandMembership.fromJson(Map<String, dynamic> json) => _$BandMembershipFromJson(json);
  Map<String, dynamic> toJson() => _$BandMembershipToJson(this);
}

@JsonSerializable()
class User {
  final String? userId;
  final String? username;
  final String? email;
  final List<String>? providers;
  final String? firstName;
  final String? lastName;
  final String? imageUrl;
  final bool? recieveUpdatesFromOslyn;
  final bool? isActivated;
  final int? createDate;
  final String? role;
  final List<BandMembership>? bandMemberships;

  User({
    this.userId,
    this.username,
    this.email,
    this.providers,
    this.firstName,
    this.lastName,
    this.imageUrl,
    this.recieveUpdatesFromOslyn,
    this.isActivated,
    this.createDate,
    this.role,
    this.bandMemberships,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class Band {
  final String bandId;
  final String name;
  final String? description;
  final bool? isPublic;
  final List<User>? members;
  final List<User>? admins;
  final String? userRole;
  final User? owner;

  Band({
    required this.bandId,
    required this.name,
    this.description,
    this.isPublic,
    this.members,
    this.admins,
    this.userRole,
    this.owner,
  });

  factory Band.fromJson(Map<String, dynamic> json) => _$BandFromJson(json);
  Map<String, dynamic> toJson() => _$BandToJson(this);
}

class Participant {
  final String? userId;
  final String? participantType;
  final int? joinTime;
  final int? lastPing;
  final String? username;
  final String? colour;
  final String? ip;
  final User? user;

  Participant({
    this.userId,
    this.participantType,
    this.joinTime,
    this.lastPing,
    this.username,
    this.colour,
    this.ip,
    this.user,
  });

  factory Participant.fromJson(Map<String, dynamic> json) => Participant(
    userId: json['userId'] as String?,
    participantType: json['participantType'] as String?,
    joinTime: json['joinTime'] as int?,
    lastPing: json['lastPing'] as int?,
    username: json['username'] as String?,
    colour: json['colour'] as String?,
    ip: json['ip'] as String?,
    user: json['user'] != null ? User.fromJson(json['user'] as Map<String, dynamic>) : null,
  );

  Map<String, dynamic> toJson() => {
    'userId': userId,
    'participantType': participantType,
    'joinTime': joinTime,
    'lastPing': lastPing,
    'username': username,
    'colour': colour,
    'ip': ip,
    'user': user?.toJson(),
  };
}

