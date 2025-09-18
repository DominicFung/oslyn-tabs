import 'package:flutter/material.dart';

/// State manager for song card operations
class SongCardStateManager extends ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 0;
  int _totalPages = 0;
  int _currentSongIndex = 0;
  String? _currentKey;
  List<dynamic> _queue = [];
  
  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get currentPage => _currentPage;
  int get totalPages => _totalPages;
  int get currentSongIndex => _currentSongIndex;
  String? get currentKey => _currentKey;
  List<dynamic> get queue => _queue;
  
  // Loading state management
  void setLoading(bool loading) {
    if (_isLoading != loading) {
      _isLoading = loading;
      notifyListeners();
    }
  }
  
  // Error state management
  void setError(String? error) {
    if (_errorMessage != error) {
      _errorMessage = error;
      notifyListeners();
    }
  }
  
  // Page management
  void setCurrentPage(int page) {
    if (_currentPage != page) {
      _currentPage = page;
      notifyListeners();
    }
  }
  
  void setTotalPages(int total) {
    if (_totalPages != total) {
      _totalPages = total;
      notifyListeners();
    }
  }
  
  // Navigation methods
  void nextPage() {
    if (_currentPage < _totalPages - 1) {
      setCurrentPage(_currentPage + 1);
    }
  }
  
  void previousPage() {
    if (_currentPage > 0) {
      setCurrentPage(_currentPage - 1);
    }
  }
  
  void goToPage(int page) {
    if (page >= 0 && page < _totalPages) {
      setCurrentPage(page);
    }
  }
  
  // Song management
  void setCurrentSongIndex(int index) {
    if (_currentSongIndex != index) {
      _currentSongIndex = index;
      notifyListeners();
    }
  }
  
  void updateCurrentSongIndex(int index) {
    setCurrentSongIndex(index);
  }
  
  void setCurrentKey(String? key) {
    if (_currentKey != key) {
      _currentKey = key;
      notifyListeners();
    }
  }
  
  void updateKeyAndResetPage(String? key) {
    setCurrentKey(key);
    setCurrentPage(0);
  }
  
  void initializeCurrentKey(String? key) {
    setCurrentKey(key);
  }
  
  // Queue management
  void setQueue(List<dynamic> newQueue) {
    _queue = newQueue;
    notifyListeners();
  }
  
  void updateQueue(List<dynamic> newQueue) {
    setQueue(newQueue);
  }
  
  // Combined updates
  void updateSongAndPage(int songIndex, int page) {
    setCurrentSongIndex(songIndex);
    setCurrentPage(page);
  }
  
  void updatePage(int page) {
    setCurrentPage(page);
  }
  
  // Reset state
  void reset() {
    _isLoading = false;
    _errorMessage = null;
    _currentPage = 0;
    _totalPages = 0;
    _currentSongIndex = 0;
    _currentKey = null;
    _queue = [];
    notifyListeners();
  }
}
