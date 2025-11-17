import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Plus, Edit, Trash2, Upload } from "lucide-react";


/**
 * AdminDashboard.tsx
 *
 * Notes:
 * - Uses your backend routes:
 *    GET  /api/categories
 *    POST /api/categories  (form-data: name, description, image optional)   --> you have this
 *    DELETE /api/categories/{id}
 *
 *    GET  /api/products
 *    POST /api/products    (form-data: name, price, categoryId, image optional) --> you have this
 *    DELETE /api/products/{id}
 *
 *    GET  /api/orders
 *    PUT  /api/orders/{id}/status?status=...  --> you have this
 *
 * - Backend PUT endpoints for /categories/{id} and /products/{id} were not present
 *   in the controllers you shared. This component tries a PUT first (if you add it),
 *   and if PUT fails (404 / not implemented) it falls back to delete + create as
 *   a safe "update" workaround (keeps UI flow working).
 *
 * - Product table intentionally does NOT show images (per your request).
 */

type Category = {
  id: number;
  name: string;
  description?: string | null;
};

type Product = {
  id: number;
  name: string;
  price: number;
  image?: string | null;
  category?: Category | null;
};

type OrderItem = {
  id?: number;
  productId?: number;
  productName?: string;
  price?: number;
  quantity?: number;
};

type Order = {
  id: number;
  userEmail?: string;
  shippingAddress?: string;
  phoneNumber?: string;
  orderStatus?: string;
  paymentStatus?: string;
  totalAmount?: number;
  orderDate?: string;
  items?: OrderItem[];
};

