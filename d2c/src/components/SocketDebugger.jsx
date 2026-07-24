import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import useUserSocket from '../hooks/useUserSocket';

/**
 * Temporary debug component for socket connection and notifications
 * Remove this after fixing the notification issue
 */
const SocketDebugger = ({ userData }) => {
  const [logs, setLogs] = useState([]);
  const { isConnected, connectionStatus, joinUserRoom } = useUserSocket(userData);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testConnection = () => {
    addLog(`Testing connection... Status: ${connectionStatus}, Connected: ${isConnected}`, 'info');
    
    if (userData) {
      addLog(`User data: ID=${userData.id}, Name=${userData.name}`, 'info');
      addLog('Attempting to join user room...', 'info');
      joinUserRoom(userData);
    } else {
      addLog('No user data available', 'error');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusEmoji = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Socket Debugger</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Connection Status:</Text>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusEmoji()} {connectionStatus.toUpperCase()}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Connected:</Text>
        <Text style={[styles.statusText, { color: isConnected ? '#4CAF50' : '#F44336' }]}>
          {isConnected ? '🟢 YES' : '🔴 NO'}
        </Text>
      </View>

      {userData && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>User Data:</Text>
          <Text style={styles.statusText}>ID: {userData.id}, Name: {userData.name}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.testButton} onPress={testConnection}>
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.clearButton} onPress={clearLogs}>
        <Text style={styles.buttonText}>Clear Logs</Text>
      </TouchableOpacity>

      <Text style={styles.logsTitle}>Debug Logs:</Text>
      <ScrollView style={styles.logsContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={[styles.logText, styles[`log${log.type}`]]}>
            [{log.timestamp}] {log.message}
          </Text>
        ))}
        {logs.length === 0 && (
          <Text style={styles.noLogs}>No logs yet. Test the connection to see logs.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  logsContainer: {
    maxHeight: 200,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  loginfo: {
    color: '#2196F3',
  },
  logerror: {
    color: '#F44336',
  },
  logsuccess: {
    color: '#4CAF50',
  },
  noLogs: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});

export default SocketDebugger;

