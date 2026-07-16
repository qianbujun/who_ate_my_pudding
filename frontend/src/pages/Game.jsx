import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import MapModal from '../components/MapModal';
import './Game.css';

export default function Game() {
  const navigate = useNavigate();
  const [ap, setAp] = useState(15);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const [showIntro, setShowIntro] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [marisaUnlocked, setMarisaUnlocked] = useState(false);
  const [marisaCaught, setMarisaCaught] = useState(false);
  const [investigatedLocs, setInvestigatedLocs] = useState(new Set());
  const [investigatedCCTVs, setInvestigatedCCTVs] = useState(new Set());
  const [askedFixedChars, setAskedFixedChars] = useState(new Set());
  const [activeTarget, setActiveTarget] = useState(null);
  
  const logEndRef = useRef(null);
  
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (text) => setLogs(prev => [...prev, text]);
  const addHistory = (text) => setHistory(prev => [...prev, text]);

  const handleAction = async (actionType, target, extra = null) => {
    if (gameOver) return;
    setLoading(true);
    try {
      const res = await api.post('/api/game/action', {
        action_type: actionType,
        target: target,
        extra_input: extra
      });
      const data = res.data;
      const detail = JSON.parse(data.detail);
      
      setAp(prev => prev - data.ap_cost);
      
      let logMsg = detail.text;
      if (actionType === 'ask_llm') {
        logMsg = `你问: ${extra}\n${detail.text}`;
      }
      
      addLog(logMsg);
      addHistory(logMsg);
      
      if (detail.marisa_unlocked) {
        setMarisaUnlocked(true);
      }
      
      if (actionType === 'catch' && target === 'marisa') {
        setMarisaCaught(true);
      }
      
      if (actionType === 'ask_fixed') {
        setAskedFixedChars(prev => new Set(prev).add(target));
      }
      
      if (actionType === 'investigate') {
        setInvestigatedLocs(prev => new Set(prev).add(target));
      }
      
      if (actionType === 'investigate_cctv') {
        setInvestigatedLocs(prev => new Set(prev).add(target));
        setInvestigatedCCTVs(prev => new Set(prev).add(target));
      }
      
      if (logMsg.includes('【普通胜利】') || logMsg.includes('【游戏失败】') || logMsg.includes('布丁是我吃的')) {
        setGameOver(true);
        if (logMsg.includes('布丁是我吃的')) {
            addLog("【胜利！逻辑击破！】魔理沙被你的逻辑击穿，成功找回布丁！");
        }
      }
      
      // Auto trigger guess phase if AP is 0 and not game over
      if (ap - data.ap_cost <= 0 && !logMsg.includes('胜利') && !logMsg.includes('失败') && !logMsg.includes('布丁是我吃的')) {
        addLog("【行动点数耗尽！】最终指认阶段开启：请在右侧选择真凶！");
        setActiveTarget('FINAL_GUESS');
      }

    } catch (err) {
      addLog(`❌ 操作失败: ${err.response?.data?.detail || err.message}`);
    }
    setLoading(false);
  };

  const handleActionStream = async (target, extra) => {
    if (gameOver) return;
    setLoading(true);
    
    const logIndex = logs.length;
    addLog(`你问: ${extra}\n[AI思考中...]`);
    setAp(prev => prev - 1);
    
    let reasoningStr = "";
    let contentStr = "";
    
    const targetName = {sakuya: '十六夜咲夜', flandre: '芙兰朵露', patchouli: '帕秋莉', meiling: '红美铃', marisa: '雾雨魔理沙'}[target] || target;

    try {
      const response = await fetch(`${api.defaults.baseURL || 'http://localhost:8000'}/api/game/action_stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action_type: 'ask_llm', target, extra_input: extra })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      
      while(true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (!line.trim()) continue;
          let data;
          try { data = JSON.parse(line); } catch(e) { continue; }
          
          if (data.type === 'reasoning') {
            reasoningStr += data.content;
          } else if (data.type === 'content') {
            contentStr += data.content;
          } else if (data.type === 'done') {
            if (data.marisa_unlocked) setMarisaUnlocked(true);
            if (data.win_flag) {
               setGameOver(true);
               setTimeout(() => addLog("【胜利！逻辑击破！】魔理沙被你的逻辑击穿，成功找回布丁！"), 500);
            }
            addHistory(data.result_text);
          } else if (data.type === 'error') {
            contentStr += data.content;
          }
          
          setLogs(prev => {
             const newLogs = [...prev];
             let msg = `你问: ${extra}\n`;
             if (contentStr) msg += `【${targetName}】: ${contentStr}`;
             else if (!contentStr) msg += `[AI思考中...]`;
             newLogs[logIndex] = msg;
             return newLogs;
          });
        }
      }
    } catch(err) {
      addLog(`❌ 追问失败: ${err.message}`);
    }
    setLoading(false);
  };

  const handleLocationClick = (loc) => {
    setActiveTarget({ type: 'location', id: loc });
  };
  
  const handleCharacterClick = (char) => {
    setActiveTarget({ type: 'character', id: char });
  };

  return (
    <div className="game-container">
      {showIntro && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 100,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="glass-panel" style={{ width: 600, padding: 40 }}>
            <h2 style={{ color: '#ff4d4d', textAlign: 'center', fontSize: 28, marginBottom: 20 }}>序章：消失的下午茶</h2>
            <div style={{ color: '#eee', fontSize: 16, lineHeight: 1.8, marginBottom: 30 }}>
              <p>我是蕾米莉亚·斯卡蕾特，这红魔馆的主人。</p>
              <p>今天中午 13:00 的时候，我特意指派女仆长咲夜前往人间之里，去购买那家据说每天限量供应的特制焦糖布丁。那是我期待已久的绝赞甜品！</p>
              <p>咲夜很快就买回了布丁并放进了厨房的冰箱。而我则因为午后的阳光太过刺眼，回到房间小憩了一会儿。</p>
              <p>直到 16:00，我满心欢喜地醒来，准备享受我那完美的下午茶时——</p>
              <p style={{ color: '#ff4d4d', fontWeight: 'bold' }}>厨房冰箱里的布丁竟然不翼而飞了！只留下一个空荡荡的盘子！</p>
              <p>这绝对不可原谅！馆里肯定有谁背着我偷吃了布丁。作为威严满满的大小姐，我必须亲自查明真相。我有 15 点行动力，必须在点数耗尽前找出真凶！</p>
              <div style={{ background: 'rgba(255, 77, 77, 0.1)', padding: 15, borderRadius: 8, borderLeft: '4px solid #ff4d4d', marginTop: 20 }}>
                <strong style={{ color: '#ff4d4d' }}>【游戏规则说明】</strong>
                <ul style={{ margin: '10px 0 0 0', paddingLeft: 20, fontSize: 14 }}>
                  <li>在左侧查阅<strong>红魔馆地图</strong>，花费 AP 调查各个地点或查阅监控，搜集案发线索。</li>
                  <li>选择嫌疑人会先进行<strong>【例行盘问】</strong>之后允许通过自由打字进行<strong>【追问】</strong>。</li>
                  <li><strong style={{ color: '#ffeb3b' }}>核心机制</strong>：嫌疑人可能会对你撒谎！你需要利用搜集到的地点线索、监控记录以及其他人的口供，在追问时指出逻辑矛盾，打破犯人的心理防线，他们才会对你说实话。</li>
                  <li>当行动点数(AP)耗尽时，游戏将强制进入最终指认阶段。嫌疑人未亲自承认，但是指认成功也视为胜利。</li>
                </ul>
              </div>
            </div>
            <button className="btn" style={{ width: '100%', fontSize: 18 }} onClick={() => setShowIntro(false)}>
              开始调查
            </button>
          </div>
        </div>
      )}

      {/* Left: Map & Status */}
      <div className="panel left-panel">
        <div className="ap-box">
          <div className="ap-text">剩余 AP</div>
          <div className="ap-number">{ap} / 15</div>
        </div>
        
        <button 
          className="btn" 
          style={{ width: '100%', marginBottom: 15, background: '#4a2525' }} 
          onClick={() => setShowMap(true)}
        >
          查看红魔馆地图
        </button>
        
        <div className="map-container">
          <div className="map-btn" onClick={() => handleLocationClick('gate')}>大门(有监控)</div>
          <div className="map-btn" onClick={() => handleLocationClick('garden')}>花园</div>
          <div className="map-btn" onClick={() => handleLocationClick('living_room')}>客厅(有监控)</div>
          <div className="map-btn" onClick={() => handleLocationClick('basement')}>地下室</div>
          <div className="map-btn" onClick={() => handleLocationClick('kitchen')}>厨房</div>
          <div className="map-btn" onClick={() => handleLocationClick('library')}>图书馆(有监控)</div>
        </div>
        
        <div className="characters-container">
          <h3 style={{color: '#ff4d4d'}}>盘问角色</h3>
          <div className="map-btn" onClick={() => handleCharacterClick('sakuya')}>十六夜咲夜</div>
          <div className="map-btn" onClick={() => handleCharacterClick('flandre')}>芙兰朵露</div>
          <div className="map-btn" onClick={() => handleCharacterClick('patchouli')}>帕秋莉</div>
          <div className="map-btn" onClick={() => handleCharacterClick('meiling')}>红美铃</div>
          {marisaUnlocked && !marisaCaught && (
             <div className="map-btn" style={{borderColor: '#ffeb3b', color: '#ffeb3b'}} onClick={() => handleAction('catch', 'marisa')}>⚡ 抓捕魔理沙 (-2 AP)</div>
          )}
          {marisaCaught && (
             <div className="map-btn" onClick={() => handleCharacterClick('marisa')}>雾雨魔理沙</div>
          )}
        </div>
      </div>

      {/* Middle: Console */}
      <div className="panel center-panel">
        <div className="logs-window">
          {logs.map((l, i) => (
            <div key={i} className="log-entry" style={{whiteSpace: 'pre-wrap'}}>{l}</div>
          ))}
          <div ref={logEndRef} />
        </div>
        
        <div className="action-area">
          {activeTarget?.type === 'location' && (
            <div className="action-buttons">
              {!investigatedLocs.has(activeTarget.id) && (
                <button className="btn" onClick={() => handleAction('investigate', activeTarget.id)} disabled={loading}>调查该地点 (-1 AP)</button>
              )}
              {['gate', 'living_room', 'library'].includes(activeTarget.id) && !investigatedCCTVs.has(activeTarget.id) && (
                <button className="btn" onClick={() => handleAction('investigate_cctv', activeTarget.id)} disabled={loading}>
                  {investigatedLocs.has(activeTarget.id) ? '仅调查监控 (-2 AP)' : '调查地点及监控 (-3 AP)'}
                </button>
              )}
              {(
                (['gate', 'living_room', 'library'].includes(activeTarget.id) && investigatedCCTVs.has(activeTarget.id)) ||
                (!['gate', 'living_room', 'library'].includes(activeTarget.id) && investigatedLocs.has(activeTarget.id))
              ) && (
                <p style={{color: '#aaa', textAlign: 'center'}}>该地点已调查完毕，无更多线索。</p>
              )}
            </div>
          )}
          
          {activeTarget?.type === 'character' && (
            <div className="character-interaction">
              {!askedFixedChars.has(activeTarget.id) && (
                <button className="btn" onClick={() => handleAction('ask_fixed', activeTarget.id)} disabled={loading} style={{marginBottom: 10}}>例行盘问 (-1 AP)</button>
              )}
              <div style={{display: 'flex', gap: 10}}>
                <input 
                  className="input-field" 
                  style={{marginBottom: 0}}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="自由输入盘问内容..."
                  disabled={loading}
                />
                <button className="btn" disabled={!input || loading} onClick={() => {
                  handleActionStream(activeTarget.id, input);
                  setInput('');
                }}>追问 (-1 AP)</button>
              </div>
            </div>
          )}
          
          {activeTarget === 'FINAL_GUESS' && (
            <div className="final-guess-area">
              <h3 style={{color: 'red'}}>最终指认：是谁偷了布丁？</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 10}}>
                <button className="btn" onClick={() => handleAction('guess', 'sakuya')}>十六夜咲夜</button>
                <button className="btn" onClick={() => handleAction('guess', 'flandre')}>芙兰朵露</button>
                <button className="btn" onClick={() => handleAction('guess', 'patchouli')}>帕秋莉</button>
                <button className="btn" onClick={() => handleAction('guess', 'meiling')}>红美铃</button>
                {marisaCaught && (
                  <button className="btn" onClick={() => handleAction('guess', 'marisa')}>雾雨魔理沙</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: History */}
      <div className="panel right-panel">
        <h3 style={{borderBottom: '1px solid #4a2525', paddingBottom: 10}}>线索记录</h3>
        <div className="history-list">
          {history.map((h, i) => (
            <div key={i} className="history-item">{h}</div>
          ))}
        </div>
      </div>

      {showMap && <MapModal onClose={() => setShowMap(false)} />}
    </div>
  );
}
