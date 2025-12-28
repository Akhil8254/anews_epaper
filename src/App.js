import React, { useState, useCallback, useEffect } from "react";
import "./App.css";

/* ================= BASE64 HELPER ================= */
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/* ================= ADMIN LOGIN ================= */
function AdminLogin({ onLogin }) {
  const [id, setId] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (id === "anews@25" && pwd === "ANEWS@1225") {
      onLogin();
    } else {
      setError("Invalid Admin ID or Password");
    }
  };

  return (
    <div className="admin login">
      <h2>Admin Login</h2>
      <input value={id} placeholder="Admin ID" onChange={e => setId(e.target.value)} />
      <input type="password" value={pwd} placeholder="Password" onChange={e => setPwd(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

/* ================= ADMIN PANEL ================= */
function AdminPanel({ pages, setPages, onClose }) {
  const [newTitle, setNewTitle] = useState("");
  const [selectedPage, setSelectedPage] = useState(0);
  const [article, setArticle] = useState({ img: "", title: "", text: "" });

  const addLayout = () => {
    if (!newTitle) return;
    setPages([...pages, { title: newTitle, articles: [] }]);
    setNewTitle("");
  };

  const deleteLayout = (i) => {
    if (!window.confirm("Delete this layout?")) return;
    setPages(pages.filter((_, index) => index !== i));
  };

   /* ✅ ADD ARTICLE (LATEST FIRST + DATE) */
  const addArticle = () => {
    if (!article.title || !article.text || !article.img) return;
    const updated = [...pages];
     updated[selectedPage].articles.unshift({
      ...article,
      createdAt: Date.now()
    });

    setPages(updated);
    setArticle({ img: "", title: "", text: "" });
  };

  const deleteArticle = (i) => {
    const updated = [...pages];
    updated[selectedPage].articles.splice(i, 1);
    setPages(updated);
  };

  return (
    <div className="admin">
      <h2>Admin Panel</h2>
      <button onClick={onClose}>Logout</button>

      <hr />

      <input
        placeholder="New Layout Title"
        value={newTitle}
        onChange={e => setNewTitle(e.target.value)}
      />
      <button onClick={addLayout}>➕ Add Layout</button>

      <hr />

      {pages.map((p, i) => (
        <div key={i} className="delete-row">
          <b>{p.title}</b>
          <button onClick={() => deleteLayout(i)}>🗑</button>
        </div>
      ))}

      <hr />

      <select onChange={e => setSelectedPage(Number(e.target.value))}>
        {pages.map((p, i) => (
          <option key={i} value={i}>{p.title}</option>
        ))}
      </select>

      <input
        type="file"
        accept="image/*"
        onChange={async e => {
          const file = e.target.files[0];
          if (!file) return;
          const base64 = await fileToBase64(file);
          setArticle({ ...article, img: base64 });
        }}
      />

      {article.img && <img src={article.img} alt="" style={{ width: 120 }} />}

      <input
        placeholder="Article Title"
        value={article.title}
        onChange={e => setArticle({ ...article, title: e.target.value })}
      />

      <textarea
        placeholder="Article Text"
        value={article.text}
        onChange={e => setArticle({ ...article, text: e.target.value })}
      />

      <button onClick={addArticle}>➕ Add Article</button>

      {pages[selectedPage]?.articles.map((a, i) => (
        <div key={i} className="delete-row">
          {a.title}
          <button onClick={() => deleteArticle(i)}>🗑</button>
        </div>
      ))}
    </div>
  );
}

/* ================= MAIN APP ================= */
export default function App() {
  const [current, setCurrent] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem("anews-pages");
    return saved ? JSON.parse(saved) : [{ title: "Top Headlines", articles: [] }];
  });

  /* 🔐 SECRET ADMIN URL CHECK */
  useEffect(() => {
    if (window.location.hash === "#/ANEWS-x9Qm25-SEC-admin") {
      setShowAdmin(true);
    }
  }, []);

  /* 💾 AUTO SAVE */
  useEffect(() => {
    localStorage.setItem("anews-pages", JSON.stringify(pages));
  }, [pages]);

  const nextPage = useCallback(
    () => setCurrent(p => (p + 1) % pages.length),
    [pages.length]
  );

  const prevPage = () =>
    setCurrent(p => (p - 1 + pages.length) % pages.length);

  return (
    <div className="app">
      <header className="header">
        <img src="pages/header.jpg" alt="Header" className="header-photo" />
        <h1 className="title">ANEWS E-PAPER</h1>
      </header>

      <nav className="navbar">
        <button className="nav-link active">Home</button>

        {/* ❌ ADMIN BUTTON REMOVED */}

        <div className="nav-date">
          {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          })}
        </div>
      </nav>

      <main className="viewer-area">
        {showAdmin ? (
          isLoggedIn ? (
            <AdminPanel pages={pages} setPages={setPages} onClose={() => setShowAdmin(false)} />
          ) : (
            <AdminLogin onLogin={() => setIsLoggedIn(true)} />
          )
        ) : (
          <section className="viewer">
            <div className="page-bar">
              <button onClick={prevPage}>◀ Prev</button>
              <p>Page {current + 1} / {pages.length}</p>
              <button onClick={nextPage}>Next ▶</button>
            </div>

            <h2>{pages[current].title}</h2>

            <div className="page-grid">
              {[...pages[current].articles]
                 .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                   .map((a, i) => (

                <div key={i} className="article-box">
                  <img src={a.img} alt={a.title} />
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Thanks for visiting ANEWS E-Paper</p>
      </footer>
    </div>
  );
}
