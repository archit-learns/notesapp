import { useState, useEffect } from 'react';
import './App.css';


// 1. Define our Note structure
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function App() {

  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);


  // 2. State management
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [reminderMessage, setReminderMessage] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('');
  const [repeatSeconds, setRepeatSeconds] = useState('');

  useEffect(()=>{

    if (!token) return;

    fetch('http://localhost:5000/api/notes', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
    }).then((res)=>{
      if(!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    }).then((data: Note[])=>{
      setNotes(data);
    }).catch((err)=>{
      console.error(err);
    });
  },[token]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';

    try {
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Auth failed');

      if (isSignup) {
        alert('Signup successful! Please log in.');
        setIsSignup(false);
      } else {

        setToken(data.token);
      }
      setPassword('');
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Handle adding a note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !token) return;

    const newNote: Note = {
      id: crypto.randomUUID(), // Generates a unique ID in modern browsers
      title: title,
      content: content,
      createdAt: new Date().toLocaleTimeString(),
    };

    try{
      const response = await fetch('http://localhost:5000/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNote),
      });

      const savedNote = await response.json();

      if (!response.ok) throw new Error('Failed to add note');

      setNotes([savedNote, ...notes]);
      setTitle('');
      setContent('');
    } catch(err){
      console.error(err);
    }
  };


  const handleUpdateNote = async () => {
    if (!activeNote || !token) return;

    try {
      const response = await fetch(`http://localhost:5000/api/notes/${activeNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });

      const updatedNote = await response.json();
      if (!response.ok) throw new Error('Update failed');

      // Sync local state array
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
      setActiveNote(updatedNote);
      setIsEditing(false);
    } catch (err) { console.error(err); alert('Could not update note'); }
  };


const handleDeleteNote = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/notes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Delete failed');

      setNotes(notes.filter(n => n.id !== id));
      setActiveNote(null);
      setIsEditing(false);
    } catch (err) { console.error(err); alert('Could not delete note'); }
  };

const handleScheduleReminder = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!activeNote || !token || !reminderMessage.trim()) return;

  // Build the payload dynamically based on what the user filled out
  const payload: {
    noteId: string;
    message: string;
    delayInSeconds?: number;
    repeatEverySeconds?: number;
  } = {
    noteId: activeNote.id,
    message: reminderMessage,
  };

  if (delaySeconds) payload.delayInSeconds = parseInt(delaySeconds, 10);
  if (repeatSeconds) payload.repeatEverySeconds = parseInt(repeatSeconds, 10);

  try {
    const response = await fetch('http://localhost:5000/api/notes/reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // Pass our secure passport
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to schedule alarm');

    alert('⏰ Alarm scheduled beautifully inside Redis!');
    
    // Clear the form fields
    setReminderMessage('');
    setDelaySeconds('');
    setRepeatSeconds('');
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'An error occurred');
  }
};

const handleStopReminder = async () => {
  if (!activeNote || !token) return;

  try {
    const response = await fetch('http://localhost:5000/api/notes/reminder/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ noteId: activeNote.id })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to stop alarm');

    alert('🛑 Alarm successfully terminated inside Redis!');
  } catch (err: unknown) {
    alert(err instanceof Error ? err.message : 'An error occurred');
  }
};

const startEditing = () => {
    if (!activeNote) return;
    setEditTitle(activeNote.title);
    setEditContent(activeNote.content);
    setIsEditing(true);
  };

// --- RENDER CONDITION: Show Auth Screen if not logged in ---
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>{isSignup ? 'Create an Account' : 'Welcome Back'}</h2>
          <form onSubmit={handleAuthSubmit} className="note-form">
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button type="submit">{isSignup ? 'Sign Up' : 'Log In'}</button>
          </form>
          <p onClick={() => setIsSignup(!isSignup)} className="toggle-auth">
            {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR: Displays the list of saved notes */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Logged in as: {email}</h3>
          <button onClick={() => { setToken(null); setNotes([]); }} className="logout-btn">Logout</button>
        </div>
        <h2>My Notes ({notes.length})</h2>
        <div className="notes-list">
          {notes.length === 0 ? (
            <p className="empty-state">No notes yet...</p>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
                onClick={() => setActiveNote(note)}
              >
                <h3>{note.title}</h3>
                <span className="timestamp">{note.createdAt}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTENT: Create form & Active Note Viewer */}
      <main className="main-content">
        <section className="form-section">
          <h2>Create Note</h2>
          <form onSubmit={handleSubmit} className="note-form">
            <input 
              type="text" 
              placeholder="Note title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea 
              placeholder="Note content..." 
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
            <button type="submit">Add Note</button>
          </form>
        </section>

        {/* Preview Section */}
        {activeNote && (
          <section className="preview-section">
            <hr />
            {isEditing ? (
              <div className="note-form">
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                <textarea rows={4} value={editContent} onChange={(e) => setEditContent(e.target.value)}></textarea>
                <div className="btn-group">
                  <button onClick={handleUpdateNote} className="save-btn">Save Changes</button>
                  <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="view-header">
                  <h2>{activeNote.title}</h2>
                  <div className="btn-group">
                    <button onClick={startEditing} className="edit-btn">Edit</button>
                    <button onClick={() => handleDeleteNote(activeNote.id)} className="delete-btn">Delete</button>
                  </div>
                </div>
                <p className="note-body">{activeNote.content}</p>
                {/* ⏰ NEW: Alarm Scheduler Panel */}
                <div className="reminder-panel" style={{ marginTop: '20px', padding: '15px', border: '1px dashed #ccc', borderRadius: '6px' }}>
                  <h3>⏰ Schedule a Reminder for this Note</h3>
                  <form onSubmit={handleScheduleReminder} className="note-form">
                    <input 
                      type="text" 
                      placeholder="Alarm alert message (e.g., Take a break!)..." 
                      value={reminderMessage} 
                      onChange={(e) => setReminderMessage(e.target.value)} 
                      required
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <input 
                        type="number" 
                        placeholder="One-time delay (seconds)" 
                        value={delaySeconds} 
                        onChange={(e) => { setDelaySeconds(e.target.value); setRepeatSeconds(''); }} 
                      />
                      <span style={{ alignSelf: 'center' }}>OR</span>
                      <input 
                        type="number" 
                        placeholder="Repeat every (seconds)" 
                        value={repeatSeconds} 
                        onChange={(e) => { setRepeatSeconds(e.target.value); setDelaySeconds(''); }} 
                      />
                    </div>
                    <button type="submit" style={{ marginTop: '10px', backgroundColor: '#ff9800', color: 'white' }}>
                      Set Active Alarm
                    </button>
                  </form>

                  {/* Insert this right below your closing </form> tag inside the reminder-panel */}
                  <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <p style={{ fontSize: '0.85em', color: '#666' }}>
                      have an active loop running for this note? Stop it instantly:
                    </p>
                    <button 
                      onClick={handleStopReminder} 
                      style={{ backgroundColor: '#f44336', color: 'white', width: '100%' }}
                    >
                      🛑 Kill Active Alarm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}