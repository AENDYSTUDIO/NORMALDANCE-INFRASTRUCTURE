import '@testing-library/jest-native/extend-expect'

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')
jest.mock('react-native-reanimated', () => {
  import Reanimated from 'react-native-reanimated/mock';
  ReAnimated.default = ReAnimated
  return ReAnimated
})

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: () => {},
}))

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage)

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    Sound: jest.fn().mockImplementation(() => ({
      loadAsync: jest.fn(),
      playAsync: jest.fn(),
      pauseAsync: jest.fn(),
      stopAsync: jest.fn(),
      getStatusAsync: jest.fn().mockResolvedValue({ isPlaying: false }),
      setPositionAsync: jest.fn(),
      setOnPlaybackStatusUpdate: jest.fn(),
      unloadAsync: jest.fn(),
    })),
    setAudioModeAsync: jest.fn(),
  },
}))

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  useFonts: jest.fn(() => [true]),
}))

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => 'LinearGradient')

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}))

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(),
}))

// Mock expo-constants
jest.mock('expo-constants', () => ({
  manifest: {
    extra: {
      eas: {
        projectId: 'test-project-id',
      },
    },
  },
}))

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  add: jest.fn(),
  setPlayer: jest.fn(),
  setupPlayer: jest.fn(),
  usePlaybackState: jest.fn(),
  useProgress: jest.fn(),
  useTrackPlayerEvents: jest.fn(),
  Event: {
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteNext: 'remote-next',
    RemotePrevious: 'remote-previous',
    RemoteSeek: 'remote-seek',
    RemoteJumpForward: 'remote-jump-forward',
    RemoteJumpBackward: 'remote-jump-backward',
    RemoteSetRate: 'remote-set-rate',
    RemoteSetVolume: 'remote-set-volume',
    RemoteLike: 'remote-like',
    RemoteDislike: 'remote-dislike',
    RemoteBookmark: 'remote-bookmark',
    Play: 'play',
    Pause: 'pause',
    Stop: 'stop',
    End: 'end',
    JumpForward: 'jump-forward',
    JumpBackward: 'jump-backward',
    Next: 'next',
    Previous: 'previous',
    Seek: 'seek',
    SetRate: 'set-rate',
    SetVolume: 'set-volume',
    UpdateTrackMetadataForPlayback: 'update-track-metadata-for-playback',
    UpdateTrackMetadataForRecording: 'update-track-metadata-for-recording',
    UpdateTrackMetadataForRemote: 'update-track-metadata-for-remote',
  },
  Capability: {
    Play: 'play',
    PlayFromId: 'play-from-id',
    PlayFromSearch: 'play-from-search',
    PlayFromUri: 'play-from-uri',
    PlayFromContentItem: 'play-from-content-item',
    Pause: 'pause',
    Stop: 'stop',
    SeekTo: 'seek-to',
    Skip: 'skip',
    SkipToNext: 'skip-to-next',
    SkipToPrevious: 'skip-to-previous',
    SetRate: 'set-rate',
    SetVolume: 'set-volume',
    Like: 'like',
    Dislike: 'dislike',
    Bookmark: 'bookmark',
  },
  RepeatMode: {
    Off: 'off',
    One: 'one',
    All: 'all',
  },
}))

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons', () => ({
  Ionicons: {
    getValue: () => 'ionicons',
  },
}))

// Mock zustand
jest.mock('zustand', () => ({
  create: (createStore) => {
    const store = createStore()
    return () => store
  },
}))

// Suppress console warnings during tests
beforeAll(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})