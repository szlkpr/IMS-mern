import { useState } from "react";
import apiClient from "../api";

export default function AddProduct({ onAdd }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    retailPrice: "",
    wholesalePrice: "",
    wholesaleThreshold: "",
    stock: "",
    category: "",
    barcode: ""
  });
  const [message, setMessage] = useState("");

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
  e.preventDefault();
  setMessage("Adding...");
  try {
    await apiClient.post("/products", form);
    setMessage("Product added!");
    setForm({
        name: "",
        description: "",
        retailPrice: "",
        wholesalePrice: "",
        wholesaleThreshold: "",
        stock: "",
        category: "",
        barcode: ""
      });
    if (onAdd) onAdd();
  } catch (error) {
    console.error("Error adding product:", error);
    setMessage(error.response?.data?.message || "Error adding product");
  }
};

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "2rem" }}>
      <h3>Add Product</h3>
      <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
      <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
      <input type="number" min="0" step="0.01" name="retailPrice" placeholder="Retail Price" value={form.retailPrice} onChange={handleChange} required />
      <input type="number" min="0" step="0.01" name="wholesalePrice" placeholder="Wholesale Price" value={form.wholesalePrice} onChange={handleChange} required />
      <input type="number" min="0" name="wholesaleThreshold" placeholder="Wholesale Threshold" value={form.wholesaleThreshold} onChange={handleChange} required />
      <input type="number" min="0" name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} required />
      <input name="category" placeholder="Category" value={form.category} onChange={handleChange} />
      <input name="barcode" placeholder="Barcode" value={form.barcode} onChange={handleChange} />
      <button type="submit">Add</button>
      <div>{message}</div>
    </form>
  );
}