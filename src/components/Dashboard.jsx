import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="dash">
      <header className="dash-header">
        <div>
          <h1>📦 Tableau de bord — Stock</h1>
          <p className="dash-user">Connecté : <b>{user?.email}</b></p>
        </div>
        <button className="btn-logout" onClick={logout}>Déconnexion</button>
      </header>

      <section className="card">
        <ProductForm onSaved={() => setRefreshKey((k) => k + 1)} />
      </section>

      <section className="card">
        <h2>📋 Liste des produits</h2>
        <ProductList refreshKey={refreshKey} />
      </section>
    </div>
  );
}
