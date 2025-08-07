import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3001';

function App() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [standings, setStandings] = useState([]);
  const [history, setHistory] = useState([]);
  const [userId, setUserId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [opponent, setOpponent] = useState('');
  const [scoreline, setScoreline] = useState('');
  const [gameweek, setGameweek] = useState(1);

  useEffect(() => {
    axios.get(`${API}/users`).then((res) => setUsers(res.data));
    axios.get(`${API}/standings`).then((res) => setStandings(res.data));
    axios
      .get(`${API}/predictions/${gameweek}`)
      .then((res) => setPredictions(res.data));
  }, [gameweek]);

  useEffect(() => {
    if (userId) {
      axios
        .get(`${API}/teams/${userId}/available`)
        .then((res) => setTeams(res.data));
      axios
        .get(`${API}/user/${userId}/history`)
        .then((res) => setHistory(res.data));
    } else {
      setTeams([]);
      setHistory([]);
    }
  }, [userId]);

  const submitPrediction = async () => {
    if (!userId || !teamId || !opponent || !scoreline || !gameweek) {
      alert('All fields are required');
      return;
    }
    try {
      await axios.post(`${API}/predict`, {
        user_id: Number(userId),
        team_id: Number(teamId),
        opponent,
        scoreline,
        gameweek: Number(gameweek),
      });
      alert('Prediction submitted!');
      setTeamId('');
      setOpponent('');
      setScoreline('');
      axios
        .get(`${API}/predictions/${gameweek}`)
        .then((res) => setPredictions(res.data));
      axios
        .get(`${API}/teams/${userId}/available`)
        .then((res) => setTeams(res.data));
      axios
        .get(`${API}/user/${userId}/history`)
        .then((res) => setHistory(res.data));
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting prediction');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(120deg, #f8fafc 0%, #e0e7ef 100%)',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        padding: 0,
        margin: 0,
      }}
    >
      <header
        style={{
          background: '#2563eb',
          color: '#fff',
          padding: '24px 0 16px 0',
          textAlign: 'center',
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: 1,
          marginBottom: 32,
          boxShadow: '0 2px 12px rgba(37,99,235,0.08)',
        }}
      >
        🏆 EPL Predictions Game
      </header>
      <main
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          padding: '0 5vw 40px 5vw',
        }}
      >
        {/* Prediction Form */}
        <section
          style={{
            flex: '1 1 340px',
            minWidth: 320,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            padding: 32,
            marginBottom: 32,
            maxWidth: 420,
          }}
        >
          <div
            style={{
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <label style={{ fontWeight: 500 }}>User:</label>
            <select
              onChange={(e) => setUserId(e.target.value)}
              value={userId}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                minWidth: 120,
                background: '#f9fafb',
              }}
            >
              <option value="">Select</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <label style={{ fontWeight: 500, marginLeft: 12 }}>Gameweek:</label>
            <input
              type="number"
              min={1}
              value={gameweek}
              onChange={(e) => setGameweek(Number(e.target.value))}
              style={{
                width: 60,
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                background: '#f9fafb',
              }}
            />
          </div>

          <h2
            style={{
              marginTop: 0,
              color: '#2563eb',
              fontWeight: 600,
              fontSize: 20,
            }}
          >
            📥 Make Prediction
          </h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 500 }}>Team: </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                minWidth: 120,
                background: '#f9fafb',
              }}
              disabled={!userId}
            >
              <option value="">Select</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 500 }}>Opponent: </label>
            <input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                minWidth: 120,
                background: '#f9fafb',
              }}
              disabled={!userId}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontWeight: 500 }}>Scoreline: </label>
            <input
              value={scoreline}
              onChange={(e) => setScoreline(e.target.value)}
              placeholder="e.g. 2-1"
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                minWidth: 80,
                background: '#f9fafb',
              }}
              disabled={!userId}
            />
          </div>
          <button
            onClick={submitPrediction}
            style={{
              marginTop: 10,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 20px',
              fontWeight: 600,
              cursor: userId ? 'pointer' : 'not-allowed',
              boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
              opacity: userId ? 1 : 0.6,
            }}
            disabled={!userId}
          >
            Submit
          </button>
        </section>

        {/* Leaderboard */}
        <section
          style={{
            flex: '1 1 340px',
            minWidth: 320,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            padding: 32,
            marginBottom: 32,
            maxWidth: 420,
          }}
        >
          <h2
            style={{
              color: '#0f172a',
              fontWeight: 600,
              fontSize: 20,
              marginTop: 0,
            }}
          >
            🏅 Leaderboard
          </h2>
          {standings.length === 0 && (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>
              No standings yet.
            </div>
          )}
          {standings.map((u, idx) => (
            <div
              key={u.id}
              style={{
                background: idx === 0 ? '#e0e7ff' : '#f1f5f9',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 6,
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: idx === 0 ? 700 : 500,
                color: idx === 0 ? '#1d4ed8' : '#334155',
                border: idx === 0 ? '2px solid #2563eb' : 'none',
              }}
            >
              <span>
                {idx === 0 && '🥇 '}
                {u.name}
              </span>
              <span style={{ fontWeight: 600 }}>{u.points} pts</span>
            </div>
          ))}
        </section>

        {/* Predictions & History */}
        <section
          style={{
            flex: '2 1 600px',
            minWidth: 340,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            padding: 32,
            marginBottom: 32,
            maxWidth: 700,
          }}
        >
          <h2
            style={{
              color: '#0f172a',
              fontWeight: 600,
              fontSize: 20,
              marginTop: 0,
            }}
          >
            📋 Current Gameweek Predictions
          </h2>
          {predictions.length === 0 && (
            <div style={{ color: '#64748b', fontStyle: 'italic' }}>
              No predictions yet.
            </div>
          )}
          {predictions.map((p) => (
            <div
              key={p.id}
              style={{
                background: '#f1f5f9',
                borderRadius: 6,
                padding: '8px 12px',
                marginBottom: 6,
              }}
            >
              <b style={{ color: '#2563eb' }}>{p.user?.name}</b>:{' '}
              <b>{p.team?.name}</b> {p.scoreline} {p.opponent}
            </div>
          ))}

          {userId && (
            <div style={{ marginTop: 32 }}>
              <h2 style={{ color: '#0f172a', fontWeight: 600, fontSize: 20 }}>
                🕘 History for {users.find((u) => u.id == userId)?.name}
              </h2>
              {history.length === 0 && (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                  No history yet.
                </div>
              )}
              {history.map((h) => (
                <div
                  key={h.id}
                  style={{
                    background: '#f1f5f9',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 6,
                  }}
                >
                  GW{h.gameweek}: <b>{h.team?.name}</b> {h.scoreline}{' '}
                  {h.opponent}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
