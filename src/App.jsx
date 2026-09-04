import { useState, useMemo } from 'react';
import { 
  Home, Map as MapIcon, BookOpen, BarChart2, PlusCircle, Award, 
  Settings, X, Check, Cloud, MapPin, Calendar, Clock, Flame, Trash2
} from 'lucide-react';

import { useLocalStorage } from './hooks/useLocalStorage';
import { ROADMAP_STAGES, calculateJourneyProgress } from './utils/roadmap';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [logs, setLogs] = useLocalStorage('cloud-journey-logs', []);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // New Log State
  const [logTitle, setLogTitle] = useState('');
  const [logTimeStr, setLogTimeStr] = useState('1h');
  const [logCategory, setLogCategory] = useState(ROADMAP_STAGES[0]);

  // Derived Stats
  const stats = useMemo(() => {
    let totalDays = new Set();
    let totalHours = 0;
    
    logs.forEach(log => {
      totalDays.add(log.date);
      totalHours += log.durationHours;
    });

    // Calculate Streak (naive implementation for demo: checks consecutive logged days from today backwards)
    let streak = 0;
    let longestStreak = 0;
    
    // Sort unique dates descending
    const sortedDates = Array.from(totalDays).sort((a, b) => new Date(b) - new Date(a));
    const today = new Date().toISOString().split('T')[0];
    
    let currentCheck = new Date(today);
    for (let i = 0; i < sortedDates.length; i++) {
        const logDate = sortedDates[i];
        const logDateObj = new Date(logDate);
        
        // If it's today or exactly 1 day before the current check
        const diffDays = Math.round((currentCheck - logDateObj) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0 || diffDays === 1) {
            streak++;
            currentCheck = logDateObj;
        } else if (diffDays > 1) {
            break;
        }
    }
    
    // Simplistic longest streak check
    longestStreak = Math.max(streak, ...logs.map(l => 1)); // Placeholder for real longest streak logic

    const journey = calculateJourneyProgress(logs);

    return {
      totalDays: totalDays.size,
      totalHours,
      streak,
      longestStreak,
      journey
    };
  }, [logs]);

  const handleQuickLog = (e) => {
    e.preventDefault();
    
    // Parse time like 1h 30m OR 1.5 etc
    let hours = 0;
    const hrsMatch = logTimeStr.match(/(\d+(?:\.\d+)?)\s*h/i);
    const minMatch = logTimeStr.match(/(\d+)\s*m/i);
    
    if (hrsMatch) hours += parseFloat(hrsMatch[1]);
    if (minMatch) hours += parseFloat(minMatch[1]) / 60;
    if (!hrsMatch && !minMatch) {
       // fallback to just numbers
       const raw = parseFloat(logTimeStr);
       if (!isNaN(raw)) hours = raw;
    }
    
    if (hours <= 0) hours = 1; // fallback

    const newLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title: logTitle || `Studied ${logCategory}`,
      category: logCategory,
      durationHours: hours,
      notes: ''
    };

    setLogs([newLog, ...logs]);
    setIsLogModalOpen(false);
    
    // Reset form
    setLogTitle('');
    setLogTimeStr('1h');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "telos-backup.json");
    dlAnchorElem.click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          setLogs(imported);
          alert("Import successful!");
          setIsSettingsOpen(false);
        }
      } catch (err) {
        alert("Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteLog = (id) => {
    if (window.confirm("Are you sure you want to delete this log?")) {
      setLogs(logs.filter(log => log.id !== id));
    }
  };

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <header className="header">
        <div className="logo">
          <Cloud size={28} /> Telos
        </div>
        
        <nav className="nav-tabs">
          <button className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><Home size={18} /> Home</button>
          <button className={`tab-btn ${activeTab === 'journey' ? 'active' : ''}`} onClick={() => setActiveTab('journey')}><MapIcon size={18} /> Journey</button>
          <button className={`tab-btn ${activeTab === 'log' ? 'active' : ''}`} onClick={() => setActiveTab('log')}><BookOpen size={18} /> Log</button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}><BarChart2 size={18} /> Analytics</button>
          <button className={`tab-btn ${activeTab === 'extras' ? 'active' : ''}`} onClick={() => setActiveTab('extras')}><PlusCircle size={18} /> Extras</button>
          <button className={`tab-btn ${activeTab === 'milestones' ? 'active' : ''}`} onClick={() => setActiveTab('milestones')}><Award size={18} /> Milestones</button>
        </nav>
        
        <button className="tab-btn" onClick={() => setIsSettingsOpen(true)}>
          <Settings size={20} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="tab-content">
        
        {/* HOMEPAGE */}
        {activeTab === 'home' && (
          <div className="animate-fade-in">
            <button className="btn-primary hero-btn" onClick={() => setIsLogModalOpen(true)}>
              I Learned Today <Check size={28} />
            </button>

            <div className="grid-2">
              <div className="glass-panel stat-card">
                <Flame size={40} color="var(--warning)" />
                <div className="stat-value">{stats.streak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
              <div className="glass-panel stat-card">
                <Clock size={40} color="var(--primary)" />
                <div className="stat-value">{stats.totalHours.toFixed(1)}h</div>
                <div className="stat-label">Total Learned</div>
              </div>
            </div>
            
            <div className="glass-panel">
              <h3 style={{marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8}}><MapPin size={20} /> Current Position</h3>
              <p style={{fontSize: '1.2rem', fontWeight: 600}}>📍 Currently learning: <span style={{color: 'var(--primary)'}}>{stats.journey.current}</span></p>
              <p style={{color: 'var(--text-muted)'}}>📈 {stats.journey.percentage}% journey completed</p>
            </div>
          </div>
        )}

        {/* JOURNEY TAB */}
        {activeTab === 'journey' && (
          <div className="animate-fade-in glass-panel">
            <h2 style={{marginBottom: 24}}>My Adaptive Route</h2>
            <div className="journey-path">
              {ROADMAP_STAGES.map((stage, idx) => {
                const isCompleted = stats.journey.completed.includes(stage);
                const isCurrent = stats.journey.current === stage;
                
                return (
                  <div key={stage} className={`journey-step`}>
                    <div className={`step-icon ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                      {isCompleted ? <Check size={20} /> : (isCurrent ? <MapPin size={20} /> : idx + 1)}
                    </div>
                    <div className={`step-content ${isCurrent ? 'current' : ''}`}>
                      <strong style={{display: 'block'}}>{stage}</strong>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                        {isCompleted ? 'Completed' : (isCurrent ? 'You are here' : 'Next stop')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* LOG TAB */}
        {activeTab === 'log' && (
          <div className="animate-fade-in glass-panel">
            <h2 style={{marginBottom: 24}}>Learning History</h2>
            {logs.length === 0 ? <p>No logs yet. Go learn something!</p> : (
              <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                {logs.map(log => (
                  <div key={log.id} className="log-item">
                    <div className="log-details">
                      <div className="log-title">{log.title}</div>
                      <div className="log-meta">
                        <span><Calendar size={14} style={{display:'inline', verticalAlign:'middle'}}/> {log.date}</span>
                        <span>{log.category}</span>
                      </div>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <div style={{fontWeight: 600, color: 'var(--primary)'}}>{log.durationHours}h</div>
                      <button onClick={() => handleDeleteLog(log.id)} style={{background: 'transparent', color: 'var(--danger)', padding: 4}}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in">
            <div className="grid-3">
              <div className="glass-panel stat-card">
                <Calendar size={32} />
                <div className="stat-value">{stats.totalDays}</div>
                <div className="stat-label">Total Days</div>
              </div>
              <div className="glass-panel stat-card">
                <Award size={32} />
                <div className="stat-value">{stats.longestStreak}</div>
                <div className="stat-label">Longest Streak</div>
              </div>
              <div className="glass-panel stat-card">
                <Clock size={32} />
                <div className="stat-value">{(stats.totalHours / (stats.totalDays || 1)).toFixed(1)}h</div>
                <div className="stat-label">Avg. Study / Day</div>
              </div>
            </div>
            
            <div className="glass-panel">
               <h3>Consistency Heatmap (Placeholder)</h3>
               <p style={{color: 'var(--text-muted)'}}>In a full build, this would be a GitHub-style calendar grid rendering exactly your active days.</p>
            </div>
          </div>
        )}

        {/* EXTRAS TAB */}
        {activeTab === 'extras' && (
          <div className="animate-fade-in glass-panel">
            <h2>Extra Learning</h2>
            <p style={{color: 'var(--text-muted)', marginBottom: 20}}>Topics outside the main cloud roadmap.</p>
            {/* Logic filters log for categories NOT in ROADMAP_STAGES */}
            {logs.filter(l => !ROADMAP_STAGES.includes(l.category)).length === 0 ? 
              <p>No extra topics logged yet.</p> : 
              logs.filter(l => !ROADMAP_STAGES.includes(l.category)).map((log, idx) => (
                <div key={idx} style={{padding: 10, borderBottom: '1px solid var(--border)'}}>
                  <strong>{log.title}</strong> - {log.category} ({log.durationHours}h)
                </div>
              ))}
          </div>
        )}

        {/* MILESTONES TAB */}
        {activeTab === 'milestones' && (
          <div className="animate-fade-in glass-panel">
            <h2>Achievements</h2>
            <div style={{display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20}}>
              <div className={`glass-panel stat-card ${stats.streak >= 7 ? 'completed' : ''}`} style={{opacity: stats.streak >= 7 ? 1 : 0.4}}>
                 <Flame color="var(--warning)" size={32} />
                 <strong>7 Day Streak</strong>
                 <span>{stats.streak}/7</span>
              </div>
              <div className={`glass-panel stat-card ${stats.totalHours >= 50 ? 'completed' : ''}`} style={{opacity: stats.totalHours >= 50 ? 1 : 0.4}}>
                 <Clock color="var(--primary)" size={32} />
                 <strong>50 Hours</strong>
                 <span>{stats.totalHours}/50</span>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* QUICK LOG MODAL */}
      {isLogModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLogModalOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Log</h3>
              <button className="close-btn" onClick={() => setIsLogModalOpen(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleQuickLog}>
              <div className="form-group">
                <label>What did you learn?</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="e.g. EC2 Instances" 
                  value={logTitle}
                  onChange={e => setLogTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time spent? <span style={{fontWeight: 400}}>(e.g. 1h 30m, 45m, 2h)</span></label>
                <input 
                  type="text" 
                  value={logTimeStr}
                  onChange={e => setLogTimeStr(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select value={logCategory} onChange={e => setLogCategory(e.target.value)}>
                  <optgroup label="Roadmap">
                    {ROADMAP_STAGES.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                  </optgroup>
                  <optgroup label="Extras">
                    <option value="Terraform">Terraform</option>
                    <option value="Kubernetes">Kubernetes</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Custom">Other (Custom)</option>
                  </optgroup>
                </select>
              </div>

              <button type="submit" className="btn-primary" style={{marginTop: 24}}>
                <Check size={20} /> Complete Today's Learning
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
             <div className="modal-header">
              <h3>Data Management</h3>
              <button className="close-btn" onClick={() => setIsSettingsOpen(false)}><X size={20} /></button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
               <button className="btn-primary" onClick={handleExport}>Export Data (JSON)</button>
               <div style={{position: 'relative'}}>
                 <button className="btn-primary" style={{background: 'var(--surface-hover)'}}>Import Data (JSON)</button>
                 <input type="file" onChange={handleImport} style={{position: 'absolute', top:0, left:0, opacity:0, width:'100%', height:'100%', cursor:'pointer'}} />
               </div>
               <button className="btn-primary" style={{background: 'var(--danger)'}} onClick={() => {
                 if (window.confirm("Are you sure? This will wipe all logs.")) {
                    setLogs([]);
                    setIsSettingsOpen(false);
                 }
               }}>Hard Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
