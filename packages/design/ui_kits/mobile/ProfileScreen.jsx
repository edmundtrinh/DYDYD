/* DYDYD UI Kit · Screen — Profile */

const SAMPLE_BADGES = [
  { id:'b1', name:'First Steps',  rarity:'common',    icon:'🥾' },
  { id:'b2', name:'Month Master', rarity:'rare',      icon:'🔥' },
  { id:'b3', name:'Century Club', rarity:'epic',      icon:'🏆' },
  { id:'b4', name:'Year of Dedication', rarity:'legendary', icon:'👑' },
];

function DYBadgeCard({ badge }){
  const c = RARITY[badge.rarity].color;
  return (
    <div style={{
      width:104, padding:12, background:dyColors.surface1, border:`1px solid ${c}`,
      borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0
    }}>
      <div style={{width:48,height:48,borderRadius:24,background:c+'33',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24}}>{badge.icon}</div>
      <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:11,color:'#fff',textAlign:'center'}}>{badge.name}</div>
      <div style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:9,color:c,textTransform:'capitalize'}}>{badge.rarity}</div>
    </div>
  );
}

function DYCategoryRow({ category, count, completions, totalXP }){
  const cat = CATEGORIES[category];
  return (
    <div style={{display:'flex',alignItems:'center',padding:'14px 14px',borderBottom:`1px solid ${dyColors.surface3}`}}>
      <div style={{width:40,height:40,borderRadius:12,background:cat.color+'33',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginRight:12}}>{cat.icon}</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:'var(--font-body,Manrope)',fontWeight:600,fontSize:14,color:'#fff'}}>{cat.name}</div>
        <div style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:11,color:dyColors.fg3}}>{count} active · {completions} completions</div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:15,color:cat.color,fontVariantNumeric:'tabular-nums'}}>{fmtNum(totalXP)}</div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontSize:9,color:dyColors.fg3,fontWeight:700,letterSpacing:'0.1em'}}>XP</div>
      </div>
    </div>
  );
}

function DYProfileScreen({ user }){
  const cats = [
    { c:'physical_health', count:2, comp:43, xp:560 },
    { c:'mental_wellness', count:1, comp:47, xp:212 },
    { c:'career_productivity', count:1, comp:14, xp:148 },
    { c:'relationships_social', count:1, comp:8,  xp:60 },
    { c:'home_chores', count:1, comp:30, xp:120 },
  ];
  return (
    <div style={{padding:'14px 16px 88px'}}>
      <DYScreenHeader title="Profile" action={
        <button style={{width:40,height:40,borderRadius:20,background:dyColors.surface1,border:`1px solid ${dyColors.surface3}`,fontSize:18,cursor:'pointer'}}>⚙️</button>
      }/>
      {/* Profile Card */}
      <div style={{
        background:dyColors.surface1, border:`1px solid ${dyColors.surface3}`, borderRadius:20,
        padding:22, display:'flex', flexDirection:'column', alignItems:'center', marginBottom:18,
        boxShadow:'0 4px 12px rgba(0,0,0,0.45)',
      }}>
        <div style={{position:'relative', marginBottom:12}}>
          <div style={{
            width:96, height:96, borderRadius:48, background:dyColors.green,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-display,Sora)', fontWeight:800, fontSize:36, color:'#fff',
            border:`3px solid ${dyColors.green}`,
          }}>{user.name.charAt(0)}</div>
          {user.premium && <div style={{position:'absolute',bottom:0,right:0,width:30,height:30,borderRadius:15,background:dyColors.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,border:`2px solid ${dyColors.surface1}`}}>👑</div>}
        </div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:22,color:'#fff'}}>{user.name}</div>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:13,color:dyColors.purple,marginBottom:10,letterSpacing:'0.04em'}}>{user.title}</div>
        <DYLevelPill level={user.level}/>
        <div style={{width:'100%', marginTop:18}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:11}}>
            <span style={{color:dyColors.greenBright}}>{fmtNum(1200)} XP</span>
            <span style={{color:dyColors.fg3}}>{fmtNum(1750)} XP</span>
          </div>
          <DYProgressBar pct={68} color={dyColors.green} height={8}/>
          <div style={{textAlign:'center', fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:11,color:dyColors.fg3,marginTop:6}}>550 XP to Level {user.level+1}</div>
        </div>
        <div style={{marginTop:18, paddingTop:14, borderTop:`1px solid ${dyColors.surface3}`, width:'100%', textAlign:'center'}}>
          <DYEyebrow style={{marginBottom:4}}>Total XP earned</DYEyebrow>
          <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:800,fontSize:30,color:dyColors.gold,fontVariantNumeric:'tabular-nums',letterSpacing:'-0.02em'}}>{fmtNum(user.totalXP)}</div>
        </div>
      </div>

      {/* Statistics grid */}
      <DYEyebrow style={{marginBottom:10}}>Statistics</DYEyebrow>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18}}>
        <DYStatCard icon="🔥" value={user.streak} label="Current Streak" color={dyColors.orange}/>
        <DYStatCard icon="🏆" value={42} label="Best Streak" color={dyColors.gold}/>
        <DYStatCard icon="✓"  value={142} label="Quests Done" color={dyColors.green}/>
        <DYStatCard icon="🏅" value={4} label="Badges" color={dyColors.purple}/>
      </div>

      {/* Recent badges */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <DYEyebrow>Recent badges</DYEyebrow>
        <span style={{fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:12,color:dyColors.greenBright,cursor:'pointer'}}>See All →</span>
      </div>
      <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:6,marginBottom:18}}>
        {SAMPLE_BADGES.map(b=><DYBadgeCard key={b.id} badge={b}/>)}
      </div>

      {/* Category breakdown */}
      <DYEyebrow style={{marginBottom:10}}>Active quests by category</DYEyebrow>
      <div style={{background:dyColors.surface1,border:`1px solid ${dyColors.surface3}`,borderRadius:14,overflow:'hidden'}}>
        {cats.map((row,i)=><DYCategoryRow key={row.c} category={row.c} count={row.count} completions={row.comp} totalXP={row.xp}/>)}
      </div>
    </div>
  );
}

Object.assign(window, { DYProfileScreen, DYBadgeCard, DYCategoryRow, SAMPLE_BADGES });
