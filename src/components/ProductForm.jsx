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
  unite: "pcs",
  stockMin: "",
  stockActuel: "",
  commentaire: "",
  consoMoyMensuel: "",     // ← peut être négatif
  valeurConsoEUR: "",      // ← peut être négatif
  tauxChangeConso: "3.4",
};

export default function ProductForm({ onSaved }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // 🔒 Nombre NON signé (≥ 0) — prix, stock, délais, taux
  const n = (v) => Math.max(0, parseFloat(v) || 0);

  // 🔓 Nombre SIGNÉ (accepte négatif) — conso qté + valeur conso EUR
  const sn = (v) => {
    const num = parseFloat(v);
    return isNaN(num) ? 0 : num;
  };

  /* ---------- Prix d'achat ---------- */
  const prixAchat = n(form.prixAchat);
  const prixAchatEUR = prixAchat;

  /* ---------- Stock ---------- */
  const stockMin = n(form.stockMin);
  const stockActuel = n(form.stockActuel);
  const valeurStockMin = stockMin * prixAchatEUR;
  const stockMinAtteint = stockMin > 0 && stockActuel <= stockMin;

  /* ---------- Consommation mensuelle ---------- */
  // ⚠️ Qté peut être négative
  const besoinMensuel = sn(form.consoMoyMensuel);
  // Couverture : gérée uniquement si besoin > 0
  const couvertureStockMin = besoinMensuel > 0 ? (stockMin / besoinMensuel) * 30 : 0;

  // ⚠️ Valeur conso EUR : peut être négative
  const valeurConsoMoyEUR = sn(form.valeurConsoEUR);
  const tauxConso = n(form.tauxChangeConso) || 1;
  // ⚠️ TND : préserve le signe
  const valeurConsoMoyTND = valeurConsoMoyEUR * tauxConso;

  /* ---------- Formatters ---------- */
  const fmtEURsigned = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v || 0);
  const fmtTNDsigned = (v) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "TND" }).format(v || 0);
  const fmtNumSigned = (v) =>
    new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(v || 0);

  // Non signé (pour les champs toujours positifs)
  const fmtEUR = (v) => fmtEURsigned(Math.max(0, v) || 0);

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
        reference: form.reference.trim(),
        produit: form.produit.trim(),
        affectation: form.affectation.trim(),
        designation: form.designation.trim(),
        fournisseur: form.fournisseur.trim(),
        localisation: form.localisation.trim(),
        unite: form.unite.trim() || "pcs",
        commentaire: form.commentaire.trim(),

        delaiAppro: form.delaiAppro.trim(),
        delaiApproJours: n(form.delaiApproJours),

        prixAchat,
        prixAchatEUR,

        stockMin,
        stockActuel,
        valeurStockMin,
        couvertureStockMin,
        besoinMensuel,              // peut être négatif
        stockMinAtteint,

        consoMoyMensuel: besoinMensuel,   // peut être négatif
        valeurConsoMoyEUR,                // peut être négatif
        tauxChangeConso: tauxConso,
        valeurConsoMoyTND,                // peut être négatif

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
          <label>Prix d'achat (EUR)</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={form.prixAchat}
            onChange={set("prixAchat")}
            placeholder="0.0000"
          />
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
          <input value={fmtNumSigned(couvertureStockMin) + " jours"} readOnly className="ro" />
        </div>
        <div className="field">
          <label>Besoin mensuel (auto)</label>
          <input
            value={fmtNumSigned(besoinMensuel)}
            readOnly
            className={"ro " + (besoinMensuel < 0 ? "ro-negative" : "")}
          />
        </div>
        <div className="field span-2">
          <label>Commentaire</label>
          <input value={form.commentaire} onChange={set("commentaire")} placeholder="Observation, note interne..." />
        </div>
      </div>

      {/* ---------- SECTION 4 : Consommation mensuelle ---------- */}
      <h3 className="section-title">📊 Consommation moyenne mensuelle (M)</h3>
      <div className="grid-3">
        {/* ✅ Qté : accepte + et − */}
        <div className="field">
          <label>Consommation moyenne mensuelle (qté) (+ ou −)</label>
          <input
            type="number"
            step="0.01"
            value={form.consoMoyMensuel}
            onChange={set("consoMoyMensuel")}
            placeholder="Ex : 250 ou -50"
          />
        </div>

        {/* ✅ Valeur EUR : accepte + et − */}
        <div className="field">
          <label>Valeur conso moyenne en EUR (+ ou −)</label>
          <input
            type="number"
            step="0.01"
            value={form.valeurConsoEUR}
            onChange={set("valeurConsoEUR")}
            placeholder="Ex : -396.74 ou 1500.00"
          />
        </div>

        <div className="field">
          <label>Taux de change — conso (1 EUR = ? TND)</label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={form.tauxChangeConso}
            onChange={set("tauxChangeConso")}
          />
        </div>

        <div className="field">
          <label>Valeur conso moyenne en TND (auto)</label>
          <input
            value={fmtTNDsigned(valeurConsoMoyTND)}
            readOnly
            className={"ro " + (valeurConsoMoyTND < 0 ? "ro-negative" : "")}
          />
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
