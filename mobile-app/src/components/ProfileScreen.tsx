import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { mobileService } from '../services/mobileService';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  bio?: string;
  avatar?: string;
  joinDate: string;
  totalTracks: number;
  totalListens: number;
  totalLikes: number;
}

interface StakingInfo {
  level: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  amountStaked: number;
  apy: number;
  lockPeriod: number;
  rewards: number;
}

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
 const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletState, setWalletState] = useState<any>(null);
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Подключение кошелька
      const wallet = await mobileService.connectWallet();
      setWalletState(wallet);
      setWalletConnected(wallet.connected);
      
      // Получение профиля пользователя
      // В реальной реализации здесь будет вызов getUserProfile
      // Для демонстрации используем mock данные
      const mockProfile: UserProfile = {
        id: 'user-123',
        username: 'normal_dancer',
        displayName: 'Normal Dancer',
        email: 'user@example.com',
        bio: 'Music lover and NFT collector',
        avatar: 'https://example.com/avatar.jpg',
        joinDate: '2024-01-15',
        totalTracks: 12,
        totalListens: 1245,
        totalLikes: 89
      };
      
      setProfile(mockProfile);
      
      // Получение информации о стейкинге
      // В реальной реализации: const staking = await mobileService.getStakingInfo(wallet.publicKey);
      // Для демонстрации используем mock данные
      const mockStaking: StakingInfo = {
        level: 'SILVER',
        amountStaked: 1500,
        apy: 12.5,
        lockPeriod: 90,
        rewards: 45.67
      };
      
      setStakingInfo(mockStaking);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      Alert.alert('Error', 'Failed to load profile: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      const wallet = await mobileService.connectWallet();
      setWalletState(wallet);
      setWalletConnected(wallet.connected);
      
      if (wallet.connected) {
        Alert.alert('Success', 'Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      Alert.alert('Error', 'Failed to connect wallet: ' + (error as Error).message);
    }
  };

  const disconnectWallet = async () => {
    try {
      await mobileService.disconnectWallet();
      setWalletConnected(false);
      setWalletState(null);
      Alert.alert('Success', 'Wallet disconnected successfully!');
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
      Alert.alert('Error', 'Failed to disconnect wallet: ' + (error as Error).message);
    }
  };

  const navigateToRecoverySetup = () => {
    navigation.navigate('WalletRecovery');
  };

  const formatBalance = (balance: number | undefined) => {
    if (balance === undefined) return '0.00';
    return balance.toFixed(4);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Wallet Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Information</Text>
        
        <View style={styles.walletCard}>
          <View style={styles.walletRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[
              styles.value, 
              walletConnected ? styles.connected : styles.disconnected
            ]}>
              {walletConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          
          {walletState?.publicKey && (
            <View style={styles.walletRow}>
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
                {walletState.publicKey}
              </Text>
            </View>
          )}
          
          {walletState?.balance !== undefined && (
            <View style={styles.walletRow}>
              <Text style={styles.label}>SOL Balance:</Text>
              <Text style={styles.value}>{formatBalance(walletState.balance)} SOL</Text>
            </View>
          )}
          
          {walletState?.starsBalance !== undefined && (
            <View style={styles.walletRow}>
              <Text style={styles.label}>Stars Balance:</Text>
              <Text style={styles.value}>{walletState.starsBalance} Stars</Text>
            </View>
          )}
          
          <View style={styles.buttonRow}>
            {!walletConnected ? (
              <TouchableOpacity style={styles.connectButton} onPress={connectWallet}>
                <Text style={styles.buttonText}>Connect Wallet</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.disconnectButton} onPress={disconnectWallet}>
                <Text style={styles.buttonText}>Disconnect Wallet</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.recoveryButton} 
              onPress={navigateToRecoverySetup}
              disabled={!walletConnected}
            >
              <Text style={styles.buttonText}>Setup Recovery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* User Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Profile</Text>
        
        {profile ? (
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Text style={styles.label}>Display Name:</Text>
              <Text style={styles.value}>{profile.displayName}</Text>
            </View>
            
            <View style={styles.profileRow}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>@{profile.username}</Text>
            </View>
            
            {profile.email && (
              <View style={styles.profileRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{profile.email}</Text>
              </View>
            )}
            
            {profile.bio && (
              <View style={styles.profileRow}>
                <Text style={styles.label}>Bio:</Text>
                <Text style={styles.value}>{profile.bio}</Text>
              </View>
            )}
            
            <View style={styles.profileRow}>
              <Text style={styles.label}>Join Date:</Text>
              <Text style={styles.value}>{new Date(profile.joinDate).toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.totalTracks}</Text>
                <Text style={styles.statLabel}>Tracks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.totalListens}</Text>
                <Text style={styles.statLabel}>Listens</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.totalLikes}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>No profile data available</Text>
        )}
      </View>

      {/* Staking Information */}
      {stakingInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Staking Information</Text>
          
          <View style={styles.stakingCard}>
            <View style={styles.stakingRow}>
              <Text style={styles.label}>Level:</Text>
              <Text style={[
                styles.value,
                { color: getLevelColor(stakingInfo.level) }
              ]}>
                {stakingInfo.level}
              </Text>
            </View>
            
            <View style={styles.stakingRow}>
              <Text style={styles.label}>Amount Staked:</Text>
              <Text style={styles.value}>{stakingInfo.amountStaked} NDT</Text>
            </View>
            
            <View style={styles.stakingRow}>
              <Text style={styles.label}>APY:</Text>
              <Text style={styles.value}>{stakingInfo.apy}%</Text>
            </View>
            
            <View style={styles.stakingRow}>
              <Text style={styles.label}>Lock Period:</Text>
              <Text style={styles.value}>{stakingInfo.lockPeriod} days</Text>
            </View>
            
            <View style={styles.stakingRow}>
              <Text style={styles.label}>Rewards:</Text>
              <Text style={styles.value}>{stakingInfo.rewards} NDT</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'BRONZE': return '#CD7F32';
    case 'SILVER': return '#C0C0C0';
    case 'GOLD': return '#FFD700';
    case 'PLATINUM': return '#E5E4E2';
    default: return '#000';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  section: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  walletCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
  },
  profileCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
  },
 stakingCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stakingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  connected: {
    color: '#34C759',
  },
  disconnected: {
    color: '#FF3B30',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  recoveryButton: {
    backgroundColor: '#5856D6',
    padding: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ProfileScreen;