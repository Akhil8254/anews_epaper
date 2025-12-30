import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

/* ================= STORAGE HELPER ================= */
const uploadImageToStorage = async (file) => {
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `articles/${fileName}`;

  const { error } = await supabase.storage
    .from("epaper-images")
    .upload(filePath, file);

  if (error) throw error;

  const { data } = supabase.storage
    .from("epaper-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/* ================= ADMIN LOGIN (SUPABASE AUTH) ================= */
function AdminLogin() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    });

    if (error) {
      setError(error.message);
    }
    // ✅ NO manual state change here (FIX 2)
  };

  return (
    <div className="admin login">
      <h2>Admin Login</h2>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Admin Email"
      />

      <input
        type="password"
        value={pwd}
        onChange={(e) => setPwd(e.target.value)}
        placeholder="Password"
      />

      <button onClick={handleLogin}>Login</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

/* ================= ADMIN PANEL ================= */
function AdminPanel({ pages, reloadPages, onClose }) {
  const [newTitle, setNewTitle] = useState("");
 const [selectedPage, setSelectedPage] = useState("");

  const [article, setArticle] = useState({ img: "", title: "", text: "" });



  const addLayout = async () => {
  if (!newTitle) return;

  const { error } = await supabase
    .from("layouts")
    .insert([{ title: newTitle }]);

  if (error) {
    alert("Add layout failed: " + error.message);
    return;
  }

  setNewTitle("");
  await reloadPages();

};


  const deleteLayout = async (id) => {
    if (!window.confirm("Delete this layout?")) return;

    const { error } = await supabase.from("layouts").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    reloadPages();
  };

 const addArticle = async () => {
  if (!selectedPage) {
    alert("Please select a layout first");
    return;
  }

  if (!article.title || !article.text || !article.img) return;

  const { error } = await supabase.from("articles").insert([
    {
      layout_id: selectedPage, // ✅ DIRECT ID
      title: article.title,
      text: article.text,
      img: article.img,
    },
  ]);

  if (error) {
    alert(error.message);
    return;
  }

  setArticle({ img: "", title: "", text: "" });
  reloadPages();
};


  const deleteArticle = async (id) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    reloadPages();
  };

  return (
    <div className="admin">
      <h2>Admin Panel</h2>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          onClose();
        }}
      >
        Logout
      </button>

      <hr />

      <input
        placeholder="New Layout Title"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
      />
      <button onClick={addLayout}>➕ Add Layout</button>

      <hr />

      {pages.map((p) => (
        <div key={p.id} className="delete-row">
          <b>{p.title}</b>
          <button onClick={() => deleteLayout(p.id)}>🗑</button>
        </div>
      ))}

      <hr />

      <select
  value={selectedPage}
  onChange={(e) => setSelectedPage(e.target.value)}
>
  <option value="" disabled>
    Select layout
  </option>

  {pages.map((p) => (
    <option key={p.id} value={p.id}>
      {p.title}
    </option>
  ))}
</select>


      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const url = await uploadImageToStorage(file);
          setArticle({ ...article, img: url });
        }}
      />

      {article.img && <img src={article.img} alt="" width={120} />}

      <input
        placeholder="Article Title"
        value={article.title}
        onChange={(e) => setArticle({ ...article, title: e.target.value })}
      />

      <textarea
        placeholder="Article Text"
        value={article.text}
        onChange={(e) => setArticle({ ...article, text: e.target.value })}
      />

      <button onClick={addArticle}>➕ Add Article</button>

      {pages
  .find((p) => p.id === selectedPage)
  ?.articles?.map((a) => (
    <div key={a.id} className="delete-row">
      {a.title}
      <button onClick={() => deleteArticle(a.id)}>🗑</button>
    </div>
))}

    </div>
  );
}

/* ================= MAIN APP ================= */
export default function App() {
  const [pages, setPages] = useState([]);
  const [current, setCurrent] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadPages = useCallback(async () => {
    const { data } = await supabase
      .from("layouts")
      .select(
        `id, title, articles (id, title, text, img, created_at)`
      )
      .order("id", { ascending: true });

    setPages(data || []);
  }, []);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  /* ================= SESSION CONFIRMATION (FIX 3) ================= */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setShowAdmin(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);
  /* =============================================================== */

  useEffect(() => {
    if (window.location.hash === "#/ANEWS-x9Qm25-SEC-admin") {
      setShowAdmin(true);
    }
  }, []);

  const currentPage = pages[current];

  return (
    <div className="app">
      <header className="header">
        <img src="pages/header.jpg" alt="Header" className="header-photo" />
        <h1 className="title">ANEWS E-PAPER</h1>
      </header>

      <nav className="navbar">
        <button className="nav-link active">Home</button>
        <div className="nav-date">
          {new Date().toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      </nav>

      <main className="viewer-area">
       {showAdmin && isLoggedIn ? (
 <AdminPanel
  pages={pages}
  reloadPages={loadPages}
  onClose={() => {
    setShowAdmin(false);
    setIsLoggedIn(false);
    window.location.hash = "";
  }}
/>


        ) : showAdmin ? (
          <AdminLogin />
        ) : (
          currentPage && (
            <section className="viewer">
              <div className="page-bar">
                <button
                  onClick={() =>
                    setCurrent((c) => (c - 1 + pages.length) % pages.length)
                  }
                >
                  ◀ Prev
                </button>

                <p>
                  Page {current + 1} / {pages.length}
                </p>

                <button
                  onClick={() =>
                    setCurrent((c) => (c + 1) % pages.length)
                  }
                >
                  Next ▶
                </button>
              </div>

              <h2>{currentPage.title}</h2>

              <div className="page-grid">
                {[...(currentPage.articles || [])]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at) - new Date(a.created_at)
                  )
                  .map((a) => (
                    <div key={a.id} className="article-box">
                      <img src={a.img} alt={a.title} />
                      <h3>{a.title}</h3>
                      <p>{a.text}</p>
                    </div>
                  ))}
              </div>
            </section>
          )
        )}
      </main>

      <footer className="footer">
        <p>Thanks for visiting ANEWS E-Paper</p>
      </footer>
    </div>
  );
}