import { Server } from 'socket.io';
import { Product } from '../models/product.model.js';
import { Sale } from '../models/sale.model.js';

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.dashboardMetrics = {
      salesCount: 0,
      revenue: 0,
      lowStockItems: 0,
      totalProducts: 0,
      lastUpdated: new Date()
    };
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:5173", // Adjust for your frontend URL
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.id, {
        socketId: socket.id,
        joinedAt: new Date(),
        dashboardSubscribed: false
      });

      // Handle dashboard subscription
      socket.on('subscribe-dashboard', async () => {
        try {
          socket.join('dashboard');
          this.connectedUsers.get(socket.id).dashboardSubscribed = true;
          
          // Send initial dashboard data
          const initialData = await this.getCurrentDashboardMetrics();
          socket.emit('dashboard-initial-data', initialData);
          
          console.log(`User ${socket.id} subscribed to dashboard`);
        } catch {
          socket.emit('error', { message: 'Failed to subscribe to dashboard' });
        }
      });

      // Handle inventory alerts subscription
      socket.on('subscribe-inventory-alerts', () => {
        socket.join('inventory-alerts');
        console.log(`User ${socket.id} subscribed to inventory alerts`);
      });

      // Handle sales alerts subscription
      socket.on('subscribe-sales-alerts', () => {
        socket.join('sales-alerts');
        console.log(`User ${socket.id} subscribed to sales alerts`);
      });

      // Handle unsubscription
      socket.on('unsubscribe-dashboard', () => {
        socket.leave('dashboard');
        this.connectedUsers.get(socket.id).dashboardSubscribed = false;
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        this.connectedUsers.delete(socket.id);
      });
    });

    // Start periodic dashboard updates
    this.startPeriodicUpdates();
    
    console.log('WebSocket service initialized');
    return this.io;
  }

  // Real-time dashboard metrics
  async getCurrentDashboardMetrics() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Today's sales metrics
      const todaysSales = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['completed', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: '$saleCost' },
            averageOrderValue: { $avg: '$saleCost' }
          }
        }
      ]);

      // Low stock items
      const lowStockItems = await Product.countDocuments({
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        isArchived: false
      });

      // Out of stock items
      const outOfStockItems = await Product.countDocuments({
        stock: 0,
        isArchived: false
      });

      // Total products
      const totalProducts = await Product.countDocuments({ isArchived: false });

      // Recent sales (last 5)
      const recentSales = await Sale.find({
        status: { $in: ['completed', 'paid'] }
      })
      .populate('soldProducts.productId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerName saleCost soldProducts createdAt');

      // Top selling products today
      const topProducts = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['completed', 'paid'] }
          }
        },
        { $unwind: '$soldProducts' },
        {
          $group: {
            _id: '$soldProducts.productId',
            totalQuantity: { $sum: '$soldProducts.quantity' },
            totalRevenue: { $sum: { $multiply: ['$soldProducts.quantity', '$soldProducts.price'] } }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $project: {
            name: '$product.name',
            totalQuantity: 1,
            totalRevenue: 1
          }
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 }
      ]);

      const salesData = todaysSales[0] || { totalSales: 0, totalRevenue: 0, averageOrderValue: 0 };

      this.dashboardMetrics = {
        salesCount: salesData.totalSales,
        revenue: salesData.totalRevenue,
        averageOrderValue: salesData.averageOrderValue,
        lowStockItems,
        outOfStockItems,
        totalProducts,
        recentSales,
        topProducts,
        lastUpdated: new Date(),
        connectedUsers: this.connectedUsers.size
      };

      return this.dashboardMetrics;
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  // Broadcast dashboard updates
  async broadcastDashboardUpdate() {
    try {
      const metrics = await this.getCurrentDashboardMetrics();
      this.io.to('dashboard').emit('dashboard-update', metrics);
    } catch (error) {
      console.error('Error broadcasting dashboard update:', error);
    }
  }

  // Inventory alerts
  async checkAndBroadcastInventoryAlerts() {
    try {
      // Low stock alerts
      const lowStockProducts = await Product.find({
        $expr: { $lte: ['$stock', '$lowStockThreshold'] },
        isArchived: false,
        stock: { $gt: 0 } // Not completely out of stock
      }).select('name stock lowStockThreshold category');

      // Out of stock alerts
      const outOfStockProducts = await Product.find({
        stock: 0,
        isArchived: false
      }).select('name category');

      if (lowStockProducts.length > 0) {
        this.io.to('inventory-alerts').emit('low-stock-alert', {
          type: 'low-stock',
          products: lowStockProducts,
          timestamp: new Date()
        });
      }

      if (outOfStockProducts.length > 0) {
        this.io.to('inventory-alerts').emit('out-of-stock-alert', {
          type: 'out-of-stock',
          products: outOfStockProducts,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error checking inventory alerts:', error);
    }
  }

  // Sales alerts
  broadcastSaleAlert(saleData) {
    this.io.to('sales-alerts').emit('new-sale', {
      type: 'new-sale',
      sale: saleData,
      timestamp: new Date()
    });
    
    // Also trigger dashboard update
    this.broadcastDashboardUpdate();
  }

  // Purchase alerts
  broadcastPurchaseAlert(purchaseData) {
    this.io.to('inventory-alerts').emit('new-purchase', {
      type: 'new-purchase',
      purchase: purchaseData,
      timestamp: new Date()
    });
    
    // Also trigger dashboard update
    this.broadcastDashboardUpdate();
  }

  // Performance alerts
  async checkPerformanceAlerts(targets = {}) {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const monthlyPerformance = await Sale.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            status: { $in: ['completed', 'paid'] }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$saleCost' },
            totalSales: { $sum: 1 }
          }
        }
      ]);

      const performance = monthlyPerformance[0] || { totalRevenue: 0, totalSales: 0 };
      
      // Check against targets
      const alerts = [];
      
      if (targets.monthlyRevenue && performance.totalRevenue < targets.monthlyRevenue * 0.5) {
        alerts.push({
          type: 'performance',
          metric: 'revenue',
          message: `Monthly revenue is significantly below target`,
          actual: performance.totalRevenue,
          target: targets.monthlyRevenue,
          severity: 'high'
        });
      }

      if (targets.monthlySales && performance.totalSales < targets.monthlySales * 0.5) {
        alerts.push({
          type: 'performance',
          metric: 'sales',
          message: `Monthly sales count is significantly below target`,
          actual: performance.totalSales,
          target: targets.monthlySales,
          severity: 'high'
        });
      }

      if (alerts.length > 0) {
        this.io.to('dashboard').emit('performance-alerts', {
          alerts,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error checking performance alerts:', error);
    }
  }

  // Start periodic updates
  startPeriodicUpdates() {
    // Dashboard metrics every 30 seconds
    setInterval(() => {
      this.broadcastDashboardUpdate();
    }, 30000);

    // Inventory alerts every 5 minutes
    setInterval(() => {
      this.checkAndBroadcastInventoryAlerts();
    }, 300000);

    // Performance alerts every hour
    setInterval(() => {
      this.checkPerformanceAlerts();
    }, 3600000);
  }

  // Manual trigger methods for immediate updates
  triggerDashboardUpdate() {
    this.broadcastDashboardUpdate();
  }

  triggerInventoryCheck() {
    this.checkAndBroadcastInventoryAlerts();
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get dashboard subscribers count
  getDashboardSubscribersCount() {
    return Array.from(this.connectedUsers.values())
      .filter(user => user.dashboardSubscribed).length;
  }
}

export default new WebSocketService();