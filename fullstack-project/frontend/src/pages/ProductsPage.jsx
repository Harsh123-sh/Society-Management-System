const sampleProducts = [
  { id: 1, name: "Smart Intercom", category: "Security", price: "$120", stock: 14 },
  { id: 2, name: "Water Pump", category: "Utilities", price: "$85", stock: 9 },
  { id: 3, name: "LED Path Lights", category: "Maintenance", price: "$40", stock: 26 },
  { id: 4, name: "Visitor Pass Kit", category: "Admin", price: "$18", stock: 52 },
];

function ProductsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Products</h2>
        <p className="text-sm text-slate-600">Review stock and pricing at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sampleProducts.map((product) => (
          <article
            key={product.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-slate-900">{product.name}</h3>
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                {product.stock} left
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{product.category}</p>
            <p className="mt-4 text-xl font-bold text-slate-900">{product.price}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ProductsPage;
