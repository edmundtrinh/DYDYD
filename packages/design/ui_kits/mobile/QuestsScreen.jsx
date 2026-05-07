/* DYDYD UI Kit · Screen — Quest Library */

const QUEST_LIB = [
  { id:'l1', category:'physical_health', name:'Walk 10,000 Steps', frequency:'daily', baseXP:10, autoTrack:true, streak:0, completions:0, isActive:true },
  { id:'l2', category:'physical_health', name:'Run 5K', frequency:'weekly', baseXP:25, autoTrack:true, streak:0, completions:0, isActive:false },
  { id:'l3', category:'physical_health', name:'Drink 8 Cups Water', frequency:'daily', baseXP:5, autoTrack:false, streak:6, completions:42, isActive:true },
  { id:'l4', category:'mental_wellness', name:'Meditate 10 Min', frequency:'daily', baseXP:3, autoTrack:false, streak:12, completions:47, isActive:true },
  { id:'l5', category:'mental_wellness', name:'Journal Entry', frequency:'daily', baseXP:5, autoTrack:false, streak:0, completions:0, isActive:false },
  { id:'l6', category:'career_productivity', name:'Deep Work · 2 hrs', frequency:'daily', baseXP:8, autoTrack:false, streak:0, completions:0, isActive:true },
  { id:'l7', category:'career_productivity', name:'Read 30 Min', frequency:'daily', baseXP:5, autoTrack:false, streak:0, completions:0, isActive:false },
  { id:'l8', category:'home_chores', name:'Make Your Bed', frequency:'daily', baseXP:1, autoTrack:false, streak:0, completions:0, isActive:true },
  { id:'l9', category:'relationships_social', name:'Text a Friend', frequency:'weekly', baseXP:5, autoTrack:false, streak:3, completions:8, isActive:true },
];

function DYQuestLibraryRow({ item, onToggle, onPress }){
  const cat = CATEGORIES[item.category];
  return (
    <div onClick={()=>onPress&&onPress(item)} style={{
      position:'relative', display:'flex', alignItems:'center', background:dyColors.surface1,
      borderRadius:12, marginBottom:10, overflow:'hidden', cursor:'pointer',
      border:`1px solid ${dyColors.surface3}`,
    }}>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:4,background:cat.color}}/>
      <div style={{marginLeft:14, marginRight:12, marginTop:12, marginBottom:12, width:44, height:44, borderRadius:12, background:cat.color+'33', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>{cat.icon}</div>
      <div style={{flex:1, padding:'12px 0'}}>
        <div style={{fontFamily:'var(--font-body,Manrope)',fontWeight:600,fontSize:15,color:'#fff'}}>{item.name}</div>
        <div style={{display:'flex',gap:8,alignItems:'center',marginTop:3}}>
          <span style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:11,color:dyColors.fg3,textTransform:'capitalize'}}>{item.frequency}</span>
          <span style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:11,color:dyColors.greenBright}}>+{item.baseXP} XP</span>
          {item.autoTrack && <span style={{background:'rgba(37,99,235,0.3)',color:dyColors.blueBright,fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:9,padding:'2px 6px',borderRadius:4,letterSpacing:'0.06em'}}>AUTO</span>}
        </div>
        {item.streak>0 && (
          <div style={{display:'flex',gap:10,marginTop:4}}>
            <span style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:10,color:dyColors.gold}}>🔥 {item.streak} day streak</span>
            <span style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:10,color:dyColors.fg3}}>{item.completions} completions</span>
          </div>
        )}
      </div>
      <button onClick={(e)=>{e.stopPropagation(); onToggle(item.id);}} style={{
        marginRight:12, width:36, height:36, borderRadius:18,
        background: item.isActive?dyColors.green:'transparent',
        border: item.isActive?'none':`1px solid ${dyColors.green}`,
        color: item.isActive?'#fff':dyColors.greenBright,
        fontFamily:'var(--font-display,Sora)', fontWeight:700, fontSize:18,
        cursor:'pointer',
      }}>{item.isActive?'✓':'+'}</button>
    </div>
  );
}

function DYQuestsScreen({ onSelectQuest }){
  const [filter, setFilter] = React.useState('all');
  const [items, setItems] = React.useState(QUEST_LIB);
  const toggle = (id)=> setItems(xs=>xs.map(x=>x.id===id?{...x,isActive:!x.isActive}:x));
  const filtered = items.filter(it => {
    if (filter==='all') return true;
    if (filter==='active') return it.isActive;
    return it.category===filter;
  });
  const activeCount = items.filter(i=>i.isActive).length;
  const tabs = [
    { id:'all', label:'All' },
    { id:'active', label:'Active', count: activeCount, color: dyColors.green },
    ...Object.entries(CATEGORIES).map(([k,c])=>({ id:k, label:c.icon, color:c.color })),
  ];

  // group by category for all/active
  const showGrouped = filter==='all'||filter==='active';
  const groups = {};
  filtered.forEach(q=>{ (groups[q.category]=groups[q.category]||[]).push(q); });

  return (
    <div style={{padding:'14px 16px 88px'}}>
      <DYScreenHeader title="Quest Library" action={<DYButton variant="primary" style={{padding:'8px 14px',fontSize:13}}>+ Custom</DYButton>}/>
      <DYFilterTabs tabs={tabs} active={filter} onChange={setFilter}/>
      {filtered.length===0 && <DYEmptyState icon="📋" title="No Active Quests" subtitle="Activate quests from the library to start tracking your habits" ctaLabel="Browse All" onCta={()=>setFilter('all')}/>}
      {showGrouped ? Object.entries(groups).map(([catKey, qs])=>(
        <div key={catKey} style={{marginTop:14}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
            <span style={{fontSize:18}}>{CATEGORIES[catKey].icon}</span>
            <span style={{fontFamily:'var(--font-display,Sora)',fontWeight:700,fontSize:15,color:'#fff',flex:1}}>{CATEGORIES[catKey].name}</span>
            <span style={{fontFamily:'var(--font-mono,JetBrains Mono)',fontSize:11,color:dyColors.fg3}}>{qs.length}</span>
          </div>
          {qs.map(q=><DYQuestLibraryRow key={q.id} item={q} onToggle={toggle} onPress={onSelectQuest}/>)}
        </div>
      )) : filtered.map(q=><DYQuestLibraryRow key={q.id} item={q} onToggle={toggle} onPress={onSelectQuest}/>)}
    </div>
  );
}

Object.assign(window, { DYQuestsScreen, QUEST_LIB });
