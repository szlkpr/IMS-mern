import io from 'socket.io-client';
import { useState, useEffect } from 'react';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    this.listeners = new Map();
    this.subscriptions = new Set();
  }

  connect(url = 'http://localhost:3000') {
    if (this.socket && this.isConnected) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(url, {
          transports: ['websocket'],
          upgrade: false,
          rememberUpgrade: false,
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.isConnected = false;
          this.subscriptions.clear();
          
          // Auto-reconnect logic
          if (reason === 'io server disconnect') {
            // Server initiated disconnect - don't reconnect automatically
            return;
          }
          
          this.attemptReconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
          
          this.attemptReconnect();
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.notifyListeners('error', { error: error.message });
        });

        // Register default event handlers
        this.setupDefaultHandlers();

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        reject(error);
      }
    });
  }

  setupDefaultHandlers() {
    // Dashboard updates
    this.socket.on('dashboard-initial-data', (data) => {
      this.notifyListeners('dashboard-initial-data', data);
    });

    this.socket.on('dashboard-update', (data) => {
      this.notifyListeners('dashboard-update', data);
    });

    // Inventory alerts
    this.socket.on('low-stock-alert', (data) => {
      this.notifyListeners('low-stock-alert', data);
    });

    this.socket.on('out-of-stock-alert', (data) => {
      this.notifyListeners('out-of-stock-alert', data);
    });

    this.socket.on('new-purchase', (data) => {
      this.notifyListeners('new-purchase', data);
    });

    // Sales alerts
    this.socket.on('new-sale', (data) => {
      this.notifyListeners('new-sale', data);
    });

    // Performance alerts
    this.socket.on('performance-alerts', (data) => {
      this.notifyListeners('performance-alerts', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.subscriptions.clear();
      this.listeners.clear();
      console.log('WebSocket disconnected manually');
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyListeners('reconnect-failed', {
        attempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, this.reconnectInterval);
  }

  // Subscription methods
  subscribeToDashboard() {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('subscribe-dashboard');
    this.subscriptions.add('dashboard');
    console.log('Subscribed to dashboard updates');
  }

  subscribeToInventoryAlerts() {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('subscribe-inventory-alerts');
    this.subscriptions.add('inventory-alerts');
    console.log('Subscribed to inventory alerts');
  }

  subscribeToSalesAlerts() {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.socket.emit('subscribe-sales-alerts');
    this.subscriptions.add('sales-alerts');
    console.log('Subscribed to sales alerts');
  }

  unsubscribeFromDashboard() {
    if (!this.isConnected) {
      return;
    }

    this.socket.emit('unsubscribe-dashboard');
    this.subscriptions.delete('dashboard');
    console.log('Unsubscribed from dashboard updates');
  }

  // Event listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.removeEventListener(event, callback);
    };
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      
      // Clean up empty listener sets
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected;
  }

  getSubscriptions() {
    return Array.from(this.subscriptions);
  }

  // Real-time dashboard helper
  startDashboardMonitoring() {
    if (!this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    try {
      this.subscribeToDashboard();
      this.subscribeToInventoryAlerts();
      this.subscribeToSalesAlerts();
      
      console.log('Started comprehensive dashboard monitoring');
      return true;
    } catch (error) {
      console.error('Failed to start dashboard monitoring:', error);
      return false;
    }
  }

  stopDashboardMonitoring() {
    try {
      this.unsubscribeFromDashboard();
      console.log('Stopped dashboard monitoring');
    } catch (error) {
      console.error('Error stopping dashboard monitoring:', error);
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// React hook for using WebSocket service
export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(websocketService.isSocketConnected());
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Connection status listener
    const handleConnection = () => setIsConnected(true);
    const handleDisconnection = () => setIsConnected(false);

    websocketService.addEventListener('connect', handleConnection);
    websocketService.addEventListener('disconnect', handleDisconnection);

    // Dashboard update listener
    const handleDashboardUpdate = (data) => {
      setLastUpdate(data);
    };

    websocketService.addEventListener('dashboard-update', handleDashboardUpdate);

    // Cleanup
    return () => {
      websocketService.removeEventListener('connect', handleConnection);
      websocketService.removeEventListener('disconnect', handleDisconnection);
      websocketService.removeEventListener('dashboard-update', handleDashboardUpdate);
    };
  }, []);

  return {
    isConnected,
    lastUpdate,
    connect: websocketService.connect.bind(websocketService),
    disconnect: websocketService.disconnect.bind(websocketService),
    subscribeToDashboard: websocketService.subscribeToDashboard.bind(websocketService),
    subscribeToInventoryAlerts: websocketService.subscribeToInventoryAlerts.bind(websocketService),
    subscribeToSalesAlerts: websocketService.subscribeToSalesAlerts.bind(websocketService),
    addEventListener: websocketService.addEventListener.bind(websocketService),
    removeEventListener: websocketService.removeEventListener.bind(websocketService),
    startDashboardMonitoring: websocketService.startDashboardMonitoring.bind(websocketService),
    stopDashboardMonitoring: websocketService.stopDashboardMonitoring.bind(websocketService)
  };
};

// Dashboard-specific hook
export const useDashboardWebSocket = (autoConnect = true) => {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!autoConnect) return;

    const connectAndSubscribe = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await websocketService.connect();
        websocketService.startDashboardMonitoring();
        
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    connectAndSubscribe();

    // Event listeners
    const unsubscribers = [
      websocketService.addEventListener('dashboard-initial-data', (data) => {
        setMetrics(data);
        setIsLoading(false);
      }),
      
      websocketService.addEventListener('dashboard-update', (data) => {
        setMetrics(data);
      }),
      
      websocketService.addEventListener('low-stock-alert', (data) => {
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${data.products.length} products are running low on stock`,
          timestamp: data.timestamp,
          data: data.products
        }]);
      }),
      
      websocketService.addEventListener('out-of-stock-alert', (data) => {
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'error',
          title: 'Out of Stock Alert',
          message: `${data.products.length} products are out of stock`,
          timestamp: data.timestamp,
          data: data.products
        }]);
      }),
      
      websocketService.addEventListener('new-sale', (data) => {
        setAlerts(prev => [...prev, {
          id: Date.now(),
          type: 'success',
          title: 'New Sale',
          message: `Sale of $${data.sale.saleCost} completed`,
          timestamp: data.timestamp,
          data: data.sale
        }]);
      }),
      
      websocketService.addEventListener('performance-alerts', (data) => {
        data.alerts.forEach(alert => {
          setAlerts(prev => [...prev, {
            id: Date.now() + Math.random(),
            type: alert.type === 'critical' ? 'error' : 'warning',
            title: 'Performance Alert',
            message: alert.message,
            timestamp: data.timestamp,
            recommendation: alert.recommendation
          }]);
        });
      }),
      
      websocketService.addEventListener('error', (data) => {
        setError(data.error);
      })
    ];

    // Cleanup
    return () => {
      unsubscribers.forEach(unsub => unsub());
      websocketService.stopDashboardMonitoring();
    };
  }, [autoConnect]);

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    metrics,
    alerts,
    isLoading,
    error,
    isConnected: websocketService.isSocketConnected(),
    dismissAlert,
    clearAllAlerts,
    reconnect: () => websocketService.connect(),
    disconnect: () => websocketService.disconnect()
  };
};

export default websocketService;