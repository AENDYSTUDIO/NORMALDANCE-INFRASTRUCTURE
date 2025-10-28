import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { mobileService } from '../services/mobileService';
import { MobileTrack } from '../services/mobileService';

interface PlayerScreenProps {
  route: any;
  navigation: any;
}

const PlayerScreen: React.FC<PlayerScreenProps> = ({ route, navigation }) => {
  const { track } = route.params;
  const [status, setStatus] = useState<Audio.Status | null>(null);
  const [isLoading, setIsLoading] = useState(true);
 const [isPurchasing, setIsPurchasing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    loadTrack();
    checkWalletConnection();
    
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const checkWalletConnection = async () => {
    try {
      const walletState = await mobileService.connectWallet();
      setWalletConnected(walletState.connected);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletConnected(false);
    }
  };

  const loadTrack = async () => {
    try {
      setIsLoading(true);
      await mobileService.playTrack(track);
      // Note: We can't directly access the sound object from mobileService
      // so we'll just update the UI to reflect that the track is playing
      setStatus({ isPlaying: true, positionMillis: 0, durationMillis: track.duration * 100 });
    } catch (error) {
      console.error('Failed to load track:', error);
      Alert.alert('Error', 'Failed to load track');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayback = async () => {
    if (!status) return;

    if (status.isPlaying) {
      await mobileService.pausePlayback();
      setStatus({ ...status, isPlaying: false });
    } else {
      await mobileService.resumePlayback();
      setStatus({ ...status, isPlaying: true });
    }
  };

  const stopPlayback = async () => {
    await mobileService.stopPlayback();
    setStatus({ ...status!, isPlaying: false, positionMillis: 0 });
  };

  const purchaseTrack = async () => {
    if (!track.price) {
      Alert.alert('Error', 'This track is not available for purchase');
      return;
    }

    if (!walletConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      setIsPurchasing(true);
      
      // Attempt to purchase with stars if available
      const starsBalance = await mobileService.getStarsBalance();
      if (starsBalance >= track.price) {
        // Purchase with stars
        const result = await mobileService.purchaseWithStars(track.price, `Purchase: ${track.title}`);
        if (result.success) {
          Alert.alert('Success', `Successfully purchased ${track.title} for ${track.price} Stars!`);
          return;
        }
      }

      // Fallback to other payment methods would go here
      Alert.alert('Error', 'Not enough Stars for this purchase');
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Error', 'Purchase failed: ' + (error as Error).message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = Math.floor((millis % 6000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.trackInfo}>
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.artist}>{track.artist}</Text>
        <Text style={styles.genre}>{track.genre}</Text>
      </View>

      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={togglePlayback}>
              <Text style={styles.buttonText}>
                {status?.isPlaying ? 'Pause' : 'Play'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={stopPlayback}>
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>

            {track.price && (
              <TouchableOpacity 
                style={[styles.button, styles.purchaseButton]} 
                onPress={purchaseTrack}
                disabled={isPurchasing}
              >
                <Text style={styles.buttonText}>
                  {isPurchasing ? 'Processing...' : `Purchase for ${track.price} Stars`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {status && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {formatTime(status.positionMillis || 0)} / {formatTime(status.durationMillis || 0)}
          </Text>
        </View>
      )}

      <View style={styles.walletStatus}>
        <Text style={styles.walletText}>
          Wallet: {walletConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  artist: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  genre: {
    fontSize: 16,
    color: '#999',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  purchaseButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#333',
  },
  walletStatus: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  walletText: {
    fontSize: 14,
    color: '#66',
  },
});

export default PlayerScreen;