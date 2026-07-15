import './MapModal.css';

export default function MapModal({ onClose }) {
  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-card" onClick={e => e.stopPropagation()}>
        <div className="title-section">
            <h2>红魔馆案发地图 (重置版)</h2>
            <p>※ 严格依照面积与嵌套规则推演：客厅为主核心，右侧建筑65:35切分</p>
        </div>

        <div className="garden-outer">
            <div className="garden-title">🌳 花园 (Garden)</div>
            
            <div className="mansion-interior">
                
                <div className="living-room">
                    <div className="cctv-badge">👁️‍🗨️ 监控</div>
                    <div className="room-name" style={{textAlign: 'center', marginTop: 10}}>客厅</div>
                    <div className="room-en" style={{textAlign: 'center'}}>Living Room</div>
                    
                    <div className="basement">
                        <div className="room-name">地下室</div>
                        <div className="room-en">Basement</div>
                        <div style={{fontSize: 11, marginTop: 5, opacity: 0.7}}>(锁定在客厅内部)</div>
                    </div>
                </div>

                <div className="right-wing">
                    <div className="room-block library">
                        <div className="cctv-badge" style={{top: 8, right: 8, padding: '2px 8px'}}>👁️‍🗨️ 监控</div>
                        <div className="room-name">图书馆</div>
                        <div className="room-en">Library (65%)</div>
                    </div>
                    
                    <div className="room-block kitchen">
                        <div className="room-name">厨房</div>
                        <div className="room-en">Kitchen (35%)</div>
                    </div>
                </div>

            </div>
        </div>

        <div className="gate-container">
            <div className="gate">
                <div className="cctv-badge" style={{top: '50%', transform: 'translateY(-50%)', right: 15}}>👁️‍🗨️ 监控</div>
                <div className="room-name" style={{fontSize: 20, margin: 0}}>大门 (Gate)</div>
            </div>
        </div>

        <div className="legend-box">
            <div><strong>📐 地形逻辑：</strong><br/>1. 客厅是枢纽，前往地下室必须经过客厅。<br/>2. 右侧建筑与客厅完全接壤，且外围均接触花园。</div>
            <div style={{textAlign: 'right'}}><span style={{color: '#ff4757', background: '#222', padding: '2px 6px', borderRadius: 4}}>👁️‍🗨️</span> <b>表示该区域存在监控</b></div>
        </div>
        
        <button 
          onClick={onClose} 
          style={{ width: '100%', marginTop: 20, padding: 15, background: '#4a2525', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}
        >
          关闭地图
        </button>
      </div>
    </div>
  );
}
