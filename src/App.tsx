import { useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronDown, ChevronLeft, Eye, EyeOff, Flame, LockKeyhole, Minus, Plus, RotateCcw, Settings2, ShieldAlert, Sparkles, Trash2, Users, WandSparkles } from 'lucide-react'

type Category = { id: string; name: string; icon: string; words: string[]; builtin?: boolean }
type Screen = 'setup' | 'play' | 'results'
type Player = { name: string; imposter: boolean }

const defaults: Category[] = [
  { id:'animals',name:'Animals',icon:'🐾',words:['Elephant','Flamingo','Octopus','Giraffe','Penguin','Dolphin','Chameleon','Kangaroo','Hedgehog','Peacock','Crocodile','Panda','Owl','Jaguar','Sloth','Lemur','Platypus','Meerkat','Porcupine','Toucan'],builtin:true },
  { id:'food',name:'Food',icon:'🍜',words:['Sushi','Tacos','Pancakes','Avocado','Popcorn','Dumplings','Watermelon','Lasagna','Croissant','Ramen','Cheesecake','Burrito','Mango','Pretzel','Brownie','Kimchi','Waffles','Nachos','Pineapple','Falafel'],builtin:true },
  { id:'movies',name:'Movies',icon:'🎬',words:['Titanic','Jaws','The Matrix','Finding Nemo','Jurassic Park','Home Alone','Shrek','The Lion King','Inception','Frozen','Toy Story','Black Panther','Up','Coco','The Godfather','Paddington','Interstellar','Mean Girls'],builtin:true },
  { id:'sports',name:'Sports',icon:'🏆',words:['Tennis','Basketball','Surfing','Fencing','Cricket','Skateboarding','Volleyball','Archery','Ice hockey','Badminton','Boxing','Gymnastics','Rugby','Snowboarding','Golf','Wrestling','Table tennis','Sailing'],builtin:true },
  { id:'countries',name:'Countries',icon:'🌍',words:['Japan','Brazil','Iceland','Morocco','Australia','Italy','South Korea','Peru','Norway','India','Mexico','Kenya','Greece','Thailand','Canada','Egypt','New Zealand','Portugal'],builtin:true },
  { id:'places',name:'Places',icon:'🗺️',words:['Airport','Aquarium','Library','Amusement park','Museum','Bakery','Train station','Camping site','Hospital','Rooftop bar','Beach','Space station','Zoo','Flower shop','Lighthouse','Cinema','Castle','Waterfall'],builtin:true },
  { id:'technology',name:'Technology',icon:'📱',words:['Smartwatch','Drone','Headphones','Robot vacuum','VR headset','Bluetooth speaker','Tablet','3D printer','E-reader','Game controller','Selfie stick','Smart ring','Projector','USB drive','Webcam','Walkie-talkie','Microphone','Laptop'],builtin:true },
  { id:'professions',name:'Professions',icon:'🧑‍🚀',words:['Astronaut','Detective','Chef','Lifeguard','Magician','Dentist','Archaeologist','Firefighter','Photographer','Pilot','Florist','Veterinarian','DJ','Architect','Park ranger','Tattoo artist','Meteorologist','Baker'],builtin:true },
  { id:'objects',name:'Objects',icon:'🔮',words:['Umbrella','Hourglass','Candle','Compass','Sunglasses','Snow globe','Rubber duck','Telescope','Yo-yo','Suitcase','Kaleidoscope','Typewriter','Thermos','Dreamcatcher','Binoculars','Pinata','Alarm clock','Slippers'],builtin:true },
  { id:'celebrities',name:'Celebrities',icon:'⭐',words:['Taylor Swift','Beyoncé','Zendaya','The Rock','Dua Lipa','Keanu Reeves','Rihanna','Pedro Pascal','Billie Eilish','Jack Black','Ariana Grande','Tom Holland','Bad Bunny','Lady Gaga','Ryan Reynolds','Adele','Bruno Mars','Sabrina Carpenter'],builtin:true },
]

