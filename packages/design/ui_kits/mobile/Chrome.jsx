/* DYDYD UI Kit · TabBar + Header */

function DYHeader({ greeting, name, date, level, onLevelPress }){
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
      <div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:22,color:'#fff',letterSpacing:'-0.01em'}}>
          {greeting}, {name}!
        </div>
        <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:13,color:dyColors.fg3,marginTop:2}}>{date}</div>
      </div>
      <button onClick={onLevelPress} style={{
        background: dyColors.surface1, border:`1px solid ${dyColors.surface3}`,
        padding:'8px 14px', borderRadius:9999, display:'flex', alignItems:'center', gap:6,
        cursor:'pointer'
      }}>
        <span style={{fontSize:14}}>🔥</span>
        <span style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:13,color:dyColors.gold}}>Lv {level}</span>
      </button>
    </div>
  );
}

function DYScreenHeader({ title, action }){
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
    <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:26,color:'#fff',letterSpacing:'-0.02em'}}>{title}</div>
    {action}
  </div>;
}

function DYTabBar({ active, onChange }){
  const tabs = [
    { id:'home', icon:'🏰', label:'Home' },
    { id:'quests', icon:'📜', label:'Quests' },
    { id:'profile', icon:'🛡️', label:'Profile' },
    { id:'settings', icon:'⚙️', label:'Settings' },
  ];
  return (
    <div style={{
      position:'absolute', left:8, right:8, bottom:8,
      display:'flex', background: dyColors.surface1,
      border:`1px solid ${dyColors.surface3}`, borderRadius:18, padding:6, gap:4,
      boxShadow:'0 12px 32px rgba(0,0,0,0.55)',
    }}>
      {tabs.map(t=>{
        const isActive = active===t.id;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2,
            padding:'8px 0', borderRadius:14, border:'none',
            background: isActive?'rgba(46,160,67,0.16)':'transparent',
            color: isActive?dyColors.greenBright:dyColors.fg4, cursor:'pointer',
          }}>
            <span style={{fontSize:20, filter: isActive?'none':'grayscale(0.6)'}}>{t.icon}</span>
            <span style={{fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:10,letterSpacing:'0.04em'}}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, { DYHeader, DYScreenHeader, DYTabBar });
