import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { mobileService } from '../services/mobileService';

interface TransactionItem {
  id: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  retryCount: number;
 maxRetries: number;
  metadata: {
    type: string;
    amount: number;
    description?: string;
  };
}

interface OfflineTransactionsScreenProps {
  navigation: any;
}

const OfflineTransactionsScreen: React.FC<OfflineTransactionsScreenProps> = ({ navigation }) => {
 const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    loadOfflineTransactions();
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      const walletState = await mobileService.connectWallet();
      setWalletConnected(walletState.connected);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletConnected(false);
    }
  };

  const loadOfflineTransactions = async () => {
    try {
      setLoading(true);
      
      // Получаем оффлайн очередь из мобильного сервиса
      // В реальной реализации mobileService.getOfflineQueue() должен возвращать транзакции
      // Для демонстрации создадим mock данные
      const mockTransactions: TransactionItem[] = [
        {
          id: 'offline_tx_1634567890_abc',
          timestamp: Date.now() - 360000, // 1 час назад
          priority: 'high',
          retryCount: 0,
          maxRetries: 3,
          metadata: {
            type: 'purchase',
            amount: 100,
            description: 'Purchase track: New Music'
          }
        },
        {
          id: 'offline_tx_1634567891_def',
          timestamp: Date.now() - 1800000, // 30 минут назад
          priority: 'medium',
          retryCount: 1,
          maxRetries: 3,
          metadata: {
            type: 'stake',
            amount: 500,
            description: 'Stake tokens'
          }
        },
        {
          id: 'offline_tx_1634567892_ghi',
          timestamp: Date.now() - 60000, // 10 минут назад
          priority: 'low',
          retryCount: 0,
          maxRetries: 3,
          metadata: {
            type: 'transfer',
            amount: 10,
            description: 'Send to friend'
          }
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to load offline transactions:', error);
      Alert.alert('Error', 'Failed to load offline transactions: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const syncTransactions = async () => {
    if (!walletConnected) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      setSyncing(true);
      
      // Выполняем синхронизацию оффлайн транзакций
      await mobileService.syncWhenOnline();
      
      // После синхронизации обновляем список
      await loadOfflineTransactions();
      
      Alert.alert('Success', 'Transactions synced successfully!');
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      Alert.alert('Error', 'Failed to sync transactions: ' + (error as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
      default: return '#66';
    }
  };

  const renderTransaction = ({ item }: { item: TransactionItem }) => {
    const priorityColor = getPriorityColor(item.priority);
    
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionId} numberOfLines={1} ellipsizeMode="middle">
            {item.id}
          </Text>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
          </View>
        
        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{item.metadata.type}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{item.metadata.amount}</Text>
          </View>
          
          {item.metadata.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{item.metadata.description}</Text>
            </View>
          )}
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{formatDate(item.timestamp)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Retries:</Text>
            <Text style={styles.detailValue}>{item.retryCount}/{item.maxRetries}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offline Transactions</Text>
        <Text style={styles.headerSubtitle}>
          Transactions queued for offline processing
        </Text>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Total Transactions:</Text>
          <Text style={styles.infoValue}>{transactions.length}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Wallet Status:</Text>
          <Text style={[
            styles.infoValue, 
            walletConnected ? styles.connected : styles.disconnected
          ]}>
            {walletConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.syncButton,
            (!walletConnected || syncing) && styles.disabledButton
          ]}
          onPress={syncTransactions}
          disabled={!walletConnected || syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>Sync Transactions</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadOfflineTransactions}
        >
          <Text style={styles.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No offline transactions</Text>
          <Text style={styles.emptySubtext}>All transactions have been synced</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
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
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
 },
  infoSection: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  connected: {
    color: '#34C759',
  },
  disconnected: {
    color: '#FF3B30',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
  },
  syncButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
  listContent: {
    padding: 10,
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionId: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
 priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transactionDetails: {
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 0.4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 0.6,
    textAlign: 'right',
  },
});

export default OfflineTransactionsScreen;