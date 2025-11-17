import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sofa, Armchair, Bed, Lamp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Category {
  id: number;
  name: string;
  description: string;
  products?: any[];
}

// ✅ Function to return the right icon for each category
const getCategoryIcon = (name: string) => {
  switch (name.toLowerCase()) {
    case 'sofa':
      return <Sofa className="w-8 h-8" />;
    case 'chair':
      return <Armchair className="w-8 h-8" />;
    case 'bed':
      return <Bed className="w-8 h-8" />;
    case 'lamp':
      return <Lamp className="w-8 h-8" />;
    default:
      return <ArrowRight className="w-8 h-8" />;
  }
};

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const data = Array.isArray(res.data) ? res.data : res.data.content || [];
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse by Category</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find the perfect furniture for every room in your home
          </p>
        </div>

        {/* ✅ Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* ✅ Redirects to Products page filtered by category */}
              <Link to={`/products?category=${category.id}`}>
                <Card className="group relative overflow-hidden p-8 transition-all hover:shadow-xl border-2 hover:border-primary h-full flex flex-col">
  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
    {getCategoryIcon(category.name)}
  </div>
  <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
  <p className="text-muted-foreground mb-4 flex-grow">{category.description}</p>
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
      Browse →
    </span>
  </div>
</Card>

              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
