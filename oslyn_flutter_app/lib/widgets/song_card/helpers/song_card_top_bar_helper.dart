import 'dart:async';
import 'package:flutter/material.dart';

class SongCardTopBarHelper {
  final VoidCallback setState;
  final AnimationController topBarAnimationController;
  final Timer? Function() getFadeTimer;
  final void Function(Timer?) setFadeTimer;
  final Duration fadeDuration;
  
  // State getters and setters
  final bool Function() getIsTopBarVisible;
  final void Function(bool) setIsTopBarVisible;
  final bool Function() getShowTopBarIndicator;
  final void Function(bool) setShowTopBarIndicator;
  final bool Function() getShowUI;
  final void Function(bool) setShowUI;
  final bool Function() getMounted;

  SongCardTopBarHelper({
    required this.setState,
    required this.topBarAnimationController,
    required this.getFadeTimer,
    required this.setFadeTimer,
    required this.fadeDuration,
    required this.getIsTopBarVisible,
    required this.setIsTopBarVisible,
    required this.getShowTopBarIndicator,
    required this.setShowTopBarIndicator,
    required this.getShowUI,
    required this.setShowUI,
    required this.getMounted,
  });

  void slideUpTopBar() {
    print('_slideUpTopBar called, _isTopBarVisible: ${getIsTopBarVisible()}');
    if (getIsTopBarVisible()) {
      setState();
      setIsTopBarVisible(false);
      setShowTopBarIndicator(false);
      topBarAnimationController.forward();
      // Show indicator after a short delay
      Timer(const Duration(milliseconds: 500), () {
        if (getMounted() && !getIsTopBarVisible()) {
          setState();
          setShowTopBarIndicator(true);
        }
      });
      // Reset fade timer when top bar is hidden
      resetFadeTimer();
    }
  }

  void slideDownTopBar() {
    print('_slideDownTopBar called, _isTopBarVisible: ${getIsTopBarVisible()}');
    if (!getIsTopBarVisible()) {
      setState();
      setIsTopBarVisible(true);
      setShowTopBarIndicator(false);
      topBarAnimationController.reverse();
      // Reset fade timer when top bar is shown
      resetFadeTimer();
    }
  }

  void resetFadeTimer() {
    setState();
    setShowUI(true);
    getFadeTimer()?.cancel();
    setFadeTimer(Timer(fadeDuration, () {
      if (getMounted()) {
        setState();
        setShowUI(false);
      }
    }));
  }

  void startFadeTimer() {
    getFadeTimer()?.cancel();
    setFadeTimer(Timer(fadeDuration, () {
      if (getMounted()) {
        setState();
        setShowUI(false);
      }
    }));
  }
}
