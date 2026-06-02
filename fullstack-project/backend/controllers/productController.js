const productModel = require("../models/productModel");

async function getProducts(req, res) {
  try {
    const products = await productModel.getAllProducts();
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function createProduct(req, res) {
  try {
    const { name, price, stock, category } = req.body;
    const createdBy = req.user.id;

    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "name, price and stock are required",
      });
    }

    const product = await productModel.createProduct({
      name,
      price,
      stock,
      category,
      created_by: createdBy,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  getProducts,
  createProduct,
};
