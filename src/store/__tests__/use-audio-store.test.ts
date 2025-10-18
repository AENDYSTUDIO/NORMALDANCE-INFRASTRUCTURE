import { renderHook, act } from '@testing-library/react';
import { useAudioStore } from '../use-audio-store';
import type { Track } from '../use-audio-store';

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  artistName: 'Test Artist',
  genre: 'Electronic',
  duration: 180,
  playCount: 100,
  likeCount: 10,
  ipfsHash: 'QmTest',
  audioUrl: 'https://example.com/audio.mp3',
  isExplicit: false,
  isPublished: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockTrack2: Track = {
  ...mockTrack,
  id: '2',
  title: 'Test Track 2',
};

describe('useAudioStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAudioStore());
    act(() => {
      result.current.pause();
      result.current.clearQueue();
      result.current.clearHistory();
    });
  });

  describe('Playback Controls', () => {
    it('should play a track', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.play(mockTrack);
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.currentTrack).toEqual(mockTrack);
    });

    it('should pause playback', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.play(mockTrack);
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should toggle play/pause', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.play(mockTrack);
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlay();
      });
      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.togglePlay();
      });
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Volume Controls', () => {
    it('should set volume', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setVolume(50);
      });

      expect(result.current.volume).toBe(50);
    });

    it('should toggle mute', () => {
      const { result } = renderHook(() => useAudioStore());

      expect(result.current.isMuted).toBe(false);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(true);

      act(() => {
        result.current.toggleMute();
      });

      expect(result.current.isMuted).toBe(false);
    });
  });

  describe('Queue Management', () => {
    it('should set queue', () => {
      const { result } = renderHook(() => useAudioStore());
      const tracks = [mockTrack, mockTrack2];

      act(() => {
        result.current.setQueue(tracks);
      });

      expect(result.current.queue).toEqual(tracks);
      expect(result.current.currentQueueIndex).toBe(0);
    });

    it('should add track to queue', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToQueue(mockTrack);
      });

      expect(result.current.queue).toContain(mockTrack);
    });

    it('should remove track from queue', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setQueue([mockTrack, mockTrack2]);
        result.current.removeFromQueue(0);
      });

      expect(result.current.queue).toEqual([mockTrack2]);
    });

    it('should clear queue', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setQueue([mockTrack, mockTrack2]);
        result.current.clearQueue();
      });

      expect(result.current.queue).toEqual([]);
      expect(result.current.currentQueueIndex).toBe(-1);
    });
  });

  describe('Playback Navigation', () => {
    it('should play next track', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setQueue([mockTrack, mockTrack2]);
        result.current.playTrack(mockTrack, [mockTrack, mockTrack2]);
        result.current.playNext();
      });

      expect(result.current.currentTrack).toEqual(mockTrack2);
      expect(result.current.currentQueueIndex).toBe(1);
    });

    it('should play previous track', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setQueue([mockTrack, mockTrack2]);
        result.current.playTrack(mockTrack2, [mockTrack, mockTrack2]);
        result.current.playPrevious();
      });

      expect(result.current.currentTrack).toEqual(mockTrack);
      expect(result.current.currentQueueIndex).toBe(0);
    });
  });

  describe('Playback Modes', () => {
    it('should toggle shuffle', () => {
      const { result } = renderHook(() => useAudioStore());

      expect(result.current.shuffle).toBe(false);

      act(() => {
        result.current.toggleShuffle();
      });

      expect(result.current.shuffle).toBe(true);
    });

    it('should set repeat mode', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setRepeat('one');
      });

      expect(result.current.repeat).toBe('one');

      act(() => {
        result.current.setRepeat('all');
      });

      expect(result.current.repeat).toBe('all');
    });
  });

  describe('History', () => {
    it('should add track to history', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToHistory(mockTrack);
      });

      expect(result.current.history).toContain(mockTrack);
    });

    it('should clear history', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToHistory(mockTrack);
        result.current.clearHistory();
      });

      expect(result.current.history).toEqual([]);
    });

    it('should limit history to 100 tracks', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addToHistory({ ...mockTrack, id: `${i}` });
        }
      });

      expect(result.current.history.length).toBe(100);
    });
  });

  describe('Seek', () => {
    it('should seek to time', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.seekTo(60);
      });

      expect(result.current.currentTime).toBe(60);
    });

    it('should set current time', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setCurrentTime(30);
      });

      expect(result.current.currentTime).toBe(30);
    });

    it('should set duration', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setDuration(180);
      });

      expect(result.current.duration).toBe(180);
    });
  });
});