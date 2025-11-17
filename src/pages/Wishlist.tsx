import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: { id: number; name: string };
}

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const { addToCart } = useCart();

  useEffect(() => {
    const storedWishlist = localStorage.getItem("wishlist");
    if (storedWishlist) {
      setWishlist(JSON.parse(storedWishlist));
    }
  }, []);

  const handleRemove = (id: number) => {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
    toast({ title: "Removed", description: "Product removed from wishlist" });
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      image: `http://localhost:8080/uploads/images/${product.image}`,
    });
    toast({ title: "Added to cart", description: product.name });
  };

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center">
        <Heart className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-6">Your wishlist is empty.</p>
        <Link to="/products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
          <Heart className="text-red-500 h-6 w-6" />
          My Wishlist
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {wishlist.map((product) => (
            <div
              key={product.id}
              className="bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <Link to={`/products/${product.id}`}>
                <img
                  src={`http://localhost:8080/uploads/images/${product.image}`}
                  alt={product.name}
                  className="h-60 w-full object-cover"
                />
              </Link>

              <div className="p-4 space-y-2">
                <h3 className="text-lg font-semibold truncate">{product.name}</h3>
                <p className="text-primary font-bold">₹{product.price.toLocaleString()}</p>

                <div className="flex items-center gap-2 mt-3">
                  <Button
                    className="flex-1"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemove(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
