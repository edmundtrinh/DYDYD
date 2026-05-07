/* DYDYD UI Kit · Screen — Onboarding (lightweight signup) */

function DYOnboardingScreen({ onComplete }){
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('Adventurer');
  if (step===0) {
    return (
      <div style={{padding:'40px 20px',display:'flex',flexDirection:'column',height:'100%',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
        <div style={{width:120, height:120, borderRadius:60, background: dyColors.green, display:'flex', alignItems:'center', justifyContent:'center', fontSize:64, marginBottom:24, boxShadow:'0 0 0 4px rgba(46,160,67,0.25), 0 0 32px rgba(46,160,67,0.45)'}}>🛡️</div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:30,color:'#fff',letterSpacing:'-0.02em',marginBottom:8}}>DYDYD</div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:14,color:dyColors.gold,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:18}}>Did You Do Your Dailies?</div>
        <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:15,color:dyColors.fg2,maxWidth:280, lineHeight:1.5, marginBottom:28}}>Turn daily habits into quests. Earn XP. Level up your life.</div>
        <DYButton variant="primary" block onClick={()=>setStep(1)}>Begin Your Journey</DYButton>
        <DYButton variant="ghost" block onClick={()=>setStep(1)} style={{marginTop:8}}>I already have an account</DYButton>
      </div>
    );
  }
  if (step===1) {
    return (
      <div style={{padding:'40px 20px'}}>
        <DYEyebrow style={{marginBottom:8}}>Step 1 of 2</DYEyebrow>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:26,color:'#fff',letterSpacing:'-0.02em',marginBottom:6}}>What should we call you, Adventurer?</div>
        <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:14,color:dyColors.fg3,marginBottom:24}}>Your character's display name. Choose wisely.</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{
          width:'100%', background:dyColors.surface2, border:`1px solid ${dyColors.surface3}`,
          borderRadius:12, padding:'14px 16px', color:'#fff', fontFamily:'var(--font-body,Manrope)',
          fontSize:16, boxSizing:'border-box', marginBottom:24
        }}/>
        <DYButton variant="primary" block onClick={()=>setStep(2)}>Continue</DYButton>
      </div>
    );
  }
  return (
    <div style={{padding:'40px 20px'}}>
      <DYEyebrow style={{marginBottom:8}}>Step 2 of 2</DYEyebrow>
      <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:26,color:'#fff',letterSpacing:'-0.02em',marginBottom:6}}>Pick your starting class</div>
      <div style={{fontFamily:'var(--font-body,Manrope)',fontSize:14,color:dyColors.fg3,marginBottom:18}}>What matters most to you right now? (you can change this later)</div>
      {Object.entries(CATEGORIES).map(([k,c])=>(
        <button key={k} onClick={()=>onComplete({name})} style={{
          display:'flex',alignItems:'center',gap:12,width:'100%',
          padding:14, marginBottom:8, background:dyColors.surface1, border:`1px solid ${dyColors.surface3}`,
          borderRadius:12, cursor:'pointer', textAlign:'left'
        }}>
          <div style={{width:44,height:44,borderRadius:12,background:c.color+'33',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{c.icon}</div>
          <div style={{flex:1, fontFamily:'var(--font-body,Manrope)', fontWeight:600, color:'#fff', fontSize:15}}>{c.name}</div>
          <div style={{color:dyColors.fg3,fontFamily:'var(--font-display,Sora)',fontWeight:700}}>→</div>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { DYOnboardingScreen });
