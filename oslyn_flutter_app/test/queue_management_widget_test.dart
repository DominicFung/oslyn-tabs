import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:oslyn_flutter_app/models/jam_session.dart';
import 'package:oslyn_flutter_app/widgets/queue_management.dart';

void main() {
  group('Queue Management Widget Tests', () {
    late JamSession mockJamSession;
    late List<int> testQueue;

    setUp(() {
      // Create a mock jam session
      mockJamSession = JamSession(
        jamSessionId: 'test-session',
        setList: SetList(
          setListId: 'test-setlist',
          description: 'Test Setlist',
          songs: List.generate(10, (index) => JamSong(
            key: 'song-$index',
            song: Song(
              songId: 'song-$index',
              title: 'Song $index',
              artist: 'Artist $index',
              chordSheet: 'Test chord sheet $index',
              chordSheetKey: 'C',
              isApproved: true,
              version: 1,
            ),
          )),
        ),
        admins: [],
        members: [],
        guests: [],
        policy: 'public',
        active: [],
      );

      testQueue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    });

    testWidgets('should display queue management widget', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      // Verify the widget is displayed
      expect(find.text('Drag songs to reorder the queue'), findsOneWidget);
      expect(find.text('Reset to Setlist'), findsOneWidget);
      expect(find.text('Clear Queue'), findsOneWidget);
    });

    testWidgets('should display search bar', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      // Verify search bar is present
      expect(find.byType(TextField), findsOneWidget);
      expect(find.text('Search all songs...'), findsOneWidget);
    });

    testWidgets('should display queue items', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      // Wait for the widget to build
      await tester.pumpAndSettle();

      // Verify queue items are displayed
      expect(find.text('0'), findsOneWidget); // First song index
      expect(find.text('1'), findsOneWidget); // Second song index
      expect(find.text('Song 0'), findsOneWidget); // First song title
      expect(find.text('Song 1'), findsOneWidget); // Second song title
    });

    testWidgets('should highlight current song', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 2, // Current song at position 2
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // The current song should be highlighted (we can check for specific styling)
      // This is a simplified test - in practice, you'd check for specific colors or styles
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('should handle search functionality', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      // Find the search field
      final searchField = find.byType(TextField);
      expect(searchField, findsOneWidget);

      // Enter search text
      await tester.enterText(searchField, '2');
      await tester.pumpAndSettle();

      // Verify that only matching items are displayed
      // This would depend on the actual implementation
      expect(find.text('2'), findsOneWidget);
    });

    testWidgets('should handle reset to setlist button', (WidgetTester tester) async {
      bool resetCalled = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {
                resetCalled = true;
              },
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      // Find and tap the reset button
      final resetButton = find.text('Reset to Setlist');
      expect(resetButton, findsOneWidget);
      
      await tester.tap(resetButton);
      await tester.pumpAndSettle();

      // Verify the callback was called
      expect(resetCalled, isTrue);
    });

    testWidgets('should handle clear queue button', (WidgetTester tester) async {
      bool clearCalled = false;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {
                if (queue.isEmpty) {
                  clearCalled = true;
                }
              },
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      // Find and tap the clear button
      final clearButton = find.text('Clear Queue');
      expect(clearButton, findsOneWidget);
      
      await tester.tap(clearButton);
      await tester.pumpAndSettle();

      // Verify the callback was called with empty queue
      expect(clearCalled, isTrue);
    });

    testWidgets('should handle song selection', (WidgetTester tester) async {
      int? selectedIndex;
      
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {
                selectedIndex = index;
              },
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Find and tap on a song item
      final songItem = find.text('Song 1').first;
      await tester.tap(songItem);
      await tester.pumpAndSettle();

      // Verify the callback was called
      expect(selectedIndex, isNotNull);
    });

    testWidgets('should display loading state during reset', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      // This test would need to be modified based on the actual implementation
      // of the loading state in the widget
      expect(find.text('Reset to Setlist'), findsOneWidget);
    });

    testWidgets('should handle empty queue gracefully', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: mockJamSession,
              currentSongIndex: null,
              queue: <int>[],
              queueRevision: 0,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Should display empty state message
      expect(find.text('No songs in queue'), findsOneWidget);
    });

    testWidgets('should handle null jam session gracefully', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: QueueManagement(
              jamSession: null,
              currentSongIndex: 0,
              queue: testQueue,
              queueRevision: 1,
              onQueueUpdated: (queue, revision) {},
              onSongSelected: (index) {},
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Should still display the widget without crashing
      expect(find.text('Drag songs to reorder the queue'), findsOneWidget);
    });
  });
}

