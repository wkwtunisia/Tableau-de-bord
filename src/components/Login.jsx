import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      console.error(err);
      setError("❌ Email ou mot de passe incorrect.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-logo">📦</div>
        <h1>Gestion de Stock</h1>
        <p className="login-sub">Connectez-vous à votre espace admin</p>

        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@exemple.com" required autoComplete="username" />

        <label>Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••" required autoComplete="current-password" />

        {error && <div className="login-error">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
