import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, TextInput } from 'react-native';
import { mobileService } from '../services/mobileService';

interface Contact {
  id: string;
  username?: string;
  firstName: string;
  lastName?: string;
  isVerified: boolean;
  trustLevel: number;
}

interface WalletRecoveryScreenProps {
  navigation: any;
}

const WalletRecoveryScreen: React.FC<WalletRecoveryScreenProps> = ({ navigation }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      
      // В реальном приложении здесь будет загрузка контактов из Telegram или других источников
      // Для демонстрации создадим mock данные
      const mockContacts: Contact[] = [
        {
          id: '1',
          username: 'alice_cooper',
          firstName: 'Alice',
          lastName: 'Cooper',
          isVerified: true,
          trustLevel: 0.9
        },
        {
          id: '2',
          username: 'bob_marley',
          firstName: 'Bob',
          lastName: 'Marley',
          isVerified: true,
          trustLevel: 0.8
        },
        {
          id: '3',
          username: 'charlie_brown',
          firstName: 'Charlie',
          lastName: 'Brown',
          isVerified: false,
          trustLevel: 0.6
        },
        {
          id: '4',
          username: 'diana_prince',
          firstName: 'Diana',
          lastName: 'Prince',
          isVerified: true,
          trustLevel: 0.95
        },
        {
          id: '5',
          username: 'ethan_hunt',
          firstName: 'Ethan',
          lastName: 'Hunt',
          isVerified: false,
          trustLevel: 0.7
        }
      ];
      
      setContacts(mockContacts);
      setFilteredContacts(mockContacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
      Alert.alert('Error', 'Failed to load contacts: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchQuery) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact => 
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredContacts(filtered);
  };

  const toggleContactSelection = (contactId: string) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      // Ограничение на количество выбранных контактов (например, максимум 5)
      if (selectedContacts.length >= 5) {
        Alert.alert('Limit Reached', 'You can select up to 5 contacts for recovery');
        return;
      }
      setSelectedContacts([...selectedContacts, contactId]);
    }
 };

  const setupRecovery = async () => {
    if (selectedContacts.length < 3) {
      Alert.alert('Error', 'Please select at least 3 contacts for recovery');
      return;
    }

    try {
      setSaving(true);
      
      // Получаем полные данные контактов для восстановления
      const selectedContactDetails = contacts.filter(contact => 
        selectedContacts.includes(contact.id)
      );
      
      // Вызываем метод настройки восстановления в мобильном сервисе
      await mobileService.setupRecovery(selectedContactDetails);
      
      Alert.alert('Success', 'Recovery setup completed successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to setup recovery:', error);
      Alert.alert('Error', 'Failed to setup recovery: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const renderContact = ({ item }: { item: Contact }) => {
    const isSelected = selectedContacts.includes(item.id);
    const isHighTrust = item.trustLevel >= 0.8;
    
    return (
      <TouchableOpacity
        style={[
          styles.contactItem,
          isSelected && styles.selectedContact,
          !item.isVerified && styles.unverifiedContact
        ]}
        onPress={() => toggleContactSelection(item.id)}
      >
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>
            {item.firstName} {item.lastName}
          </Text>
          {item.username && (
            <Text style={styles.contactUsername}>@{item.username}</Text>
          )}
        </View>
        
        <View style={styles.contactStatus}>
          {isHighTrust && (
            <Text style={styles.trustLevelHigh}>High Trust</Text>
          )}
          {!isHighTrust && item.trustLevel >= 0.6 && (
            <Text style={styles.trustLevelMedium}>Medium Trust</Text>
          )}
          {item.trustLevel < 0.6 && (
            <Text style={styles.trustLevelLow}>Low Trust</Text>
          )}
          
          {item.isVerified && (
            <Text style={styles.verifiedBadge}>✓ Verified</Text>
          )}
          
          <View style={[styles.selectionIndicator, isSelected && styles.selectedIndicator]}>
            {isSelected && <Text style={styles.selectionCheck}>✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet Recovery Setup</Text>
        <Text style={styles.headerSubtitle}>
          Select 3-5 trusted contacts for wallet recovery
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          Selected: {selectedContacts.length}/5 contacts
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading contacts...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.setupButton,
            (selectedContacts.length < 3 || saving) && styles.disabledButton
          ]}
          onPress={setupRecovery}
          disabled={selectedContacts.length < 3 || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.setupButtonText}>
              Setup Recovery ({selectedContacts.length})
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    marginBottom: 5,
 },
  headerSubtitle: {
    fontSize: 16,
    color: '#66',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  selectedInfo: {
    padding: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 10,
  },
  contactItem: {
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
  selectedContact: {
    borderColor: '#34C759',
    borderWidth: 2,
  },
  unverifiedContact: {
    opacity: 0.6,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  contactStatus: {
    alignItems: 'flex-end',
  },
  trustLevelHigh: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: 'bold',
  },
  trustLevelMedium: {
    fontSize: 12,
    color: '#FFCC00',
    fontWeight: 'bold',
  },
  trustLevelLow: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 3,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
  selectionCheck: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  setupButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  setupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WalletRecoveryScreen;