import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
      {/* Hero Section */}
      <div className="container-custom py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to <span style={{ color: "#2C5BBB" }}>Bambite</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Your favorite Asian cuisine delivered fresh to your doorstep
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="btn-primary text-lg px-8 py-3 inline-block"
            >
              Browse Menu
            </Link>
            <Link
              href="/register"
              className="btn-secondary text-lg px-8 py-3 inline-block"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">🍜</div>
            <h3 className="text-xl font-semibold mb-2">Fresh Ingredients</h3>
            <p className="text-gray-600">
              We use only the freshest ingredients in all our dishes
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">
              Get your food delivered hot and fresh in under 30 minutes
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-semibold mb-2">Quality Service</h3>
            <p className="text-gray-600">
              100% satisfaction guaranteed or your money back
            </p>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-10">
            Our Menu Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link
              href="/products?category=SOUP"
              className="card p-6 text-center hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-3">🍲</div>
              <h3 className="text-lg font-semibold">Soups</h3>
            </Link>
            <Link
              href="/products?category=SALAD"
              className="card p-6 text-center hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-3">🥗</div>
              <h3 className="text-lg font-semibold">Salads</h3>
            </Link>
            <Link
              href="/products?category=NOODLE"
              className="card p-6 text-center hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-3">🍜</div>
              <h3 className="text-lg font-semibold">Noodles</h3>
            </Link>
            <Link
              href="/products?category=SNACK"
              className="card p-6 text-center hover:scale-105 transition-transform"
            >
              <div className="text-5xl mb-3">🍱</div>
              <h3 className="text-lg font-semibold">Snacks</h3>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
