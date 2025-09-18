import 'dart:async';
import 'dart:convert';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/foundation.dart';
import '../../../graphql/subscriptions.dart';
import '../state/song_card_state_manager.dart';

class SongCardSubscriptionManager {
  final String jamSessionId;
  final SongCardStateManager stateManager;
  final VoidCallback onStateChanged;
  
  // Subscription management
  StreamSubscription<GraphQLResponse<String>>? _songSubscription;
  StreamSubscription<GraphQLResponse<String>>? _keySubscription;
  StreamSubscription<GraphQLResponse<String>>? _pageSubscription;
  StreamSubscription<GraphQLResponse<String>>? _queueSubscription;

  SongCardSubscriptionManager({
    required this.jamSessionId,
    required this.stateManager,
    required this.onStateChanged,
  });

  void startAllSubscriptions() {
    _startSongSubscription();
    _startKeySubscription();
    _startPageSubscription();
    _startQueueSubscription();
  }

  void cancelAllSubscriptions() {
    _songSubscription?.cancel();
    _keySubscription?.cancel();
    _pageSubscription?.cancel();
    _queueSubscription?.cancel();
  }

  void _startSongSubscription() {
    try {
      print('🎵 Starting song subscription for jam session: $jamSessionId');
      
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onNextSong,
        variables: {'jamSessionId': jamSessionId},
      );

      _songSubscription = Amplify.API.subscribe(request).listen(
        (response) {
          print('🎵 Received song subscription update: ${response.data}');
          _handleSongUpdate(response);
        },
        onError: (error) {
          print('❌ Song subscription error: $error');
        },
      );
    } catch (e) {
      print('❌ Failed to start song subscription: $e');
    }
  }

  void _handleSongUpdate(GraphQLResponse<String> response) {
    if (response.data != null) {
      try {
        final data = jsonDecode(response.data!);
        final songData = data['onNextSong'];
        
        if (songData != null) {
          final newSongIndex = songData['song'] as int?;
          final newPage = songData['page'] as int?;
          final currentSongIndex = songData['currentSongIndex'] as int?;
          
          print('🔍 SONG SUBSCRIPTION UPDATE:');
          print('   - newSongIndex: $newSongIndex');
          print('   - currentSongIndex: $currentSongIndex');
          print('   - Local _currentSongIndex: ${stateManager.currentSongIndex}');
          
          if (newSongIndex != null) {
            print('🎵 Received song change from another user: setlist index $newSongIndex');
            
            // Convert setlist index to queue position
            final queuePosition = stateManager.queue.indexOf(newSongIndex);
            if (queuePosition != -1) {
              print('🎵 Converted setlist index $newSongIndex to queue position $queuePosition');
              
              stateManager.updateSongAndPage(
                queuePosition,
                newPage ?? 0,
              );
              
              // Update current key for the new song
              stateManager.initializeCurrentKey(null);
              
              print('🎵 Updated to queue position: $queuePosition, page: ${stateManager.currentPage}');
            } else {
              print('❌ Could not find setlist index $newSongIndex in current queue: ${stateManager.queue}');
            }
          } else if (currentSongIndex != null && currentSongIndex != stateManager.currentSongIndex) {
            print('🎵 Received current song index update: $currentSongIndex');
            // currentSongIndex from backend is also a setlist index, convert to queue position
            final queuePosition = stateManager.queue.indexOf(currentSongIndex);
            if (queuePosition != -1) {
              stateManager.updateCurrentSongIndex(queuePosition);
              onStateChanged();
              print('🎵 Updated current song index to queue position: $queuePosition');
            } else {
              print('❌ Could not find setlist index $currentSongIndex in current queue: ${stateManager.queue}');
            }
          }
        }
      } catch (e) {
        print('❌ Error parsing song subscription data: $e');
      }
    }
  }

  void _startKeySubscription() {
    try {
      print('🎵 Starting key subscription for jam session: $jamSessionId');
      
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onSongKey,
        variables: {'jamSessionId': jamSessionId},
      );

      _keySubscription = Amplify.API.subscribe(request).listen(
        (response) {
          print('🎵 Received key subscription update: ${response.data}');
          _handleKeyUpdate(response);
        },
        onError: (error) {
          print('❌ Key subscription error: $error');
        },
      );
    } catch (e) {
      print('❌ Failed to start key subscription: $e');
    }
  }

  void _handleKeyUpdate(GraphQLResponse<String> response) {
    if (response.data != null) {
      try {
        final data = jsonDecode(response.data!);
        final keyData = data['onSongKey'];
        
        if (keyData != null) {
          final newKey = keyData['key'] as String?;
          final songIndex = keyData['song'] as int?;
          final currentSongIndex = keyData['currentSongIndex'] as int?;
          
          print('🔍 KEY SUBSCRIPTION UPDATE:');
          print('   - newKey: $newKey');
          print('   - songIndex: $songIndex');
          print('   - currentSongIndex: $currentSongIndex');
          print('   - Local _currentSongIndex: ${stateManager.currentSongIndex}');
          
          // Check for current song index update
          if (currentSongIndex != null) {
            print('🎵 Received current song index update from key subscription: setlist index $currentSongIndex');
            // Convert setlist index to queue position
            final queuePosition = stateManager.queue.indexOf(currentSongIndex);
            if (queuePosition != -1 && queuePosition != stateManager.currentSongIndex) {
              stateManager.updateCurrentSongIndex(queuePosition);
              onStateChanged();
              print('🎵 Updated current song index to queue position: $queuePosition');
            } else if (queuePosition == -1) {
              print('❌ Could not find setlist index $currentSongIndex in current queue: ${stateManager.queue}');
            }
          }
          
          if (newKey != null && songIndex != null && newKey != stateManager.currentKey) {
            // Check if this key change is for the current song
            final currentSetlistIndex = stateManager.currentSongIndex >= 0 && stateManager.queue.isNotEmpty && stateManager.currentSongIndex < stateManager.queue.length 
                ? stateManager.queue[stateManager.currentSongIndex] 
                : stateManager.currentSongIndex;
            
            if (songIndex == currentSetlistIndex) {
              print('🎵 Received key change from another user: $newKey');
              
              stateManager.updateKeyAndResetPage(newKey);
              onStateChanged();
              print('🎵 Updated key to: $newKey');
            } else {
              print('🎵 Key change is for different song (setlist index $songIndex, current: $currentSetlistIndex)');
            }
          }
        }
      } catch (e) {
        print('❌ Error parsing key subscription data: $e');
      }
    }
  }

  void _startPageSubscription() {
    try {
      print('📄 Starting page subscription for jam session: $jamSessionId');
      
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onNextPage,
        variables: {'jamSessionId': jamSessionId},
      );

      _pageSubscription = Amplify.API.subscribe(request).listen(
        (response) {
          print('📄 Received page subscription update: ${response.data}');
          _handlePageUpdate(response);
        },
        onError: (error) {
          print('❌ Page subscription error: $error');
        },
      );
    } catch (e) {
      print('❌ Failed to start page subscription: $e');
    }
  }

  void _handlePageUpdate(GraphQLResponse<String> response) {
    if (response.data != null) {
      try {
        final data = jsonDecode(response.data!);
        final pageData = data['onNextPage'];
        
        if (pageData != null) {
          final newPage = pageData['page'] as int?;
          final currentSongIndex = pageData['currentSongIndex'] as int?;
          
          print('🔍 PAGE SUBSCRIPTION UPDATE:');
          print('   - newPage: $newPage');
          print('   - currentSongIndex: $currentSongIndex');
          print('   - Local _currentSongIndex: ${stateManager.currentSongIndex}');
          
          // Check for current song index update
          if (currentSongIndex != null && currentSongIndex != stateManager.currentSongIndex) {
            print('🎵 Received current song index update from page subscription: $currentSongIndex');
            stateManager.updateCurrentSongIndex(currentSongIndex);
            onStateChanged();
          }
          
          if (newPage != null && newPage != stateManager.currentPage) {
            print('📄 Received page change from another user: $newPage');
            
            stateManager.updatePage(newPage);
            onStateChanged();
            print('📄 Updated to page: $newPage');
          }
        }
      } catch (e) {
        print('❌ Error parsing page subscription data: $e');
      }
    }
  }

  void _startQueueSubscription() {
    try {
      final request = GraphQLRequest<String>(
        document: GraphQLSubscriptions.onJamQueueUpdate,
        variables: {'jamSessionId': jamSessionId},
      );
      _queueSubscription = Amplify.API.subscribe(request).listen(
        (response) {
          if (response.data != null) {
            try {
              final data = jsonDecode(response.data!);
              final q = data['onJamQueueUpdate'];
              if (q != null) {
                final list = (q['queue'] as List?)?.map((e) => e as int).toList();
                final rev = q['revision'] as int?;
                final currentSongIndex = q['currentSongIndex'] as int?;
                
                print('🔍 QUEUE SUBSCRIPTION UPDATE:');
                print('   - Server currentSongIndex: $currentSongIndex');
                print('   - Local _currentSongIndex: ${stateManager.currentSongIndex}');
                print('   - Should update: ${currentSongIndex != null && currentSongIndex != stateManager.currentSongIndex}');
                
                if (list != null) {
                  stateManager.updateQueue(list);
                  onStateChanged();
                }
              }
            } catch (e) {
              print('❌ Error parsing queue update: $e');
            }
          }
        },
        onError: (error) { print('❌ Queue subscription error: $error'); },
      );
    } catch (e) {
      print('❌ Failed to start queue subscription: $e');
    }
  }
}
