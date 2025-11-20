import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { mobileService } from '../services/mobileService';
import { MobileTrack } from '../services/mobileService';

interface TrackPurchaseScreenProps {
  navigation: any;
}

const TrackPurchaseScreen: React.FC<TrackPurchaseScreenProps> = ({ navigation }) => {
 const [tracks, setTracks] = useState<MobileTrack[]>([]);
  const [loading, setLoading] = useState(true);
 const [walletConnected, setWalletConnected] = useState(false);
  const [starsBalance, setStarsBalance] = useState(0);
  const [purchasingTrackId, setPurchasingTrackId] = useState<string | null>(null);

  useEffect(() => {
    loadTracksAndWalletInfo();
  }, []);

  const loadTracksAndWalletInfo = async () => {
    try {
      setLoading(true);
      
      // Загрузка треков
      const loadedTracks = await mobileService.loadTracks();
      setTracks(loadedTracks);
      
      // Подключение кошелька и получение баланса
      const walletState = await mobileService.connectWallet();
      setWalletConnected(walletState.connected);
      
      if (walletState.connected) {
        const balance = await mobileService.getStarsBalance();
        setStarsBalance(balance);
      }
    } catch (error) {
      console.error('Failed to load tracks or wallet info:', error);
      Alert.alert('Error', 'Failed to load tracks: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const purchaseTrack = async (track: MobileTrack) => {
    if (!track.price) {
      Alert.alert('Error', 'This track is not available for purchase');
      return;
    }

    if (!walletConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (starsBalance < track.price) {
      Alert.alert('Error', 'Insufficient Stars balance for this purchase');
      return;
    }

    try {
      setPurchasingTrackId(track.id);
      
      // Покупка трека за Stars
      const result = await mobileService.purchaseWithStars(track.price, `Purchase: ${track.title} by ${track.artist}`);
      
      if (result.success) {
        Alert.alert('Success', `Successfully purchased ${track.title} for ${track.price} Stars!`);
        
        // Обновление баланса после покупки
        const newBalance = await mobileService.getStarsBalance();
        setStarsBalance(newBalance);
      } else {
        Alert.alert('Error', result.error || 'Purchase failed');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      Alert.alert('Error', 'Purchase failed: ' + (error as Error).message);
    } finally {
      setPurchasingTrackId(null);
    }
  };

  const renderTrack = ({ item }: { item: MobileTrack }) => (
    <View style={styles.trackItem}>
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle}>{item.title}</Text>
        <Text style={styles.trackArtist}>{item.artist}</Text>
        <Text style={styles.trackGenre}>{item.genre}</Text>
      </View>
      
      <View style={styles.trackActions}>
        {item.price ? (
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              (starsBalance < item.price || purchasingTrackId === item.id) && styles.disabledButton
            ]}
            onPress={() => purchaseTrack(item)}
            disabled={starsBalance < item.price || purchasingTrackId === item.id}
          >
            {purchasingTrackId === item.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                {starsBalance < item.price ? 'Insufficient Stars' : `${item.price} Stars`}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <Text style={styles.freeText}>Free</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Track Store</Text>
        <View style={styles.walletInfo}>
          <Text style={styles.walletText}>Stars: {starsBalance}</Text>
          <Text style={styles.walletText}>Status: {walletConnected ? 'Connected' : 'Disconnected'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading tracks...</Text>
        </View>
      ) : (
        <FlatList
          data={tracks}
          renderItem={renderTrack}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  walletInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletText: {
    fontSize: 16,
    color: '#66',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 10,
  },
  trackItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  trackArtist: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  trackGenre: {
    fontSize: 14,
    color: '#99',
    marginTop: 3,
  },
  trackActions: {
    alignItems: 'flex-end',
  },
  purchaseButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  purchaseButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  freeText: {
    color: '#34C759',
    fontWeight: 'bold',
  },
});

export default TrackPurchaseScreen;