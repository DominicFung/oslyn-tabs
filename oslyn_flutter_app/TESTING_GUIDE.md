# 🧪 Queue Management Testing Guide

This guide explains how to efficiently test the queue ordering logic using the dedicated test files.

## 📁 Test Files

### 1. `test/queue_logic_test.dart`
**Purpose**: Tests the core queue reordering logic without UI dependencies
**Coverage**: 
- Basic reordering operations (swap, move)
- Current song index tracking
- Queue integrity validation
- Edge cases and error handling
- Performance tests
- Search and filtering logic

### 2. `test/queue_management_widget_test.dart`
**Purpose**: Tests the UI widget behavior and user interactions
**Coverage**:
- Widget rendering
- User interactions (buttons, search, selection)
- State management
- Error handling

### 3. `test/queue_management_test.dart`
**Purpose**: Integration tests with mock data
**Coverage**:
- Full queue management workflow
- Mock jam session integration
- Complex scenarios

## 🚀 Running Tests

### Quick Test (Recommended)
```bash
# Run all queue tests at once
./test_queue.sh
```

### Individual Test Files
```bash
# Test core logic only
flutter test test/queue_logic_test.dart

# Test widget behavior only
flutter test test/queue_management_widget_test.dart

# Test full integration
flutter test test/queue_management_test.dart
```

### Specific Test Groups
```bash
# Test only reordering operations
flutter test test/queue_logic_test.dart --name "Basic Reordering Operations"

# Test only performance
flutter test test/queue_logic_test.dart --name "Performance Tests"

# Test only edge cases
flutter test test/queue_logic_test.dart --name "Edge Cases"
```

## 🔍 Test Categories

### 1. Basic Reordering Operations
- ✅ Swap adjacent items (0 ↔ 1)
- ✅ Swap non-adjacent items (0 ↔ 5)
- ✅ Move first to last
- ✅ Move last to first

### 2. Current Song Index Tracking
- ✅ Track current song after reordering
- ✅ Calculate next song correctly
- ✅ Calculate previous song correctly
- ✅ Handle boundary conditions

### 3. Queue Integrity Tests
- ✅ Maintain all items after reordering
- ✅ Prevent duplicates
- ✅ Validate indices against setlist length

### 4. Edge Cases
- ✅ Empty queue handling
- ✅ Single item queue
- ✅ Two item queue
- ✅ Invalid indices

### 5. Performance Tests
- ✅ Large queue handling (1000+ items)
- ✅ Rapid reordering operations
- ✅ Memory efficiency

### 6. Search and Filtering
- ✅ Filter by search query
- ✅ Empty search returns all items
- ✅ Case-insensitive search

## 🎯 Testing Scenarios

### Scenario 1: Basic Queue Reordering
```dart
// Test moving song from position 2 to position 7
final queue = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// Move item at index 2 to index 7
// Expected: [0, 1, 3, 4, 5, 6, 2, 7, 8, 9]
```

### Scenario 2: Current Song Tracking
```dart
// Current song at position 3, move it to position 8
// Verify current song index updates correctly
// Verify next/previous song calculations
```

### Scenario 3: Performance Testing
```dart
// Test with 1000 items
// Perform 100 rapid reorder operations
// Verify completion time < 100ms
```

### Scenario 4: Search Functionality
```dart
// Search for "2" in queue [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
// Expected: Only item at index 2 should match
```

## 🐛 Debugging Failed Tests

### 1. Check Test Output
```bash
flutter test test/queue_logic_test.dart --reporter=expanded
```

### 2. Run Specific Failing Test
```bash
flutter test test/queue_logic_test.dart --name "specific test name"
```

### 3. Add Debug Prints
```dart
test('should swap adjacent items', () {
  final queue = List<int>.from(testQueue);
  print('Before: $queue'); // Add this line
  
  // ... test logic ...
  
  print('After: $queue'); // Add this line
  expect(queue[0], equals(1));
});
```

## 📊 Test Results Interpretation

### ✅ Passing Tests
- All assertions pass
- No exceptions thrown
- Performance within expected limits

### ❌ Failing Tests
- **Assertion failures**: Logic error in implementation
- **Exceptions**: Unhandled edge cases
- **Performance issues**: Algorithm needs optimization

### ⚠️ Warning Signs
- Tests pass but take too long
- Memory usage spikes
- Inconsistent results

## 🔧 Adding New Tests

### 1. Add to Existing Test Group
```dart
test('should handle new scenario', () {
  // Test implementation
});
```

### 2. Create New Test Group
```dart
group('New Feature Tests', () {
  // Multiple related tests
});
```

### 3. Test Template
```dart
test('should [expected behavior]', () {
  // Arrange
  final queue = List<int>.from(testQueue);
  
  // Act
  // Perform the operation
  
  // Assert
  expect(actual, equals(expected));
});
```

## 🎵 Real-World Testing

### 1. Manual Testing
- Run the app in debug mode
- Use the debug buttons in the UI
- Test with real jam sessions

### 2. Integration Testing
- Test with actual GraphQL responses
- Test with real DynamoDB data
- Test with multiple devices

### 3. User Testing
- Test with different queue sizes
- Test with various search queries
- Test rapid user interactions

## 📈 Continuous Testing

### 1. Pre-commit Hooks
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
flutter test test/queue_logic_test.dart
```

### 2. CI/CD Integration
```yaml
# Add to GitHub Actions or similar
- name: Run Queue Tests
  run: flutter test test/queue_logic_test.dart
```

### 3. Regular Test Runs
```bash
# Run daily
./test_queue.sh > test_results_$(date +%Y%m%d).log
```

## 🎯 Best Practices

1. **Write tests first** (TDD approach)
2. **Test edge cases** thoroughly
3. **Keep tests fast** (< 1 second each)
4. **Use descriptive test names**
5. **Test one thing per test**
6. **Clean up after tests**
7. **Mock external dependencies**
8. **Test both success and failure cases**

## 🚨 Common Issues

### Issue: Tests fail randomly
**Solution**: Check for race conditions or non-deterministic behavior

### Issue: Tests are slow
**Solution**: Optimize algorithms or reduce test data size

### Issue: Tests pass but app fails
**Solution**: Add integration tests with real data

### Issue: Hard to debug test failures
**Solution**: Add more detailed logging and assertions

---

## 🎉 Quick Start

1. **Run all tests**: `./test_queue.sh`
2. **Fix any failures**
3. **Add new tests for new features**
4. **Run tests before committing**

Happy testing! 🧪✨
