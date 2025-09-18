#!/bin/bash

# Queue Management Test Runner
# This script runs all queue-related tests and provides a summary

echo "🧪 Running Queue Management Tests..."
echo "=================================="

# Run the queue logic tests
echo "📊 Testing Queue Logic..."
flutter test test/queue_logic_test.dart --reporter=expanded

echo ""
echo "🎯 Testing Queue Management Widget..."
flutter test test/queue_management_widget_test.dart --reporter=expanded

echo ""
echo "📋 Testing Full Queue Management..."
flutter test test/queue_management_test.dart --reporter=expanded

echo ""
echo "✅ All queue tests completed!"
echo "=================================="
