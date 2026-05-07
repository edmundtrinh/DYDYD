/* DYDYD UI Kit · Screen — Quest Detail */

function DYQuestDetailScreen({ quest, onBack }){
  const cat = CATEGORIES[quest.category];
  const [done, setDone] = React.useState(quest.completedToday||false);
  const [showNotes, setShowNotes] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  return (
    <div style={{padding:'14px 16px 88px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <button onClick={onBack} style={{width:36,height:36,borderRadius:18,background:dyColors.surface1,border:`1px solid ${dyColors.surface3}`,fontSize:18,color:'#fff',cursor:'pointer'}}>←</button>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:16,color:'#fff'}}>Quest Details</div>
        <div style={{width:36}}/>
      </div>

      <div style={{
        background:dyColors.surface1, borderRadius:18, padding:22,
        border:`1px solid ${cat.color}`,
        display:'flex',flexDirection:'column',alignItems:'center',marginBottom:14,
        boxShadow:'0 4px 12px rgba(0,0,0,0.45)',
      }}>
        <div style={{width:72,height:72,borderRadius:36,background:cat.color+'33',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,marginBottom:12}}>{cat.icon}</div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:22,color:'#fff',textAlign:'center'}}>{quest.name}</div>
        <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:13,color:dyColors.fg3,textAlign:'center',marginTop:6,marginBottom:12,maxWidth:260,lineHeight:1.45}}>
          Track your daily steps to build a foundational habit. Every step counts.
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',marginBottom:14}}>
          <span style={{background:cat.color+'33',color:cat.color,padding:'4px 10px',borderRadius:9999,fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:11}}>{cat.name}</span>
          <span style={{background:dyColors.surface3,color:dyColors.fg2,padding:'4px 10px',borderRadius:9999,fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:11}}>{quest.frequency}</span>
          {quest.autoTrack && <span style={{background:'rgba(37,99,235,0.3)',color:dyColors.blueBright,padding:'4px 10px',borderRadius:9999,fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:11}}>Auto-track</span>}
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:34,color:dyColors.greenBright,letterSpacing:'-0.02em'}}>+{quest.baseXP||quest.xpValue}</div>
          <div style={{fontFamily:'var(--font-display,Sora)',fontSize:10,color:dyColors.fg3,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase'}}>XP per completion</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{background:dyColors.surface1,border:`1px solid ${dyColors.surface3}`,borderRadius:14,padding:16,marginBottom:14}}>
        <DYEyebrow style={{marginBottom:12}}>Your progress</DYEyebrow>
        <div style={{display:'flex',justifyContent:'space-between',textAlign:'center'}}>
          <Stat val={12} lbl="Current Streak" tag="🔥"/>
          <Stat val={42} lbl="Best Streak" tag="🏆"/>
          <Stat val={142} lbl="Total Done" tag="✓"/>
        </div>
      </div>

      {/* Completion */}
      <div style={{background:dyColors.surface1,border:`1px solid ${dyColors.surface3}`,borderRadius:14,padding:16,marginBottom:14}}>
        <DYEyebrow style={{marginBottom:12}}>{done?'Completed today!':'Mark as complete'}</DYEyebrow>
        {done ? (
          <div style={{textAlign:'center',padding:'14px 0'}}>
            <div style={{fontSize:42,marginBottom:8}}>🎉</div>
            <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:14,color:dyColors.greenBright}}>Great job. You earned +{quest.baseXP||quest.xpValue} XP</div>
          </div>
        ) : (
          <div>
            <button onClick={()=>setShowNotes(s=>!s)} style={{background:'transparent',border:'none',color:dyColors.greenBright,fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:13,cursor:'pointer',marginBottom:8}}>{showNotes?'- Hide notes':'+ Add notes'}</button>
            {showNotes && (
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="How did it go? (optional)" style={{
                width:'100%', minHeight:60, background:dyColors.bg, border:`1px solid ${dyColors.surface3}`,
                borderRadius:12, padding:12, color:'#fff', fontFamily:'var(--font-body,Manrope)', fontSize:14,
                marginBottom:10, resize:'vertical', boxSizing:'border-box'
              }}/>
            )}
            <DYButton variant="primary" block onClick={()=>setDone(true)} style={{background:cat.color}}>
              <span>Complete Quest</span>
              <span style={{opacity:0.85, fontFamily:'var(--font-mono,JetBrains Mono)', fontWeight:600}}>+{quest.baseXP||quest.xpValue} XP</span>
            </DYButton>
          </div>
        )}
      </div>

      <DYButton variant="ghost" block onClick={onBack}>Back to Library</DYButton>
    </div>
  );
}

function Stat({val,lbl,tag}){
  return <div style={{flex:1,position:'relative'}}>
    <div style={{position:'absolute',top:-8,right:0,fontSize:14}}>{tag}</div>
    <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:24,color:'#fff',fontVariantNumeric:'tabular-nums'}}>{val}</div>
    <div style={{fontFamily:'var(--font-display,Sora)',fontSize:10,color:dyColors.fg3,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase'}}>{lbl}</div>
  </div>;
}

Object.assign(window, { DYQuestDetailScreen });
