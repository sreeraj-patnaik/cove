import { useCallback, useEffect, useState } from 'react';
import { Copy, LogOut, Plus, Send, Settings, Trash2, UserPlus, Users, X } from 'lucide-react';
import { authenticate, savedSession, type Session } from './auth';
import { createGroup, deleteGroup, joinGroup, listGroups, type Group } from './groups';
import { loadMessages, removeDemoData, saveMessage, setting, saveSetting, type StoredMessage } from './storage';
import { useRoom } from './realtime';


function UpdateNotification() {
    const [updateReady, setUpdateReady] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
  
    useEffect(() => {
      if (!('serviceWorker' in navigator)) return;
  
      let registration: ServiceWorkerRegistration | undefined;
  
      const ready = () => setUpdateReady(true);
  
      const controllerChanged = () => {
        if (refreshing) {
          window.location.reload();
        }
      };
  
      const checkRegistration = async () => {
        registration = await navigator.serviceWorker.getRegistration();
  
        if (registration?.waiting && navigator.serviceWorker.controller) {
          setUpdateReady(true);
        }
      };
  
      window.addEventListener('cove-update-ready', ready);
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        controllerChanged
      );
  
      void checkRegistration();
  
      return () => {
        window.removeEventListener('cove-update-ready', ready);
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          controllerChanged
        );
      };
    }, [refreshing]);
  
    const applyUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
  
      if (!registration?.waiting) {
        setUpdateReady(false);
        return;
      }
  
      setRefreshing(true);
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    };
  
    if (!updateReady) return null;
  
    return (
      <div className="update-banner" role="status">
        <div>
          <strong>A little closer, a little newer.</strong>
          <p>
            {refreshing
              ? 'Updating COVE...'
              : 'A new version of COVE is ready.'}
          </p>
        </div>
  
        {!refreshing && (
          <>
            <button onClick={() => void applyUpdate()}>
              Refresh COVE
            </button>
  
            <button
              onClick={() => setUpdateReady(false)}
              aria-label="Dismiss update notification"
            >
              Later
            </button>
          </>
        )}
      </div>
    );
  }

  export function App() {
    const [session, setSession] = useState<Session | null>(savedSession);
  
    return (
      <>
        <UpdateNotification />
  
        {session ? (
          <Cove
            session={session}
            signOut={() => {
              sessionStorage.removeItem('cove-session');
              setSession(null);
            }}
          />
        ) : (
          <Auth onSuccess={setSession} />
        )}
      </>
    );
  }
