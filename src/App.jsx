import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="loader">
        <div className="spinner" />
        <p>Chargement...</p>
      </div>
    );

  return user ? <Dashboard /> : <Login />;
}
