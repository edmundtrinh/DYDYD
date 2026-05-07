/* DYDYD UI Kit · misc cards: Stat, Health, Empty, Filter */

function DYStatCard({ icon, value, label, sublabel, color }){
  return (
    <div style={{
      flex:1, background: dyColors.surface1, borderRadius:12, padding:'14px 8px',
      borderTop:`3px solid ${color}`, border:`1px solid ${dyColors.surface3}`,
      display:'flex', flexDirection:'column', alignItems:'center', gap:2,
      boxShadow:'0 4px 12px rgba(0,0,0,0.45)',
    }}>
      <div style={{fontSize:22, marginBottom:2}}>{icon}</div>
      <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:22,color:'#fff',fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em'}}>{value}</div>
      <div style={{fontFamily:'var(--font-display,Sora)',fontSize:10,letterSpacing:'0.1em',textTransform:'uppercase',fontWeight:700,color:dyColors.fg3}}>{label}</div>
      {sublabel && <div style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:9,color:dyColors.fg4}}>{sublabel}</div>}
    </div>
  );
}

function DYProgressCard({ todayXP, level, progressToNext, completionPct }){
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14, background: dyColors.surface1,
      border:`1px solid ${dyColors.surface3}`, borderRadius:16, padding:14, marginBottom:14,
      boxShadow:'0 4px 12px rgba(0,0,0,0.45)',
    }}>
      <div style={{
        width:80, height:80, borderRadius:40,
        background: `conic-gradient(${dyColors.green} ${completionPct*3.6}deg, ${dyColors.surface3} 0)`,
        display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
      }}>
        <div style={{position:'absolute',inset:6,borderRadius:'50%',background:dyColors.surface1,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,color:dyColors.greenBright,fontSize:18}}>{Math.round(completionPct)}%</div>
        </div>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:28,color:dyColors.greenBright,letterSpacing:'-0.02em',fontVariantNumeric:'tabular-nums'}}>{todayXP} XP</div>
        <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:13,color:dyColors.fg3, marginBottom:8}}>earned today</div>
        <DYProgressBar pct={progressToNext*100} color={dyColors.purple} height={6}/>
        <div style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:10,color:dyColors.fg3,marginTop:4}}>
          {Math.round(progressToNext*100)}% to Level {level+1}
        </div>
      </div>
    </div>
  );
}

function DYHealthBlock({ steps, sleep, workout }){
  return (
    <div style={{background:dyColors.surface1, border:`1px solid ${dyColors.surface3}`, borderRadius:12, padding:14, marginBottom:16}}>
      <DYEyebrow style={{marginBottom:8}}>📱 Today's activity</DYEyebrow>
      <div style={{display:'flex',justifyContent:'space-around'}}>
        {steps!=null && <Metric val={fmtNum(steps)} lbl="steps" color={dyColors.green}/>}
        {sleep!=null && <Metric val={sleep.toFixed(1)} lbl="hours sleep" color={dyColors.blue}/>}
        {workout!=null && <Metric val={workout} lbl="min workout" color={dyColors.orange}/>}
      </div>
    </div>
  );
}
function Metric({val,lbl,color}){
  return <div style={{textAlign:'center'}}>
    <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:20,color,fontVariantNumeric:'tabular-nums'}}>{val}</div>
    <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:11,color:dyColors.fg3}}>{lbl}</div>
  </div>;
}

function DYFilterTabs({ tabs, active, onChange }){
  return (
    <div style={{display:'flex',gap:8,overflowX:'auto',padding:'4px 0 12px',scrollbarWidth:'none'}}>
      {tabs.map(t=>{
        const isActive = active===t.id;
        const c = t.color || dyColors.green;
        return (
          <button key={t.id} onClick={()=>onChange(t.id)} style={{
            display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
            borderRadius:9999, background: isActive?`${c}30`:dyColors.surface1,
            border:`1px solid ${isActive?c:dyColors.surface3}`,
            fontFamily:'var(--font-display,Sora)', fontWeight:600, fontSize:13,
            color: isActive?c:dyColors.fg3, cursor:'pointer', flexShrink:0, whiteSpace:'nowrap',
          }}>
            {t.label}
            {t.count!=null && <span style={{
              background: isActive?c:dyColors.surface3, color:'#fff',
              fontFamily:'var(--font-mono,JetBrains Mono)', fontSize:10, padding:'2px 6px',
              borderRadius:9999, fontWeight:700,
            }}>{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function DYEmptyState({ icon='🎯', title, subtitle, ctaLabel, onCta }){
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
      padding:'40px 20px', background:dyColors.surface1, border:`1px solid ${dyColors.surface3}`, borderRadius:16
    }}>
      <div style={{fontSize:48, marginBottom:12}}>{icon}</div>
      <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:18,color:'#fff',marginBottom:4}}>{title}</div>
      <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:13,color:dyColors.fg3,marginBottom:16, maxWidth:240}}>{subtitle}</div>
      {ctaLabel && <DYButton onClick={onCta}>{ctaLabel}</DYButton>}
    </div>
  );
}

Object.assign(window, { DYStatCard, DYProgressCard, DYHealthBlock, DYFilterTabs, DYEmptyState });
