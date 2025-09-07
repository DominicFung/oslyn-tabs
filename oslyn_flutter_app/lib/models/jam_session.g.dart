// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'jam_session.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

JamSession _$JamSessionFromJson(Map<String, dynamic> json) => JamSession(
      jamSessionId: json['jamSessionId'] as String,
      description: json['description'] as String?,
      admins: (json['admins'] as List<dynamic>)
          .map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
      members: (json['members'] as List<dynamic>)
          .map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
      guests: (json['guests'] as List<dynamic>)
          .map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
      policy: json['policy'] as String?,
      active: (json['active'] as List<dynamic>)
          .map((e) => Participant.fromJson(e as Map<String, dynamic>))
          .toList(),
      passcode: json['passcode'] as String?,
      startDate: json['startDate'] as int?,
      endDate: json['endDate'] as int?,
      setList: json['setList'] == null
          ? null
          : SetList.fromJson(json['setList'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$JamSessionToJson(JamSession instance) =>
    <String, dynamic>{
      'jamSessionId': instance.jamSessionId,
      'description': instance.description,
      'admins': instance.admins,
      'members': instance.members,
      'guests': instance.guests,
      'policy': instance.policy,
      'active': instance.active,
      'passcode': instance.passcode,
      'startDate': instance.startDate,
      'endDate': instance.endDate,
      'setList': instance.setList,
    };

SetList _$SetListFromJson(Map<String, dynamic> json) => SetList(
      setListId: json['setListId'] as String,
      description: json['description'] as String?,
      songs: (json['songs'] as List<dynamic>?)
          ?.map((e) => JamSong.fromJson(e as Map<String, dynamic>))
          .toList(),
      editors: (json['editors'] as List<dynamic>?)
          ?.map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SetListToJson(SetList instance) => <String, dynamic>{
      'setListId': instance.setListId,
      'description': instance.description,
      'songs': instance.songs,
      'editors': instance.editors,
    };

JamSong _$JamSongFromJson(Map<String, dynamic> json) => JamSong(
      key: json['key'] as String,
      song: Song.fromJson(json['song'] as Map<String, dynamic>),
      defaultSlideConfig: json['defaultSlideConfig'] == null
          ? null
          : SongSlideConfig.fromJson(
              json['defaultSlideConfig'] as Map<String, dynamic>),
      order: json['order'] as int?,
    );

Map<String, dynamic> _$JamSongToJson(JamSong instance) => <String, dynamic>{
      'key': instance.key,
      'song': instance.song,
      'defaultSlideConfig': instance.defaultSlideConfig,
      'order': instance.order,
    };

Song _$SongFromJson(Map<String, dynamic> json) => Song(
      songId: json['songId'] as String,
      title: json['title'] as String,
      artist: json['artist'] as String,
      album: json['album'] as String?,
      albumCover: json['albumCover'] as String?,
      isApproved: json['isApproved'] as bool,
      version: json['version'] as int,
      chordSheet: json['chordSheet'] as String,
      chordSheetKey: json['chordSheetKey'] as String,
      originPlatorm: json['originPlatorm'] as String?,
      originLink: json['originLink'] as String?,
      CCLISongTitle: json['CCLISongTitle'] as String?,
      CCLISongWriter: json['CCLISongWriter'] as String?,
      CCLICopyrightNotice: json['CCLICopyrightNotice'] as String?,
      CCLILicenseNumber: json['CCLILicenseNumber'] as String?,
    );

Map<String, dynamic> _$SongToJson(Song instance) => <String, dynamic>{
      'songId': instance.songId,
      'title': instance.title,
      'artist': instance.artist,
      'album': instance.album,
      'albumCover': instance.albumCover,
      'isApproved': instance.isApproved,
      'version': instance.version,
      'chordSheet': instance.chordSheet,
      'chordSheetKey': instance.chordSheetKey,
      'originPlatorm': instance.originPlatorm,
      'originLink': instance.originLink,
      'CCLISongTitle': instance.CCLISongTitle,
      'CCLISongWriter': instance.CCLISongWriter,
      'CCLICopyrightNotice': instance.CCLICopyrightNotice,
      'CCLILicenseNumber': instance.CCLILicenseNumber,
    };

SongSlideConfig _$SongSlideConfigFromJson(Map<String, dynamic> json) =>
    SongSlideConfig(
      songId: json['songId'] as String,
      backgroundImg: json['backgroundImg'] as String?,
      backgroundColor: json['backgroundColor'] as String?,
      textColor: json['textColor'] as String?,
      highlightColor: json['highlightColor'] as String?,
      highlightOpacity: (json['highlightOpacity'] as num?)?.toDouble(),
    );

Map<String, dynamic> _$SongSlideConfigToJson(SongSlideConfig instance) =>
    <String, dynamic>{
      'songId': instance.songId,
      'backgroundImg': instance.backgroundImg,
      'backgroundColor': instance.backgroundColor,
      'textColor': instance.textColor,
      'highlightColor': instance.highlightColor,
      'highlightOpacity': instance.highlightOpacity,
    };

User _$UserFromJson(Map<String, dynamic> json) => User(
      userId: json['userId'] as String?,
      username: json['username'] as String?,
      email: json['email'] as String?,
      providers: (json['providers'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      imageUrl: json['imageUrl'] as String?,
      recieveUpdatesFromOslyn: json['recieveUpdatesFromOslyn'] as bool?,
      isActivated: json['isActivated'] as bool?,
      createDate: json['createDate'] as int?,
      role: json['role'] as String?,
    );

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
      'userId': instance.userId,
      'username': instance.username,
      'email': instance.email,
      'providers': instance.providers,
      'firstName': instance.firstName,
      'lastName': instance.lastName,
      'imageUrl': instance.imageUrl,
      'recieveUpdatesFromOslyn': instance.recieveUpdatesFromOslyn,
      'isActivated': instance.isActivated,
      'createDate': instance.createDate,
      'role': instance.role,
    };
