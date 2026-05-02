import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  // 🔥 prende tutto dal server
  useEffect(() => {
    fetch("/api/gallery")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err));
  }, []);

  if (!data) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Caricamento...</h1>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Museo</h1>

      <div style={styles.grid}>
        {Object.keys(data).map((category) => (
          <div
            key={category}
            style={styles.card}
            onClick={() => navigate(`/gallery/${category}`)}
          >
            {category}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#111",
    color: "white",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: "40px",
    marginBottom: "30px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 200px)",
    gap: "20px",
  },

  card: {
    background: "#222",
    padding: "30px",
    textAlign: "center",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "18px",
  },
};