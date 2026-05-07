/* DYDYD UI Kit · Atoms — Button, Pill, Eyebrow */

const dyButtonStyles = {
  base: {
    fontFamily: 'var(--font-display, Sora, sans-serif)', fontWeight: 700,
    border: '1px solid transparent', borderRadius: 9999, padding: '12px 22px',
    fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    gap: 8, justifyContent: 'center', transition: 'transform 120ms, background 120ms',
    minHeight: 44,
  },
  primary: { background: dyColors.green, color: '#fff' },
  gold:    { background: dyColors.gold,  color: '#0B0B12' },
  ghost:   { background: 'transparent', color: '#fff', border: `1px solid ${dyColors.surface3}` },
  danger:  { background: 'transparent', color: dyColors.redBright, border: `1px solid ${dyColors.red}` },
  block:   { width: '100%' },
};

function DYButton({ variant='primary', block, children, onClick, style, ...rest }){
  const s = { ...dyButtonStyles.base, ...(dyButtonStyles[variant]||{}), ...(block?dyButtonStyles.block:{}), ...style };
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onPointerDown={()=>setPressed(true)} onPointerUp={()=>setPressed(false)} onPointerLeave={()=>setPressed(false)}
      onClick={onClick}
      style={{ ...s, transform: pressed?'scale(0.97)':'scale(1)' }}
      {...rest}
    >{children}</button>
  );
}

function DYEyebrow({ children, style }){
  return <div style={{
    fontFamily:'var(--font-display,Sora,sans-serif)', fontSize:11,
    fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
    color: dyColors.fg3, ...style
  }}>{children}</div>;
}

function DYLevelPill({ level }){
  return <div style={{
    background: dyColors.green, color:'#fff', padding:'6px 14px', borderRadius: 9999,
    fontFamily:'var(--font-display,Sora,sans-serif)', fontWeight:700, fontSize:13,
    display:'inline-flex', alignItems:'center', gap:6
  }}>🔥 Lv {level}</div>;
}

function DYProgressBar({ pct, color=dyColors.green, height=6, label, sub }){
  return (
    <div>
      {(label||sub) && <div style={{display:'flex',justifyContent:'space-between',fontFamily:'var(--font-body,Manrope)',fontSize:11,color:dyColors.fg3,marginBottom:4}}>
        <span style={{color:dyColors.fg1, fontWeight:600}}>{label}</span><span>{sub}</span>
      </div>}
      <div style={{height, background: dyColors.surface3, borderRadius: height/2, overflow:'hidden'}}>
        <div style={{height:'100%', width:`${Math.min(100,pct)}%`, background: color, borderRadius: height/2, transition:'width 420ms cubic-bezier(0.22,1,0.36,1)'}}/>
      </div>
    </div>
  );
}

Object.assign(window, { DYButton, DYEyebrow, DYLevelPill, DYProgressBar, dyButtonStyles });
