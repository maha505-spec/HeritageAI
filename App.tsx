import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Search, 
  Library, 
  User, 
  History, 
  LogOut,
  ChevronRight,
  ScrollText,
  Database,
  Share2,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation, 
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { analyzeManuscript, ManuscriptAnalysis } from './geminiService';
import KnowledgeGraph from './KnowledgeGraph';
import { useDropzone } from 'react-dropzone';
import Markdown from 'react-markdown';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, to, active }: any) => (
  <Link 
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

// ... (keep LoadingOverlay)

// --- Pages ---

const HistoryPage = ({ manuscripts }: any) => {
  // Prepare data for timeline chart
  const timelineData = manuscripts.reduce((acc: any[], m: any) => {
    const date = new Date(m.uploadDate).toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ date, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare data for entity stats
  const entityStats = [
    { name: 'Kings', value: manuscripts.reduce((acc: number, m: any) => acc + (m.entities.kings?.length || 0), 0), color: '#ef4444' },
    { name: 'Places', value: manuscripts.reduce((acc: number, m: any) => acc + (m.entities.places?.length || 0), 0), color: '#3b82f6' },
    { name: 'Temples', value: manuscripts.reduce((acc: number, m: any) => acc + (m.entities.temples?.length || 0), 0), color: '#10b981' },
    { name: 'Events', value: manuscripts.reduce((acc: number, m: any) => acc + (m.entities.events?.length || 0), 0), color: '#f59e0b' },
    { name: 'Dynasties', value: manuscripts.reduce((acc: number, m: any) => acc + (m.entities.dynasties?.length || 0), 0), color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Manuscript History</h1>
        <p className="text-gray-500">Track your digitalization progress and entity statistics.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Upload Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Entity Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entityStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {entityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Detailed History Table</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Manuscript</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Language</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Confidence</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entities</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {manuscripts.map((m: any) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={m.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      <span className="font-medium text-gray-900 line-clamp-1">{m.summary}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded uppercase">{m.language}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${m.confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{(m.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {Object.values(m.entities).flat().length} entities
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(m.uploadDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/manuscript/${m.id}`} className="text-emerald-600 hover:text-emerald-700 font-bold text-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
    <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
    <p className="text-emerald-800 font-medium animate-pulse">Processing Manuscript...</p>
  </div>
);

// --- Pages ---

const Login = () => {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          username: user.displayName,
          email: user.email,
          signupDate: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-emerald-100 text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ScrollText className="text-emerald-600" size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HeritageAI</h1>
        <p className="text-gray-500 mb-8">Ancient Manuscript Digitalization System</p>
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5 invert" alt="Google" />
          Sign in with Google
        </button>
      </motion.div>
    </div>
  );
};

const Dashboard = ({ user, manuscripts }: any) => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.displayName}</h1>
        <p className="text-gray-500">Here's an overview of your heritage archive.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
            <Library className="text-emerald-600" size={24} />
          </div>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Manuscripts</p>
          <p className="text-4xl font-bold text-gray-900">{manuscripts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <Database className="text-blue-600" size={24} />
          </div>
          <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Entities Extracted</p>
          <p className="text-4xl font-bold text-gray-900">
            {manuscripts.reduce((acc: number, m: any) => acc + Object.values(m.entities || {}).flat().length, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

const UploadManuscript = ({ user }: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ManuscriptAnalysis | null>(null);
  const navigate = useNavigate();

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.tiff'] },
    multiple: false
  });

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const analysis = await analyzeManuscript(base64, file.type);
        
        // Save to Firestore
        await addDoc(collection(db, 'manuscripts'), {
          ...analysis,
          userId: user.uid,
          imageUrl: reader.result as string, // In real app, upload to Storage
          uploadDate: new Date().toISOString()
        });

        setResult(analysis);
        setLoading(false);
      };
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {loading && <LoadingOverlay />}
      
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Upload Manuscript</h1>
        <p className="text-gray-500">Digitize palm leaves, inscriptions, and historical documents.</p>
      </header>

      {!result ? (
        <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-emerald-200 text-center">
          <div {...getRootProps()} className="cursor-pointer py-12">
            <input {...getInputProps()} />
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="text-emerald-600" size={32} />
            </div>
            {file ? (
              <p className="text-emerald-600 font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-lg font-semibold text-gray-900">
                  {isDragActive ? "Drop the file here" : "Drag & drop manuscript image"}
                </p>
                <p className="text-gray-500 mt-2">Supports JPG, PNG, TIFF</p>
              </>
            )}
          </div>
          {file && (
            <button 
              onClick={handleProcess}
              className="mt-6 bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
            >
              Start AI Processing
            </button>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Raw OCR Text</h3>
                <div className="bg-gray-50 p-4 rounded-xl font-mono text-sm max-h-60 overflow-y-auto">
                  {result.rawText}
                </div>
              </section>
              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Cleaned & Normalized</h3>
                <div className="prose prose-emerald max-w-none">
                  <Markdown>{result.cleanedText}</Markdown>
                </div>
              </section>
            </div>
            <div className="space-y-6">
              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Historical Insight</h3>
                <p className="text-gray-700 leading-relaxed italic">"{result.historicalInsight}"</p>
              </section>
              <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Summary</h3>
                <p className="text-gray-700">{result.summary}</p>
              </section>
            </div>
          </div>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Knowledge Graph</h3>
            <KnowledgeGraph entities={result.entities} />
          </section>

          <div className="flex justify-end">
            <button 
              onClick={() => navigate('/archive')}
              className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-all"
            >
              View in Archive
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const Archive = ({ manuscripts }: any) => {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Digital Archive</h1>
        <p className="text-gray-500">Your collection of digitized historical records.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {manuscripts.map((m: any) => (
          <motion.div 
            layout
            key={m.id} 
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="relative h-48">
              <img src={m.imageUrl} className="w-full h-full object-cover" alt="Manuscript" />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-emerald-600 uppercase">
                {m.language}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{m.summary}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-3">{m.historicalInsight}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {m.entities.kings.slice(0, 2).map((k: string) => (
                  <span key={k} className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase">{k}</span>
                ))}
                {m.entities.dynasties.slice(0, 1).map((d: string) => (
                  <span key={d} className="px-2 py-1 bg-purple-50 text-purple-600 text-[10px] font-bold rounded uppercase">{d}</span>
                ))}
              </div>
              <Link 
                to={`/manuscript/${m.id}`}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                View Details <ChevronRight size={16} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SearchPage = ({ manuscripts }: any) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(manuscripts);

  useEffect(() => {
    if (!query) {
      setResults(manuscripts);
      return;
    }
    const filtered = manuscripts.filter((m: any) => 
      m.rawText.toLowerCase().includes(query.toLowerCase()) ||
      m.summary.toLowerCase().includes(query.toLowerCase()) ||
      m.historicalInsight.toLowerCase().includes(query.toLowerCase()) ||
      Object.values(m.entities).flat().some((e: any) => e.toLowerCase().includes(query.toLowerCase()))
    );
    setResults(filtered);
  }, [query, manuscripts]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Semantic Search</h1>
        <p className="text-gray-500">Search through manuscripts using historical context and keywords.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text"
          placeholder="Search for kings, temples, dynasties, or events..."
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500 font-medium">{results.length} results found</p>
        <div className="grid grid-cols-1 gap-4">
          {results.map((m: any) => (
            <Link 
              to={`/manuscript/${m.id}`}
              key={m.id} 
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex gap-6 items-center"
            >
              <img src={m.imageUrl} className="w-24 h-24 rounded-xl object-cover" alt="Manuscript" />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{m.summary}</h3>
                <p className="text-sm text-gray-500 line-clamp-1">{m.historicalInsight}</p>
              </div>
              <ChevronRight className="text-gray-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const ManuscriptDetail = ({ manuscripts }: any) => {
  const { id } = useParams<{ id: string }>();
  const m = manuscripts.find((item: any) => item.id === id);

  if (!m) return <div>Not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{m.summary}</h1>
          <p className="text-gray-500">Processed on {new Date(m.uploadDate).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-3">
          <button className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            <Share2 size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <img src={m.imageUrl} className="w-full rounded-2xl shadow-lg border border-gray-100" alt="Manuscript" />
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <h3 className="text-emerald-800 font-bold mb-2">Confidence Score</h3>
            <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full" style={{ width: `${m.confidence * 100}%` }} />
            </div>
            <p className="text-emerald-700 text-sm mt-2 font-medium">{(m.confidence * 100).toFixed(1)}% accuracy</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Historical Insight</h3>
            <p className="text-gray-700 leading-relaxed italic">"{m.historicalInsight}"</p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Cleaned Text</h3>
              <div className="prose prose-emerald prose-sm max-w-none">
                <Markdown>{m.cleanedText}</Markdown>
              </div>
            </section>
            <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Translation</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{m.translatedText}</p>
            </section>
          </div>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Knowledge Graph</h3>
            <KnowledgeGraph entities={m.entities} />
          </section>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [manuscripts, setManuscripts] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setManuscripts([]);
      return;
    }
    const q = query(
      collection(db, 'manuscripts'), 
      where('userId', '==', user.uid),
      orderBy('uploadDate', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setManuscripts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFCF8]"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  if (!user) return <Login />;

  return (
    <Router>
      <div className="min-h-screen bg-[#FDFCF8] flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <ScrollText className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">HeritageAI</span>
            </div>

            <nav className="flex-1 space-y-2">
              <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" active={window.location.pathname === '/'} />
              <SidebarItem icon={Upload} label="Upload" to="/upload" active={window.location.pathname === '/upload'} />
              <SidebarItem icon={History} label="History" to="/history" active={window.location.pathname === '/history'} />
              <SidebarItem icon={Library} label="Archive" to="/archive" active={window.location.pathname === '/archive'} />
              <SidebarItem icon={Search} label="Search" to="/search" active={window.location.pathname === '/search'} />
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-100">
              <div className="flex items-center gap-3 mb-6 px-2">
                <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full border-2 border-emerald-100" alt="Profile" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={() => signOut(auth)}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 flex items-center px-6 lg:hidden">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-600">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <span className="ml-4 font-bold text-gray-900">HeritageAI</span>
          </header>

          <div className="p-6 lg:p-10 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={user} manuscripts={manuscripts} />} />
              <Route path="/upload" element={<UploadManuscript user={user} />} />
              <Route path="/history" element={<HistoryPage manuscripts={manuscripts} />} />
              <Route path="/archive" element={<Archive manuscripts={manuscripts} />} />
              <Route path="/search" element={<SearchPage manuscripts={manuscripts} />} />
              <Route path="/manuscript/:id" element={<ManuscriptDetail manuscripts={manuscripts} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
