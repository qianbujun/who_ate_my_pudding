import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/game/history').then(res => {
      setSessions(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#ff4d4d' }}>历史卷宗</h1>
        <button className="btn" onClick={() => navigate('/menu')}>返回主界面</button>
      </div>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        {loading ? <p>加载中...</p> : sessions.length === 0 ? <p>暂无记录</p> : (
           sessions.map(s => (
             <div key={s.id} style={{ marginBottom: 20, border: '1px solid #4a2525', borderRadius: 8, padding: 15, background: 'rgba(0,0,0,0.6)' }}>
               <h3 style={{ marginTop: 0, color: '#ff9999' }}>对局 #{s.id} - 状态: {s.status === 'win_logic' ? '逻辑击破(胜利)' : s.status === 'win_guess' ? '指认成功(胜利)' : s.status === 'lose_guess' ? '指认错误(失败)' : '已放弃'}</h3>
               <p style={{ fontSize: 12, color: '#aaa' }}>开始时间: {new Date(s.start_time).toLocaleString()}</p>
               <div style={{ marginTop: 10 }}>
                 {s.actions.map(a => {
                   let detail = {};
                   try { detail = JSON.parse(a.detail); } catch(e){}
                   return (
                     <div key={a.id} style={{ marginBottom: 5, padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                       <span style={{ color: '#ffeb3b', marginRight: 10 }}>[{a.action_type}]</span>
                       {detail.question ? (
                         <>
                           <div style={{ color: '#fff' }}><strong>问:</strong> {detail.question}</div>
                           <div style={{ color: '#ccc', marginTop: 4 }}><strong>答:</strong> {detail.answer}</div>
                         </>
                       ) : (
                         <span style={{ color: '#ccc' }}>{detail.text}</span>
                       )}
                     </div>
                   )
                 })}
               </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}
