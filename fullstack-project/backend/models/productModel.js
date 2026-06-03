const db = require("../db");

async function getAllProducts() {
  const { rows } = await db.query(
    "SELECT id, name, price, stock, category, created_by FROM products ORDER BY id DESC"
  );
  return rows;
}

async function createProduct({ name, price, stock, category, created_by }) {
  const { rows: result } = await db.query(
    "INSERT INTO products (name, price, stock, category, created_by) VALUES (?, ?, ?, ?, ?)",
    [name, price, stock, category || null, created_by]
  );

  return {
    id: result.insertId,
    name,
    price,
    stock,
    category: category || null,
    created_by,
  };
}

module.exports = {
  getAllProducts,
  createProduct,
};
