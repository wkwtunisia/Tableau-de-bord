import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const initial = {
  ref: "", designation: "", prixUnitaire: "", localisation: "",
  delaiAppro: "", transitTime: "", traitementCde: "",
  stockMin: "", stockActuel: "", cmj: "",
  stockRoulement: "", nouveauStockMin: "",
};

export default function ProductForm({ onSaved }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const n = (v) => parseFloat(v) || 0;

  const stockMinPropose = Math.ceil(
    n(form.cmj) * (n(form.delaiAppro) + n(form.transitTime) + n(form.traitementCde))
  );
  const nouveauMin = form.nouveauStockMin === "" ? stockMinPropose : n(form.nouveauStockMin);
  const valeurAncien = n(form.stockMin) * n(form.prixUnitaire);
  const valeurNouveau = nouveauMin * n(form.prixUnitaire);

  const fmt = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.ref.trim() || !form.designation.trim()) {
      setMsg("⚠️ Réf et Désignation sont obligatoires.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await addDoc(collection(db, "products"), {
        ref: form.ref.trim(),
        designation: form.designation.trim(),
        prixUnitaire: n(form.prixUnitaire),
        localisation: form.localisation.trim(),
        delaiAppro: n(form.delaiAppro),
        transitTime: n(form.transitTime),
        traitementCde: n(form.traitementCde),
        stockMin: n(form.stockMin),
        stockActuel: n(form.stockActuel),
        cmj: n(form.cmj),
        stockMinPropose,
        stockRoulement: n(form.stockRoulement),
        nouveauStockMin: nouveauMin,
        valeurAncienStockMin: valeurAncien,
        valeurNouveauStockMin: valeurNouveau,
        createdAt: serverTimestamp(),
      });
      setForm(initial);
      setMsg("✅ Produit enregistré avec succès.");
      onSaved?.();
    } catch (err) {
      console.error(err);
      setMsg("❌ Erreur : " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="product-form" onSubmit={submit}>
      <h2>➕ Enregistrer un produit</h2>
      <div className="grid-3">
        <div className="field">
          <label>Réf *</label>
          <input value={form.ref} onChange={set("ref")} placeholder="REF-001" required />
        </div>
        <div className="field span-2">
          <label>Désignation *</label>
          <input value={form.designation} onChange={set("designation")} placeholder="Ex : Vis M4 x 20 mm" required />
        </div>
        <div className="field">
          <label>Prix Unitaire (€)</label>
          <input type="number" step="0.01" min="0" value={form.prixUnitaire} onChange={set("prixUnitaire")} />
        </div>
        <div className="field">
          <label>Localisation</label>
          <input value={form.localisation} onChange={set("localisation")} placeholder="Rayon A3" />
        </div>
        <div className="field">
          <label>Délai d'appro (jours)</label>
          <input type="number" min="0" value={form.delaiAppro} onChange={set("delaiAppro")} />
        </div>
        <div className="field">
          <label>Transit time (jours)</label>
          <input type="number" min="0" value={form.transitTime} onChange={set("transitTime")} />
        </div>
        <div className="field">
          <label>Traitement de cde (jours)</label>
          <input type="number" min="0" value={form.traitementCde} onChange={set("traitementCde")} />
        </div>
        <div className="field">
          <label>CMJ</label>
          <input type="number" step="0.01" min="0" value={form.cmj} onChange={set("cmj")} />
        </div>
        <div className="field">
          <label>Stock min</label>
          <input type="number" min="0" value={form.stockMin} onChange={set("stockMin")} />
        </div>
        <div className="field">
          <label>Stock actuel</label>
          <input type="number" min="0" value={form.stockActuel} onChange={set("stockActuel")} />
        </div>
        <div className="field">
          <label>Stock de roulement</label>
          <input type="number" min="0" value={form.stockRoulement} onChange={set("stockRoulement")} />
        </div>
        <div className="field">
          <label>Stock min proposé (auto)</label>
          <input value={stockMinPropose} readOnly className="ro" />
        </div>
        <div className="field">
          <label>Nouveau stock min</label>
          <input type="number" min="0" value={form.nouveauStockMin} onChange={set("nouveauStockMin")} placeholder={String(stockMinPropose)} />
        </div>
        <div className="field">
          <label>Valeur ancien stock min</label>
          <input value={fmt(valeurAncien)} readOnly className="ro" />
        </div>
        <div className="field">
          <label>Valeur nouveau stock min</label>
          <input value={fmt(valeurNouveau)} readOnly className="ro" />
        </div>
      </div>

      {msg && <div className="form-msg">{msg}</div>}

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={() => setForm(initial)}>Réinitialiser</button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Enregistrement..." : "💾 Enregistrer"}
        </button>
      </div>
    </form>
  );
}
