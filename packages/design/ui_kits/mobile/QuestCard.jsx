/* DYDYD UI Kit · QuestCard — interactive completion card */

function DYQuestCard({ quest, onComplete }){
  const cat = CATEGORIES[quest.category] || CATEGORIES.physical_health;
  const [pressed, setPressed] = React.useState(false);
  const done = quest.completedToday;
  return (
    <div
      onPointerDown={()=>setPressed(true)} onPointerUp={()=>setPressed(false)} onPointerLeave={()=>setPressed(false)}
      onClick={()=>!done && onComplete && onComplete(quest.id)}
      style={{
        position:'relative', display:'flex', alignItems:'center', gap:12,
        background: pressed ? '#252538' : dyColors.surface1,
        border:`1px solid ${dyColors.surface3}`, borderRadius:12, padding:'12px',
        marginBottom:8, overflow:'hidden', cursor: done?'default':'pointer',
        opacity: done?0.6:1,
        boxShadow:'0 4px 12px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)',
        transform: pressed?'scale(0.99)':'scale(1)', transition:'transform 120ms, background 120ms',
      }}
    >
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background: cat.color }}/>
      <div style={{
        marginLeft:8, width:44, height:44, borderRadius:12,
        background: cat.color+'33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
      }}>{cat.icon}</div>
      <div style={{flex:1}}>
        <div style={{
          fontFamily:'var(--font-body,Manrope)', fontWeight:600, fontSize:15, color:'#fff',
          textDecoration: done?'line-through':'none', color: done? dyColors.fg3:'#fff', marginBottom:4
        }}>{quest.name}</div>
        {quest.targetValue>1 && (
          <DYProgressBar pct={(quest.currentValue||0)/quest.targetValue*100} color={cat.color} height={4}/>
        )}
        <div style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:11,color:dyColors.fg3,marginTop:4}}>
          {quest.frequency} · +{quest.xpValue} XP{quest.streak?` · 🔥 ${quest.streak} day streak`:''}
        </div>
      </div>
      <div style={{ marginRight:8, display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div style={{
          fontFamily:'var(--font-display,Sora)', fontWeight:700, fontSize:14,
          color: done? dyColors.green : dyColors.gold,
        }}>+{quest.xpValue}</div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontSize:10,color:dyColors.fg3,fontWeight:700,letterSpacing:'0.08em'}}>XP</div>
      </div>
      {done && (
        <div style={{
          position:'absolute', top:8, right:8, width:20, height:20, borderRadius:10,
          background: dyColors.green, color:'#fff', display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:12, fontWeight:700
        }}>✓</div>
      )}
    </div>
  );
}

Object.assign(window, { DYQuestCard });
