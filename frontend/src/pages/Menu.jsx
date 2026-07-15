import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Menu() {
  const navigate = useNavigate();

  const handleStart = async () => {
    try {
      await api.post('/api/game/start');
      navigate('/game');
    } catch(err) {
      alert("启动游戏失败");
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel" style={{ width: 400, padding: 40, textAlign: 'center' }}>
         <h1 style={{ color: '#ff4d4d', letterSpacing: 2, marginBottom: 40 }}>红魔馆前厅</h1>
         <button className="btn" style={{ width: '100%', marginBottom: 20, fontSize: '18px', padding: '15px' }} onClick={handleStart}>开 始 调 查</button>
         <button className="btn" style={{ width: '100%', fontSize: '18px', padding: '15px', background: 'rgba(0,0,0,0.5)' }} onClick={() => navigate('/history')}>历 史 卷 宗</button>
         <button className="btn" style={{ width: '100%', marginTop: 20, background: 'transparent', border: 'none', color: '#888' }} onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>退 出 登 录</button>
      </div>
    </div>
  );
}
