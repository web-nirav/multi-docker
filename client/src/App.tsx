import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import OtherPage from "./OtherPage";
import Fib from "./Fib";

import "./App.css";

const App: React.FC = () => {
  return (
    <Router>
      <h1>Vite + React + TypeScript</h1>

      <div className="card">
        <nav>
          <Link to="/">Home</Link> | <Link to="/otherpage">Other Page</Link>
        </nav>
      </div>

      {/* ✅ Routes */}
      <Routes>
        <Route path="/" element={<Fib />} />
        <Route path="/otherpage" element={<OtherPage />} />

        {/* ✅ Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

// ✅ 404 Component (typed)
const NotFound: React.FC = () => (
  <div style={{ textAlign: "center", marginTop: "2rem" }}>
    <h2>404 - Page Not Found</h2>
    <p>Sorry, the page you’re looking for doesn’t exist.</p>
    <Link to="/">Go back Home</Link>
  </div>
);

export default App;
