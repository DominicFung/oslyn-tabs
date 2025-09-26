import 'dart:convert';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_api/amplify_api.dart';
import '../graphql/queries.dart';
import '../graphql/mutations.dart';
import '../models/jam_session.dart';
import 'auth_service.dart';

class JamService {
  /// Helper method to fix data type issues in jam session data
  Map<String, dynamic> _fixJamSessionDataTypes(Map<String, dynamic> session) {
    // Fix queue field - convert string numbers to integers
    if (session['queue'] != null) {
      final queue = session['queue'] as List;
      session['queue'] = queue.map((e) {
        if (e is String) {
          return int.tryParse(e) ?? 0;
        }
        return e;
      }).toList();
    }
    return session;
  }

  /// Get list of public jam sessions - simplified version
  Future<List<JamSession>> getPublicJamSessions({
    int? limit,
    Map<String, dynamic>? filter,
    String? nextToken,
  }) async {
    try {
      print('🔍 [DEBUG] Getting public jam sessions...');
      print('🔍 [DEBUG] GraphQL Query: ${GraphQLQueries.listPublicJamSessions}');
      print('🔍 [DEBUG] Variables: {limit: $limit, filter: $filter, nextToken: $nextToken}');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listPublicJamSessions,
        variables: {
          'limit': limit,
          'filter': filter,
          'nextToken': nextToken,
        },
      );

      print('📤 [DEBUG] Sending GraphQL request for public jam sessions...');
      print('📤 [DEBUG] Request details:');
      print('   - Document: ${request.document}');
      print('   - Variables: ${request.variables}');
      print('   - Request type: Query');

      final response = await Amplify.API.query(request: request).response;

      print('📥 [DEBUG] Public jam sessions response received from AWS AppSync');
      print('📥 [DEBUG] Response details:');
      print('   - Has data: ${response.data != null}');
      print('   - Has errors: ${response.errors != null}');
      print('   - Raw data: ${response.data}');
      print('   - Raw errors: ${response.errors}');

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
          
          final jamSessions = sessions.map((e) {
            try {
              return JamSession.fromJson(_fixJamSessionDataTypes(e as Map<String, dynamic>));
            } catch (parseError) {
              print('❌ [DEBUG] Error parsing jam session: $parseError');
              print('❌ [DEBUG] Session data that failed to parse: $e');
              return null;
            }
          }).where((session) => session != null).cast<JamSession>().toList();
          
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
          
          return JamSession.fromJson(_fixJamSessionDataTypes(session));
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
      print('🔍 ===== GET JAM SESSION DEBUG START =====');
      print('🔍 Making GraphQL call to AWS AppSync...');
      print('🎯 Jam Session ID: "$jamSessionId" (length: ${jamSessionId.length})');
      print('👤 User ID: "$userId" (length: ${userId?.length ?? 0})');
      print('🔍 User ID is null: ${userId == null}');
      print('🔍 User ID is empty: ${userId?.isEmpty ?? true}');
      print('🔍 User ID equals "null": ${userId == "null"}');
      print('🔍 User ID type: ${userId.runtimeType}');
      
      // Enhanced debugging for troubleshooting
      print('🔍 ===== ENHANCED DEBUG INFO =====');
      print('🔍 Current timestamp: ${DateTime.now().toIso8601String()}');
      print('🔍 Jam Session ID format check:');
      print('   - Contains hyphens: ${jamSessionId.contains('-')}');
      print('   - Contains underscores: ${jamSessionId.contains('_')}');
      print('   - Is alphanumeric: ${RegExp(r'^[a-zA-Z0-9\-_]+$').hasMatch(jamSessionId)}');
      print('🔍 User ID format check:');
      if (userId != null) {
        print('   - Contains hyphens: ${userId.contains('-')}');
        print('   - Contains underscores: ${userId.contains('_')}');
        print('   - Is alphanumeric: ${RegExp(r'^[a-zA-Z0-9\-_]+$').hasMatch(userId)}');
      } else {
        print('   - User ID is null, skipping format check');
      }

      // Debug: Print the GraphQL query
      print('📋 GraphQL Query being used:');
      print(GraphQLQueries.getJamSession);
      print('📋 Input Parameters:');
      print('   - jamSessionId: "$jamSessionId"');
      print('   - userId: "$userId"');
      print('   - userId is null: ${userId == null}');
      print('   - userId is empty: ${userId?.isEmpty ?? true}');
      print('   - userId equals "null": ${userId == "null"}');

      // Build variables properly - only include userId if it's not null and not empty
      Map<String, dynamic> variables = {
        'jamSessionId': jamSessionId,
      };
      
      // Check if userId is valid (not null, not empty, and not the string "null")
      if (userId != null && userId.isNotEmpty && userId != "null") {
        variables['userId'] = userId;
        print('✅ Including userId in GraphQL variables: "$userId"');
        print('✅ This will enable user-specific access control');
      } else {
        print('⚠️ Omitting userId from GraphQL variables (null, empty, or "null" string)');
        print('⚠️ This means the query will run without user context');
        print('⚠️ Access control will depend on the resolver implementation');
      }

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.getJamSession,
        variables: variables,
      );

