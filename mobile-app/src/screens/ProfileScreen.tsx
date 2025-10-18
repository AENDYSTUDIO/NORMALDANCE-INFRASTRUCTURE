import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Image
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useMobileApp } from '../hooks/useMobileApp'

interface ProfileScreenProps {
  navigation?: any
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const {
    wallet,
    isWalletConnected,
    getUserProfile,
    updateUserProfile,
    walletBalance,
    stakingInfo,
    loadTracks,
    tracks
  } = useMobileApp()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    avatar: '',
    banner: ''
  })
  const [showEditModal, setShowEditModal] = useState(false)

  // Загрузка профиля
  useEffect(() => {
    const loadProfile = async () => {
      if (!isWalletConnected) {
        setLoading(false)
        return
      }

      try {
        const userProfile = await getUserProfile()
        setProfile(userProfile)
        if (userProfile) {
          setEditForm({
            displayName: userProfile.displayName || '',
            bio: userProfile.bio || '',
            avatar: userProfile.avatar || '',
            banner: userProfile.banner || ''
          })
        }
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [isWalletConnected, getUserProfile])

  // Обновление профиля
  const handleUpdateProfile = async () => {
    try {
      const success = await updateUserProfile(editForm)
      if (success) {
        setProfile(prev => ({
          ...prev,
          displayName: editForm.displayName,
          bio: editForm.bio,
          avatar: editForm.avatar,
          banner: editForm.banner
        }))
        setShowEditModal(false)
        setEditing(false)
        Alert.alert('Success', 'Profile updated successfully!')
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile')
    }
  }

  // Форматирование баланса
  const formatBalance = (balance: number) => {
    return balance.toFixed(2)
  }

  // Статистика треков
  const trackStats = {
    total: tracks.length,
    totalPlays: tracks.reduce((sum, track) => sum + track.playCount, 0),
    totalLikes: tracks.reduce((sum, track) => sum + track.likeCount, 0)
  }

  // Рендер экрана
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!isWalletConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.walletPromptContainer}>
          <View style={styles.walletPrompt}>
            <Ionicons name="wallet-outline" size={64} color="#666" />
            <Text style={styles.walletPromptText}>
              Connect your wallet to view profile
            </Text>
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={() => navigation.navigate('Wallet')}
            >
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Заголовок */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Ionicons name="settings-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Баннер профиля */}
        {profile?.banner && (
          <View style={styles.banner}>
            <Image 
              source={{ uri: profile.banner }} 
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Информация о кошельке */}
        <View style={styles.walletInfo}>
          <View style={styles.walletAddress}>
            <Ionicons name="wallet" size={20} color="#4CAF50" />
            <Text style={styles.addressText}>
              {wallet.publicKey?.substring(0, 6)}...{wallet.publicKey?.substring(-4)}
            </Text>
          </View>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>NDT Balance</Text>
            <Text style={styles.balanceText}>
              {formatBalance(walletBalance || 0)} NDT
            </Text>
          </View>
        </View>

        {/* Аватар и имя */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar ? (
              <Image 
                source={{ uri: profile.avatar }} 
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={48} color="#4CAF50" />
              </View>
            )}
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>
              {profile?.displayName || wallet.publicKey?.substring(0, 8)}
            </Text>
            <Text style={styles.username}>
              @{wallet.publicKey?.substring(0, 8)}
            </Text>
            {profile?.bio && (
              <Text style={styles.bio}>{profile.bio}</Text>
            )}
          </View>
        </View>

        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trackStats.total}</Text>
            <Text style={styles.statLabel}>Tracks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trackStats.totalPlays.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Plays</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{trackStats.totalLikes.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* Стейкинг информация */}
        {stakingInfo && (
          <View style={styles.stakingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Staking</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Staking')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.stakingInfo}>
              <View style={styles.stakingItem}>
                <Text style={styles.stakingLabel}>Staked Amount</Text>
                <Text style={styles.stakingValue}>
                  {formatBalance(stakingInfo.stakedAmount)} NDT
                </Text>
              </View>
              <View style={styles.stakingItem}>
                <Text style={styles.stakingLabel}>Rewards Earned</Text>
                <Text style={styles.stakingValue}>
                  {formatBalance(stakingInfo.rewardsEarned)} NDT
                </Text>
              </View>
              <View style={styles.stakingItem}>
                <Text style={styles.stakingLabel}>APY</Text>
                <Text style={styles.stakingValue}>
                  {stakingInfo.apy}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Мои треки */}
        <View style={styles.tracksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Tracks</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Upload')}>
              <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          {tracks.length > 0 ? (
            <View style={styles.tracksList}>
              {tracks.slice(0, 3).map((track) => (
                <View key={track.id} style={styles.trackItem}>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackTitle}>{track.title}</Text>
                    <Text style={styles.trackArtist}>{track.artist}</Text>
                  </View>
                  <View style={styles.trackStats}>
                    <Text style={styles.trackStat}>
                      <Ionicons name="play-circle-outline" size={14} color="#888" />
                      {track.playCount}
                    </Text>
                    <Text style={styles.trackStat}>
                      <Ionicons name="heart-outline" size={14} color="#888" />
                      {track.likeCount}
                    </Text>
                  </View>
                </View>
              ))}
              
              {tracks.length > 3 && (
                <TouchableOpacity 
                  style={styles.viewAllTracks}
                  onPress={() => navigation.navigate('MyTracks')}
                >
                  <Text style={styles.viewAllTracksText}>
                    View all {tracks.length} tracks
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.emptyTracks}>
              <Ionicons name="musical-notes-outline" size={48} color="#666" />
              <Text style={styles.emptyTracksText}>No tracks yet</Text>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={() => navigation.navigate('Upload')}
              >
                <Text style={styles.uploadButtonText}>Upload Track</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Настройки */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="notifications-outline" size={20} color="#ffffff" />
              <Text style={styles.settingItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#ffffff" />
              <Text style={styles.settingItemText}>Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingItemContent}>
              <Ionicons name="help-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.settingItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.logoutButton]}
            onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', onPress: () => navigation.navigate('Home') }
                ]
              )
            }}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="log-out-outline" size={20} color="#f44336" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Модальное окно редактирования профиля */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Display Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.displayName}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, displayName: text }))}
                  placeholder="Enter display name"
                  placeholderTextColor="#888"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Bio</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  value={editForm.bio}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, bio: text }))}
                  placeholder="Tell us about yourself"
                  placeholderTextColor="#888"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Avatar URL</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.avatar}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, avatar: text }))}
                  placeholder="Enter avatar URL"
                  placeholderTextColor="#888"
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Banner URL</Text>
                <TextInput
                  style={styles.formInput}
                  value={editForm.banner}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, banner: text }))}
                  placeholder="Enter banner URL"
                  placeholderTextColor="#888"
                />
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#cccccc'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 16
  },
  headerSpacer: {
    width: 24
  },
  scrollView: {
    flex: 1
  },
  banner: {
    height: 150,
    backgroundColor: '#2a2a2a'
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },
  walletInfo: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  walletAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#cccccc',
    marginLeft: 8
  },
  balanceContainer: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8
  },
  balanceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  balanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  profileHeader: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center'
  },
  avatarContainer: {
    marginRight: 16
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileInfo: {
    flex: 1
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  username: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8
  },
  bio: {
    fontSize: 14,
    color: '#cccccc',
    lineHeight: 20
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#888'
  },
  stakingSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  viewAll: {
    fontSize: 14,
    color: '#4CAF50'
  },
  stakingInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16
  },
  stakingItem: {
    flexDirection: 'row'
  },
  walletPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginBottom: 12
  },
  stakingLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4
  },
  stakingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  tracksSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  tracksList: {
    gap: 12
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8
  },
  trackInfo: {
    flex: 1
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2
  },
  trackArtist: {
    fontSize: 12,
    color: '#888'
  },
  trackStats: {
    flexDirection: 'row',
    gap: 16
  },
  trackStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#888'
  },
  viewAllTracks: {
    alignItems: 'center',
    padding: 12
  },
  viewAllTracksText: {
    fontSize: 14,
    color: '#4CAF50'
  },
  emptyTracks: {
    alignItems: 'center',
    padding: 40
  },
  emptyTracksText: {
    fontSize: 16,
    color: '#cccccc',
    marginTop: 16
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500'
  },
  settingsSection: {
    padding: 16
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  settingItemText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 12
  },
  logoutButton: {
    backgroundColor: '#2a2a2a'
  },
  logoutButtonText: {
    color: '#f44336'
  },
  walletPrompt: {
    alignItems: 'center',
    padding: 40
  },
  walletPromptText: {
    fontSize: 18,
    color: '#cccccc',
    marginTop: 16,
    textAlign: 'center'
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24
  },
  connectButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  modalBody: {
    padding: 20
  },
  formGroup: {
    marginBottom: 20
  },
  formLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8
  },
  formInput: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 14
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333'
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2a2a2a'
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#ffffff'
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50'
  },
  saveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500'
  }
})

export default ProfileScreen