const readCustom = (): Category[] => {
  try { const value = localStorage.getItem('imposter-custom-categories'); return value ? JSON.parse(value) as Category[] : [] } catch { return [] }
}
const newCategoryId = () => `custom-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
const shuffled = <T,>(items: T[]) => { const arr=[...items]; for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]} return arr }
const buttonBase = 'min-h-[48px] rounded-2xl font-bold transition active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed'

export default function App() {
  const reduced = useReducedMotion()
  const [custom,setCustom] = useState<Category[]>(readCustom)
  const categories = useMemo(()=>[...defaults,...custom],[custom])
  const [screen,setScreen] = useState<Screen>('setup')
  const [manage,setManage] = useState(false)
  const [players,setPlayers] = useState(5)
  const [imposters,setImposters] = useState(1)
  const [selected,setSelected] = useState('animals')
  const [current,setCurrent] = useState(0)
  const [revealed,setRevealed] = useState(false)
  const [word,setWord] = useState('')
  const [roundPlayers,setRoundPlayers] = useState<Player[]>([])
  const [editId,setEditId] = useState<string|null>(null)
  const [catName,setCatName] = useState('')
  const [catWords,setCatWords] = useState('')
  const [error,setError] = useState('')
  const [confirmDelete,setConfirmDelete] = useState<string|null>(null)

  const activeCategory = categories.find(c=>c.id===selected) ?? categories[0]
  const persist = (next: Category[]) => { setCustom(next); localStorage.setItem('imposter-custom-categories',JSON.stringify(next)) }
  const startRound = (reuseConfig = true) => {
    const cat = categories.find(c=>c.id===selected)
    if (!cat || !cat.words.length || players<3 || imposters<1 || imposters>=players) return
    const available = cat.words.filter(w=>w.trim())
    if (!available.length) return
    const otherWords = available.filter(w=>w.toLocaleLowerCase()!==word.toLocaleLowerCase())
    const wordPool = otherWords.length ? otherWords : available
    setWord(wordPool[Math.floor(Math.random()*wordPool.length)])
    const imposterIndices = new Set(shuffled(Array.from({length:players},(_,i)=>i)).slice(0,imposters))
    const previousImposters = roundPlayers.flatMap((p,i)=>p.imposter?[i]:[])
    if (previousImposters.length===imposters && previousImposters.every(i=>imposterIndices.has(i))) {
      const nextImposters = shuffled(Array.from({length:players},(_,i)=>i)).slice(0,imposters)
      if (nextImposters.every(i=>previousImposters.includes(i))) {
        const swapped = new Set(previousImposters)
        const imp = previousImposters[0]
        const citizen = Array.from({length:players},(_,i)=>i).find(i=>!swapped.has(i))!
        swapped.delete(imp); swapped.add(citizen)
        imposterIndices.clear(); swapped.forEach(i=>imposterIndices.add(i))
      } else {
        imposterIndices.clear(); nextImposters.forEach(i=>imposterIndices.add(i))
      }
    }
    setRoundPlayers(Array.from({length:players},(_,i)=>({name:`Player ${i+1}`,imposter:imposterIndices.has(i)})))
    setCurrent(0); setRevealed(false); setScreen('play'); setManage(false)
    if (!reuseConfig) { setPlayers(5); setImposters(1); setSelected('animals') }
  }
  const changePlayers = (n:number) => { const p=Math.max(3,Math.min(20,n)); setPlayers(p); setImposters(v=>Math.min(v,p-1)) }
  const changeImposters = (n:number) => setImposters(Math.max(1,Math.min(players-1,n)))
  const openNewCategory = () => { setEditId(null); setCatName(''); setCatWords(''); setError('') }
  const editCategory = (cat:Category) => { setEditId(cat.id); setCatName(cat.name); setCatWords(cat.words.join('; ')); setError('') }
  const saveCategory = () => {
    const name=catName.trim()
    const words=[...new Map(catWords.split(';').map(w=>w.trim()).filter(Boolean).map(w=>[w.toLocaleLowerCase(),w])).values()]
    if(!name){setError('Give your category a name first.');return}
    if(!words.length){setError('Add at least one word, separated by semicolons.');return}
    if(categories.some(c=>c.name.toLocaleLowerCase()===name.toLocaleLowerCase()&&c.id!==editId)){setError('That category name is already in use.');return}
    const next=editId?custom.map(c=>c.id===editId?{...c,name,words}:c):[...custom,{id:newCategoryId(),name,icon:'✨',words}]
    persist(next); if(!editId) setSelected(next.at(-1)!.id); openNewCategory()
  }
  const deleteCategory = (id:string) => { persist(custom.filter(c=>c.id!==id)); if(selected===id)setSelected('animals'); setConfirmDelete(null) }
  const enterManager = () => { setManage(true); openNewCategory() }

  return <main className="app-bg min-h-screen">
    <div className="phone-shell no-select">
      <header className="mb-7 flex items-center justify-between">
        <button onClick={()=>screen==='setup'?undefined:(screen==='results'?setScreen('setup'):undefined)} aria-label="Imposter home" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-lg">✳</span><span className="display-font text-sm font-bold tracking-[.19em] text-white">IMPOSTER<span className="text-violet-300">.</span></span>
        </button>
        <span className="rounded-full border border-white/[.08] bg-white/[.03] px-3 py-1.5 text-[10px] font-semibold tracking-[.13em] text-white/40">THE PARTY GAME</span>
      </header>
      <AnimatePresence mode="wait" initial={false}>
        {screen==='setup'&&<motion.section key="setup" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:reduced?0:.24}}>
          {!manage ? <>
            <div className="relative mb-7 overflow-hidden rounded-[30px] border border-violet-200/[.12] bg-[linear-gradient(142deg,#211936_0%,#171326_55%,#151223_100%)] px-6 pb-6 pt-7 shadow-[0_20px_60px_rgba(0,0,0,.2)]">
              <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-violet-500/20 blur-[55px]"/><div className="relative">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-violet-300/20 bg-violet-300/[.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.15em] text-violet-200"><Sparkles size={12}/> A little deception goes a long way</div>
                <h1 className="display-font mb-1 text-[46px] font-bold leading-[1.03] tracking-[-.055em]">IMPOSTER</h1><p className="text-[13px] leading-5 text-white/55">One word. Different identities.<br/>Find the imposters.</p>
                <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-white/35"><LockKeyhole size={12}/> One phone · Pass & play</div>
              </div>
            </div>
            <div className="mb-6 rounded-[26px] border border-white/[.07] bg-[#14121f] p-5">
              <div className="mb-5 flex items-center gap-2"><Settings2 size={15} className="text-violet-300"/><span className="text-xs font-bold uppercase tracking-[.14em] text-white/70">Set the scene</span></div>
              <div className="mb-5 grid grid-cols-2 gap-3">
                <CountControl title="Players" value={players} min={3} max={20} onChange={changePlayers} icon={<Users size={14}/>}/>
                <CountControl title="Imposters" value={imposters} min={1} max={players-1} onChange={changeImposters} icon={<ShieldAlert size={14}/>}/>
              </div>
              <div className="flex items-center justify-between"><span className="text-[11px] text-white/40">Player names are ready to go</span><span className="rounded-md bg-white/[.04] px-2 py-1 text-[10px] text-white/50">{players} players</span></div>
            </div>
            <div className="mb-3 flex items-end justify-between px-1"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[.16em] text-violet-300/75">Choose a category</p><h2 className="display-font text-[19px] font-semibold tracking-tight">Pick your world</h2></div><span className="mb-0.5 text-[10px] text-white/35">{categories.length} categories</span></div>
            <div className="category-scroll -mx-[22px] mb-4 flex gap-2 overflow-x-auto px-[22px] pb-2">
              {categories.map(cat=><button key={cat.id} onClick={()=>setSelected(cat.id)} className={`min-w-[118px] rounded-2xl border px-3.5 py-3 text-left transition ${selected===cat.id?'border-violet-300/55 bg-violet-400/[.14] shadow-[0_0_22px_rgba(147,105,255,.09)]':'border-white/[.07] bg-white/[.025] active:bg-white/[.06]'}`}>
                <span className="mb-2 block text-[21px]">{cat.icon}</span><span className="block truncate text-xs font-semibold">{cat.name}</span><span className={`mt-1 block text-[10px] ${selected===cat.id?'text-violet-200/70':'text-white/35'}`}>{cat.words.length} words</span>
                {selected===cat.id&&<span className="mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-violet-200"><Check size={11}/> Selected</span>}
              </button>)}
            </div>
            <button onClick={enterManager} className="mb-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl border border-white/[.08] bg-white/[.025] text-xs font-semibold text-white/65 transition active:bg-white/[.06]"><WandSparkles size={14} className="text-violet-300"/> Manage categories <ArrowRight size={13} className="text-white/35"/></button>
            <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/[.06] bg-[#14121f] px-4 py-3"><span className="flex items-center gap-2 text-xs text-white/55"><span className="text-base">{activeCategory?.icon}</span>{players} players · {imposters} imposter{imposters>1?'s':''}</span><span className="text-[10px] text-white/35">{activeCategory?.name}</span></div>
            <button onClick={()=>startRound()} disabled={!activeCategory?.words.length} className={`${buttonBase} flex w-full items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-[#8558e9] text-sm shadow-[0_8px_28px_rgba(130,88,233,.24)] hover:brightness-110`}><Flame size={16}/> Start Game <ArrowRight size={15}/></button>
            <p className="mt-3 text-center text-[10px] text-white/25">Keep the screen to yourself when it’s your turn</p>
          </> : <>
            <div className="mb-5 flex items-center gap-3"><button onClick={()=>setManage(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.08] bg-white/[.03]"><ChevronLeft size={18}/></button><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-violet-300">Make it yours</p><h1 className="display-font text-xl font-semibold">Manage categories</h1></div></div>
            <div className="mb-5 rounded-3xl border border-violet-300/15 bg-[#181427] p-5">
              <div className="mb-4 flex items-center justify-between"><h2 className="display-font text-base font-semibold">{editId?'Edit category':'Create a category'}</h2>{editId&&<button onClick={openNewCategory} className="text-[11px] text-violet-200">New category</button>}</div>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Category name</label><input value={catName} onChange={e=>setCatName(e.target.value)} placeholder="Anime characters" maxLength={35} className="mb-4 min-h-[46px] w-full rounded-xl border border-white/[.08] bg-[#0f0d19] px-3.5 text-sm placeholder:text-white/25"/>
              <label className="mb-2 block text-[10px] font-bold uppercase tracking-[.12em] text-white/45">Enter words</label><textarea value={catWords} onChange={e=>setCatWords(e.target.value)} placeholder="Naruto; Luffy; Goku; Ichigo; Gojo" rows={4} className="w-full resize-y rounded-xl border border-white/[.08] bg-[#0f0d19] px-3.5 py-3 text-sm leading-6 placeholder:text-white/25"/>
              <p className="mt-2 text-[10px] leading-4 text-white/35">Separate each word using a semicolon (;). Duplicates are removed automatically.</p>
              {error&&<p className="mt-3 rounded-xl border border-rose-300/15 bg-rose-300/[.07] px-3 py-2 text-xs text-rose-200">{error}</p>}
              <button onClick={saveCategory} className={`${buttonBase} mt-4 w-full bg-violet-500 text-sm text-white`}>{editId?'Save changes':'Save category'}</button>
            </div>
            <h2 className="mb-3 px-1 text-[10px] font-bold uppercase tracking-[.14em] text-white/45">Your categories <span className="ml-1 text-white/25">({categories.length})</span></h2>
            <div className="space-y-2 pb-2">{categories.map(cat=><div key={cat.id} className="rounded-2xl border border-white/[.06] bg-white/[.025] p-3.5">
              <div className="flex items-center gap-3"><span className="text-xl">{cat.icon}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{cat.name}</p><p className="text-[10px] text-white/35">{cat.words.length} words {cat.builtin?'· built in':'· custom'}</p></div>{!cat.builtin&&<><button onClick={()=>editCategory(cat)} className="min-h-[38px] rounded-xl border border-white/[.08] px-3 text-[11px] font-semibold text-violet-200">Edit</button><button onClick={()=>setConfirmDelete(cat.id)} aria-label={`Delete ${cat.name}`} className="grid h-[38px] w-[38px] place-items-center rounded-xl border border-white/[.08] text-white/45"><Trash2 size={14}/></button></>}</div>
              <details className="mt-3 border-t border-white/[.06] pt-2"><summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-semibold text-white/40">View words <ChevronDown size={12}/></summary><p className="mt-2 text-[11px] leading-5 text-white/45">{cat.words.join(' · ')}</p></details>
            </div>)}</div>
            {confirmDelete&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:items-center"><motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#1a1727] p-5"><p className="mb-1 display-font text-lg font-semibold">Delete this category?</p><p className="mb-5 text-xs leading-5 text-white/45">The category and its words will be removed from this device.</p><div className="flex gap-2"><button onClick={()=>setConfirmDelete(null)} className={`${buttonBase} flex-1 border border-white/10 text-sm`}>Keep it</button><button onClick={()=>deleteCategory(confirmDelete)} className={`${buttonBase} flex-1 bg-rose-500/90 text-sm`}>Delete category</button></div></motion.div></div>}
          </>}
        </motion.section>}

        {screen==='play'&&<motion.section key="play" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:reduced?0:.24}} className="flex min-h-[calc(100dvh-100px)] flex-col">
          <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-violet-300"><span className="h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_#b49aff]"/> {current<roundPlayers.length?'Private turn':'All roles delivered'}</div><span className="text-[11px] text-white/40">{current<roundPlayers.length?<>Player {current+1} <span className="text-white/20">/</span> {roundPlayers.length}</>:'Ready to reveal'}</span></div>
          <div className="mb-7 h-1 overflow-hidden rounded-full bg-white/[.07]"><motion.div initial={false} animate={{width:`${(current/roundPlayers.length)*100}%`}} className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"/></div>
          <div className="relative flex flex-1 flex-col justify-center">
            <AnimatePresence mode="wait">
            {current<roundPlayers.length?<motion.div key={current} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,transition:{duration:0}}} transition={{duration:reduced?0:.2}} className="text-center">
              <div className="mx-auto mb-6 grid h-[72px] w-[72px] place-items-center rounded-[24px] border border-violet-300/15 bg-violet-300/[.07] text-violet-200"><LockKeyhole size={27}/></div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.19em] text-violet-300">Pass the phone</p><h1 className="display-font mb-2 text-[34px] font-bold tracking-tight">Player {current+1}</h1><p className="mx-auto mb-9 max-w-[260px] text-sm leading-6 text-white/45">Make sure nobody else can see your screen. Your secret is just for you.</p>
              {!revealed ? <button onClick={()=>setRevealed(true)} className={`${buttonBase} mx-auto flex w-full max-w-[350px] items-center justify-center gap-2.5 bg-gradient-to-r from-violet-500 to-[#8558e9] text-sm shadow-[0_8px_30px_rgba(130,88,233,.2)]`}><Eye size={16}/> I’m ready — reveal my card</button> : <>
                <motion.div initial={{rotateY:90,opacity:0,scale:.94}} animate={{rotateY:0,opacity:1,scale:1}} transition={{duration:reduced?0:.48,ease:[.2,.7,.2,1]}} style={{transformStyle:'preserve-3d'}} className={`mx-auto mb-6 flex min-h-[226px] w-full max-w-[350px] flex-col items-center justify-center rounded-[30px] border px-6 py-8 shadow-[0_22px_55px_rgba(0,0,0,.28)] ${roundPlayers[current].imposter?'border-rose-300/30 bg-[radial-gradient(ellipse_at_top,rgba(237,91,133,.2),transparent_70%),#211420]':'border-violet-300/25 bg-[radial-gradient(ellipse_at_top,rgba(153,117,255,.2),transparent_70%),#1a172a]'}`}>
                  {roundPlayers[current].imposter?<><span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-rose-300/10 text-rose-200"><EyeOff size={22}/></span><p className="display-font text-xl font-bold tracking-tight text-rose-100">You are the Imposter!</p><p className="mt-3 max-w-[240px] text-xs leading-5 text-rose-100/55">You don’t know the secret word. Blend in and don’t get caught.</p></>:<><p className="mb-3 text-[10px] font-bold uppercase tracking-[.19em] text-violet-200/70">Your secret word</p><h2 className="display-font text-[clamp(28px,9vw,40px)] font-bold uppercase tracking-[.02em] text-white">{word}</h2></>}
                </motion.div>
                <p className="mb-5 text-[10px] text-white/30">Memorize it. Then keep it secret.</p><button onClick={()=>{setRevealed(false);setCurrent(v=>v+1)}} className={`${buttonBase} mx-auto flex w-full max-w-[350px] items-center justify-center gap-2 border border-white/[.1] bg-white/[.04] text-sm`}><EyeOff size={15}/> Hide card & pass phone <ArrowRight size={15}/></button>
              </>}
            </motion.div>:<motion.div key="done" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="text-center"><div className="mx-auto mb-6 grid h-[74px] w-[74px] place-items-center rounded-[25px] border border-emerald-300/15 bg-emerald-300/[.07] text-emerald-200"><Check size={30}/></div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-200">All clear</p><h1 className="display-font mb-3 text-[29px] font-bold tracking-tight">Everyone’s got a role!</h1><p className="mx-auto mb-8 max-w-[280px] text-sm leading-6 text-white/45">Now discuss, give clues, and figure out who’s bluffing.</p><button onClick={()=>setScreen('results')} className={`${buttonBase} mx-auto flex w-full max-w-[350px] items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-[#8558e9] text-sm`}><Sparkles size={16}/> Reveal imposters <ArrowRight size={15}/></button><p className="mt-4 text-[10px] text-white/25">Only show everyone when you’re ready!</p></motion.div>}
            </AnimatePresence>
          </div>
          <div className="mt-6 flex items-center justify-center gap-1.5">{roundPlayers.map((_,i)=><span key={i} className={`h-1.5 rounded-full transition-all ${i<current?'w-3 bg-violet-300':i===current&&current<roundPlayers.length?'w-5 bg-violet-400':'w-1.5 bg-white/15'}`}/>)}</div>
        </motion.section>}

        {screen==='results'&&<motion.section key="results" initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:reduced?0:.3}} className="pt-4">
          <div className="mb-7 text-center"><motion.div initial={{scale:.6,rotate:-12}} animate={{scale:1,rotate:0}} transition={{type:'spring',stiffness:220,damping:13}} className="mx-auto mb-5 grid h-[76px] w-[76px] place-items-center rounded-[26px] border border-amber-200/20 bg-amber-300/[.09] text-3xl">🕵️</motion.div><p className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-amber-200/75">The truth is out</p><h1 className="display-font text-[30px] font-bold tracking-tight">The imposters were...</h1></div>
          <div className="mb-4 rounded-[28px] border border-rose-300/20 bg-[radial-gradient(ellipse_at_top,rgba(237,91,133,.13),transparent_70%),#19131f] p-6 text-center"><p className="mb-4 text-[10px] font-bold uppercase tracking-[.15em] text-rose-200/60">Caught in the act</p><div className="flex flex-wrap justify-center gap-2">{roundPlayers.filter(p=>p.imposter).map(p=><motion.span key={p.name} initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} className="rounded-full border border-rose-200/20 bg-rose-300/[.1] px-4 py-2 text-sm font-semibold text-rose-100">{p.name}</motion.span>)}</div></div>
          <div className="mb-5 rounded-[28px] border border-violet-300/20 bg-[radial-gradient(ellipse_at_top,rgba(153,117,255,.14),transparent_72%),#191626] p-6 text-center"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-violet-200/60">The secret word was</p><p className="display-font text-[32px] font-bold uppercase tracking-wide">{word}</p><p className="mt-2 text-xs text-white/40">{activeCategory?.icon} {activeCategory?.name}</p></div>
          <div className="mb-7 flex items-center justify-center gap-4 rounded-2xl border border-white/[.06] bg-white/[.025] py-3 text-[11px] text-white/45"><span className="flex items-center gap-1.5"><Users size={13}/>{roundPlayers.length} players</span><span className="h-3 w-px bg-white/10"/><span className="flex items-center gap-1.5"><ShieldAlert size={13}/>{imposters} imposter{imposters>1?'s':''}</span></div>
          <details className="mb-6 rounded-2xl border border-white/[.06] bg-white/[.025] px-4 py-3"><summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-white/65">See everyone’s role <ChevronDown size={14}/></summary><div className="mt-3 space-y-2">{roundPlayers.map(p=><div key={p.name} className="flex items-center justify-between text-xs"><span className="text-white/65">{p.name}</span><span className={p.imposter?'text-rose-200':'text-violet-200'}>{p.imposter?'Imposter':'Knows the word'}</span></div>)}</div></details>
          <button onClick={()=>startRound()} className={`${buttonBase} mb-3 flex w-full items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-[#8558e9] text-sm`}><RotateCcw size={15}/> Play again</button><button onClick={()=>{setScreen('setup');setCurrent(0);setRevealed(false);setWord('');setRoundPlayers([])}} className={`${buttonBase} w-full border border-white/[.1] bg-white/[.025] text-sm text-white/70`}>New game</button>
        </motion.section>}
      </AnimatePresence>
    </div>
  </main>
}

function CountControl({title,value,min,max,onChange,icon}:{title:string;value:number;min:number;max:number;onChange:(n:number)=>void;icon:React.ReactNode}) {
  return <div className="rounded-2xl border border-white/[.07] bg-[#0f0d19] p-3"><div className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold text-white/45">{icon}{title}</div><div className="flex items-center justify-between"><button onClick={()=>onChange(value-1)} disabled={value<=min} aria-label={`Decrease ${title}`} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.025] text-white/65"><Minus size={14}/></button><span className="display-font text-[25px] font-semibold tabular-nums">{value}</span><button onClick={()=>onChange(value+1)} disabled={value>=max} aria-label={`Increase ${title}`} className="grid h-9 w-9 place-items-center rounded-xl border border-white/[.08] bg-white/[.025] text-white/65"><Plus size={14}/></button></div></div>
}
