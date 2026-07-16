import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTimeline, setShowTimeline] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/game/history').then(res => {
      setSessions(res.data);
      setLoading(false);
    });
  }, []);

  const hasWon = sessions.some(s => s.status === 'win_logic' || s.status === 'win_guess');

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ color: '#ff4d4d' }}>历史卷宗</h1>
        <div>
          {hasWon && (
            <button className="btn" style={{ marginRight: 15, background: '#a65646' }} onClick={() => setShowTimeline(true)}>查看真相时间线 (上帝视角)</button>
          )}
          <button className="btn" onClick={() => navigate('/menu')}>返回主界面</button>
        </div>
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
      
      {showTimeline && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setShowTimeline(false)}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: 1000, padding: 30, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#ff4d4d', textAlign: 'center', marginBottom: 20 }}>案发时间线 (上帝视角)</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#eee', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #4a2525', padding: 10, textAlign: 'left' }}>时间</th>
                  <th style={{ borderBottom: '1px solid #4a2525', padding: 10, textAlign: 'left', color: '#c27566' }}>十六夜咲夜</th>
                  <th style={{ borderBottom: '1px solid #4a2525', padding: 10, textAlign: 'left', color: '#527a9c' }}>帕秋莉</th>
                  <th style={{ borderBottom: '1px solid #4a2525', padding: 10, textAlign: 'left', color: '#e0be92' }}>芙兰朵露</th>
                  <th style={{ borderBottom: '1px solid #4a2525', padding: 10, textAlign: 'left', color: '#5b783c' }}>红美铃</th>
                  <th style={{ borderBottom: '1px solid #4a2525', padding: 10, textAlign: 'left', color: '#ffeb3b' }}>雾雨魔理沙(真凶)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>T1<br/><span style={{fontSize: 12, color: '#aaa'}}>13:00-13:30</span></td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>买布丁放冰箱。锁死厨房通往花园的窗户，前往客厅。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>图书馆看书。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>从地下室去花园玩。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>大门打瞌睡。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>-</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>T2<br/><span style={{fontSize: 12, color: '#aaa'}}>13:30-14:00</span></td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>客厅打扫。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>图书馆看书。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>花园玩耍。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>大门打瞌睡。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>-</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>T3<br/><span style={{fontSize: 12, color: '#aaa'}}>14:00-14:30</span></td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>客厅打扫。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>图书馆看书。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>花园玩耍。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>大门打瞌睡。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10, color: '#ffeb3b' }}>从图书馆窗户潜入，留下泥脚印。</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>T4<br/><span style={{fontSize: 12, color: '#aaa'}}>14:30-15:00</span></td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>客厅打扫。给帕秋莉倒茶。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>去客厅找咲夜喝茶。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>花园玩耍。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>大门打瞌睡。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10, color: '#ffeb3b' }}>溜到隔壁厨房偷吃布丁。</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>T5<br/><span style={{fontSize: 12, color: '#aaa'}}>15:00-15:30</span></td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>客厅打扫。看到芙兰路过。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>端茶返回图书馆。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>穿过客厅回地下室洗澡。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>刚醒，看见魔理沙飞走。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10, color: '#ffeb3b' }}>从内部强行打开厨房被锁的窗户逃跑。</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>T6<br/><span style={{fontSize: 12, color: '#aaa'}}>15:30-16:00</span></td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>客厅打扫。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>图书馆看书。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>地下室洗澡。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>大门守卫。</td>
                  <td style={{ borderBottom: '1px solid #333', padding: 10 }}>-</td>
                </tr>
              </tbody>
            </table>
            <button className="btn" style={{ width: '100%', marginTop: 20 }} onClick={() => setShowTimeline(false)}>关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}
