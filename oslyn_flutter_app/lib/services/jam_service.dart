import 'dart:convert';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_api/amplify_api.dart';
import '../graphql/queries.dart';
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
          return sessions.map((e) => JamSession.fromJson(e as Map<String, dynamic>)).toList();
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

  /// Get a specific jam session
  Future<JamSession?> getJamSession(String jamSessionId, {String? userId}) async {
    try {
      print('🔍 Making GraphQL call to AWS AppSync...');
      print('📡 Endpoint: https://oqe64k4rmbbatifefhdw5362wi.appsync-api.us-east-1.amazonaws.com/graphql');
      print('🔑 API Key: da2-wf3ma6ennbeuflezqt2m5xdcbi');
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

      print('📥 Jam session response received');
      print('📊 Response data: ${response.data}');
      print('❌ Response errors: ${response.errors}');

      if (response.data != null) {
        final data = jsonDecode(response.data!);
        print('🔍 Parsed response data keys: ${data.keys.toList()}');
        
        final session = data['getJamSession'];
        print('🎯 getJamSession result: $session');

        if (session != null) {
          // Add detailed logging for debugging
          print('👥 Session admins: ${session['admins']}');
          print('👥 Session members: ${session['members']}');
          print('👥 Session guests: ${session['guests']}');
          print('👥 Session active: ${session['active']}');
          print('🎵 Session setList: ${session['setList']}');

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
}
