import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme, type ColorTheme } from './context/ThemeContext';
import { generateRandomAlias, MOODS, WELLNESS_GOALS, THEMES, cn } from './constants';
import {
  Heart,
  MessageCircle,
  BarChart3,
  AlertCircle,
  LogOut,
  User as UserIcon,
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Activity,
  Droplets,
  Moon,
  Brain,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Bell,
  AlertTriangle,
  Sun,
  Palette,
  Settings,
  Trees,
  Waves,
  Calendar,
  Video,
  Users,
  ExternalLink,
  Plus,
  Phone,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { format, formatDistanceToNow } from 'date-fns';
// --- Components ---

const AdminSettings = ({ crisisResources, handleSaveCrisisResource, handleAdminAction }: any) => {
  const [newResource, setNewResource] = useState({ title: '', description: '', contact: '', category: 'general' });
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-heading dark:text-white">System Settings</h2>

      <section className="space-y-6">
        <Card>
          <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
            <ShieldAlert size={18} className="text-rose-600" /> Crisis Resources
          </h3>

          <div className="space-y-4 mb-6">
            {crisisResources.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{r.title}</p>
                  <p className="text-xs text-slate-700">{r.contact}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingId(r.id);
                      setNewResource({ title: r.title, description: r.description, contact: r.contact, category: r.category });
                    }}
                    className="p-2 l hover:text-primary-600 transition-colors"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => handleAdminAction('crisis-delete', r.id, 'delete')}
                    className="p-2 l hover:text-rose-600 transition-colors"
                  >
                    <ShieldAlert size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-primary-50/30 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 space-y-4">
            <h4 className="text-sm font-bold text-primary-700 dark:text-primary-400">{editingId ? 'Edit Resource' : 'Add New Resource'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Title (e.g. Suicide Prevention)"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm"
                value={newResource.title || ''}
                onChange={e => setNewResource({ ...newResource, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Contact (Phone or Link)"
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm"
                value={newResource.contact || ''}
                onChange={e => setNewResource({ ...newResource, contact: e.target.value })}
              />
              <textarea
                placeholder="Short description..."
                className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm"
                value={newResource.description || ''}
                onChange={e => setNewResource({ ...newResource, description: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button variant="ghost" onClick={() => {
                  setEditingId(null);
                  setNewResource({ title: '', description: '', contact: '', category: 'general' });
                }}>Cancel</Button>
              )}
              <Button onClick={() => {
                handleSaveCrisisResource(editingId ? { ...newResource, id: editingId } : newResource);
                setNewResource({ title: '', description: '', contact: '', category: 'general' });
                setEditingId(null);
              }}>
                {editingId ? 'Update Resource' : 'Add Resource'}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-primary-600" /> Security
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Global security and moderation settings.</p>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm font-medium">Auto-moderation</span>
                <div className="w-10 h-dark:text-slate-500 bg-primary-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Palette size={18} className="text-primary-600" /> Appearance
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-800">Global theme settings for the platform.</p>
              <div className="flex gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    className={cn("w-8 h-8 rounded-full border-2", t.id === 'default' ? 'border-primary-500' : 'border-transparent')}
                    style={{ backgroundColor: t.id === 'default' ? '#4f46e5' : t.id === 'ocean' ? '#0ea5e9' : '#10b981' }}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

const Button = ({ className, variant = 'primary', ...props }: any) => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/20',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-slate-800',
    ghost: 'text-slate-700 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    panic: 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse font-bold uppercase tracking-widest',
  };
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn('px-4 py-2 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2', variants[variant as keyof typeof variants], className)}
      {...props}
    />
  );
};

const Card = ({ children, className, ...props }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn('bg-surface border border-border-base rounded-2xl p-6 shadow-sm', className)}
    {...props}
  >
    {children}
  </motion.div>
);

// --- Pages ---

