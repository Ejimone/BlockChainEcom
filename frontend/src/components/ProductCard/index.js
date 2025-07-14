import Image from "next/image";

const ProductCard = ({ product }) => {
  return (
    <div className="border rounded-lg p-4 shadow-lg">
      <Image
        src={product.image}
        alt={product.name}
        width={300}
        height={300}
        className="w-full h-48 object-cover mb-4 rounded"
      />
      <h2 className="text-xl font-bold">{product.name}</h2>
      <p className="text-gray-500">{product.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-lg font-bold">${product.price}</span>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
