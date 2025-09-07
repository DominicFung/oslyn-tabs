import 'package:json_annotation/json_annotation.dart';

part 'jam_session.g.dart';

@JsonSerializable()
class JamSession {
  final String jamSessionId;
  final String? description;
  final List<User> admins;
  final List<User> members;
  final List<User> guests;
  final String? policy;
  final List<Participant> active;
  final String? passcode;
  final int? startDate;
  final int? endDate;
  final SetList? setList;

  JamSession({
    required this.jamSessionId,
    this.description,
    required this.admins,
    required this.members,
    required this.guests,
    this.policy,
    required this.active,
    this.passcode,
    this.startDate,
    this.endDate,
    this.setList,
  });

  factory JamSession.fromJson(Map<String, dynamic> json) => JamSession(
    jamSessionId: json['jamSessionId'] as String,
    description: json['description'] as String?,
    admins: (json['admins'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    members: (json['members'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    guests: (json['guests'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    policy: json['policy'] as String?,
    active: (json['active'] as List<dynamic>?)?.map((e) => Participant.fromJson(e as Map<String, dynamic>)).toList() ?? [],
    passcode: json['passcode'] as String?,
    startDate: json['startDate'] as int?,
    endDate: json['endDate'] as int?,
    setList: json['setList'] != null ? SetList.fromJson(json['setList'] as Map<String, dynamic>) : null,
  );

  Map<String, dynamic> toJson() => _$JamSessionToJson(this);
}

@JsonSerializable()
class SetList {
  final String setListId;
  final String? description;
  final List<JamSong>? songs;
  final List<User>? editors;

  SetList({
    required this.setListId,
    this.description,
    this.songs,
    this.editors,
  });

  factory SetList.fromJson(Map<String, dynamic> json) => SetList(
    setListId: json['setListId'] as String,
    description: json['description'] as String?,
    songs: (json['songs'] as List<dynamic>?)?.map((e) => JamSong.fromJson(e as Map<String, dynamic>)).toList(),
    editors: (json['editors'] as List<dynamic>?)?.map((e) => User.fromJson(e as Map<String, dynamic>)).toList(),
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
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
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
