import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

const OrderSummary = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data);
      } catch (err) {
        console.error("Failed to load order:", err);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <p className="text-center mt-20 text-lg font-medium">
        Loading order details...
      </p>
    );
  }

  if (!order) {
    return (
      <p className="text-center mt-20 text-red-500">Order not found.</p>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="p-8 shadow-lg border rounded-2xl">
        <h1 className="text-3xl font-bold mb-4 text-center">Order Summary</h1>

        <div className="mb-4 text-center text-sm text-gray-600">
          <p>Order ID: <span className="font-medium">{order.id}</span></p>
          <p>Date: {new Date(order.orderDate).toLocaleString()}</p>
          <p>Status: <span className="font-semibold text-blue-600">{order.orderStatus}</span></p>
          <p>Payment: <span className="font-semibold text-green-600">{order.paymentStatus}</span></p>
        </div>

        <Separator className="my-4" />

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Shipping Details</h2>
          <div className="text-gray-700 bg-gray-50 p-3 rounded-md border space-y-1">
            <p><strong>Address:</strong> {order.shippingAddress || "Not available"}</p>
            <p><strong>Phone:</strong> {order.phoneNumber || "Not available"}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <div>
          <h2 className="text-xl font-semibold mb-3">Ordered Items</h2>
          {order.items && order.items.length > 0 ? (
            <ul className="space-y-2">
              {order.items.map((item: any) => (
                <li key={item.id} className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-800">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-semibold">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No items found for this order.</p>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between text-lg font-semibold">
          <span>Total Amount:</span>
          <span className="text-green-600">₹{order.totalAmount.toLocaleString()}</span>
        </div>

        <div className="flex justify-center gap-4 mt-8">
          <Button onClick={() => navigate("/")} variant="default">
            🏠 Go to Home
          </Button>
          <Button onClick={() => navigate("/dashboard")} variant="secondary">
            📦 Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default OrderSummary;
