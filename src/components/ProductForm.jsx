import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const initial = {
  reference: "",
  produit: "",
  affectation: "",
  designation: "",
  fournisseur: "",
  localisation: "",
  delaiAppro: "",
  delaiApproJours: "",
  prixAchat: "",
  devise: "EUR",
  tauxChange: "3.4",
  unite: "pcs",
  stockMin: "",
  stockActuel: "",
  commentaire: "",
  consoMoyMensuel: "",
};

const DEVISES = ["EUR", "TND", "USD"];

export default function ProductForm({ onSaved }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const n = (v) => parseFloat(v) || 0;

  /* ---------- Calculs automatiques ---------- */
  const taux = n(form.tauxChange) || 1;
  const prixAchatEUR =
    form.devise === "EUR" ? n(form.prixAchat)
    : form.devise === "TND" ? n(form.prixAchat) / taux
    : n(form.prixAchat) * taux;

  const valeurStockMin = n(form.stockMin) * prixAchatEUR;
  const besoinMensuel = n(form.consoMoyMensuel);
  const couvertureStockMin =
    besoinMensuel > 0 ? (n(form.stockMin) / besoinMensuel) * 30 : 0; // en jours
  const valeurConsoMoyEUR = besoinMensuel * prixAchatEUR;
  const valeurConsoMoyTND = valeurConsoMoyEUR * taux;
  const stockMinAtteint = n(form.stockActuel) <= n(form.stockMin) && n(form.stockMin) > 0;

  const fmtEUR = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);
  const fmtTND = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "TND" }).format(v || 0);
  const fmtNum = (v) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v || 0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.reference.trim() || !form.designation.trim()) {
      setMsg("⚠️ Référence et Désignation sont obligatoires.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await addDoc(collection(db, "products"), {
        // Identification
        reference: form.reference.trim(),
        produit: form.produit.trim(),
        affectation: form.affectation.trim(),
        designation: form.designation.trim(),
        fournisseur: form.fournisseur.trim(),
        localisation: form.localisation.trim(),
        unite: form.unite.trim() || "pcs",
        commentaire: form.commentaire.trim(),

        // Délais
        delaiAppro: form.delaiAppro.trim(),
        delaiApproJours: n(form.delaiApproJours),

        // Prix & devise
        prixAchat: n(form.prixAchat),
        devise: form.devise,
        tauxChange: taux,
        prixAchatEUR: prixAchatEUR,

        // Stock
        stockMin: n(form.stockMin),
        stockActuel: n(form.stockActuel),
        valeurStockMin: valeurStockMin,
        couvertureStockMin: couvertureStockMin,
        besoinMensuel: besoinMensuel,
        stockMinAtteint: stockMinAtteint,

        // Consommation
        consoMoyMensuel: besoinMensuel,
        valeurConsoMoyEUR: valeurConsoMoyEUR,
        valeurConsoMoyTND: valeurConsoMoyTND,

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

      {/* ---------- SECTION 1 : Identification ---------- */}
      <h3 className="section-title">🏷️ Identification</h3>
      <div className="grid-3">
        <div className="field">
          <label>Référence *</label>
          <input value={form.reference} onChange={set("reference")} placeholder="REF-001" required />
        </div>
        <div className="field">
          <label>Produit</label>
          <input value={form.produit} onChange={set("produit")} placeholder="Famille / Type" />
        </div>
        <div className="field">
          <label>Affectation</label>
          <input value={form.affectation} onChange={set("affectation")} placeholder="Ligne / Atelier" />
        </div>
        <div className="field span-2">
          <label>Désignation *</label>
          <input value={form.designation} onChange={set("designation")} placeholder="Ex : Vis M4 x 20 mm" required />
        </div>
        <div className="field">
          <label>Unité</label>
          <input value={form.unite} onChange={set("unite")} placeholder="pcs / kg / L" />
        </div>
        <div className="field">
          <label>Fournisseur</label>
          <input value={form.fournisseur} onChange={set("fournisseur")} placeholder="Nom du fournisseur" />
        </div>
        <div className="field span-2">
          <label>Localisation</label>
          <input value={form.localisation} onChange={set("localisation")} placeholder="Rayon A3 / Zone B" />
        </div>
      </div>

      {/* ---------- SECTION 2 : Délais & Prix ---------- */}
      <h3 className="section-title">⏱️ Délais & Prix d'achat</h3>
      <div className="grid-3">
        <div className="field">
          <label>Délai d'appro (texte)</label>
          <input value={form.delaiAppro} onChange={set("delaiAppro")} placeholder="Ex : 2 semaines" />
        </div>
        <div className="field">
          <label>Délai d'appro (jours)</label>
          <input type="number" min="0" value={form.delaiApproJours} onChange={set("delaiApproJours")} placeholder="14" />
        </div>
        <div className="field">
          <label>Prix d'achat</label>
          <input type="number" step="0.01" min="0" value={form.prixAchat} onChange={set("prixAchat")} placeholder="0.00" />
        </div>
        <div className="field">
          <label>Devise</label>
          <select value={form.devise} onChange={set("devise")}>
            {DEVISES.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Taux de change (1 EUR = ?)</label>
          <input type="number" step="0.0001" min="0" value={form.tauxChange} onChange={set("tauxChange")} />
        </div>
        <div className="field">
          <label>Prix d'achat converti en EUR (auto)</label>
          <input value={fmtEUR(prixAchatEUR)} readOnly className="ro" />
        </div>
      </div>

      {/* ---------- SECTION 3 : Stock ---------- */}
      <h3 className="section-title">📦 Stock</h3>
      <div className="grid-3">
        <div className="field">
          <label>Stock min</label>
          <input type="number" min="0" value={form.stockMin} onChange={set("stockMin")} />
        </div>
        <div className="field">
          <label>Stock actuel</label>
          <input type="number" min="0" value={form.stockActuel} onChange={set("stockActuel")} />
        </div>
        <div className="field">
          <label>Stock min atteint ? (auto)</label>
          <input
            value={stockMinAtteint ? "🔴 OUI" : "🟢 NON"}
            readOnly
            className={"ro " + (stockMinAtteint ? "ro-alert" : "ro-ok")}
          />
        </div>
        <div className="field">
          <label>Valeur stock min (auto)</label>
          <input value={fmtEUR(valeurStockMin)} readOnly className="ro" />
        </div>
        <div className="field">
          <label>Couverture de stock min (auto)</label>
          <input value={fmtNum(couvertureStockMin) + " jours"} readOnly className="ro" />
        </div>
        <div className="field">
          <label>Besoin mensuel (auto)</label>
          <input value={fmtNum(besoinMensuel)} readOnly className="ro" />
        </div>
        <div className="field span-2">
          <label>Commentaire</label>
          <input value={form.commentaire} onChange={set("commentaire")} placeholder="Observation, note interne..." />
        </div>
      </div>

      {/* ---------- SECTION 4 : Consommation mensuelle ---------- */}
      <h3 className="section-title">📊 Consommation moyenne mensuelle (M)</h3>
      <div className="grid-3">
        <div className="field">
          <label>Consommation moyenne mensuelle (qté)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.consoMoyMensuel}
            onChange={set("consoMoyMensuel")}
            placeholder="Ex : 250"
          />
        </div>
        <div className="field">
          <label>Valeur conso moyenne en EUR (auto)</label>
          <input value={fmtEUR(valeurConsoMoyEUR)} readOnly className="ro" />
        </div>
        <div className="field">
          <label>Valeur conso moyenne en TND (auto)</label>
          <input value={fmtTND(valeurConsoMoyTND)} readOnly className="ro" />
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
