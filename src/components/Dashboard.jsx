import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="dash">
      <header className="dash-header">
        <div>
          <h1>📦 Tableau de bord — Stock</h1>
          <p className="dash-user">
            Connecté : <b>{user?.email}</b>{" "}
            <span className={isAdmin ? "role-badge role-admin" : "role-badge role-user"}>
              {isAdmin ? "ADMIN" : "UTILISATEUR"}
            </span>
          </p>
        </div>
        <button className="btn-logout" onClick={logout}>Déconnexion</button>
      </header>

      {/* ⚠️ Bannière info pour les non-admins */}
      {!isAdmin && (
        <div className="banner-info">
          👁️ <b>Mode lecture seule</b> — Vous pouvez consulter le stock mais pas le modifier.
        </div>
      )}

      {/* 📝 Formulaire réservé aux admins */}
      {isAdmin && (
        <section className="card">
          <ProductForm onSaved={() => setRefreshKey((k) => k + 1)} />
        </section>
      )}

      <section className="card">
        <h2>📋 Liste des produits</h2>
        <ProductList refreshKey={refreshKey} isAdmin={isAdmin} />
      </section>
    </div>
  );
}
