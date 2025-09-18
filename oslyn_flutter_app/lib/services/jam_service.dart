import 'dart:convert';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_api/amplify_api.dart';
import '../graphql/queries.dart';
import '../graphql/mutations.dart';
import '../models/jam_session.dart';

class JamService {
  /// Get list of public jam sessions - simplified version
  Future<List<JamSession>> getPublicJamSessions({
    int? limit,
    Map<String, dynamic>? filter,
    String? nextToken,
  }) async {
    try {
      print('Making GraphQL call using Amplify...');
      print('Query: ${GraphQLQueries.listPublicJamSessions}');
      print('Variables: limit=$limit, filter=$filter, nextToken=$nextToken');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listPublicJamSessions,
        variables: {
          'limit': limit,
          'filter': filter,
          'nextToken': nextToken,
        },
      );

      final response = await Amplify.API.query(request: request).response;

      print('Response data: ${response.data}');
      print('Response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('Parsed response data: $data');
        
        // AWS AppSync returns data directly, not nested under 'data' field
        if (data['listPublicJamSessions'] != null) {
          final sessions = data['listPublicJamSessions'] as List;
          print('Found ${sessions.length} jam sessions');
          if (sessions.isNotEmpty) {
            print('First session: ${sessions.first}');
          }
          
          final jamSessions = sessions.map((e) => JamSession.fromJson(e as Map<String, dynamic>)).toList();
          
          // Log sorting information
          print('📊 Jam Sessions Sorting Info:');
          print('   - Total sessions: ${jamSessions.length}');
          if (jamSessions.isNotEmpty) {
            print('=== CLIENT-SIDE SESSION ORDER (BEFORE SORT) ===');
            for (int i = 0; i < jamSessions.length; i++) {
              final session = jamSessions[i];
              final startDate = session.startDate;
              final dateStr = startDate != null ? DateTime.fromMillisecondsSinceEpoch(startDate).toIso8601String() : 'null';
              print('   ${i}: ${session.jamSessionId} - startDate: $startDate ($dateStr)');
            }
            
            // Client-side sorting as fallback (most recent first)
            jamSessions.sort((a, b) {
              final aDate = a.startDate ?? 0;
              final bDate = b.startDate ?? 0;
              return bDate.compareTo(aDate); // Descending order (newest first)
            });
            
            print('=== CLIENT-SIDE SESSION ORDER (AFTER SORT) ===');
            for (int i = 0; i < jamSessions.length; i++) {
              final session = jamSessions[i];
              final startDate = session.startDate;
              final dateStr = startDate != null ? DateTime.fromMillisecondsSinceEpoch(startDate).toIso8601String() : 'null';
              print('   ${i}: ${session.jamSessionId} - startDate: $startDate ($dateStr)');
            }
            
            // Log detailed session data
            print('\n=== DETAILED SESSION DATA (CLIENT) ===');
            for (int i = 0; i < jamSessions.length; i++) {
              final session = jamSessions[i];
              print('\n--- Session ${i + 1}: ${session.jamSessionId} ---');
              print('  - Description: ${session.description ?? 'N/A'}');
              print('  - Policy: ${session.policy ?? 'N/A'}');
              print('  - Start Date: ${session.startDate ?? 'N/A'} ${session.startDate != null ? '(${DateTime.fromMillisecondsSinceEpoch(session.startDate!).toIso8601String()})' : ''}');
              print('  - End Date: ${session.endDate ?? 'N/A'} ${session.endDate != null ? '(${DateTime.fromMillisecondsSinceEpoch(session.endDate!).toIso8601String()})' : ''}');
              print('  - Admins Count: ${session.admins.length}');
              print('  - Members Count: ${session.members.length}');
              print('  - Guests Count: ${session.guests.length}');
              print('  - Active Count: ${session.active.length}');
              print('  - SetList: ${session.setList != null ? 'Present' : 'N/A'}');
              
              if (session.setList != null) {
                final setList = session.setList!;
                print('    - SetList ID: ${setList.setListId}');
                print('    - SetList Description: ${setList.description ?? 'N/A'}');
                print('    - Songs Count: ${setList.songs?.length ?? 0}');
                
                if (setList.songs != null && setList.songs!.isNotEmpty) {
                  print('    - First 3 Songs:');
                  for (int j = 0; j < (setList.songs!.length > 3 ? 3 : setList.songs!.length); j++) {
                    final jamSong = setList.songs![j];
                    print('      ${j + 1}. ${jamSong.song.title} by ${jamSong.song.artist} (Key: ${jamSong.key})');
                  }
                  if (setList.songs!.length > 3) {
                    print('      ... and ${setList.songs!.length - 3} more songs');
                  }
                }
              }
            }
            
            final firstSession = jamSessions.first;
            final lastSession = jamSessions.last;
            print('   - Most recent: ${firstSession.jamSessionId} (startDate: ${firstSession.startDate})');
            if (jamSessions.length > 1) {
              print('   - Oldest: ${lastSession.jamSessionId} (startDate: ${lastSession.startDate})');
            }
            print('   - Sorted by creation date (most recent first)');
          }
          
          return jamSessions;
        } else {
          print('No listPublicJamSessions field in response');
        }
      } else {
        print('Response data is null');
      }
      return [];
    } on ApiException catch (e) {
      print('Error fetching public jam sessions: $e');
      throw Exception('Error fetching public jam sessions: ${e.message}');
    } catch (e) {
      print('Error fetching public jam sessions: $e');
      throw Exception('Error fetching public jam sessions: $e');
    }
  }

  /// Get a specific jam session by PIN
  Future<JamSession?> getJamSessionByPin(String pin) async {
    try {
      print('🔍 Looking up jam session by PIN: $pin');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.getJamSessionByPin,
        variables: {
          'pin': pin,
        },
      );

      print('📤 Sending GraphQL request for PIN lookup...');
      final response = await Amplify.API.query(request: request).response;

      print('📥 PIN lookup response received from AWS AppSync');
      print('📊 Response data: ${response.data}');
      print('❌ Response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        final session = data['getJamSessionByPin'];

        if (session != null) {
          print('✅ Found jam session for PIN: ${session['jamSessionId']}');
          return JamSession.fromJson(session);
        } else {
          print('❌ No jam session found for PIN: $pin');
          return null;
        }
      } else {
        print('❌ No response data for PIN lookup');
        return null;
      }
    } catch (e) {
      print('❌ Error looking up jam session by PIN: $e');
      return null;
    }
  }

  /// Get a specific jam session
  Future<JamSession?> getJamSession(String jamSessionId, {String? userId}) async {
    try {
      print('🔍 Making GraphQL call to AWS AppSync...');
      print('🎯 Jam Session ID: $jamSessionId');
      print('👤 User ID: $userId');

      // Debug: Print the GraphQL query
      GraphQLQueries.debugPrintQueries();

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.getJamSession,
        variables: {
          'jamSessionId': jamSessionId,
          'userId': userId,
        },
      );

      print('📤 Sending GraphQL request...');
      final response = await Amplify.API.query(request: request).response;

      print('📥 Jam session response received from AWS AppSync');
      print('📊 DynamoDB Operations Completed:');
      print('   - Jam Session Query: GetItemCommand on JAM_TABLE_NAME');
      print('   - Set List Query: GetItemCommand on SETLIST_TABLE_NAME (if requested)');
      print('   - Songs Query: BatchGetItemCommand on SONG_TABLE_NAME (if setList/songs requested)');
      print('📊 Response data: ${response.data}');
      print('❌ Response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🔍 Parsed response data keys: ${data.keys.toList()}');
        
        final session = data['getJamSession'];
        print('🎯 getJamSession result from DynamoDB: $session');

        if (session != null) {
          // Add detailed logging for debugging
          print('📊 DynamoDB Data Structure Analysis:');
          print('   - Jam Session Fields: ${session.keys.toList()}');
          print('   - Data Types: ${session.map((k, v) => MapEntry(k, v.runtimeType.toString()))}');
          print('👥 Session admins: ${session['admins']}');
          print('👥 Session members: ${session['members']}');
          print('👥 Session guests: ${session['guests']}');
          print('👥 Session active: ${session['active']}');
          print('🎵 Session setList: ${session['setList']}');
          
          // Log DynamoDB table relationships
          if (session['setList'] != null) {
            print('📊 DynamoDB Table Relationships:');
            print('   - JAM_TABLE → SETLIST_TABLE: jamSession.setListId → setList.setListId');
            print('   - SETLIST_TABLE → SONG_TABLE: setList.songs[].songId → song.songId');
            print('   - Query Pattern: GetItem → GetItem → BatchGetItem');
          }

          try {
            final jamSession = JamSession.fromJson(session);
            print('✅ Successfully parsed JamSession object');
            return jamSession;
          } catch (parseError) {
            print('❌ Error parsing JamSession: $parseError');
            print('📋 Session data that failed to parse: $session');
            return null;
          }
        } else {
          print('⚠️ getJamSession returned null - session not found');
        }
      } else {
        print('❌ Response data is null');
      }
      return null;
    } on ApiException catch (e) {
      print('❌ AWS AppSync API Exception: $e');
      print('📋 Error details: ${e.message}');
      print('🔍 Error type: ${e.runtimeType}');
      throw Exception('Error getting jam session: ${e.message}');
    } catch (e) {
      print('❌ Unexpected error getting jam session: $e');
      print('🔍 Error type: ${e.runtimeType}');
      throw Exception('Error getting jam session: $e');
    }
  }

  /// Get songs for a user (includes chordSheet data)
  Future<List<Song>> getSongs(String userId, {int? limit, String? filter}) async {
    try {
      print('Fetching songs for user: $userId using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listSongs,
        variables: {
          'userId': userId,
          'limit': limit,
          'filter': filter,
        },
      );

      final response = await Amplify.API.query(request: request).response;

      print('Songs response data: ${response.data}');
      print('Songs response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('Songs response data: $data');

        if (data['listSongs'] != null) {
          final songs = data['listSongs'] as List;
          return songs.map((e) => Song.fromJson(e as Map<String, dynamic>)).toList();
        }
      }
      return [];
    } on ApiException catch (e) {
      print('Error fetching songs: $e');
      throw Exception('Error fetching songs: ${e.message}');
    } catch (e) {
      print('Error fetching songs: $e');
      throw Exception('Error fetching songs: $e');
    }
  }

  /// Change the current song in a jam session (synchronized across all users)
  Future<Map<String, dynamic>?> nextSong(String jamSessionId, int songIndex, {int? page}) async {
    try {
      print('🎵 Changing song to index: $songIndex in jam session: $jamSessionId');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.nextSong,
        variables: {
          'jamSessionId': jamSessionId,
          'song': songIndex,
          'page': page ?? 0,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;

      print('🎵 NextSong response data: ${response.data}');
      print('🎵 NextSong response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🎵 NextSong parsed response: $data');
        return data['nextSong'];
      }
      return null;
    } on ApiException catch (e) {
      print('❌ Error changing song: $e');
      throw Exception('Error changing song: ${e.message}');
    } catch (e) {
      print('❌ Error changing song: $e');
      throw Exception('Error changing song: $e');
    }
  }

  /// Change the key of the current song in a jam session (synchronized across all users)
  Future<Map<String, dynamic>?> setSongKey(String jamSessionId, String key, {int? song}) async {
    try {
      print('🎵 Setting song key to: $key in jam session: $jamSessionId');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.setSongKey,
        variables: {
          'jamSessionId': jamSessionId,
          'key': key,
          'song': song,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;

      print('🎵 SetSongKey response data: ${response.data}');
      print('🎵 SetSongKey response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🎵 SetSongKey parsed response: $data');
        return data['setSongKey'];
      }
      return null;
    } on ApiException catch (e) {
      print('❌ Error setting song key: $e');
      throw Exception('Error setting song key: ${e.message}');
    } catch (e) {
      print('❌ Error setting song key: $e');
      throw Exception('Error setting song key: $e');
    }
  }

  /// Change the current page in a jam session (synchronized across all users)
  Future<Map<String, dynamic>?> nextPage(String jamSessionId, int page) async {
    try {
      print('📄 Changing page to: $page in jam session: $jamSessionId');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.nextPage,
        variables: {
          'jamSessionId': jamSessionId,
          'page': page,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;

      print('📄 NextPage response data: ${response.data}');
      print('📄 NextPage response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('📄 NextPage parsed response: $data');
        return data['nextPage'];
      }
      return null;
    } on ApiException catch (e) {
      print('❌ Error changing page: $e');
      throw Exception('Error changing page: ${e.message}');
    } catch (e) {
      print('❌ Error changing page: $e');
      throw Exception('Error changing page: $e');
    }
  }

  /// Add a song to the end of the jam queue
  Future<List<int>?> addSongToJamQueue(String jamSessionId, int songIndex) async {
    try {
      final request = GraphQLRequest<String>(
        document: GraphQLQueries.addSongToJamQueue,
        variables: {
          'jamSessionId': jamSessionId,
          'song': songIndex,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;
      if (response.data != null) {
        final data = jsonDecode(response.data!);
        final q = (data['addSongToJamQueue']?['queue'] as List?)?.map((e) => e as int).toList();
        return q;
      }
      return null;
    } catch (e) {
      print('❌ Error addSongToJamQueue: $e');
      return null;
    }
  }

  /// Remove a song from the jam queue by index
  Future<List<int>?> removeSongFromJamQueue(String jamSessionId, int queueIndex) async {
    try {
      final request = GraphQLRequest<String>(
        document: GraphQLQueries.removeSongFromJamQueue,
        variables: {
          'jamSessionId': jamSessionId,
          'queueIndex': queueIndex,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;
      if (response.data != null) {
        final data = jsonDecode(response.data!);
        final q = (data['removeSongFromJamQueue']?['queue'] as List?)?.map((e) => e as int).toList();
        return q;
      }
      return null;
    } catch (e) {
      print('❌ Error removeSongFromJamQueue: $e');
      return null;
    }
  }

  /// Replace jam queue with optimistic concurrency
  Future<(List<int>?, int?, int?)> setJamQueue(String jamSessionId, List<int> queue, {int? expectedRevision, int? currentSongIndex}) async {
    try {
      print('🔄 setJamQueue called with:');
      print('  - jamSessionId: $jamSessionId');
      print('  - queue: $queue');
      print('  - expectedRevision: $expectedRevision');
      print('  - currentSongIndex: $currentSongIndex');
      
      final request = GraphQLRequest<String>(
        document: GraphQLQueries.setJamQueue,
        variables: {
          'jamSessionId': jamSessionId,
          'queue': queue,
          'expectedRevision': expectedRevision,
          'currentSongIndex': currentSongIndex,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;
      print('🔄 setJamQueue response:');
      print('  - data: ${response.data}');
      print('  - errors: ${response.errors}');
      
      if (response.data != null) {
        final data = jsonDecode(response.data!);
        final res = data['setJamQueue'];
        print('🔄 Parsed setJamQueue result: $res');
        
        if (res != null) {
          final q = (res['queue'] as List?)?.map((e) => e as int).toList();
          final rev = res['revision'] as int?;
          final currentSong = res['currentSongIndex'] as int?;
          print('🔄 Extracted: queue=$q, revision=$rev, currentSong=$currentSong');
          return (q, rev, currentSong);
        } else {
          print('❌ setJamQueue result is null');
          return (null, null, null);
        }
      } else {
        print('❌ Response data is null');
        if (response.errors.isNotEmpty) {
          print('❌ GraphQL errors: ${response.errors}');
        }
        return (null, null, null);
      }
    } catch (e) {
      print('❌ Error setJamQueue: $e');
      print('❌ Error type: ${e.runtimeType}');
      if (e is Exception) {
        print('❌ Exception details: ${e.toString()}');
      }
      return (null, null, null);
    }
  }

  /// Fetch current jam queue and revision
  Future<(List<int>?, int?)> getJamQueue(String jamSessionId) async {
    try {
      final request = GraphQLRequest<String>(
        document: GraphQLQueries.getJamSession,
        variables: {
          'jamSessionId': jamSessionId,
        },
      );

      final response = await Amplify.API.query(request: request).response;
      if (response.data != null) {
        final data = jsonDecode(response.data!);
        final jam = data['getJamSession'] as Map<String, dynamic>?;
        if (jam != null) {
          final q = (jam['queue'] as List?)?.map((e) => e as int).toList();
          // revision is optional in query; we will default to 0 if absent
          final rev = jam['revision'] is int ? jam['revision'] as int : 0;
          return (q, rev);
        }
      }
      return (null, null);
    } catch (e) {
      print('❌ Error getJamQueue: $e');
      return (null, null);
    }
  }

  /// Atomically pop next song from queue using OCC; returns (nextSongIndex, newQueue, newRevision)
  Future<(int?, List<int>?, int?)> popNextFromQueue(String jamSessionId, {int? expectedRevision}) async {
    // Implement via getJamSession + setJamQueue OCC loop
    try {
      // Load current queue and revision
      final (q0, rev0) = await getJamQueue(jamSessionId);
      final current = q0 ?? [];
      final rev = expectedRevision ?? (rev0 ?? 0);
      if (current.isEmpty) {
        return (null, current, rev0);
      }
      final nextSong = current.first;
      final remaining = current.skip(1).toList();
      final (serverQueue, serverRev, _) = await setJamQueue(jamSessionId, remaining, expectedRevision: rev);
      if (serverQueue != null) {
        return (nextSong, serverQueue, serverRev);
      }
      return (null, null, null);
    } catch (e) {
      print('❌ Error popNextFromQueue: $e');
      return (null, null, null);
    }
  }

  /// Get shared songs for a user (includes songs shared with them)
  Future<List<Song>> listSharedSongs(String userId, {bool? optimize, int? limit, String? filter, String? nextToken}) async {
    try {
      print('🔍 Fetching shared songs for user: $userId using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listSharedSongs,
        variables: {
          'userId': userId,
          'optimize': optimize ?? true,
          'limit': limit,
          'filter': filter,
          'nextToken': nextToken,
        },
      );

      final response = await Amplify.API.query(request: request).response;

      print('🔍 Shared songs response data: ${response.data}');
      print('🔍 Shared songs response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🔍 Shared songs parsed data: $data');

        if (data['listSharedSongs'] != null) {
          final songs = data['listSharedSongs'] as List;
          print('🔍 Found ${songs.length} shared songs');
          return songs.map((e) => Song.fromJson(e as Map<String, dynamic>)).toList();
        }
      }
      return [];
    } on ApiException catch (e) {
      print('❌ Error fetching shared songs: $e');
      throw Exception('Error fetching shared songs: ${e.message}');
    } catch (e) {
      print('❌ Error fetching shared songs: $e');
      throw Exception('Error fetching shared songs: $e');
    }
  }

  /// Get public bands
  Future<List<Band>> listPublicBands({int? limit, String? filter, String? nextToken}) async {
    try {
      print('🎸 Fetching public bands using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listPublicBands,
        variables: {
          'limit': limit,
          'filter': filter,
          'nextToken': nextToken,
        },
      );

      final response = await Amplify.API.query(request: request).response;

      print('🎸 Public bands response data: ${response.data}');
      print('🎸 Public bands response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🎸 Public bands parsed data: $data');

        if (data['listPublicBands'] != null) {
          final bands = data['listPublicBands'] as List;
          print('🎸 Found ${bands.length} public bands');
          return bands.map((e) => Band.fromJson(e as Map<String, dynamic>)).toList();
        }
      }
      return [];
    } on ApiException catch (e) {
      print('❌ Error fetching public bands: $e');
      throw Exception('Error fetching public bands: ${e.message}');
    } catch (e) {
      print('❌ Error fetching public bands: $e');
      throw Exception('Error fetching public bands: $e');
    }
  }

  /// Get songs from a specific band
  Future<List<Song>> listBandSongs(String bandId, {int? limit, String? filter, String? nextToken}) async {
    try {
      print('🎵 Fetching songs for band: $bandId using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listBandSongs,
        variables: {
          'bandId': bandId,
          'limit': limit,
          'filter': filter,
          'nextToken': nextToken,
        },
      );

      final response = await Amplify.API.query(request: request).response;

      print('🎵 Band songs response data: ${response.data}');
      print('🎵 Band songs response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🎵 Band songs parsed data: $data');

        if (data['listBandSongs'] != null) {
          final songs = data['listBandSongs'] as List;
          print('🎵 Found ${songs.length} songs for band $bandId');
          return songs.map((e) => Song.fromJson(e as Map<String, dynamic>)).toList();
        }
      }
      return [];
    } on ApiException catch (e) {
      print('❌ Error fetching band songs: $e');
      throw Exception('Error fetching band songs: ${e.message}');
    } catch (e) {
      print('❌ Error fetching band songs: $e');
      throw Exception('Error fetching band songs: $e');
    }
  }

  /// Get all accessible songs for a user (user's songs + shared songs + public band songs)
  Future<List<Song>> listAllAccessibleSongs(String userId) async {
    try {
      print('🎵 Loading all accessible songs for user: $userId');
      
      final List<Song> allSongs = [];
      
      // 1. Get user's own songs
      print('🎵 Loading user\'s own songs...');
      final userSongs = await getSongs(userId);
      allSongs.addAll(userSongs);
      print('🎵 Found ${userSongs.length} user songs');
      
      // 2. Get shared songs
      print('🎵 Loading shared songs...');
      final sharedSongs = await listSharedSongs(userId);
      allSongs.addAll(sharedSongs);
      print('🎵 Found ${sharedSongs.length} shared songs');
      
      // 3. Get songs from all public bands
      print('🎵 Loading public bands...');
      final publicBands = await listPublicBands();
      print('🎵 Found ${publicBands.length} public bands');
      
      for (final band in publicBands) {
        try {
          print('🎵 Loading songs for band: ${band.name} (${band.bandId})');
          final bandSongs = await listBandSongs(band.bandId);
          allSongs.addAll(bandSongs);
          print('🎵 Found ${bandSongs.length} songs for band ${band.name}');
        } catch (e) {
          print('❌ Error loading songs for band ${band.bandId}: $e');
          // Continue with other bands even if one fails
        }
      }
      
      // Remove duplicates based on songId
      final uniqueSongs = <String, Song>{};
      for (final song in allSongs) {
        uniqueSongs[song.songId] = song;
      }
      
      final finalSongs = uniqueSongs.values.toList();
      print('🎵 Total accessible songs: ${finalSongs.length} (${allSongs.length} before deduplication)');
      
      return finalSongs;
    } catch (e) {
      print('❌ Error loading all accessible songs: $e');
      throw Exception('Error loading all accessible songs: $e');
    }
  }

  /// Create a new jam session
  Future<JamSession?> createJamSession({
    required String setListId,
    required String userId,
    required String policy,
    String? bandId,
  }) async {
    try {
      print('🎵 Creating new jam session...');
      print('📋 SetList ID: $setListId');
      print('👤 User ID: $userId');
      print('🔒 Policy: $policy');
      print('🎸 Band ID: $bandId');

      final request = GraphQLRequest<String>(
        document: GraphQLMutations.createJamSession,
        variables: {
          'setListId': setListId,
          'userId': userId,
          'policy': policy,
          if (bandId != null) 'bandId': bandId,
        },
      );

      print('📤 Sending GraphQL request to create jam session...');
      final response = await Amplify.API.mutate(request: request).response;

      print('📥 Create jam session response received from AWS AppSync');
      print('📊 Response data: ${response.data}');
      print('❌ Response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        final session = data['createJamSession'];
        
        if (session != null) {
          print('✅ Jam session created successfully!');
          print('🆔 Jam Session ID: ${session['jamSessionId']}');
          print('🔑 PIN: ${session['pin']}');
          
          return JamSession.fromJson(session);
        }
      }

      print('❌ Failed to create jam session');
      return null;
    } catch (e) {
      print('❌ Error creating jam session: $e');
      return null;
    }
  }

}