function Auth({ onSuccess }: { onSuccess: (s: Session) => void }) { const [register, setRegister] = useState(false); const [name, setName] = useState(''); const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const submit = async (e: React.FormEvent) => { e.preventDefault(); try { setError(''); onSuccess(await authenticate(register ? 'register' : 'login', { displayName: name, username, password })); } catch (x) { setError(x instanceof Error ? x.message : 'Unable to sign in.'); } }; return <main className="auth-shell"><form className="auth-card" onSubmit={submit}><p className="eyebrow">COVE</p><h1>A little closer.</h1><p className="auth-copy">A private world for your closest friends.</p>{register && <label>Display name<input value={name} onChange={e => setName(e.target.value)} required/></label>}<label>Username<input value={username} onChange={e => setUsername(e.target.value.toLowerCase())} required/></label><label>Password<input type="password" minLength={12} value={password} onChange={e => setPassword(e.target.value)} required/></label>{error && <p className="auth-error">{error}</p>}<button className="primary">{register ? 'Create account' : 'Sign in'}</button><button type="button" className="text-button" onClick={() => setRegister(!register)}>{register ? 'Already a member? Sign in' : 'New here? Create an account'}</button></form></main>; }
function Cove({ session, signOut }: { session: Session; signOut: () => void }) { const [groups, setGroups] = useState<Group[]>([]); const [active, setActive] = useState<Group | null>(null); const [messages, setMessages] = useState<StoredMessage[]>([]); const [code, setCode] = useState(''); const [draft, setDraft] = useState(''); const [modal, setModal] = useState<'create'|'join'|'profile'|null>(null); const [notice, setNotice] = useState(''); const refresh = useCallback(async () => { try { const d = await listGroups(session); setGroups(d.groups); setActive(a => a && d.groups.find(g => g.id === a.id) || d.groups[0] || null); } catch (x) { setNotice(x instanceof Error ? x.message : 'Could not load groups.'); } }, [session]); useEffect(() => { void removeDemoData().then(refresh); }, [refresh]); useEffect(() => { if (!active) return; void loadMessages(active.id).then(setMessages); void setting(`group-code:${active.id}`, '').then(setCode); }, [active]); const receive = useCallback((m: StoredMessage) => { setMessages(x => x.some(i => i.id === m.id) ? x : [...x, m]); void saveMessage(m); }, []); const delivered = useCallback((id: string) => setMessages(x => x.map(m => m.id === Number(id) ? { ...m, state: 'Delivered' } : m)), []); const room = useRoom(session, active?.id || '', code, receive, delivered); const send = async () => { if (!active || !draft.trim()) return; if (!code) return setNotice('Set a private group code in Group settings first.'); const m: StoredMessage = { id: Date.now(), conversationId: active.id, from: 'me', text: draft.trim(), time: new Date().toLocaleTimeString([], { hour:'numeric',minute:'2-digit' }), state:'Queued' }; setMessages(x => [...x,m]); void saveMessage(m); setDraft(''); if (await room.send(m.text,String(m.id))) { const n={...m,state:'Relayed' as const}; setMessages(x=>x.map(i=>i.id===m.id?n:i)); void saveMessage(n); } }; const create=async(n:string)=>{const {group}=await createGroup(session,n);await refresh();setActive(group);setModal(null);}; const join=async(c:string)=>{const {group}=await joinGroup(session,c);await refresh();setActive(group);setModal(null);}; const remove=async()=>{if(!active||!confirm(`Delete ${active.name}?`))return;await deleteGroup(session,active.id);await refresh();}; return <main className="product"><aside className="groups"><div className="brand">cove</div><button onClick={()=>setModal('profile')} className="me">{session.user.displayName[0]}</button><div className="group-list">{groups.map(g=><button key={g.id} onClick={()=>setActive(g)} className={active?.id===g.id?'group active':'group'}><Users size={17}/><span>{g.name}</span></button>)}</div><button className="round" onClick={()=>setModal('create')}><Plus/></button><button className="round" onClick={()=>setModal('join')}><UserPlus/></button></aside><section className="panel">{active?<><header className="panel-head"><div><p className="eyebrow">PRIVATE GROUP</p><h1>{active.name}</h1><small className={room.status}>{room.status==='connected'?'● Live':'○ Offline'}</small></div><button className="icon" onClick={()=>setModal('profile')}><Settings/></button></header><div className="invite"><span>Invite code: <b>{active.inviteCode}</b></span><button onClick={()=>void navigator.clipboard.writeText(active.inviteCode).then(()=>setNotice('Invite code copied.'))}><Copy size={15}/> Copy</button></div><div className="message-list">{messages.length===0?<div className="empty"><h2>Your group is ready.</h2><p>Share the invite code, then set the same private group code with your friends.</p></div>:messages.map(m=><article className={`message ${m.from}`} key={m.id}><p>{m.text}</p><small>{m.time} · {m.state||''}</small></article>)}</div><form className="composer" onSubmit={e=>{e.preventDefault();void send();}}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={`Message ${active.name}`}/><button className="primary"><Send size={18}/></button></form></>:<div className="empty big"><h1>Create or join a group</h1><p>There are no groups in your account yet.</p><button className="primary" onClick={()=>setModal('create')}>Create your first group</button></div>}</section>{modal&&<Modal close={()=>setModal(null)}>{modal==='create'&&<GroupForm title="Create a group" action="Create group" onSubmit={create}/>} {modal==='join'&&<GroupForm title="Join with an invite code" action="Join group" onSubmit={join}/>} {modal==='profile'&&<Profile session={session} code={code} setCode={v=>{setCode(v);if(active)void saveSetting(`group-code:${active.id}`,v);}} remove={active?remove:undefined} signOut={signOut}/>}</Modal>}{notice&&<div className="toast">{notice}<button onClick={()=>setNotice('')}><X size={14}/></button></div>}</main>; }
function GroupForm({title,action,onSubmit}:{title:string;action:string;onSubmit:(v:string)=>Promise<void>}){const[v,setV]=useState('');const[e,setE]=useState('');return <form className="modal-card" onSubmit={async x=>{x.preventDefault();try{await onSubmit(v)}catch(r){setE(r instanceof Error?r.message:'Request failed.')}}}><h2>{title}</h2><input autoFocus value={v} onChange={x=>setV(x.target.value)} placeholder={action==='Join group'?'Invite code':'Group name'} required/>{e&&<p className="auth-error">{e}</p>}<button className="primary">{action}</button></form>}
function Profile({session,code:_code,setCode:_setCode,remove:_remove,signOut}:{session:Session;code:string;setCode:(v:string)=>void;remove?:()=>Promise<void>;signOut:()=>void}){return <div className="modal-card profile-card-global"><div className="profile-avatar">{session.user.displayName.slice(0,1).toUpperCase()}</div><p className="eyebrow">YOUR ACCOUNT</p><h2>{session.user.displayName}</h2><p>@{session.user.username}</p><div className="profile-row"><span>Profile photo</span><button className="text-button" disabled>Coming next</button></div><div className="profile-row"><span>Display name</span><button className="text-button" disabled>Coming next</button></div><div className="profile-row"><span>Password & security</span><button className="text-button" disabled>Coming next</button></div><small>Account settings apply everywhere. Group membership, invitations, and deletion belong to each group’s details screen.</small><button className="text-button signout" onClick={signOut}><LogOut size={16}/>Sign out</button></div>}
function Modal({children,close}:{children:React.ReactNode;close:()=>void}){return <div className="modal-backdrop"><button className="modal-close" onClick={close}><X/></button>{children}</div>}
