import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc, query, orderBy } from "firebase/firestore";

function getStatus(p) {
  const s = +p.stockActuel || 0;
  const m = +p.stockMin || 0;
  if (s <= 0) return { key: "rupture", label: "Rupture", cls: "badge-red", bar: "#dc2626" };
  if (m > 0 && s <= m) return { key: "alerte", label: "À commander", cls: "badge-orange", bar: "#ea580c" };
  if (m > 0 && s <= m * 1.3) return { key: "vigilance", label: "Vigilance", cls: "badge-yellow", bar: "#eab308" };
  return { key: "ok", label: "OK", cls: "badge-green", bar: "#16a34a" };
}

export default function ProductList({ refreshKey, isAdmin }) {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [refreshKey]);

  const remove = async (id, ref) => {
    if (!isAdmin) return;
    if (!confirm(`Supprimer le produit « ${ref} » ?`)) return;
    await deleteDoc(doc(db, "products", id));
  };

  const fmtEUR = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);
  const fmtNum = (v) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v || 0);

  const filtered = filter
    ? products.filter((p) => getStatus(p).key === filter)
    : products;

  const ruptures = products.filter((p) => getStatus(p).key === "rupture").length;
  const alertes = products.filter((p) => ["rupture", "alerte"].includes(getStatus(p).key)).length;
  const ok = products.filter((p) => getStatus(p).key === "ok").length;

  if (!products.length)
    return <div className="empty">Aucun produit enregistré pour le moment.</div>;

  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-lab">Articles</div>
          <div className="kpi-val">{products.length}</div>
        </div>
        <div className="kpi kpi-red">
          <div className="kpi-lab">Ruptures</div>
          <div className="kpi-val">{ruptures}</div>
        </div>
        <div className="kpi kpi-orange">
          <div className="kpi-lab">À commander</div>
          <div className="kpi-val">{alertes}</div>
        </div>
        <div className="kpi kpi-green">
          <div className="kpi-lab">OK</div>
          <div className="kpi-val">{ok}</div>
        </div>
      </div>

      <div className="filters">
        <button className={filter === "" ? "chip active" : "chip"} onClick={() => setFilter("")}>
          Tous ({products.length})
        </button>
        <button className={filter === "rupture" ? "chip active" : "chip"} onClick={() => setFilter("rupture")}>
          🔴 Rupture ({ruptures})
        </button>
        <button className={filter === "alerte" ? "chip active" : "chip"} onClick={() => setFilter("alerte")}>
          🟠 À commander
        </button>
        <button className={filter === "vigilance" ? "chip active" : "chip"} onClick={() => setFilter("vigilance")}>
          🟡 Vigilance
        </button>
        <button className={filter === "ok" ? "chip active" : "chip"} onClick={() => setFilter("ok")}>
          🟢 OK
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf</th>
              <th>Désignation</th>
              <th className="hide-sm">Produit / Affectation</th>
              <th className="hide-sm">Fournisseur</th>
              <th className="hide-sm">Localisation</th>
              <th className="num hide-sm">Délai (j)</th>
              <th className="num">Prix U. EUR</th>
              <th className="num">Stock min</th>
              <th className="num">Stock actuel</th>
              <th style={{ minWidth: 160 }}>Niveau</th>
              <th className="num hide-sm">Valeur min</th>
              <th className="hide-sm">Statut</th>
              <th className="hide-sm">Min atteint</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const st = getStatus(p);
              const s = +p.stockActuel || 0;
              const M = Math.max(+p.stockMin * 2, 1);
              const pct = Math.min(100, Math.max(0, (s / M) * 100));
              const minPct = Math.min(100, ((+p.stockMin || 0) / M) * 100);
              return (
                <tr key={p.id} className={st.key === "rupture" ? "row-alert" : ""}>
                  <td><b>{p.reference}</b></td>
                  <td>
                    <div className="pname">{p.designation}</div>
                    <div className="pcat">{p.unite || ""}</div>
                  </td>
                  <td className="hide-sm">
                    <div>{p.produit || "—"}</div>
                    <div className="pcat">{p.affectation || ""}</div>
                  </td>
                  <td className="hide-sm">{p.fournisseur || "—"}</td>
                  <td className="hide-sm">{p.localisation || "—"}</td>
                  <td className="num hide-sm">{p.delaiApproJours ?? "—"}</td>
                  <td className="num">{fmtEUR(p.prixAchatEUR)}</td>
                  <td className="num">{p.stockMin ?? 0}</td>
                  <td className="num"><b>{s}</b></td>
                  <td>
                    <div className="bar-wrap">
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: pct + "%", background: st.bar }} />
                        {minPct > 0 && <div className="bar-min-mark" style={{ left: minPct + "%" }} />}
                      </div>
                      <div className="bar-labels">
                        <span>0</span>
                        <span className="bar-min-label">min {p.stockMin ?? 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="num hide-sm">{fmtEUR(p.valeurStockMin)}</td>
                  <td className="hide-sm"><span className={"badge " + st.cls}>{st.label}</span></td>
                  <td className="hide-sm">
                    {p.stockMinAtteint
                      ? <span className="badge badge-red">🔴 OUI</span>
                      : <span className="badge badge-green">🟢 NON</span>}
                  </td>
                  {isAdmin && (
                    <td>
                      <button className="btn-del" onClick={() => remove(p.id, p.reference)}>🗑</button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!filtered.length && <div className="empty">Aucun produit pour ce filtre.</div>}
    </>
  );
}
