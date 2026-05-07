/* DYDYD UI Kit · Screen — Home */

const seedQuests = [
  { id:'q1', category:'physical_health',     name:'Walk 10,000 Steps',  frequency:'Daily',  xpValue:10, targetValue:10000, currentValue:7420, completedToday:false, streak:0 },
  { id:'q2', category:'mental_wellness',     name:'Meditate',           frequency:'Daily',  xpValue:3,  targetValue:1, completedToday:true,  streak:12 },
  { id:'q3', category:'home_chores',         name:'Make Your Bed',      frequency:'Daily',  xpValue:1,  targetValue:1, completedToday:false },
  { id:'q4', category:'career_productivity', name:'Deep Work · 2 hrs',  frequency:'Daily',  xpValue:8,  targetValue:120, currentValue:45, completedToday:false },
  { id:'q5', category:'relationships_social',name:'Text a Friend',      frequency:'Weekly', xpValue:5,  targetValue:1, completedToday:true,  streak:3 },
];

function DYHomeScreen({ user, onNavigate }){
  const [quests, setQuests] = React.useState(seedQuests);
  const todayXP = quests.filter(q=>q.completedToday).reduce((s,q)=>s+q.xpValue,0);
  const completed = quests.filter(q=>q.completedToday).length;
  const total = quests.length;
  const completionPct = total ? (completed/total)*100 : 0;
  const handleComplete = (id)=> setQuests(qs=>qs.map(q=>q.id===id?{...q,completedToday:true,currentValue:q.targetValue}:q));
  const sorted = [...quests].sort((a,b)=> Number(a.completedToday)-Number(b.completedToday));

  return (
    <div style={{padding:'14px 16px 88px'}}>
      <DYHeader
        greeting="Good morning"
        name={user.name.split(' ')[0]}
        date={new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
        level={user.level}
        onLevelPress={()=>onNavigate('profile')}
      />
      <DYProgressCard todayXP={todayXP} level={user.level} progressToNext={0.68} completionPct={completionPct}/>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <DYStatCard icon="🔥" value={user.streak} label="Streak" sublabel="days" color={dyColors.orange}/>
        <DYStatCard icon="✓"  value={`${completed}/${total}`} label="Completed" sublabel="quests" color={dyColors.green}/>
        <DYStatCard icon="⭐" value={fmtNum(user.totalXP)} label="Total XP" color={dyColors.gold}/>
      </div>
      <DYHealthBlock steps={7420} sleep={7.5} workout={32}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:18,color:'#fff'}}>Today's Quests</div>
        <button onClick={()=>onNavigate('quests')} style={{background:'transparent',border:'none',color:dyColors.greenBright,fontFamily:'var(--font-display,Sora)',fontWeight:600,fontSize:13,cursor:'pointer'}}>See All →</button>
      </div>
      {sorted.map(q => <DYQuestCard key={q.id} quest={q} onComplete={handleComplete}/>)}
    </div>
  );
}

Object.assign(window, { DYHomeScreen });
