import 'package:flutter/material.dart';

class SongCardGestureHandler extends StatelessWidget {
  final Widget child;
  final VoidCallback onResetFadeTimer;

  const SongCardGestureHandler({
    Key? key,
    required this.child,
    required this.onResetFadeTimer,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Reset fade timer on tap
        onResetFadeTimer();
      },
      onPanStart: (_) {
        // Reset fade timer on pan start
        onResetFadeTimer();
      },
      onPanUpdate: (_) {
        // Reset fade timer on pan update
        onResetFadeTimer();
      },
      child: child,
    );
  }
}
