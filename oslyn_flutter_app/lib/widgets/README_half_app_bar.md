# Half App Bar Implementation

This directory contains implementations for creating app bars that only cover the right half of the screen in Flutter.

## Available Widgets

### 1. `HalfAppBar` (Row-based approach)
- Uses a `Row` widget to split the screen
- Left half is transparent, right half contains the app bar
- Simple and straightforward implementation

### 2. `StackedHalfAppBar` (Stack-based approach)
- Uses a `Stack` with `Positioned` widgets
- More control over positioning
- Better for complex layouts

### 3. `RoundedHalfAppBar` (Rounded corners)
- Similar to `StackedHalfAppBar` but with rounded corners
- Adds margin from screen edges
- More visually appealing design

### 4. `SimpleHalfAppBar` (Practical implementation)
- Clean, production-ready implementation
- Uses `Stack` with `Positioned` for precise control
- Includes proper theming and customization options

## Usage Examples

### Basic Usage
```dart
import 'package:flutter/material.dart';
import '../widgets/simple_half_app_bar.dart';

class MyPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: SimpleHalfAppBar(
        title: 'My App',
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.search),
            onPressed: () {},
          ),
        ],
      ),
      body: YourContent(),
    );
  }
}
```

### With Rounded Corners
```dart
import '../widgets/simple_half_app_bar.dart';

appBar: RoundedHalfAppBar(
  title: 'Rounded App Bar',
  backgroundColor: Colors.purple.withOpacity(0.9),
  foregroundColor: Colors.white,
  borderRadius: 16.0,
  actions: [
    IconButton(icon: Icon(Icons.settings), onPressed: () {}),
  ],
),
```

## Customization Options

All half app bar widgets support:
- `title`: App bar title text
- `actions`: List of action widgets (buttons, etc.)
- `leading`: Leading widget (back button, etc.)
- `backgroundColor`: Background color
- `foregroundColor`: Text and icon color
- `elevation`: Shadow elevation
- `centerTitle`: Whether to center the title
- `margin`: Custom margins (where applicable)

## Demo Pages

### 1. `HalfAppBarDemoPage`
- Interactive demo showing all three approaches
- Switch between different implementations
- Shows various customization options

### 2. `JamListWithHalfAppBarPage`
- Practical example using the half app bar in a real app
- Replaces the positioned buttons with a proper half app bar
- Maintains the same functionality as the original page

## Integration with Existing Apps

To integrate a half app bar into your existing app:

1. **Replace positioned buttons**: Instead of using `Positioned` widgets for top buttons, use a half app bar
2. **Maintain functionality**: Move button actions to the app bar's `actions` parameter
3. **Preserve styling**: Match your app's color scheme and design language
4. **Test responsiveness**: Ensure it works on different screen sizes

## Key Benefits

- **Clean UI**: More organized than scattered positioned buttons
- **Consistent behavior**: Follows Material Design app bar patterns
- **Easy customization**: Standard Flutter app bar properties
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Proper touch targets and accessibility support

## Technical Notes

- All implementations implement `PreferredSizeWidget` for proper Scaffold integration
- Uses `MediaQuery.of(context).size.width` for responsive width calculation
- Properly handles safe areas and system UI overlays
- Includes proper shadow and elevation effects
- Supports both light and dark themes

## Best Practices

1. **Use consistent styling** across your app
2. **Keep actions minimal** - too many buttons can clutter the half app bar
3. **Consider the left half** - ensure important content isn't hidden behind the app bar
4. **Test on different devices** - verify the half-width works well on tablets and phones
5. **Use meaningful icons** - make sure action buttons are intuitive

## Troubleshooting

- **App bar not showing**: Ensure you're using it as the `appBar` property of a `Scaffold`
- **Wrong width**: Check that you're not overriding the width calculation
- **Overlapping content**: Make sure your body content accounts for the app bar height
- **Theme issues**: Verify your app's theme is properly configured