const LandingPage = ({ onStart, onLearnMore }: { onStart: (role?: string) => void, onLearnMore: () => void }) => (
  <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl"
    >
      <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Heart size={32} fill="currentColor" />
      </div>
      <h1 className="text-5xl font-bold text-heading dark:text-white mb-4 tracking-tight">SafeSpace</h1>
      <p className="text-xl text-slate-700 dark:text-slate-500 mb-8 leading-relaxed">
        An anonymous sanctuary for students. Log your mood, share your feelings, and find peer support in a safe, judgment-free environment.
      </p>
      <div className="flex flex-col gap-6 items-center">
        <div className="flex gap-4 justify-center">
          <Button onClick={() => onStart('student')} className="px-8 py-3 text-lg">Get Started</Button>
          <Button variant="outline" onClick={onLearnMore} className="px-8 py-3 text-lg">Learn More</Button>
        </div>

        <div className="flex gap-6 text-sm text-slate-600 border-t border-border-base pt-6 w-full justify-center">
          <button onClick={() => onStart('counselor')} className="hover:text-emerald-600 transition-colors flex items-center gap-2 font-medium">
            <Video size={16} /> Counselor Portal
          </button>
          <button onClick={() => onStart('admin')} className="hover:text-rose-600 transition-colors flex items-center gap-2 font-medium">
            <Shield size={16} /> Admin Portal
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

const AuthPage = ({ initialRole = 'student' }: { initialRole?: string }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState(initialRole);
  const [alias, setAlias] = useState(generateRandomAlias());
  const { login } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const body = isLogin ? { username, password } : { username, password, fullName, alias, role };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('An error occurred during authentication. Please try again.');
    }
  };

  const roleConfig: Record<string, { title: string; color: string; icon: any }> = {
    student: { title: 'Student Portal', color: 'text-primary-600', icon: <Users className="w-dark:text-slate-500 h-5" /> },
    counselor: { title: 'Counselor Portal', color: 'text-emerald-600', icon: <Video className="w-dark:text-slate-500 h-5" /> },
    admin: { title: 'Admin Portal', color: 'text-rose-600', icon: <Shield className="w-dark:text-slate-500 h-5" /> },
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-6">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="flex border-b border-border-base">
          {Object.entries(roleConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setRole(key)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors flex flex-col items-center gap-1 ${role === key
                  ? `${config.color} bg-surface border-b-2 border-current`
                  : 'text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50/50 dark:bg-slate-900/50'
                }`}
            >
              {config.icon}
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold mb-2 ${roleConfig[role].color}`}>
              {roleConfig[role].title}
            </h2>
            <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">
              {isLogin ? `Sign in to your ${role} account` : `Create a new ${role} account`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1">Username</label>
              <input
                type="text"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Enter your username"
                value={username || ''}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Enter your password"
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                {role === 'student' ? (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1">Your Anonymous Alias</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
                        value={alias || ''}
                        readOnly
                      />
                      <Button type="button" variant="outline" onClick={() => setAlias(generateRandomAlias())}>
                        Regen
                      </Button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic">This is how others will see you.</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 outline-none"
                      value={fullName || ''}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Enter your real name"
                    />
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic">Real names are required for verification.</p>
                  </div>
                )}
              </>
            )}

            <Button type="submit" className={`w-full py-3 mt-4 ${role === 'counselor' ? 'bg-emerald-600 hover:bg-emerald-700' :
                role === 'admin' ? 'bg-rose-600 hover:bg-rose-700' : ''
              }`}>
              {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              className="text-primary-600 hover:text-primary-700 hover:underline text-sm font-semibold"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

const CounselorProfile = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.fullName || '',
    specialties: '',
    bio: '',
    photo_url: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch('/api/counselor/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    };
    fetchProfile();
  }, [token]);

  const handleUpdateProfile = async () => {
    await fetch('/api/counselor/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(profile),
    });
    alert('Profile updated successfully');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-heading dark:text-white">Counselor Profile</h2>
      <Card className="max-w-2xl">
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={profile.photo_url || 'https://picsum.photos/seed/counselor/200/200'}
                className="w-32 h-32 rounded-3xl object-cover border-4 border-primary-100 dark:border-primary-900"
                referrerPolicy="no-referrer"
              />
              <button className="absolute -bottom-2 -right-2 bg-primary-600 text-white p-2 rounded-xl shadow-lg">
                <Palette size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-1">Display Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-1">Specialties (comma separated)</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              value={profile.specialties || ''}
              onChange={(e) => setProfile({ ...profile, specialties: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-1">Professional Bio</label>
            <textarea
              className="w-full px-4 py-2 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-1">Photo URL</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
              value={profile.photo_url || ''}
              onChange={(e) => setProfile({ ...profile, photo_url: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
          <Button className="w-full py-3" onClick={handleUpdateProfile}>Save Profile Changes</Button>
        </div>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { mode, setMode, toggleMode, colorTheme, setColorTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [moods, setMoods] = useState<any[]>([]);
  const [wellness, setWellness] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedCounselor, setSelectedCounselor] = useState<any>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingMethod, setBookingMethod] = useState('chat');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMood, setSelectedMood] = useState<any>(null);
  const [reflection, setReflection] = useState('');
  const [counselorData, setCounselorData] = useState<any>(null);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminCounselors, setAdminCounselors] = useState<any[]>([]);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminRooms, setAdminRooms] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [crisisResources, setCrisisResources] = useState<any[]>([]);
  const [showProposeRoomModal, setShowProposeRoomModal] = useState(false);
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '' });
  const [studentInsights, setStudentInsights] = useState<any>(null);
  const [sessionNotes, setSessionNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [aiNotifications, setAiNotifications] = useState<any[]>([]);
  const [aiAlerts, setAiAlerts] = useState<any[]>([]);
  const [showAiCriticalModal, setShowAiCriticalModal] = useState(false);
  const [criticalAlertMessage, setCriticalAlertMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetchData();
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('ai-critical-alert', (data) => {
      setCriticalAlertMessage(data.message);
      setShowAiCriticalModal(true);
    });

    return () => {
      newSocket.off('ai-critical-alert');
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && selectedRoom) {
      socket.emit('join-room', selectedRoom.id);
      socket.on('new-message', (msg) => {
        setMessages(prev => [...prev, {
          ...msg,
          reactions: msg.reactions || { heart: 0, hug: 0, support: 0 },
          userReactions: msg.userReactions || { heart: false, hug: false, support: false }
        }]);
      });
      socket.on('reaction-update', ({ messageId, reactions }) => {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, reactions } : m
        ));
      });
      return () => {
        socket.off('new-message');
        socket.off('reaction-update');
      };
    }
  }, [socket, selectedRoom]);

  const fetchData = async () => {
    const headers = { 'Authorization': `Bearer ${token}` };

    if (user?.role === 'student') {
      const [moodRes, wellnessRes, roomsRes, counselorRes, appointmentRes, aiNotifRes] = await Promise.all([
        fetch('/api/moods', { headers }),
        fetch('/api/wellness', { headers }),
        fetch('/api/rooms', { headers }),
        fetch('/api/counselors', { headers }),
        fetch('/api/appointments', { headers }),
        fetch('/api/ai/notifications', { headers })
      ]);
      if (moodRes.ok) setMoods(await moodRes.json());
      if (wellnessRes.ok) setWellness(await wellnessRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (counselorRes.ok) setCounselors(await counselorRes.json());
      if (appointmentRes.ok) setAppointments(await appointmentRes.json());
      if (aiNotifRes.ok) setAiNotifications(await aiNotifRes.json());
    } else if (user?.role === 'counselor') {
      const [dashRes, roomsRes, aiAlertRes, aiNotifRes] = await Promise.all([
        fetch('/api/counselor/dashboard', { headers }),
        fetch('/api/rooms', { headers }),
        fetch('/api/admin/ai/alerts', { headers }),
        fetch('/api/ai/notifications', { headers })
      ]);
      if (dashRes.ok) setCounselorData(await dashRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (aiAlertRes.ok) setAiAlerts(await aiAlertRes.json());
      if (aiNotifRes.ok) setAiNotifications(await aiNotifRes.json());
    } else if (user?.role === 'admin') {
      const [statsRes, usersRes, counselorsRes, reportsRes, roomsRes, adminRoomsRes, logsRes, aiAlertRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/counselors', { headers }),
        fetch('/api/admin/reports', { headers }),
        fetch('/api/rooms', { headers }),
        fetch('/api/admin/rooms', { headers }),
        fetch('/api/admin/logs', { headers }),
        fetch('/api/admin/ai/alerts', { headers })
      ]);
      if (statsRes.ok) setAdminStats(await statsRes.json());
      if (usersRes.ok) setAdminUsers(await usersRes.json());
      if (counselorsRes.ok) setAdminCounselors(await counselorsRes.json());
      if (reportsRes.ok) setAdminReports(await reportsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (adminRoomsRes.ok) setAdminRooms(await adminRoomsRes.json());
      if (logsRes.ok) setAdminLogs(await logsRes.json());
      if (aiAlertRes.ok) setAiAlerts(await aiAlertRes.json());

      const crisisRes = await fetch('/api/crisis-resources', { headers });
      if (crisisRes.ok) setCrisisResources(await crisisRes.json());
    } else {
      // For student and counselor, also fetch crisis resources for display
      const crisisRes = await fetch('/api/crisis-resources', { headers });
      if (crisisRes.ok) setCrisisResources(await crisisRes.json());
    }
  };

  const handleUpdateAppointmentStatus = async (id: number, status: string) => {
    await fetch(`/api/appointments/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleUpdateCounselorProfile = async (profileData: any) => {
    await fetch('/api/counselor/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(profileData),
    });
    fetchData();
  };

  const fetchStudentInsights = async (studentId: number) => {
    const headers = { 'Authorization': `Bearer ${token}` };
    const [insightsRes, notesRes] = await Promise.all([
      fetch(`/api/counselor/student/${studentId}/insights`, { headers }),
      fetch(`/api/session-notes/${studentId}`, { headers })
    ]);
    if (insightsRes.ok) setStudentInsights(await insightsRes.json());
    if (notesRes.ok) setSessionNotes(await notesRes.json());
    setActiveTab('student-insights');
  };

  const handleSaveNote = async (studentId: number) => {
    if (!newNote.trim()) return;
    await fetch('/api/session-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ studentId, notes: newNote }),
    });
    setNewNote('');
    fetchStudentInsights(studentId);
  };

  const handleAdminAction = async (type: 'user' | 'counselor' | 'report' | 'crisis-delete', id: number, action: string) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    let endpoint = '';
    let body = {};
    let method = 'POST';

    if (type === 'user') {
      endpoint = `/api/admin/users/${id}/status`;
      body = { status: action };
    } else if (type === 'counselor') {
      endpoint = `/api/admin/counselors/${id}/status`;
      body = { status: action };
    } else if (type === 'report') {
      endpoint = `/api/admin/reports/${id}/resolve`;
      body = { action };
    } else if (type === 'crisis-delete') {
      endpoint = `/api/admin/crisis-resources/${id}`;
      method = 'DELETE';
    }

    await fetch(endpoint, { method, headers, body: method === 'DELETE' ? undefined : JSON.stringify(body) });
    fetchData();
  };

  const handleRoomAction = async (id: number, status: string) => {
    await fetch(`/api/admin/rooms/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleProposeRoom = async () => {
    if (!newRoom.name.trim()) return;
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newRoom),
    });
    if (res.ok) {
      const data = await res.json();
      setShowProposeRoomModal(false);
      setNewRoom({ name: '', description: '' });
      if (data.status === 'active') {
        fetchData();
      } else {
        alert('Your room proposal has been submitted and is awaiting admin approval.');
      }
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create room');
    }
  };

  const handleSaveCrisisResource = async (resource: any) => {
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
    const method = resource.id ? 'PUT' : 'POST';
    const url = resource.id ? `/api/admin/crisis-resources/${resource.id}` : '/api/admin/crisis-resources';
    await fetch(url, { method, headers, body: JSON.stringify(resource) });
    fetchData();
  };

  const handlePopOutChat = () => {
    if (!selectedRoom) return;
    const width = 400;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(`${window.location.origin}?popout=chat&roomId=${selectedRoom.id}`, 'SafeSpace Chat', `width=${width},height=${height},left=${left},top=${top}`);
  };

  const handleBookAppointment = async () => {
    if (!selectedCounselor || !bookingDate) return;
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        counselorId: selectedCounselor.id,
        startTime: bookingDate,
        method: bookingMethod,
        notes: bookingNotes
      }),
    });
    if (res.ok) {
      setShowBookingModal(false);
      setBookingDate('');
      setBookingNotes('');
      fetchData();
      setActiveTab('home');
    }
  };

  const handleLogMood = async () => {
    if (!selectedMood) return;
    const res = await fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ emoji: selectedMood.emoji, reflection }),
    });
    if (res.ok) {
      setShowMoodModal(false);
      setSelectedMood(null);
      setReflection('');
      fetchData();
    }
  };

  const handleReact = async (messageId: number, reactionType: string) => {
    const res = await fetch(`/api/messages/${messageId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reactionType }),
    });
    if (res.ok) {
      const { reactions } = await res.json();
      setMessages(prev => prev.map(m =>
        m.id === messageId ? {
          ...m,
          reactions,
          userReactions: {
            ...m.userReactions,
            [reactionType]: !m.userReactions?.[reactionType]
          }
        } : m
      ));
    }
  };

  const toggleWellness = async (goalType: string) => {
    await fetch('/api/wellness/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ goal_type: goalType }),
    });
    fetchData();
  };

  const joinRoom = async (room: any) => {
    setSelectedRoom(room);
    setMessages([]); // Clear previous messages
    const res = await fetch(`/api/rooms/${room.id}/messages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setMessages(await res.json());
    setActiveTab('chat');
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !selectedRoom) return;
    socket.emit('send-message', {
      roomId: selectedRoom.id,
      userId: user?.id,
      message: newMessage
    });
    setNewMessage('');
  };

  const renderThemeSanctuary = () => (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden mb-6"
        >
          <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-500 mb-6 flex items-center gap-2">
              <Palette size={16} /> Choose Your Sanctuary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'light', label: 'Light', icon: Sun, color: 'bg-white text-amber-500', action: () => { setMode('light'); setColorTheme('emerald'); } },
                { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-slate-900 text-indigo-400', action: () => { setMode('dark'); setColorTheme('emerald'); } },
                { id: 'forest', label: 'Forest', icon: Trees, color: 'bg-green-900 text-green-400', action: () => { setColorTheme('forest'); } },
              ].map(t => {
                const isActive = (t.id === 'light' && mode === 'light' && colorTheme === 'emerald') ||
                  (t.id === 'dark' && mode === 'dark' && colorTheme === 'emerald') ||
                  (t.id === 'forest' && colorTheme === 'forest');
                return (
                  <motion.button
                    key={t.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={t.action}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      isActive ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20" : "border-transparent bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", t.color)}>
                      <t.icon size={24} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 5">{t.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-6">
              <div>
                <h5 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-3">All Color Accents</h5>
                <div className="flex gap-2">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setColorTheme(t.id as ColorTheme)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        colorTheme === t.id ? "border-slate-900 dark:border-white scale-110" : "border-transparent opacity-60 hover:opacity-100",
                        t.id === 'emerald' ? "bg-emerald-500" : t.id === 'ocean' ? "bg-sky-500" : t.id === 'sunset' ? "bg-amber-500" : t.id === 'forest' ? "bg-green-600" : "bg-indigo-600"
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 flex justify-end items-center">
                <Button variant="ghost" onClick={toggleMode} className="text-xs">
                  {mode === 'light' ? <Moon size={14} /> : <Sun size={14} />} Switch to {mode === 'light' ? 'Dark' : 'Light'} Mode
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderCounselorDashboard = () => (
    <div className="space-y-6">
      <header>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-heading dark:text-white">Counselor Dashboard</h2>
            <p className="text-slate-600 dark:text-slate-500 font-medium">Welcome back, {user?.fullName || user?.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={18} />
            </Button>
            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              Verified ID: #{user?.id}
            </div>
          </div>
        </div>
      </header>

      {renderThemeSanctuary()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-4 h-4 rounded-full animate-pulse",
                counselorData?.profile?.is_available ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-slate-300 dark:bg-slate-700"
              )} />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-300">Current Status: {counselorData?.profile?.is_available ? 'Available for Calls' : 'Unavailable'}</h3>
                <p className="text-xs text-slate-500">Students can see your real-time availability in the directory.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={counselorData?.profile?.is_available ? "danger" : "primary"}
                className="text-xs"
                onClick={() => handleUpdateCounselorProfile({
                  ...counselorData.profile,
                  is_available: !counselorData.profile.is_available
                })}
              >
                {counselorData?.profile?.is_available ? 'Go Offline' : 'Go Online'}
              </Button>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border-base grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Emergency Contact Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="+254..."
                  defaultValue={counselorData?.profile?.phone_number || ''}
                  onBlur={(e) => {
                    if (e.target.value !== counselorData?.profile?.phone_number) {
                      handleUpdateCounselorProfile({
                        ...counselorData.profile,
                        phone_number: e.target.value
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-primary-600 text-white border-none flex flex-col justify-center items-center text-center p-6">
          <Phone className="mb-3 opacity-80" size={32} />
          <h3 className="font-bold text-lg mb-1">Direct Call Support</h3>
          <p className="text-xs opacity-70 mb-4">When online, students can call you directly for urgent support.</p>
          <div className="text-2xl font-black tracking-tighter">{counselorData?.profile?.phone_number || 'No Number Set'}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800 cursor-pointer" onClick={() => setActiveTab('appointments')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-primary-600 uppercase tracking-wider">Pending Requests</p>
              <h3 className="text-4xl font-bold text-primary-900 dark:text-primary-400 mt-1">{counselorData?.pendingCount || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center text-primary-600">
              <Calendar size={24} />
            </div>
          </div>
        </Card>

        <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-rose-600 uppercase tracking-wider">Mood Alerts</p>
              <h3 className="text-4xl font-bold text-rose-900 dark:text-rose-400 mt-1">{counselorData?.alerts?.length || 0}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-xl flex items-center justify-center text-rose-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-heading dark:text-slate-300">Today's Appointments</h3>
          <Button variant="ghost" className="text-xs" onClick={() => setActiveTab('appointments')}>View All</Button>
        </div>
        <div className="space-y-4">
          {counselorData?.appointments?.slice(0, 3).map((apt: any) => (
            <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-base">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-heading dark:text-slate-300">{apt.student_alias}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-500">{format(new Date(apt.start_time), 'h:mm a')} • {apt.method}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="text-xs py-1" onClick={() => fetchStudentInsights(apt.student_id)}>View Insights</Button>
              </div>
            </div>
          ))}
          {(!counselorData?.appointments || counselorData.appointments.length === 0) && <p className="text-center text-slate-500 py-4 italic font-medium">No appointments for today.</p>}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-heading dark:text-slate-300 mb-4">Recent Mood Alerts</h3>
        <div className="space-y-3">
          {counselorData?.alerts?.map((alert: any) => (
            <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">😞</span>
                <div>
                  <h4 className="font-bold text-heading dark:text-slate-300">{alert.anonymous_alias}</h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{alert.sad_count} sad logs in the last 7 days</p>
                </div>
              </div>
              <Button variant="outline" className="text-xs py-1" onClick={() => fetchStudentInsights(alert.id)}>Check In</Button>
            </div>
          ))}
          {(!counselorData?.alerts || counselorData.alerts.length === 0) && <p className="text-center text-slate-500 py-4 italic font-medium">No critical mood alerts.</p>}
        </div>
      </Card>
    </div>
  );

  const renderCounselorAppointments = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-heading dark:text-white">Manage Appointments</h2>
      <Card>
        <div className="space-y-4">
          {counselorData?.appointments?.map((apt: any) => (
            <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-base">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500">
                  <UserIcon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-heading dark:text-slate-300">{apt.student_alias}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-500">{format(new Date(apt.start_time), 'MMM d, yyyy • h:mm a')}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-500 font-medium">Method: {apt.method} | Status: <span className="font-bold uppercase">{apt.status}</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                {apt.status === 'pending' && (
                  <>
                    <Button variant="outline" className="text-xs py-1" onClick={() => handleUpdateAppointmentStatus(apt.id, 'accepted')}>Accept</Button>
                    <Button variant="ghost" className="text-xs py-1 text-rose-500" onClick={() => handleUpdateAppointmentStatus(apt.id, 'declined')}>Decline</Button>
                  </>
                )}
                <Button variant="secondary" className="text-xs py-1" onClick={() => fetchStudentInsights(apt.student_id)}>Student Insights</Button>
              </div>
            </div>
          ))}
          {(!counselorData?.appointments || counselorData.appointments.length === 0) && <p className="text-center text-slate-500 py-10 italic font-medium">No appointments found.</p>}
        </div>
      </Card>
    </div>
  );

  const renderStudentInsights = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => setActiveTab('home')}>
          <ChevronRight size={20} className="rotate-180" />
        </Button>
        <h2 className="text-2xl font-bold text-heading dark:text-white">Insights: {studentInsights?.student?.anonymous_alias}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4">Recent Mood History</h3>
          <div className="space-y-3">
            {studentInsights?.moods?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs text-slate-500">{format(new Date(m.created_at), 'MMM d, h:mm a')}</span>
                </div>
                {m.reflection && <p className="text-xs text-slate-500 italic max-w-[150px] truncate font-medium">{m.reflection}</p>}
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4">Session Notes</h3>
          <div className="flex-1 space-y-4 mb-4 overflow-y-auto max-h-[300px] custom-scrollbar">
            {sessionNotes.map((note: any) => (
              <div key={note.id} className="p-3 rounded-xl bg-primary-50/30 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800">
                <p className="text-xs text-slate-500 mb-1 font-semibold">{format(new Date(note.created_at), 'MMM d, yyyy')}</p>
                <p className="text-sm text-slate-700 5">{note.notes}</p>
              </div>
            ))}
            {sessionNotes.length === 0 && <p className="text-center text-slate-500 py-4 italic font-medium">No notes yet.</p>}
          </div>
          <div className="space-y-2">
            <textarea
              className="w-full p-3 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
              placeholder="Add a new session note..."
              value={newNote || ''}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <Button className="w-full" onClick={() => handleSaveNote(studentInsights.student.id)}>Save Note</Button>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <header>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-heading dark:text-white">Admin Dashboard</h2>
            <p className="text-slate-600 dark:text-slate-500 font-medium">Platform Overview • Welcome, {user?.fullName || user?.username}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
              <Settings size={18} />
            </Button>
            <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">
              Admin ID: #{user?.id}
            </div>
          </div>
        </div>
      </header>

      {renderThemeSanctuary()}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: adminStats?.totalStudents, icon: UserIcon, color: 'text-blue-500', tab: 'admin-users' },
          { label: 'Active Today', value: adminStats?.activeToday, icon: Activity, color: 'text-emerald-500', tab: 'home' },
          { label: 'Counselors', value: adminStats?.totalCounselors, icon: Users, color: 'text-indigo-500', tab: 'admin-counselors' },
          { label: 'Safe Rooms', value: adminRooms.length, icon: MessageCircle, color: 'text-primary-500', tab: 'admin-rooms' },
          { label: 'Open Reports', value: adminStats?.openReports, icon: AlertCircle, color: 'text-rose-500', tab: 'admin-reports' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 cursor-pointer hover:border-primary-300 transition-all" onClick={() => setActiveTab(stat.tab)}>
            <div className="flex items-center gap-3 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs font-bold uppercase text-heading dark:text-slate-500 tracking-wider">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value || 0}</h3>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4">System Activity & Logs</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-500">System is running normally.</p>
              <p className="text-xs text-slate-500 font-medium">All services operational • Last check: {format(new Date(), 'h:mm a')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
              <Users size={16} />
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-500">{adminStats?.totalStudents} students registered.</p>
              <p className="text-xs text-slate-500 font-medium">Database connection healthy</p>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-500 uppercase mb-3">Recent System Logs</h4>
            <div className="space-y-2">
              {adminLogs.slice(0, 5).map((log, i) => (
                <div key={i} className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-500 flex items-center gap-1 font-medium">
                    <div className={cn("w-1 h-1 rounded-full",
                      log.event_type.includes('REPORT') ? 'bg-rose-500' :
                        log.event_type.includes('SIGNUP') ? 'bg-blue-500' : 'bg-emerald-500')}
                    />
                    {log.message}
                  </span>
                  <span className="text-slate-500 font-medium">{formatDistanceToNow(new Date(log.created_at))} ago</span>
                </div>
              ))}
              {adminLogs.length === 0 && <p className="text-xs text-slate-500 italic font-medium">No logs yet.</p>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAdminUsers = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-heading dark:text-white">User Management</h2>
      <Card>
        <div className="space-y-3 max-h-150 overflow-y-auto custom-scrollbar">
          {adminUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-base">
              <div>
                <h4 className="font-bold text-sm text-heading dark:text-slate-300">
                  {u.full_name || u.username}
                  {u.role !== 'student' && <span className="ml-1 text-xs font-medium text-slate-500">(ID: #{u.id})</span>}
                </h4>
                <p className="text-xs text-slate-500 uppercase font-bold mt-0.5">
                  {u.role} • {u.status}
                  {u.user_status === 'high_priority_support' && (
                    <span className="ml-2 text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full normal-case font-bold">HIGH PRIORITY</span>
                  )}
                </p>
                {u.anonymous_alias && u.role === 'student' && (
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">Alias: {u.anonymous_alias}</p>
                )}
              </div>
              <div className="flex gap-2">
                {u.status === 'active' ? (
                  <Button variant="ghost" className="text-xs py-1 text-rose-600 font-bold" onClick={() => handleAdminAction('user', u.id, 'suspended')}>Suspend</Button>
                ) : (
                  <Button variant="ghost" className="text-xs py-1 text-emerald-600 font-bold" onClick={() => handleAdminAction('user', u.id, 'active')}>Activate</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderAdminCounselors = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-heading dark:text-white">Counselor Management</h2>
      <Card>
        <div className="space-y-3 max-h-150 overflow-y-auto custom-scrollbar">
          {adminCounselors.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-base">
              <div className="flex items-center gap-3">
                <img src={c.photo_url || 'https://picsum.photos/seed/counselor/200/200'} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h4 className="font-bold text-sm text-heading dark:text-slate-300">
                    {c.name}
                    <span className="ml-1 text-xs font-medium text-slate-500">(ID: #{c.id})</span>
                  </h4>
                  <p className="text-xs text-slate-500 uppercase font-bold mt-0.5">{c.status} • {c.specialties}</p>
                  {c.username && <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">@{c.username}</p>}
                  {c.bio && <p className="text-xs text-slate-600 dark:text-slate-500 mt-1 line-clamp-2 max-w-md font-medium">{c.bio}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                {c.status === 'pending' && (
                  <Button variant="outline" className="text-xs py-1 font-bold" onClick={() => handleAdminAction('counselor', c.id, 'active')}>Approve</Button>
                )}
                {c.status === 'active' ? (
                  <Button variant="ghost" className="text-xs py-1 text-rose-600 font-bold" onClick={() => handleAdminAction('counselor', c.id, 'deactivated')}>Deactivate</Button>
                ) : c.status === 'deactivated' ? (
                  <Button variant="ghost" className="text-xs py-1 text-emerald-600 font-bold" onClick={() => handleAdminAction('counselor', c.id, 'active')}>Activate</Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderAdminRooms = () => {
    const pendingRooms = adminRooms.filter(r => r.status === 'pending');
    const activeRooms = adminRooms.filter(r => r.status === 'active');
    const deactivatedRooms = adminRooms.filter(r => r.status === 'rejected');

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-heading dark:text-white">Safe Room Management</h2>
            <p className="text-slate-600 dark:text-slate-500 font-medium">
              {activeRooms.length} active &nbsp;•&nbsp; {pendingRooms.length} pending &nbsp;•&nbsp; {deactivatedRooms.length} deactivated
            </p>
          </div>
          {pendingRooms.length > 0 && (
            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold">
              {pendingRooms.length} Pending Review
            </div>
          )}
        </div>

        {/* Create form */}
        <Card className="border-primary-200 dark:border-primary-800 bg-primary-50/30 dark:bg-primary-900/10">
          <h3 className="font-bold text-heading dark:text-slate-300 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-primary-600" /> Create New Room
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Room name (e.g. Exam Stress Support)"
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              value={newRoom.name}
              onChange={e => setNewRoom({ ...newRoom, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Short description"
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              value={newRoom.description}
              onChange={e => setNewRoom({ ...newRoom, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end mt-4">
            <Button
              disabled={!newRoom.name.trim()}
              onClick={async () => {
                if (!newRoom.name.trim()) return;
                const res = await fetch('/api/rooms', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify(newRoom),
                });
                if (res.ok) {
                  setNewRoom({ name: '', description: '' });
                  fetchData();
                }
              }}
            >
              <Plus size={16} /> Create Room
            </Button>
          </div>
        </Card>

        {/* Pending proposals */}
        {pendingRooms.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
              <AlertCircle size={14} /> Pending Proposals ({pendingRooms.length})
            </h3>
            <div className="space-y-3">
              {pendingRooms.map(r => (
                <Card key={r.id} className="border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-heading dark:text-slate-300">{r.name}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">Pending</span>
                      </div>
                      {r.description && <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">{r.description}</p>}
                      <p className="text-xs text-slate-500">
                        Proposed by <span className="font-semibold">{r.creator_alias || r.creator_name || 'System'}</span>
                        {r.created_at && <> &nbsp;•&nbsp; {formatDistanceToNow(new Date(r.created_at))} ago</>}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4 shrink-0">
                      <Button variant="outline" className="text-xs py-1 font-bold text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400" onClick={() => handleRoomAction(r.id, 'active')}>
                        <CheckCircle2 size={14} /> Approve
                      </Button>
                      <Button variant="ghost" className="text-xs py-1 font-bold text-rose-600 dark:text-rose-400" onClick={() => handleRoomAction(r.id, 'rejected')}>
                        <X size={14} /> Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active rooms */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} /> Active Rooms ({activeRooms.length})
          </h3>
          {activeRooms.length > 0 ? (
            <div className="space-y-3">
              {activeRooms.map(r => (
                <Card key={r.id} className="border-border-base">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <h3 className="font-bold text-heading dark:text-slate-300">{r.name}</h3>
                        {r.message_count > 0 && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <MessageCircle size={10} /> {r.message_count} messages
                          </span>
                        )}
                      </div>
                      {r.description && <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">{r.description}</p>}
                      <p className="text-xs text-slate-500">
                        {r.creator_name ? <>By <span className="font-semibold">{r.creator_alias || r.creator_name}</span></> : 'System room'}
                        {r.created_at && <> &nbsp;•&nbsp; {format(new Date(r.created_at), 'MMM d, yyyy')}</>}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-xs py-1 font-bold text-rose-600 dark:text-rose-400 ml-4 shrink-0"
                      onClick={() => handleRoomAction(r.id, 'rejected')}
                    >
                      Deactivate
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <MessageCircle size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-500 font-medium text-sm">No active rooms. Create one above or approve a proposal.</p>
            </div>
          )}
        </div>

        {/* Deactivated rooms */}
        {deactivatedRooms.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
              <X size={14} /> Deactivated Rooms ({deactivatedRooms.length})
            </h3>
            <div className="space-y-3">
              {deactivatedRooms.map(r => (
                <Card key={r.id} className="border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                        <h3 className="font-bold text-heading dark:text-slate-400">{r.name}</h3>
                      </div>
                      {r.description && <p className="text-sm text-slate-500 dark:text-slate-500 mb-1">{r.description}</p>}
                      <p className="text-xs text-slate-400">
                        {r.creator_name ? <>By <span className="font-semibold">{r.creator_alias || r.creator_name}</span></> : 'System room'}
                        {r.created_at && <> &nbsp;•&nbsp; {format(new Date(r.created_at), 'MMM d, yyyy')}</>}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      className="text-xs py-1 font-bold text-emerald-600 dark:text-emerald-400 ml-4 shrink-0"
                      onClick={() => handleRoomAction(r.id, 'active')}
                    >
                      Reactivate
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAdminReports = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-heading dark:text-white">Reports & Moderation</h2>
        <div className="bg-rose-100 dark:bg-rose-900/30 px-3 py-1 rounded-full text-xs font-bold text-rose-700 dark:text-rose-400">
          {adminReports.length} Pending
        </div>
      </div>
      <div className="space-y-4">
        {adminReports.map(r => (
          <Card key={r.id} className="border border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10">
            <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full">
                    {r.reason}
                  </span>
                  {r.room_name && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <MessageCircle size={10} /> {r.room_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Reported by: <span className="font-bold">{r.reported_by_alias || r.reported_by_name}</span>
                  {r.message_author_alias && <> &nbsp;•&nbsp; Author: <span className="font-bold">{r.message_author_alias}</span></>}
                  {r.created_at && <> &nbsp;•&nbsp; {formatDistanceToNow(new Date(r.created_at))} ago</>}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="danger" className="text-xs py-1 font-bold" onClick={() => handleAdminAction('report', r.id, 'delete')}>
                  Delete Message
                </Button>
                <Button variant="outline" className="text-xs py-1 font-bold text-amber-600 border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400" onClick={() => handleAdminAction('report', r.id, 'dismiss')}>
                  Dismiss
                </Button>
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-400 font-medium italic leading-relaxed">
              "{r.message}"
            </div>
            {r.message_created_at && (
              <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2 text-right">
                Message sent {formatDistanceToNow(new Date(r.message_created_at))} ago
              </p>
            )}
          </Card>
        ))}
        {adminReports.length === 0 && (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-semibold">No pending reports.</p>
            <p className="text-xs text-slate-400 mt-1">All Safe Rooms are clear.</p>
          </div>
        )}
      </div>
    </div>
  );

  const handleReportMessage = (messageId: number) => {
    setReportingMessageId(messageId);
    setReportReason('');
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!reportReason.trim() || !reportingMessageId) return;
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ messageId: reportingMessageId, reason: reportReason }),
    });
    setShowReportModal(false);
    setReportingMessageId(null);
    setReportReason('');
    alert('Report submitted. Thank you for keeping SafeSpace safe.');
  };

  const renderHome = () => (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-heading dark:text-white">Welcome, {user?.alias}</h2>
          <p className="text-slate-600 dark:text-slate-500 font-medium">How are you feeling today?</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} />
          </Button>
          <Button variant="panic" onClick={() => setActiveTab('crisis')}>
            <ShieldAlert size={18} /> Panic Button
          </Button>
        </div>
      </header>

      {renderThemeSanctuary()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center justify-center py-10 border-dashed border-2 border-primary-200 bg-primary-50/30 dark:bg-primary-900/10 dark:border-primary-800">
          <div className="flex gap-4 mb-6">
            {MOODS.slice(0, 5).map(m => (
              <motion.button
                key={m.label}
                whileHover={{ scale: 1.3, rotate: 10 }}
                whileTap={{ scale: 0.9 }}
                className="text-4xl"
                onClick={() => { setSelectedMood(m); setShowMoodModal(true); }}
              >
                {m.emoji}
              </motion.button>
            ))}
          </div>
          <Button onClick={() => setShowMoodModal(true)}>Log Your Mood</Button>
        </Card>

        <Card>
          <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center">
            <Activity size={18} className="mr-2 text-primary-600" /> Today's Wellness
          </h3>
          <div className="space-y-3">
            {WELLNESS_GOALS.map(goal => {
              const isDone = wellness.some(w => w.goal_type === goal.id && w.is_completed);
              const wellnessIcons = { Droplets, Moon, Activity, Brain } as const;
              const Icon = wellnessIcons[goal.icon as keyof typeof wellnessIcons];
              return (
                <motion.button
                  key={goal.id}
                  whileHover={{ x: 4 }}
                  onClick={() => toggleWellness(goal.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all",
                    isDone ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300" : "bg-surface border-border-base text-slate-700 hover:border-primary-200 dark:text-slate-500 dark:hover:border-primary-800 font-medium"
                  )}
                >
                  <div className="flex items-center">
                    <Icon size={18} className="mr-3" />
                    <span className="font-medium">{goal.label}</span>
                  </div>
                  {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-slate-300 dark:text-slate-600" />}
                </motion.button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4">Your Appointments</h3>
        <div className="space-y-4">
          {appointments.map((apt, idx) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-border-base"
            >
              <img src={apt.counselor_photo} alt={apt.counselor_name} className="w-12 h-12 rounded-full object-cover border-2 border-primary-500" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-700 5">{apt.counselor_name}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-500 flex items-center gap-1 font-medium">
                      {apt.method === 'video' ? <Video size={12} /> : apt.method === 'chat' ? <MessageCircle size={12} /> : <UserIcon size={12} />}
                      {apt.method.charAt(0).toUpperCase() + apt.method.slice(1)} Session
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    {format(new Date(apt.start_time), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          {appointments.length === 0 && <p className="text-center text-slate-500 py-4 italic font-medium">No upcoming appointments.</p>}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4">Recent Mood History</h3>
        <div className="space-y-4">
          {moods.slice(0, 5).map((m, idx) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
            >
              <span className="text-3xl">{m.emoji}</span>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-700 5">{MOODS.find(mood => mood.emoji === m.emoji)?.label}</span>
                  <span className="text-xs text-slate-500 font-medium">{format(new Date(m.created_at), 'MMM d, h:mm a')}</span>
                </div>
                {m.reflection && <p className="text-sm text-slate-600 dark:text-slate-500 mt-1 italic font-medium">"{m.reflection}"</p>}
              </div>
            </motion.div>
          ))}
          {moods.length === 0 && <p className="text-center text-slate-500 py-4 font-medium italic">No moods logged yet.</p>}
        </div>
      </Card>
    </div>
  );

  const renderRooms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-heading dark:text-white">Safe Rooms</h2>
          <p className="text-slate-600 dark:text-slate-500 font-medium">Join a discussion and support your peers anonymously.</p>
        </div>
        {(user?.role === 'student' || user?.role === 'counselor') && (
          <Button onClick={() => setShowProposeRoomModal(true)} className="flex items-center gap-2">
            <Plus size={18} /> Propose Room
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map(room => (
          <Card key={room.id} className="hover:border-primary-500 transition-colors cursor-pointer" onClick={() => joinRoom(room)}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-300">{room.name}</h3>
              <MessageCircle size={20} className="text-primary-500" />
            </div>
            <p className="text-slate-700 dark:text-slate-500 text-sm mb-4 font-medium">{room.description}</p>
            <Button variant="outline" className="w-full">Join Room</Button>
          </Card>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <MessageCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No active safe rooms found.</p>
          </div>
        )}
      </div>

      {showProposeRoomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-surface w-full max-w-md rounded-3xl p-8 shadow-2xl border border-border-base">
            <h3 className="text-2xl font-bold text-heading dark:text-white mb-2">Propose a Safe Room</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your proposal will be reviewed by an admin before going live.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-500 mb-1">Room Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Exam Stress Support"
                  value={newRoom.name || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-500 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 h-32 resize-none"
                  placeholder="What should people discuss here?"
                  value={newRoom.description || ''}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowProposeRoomModal(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleProposeRoom}>Submit Proposal</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );

  const renderChat = () => (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setActiveTab('rooms')}>
            <ChevronRight size={20} className="rotate-180" />
          </Button>
          <h2 className="text-xl font-bold text-heading dark:text-white">{selectedRoom?.name}</h2>
          <Button variant="ghost" className="p-2 ml-2" onClick={handlePopOutChat} title="Pop-out Chat">
            <ExternalLink size={18} className="text-primary-500" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 dark:l px-3 py-1 rounded-full font-medium">
            Anonymous Chat
          </div>
          <Button variant="outline" className="text-xs py-1 px-3" onClick={() => setActiveTab('rooms')}>
            Leave Room
          </Button>
        </div>
      </div>
      <Card className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 flex flex-col custom-scrollbar">
        <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-2xl border border-primary-100 dark:border-primary-800 mb-2">
          <h4 className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Shield size={14} /> Safe Room Guidelines
          </h4>
          <ul className="text-[11px] text-slate-600 dark:l space-y-1 font-medium">
            <li>• Be kind and supportive to your peers.</li>
            <li>• Maintain anonymity - do not share personal details.</li>
            <li>• Report any harmful or inappropriate messages.</li>
            <li>• This is a safe space for everyone.</li>
          </ul>
        </div>
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={cn("max-w-[80%] p-3 rounded-2xl shadow-sm", msg.user_id === user?.id ? "bg-primary-600 text-white self-end rounded-tr-none" : "bg-slate-100 text-slate-800 self-start rounded-tl-none dark:bg-slate-800 dark:text-slate-300")}
          >
            <div className="text-xs opacity-90 mb-1 font-bold flex justify-between items-center">
              <span>{msg.author_alias} • {format(new Date(msg.created_at), 'h:mm a')}</span>
              <div className="flex gap-2">
                {user?.role === 'admin' && (
                  <button
                    onClick={async () => {
                      if (confirm('Delete this message?')) {
                        await fetch(`/api/admin/messages/${msg.id}`, {
                          method: 'DELETE',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        setMessages(prev => prev.filter(m => m.id !== msg.id));
                      }
                    }}
                    className="hover:text-rose-500 transition-colors"
                  >
                    Delete
                  </button>
                )}
                {msg.user_id !== user?.id && (
                  <button
                    onClick={() => handleReportMessage(msg.id)}
                    className="hover:text-rose-400 transition-colors opacity-70 hover:opacity-100"
                  >
                    Report
                  </button>
                )}
              </div>
            </div>
            <div className="text-sm leading-relaxed">{msg.message}</div>

            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { type: 'heart', emoji: '❤️', label: 'Love' },
                { type: 'hug', emoji: '🫂', label: 'Hug' },
                { type: 'support', emoji: '🤝', label: 'Support' }
              ].map(reaction => {
                const count = msg.reactions?.[reaction.type] || 0;
                const active = msg.userReactions?.[reaction.type];
                return (
                  <button
                    key={reaction.type}
                    onClick={() => handleReact(msg.id, reaction.type)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.dark:text-slate-500 rounded-full text-[10px] font-bold transition-all",
                      active
                        ? "bg-white/20 text-white ring-1 ring-white/50"
                        : "bg-black/dark:text-slate-500 text-slate-600 hover:bg-black/10 dark:bg-white/dark:text-slate-500 dark:l dark:hover:bg-white/10"
                    )}
                  >
                    <span>{reaction.emoji}</span>
                    {count > 0 && <span>{count}</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
        <div ref={chatEndRef} />
        {messages.length === 0 && <div className="flex-1 flex items-center justify-center text-slate-500 italic font-medium">Start the conversation...</div>}
      </Card>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none text-slate-950 dark:bg-slate-900 dark:border-slate-800 dark:text-white"
          placeholder="Type your message..."
          value={newMessage || ''}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button onClick={sendMessage} className="px-6">
          <Send size={20} />
        </Button>
      </div>
    </div>
  );

  const renderInsights = () => {
    const moodCounts = moods.reduce((acc: any, m) => {
      acc[m.emoji] = (acc[m.emoji] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-heading dark:text-white">Wellness Insights</h2>
        <Card>
          <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-6 flex items-center">
            <BarChart3 size={18} className="mr-2 text-primary-600" /> Weekly Mood Summary
          </h3>
          <div className="space-y-6">
            {MOODS.map(m => {
              const count = moodCounts[m.emoji] || 0;
              const percentage = moods.length ? (count / moods.length) * 100 : 0;
              return (
                <div key={m.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{m.emoji}</span> <span className="text-slate-700 5">{m.label}</span>
                    </span>
                    <span className="text-slate-600 dark:text-slate-500 font-medium">{count} logs</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={cn("h-full", m.color.split(' ')[0])}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  const renderCounselors = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-heading dark:text-white">Professional Counselors</h2>
      <p className="text-slate-600 dark:text-slate-500 font-medium">Book a private session with a qualified school counselor.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {counselors.map(counselor => (
          <Card key={counselor.id} className="flex flex-col relative overflow-hidden">
            {counselor.is_available ? (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-lg">
                <div className="w-1.dark:text-slate-500 h-1.dark:text-slate-500 bg-white rounded-full animate-pulse" /> AVAILABLE NOW
              </div>
            ) : (
              <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                OFFLINE
              </div>
            )}
            <div className="flex gap-4 mb-4">
              <img src={counselor.photo_url || 'https://picsum.photos/seed/counselor/200/200'} alt={counselor.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-primary-500" referrerPolicy="no-referrer" />
              <div>
                <h3 className="font-bold text-xl text-slate-800 dark:text-slate-300">{counselor.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {counselor.specialties.split(',').map((s: string) => (
                    <span key={s} className="text-xs px-2 py-0.dark:text-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 rounded-full font-bold uppercase tracking-wider">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-500 text-sm mb-6 leading-relaxed flex-1 font-medium">
              {counselor.bio}
            </p>
            <Button onClick={() => { setSelectedCounselor(counselor); setShowBookingModal(true); }}>
              Book Appointment
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCrisis = () => (
    <div className="space-y-6">
      <header className="text-center max-w-xl mx-auto mb-8">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-3xl font-bold text-heading dark:text-white mb-2">Crisis Support</h2>
        <p className="text-slate-500 dark:text-slate-400">If you or someone you know is in immediate danger, please call emergency services or one of the hotlines below. You are not alone.</p>
      </header>

      {/* Hardcoded Emergency Contacts */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Phone size={12} /> Emergency Contacts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'National Emergency', number: '999 / 112', sub: 'Police • Ambulance • Fire', color: 'bg-rose-600', href: 'tel:999' },
            { label: 'Befrienders Kenya', number: '0722 178177', sub: 'Suicide Prevention • 24/7', color: 'bg-slate-800', href: 'tel:+254722178177' },
            { label: 'School Help Line', number: '0711 000000', sub: 'Security • Wellness • 24/7', color: 'bg-primary-600', href: 'tel:+254711000000' },
            { label: 'Red Cross Kenya', number: '1199', sub: 'Emergency Medical Services', color: 'bg-emerald-600', href: 'tel:1199' },
            { label: 'NACADA Helpline', number: '1192', sub: 'Alcohol & Drug Support', color: 'bg-amber-600', href: 'tel:1192' },
            { label: 'GBV Hotline', number: '1195', sub: 'Gender-Based Violence', color: 'bg-purple-600', href: 'tel:1195' },
            { label: 'Campus Counseling', number: '+254 700 000000', sub: 'University Counseling Dept', color: 'bg-indigo-600', href: 'tel:+254700000000' },
            { label: 'Crisis Text Line', number: 'Text HOME', sub: 'to 741741 for support', color: 'bg-teal-600', href: 'sms:741741' },
          ].map(c => (
            <a
              key={c.label}
              href={c.href}
              className={`${c.color} text-white p-4 rounded-2xl shadow-lg flex flex-col items-center text-center hover:opacity-90 transition-opacity active:scale-95`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">{c.label}</span>
              <span className="text-lg font-black leading-tight">{c.number}</span>
              <span className="text-[9px] mt-1 opacity-70">{c.sub}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Dynamic crisis resources from DB */}
      {crisisResources.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <AlertCircle size={12} /> Additional Resources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {crisisResources.map(resource => (
              <Card key={resource.id} className="p-5 border-rose-100 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                    {resource.category}
                  </span>
                  <AlertCircle className="text-rose-400" size={18} />
                </div>
                <h3 className="text-base font-bold text-heading dark:text-white mb-1">{resource.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">{resource.description}</p>
                <div className="flex items-center justify-between pt-3 border-t border-rose-100 dark:border-rose-900/20">
                  <span className="text-lg font-bold text-rose-600 font-mono">{resource.contact}</span>
                  <Button variant="danger" className="text-xs px-3 py-1.5" onClick={() => window.location.href = `tel:${resource.contact}`}>
                    <Phone size={12} /> Call Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-slate-900 text-white border-none p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
          {counselors.some(c => c.is_available) ? (
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" /> COUNSELORS ONLINE
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">
              OFFLINE
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold mb-2">Need to talk right now?</h3>
        <p className="text-slate-400 mb-6 font-medium">Our counselors are available for emergency sessions 24/7.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setActiveTab('counselors')}>Book a Session</Button>
          {counselors.find(c => c.is_available && c.phone_number) && (
            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => {
                const available = counselors.find(c => c.is_available && c.phone_number);
                if (available) window.location.href = `tel:${available.phone_number}`;
              }}
            >
              <Phone size={16} /> Call Counselor Now
            </Button>
          )}
        </div>
      </Card>
    </div>
  );

  const renderPanicModal = () => (
    <div className="fixed inset-0 bg-rose-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-surface w-full max-w-lg rounded-3xl p-8 shadow-2xl border-4 border-rose-500 text-center relative"
      >
        <button
          onClick={() => setShowPanicModal(false)}
          className="absolute top-4 left-4 flex items-center gap-1 l hover:text-rose-600 transition-colors font-bold text-sm"
        >
          <ChevronLeft size={20} /> Exit
        </button>
        <button
          onClick={() => setShowPanicModal(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-900/20 l hover:text-rose-600 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-black text-rose-600 mb-2 uppercase tracking-tighter text-center">Emergency Help</h2>
        <p className="text-xl font-bold text-slate-900 dark:text-white mb-8 text-center">Need immediate help? You are not alone.</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-rose-600 text-white flex flex-col items-center">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1">Emergency</span>
            <a href="tel:999" className="text-lg font-black">999</a>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col items-center">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1">Befrienders</span>
            <a href="tel:+254722178177" className="text-lg font-black">0722 178177</a>
          </div>
          <div className="p-4 rounded-2xl bg-primary-600 text-white flex flex-col items-center">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1">School Help</span>
            <a href="tel:+254711000000" className="text-lg font-black">0711 000000</a>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-600 text-white flex flex-col items-center">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1">Red Cross</span>
            <a href="tel:1199" className="text-lg font-black">1199</a>
          </div>
          <div className="p-4 rounded-2xl bg-amber-600 text-white flex flex-col items-center">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1">NACADA</span>
            <a href="tel:1192" className="text-lg font-black">1192</a>
          </div>
          <div className="p-4 rounded-2xl bg-purple-600 text-white flex flex-col items-center">
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80 mb-1">GBV Hotline</span>
            <a href="tel:1195" className="text-lg font-black">1195</a>
          </div>
        </div>

        <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {crisisResources.length > 0 ? (
            crisisResources.map((resource) => (
              <div key={resource.id} className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 flex flex-col items-center">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">{resource.title}</span>
                <a href={`tel:${resource.contact.replace(/\s/g, '')}`} className="text-2xl font-black text-slate-900 dark:text-white hover:text-rose-600 transition-colors">
                  {resource.contact}
                </a>
                {resource.description && <p className="text-[10px] text-slate-500 mt-1">{resource.description}</p>}
              </div>
            ))
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 flex flex-col items-center">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Befrienders Kenya</span>
                <a href="tel:+254722178177" className="text-2xl font-black text-slate-900 dark:text-white hover:text-rose-600 transition-colors">+254 722 178 177</a>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 flex flex-col items-center">
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">National Emergency Hotline</span>
                <a href="tel:999" className="text-2xl font-black text-slate-900 dark:text-white hover:text-rose-600 transition-colors">999 / 112</a>
              </div>
            </>
          )}
        </div>

        <Button variant="secondary" className="w-full py-4 text-lg font-bold" onClick={() => setShowPanicModal(false)}>
          Exit Emergency Help
        </Button>
      </motion.div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-heading dark:text-white">Notification Center</h2>
          <p className="text-slate-600 dark:text-slate-500 font-medium">Stay updated with wellness tips and appointment reminders.</p>
        </div>
        <div className="bg-primary-100 dark:bg-primary-900/40 px-4 py-2 rounded-full flex items-center gap-2">
          <Bell size={20} className="text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">Alerts Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary-500" />
            Recent Alerts
          </h3>
          <div className="space-y-4">
            {aiNotifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-xl border ${notif.is_read ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700' : 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.dark:text-slate-500 rounded-full uppercase tracking-wider ${notif.type === 'CRITICAL_ALERT' ? 'bg-rose-100 text-rose-700' :
                      notif.type === 'APPOINTMENT_REMINDER' ? 'bg-amber-100 text-amber-700' :
                        'bg-primary-100 text-primary-700'
                    }`}>
                    {notif.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">{format(new Date(notif.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-500 font-medium">{notif.message}</p>
                {!notif.is_read && (
                  <button
                    onClick={async () => {
                      await fetch(`/api/ai/notifications/${notif.id}/read`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      fetchData();
                    }}
                    className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700"
                  >
                    Mark as read
                  </button>
                )}
              </motion.div>
            ))}
            {aiNotifications.length === 0 && (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto:text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium italic">No notifications yet. We'll alert you here for upcoming appointments and wellness tips.</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none">
            <h3 className="font-bold text-lg mb-2">How it works</h3>
            <p className="text-sm opacity-90 mb-4">We send reminders for your appointments and AI-driven wellness insights to help you stay on track.</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Calendar size={16} />
                </div>
                <span>Appointment Reminders</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Brain size={16} />
                </div>
                <span>Wellness Insights</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderMindCare = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-heading dark:text-white">MindCare AI</h2>
          <p className="text-slate-600 dark:text-slate-500 font-medium">Your personal wellness assessment and support system.</p>
        </div>
        <div className="bg-primary-100 dark:bg-primary-900/40 px-4 py-2 rounded-full flex items-center gap-2">
          <Brain size={20} className="text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">AI Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-primary-500" />
            AI Wellness Notifications
          </h3>
          <div className="space-y-4">
            {aiNotifications.filter(n => n.type !== 'APPOINTMENT_REMINDER').map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`p-4 rounded-xl border ${notif.is_read ? 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700' : 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${notif.type === 'CRITICAL_ALERT' ? 'bg-rose-100 text-rose-700' : 'bg-primary-100 text-primary-700'}`}>
                    {notif.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500">{format(new Date(notif.created_at), 'MMM d, h:mm a')}</span>
                </div>
                <p className="text-slate-700 dark:text-slate-500 font-medium">{notif.message}</p>
                {!notif.is_read && (
                  <button
                    onClick={async () => {
                      await fetch(`/api/ai/notifications/${notif.id}/read`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      fetchData();
                    }}
                    className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700"
                  >
                    Mark as read
                  </button>
                )}
              </motion.div>
            ))}
            {aiNotifications.filter(n => n.type !== 'APPOINTMENT_REMINDER').length === 0 && (
              <div className="text-center py-12">
                <Brain size={48} className="mx-auto:text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium italic">No AI insights yet. Keep logging your moods to help MindCare understand you better.</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none">
            <h3 className="font-bold text-lg mb-2">How it works</h3>
            <p className="text-sm text-white/90 font-medium mb-4">
              MindCare AI analyzes your mood patterns and reflections to provide timely support and resources.
            </p>
            <ul className="text-xs space-y-2 text-white/80 font-medium">
              <li className="flex items-center gap-2">
                <div className="w-1.dark:text-slate-500 h-1.dark:text-slate-500 rounded-full bg-white" />
                Mood distress detection
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.dark:text-slate-500 h-1.dark:text-slate-500 rounded-full bg-white" />
                Reflection sentiment assessment
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.dark:text-slate-500 h-1.dark:text-slate-500 rounded-full bg-white" />
                Safety monitoring
              </li>
            </ul>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 dark:text-slate-300 mb-4">AI Privacy</h3>
            <p className="text-xs text-slate-600 dark:l font-medium leading-relaxed">
              Your privacy is our priority. MindCare AI processes your data to provide support.
              Critical safety alerts are shared with counselors to ensure you get the help you need.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderAiAlerts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-heading dark:text-white">MindCare AI Alerts</h2>
          <p className="text-slate-600 dark:text-slate-500 font-medium">Real-time safety monitoring and distress alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {aiAlerts.map((alert, idx) => (
          <Card key={alert.id} className={`border-l-4 ${alert.alert_level === 'CRITICAL' ? 'border-l-rose-500' : 'border-l-amber-500'}`}>
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${alert.alert_level === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-800 dark:text-slate-300">
                      {alert.alert_level} ALERT: {alert.anonymous_alias}
                    </h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-heading dark:text-slate-400">
                      ID: {alert.user_id}
                    </span>
                  </div>
                  <p className="text-sm text-heading dark:text-slate-400 font-medium mb-2">
                    Source: <span className="font-bold">{alert.source}</span> | Detected: {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                  </p>
                  {alert.trigger_phrase && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 italic text-sm text-slate-700 dark:text-slate-500 font-medium">
                      "{alert.trigger_phrase}"
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => {
                  setSelectedRoom(null);
                  setActiveTab('counselors');
                }}>
                  View Student Profile
                </Button>
                <Button size="sm" variant="outline">
                  Dismiss Alert
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {aiAlerts.length === 0 && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <ShieldCheck size={48} className="mx-auto text-emerald-500 mb-4" />
            <p className="text-slate-500 font-medium">No active AI safety alerts. All systems normal.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAiCriticalModal = () => (
    <AnimatePresence>
      {showAiCriticalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-rose-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-6 text-rose-600 dark:text-rose-400">
                <AlertTriangle size={48} />
              </div>
              <h2 className="text-2xl font-bold text-heading dark:text-white mb-4">MindCare Support</h2>
              <p className="text-slate-700 dark:text-slate-500 font-medium mb-8 leading-relaxed">
                {criticalAlertMessage}
              </p>
              <div className="grid grid-cols-1 gap-3 w-full">
                <Button
                  className="bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                  onClick={() => {
                    setShowAiCriticalModal(false);
                    setActiveTab('crisis');
                  }}
                >
                  <ShieldAlert size={24} />
                  View Crisis Resources
                </Button>
                {counselors.length > 0 && (
                  <Button
                    variant="secondary"
                    className="py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                    onClick={() => {
                      setShowAiCriticalModal(false);
                      setActiveTab('counselors');
                    }}
                  >
                    <Users size={24} />
                    Talk to a Counselor
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="py-3 rounded-2xl font-bold"
                  onClick={() => setShowAiCriticalModal(false)}
                >
                  I'm okay, thank you
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-app-bg flex transition-colors duration-300">
      {/* Sidebar */}
      <nav className="w-20 md:w-64 bg-surface border-r border-border-base flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
            <Heart size={20} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold text-heading dark:text-white hidden md:block tracking-tight">SafeSpace</h1>
        </div>

        <div className="flex-1 space-y-2">
          {user?.role === 'student' && [
            { id: 'home', icon: Heart, label: 'Dashboard' },
            { id: 'rooms', icon: MessageCircle, label: 'Safe Rooms' },
            { id: 'counselors', icon: Users, label: 'Counselors' },
            { id: 'mindcare', icon: Brain, label: 'MindCare AI' },
            { id: 'insights', icon: BarChart3, label: 'Insights' },
            { id: 'crisis', icon: AlertCircle, label: 'Crisis Help' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                activeTab === item.id ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" : "text-heading hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800 font-medium"
              )}
            >
              <item.icon size={24} />
              <span className="font-medium hidden md:block">{item.label}</span>
            </button>
          ))}

          {user?.role === 'student' && (
            <button
              onClick={() => setShowPanicModal(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 animate-pulse mb-4 mt-6"
            >
              <ShieldAlert size={24} />
              <span className="font-bold hidden md:block uppercase tracking-wider">Panic Button</span>
            </button>
          )}

          {user?.role === 'counselor' && [
            { id: 'home', icon: Heart, label: 'Dashboard' },
            { id: 'appointments', icon: Calendar, label: 'Appointments' },
            { id: 'rooms', icon: MessageCircle, label: 'Safe Rooms' },
            { id: 'ai-alerts', icon: AlertTriangle, label: 'AI Alerts' },
            { id: 'notifications', icon: Bell, label: 'Notifications' },
            { id: 'profile', icon: UserIcon, label: 'Profile' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                activeTab === item.id ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" : "text-heading hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800 font-medium"
              )}
            >
              <item.icon size={24} />
              <span className="font-medium hidden md:block">{item.label}</span>
            </button>
          ))}

          {user?.role === 'admin' && [
            { id: 'home', icon: Heart, label: 'Dashboard' },
            { id: 'admin-users', icon: UserIcon, label: 'Users' },
            { id: 'admin-counselors', icon: Users, label: 'Counselors' },
            { id: 'admin-rooms', icon: MessageCircle, label: 'Room Management' },
            { id: 'rooms', icon: MessageCircle, label: 'Safe Rooms' },
            { id: 'ai-alerts', icon: AlertTriangle, label: 'AI Alerts' },
            { id: 'admin-reports', icon: ShieldAlert, label: 'Reports' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                activeTab === item.id ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" : "text-heading hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-800 font-medium"
              )}
            >
              <item.icon size={24} />
              <span className="font-medium hidden md:block">{item.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-heading hover:bg-rose-50 hover:text-rose-600 transition-all dark:text-slate-500 dark:hover:bg-rose-900/20 font-medium"
        >
          <LogOut size={24} />
          <span className="font-medium hidden md:block">Logout</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
        {showPanicModal && renderPanicModal()}
        {renderAiCriticalModal()}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {user?.role === 'student' && (
                <>
                  {activeTab === 'home' && renderHome()}
                  {activeTab === 'rooms' && renderRooms()}
                  {activeTab === 'chat' && renderChat()}
                  {activeTab === 'counselors' && renderCounselors()}
                  {activeTab === 'mindcare' && renderMindCare()}
                  {activeTab === 'ai-alerts' && renderAiAlerts()}
                  {activeTab === 'insights' && renderInsights()}
                  {activeTab === 'crisis' && renderCrisis()}
                </>
              )}

              {user?.role === 'counselor' && (
                <>
                  {activeTab === 'home' && renderCounselorDashboard()}
                  {activeTab === 'appointments' && renderCounselorAppointments()}
                  {activeTab === 'rooms' && renderRooms()}
                  {activeTab === 'chat' && renderChat()}
                  {activeTab === 'student-insights' && renderStudentInsights()}
                  {activeTab === 'notifications' && renderNotifications()}
                  {activeTab === 'profile' && <CounselorProfile />}
                </>
              )}

              {user?.role === 'admin' && (
                <>
                  {activeTab === 'home' && renderAdminDashboard()}
                  {activeTab === 'admin-users' && renderAdminUsers()}
                  {activeTab === 'admin-counselors' && renderAdminCounselors()}
                  {activeTab === 'admin-rooms' && renderAdminRooms()}
                  {activeTab === 'admin-reports' && renderAdminReports()}
                  {activeTab === 'rooms' && renderRooms()}
                  {activeTab === 'chat' && renderChat()}
                  {activeTab === 'settings' && <AdminSettings crisisResources={crisisResources} handleSaveCrisisResource={handleSaveCrisisResource} handleAdminAction={handleAdminAction} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-[60]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface rounded-3xl p-8 w-full max-w-md shadow-2xl border border-border-base"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-heading dark:text-white">Report Message</h3>
                  <p className="text-xs text-slate-500">Help keep SafeSpace safe for everyone.</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select a reason:</p>
                {[
                  { value: 'Harassment or bullying', icon: '🚫' },
                  { value: 'Hate speech or discrimination', icon: '⚠️' },
                  { value: 'Self-harm or crisis content', icon: '🆘' },
                  { value: 'Spam or irrelevant content', icon: '📢' },
                  { value: 'Sharing personal information', icon: '🔒' },
                  { value: 'Other', icon: '📝' },
                ].map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReportReason(r.value)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                      reportReason === r.value
                        ? 'bg-rose-50 border-rose-400 text-rose-700 dark:bg-rose-900/20 dark:border-rose-600 dark:text-rose-300'
                        : 'border-border-base text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    )}
                  >
                    <span>{r.icon}</span>
                    {r.value}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowReportModal(false)}>Cancel</Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  disabled={!reportReason}
                  onClick={submitReport}
                >
                  Submit Report
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-border-base"
            >
              <h3 className="text-2xl font-bold text-heading dark:text-white mb-2 text-center">Book Session</h3>
              <p className="text-center text-slate-500 mb-6">with {selectedCounselor?.name}</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-2">Select Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full px-4 py-3 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                    value={bookingDate || ''}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-2">Interaction Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'chat', label: 'Messaging', icon: MessageCircle },
                      { id: 'video', label: 'Video Call', icon: Video },
                      { id: 'in-person', label: 'One-on-One', icon: UserIcon },
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={() => setBookingMethod(m.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                          bookingMethod === m.id ? "bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900/20" : "border-border-base text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <m.icon size={20} />
                        <span className="text-xs font-bold uppercase">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-500 mb-2">Notes for Counselor (Optional)</label>
                  <textarea
                    className="w-full p-4 rounded-2xl border border-border-base focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none bg-surface text-slate-950 dark:text-white"
                    placeholder="Briefly describe what's on your mind..."
                    value={bookingNotes || ''}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowBookingModal(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleBookAppointment} disabled={!bookingDate}>Confirm Booking</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mood Modal */}
      <AnimatePresence>
        {showMoodModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-border-base"
            >
              <h3 className="text-2xl font-bold text-heading dark:text-white mb-6 text-center">How are you feeling?</h3>
              <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
                {MOODS.map(m => (
                  <motion.button
                    key={m.label}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedMood(m)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                      selectedMood?.label === m.label ? "bg-primary-50 ring-2 ring-primary-500 dark:bg-primary-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <span className="text-3xl">{m.emoji}</span>
                    <span className="text-xs uppercase tracking-wider font-bold text-slate-600 5">{m.label}</span>
                  </motion.button>
                ))}
              </div>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 5">Why do you feel this way today? (Optional)</label>
                <textarea
                  className="w-full p-4 rounded-2xl border border-border-base focus:ring-2 focus:ring-primary-500 outline-none h-32 resize-none bg-surface text-slate-950 dark:text-white"
                  placeholder="Share your thoughts..."
                  value={reflection || ''}
                  onChange={(e) => setReflection(e.target.value)}
                />
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowMoodModal(false)}>Cancel</Button>
                  <Button className="flex-1" onClick={handleLogMood} disabled={!selectedMood}>Save Mood</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PopoutChat = ({ roomId }: { roomId: string | null }) => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!token || !roomId) return;

    const fetchMessages = async () => {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMessages(await res.json());
    };

    fetchMessages();
    const newSocket = io();
    setSocket(newSocket);
    newSocket.emit('join-room', parseInt(roomId));
    newSocket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => { newSocket.close(); };
  }, [token, roomId]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !roomId) return;
    socket.emit('send-message', { roomId: parseInt(roomId), userId: user?.id, message: newMessage });
    setNewMessage('');
  };

  return (
    <div className="h-screen flex flex-col bg-surface">
      <header className="p-4 border-b border-border-base flex items-center justify-between bg-primary-600 text-white">
        <h2 className="font-bold">SafeSpace Chat</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex flex-col", msg.user_id === user?.id ? "items-end" : "items-start")}>
            <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm", msg.user_id === user?.id ? "bg-primary-600 text-white rounded-tr-none" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-500 rounded-tl-none")}>
              {msg.message}
            </div>
            <span className="text-xs text-slate-500 mt-1 font-medium">{msg.alias || 'User'}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border-base bg-slate-50 dark:bg-slate-900/50">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2 rounded-xl border border-border-base bg-surface text-slate-950 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Type a message..."
            value={newMessage || ''}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [initialRole, setInitialRole] = useState('student');
  const { user, isLoading } = useAuth();

  const urlParams = new URLSearchParams(window.location.search);
  const isPopout = urlParams.get('popout');

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>;

  if (isPopout === 'chat') {
    return <PopoutChat roomId={urlParams.get('roomId')} />;
  }

  if (!user) {
    if (showAuth) return <AuthPage initialRole={initialRole} />;
    return (
      <>
        <LandingPage
          onStart={(role) => {
            if (role) setInitialRole(role);
            setShowAuth(true);
          }}
          onLearnMore={() => setShowLearnMore(true)}
        />

        <AnimatePresence>
          {showLearnMore && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-[100]">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-surface rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-border-base max-h-[90vh] overflow-y-auto custom-scrollbar relative"
              >
                <button
                  onClick={() => setShowLearnMore(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={24} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
                    <Heart size={24} fill="currentColor" />
                  </div>
                  <h2 className="text-3xl font-bold text-heading dark:text-white tracking-tight">About SafeSpace</h2>
                </div>

                <div className="space-y-8 text-left">
                  <section>
                    <h3 className="text-xl font-bold text-heading dark:text-white mb-3 flex items-center gap-2">
                      <ShieldCheck className="text-emerald-500" size={20} />
                      Privacy & Anonymity
                    </h3>
                    <p className="text-slate-600 dark:l leading-relaxed">
                      SafeSpace is built on the foundation of privacy. Students are assigned random aliases (like "Brave Lion" or "Calm River") to ensure they can share their feelings without fear of judgment or identification.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-heading dark:text-white mb-3 flex items-center gap-2">
                      <Users className="text-primary-500" size={20} />
                      Peer Support
                    </h3>
                    <p className="text-slate-600 dark:l leading-relaxed">
                      Join community rooms categorized by topics like academic stress, relationships, or general wellness. Connect with others who are going through similar experiences and offer mutual support.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-heading dark:text-white mb-3 flex items-center gap-2">
                      <Brain className="text-indigo-500" size={20} />
                      MindCare AI
                    </h3>
                    <p className="text-slate-600 dark:l leading-relaxed">
                      Our advanced AI system monitors mood patterns and chat interactions to provide timely wellness tips. In case of crisis detection, it immediately provides emergency resources and alerts professional counselors.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xl font-bold text-heading dark:text-white mb-3 flex items-center gap-2">
                      <Phone className="text-rose-500" size={20} />
                      Professional Help
                    </h3>
                    <p className="text-slate-600 dark:l leading-relaxed">
                      Beyond peer support, SafeSpace provides a direct bridge to university counselors. You can book private appointments and access a comprehensive directory of local and national crisis resources.
                    </p>
                  </section>
                </div>

                <div className="mt-10 pt-6 border-t border-border-base flex justify-center">
                  <Button onClick={() => setShowLearnMore(false)} className="px-12">
                    Got it, thanks!
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return <Dashboard />;
}