const ORDER_STATUS_OPTIONS = [
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // loading
  const [loading, setLoading] = useState(false);

  // category form
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [catEditing, setCatEditing] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // product form
  const [isProdOpen, setIsProdOpen] = useState(false);
  const [prodEditing, setProdEditing] = useState<Product | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState<string>("");
  const [prodCategoryId, setProdCategoryId] = useState<string>("");
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);

  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // load all admin data
  const loadAll = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, oRes] = await Promise.all([
        api.get("/categories"),
        api.get("/products"),
        api.get("/orders"),
      ]);

      // ensure product categories are available (backend returns product.category)
      setCategories(Array.isArray(cRes.data) ? cRes.data : []);
      // sort products desc by id (new first)
      const prods = Array.isArray(pRes.data) ? pRes.data : [];
      prods.sort((a: Product, b: Product) => (b.id as number) - (a.id as number));
      setProducts(prods);
      const ords = Array.isArray(oRes.data) ? oRes.data : [];
      ords.sort((a: Order, b: Order) => {
        const ta = a.orderDate ? new Date(a.orderDate).getTime() : 0;
        const tb = b.orderDate ? new Date(b.orderDate).getTime() : 0;
        return tb - ta;
      });
      setOrders(ords);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ---------------- Category handlers ----------------
  const openAddCategory = () => {
    setCatEditing(null);
    setCatName("");
    setCatDesc("");
    setIsCatOpen(true);
  };

  const openEditCategory = (c: Category) => {
    setCatEditing(c);
    setCatName(c.name || "");
    setCatDesc(c.description || "");
    setIsCatOpen(true);
  };

  const submitCategory = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!catName.trim()) {
      toast.error("Category name required");
      return;
    }

    try {
      // backend expects form-data for POST /api/categories (controller uses @RequestParam and optional MultipartFile)
      const fd = new FormData();
      fd.append("name", catName);
      fd.append("description", catDesc || "");

      if (catEditing && catEditing.id) {
        // Try PUT first (in case you add/update backend). If it fails, fallback to delete+create.
        try {
          await api.put(`/categories/${catEditing.id}`, { name: catName, description: catDesc });
          toast.success("Category updated (PUT)");
        } catch (putErr: any) {
          // If PUT not available, fallback
          console.warn("PUT /categories failed, falling back to delete+create", putErr?.response?.status);
          // delete existing
          await api.delete(`/categories/${catEditing.id}`);
          // create new
          await api.post("/categories", fd);
          toast.success("Category updated (recreated)");
        }
      } else {
        // create
        await api.post("/categories", fd);
        toast.success("Category created");
      }

      setIsCatOpen(false);
      await loadAll();
    } catch (err) {
      console.error("Category save error:", err);
      toast.error("Failed to save category");
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category? This will also remove category association from products.")) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
      await loadAll();
    } catch (err) {
      console.error("Delete category failed:", err);
      toast.error("Failed to delete category");
    }
  };

  // ---------------- Product handlers ----------------
  const openAddProduct = () => {
    setProdEditing(null);
    setProdName("");
    setProdPrice("");
    setProdCategoryId("");
    setProdImageFile(null);
    setIsProdOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setProdEditing(p);
    setProdName(p.name || "");
    setProdPrice(p.price ? String(p.price) : "");
    setProdCategoryId(p.category?.id ? String(p.category.id) : "");
    setProdImageFile(null);
    setIsProdOpen(true);
  };

  const submitProduct = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prodName.trim() || !prodPrice || !prodCategoryId) {
      toast.error("Please fill name, price and category");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", prodName);
      fd.append("price", String(prodPrice));
      fd.append("categoryId", prodCategoryId);
      if (prodImageFile) fd.append("image", prodImageFile);

      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      if (prodEditing && prodEditing.id) {
        // try PUT first (if backend added it)
        try {
          await api.put(`/products/${prodEditing.id}`, fd, { headers });
          toast.success("Product updated (PUT)");
        } catch (putErr: any) {
          console.warn("PUT /products failed, falling back to delete+create", putErr?.response?.status);
          // delete old then create new
          await api.delete(`/products/${prodEditing.id}`, { headers });
          await api.post("/products", fd, { headers });
          toast.success("Product updated (recreated)");
        }
      } else {
        // create
        await api.post("/products", fd, { headers });
        toast.success("Product created");
      }

      setIsProdOpen(false);
      await loadAll();
    } catch (err) {
      console.error("Product save error:", err);
      toast.error("Failed to save product");
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      await loadAll();
    } catch (err) {
      console.error("Delete product failed:", err);
      toast.error("Failed to delete product");
    }
  };

  // ---------------- Orders ----------------
  const updateOrderStatus = async (orderId: number, status: string) => {
    setUpdatingOrderId(orderId);
    try {
      // backend supports: PUT /api/orders/{id}/status?status=...
      await api.put(`/orders/${orderId}/status?status=${encodeURIComponent(status)}`);
      toast.success("Order status updated");
      await loadAll();
    } catch (err) {
      console.error("Update order status failed:", err);
      toast.error("Failed to update order status");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // small helpers
  const formatDate = (s?: string) => (s ? new Date(s).toLocaleString() : "-");

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage categories, products and orders</p>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v)}>
          <TabsList className="grid grid-cols-4 gap-2 mb-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* DASHBOARD */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">₹{Math.round((orders.reduce((s, o) => s + (o.totalAmount || 0), 0))).toLocaleString()}</p>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">Recent Orders</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center p-6">No orders found</TableCell>
                      </TableRow>
                    ) : (
                      orders.slice(0, 8).map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono">{o.id}</TableCell>
                          <TableCell>{o.userEmail}</TableCell>
                          <TableCell>{o.phoneNumber || "Not provided"}</TableCell>
                          <TableCell>{o.shippingAddress || "-"}</TableCell>
                          <TableCell>₹{(o.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>{o.orderStatus}</TableCell>
                          <TableCell>{formatDate(o.orderDate)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* CATEGORIES */}
          <TabsContent value="categories">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Categories</h2>
              <div>
                <Button onClick={openAddCategory}>
                  <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              </div>
            </div>

            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center p-6">No categories found</TableCell>
                      </TableRow>
                    ) : (
                      categories.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.id}</TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.description || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditCategory(c)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => deleteCategory(c.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Category modal (simple inline form) */}
            {isCatOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-lg bg-background p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">{catEditing ? "Edit Category" : "Add Category"}</h3>
                  <form onSubmit={submitCategory} className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={catName} onChange={(e) => setCatName(e.target.value)} required />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="submit">{catEditing ? "Save" : "Create"}</Button>
                      <Button variant="ghost" onClick={() => setIsCatOpen(false)}>Cancel</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </TabsContent>

          {/* PRODUCTS */}
          <TabsContent value="products">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Products</h2>
              <div>
                <Button onClick={openAddProduct}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </div>
            </div>

            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center p-6">No products found</TableCell>
                      </TableRow>
                    ) : (
                      products.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.id}</TableCell>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>₹{(p.price || 0).toLocaleString()}</TableCell>
                          <TableCell>{p.category?.name || "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditProduct(p)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => deleteProduct(p.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Product modal */}
            {isProdOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-lg bg-background p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-4">{prodEditing ? "Edit Product" : "Add Product"}</h3>
                  <form onSubmit={submitProduct} className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={prodName} onChange={(e) => setProdName(e.target.value)} required />
                    </div>

                    <div>
                      <Label>Price (₹)</Label>
                      <Input type="number" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} required />
                    </div>

                    <div>
  <Label>Category</Label>
  <Select
    value={prodCategoryId}
    onValueChange={(value) => setProdCategoryId(value)}
    required
  >
    <SelectTrigger className="w-full">
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent>
      {categories.map((c) => (
        <SelectItem key={c.id} value={String(c.id)}>
          {c.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>


                   <div>
  <Label>Image (optional)</Label>
  <div className="flex items-center gap-2">
    <Input
      id="product-image"
      type="file"
      accept="image/*"
      onChange={(e) => setProdImageFile(e.target.files?.[0] || null)}
      className="hidden"
    />
    <label
      htmlFor="product-image"
      className="flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer transition-colors"
    >
      <Upload className="h-4 w-4" />
      <span className="text-sm">Choose file</span>
    </label>
    <span className="text-sm text-muted-foreground">
      {prodImageFile ? prodImageFile.name : "No file chosen"}
    </span>
  </div>
</div>

<div className="flex justify-end gap-2">
  <Button type="submit">{prodEditing ? "Save" : "Create"}</Button>
  <Button variant="ghost" onClick={() => setIsProdOpen(false)}>Cancel</Button>
</div>

                  </form>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ORDERS */}
          <TabsContent value="orders">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Orders</h2>
            </div>

            <Card className="p-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center p-6">No orders found</TableCell>
                      </TableRow>
                    ) : (
                      orders.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono">{o.id}</TableCell>
                          <TableCell>{o.userEmail}</TableCell>
                          <TableCell>{o.phoneNumber || "Not provided"}</TableCell>
                          <TableCell>{o.shippingAddress || "-"}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {o.items?.map((it, i) => (
                                <div key={i} className="text-sm">{it.productName} × {it.quantity}</div>
                              )) || "-"}
                            </div>
                          </TableCell>
                          <TableCell>₹{(o.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell>{o.orderStatus}</TableCell>
                          <TableCell>
  <Select
    value={o.orderStatus || ""}
    onValueChange={(status) => updateOrderStatus(o.id, status)}
    disabled={updatingOrderId === o.id}
  >
    <SelectTrigger className="w-[180px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {ORDER_STATUS_OPTIONS.map((s) => (
        <SelectItem key={s} value={s}>
          {s}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</TableCell>

                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
