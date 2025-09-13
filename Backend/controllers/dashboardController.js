const { db } = require("../config/db");

// Get dashboard statistics
function getDashboardStats(req, res) {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];

    // Get today's orders
    const todayOrdersQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders 
      WHERE DATE(created_at) = ?
    `;

    // Get total approved users
    const approvedUsersQuery = `
      SELECT COUNT(*) as total_approved_users
      FROM users 
      WHERE status = 'approved'
    `;

    // Get total products
    const totalProductsQuery = `
      SELECT COUNT(*) as total_products
      FROM products
    `;

    // Get total categories
    const totalCategoriesQuery = `
      SELECT COUNT(*) as total_categories
      FROM categories
    `;

    // Get recent orders (last 10)
    const recentOrdersQuery = `
      SELECT 
        o.id,
        o.total_amount,
        o.status,
        o.created_at,
        u.name as user_name,
        p.name as product_name,
        p.sku as product_sku
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `;

    // Get monthly revenue for the last 6 months
    const monthlyRevenueQuery = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `;

    // Get top selling products
    const topProductsQuery = `
      SELECT 
        p.name as product_name,
        p.sku as product_sku,
        COUNT(o.id) as order_count,
        SUM(o.total_amount) as total_revenue
      FROM products p
      LEFT JOIN orders o ON p.id = o.product_id
      GROUP BY p.id, p.name, p.sku
      ORDER BY order_count DESC
      LIMIT 5
    `;

    // Execute all queries
    db.query(
      todayOrdersQuery,
      [today],
      (todayOrdersErr, todayOrdersResults) => {
        if (todayOrdersErr) {
          console.error("Error fetching today's orders:", todayOrdersErr);
          return res.status(500).json({ error: "Database error" });
        }

        db.query(
          approvedUsersQuery,
          (approvedUsersErr, approvedUsersResults) => {
            if (approvedUsersErr) {
              console.error("Error fetching approved users:", approvedUsersErr);
              return res.status(500).json({ error: "Database error" });
            }

            db.query(
              totalProductsQuery,
              (totalProductsErr, totalProductsResults) => {
                if (totalProductsErr) {
                  console.error(
                    "Error fetching total products:",
                    totalProductsErr
                  );
                  return res.status(500).json({ error: "Database error" });
                }

                db.query(
                  totalCategoriesQuery,
                  (totalCategoriesErr, totalCategoriesResults) => {
                    if (totalCategoriesErr) {
                      console.error(
                        "Error fetching total categories:",
                        totalCategoriesErr
                      );
                      return res.status(500).json({ error: "Database error" });
                    }

                    db.query(
                      recentOrdersQuery,
                      (recentOrdersErr, recentOrdersResults) => {
                        if (recentOrdersErr) {
                          console.error(
                            "Error fetching recent orders:",
                            recentOrdersErr
                          );
                          return res
                            .status(500)
                            .json({ error: "Database error" });
                        }

                        db.query(
                          monthlyRevenueQuery,
                          (monthlyRevenueErr, monthlyRevenueResults) => {
                            if (monthlyRevenueErr) {
                              console.error(
                                "Error fetching monthly revenue:",
                                monthlyRevenueErr
                              );
                              return res
                                .status(500)
                                .json({ error: "Database error" });
                            }

                            db.query(
                              topProductsQuery,
                              (topProductsErr, topProductsResults) => {
                                if (topProductsErr) {
                                  console.error(
                                    "Error fetching top products:",
                                    topProductsErr
                                  );
                                  return res
                                    .status(500)
                                    .json({ error: "Database error" });
                                }

                                // Calculate additional metrics
                                const todayStats = todayOrdersResults[0] || {
                                  total_orders: 0,
                                  total_revenue: 0,
                                  pending_orders: 0,
                                  approved_orders: 0,
                                  completed_orders: 0,
                                  cancelled_orders: 0,
                                };

                                const totalApprovedUsers =
                                  approvedUsersResults[0]
                                    ?.total_approved_users || 0;
                                const totalProducts =
                                  totalProductsResults[0]?.total_products || 0;
                                const totalCategories =
                                  totalCategoriesResults[0]?.total_categories ||
                                  0;

                                // Calculate conversion rate (orders per user)
                                const conversionRate =
                                  totalApprovedUsers > 0
                                    ? (
                                        (todayStats.total_orders /
                                          totalApprovedUsers) *
                                        100
                                      ).toFixed(2)
                                    : 0;

                                // Calculate average order value
                                const averageOrderValue =
                                  todayStats.total_orders > 0
                                    ? (
                                        todayStats.total_revenue /
                                        todayStats.total_orders
                                      ).toFixed(2)
                                    : 0;

                                const dashboardData = {
                                  today: {
                                    orders: todayStats.total_orders,
                                    revenue: todayStats.total_revenue || 0,
                                    pending: todayStats.pending_orders,
                                    approved: todayStats.approved_orders,
                                    completed: todayStats.completed_orders,
                                    cancelled: todayStats.cancelled_orders,
                                    averageOrderValue:
                                      parseFloat(averageOrderValue),
                                  },
                                  totals: {
                                    approvedUsers: totalApprovedUsers,
                                    products: totalProducts,
                                    categories: totalCategories,
                                  },
                                  metrics: {
                                    conversionRate: parseFloat(conversionRate),
                                    averageOrderValue:
                                      parseFloat(averageOrderValue),
                                  },
                                  recentOrders: recentOrdersResults,
                                  monthlyRevenue: monthlyRevenueResults,
                                  topProducts: topProductsResults,
                                };

                                res.json({
                                  success: true,
                                  data: dashboardData,
                                });
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get today's orders with details
function getTodayOrders(req, res) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const query = `
      SELECT 
        o.id,
        o.total_amount,
        o.quantity,
        o.status,
        o.created_at,
        u.name as user_name,
        u.phone_number as user_phone,
        p.name as product_name,
        p.sku as product_sku,
        p.net_weight,
        p.gross_weight,
        c.name as category_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE DATE(o.created_at) = ?
      ORDER BY o.created_at DESC
    `;

    db.query(query, [today], (err, results) => {
      if (err) {
        console.error("Error fetching today's orders:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({
        success: true,
        data: results,
      });
    });
  } catch (error) {
    console.error("Today orders error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Get quick stats (lightweight version)
function getQuickStats(req, res) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const query = `
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = ?) as today_orders,
        (SELECT COUNT(*) FROM users WHERE status = 'approved') as total_users,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM categories) as total_categories,
        (SELECT SUM(total_amount) FROM orders WHERE DATE(created_at) = ?) as today_revenue
    `;

    db.query(query, [today, today], (err, results) => {
      if (err) {
        console.error("Error fetching quick stats:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const stats = results[0] || {
        today_orders: 0,
        total_users: 0,
        total_products: 0,
        total_categories: 0,
        today_revenue: 0,
      };

      res.json({
        success: true,
        data: stats,
      });
    });
  } catch (error) {
    console.error("Quick stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getDashboardStats,
  getTodayOrders,
  getQuickStats,
};
