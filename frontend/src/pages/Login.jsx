import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        const res = await api.post('/api/auth/login', formData);
        localStorage.setItem('token', res.data.access_token);
        navigate('/menu');
      } else {
        await api.post('/api/auth/register', { username, password, invite_code: inviteCode });
        setIsLogin(true);
        setMessage('注册成功，请登录！');
      }
    } catch (err) {
      setMessage(err.response?.data?.detail || '操作失败');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
      {!showForm ? (
        <div 
          onClick={() => setShowForm(true)}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
            cursor: 'pointer', zIndex: 10, paddingBottom: '10vh',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 30%)'
          }}
        >
          <h1 style={{ fontSize: '48px', color: '#ff4d4d', textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 10px rgba(255,0,0,0.5)', letterSpacing: '8px', margin: 0 }}>谁偷了我的布丁</h1>
          <p style={{ color: '#fff', fontSize: '20px', letterSpacing: '4px', textShadow: '0 2px 10px rgba(0,0,0,0.9)', marginTop: '20px', animation: 'pulse 2s infinite' }}>- 点击屏幕进入红魔馆 -</p>
          <style>{`@keyframes pulse { 0% {opacity:0.4;} 50% {opacity:1;} 100% {opacity:0.4;} }`}</style>
        </div>
      ) : (
        <>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13, 9, 9, 0.85)', zIndex: 1 }}></div>
        <div className="glass-panel" style={{ width: 400, padding: 40, textAlign: 'center', zIndex: 20 }}>
        <h1 style={{ color: '#ff4d4d', letterSpacing: 2 }}>谁偷了我的布丁</h1>
        <p style={{ color: '#aaa', marginBottom: 30 }}>红魔馆推理游戏</p>
        
        {message && <div style={{ color: message.includes('成功') ? '#4ade80' : '#ff4d4d', marginBottom: 15 }}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input 
              type="text" 
              className="input-field" 
              placeholder="邀请码 (Invite Code)" 
              value={inviteCode} 
              onChange={e => setInviteCode(e.target.value)} 
              required 
            />
          )}
          <input 
            type="text" 
            className="input-field" 
            placeholder="账号 (Username)" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            className="input-field" 
            placeholder="密码 (Password)" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 10 }}>
            {isLogin ? '进 入 红 魔 馆' : '注 册 账 号'}
          </button>
        </form>
        
        <div style={{ marginTop: 20, fontSize: 14 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setMessage(''); }}>
            {isLogin ? '没有邀请码？点击注册' : '已有账号？返回登录'}
          </a>
        </div>
        </div>
        </>
      )}
    </div>
  );
}
