import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from "firebase/firestore";

export default function ProductList({ refreshKey }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [refreshKey]);

  const remove = async (id, ref) => {
    if (!confirm(`Supprimer le produit « ${ref} » ?`)) return;
    await deleteDoc(doc(db, "products", id));
  };

  const fmt = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);

  if (!products.length)
    return <div className="empty">Aucun produit enregistré pour le moment.</div>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Réf</th><th>Désignation</th><th>Localisation</th>
            <th className="num">Prix U.</th><th className="num">Stock actuel</th>
            <th className="num">Stock min</th><th className="num">Nouv. min</th>
            <th className="num">Valeur nouv.</th><th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const alert = (p.stockActuel || 0) <= (p.stockMin || 0);
            return (
              <tr key={p.id} className={alert ? "row-alert" : ""}>
                <td><b>{p.ref}</b></td>
                <td>{p.designation}</td>
                <td>{p.localisation || "—"}</td>
                <td className="num">{fmt(p.prixUnitaire)}</td>
                <td className="num">{p.stockActuel ?? 0}</td>
                <td className="num">{p.stockMin ?? 0}</td>
                <td className="num">{p.nouveauStockMin ?? 0}</td>
                <td className="num">{fmt(p.valeurNouveauStockMin)}</td>
                <td>
                  <button className="btn-del" onClick={() => remove(p.id, p.ref)}>🗑</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