      print('📤 Sending GraphQL request to AWS AppSync...');
      print('📤 Request document length: ${request.document.length}');
      print('📤 Request variables: ${request.variables}');
      
      final response = await Amplify.API.query(request: request).response;

      print('📥 ===== AWS APPSYNC RESPONSE RECEIVED =====');
      print('📥 Response received');
      print('📥 Has data: ${response.data != null}');
      print('📥 Has errors: ${response.errors != null}');
      print('📥 Data length: ${response.data?.length ?? 0}');
      print('📥 Errors count: ${response.errors?.length ?? 0}');
      
      if (response.data != null) {
        print('📊 Raw response data:');
        print(response.data);
      }
      
      if (response.errors != null && response.errors!.isNotEmpty) {
        print('❌ Raw response errors:');
        response.errors!.forEach((error) {
          print('   - Error: ${error.message}');
          print('   - Error type: ${error.errorType}');
          print('   - Error details: ${error.toString()}');
        });
      }

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
            
            // Debug setList structure
            final setList = session['setList'] as Map<String, dynamic>;
            print('📊 SetList Debug Info:');
            print('   - SetList ID: ${setList['setListId']}');
            print('   - Description: ${setList['description']}');
            print('   - Band ID: ${setList['bandId']}');
            print('   - Has songs field: ${setList.containsKey('songs')}');
            print('   - Songs field value: ${setList['songs']}');
            print('   - Songs field type: ${setList['songs'].runtimeType}');
            if (setList['songs'] is List) {
              final songs = setList['songs'] as List;
              print('   - Songs count: ${songs.length}');
              if (songs.isNotEmpty) {
                print('   - First song: ${songs.first}');
              }
            }
          }

          try {
            final jamSession = JamSession.fromJson(_fixJamSessionDataTypes(session));
            print('✅ Successfully parsed JamSession object');
            return jamSession;
          } catch (parseError) {
            print('❌ Error parsing JamSession: $parseError');
            print('📋 Session data that failed to parse: $session');
            
            // Additional debugging for queue parsing
            if (parseError.toString().contains('String') && parseError.toString().contains('int')) {
              print('🔧 Data type conversion issue detected in queue field');
              print('🔧 Queue data: ${session['queue']}');
              print('🔧 Queue type: ${session['queue'].runtimeType}');
              if (session['queue'] is List) {
                final queue = session['queue'] as List;
                print('🔧 Queue elements: ${queue.map((e) => '${e.runtimeType}: $e').toList()}');
              }
            }
            
            // Return a minimal valid JamSession instead of null
            return JamSession(
              jamSessionId: session['jamSessionId'] ?? 'unknown',
              description: session['description'],
              queue: _fixJamSessionDataTypes(session)['queue'] as List<int>? ?? [],
              revision: session['revision'] ?? 0,
              currentSong: session['currentSong'],
              currentPage: session['currentPage'],
              admins: [],
              members: [],
              guests: [],
              policy: session['policy'] ?? 'PRIVATE',
              active: [],
              passcode: session['passcode'],
              startDate: session['startDate'],
              endDate: session['endDate'],
              bandId: session['bandId'],
              setList: null, // Will be loaded separately if needed
            );
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

  /// Get songs for a user with optional band filtering (includes chordSheet data)
  Future<List<Song>> getSongs(String userId, {String? bandId, int? limit, String? filter}) async {
    try {
      print('Fetching songs for user: $userId, bandId: $bandId using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listSongs,
        variables: {
          'userId': userId,
          'bandId': bandId,
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

  /// Add a song to a setlist
  Future<SetList?> addSongToSetlist(String setListId, String songId, {String? key}) async {
    try {
      print('🎵 ===== ADD SONG TO SETLIST DEBUG =====');
      print('🎵 setListId: $setListId');
      print('🎵 songId: $songId');
      print('🎵 key: $key');
      print('🎵 GraphQL Query: ${GraphQLQueries.addSongToSet}');
      
      final request = GraphQLRequest<String>(
        document: GraphQLQueries.addSongToSet,
        variables: {
          'setListId': setListId,
          'songId': songId,
          'key': key,
        },
      );

      print('🎵 Sending GraphQL request...');
      final response = await Amplify.API.mutate(request: request).response;
      
      print('🎵 ===== RESPONSE DEBUG =====');
      print('🎵 Response data: ${response.data}');
      print('🎵 Response errors: ${response.errors}');
      print('🎵 Response hasData: ${response.data != null}');
      print('🎵 Response hasErrors: ${response.errors.isNotEmpty}');
      
      if (response.data != null) {
        print('🎵 Parsing response data...');
        final data = jsonDecode(response.data!);
        print('🎵 Parsed data: $data');
        
        final setlistData = data['addSongToSet'];
        print('🎵 setlistData: $setlistData');
        
        if (setlistData != null) {
          print('🎵 Creating SetList from JSON...');
          final setlist = SetList.fromJson(setlistData);
          print('🎵 Created SetList: ${setlist.setListId} with ${setlist.songs?.length ?? 0} songs');
          return setlist;
        } else {
          print('❌ setlistData is null in response');
        }
      } else {
        print('❌ Response data is null');
      }
      
      if (response.errors.isNotEmpty) {
        print('❌ GraphQL errors: ${response.errors}');
      }
      
      return null;
    } catch (e) {
      print('❌ ===== EXCEPTION DEBUG =====');
      print('❌ Error type: ${e.runtimeType}');
      print('❌ Error message: $e');
      print('❌ Stack trace: ${StackTrace.current}');
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

  /// Fetch current jam queue, revision, and current song index
  Future<(List<int>?, int?, int?)> getJamQueue(String jamSessionId) async {
    try {
      print('🔍 [DEBUG] getJamQueue called for jamSessionId: $jamSessionId');
      
      // Get user ID from auth service for authentication
      final authService = AuthService();
      final userId = authService.currentUserId;
      print('🔍 [DEBUG] Using userId: $userId');
      
      // Use the existing getJamSession method which properly handles authentication
      final jamSession = await getJamSession(jamSessionId, userId: userId);
      
      if (jamSession != null) {
        print('📊 [DEBUG] Jam session found: ${jamSession.jamSessionId}');
        print('📊 [DEBUG] Queue: ${jamSession.queue}');
        print('📊 [DEBUG] Revision: ${jamSession.revision}');
        print('📊 [DEBUG] Current song: ${jamSession.currentSong}');
        
        return (jamSession.queue, jamSession.revision, jamSession.currentSong);
      } else {
        print('❌ [DEBUG] getJamSession returned null - session not found');
        return (null, null, null);
      }
    } catch (e) {
      print('❌ Error getJamQueue: $e');
      print('❌ Stack trace: ${StackTrace.current}');
      return (null, null, null);
    }
  }

  /// Atomically pop next song from queue using OCC; returns (nextSongIndex, newQueue, newRevision)
  Future<(int?, List<int>?, int?)> popNextFromQueue(String jamSessionId, {int? expectedRevision}) async {
    // Implement via getJamSession + setJamQueue OCC loop
    try {
      // Load current queue and revision
      final (q0, rev0, _) = await getJamQueue(jamSessionId);
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

  /// Get jam sessions using listJamSessions query (fallback method)
  Future<List<JamSession>> listJamSessions(String userId, {int? limit}) async {
    try {
      print('🔍 [DEBUG] Using listJamSessions fallback for userId: $userId');
      
      // Build variables properly - userId is required for listJamSessions
      Map<String, dynamic> variables = {
        'userId': userId,
        if (limit != null) 'limit': limit,
      };

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listJamSessions,
        variables: variables,
      );

      final response = await Amplify.API.query(request: request).response;

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        if (data['listJamSessions'] != null) {
          final sessions = data['listJamSessions'] as List;
          return sessions.map((e) {
            try {
              return JamSession.fromJson(_fixJamSessionDataTypes(e as Map<String, dynamic>));
            } catch (parseError) {
              print('❌ [DEBUG] Error parsing jam session: $parseError');
              print('❌ [DEBUG] Session data that failed to parse: $e');
              return null;
            }
          }).where((session) => session != null).cast<JamSession>().toList();
        }
      }
      return [];
    } catch (e) {
      print('❌ [DEBUG] Error in listJamSessions fallback: $e');
      return [];
    }
  }

  /// Test method to debug jam session access issues
  Future<void> debugJamSessionAccess(String jamSessionId, String userId) async {
    try {
      print('🧪 ===== DEBUG JAM SESSION ACCESS =====');
      print('🧪 Testing jam session access with:');
      print('   - Jam Session ID: "$jamSessionId"');
      print('   - User ID: "$userId"');
      
      // Test 1: Try to get jam session without user ID (public access)
      print('🧪 Test 1: Getting jam session without user ID...');
      final publicResult = await getJamSession(jamSessionId);
      print('🧪 Public access result: ${publicResult != null ? "SUCCESS" : "FAILED"}');
      
      // Test 2: Try to get jam session with user ID (private access)
      print('🧪 Test 2: Getting jam session with user ID...');
      final privateResult = await getJamSession(jamSessionId, userId: userId);
      print('🧪 Private access result: ${privateResult != null ? "SUCCESS" : "FAILED"}');
      
      // Test 3: Check if user exists
      print('🧪 Test 3: Checking if user exists...');
      final user = await getUserById(userId);
      print('🧪 User exists: ${user != null ? "YES" : "NO"}');
      if (user != null) {
        print('🧪 User details: ${user.username} (${user.email})');
      }
      
      print('🧪 ===== DEBUG COMPLETE =====');
    } catch (e) {
      print('🧪 Debug test failed: $e');
    }
  }

  /// Test method to check if getUserJamSessions resolver is working
  Future<void> testGetUserJamSessionsResolver(String userId) async {
    try {
      print('🧪 ===== TESTING GET USER JAM SESSIONS RESOLVER =====');
      print('🧪 Testing with userId: "$userId"');
      
      final request = GraphQLRequest<String>(
        document: '''
          query TestGetUserJamSessions(\$userId: ID!) {
            getUserJamSessions(userId: \$userId) {
              jamSessionId
            }
          }
        ''',
        variables: {
          'userId': userId,
        },
      );

      print('🧪 Sending minimal test request...');
      final response = await Amplify.API.query(request: request).response;
      
      print('🧪 Test response received:');
      print('   - Has data: ${response.data != null}');
      print('   - Has errors: ${response.errors != null}');
      print('   - Data: ${response.data}');
      print('   - Errors: ${response.errors}');
      
      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🧪 Parsed data: $data');
        print('🧪 getUserJamSessions key exists: ${data.containsKey('getUserJamSessions')}');
        if (data.containsKey('getUserJamSessions')) {
          print('🧪 getUserJamSessions value: ${data['getUserJamSessions']}');
          print('🧪 getUserJamSessions type: ${data['getUserJamSessions'].runtimeType}');
        }
      }
      
    } catch (e) {
      print('🧪 Test failed with error: $e');
    }
  }

  /// Update jam session description
  Future<JamSession?> updateJamSessionDescription(String jamSessionId, String description) async {
    try {
      print('🔍 ===== UPDATE JAM SESSION DESCRIPTION DEBUG START =====');
      print('🔍 Updating description for jam session: "$jamSessionId"');
      print('🔍 New description: "$description"');
      
      final request = GraphQLRequest<String>(
        document: GraphQLQueries.updateJamSessionDescription,
        variables: {
          'jamSessionId': jamSessionId,
          'description': description,
        },
      );

      print('📤 Sending GraphQL request to update jam session description...');
      final response = await Amplify.API.mutate(request: request).response;

      print('📥 ===== AWS APPSYNC RESPONSE RECEIVED =====');
      print('📥 Response received');
      print('📥 Has data: ${response.data != null}');
      print('📥 Has errors: ${response.errors != null}');
      
      if (response.data != null) {
        print('📊 Raw response data:');
        print(response.data);
      }
      
      if (response.errors != null && response.errors!.isNotEmpty) {
        print('❌ GraphQL errors:');
        response.errors!.forEach((error) {
          print('   - Error: ${error.message}');
          print('   - Error type: ${error.errorType}');
        });
        return null;
      }

      if (response.data != null) {
        print('📊 [DEBUG] Parsing response data...');
        final data = jsonDecode(response.data!);
        print('📊 [DEBUG] Parsed JSON: $data');
        
        final session = data['updateJamSessionDescription'];
        print('📊 [DEBUG] Extracted session: $session');
        
        if (session != null) {
          print('✅ [DEBUG] Successfully updated jam session description');
          return JamSession.fromJson(_fixJamSessionDataTypes(session as Map<String, dynamic>));
        } else {
          print('❌ [DEBUG] updateJamSessionDescription returned null');
          return null;
        }
      } else {
        print('❌ [DEBUG] Response data is null');
        return null;
      }
    } catch (e, stackTrace) {
      print('❌ [DEBUG] Error updating jam session description: $e');
      print('❌ [DEBUG] Stack trace: $stackTrace');
      return null;
    }
  }

  /// Get user's accessible jam sessions
  Future<List<JamSession>> getUserJamSessions(String userId) async {
    try {
      print('🔍 ===== GET USER JAM SESSIONS DEBUG START =====');
      print('🔍 Getting jam sessions for user: "$userId"');
      print('🔍 User ID length: ${userId.length}');
      print('🔍 User ID is empty: ${userId.isEmpty}');
      print('🔍 User ID contains spaces: ${userId.contains(' ')}');
      print('🔍 User ID trimmed: "${userId.trim()}"');
      
      print('📋 GraphQL Query being used:');
      print(GraphQLQueries.getUserJamSessions);
      print('📋 GraphQL Variables:');
      print('   - userId: "$userId"');

      // Build variables properly - userId is required for getUserJamSessions
      Map<String, dynamic> variables = {
        'userId': userId,
      };

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.getUserJamSessions,
        variables: variables,
      );

      print('📤 Sending GraphQL request for user jam sessions...');
      print('📤 Request document length: ${request.document.length}');
      print('📤 Request variables: ${request.variables}');
      print('📤 Request type: Query');
      
      final response = await Amplify.API.query(request: request).response;

      print('📥 ===== AWS APPSYNC RESPONSE RECEIVED =====');
      print('📥 Response received');
      print('📥 Has data: ${response.data != null}');
      print('📥 Has errors: ${response.errors != null}');
      print('📥 Data length: ${response.data?.length ?? 0}');
      print('📥 Errors count: ${response.errors?.length ?? 0}');
      
      if (response.data != null) {
        print('📊 Raw response data:');
        print(response.data);
      }
      
      if (response.errors != null && response.errors!.isNotEmpty) {
        print('❌ Raw response errors:');
        response.errors!.forEach((error) {
          print('   - Error: ${error.message}');
          print('   - Error type: ${error.errorType}');
          print('   - Error details: ${error.toString()}');
        });
      }

      if (response.data != null) {
        print('📊 [DEBUG] Parsing response data...');
        final data = jsonDecode(response.data!);
        print('📊 [DEBUG] Parsed JSON: $data');
        
        // Handle the case where getUserJamSessions returns null
        final sessions = data['getUserJamSessions'];
        print('📊 [DEBUG] Extracted sessions: $sessions');
        print('📊 [DEBUG] Sessions type: ${sessions.runtimeType}');
        
        if (sessions == null) {
          print('❌ [DEBUG] getUserJamSessions returned null - this violates GraphQL schema');
          print('❌ [DEBUG] AWS Lambda resolver should return empty array instead of null');
          return [];
        }
        
        if (sessions is List) {
          print('✅ [DEBUG] Found ${sessions.length} jam sessions for user');
          print('✅ [DEBUG] Converting to JamSession objects...');
          
          final jamSessions = sessions.map((e) {
            print('✅ [DEBUG] Converting session: $e');
            try {
              return JamSession.fromJson(_fixJamSessionDataTypes(e as Map<String, dynamic>));
            } catch (parseError) {
              print('❌ [DEBUG] Error parsing jam session: $parseError');
              print('❌ [DEBUG] Session data that failed to parse: $e');
              return null;
            }
          }).where((session) => session != null).cast<JamSession>().toList();
          
          print('✅ [DEBUG] Successfully converted ${jamSessions.length} jam sessions');
          return jamSessions;
        } else {
          print('❌ [DEBUG] getUserJamSessions returned unexpected type: ${sessions.runtimeType}');
          return [];
        }
      } else {
        print('❌ [DEBUG] No response data for user jam sessions');
        if (response.errors != null) {
          print('❌ [DEBUG] GraphQL errors: ${response.errors}');
        }
        
        // Fallback: Try to get jam sessions using listJamSessions instead
        print('🔄 [DEBUG] Attempting fallback to listJamSessions...');
        try {
          final listSessions = await listJamSessions(userId, limit: 10);
          print('🔄 [DEBUG] Fallback listJamSessions returned ${listSessions.length} sessions');
          return listSessions;
        } catch (fallbackError) {
          print('❌ [DEBUG] listJamSessions fallback failed: $fallbackError');
          
          // Final fallback: Try to get public jam sessions
          print('🔄 [DEBUG] Attempting final fallback to public jam sessions...');
          try {
            final publicSessions = await getPublicJamSessions(limit: 10);
            print('🔄 [DEBUG] Final fallback returned ${publicSessions.length} public sessions');
            return publicSessions;
          } catch (finalError) {
            print('❌ [DEBUG] All fallbacks failed: $finalError');
            return [];
          }
        }
      }
    } catch (e, stackTrace) {
      print('❌ [DEBUG] Error getting user jam sessions: $e');
      print('❌ [DEBUG] Stack trace: $stackTrace');
      return [];
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
    String? description,
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
          if (description != null) 'description': description,
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
          
          return JamSession.fromJson(_fixJamSessionDataTypes(session));
        }
      }

      print('❌ Failed to create jam session');
      return null;
    } catch (e) {
      print('❌ Error creating jam session: $e');
      return null;
    }
  }

  /// Get user's bands
  Future<List<Band>> getBands(String userId, {int? limit, String? filter}) async {
    try {
      print('Fetching bands for user: $userId using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.listBands,
        variables: {
          'userId': userId,
          'limit': limit,
          'filter': filter,
        },
      );

      final response = await Amplify.API.query(request: request).response;

      print('Bands response data: ${response.data}');
      print('Bands response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        if (data['listBands'] != null) {
          final bands = data['listBands'] as List;
          return bands.map((e) => Band.fromJson(e as Map<String, dynamic>)).toList();
        }
      }

      if (response.errors.isNotEmpty) {
        print('GraphQL errors: ${response.errors}');
        throw Exception('GraphQL errors: ${response.errors}');
      }

      return [];
    } catch (e) {
      print('Error fetching bands: $e');
      throw Exception('Error fetching bands: $e');
    }
  }

  /// Get user by ID with band information
  Future<User?> getUserById(String userId) async {
    try {
      print('🔍 ===== GET USER BY ID DEBUG START =====');
      print('🔍 Fetching user: "$userId" using Amplify...');
      print('🔍 User ID length: ${userId.length}');
      print('🔍 User ID is empty: ${userId.isEmpty}');
      print('🔍 User ID contains spaces: ${userId.contains(' ')}');
      print('🔍 User ID trimmed: "${userId.trim()}"');

      print('📋 GraphQL Query being used:');
      print(GraphQLQueries.getUserById);
      print('📋 GraphQL Variables:');
      print('   - userId: "$userId"');

      // Build variables properly - userId is required for getUserById
      Map<String, dynamic> variables = {
        'userId': userId,
      };

      final request = GraphQLRequest<String>(
        document: GraphQLQueries.getUserById,
        variables: variables,
      );

      print('📤 Sending GraphQL request to AWS AppSync...');
      print('📤 Request document length: ${request.document.length}');
      print('📤 Request variables: ${request.variables}');
      
      final response = await Amplify.API.query(request: request).response;

      print('📥 ===== AWS APPSYNC RESPONSE RECEIVED =====');
      print('📥 Response received');
      print('📥 Has data: ${response.data != null}');
      print('📥 Has errors: ${response.errors != null}');
      print('📥 Data length: ${response.data?.length ?? 0}');
      print('📥 Errors count: ${response.errors?.length ?? 0}');
      
      if (response.data != null) {
        print('📊 Raw response data:');
        print(response.data);
      }
      
      if (response.errors != null && response.errors!.isNotEmpty) {
        print('❌ Raw response errors:');
        response.errors!.forEach((error) {
          print('   - Error: ${error.message}');
          print('   - Error type: ${error.errorType}');
          print('   - Error details: ${error.toString()}');
        });
      }

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🔍 Parsed response data keys: ${data.keys.toList()}');
        
        if (data['getUserById'] != null) {
          print('✅ User found in response data');
          final userData = data['getUserById'] as Map<String, dynamic>;
          print('📊 User data keys: ${userData.keys.toList()}');
          print('📊 User data: $userData');
          
          try {
            final user = User.fromJson(userData);
            print('✅ Successfully parsed User object');
            print('✅ User ID: ${user.userId}');
            print('✅ Username: ${user.username}');
            print('✅ Email: ${user.email}');
            return user;
          } catch (parseError) {
            print('❌ Error parsing User object: $parseError');
            print('📋 User data that failed to parse: $userData');
            return null;
          }
        } else {
          print('⚠️ getUserById returned null - user not found');
        }
      } else {
        print('❌ Response data is null');
      }

      if (response.errors != null && response.errors!.isNotEmpty) {
        print('❌ GraphQL errors: ${response.errors}');
        throw Exception('GraphQL errors: ${response.errors}');
      }

      return null;
    } catch (e) {
      print('Error fetching user: $e');
      throw Exception('Error fetching user: $e');
    }
  }

  /// Create a new band
  Future<Band?> createBand({
    required String name,
    String? description,
    bool? isPublic,
    required String userId,
  }) async {
    try {
      print('Creating band: $name using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLMutations.createBand,
        variables: {
          'name': name,
          'description': description,
          'isPublic': isPublic,
          'userId': userId,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;

      print('Create band response data: ${response.data}');
      print('Create band response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        if (data['createBand'] != null) {
          return Band.fromJson(data['createBand'] as Map<String, dynamic>);
        }
      }

      if (response.errors.isNotEmpty) {
        print('GraphQL errors: ${response.errors}');
        throw Exception('GraphQL errors: ${response.errors}');
      }

      return null;
    } catch (e) {
      print('Error creating band: $e');
      throw Exception('Error creating band: $e');
    }
  }

  /// Add user to band
  Future<bool> addUserToBand({
    required String bandId,
    required String userId,
    required String role, // 'MEMBER' or 'ADMIN'
  }) async {
    try {
      print('Adding user $userId to band $bandId with role $role using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLMutations.addUserToBand,
        variables: {
          'bandId': bandId,
          'userId': userId,
          'role': role,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;

      print('Add user to band response data: ${response.data}');
      print('Add user to band response errors: ${response.errors}');

      if (response.errors.isNotEmpty) {
        print('GraphQL errors: ${response.errors}');
        return false;
      }

      return response.data != null;
    } catch (e) {
      print('Error adding user to band: $e');
      return false;
    }
  }

  /// Import song to band
  Future<Song?> importSongToBand({
    required String songId,
    required String fromBandId,
    required String toBandId,
    required String userId,
  }) async {
    try {
      print('Importing song $songId from band $fromBandId to band $toBandId using Amplify...');

      final request = GraphQLRequest<String>(
        document: GraphQLMutations.importSongToBand,
        variables: {
          'songId': songId,
          'fromBandId': fromBandId,
          'toBandId': toBandId,
          'userId': userId,
        },
      );

      final response = await Amplify.API.mutate(request: request).response;

      print('Import song response data: ${response.data}');
      print('Import song response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        if (data['importSongToBand'] != null) {
          return Song.fromJson(data['importSongToBand'] as Map<String, dynamic>);
        }
      }

      if (response.errors.isNotEmpty) {
        print('GraphQL errors: ${response.errors}');
        throw Exception('GraphQL errors: ${response.errors}');
      }

      return null;
    } catch (e) {
      print('Error importing song to band: $e');
      throw Exception('Error importing song to band: $e');
    }
  }

}
