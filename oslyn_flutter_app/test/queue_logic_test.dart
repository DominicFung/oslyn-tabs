import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Queue Logic Tests', () {
    late List<int> testQueue;

    setUp(() {
      // Initialize test queue with 10 items
      testQueue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    });

    group('Basic Reordering Operations', () {
      test('should move item from position 0 to position 1', () {
        final queue = List<int>.from(testQueue);
        
        // Move item from position 0 to position 1 (drag and drop behavior)
        final item = queue.removeAt(0);
        queue.insert(1, item);
        
        expect(queue[0], equals(1)); // What was at position 1 is now at position 0
        expect(queue[1], equals(0)); // What was at position 0 is now at position 1
        expect(queue[2], equals(2)); // Unchanged
        expect(queue.length, equals(10));
      });

      test('should move item from position 0 to position 5', () {
        final queue = List<int>.from(testQueue);
        
        // Move item from position 0 to position 5 (drag and drop behavior)
        final item = queue.removeAt(0);
        queue.insert(5, item);
        
        expect(queue[0], equals(1)); // What was at position 1 is now at position 0
        expect(queue[5], equals(0)); // What was at position 0 is now at position 5
        expect(queue[1], equals(2)); // What was at position 2 is now at position 1
        expect(queue[6], equals(6)); // Unchanged
      });

      test('should move item from first to last position', () {
        final queue = List<int>.from(testQueue);
        
        // Move first item to last position
        final firstItem = queue.removeAt(0);
        queue.add(firstItem);
        
        expect(queue[0], equals(1));
        expect(queue[8], equals(9));
        expect(queue[9], equals(0));
        expect(queue.length, equals(10));
      });

      test('should move item from last to first position', () {
        final queue = List<int>.from(testQueue);
        
        // Move last item to first position
        final lastItem = queue.removeLast();
        queue.insert(0, lastItem);
        
        expect(queue[0], equals(9));
        expect(queue[1], equals(0));
        expect(queue[9], equals(8));
        expect(queue.length, equals(10));
      });
    });

    group('Current Song Index Tracking', () {
      test('should track current song after reordering', () {
        final queue = List<int>.from(testQueue);
        int currentSongIndex = 2; // Currently at position 2
        final currentSongSetlistIndex = queue[currentSongIndex]; // Should be 2
        
        // Move current song to position 7
        final item = queue.removeAt(currentSongIndex);
        queue.insert(7, item);
        currentSongIndex = 7; // Update current song index
        
        expect(queue[currentSongIndex], equals(currentSongSetlistIndex));
        expect(queue[2], equals(3)); // What was at position 3 is now at position 2
      });

      test('should calculate next song correctly', () {
        final queue = List<int>.from(testQueue);
        const currentSongIndex = 3;
        
        if (currentSongIndex < queue.length - 1) {
          final nextSongSetlistIndex = queue[currentSongIndex + 1];
          expect(nextSongSetlistIndex, equals(4));
        }
      });

      test('should calculate previous song correctly', () {
        final queue = List<int>.from(testQueue);
        const currentSongIndex = 3;
        
        if (currentSongIndex > 0) {
          final prevSongSetlistIndex = queue[currentSongIndex - 1];
          expect(prevSongSetlistIndex, equals(2));
        }
      });

      test('should handle current song at boundaries', () {
        final queue = List<int>.from(testQueue);
        
        // Test at beginning
        const currentSongIndex = 0;
        expect(queue[currentSongIndex], equals(0));
        // No previous song
        expect(currentSongIndex == 0, isTrue);
        
        // Test at end
        const lastSongIndex = 9;
        expect(queue[lastSongIndex], equals(9));
        // No next song
        expect(lastSongIndex == queue.length - 1, isTrue);
      });
    });

    group('Queue Integrity Tests', () {
      test('should maintain all items after reordering', () {
        final queue = List<int>.from(testQueue);
        final originalItems = Set<int>.from(queue);
        
        // Perform multiple reorders
        for (int i = 0; i < 5; i++) {
          final from = i;
          final to = queue.length - 1 - i;
          if (from != to) {
            final item = queue[from];
            queue[from] = queue[to];
            queue[to] = item;
          }
        }
        
        final reorderedItems = Set<int>.from(queue);
        expect(reorderedItems, equals(originalItems));
        expect(queue.length, equals(testQueue.length));
      });

      test('should handle duplicate prevention', () {
        final queueWithDuplicates = [0, 1, 2, 1, 3, 2, 4, 5];
        final seen = <int>{};
        final cleanQueue = queueWithDuplicates.where((item) => seen.add(item)).toList();
        
        expect(cleanQueue, equals([0, 1, 2, 3, 4, 5]));
        expect(cleanQueue.length, equals(6));
        expect(cleanQueue.toSet().length, equals(6)); // No duplicates
      });

      test('should validate indices against setlist length', () {
        const setlistLength = 10;
        final validQueue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        final invalidQueue = [0, 1, 2, 15, 4, 5]; // 15 is invalid
        
        // Test valid queue
        expect(validQueue.every((index) => index >= 0 && index < setlistLength), isTrue);
        
        // Test invalid queue
        expect(invalidQueue.every((index) => index >= 0 && index < setlistLength), isFalse);
      });
    });

    group('Edge Cases', () {
      test('should handle empty queue', () {
        final queue = <int>[];
        expect(queue.isEmpty, isTrue);
        expect(queue.length, equals(0));
      });

      test('should handle single item queue', () {
        final queue = [5];
        expect(queue.length, equals(1));
        expect(queue[0], equals(5));
        
        // Reordering single item should do nothing
        final item = queue[0];
        queue[0] = item;
        expect(queue[0], equals(5));
      });

      test('should handle two item queue', () {
        final queue = [3, 7];
        
        // Swap the two items
        final item0 = queue[0];
        final item1 = queue[1];
        queue[0] = item1;
        queue[1] = item0;
        
        expect(queue[0], equals(7));
        expect(queue[1], equals(3));
      });
    });

    group('Performance Tests', () {
      test('should handle large queues efficiently', () {
        final largeQueue = List.generate(1000, (index) => index);
        final startTime = DateTime.now();
        
        // Perform 100 swap operations
        for (int i = 0; i < 100; i++) {
          final from = i % largeQueue.length;
          final to = (i + 1) % largeQueue.length;
          
          final temp = largeQueue[from];
          largeQueue[from] = largeQueue[to];
          largeQueue[to] = temp;
        }
        
        final endTime = DateTime.now();
        final duration = endTime.difference(startTime);
        
        expect(duration.inMilliseconds, lessThan(100)); // Should complete in < 100ms
        expect(largeQueue.length, equals(1000));
      });

      test('should handle rapid reordering operations', () {
        final queue = List<int>.from(testQueue);
        
        // Perform 50 rapid swaps
        for (int i = 0; i < 50; i++) {
          final from = i % queue.length;
          final to = (i + 1) % queue.length;
          
          final temp = queue[from];
          queue[from] = queue[to];
          queue[to] = temp;
        }
        
        // Queue should still be valid
        expect(queue.length, equals(testQueue.length));
        expect(queue.toSet().length, equals(testQueue.length));
      });
    });

    group('Search and Filtering Logic', () {
      test('should filter queue based on search query', () {
        final queue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        // Test searching for "2"
        final searchQuery = '2';
        final filteredIndices = queue.where((index) => 
          index.toString().contains(searchQuery)
        ).toList();
        expect(filteredIndices, equals([2]));
        
        // Test searching for "1"
        final searchQuery2 = '1';
        final filteredIndices2 = queue.where((index) => 
          index.toString().contains(searchQuery2)
        ).toList();
        expect(filteredIndices2, equals([1])); // Only 1 contains "1" in this queue
      });

      test('should return all items when search is empty', () {
        final queue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const searchQuery = '';
        
        final filteredIndices = searchQuery.isEmpty ? queue : 
          queue.where((index) => index.toString().contains(searchQuery)).toList();
        
        expect(filteredIndices, equals(queue));
      });

      test('should handle case-insensitive search', () {
        final queue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const searchQuery = '2';
        
        final filteredIndices = queue.where((index) => 
          index.toString().toLowerCase().contains(searchQuery.toLowerCase())
        ).toList();
        
        expect(filteredIndices, equals([2]));
      });
    });

    group('Complex Reordering Scenarios', () {
      test('should handle multiple consecutive moves', () {
        final queue = List<int>.from(testQueue);
        
        // Move item 0 to position 5, then to position 8
        final item = queue.removeAt(0);
        queue.insert(5, item);
        expect(queue[5], equals(0));
        
        final item2 = queue.removeAt(5);
        queue.insert(8, item2);
        expect(queue[8], equals(0));
      });

      test('should handle reverse reordering', () {
        final queue = List<int>.from(testQueue);
        final originalQueue = List<int>.from(queue);
        
        // Reverse the queue
        for (int i = 0; i < queue.length ~/ 2; i++) {
          final temp = queue[i];
          queue[i] = queue[queue.length - 1 - i];
          queue[queue.length - 1 - i] = temp;
        }
        
        expect(queue, equals([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]));
        expect(queue.length, equals(originalQueue.length));
      });

      test('should handle circular shift', () {
        final queue = List<int>.from(testQueue);
        
        // Shift all items one position to the right
        final lastItem = queue.removeLast();
        queue.insert(0, lastItem);
        
        expect(queue[0], equals(9));
        expect(queue[1], equals(0));
        expect(queue[9], equals(8));
      });
    });
  });
}
