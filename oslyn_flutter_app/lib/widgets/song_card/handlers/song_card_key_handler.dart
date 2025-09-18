import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class SongCardKeyHandler extends StatelessWidget {
  final Widget child;
  final bool isSlidesInCompactMode;
  final GlobalKey? slidesWidgetKey;
  final VoidCallback onPreviousPage;
  final VoidCallback onNextPage;
  final KeyEventResult Function(KeyDownEvent) onSectionShortcut;

  const SongCardKeyHandler({
    Key? key,
    required this.child,
    required this.isSlidesInCompactMode,
    this.slidesWidgetKey,
    required this.onPreviousPage,
    required this.onNextPage,
    required this.onSectionShortcut,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Focus(
      autofocus: true,
      canRequestFocus: true,
      onKeyEvent: (node, event) {
        if (event is KeyDownEvent) {
          if (event.logicalKey == LogicalKeyboardKey.arrowLeft) {
            // Check if we're in line navigation mode
            if (isSlidesInCompactMode && slidesWidgetKey?.currentState != null) {
              (slidesWidgetKey!.currentState! as dynamic).previousLineGroup();
              return KeyEventResult.handled;
            } else {
              onPreviousPage();
              return KeyEventResult.handled;
            }
          } else if (event.logicalKey == LogicalKeyboardKey.arrowRight) {
            // Check if we're in line navigation mode
            if (isSlidesInCompactMode && slidesWidgetKey?.currentState != null) {
              (slidesWidgetKey!.currentState! as dynamic).nextLineGroup();
              return KeyEventResult.handled;
            } else {
              onNextPage();
              return KeyEventResult.handled;
            }
          } else {
            // Handle section shortcuts
            final result = onSectionShortcut(event);
            if (result == KeyEventResult.handled) {
              return result;
            }
          }
        }
        return KeyEventResult.ignored;
      },
      child: child,
    );
  }
}
