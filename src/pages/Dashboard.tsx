import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, Clock, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  userEmail: string;
  shippingAddress: string;
  phoneNumber?: string;
  orderStatus: "pending" | "processing" | "shipped" | "delivered";
  paymentStatus: string;
  totalAmount: number;
  orderDate: string;
  items: OrderItem[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      fetchOrders(user.email);
    }
  }, [user]);

  const fetchOrders = async (email: string) => {
    try {
      const response = await api.get(`/orders/user/${email}`);
      const sorted = response.data.sort(
        (a: Order, b: Order) =>
          new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <Package className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500";
      case "processing":
        return "bg-blue-500/10 text-blue-500";
      case "shipped":
        return "bg-purple-500/10 text-purple-500";
      case "delivered":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 space-y-8">
        {/* Profile Summary */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {user?.name || "Guest User"}
                </h2>
                <p className="text-muted-foreground">
                  {user?.email || "No email available"}
                </p>

                {latestOrder && (
                  <div className="mt-3 text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>Address:</strong>{" "}
                      {latestOrder.shippingAddress || "Not available"}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {latestOrder.phoneNumber || "Not available"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 md:mt-0 text-right">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-semibold">{orders.length}</p>
            </div>
          </div>
        </Card>

        {/* Order History */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Recent Orders</h2>

          {orders.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">
                  Start shopping to see your orders here.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => navigate(`/order-summary/${order.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          Order #{order.id}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Placed on{" "}
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          📍 {order.shippingAddress}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          📞 {order.phoneNumber || "Not provided"}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <Badge className={getStatusColor(order.orderStatus)}>
                          {getStatusIcon(order.orderStatus)}
                          <span className="ml-2 capitalize">
                            {order.orderStatus}
                          </span>
                        </Badge>
                        <p className="text-lg font-bold">
                          ₹{order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {order.items &&
                        order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm text-muted-foreground"
                          >
                            <span>
                              {item.productName} × {item.quantity}
                            </span>
                            <span>₹{item.price.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
