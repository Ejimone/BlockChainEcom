import ProductCard from "../ProductCard";

const products = [
  {
    id: 1,
    name: "Sample Product 1",
    description: "This is a sample product.",
    price: "29.99",
    image: "/placeholder.svg",
  },
  {
    id: 2,
    name: "Sample Product 2",
    description: "This is another sample product.",
    price: "39.99",
    image: "/placeholder.svg",
  },
  {
    id: 3,
    name: "Sample Product 3",
    description: "This is a third sample product.",
    price: "49.99",
    image: "/placeholder.svg",
  },
];

const ProductList = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
