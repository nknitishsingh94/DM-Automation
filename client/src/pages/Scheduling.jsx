import { useState, useEffect, useRef } from 'react';
import {
  Plus, Calendar, Clock, Video, Image as ImageIcon, Send, X, Check, ChevronLeft, ChevronRight,
  Trash2, Globe, Lock, AlertCircle, Info, Sparkles, Volume2, VolumeX, Zap,
  ArrowLeft, Heart, MessageCircle, Home, Layout, Instagram, Target, ArrowRight, Film, Copy,
  Save, Layers, UploadCloud, Eye, FileText, Loader2, Bookmark, MessageSquare, Key, Smartphone,
  Link as LinkIcon, Pencil
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

// --- UTILITIES (Moved outside for stability) ---
const convertLocalToUTC = (localDateTimeStr, targetTimezone) => {
  if (!localDateTimeStr) return '';
  
  const [datePart, timePart] = localDateTimeStr.split('T');
  if (!datePart || !timePart) return new Date(localDateTimeStr).toISOString();
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // If browser time is selected, just use the built-in parser which treats naive strings as local
  if (targetTimezone === 'browser' || !targetTimezone) {
    const d = new Date(year, month - 1, day, hour, minute);
    return d.toISOString();
  }

  try {
    // We want to interpret year, month, day, hour, minute as being in targetTimezone
    // 1. Create a UTC date from these components as a reference point
    const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
    
    // 2. Use formatter to find the offset of the target timezone at THIS UTC time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(d);
    const p = {};
    parts.forEach(part => { p[part.type] = part.value; });
    
    // 3. Construct the local equivalent of the UTC reference
    const localOfTest = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute));
    
    // 4. Offset = Reference UTC - Local equivalent
    const offset = d.getTime() - localOfTest.getTime();
    
    // 5. Correct UTC = Reference UTC + offset
    return new Date(d.getTime() + offset).toISOString();
  } catch (e) {
    console.error("TZ Conversion Error:", e);
    return new Date(localDateTimeStr).toISOString();
  }
};

const formatInTimezone = (utcString, targetTimezone) => {
  if (!utcString) return { date: '', time: '', abbr: '' };
  try {
    let cleanStr = utcString;
    if (typeof cleanStr === 'string') {
      cleanStr = cleanStr.trim();
      if (cleanStr.includes(' ') && !cleanStr.includes('T')) {
        cleanStr = cleanStr.replace(' ', 'T');
      }
      if (!cleanStr.includes('Z') && !cleanStr.includes('+')) {
        cleanStr += 'Z';
      }
    }

    const date = new Date(cleanStr);
    if (isNaN(date.getTime())) return { date: 'Invalid Time', time: '', abbr: '' };

    const tz = targetTimezone === 'browser' ? Intl.DateTimeFormat().resolvedOptions().timeZone : targetTimezone;
    
    const dateFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, month: 'short', day: 'numeric', year: 'numeric'
    }).format(date);

    const timeFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true
    }).format(date);

    let abbr = '';
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
        .formatToParts(date);
      const namePart = parts.find(p => p.type === 'timeZoneName');
      abbr = namePart ? namePart.value : '';
      
      // Clean up GMT offsets for India specifically if needed
      if (tz === 'Asia/Kolkata' && (abbr === 'GMT+5:30' || abbr === 'IST')) {
        abbr = 'IST';
      }
    } catch (e) {}

    return { date: dateFormatted, time: timeFormatted, abbr };
  } catch (e) {
    console.error("Format Error:", e);
    return { date: 'Error', time: '', abbr: '' };
  }
};

const getCurrentTimeInTimezone = (targetTimezone) => {
  try {
    const tz = targetTimezone === 'browser' ? Intl.DateTimeFormat().resolvedOptions().timeZone : targetTimezone;
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(new Date());
    const partMap = {};
    parts.forEach(p => { partMap[p.type] = p.value; });
    const year = partMap.year;
    const month = partMap.month;
    const day = partMap.day;
    let hour = partMap.hour;
    if (hour === '24') hour = '00';
    const minute = partMap.minute;
    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch (e) {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  }
};

const toUnicodeBold = (text) => {
  if (!text) return "";
  return Array.from(text).map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D400 + (code - 65));
    if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + (code - 97));
    if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7CE + (code - 48));
    return char;
  }).join('');
};

const toUnicodeItalic = (text) => {
  if (!text) return "";
  return Array.from(text).map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D434 + (code - 65));
    if (code >= 97 && code <= 122) {
      if (char === 'h') return 'ℎ';
      return String.fromCodePoint(0x1D44E + (code - 97));
    }
    return char;
  }).join('');
};

export default function Scheduling() {
  const { user } = useAuth();
  
  // High-level States
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPost, setCreatedPost] = useState(null);
  const { notify } = useNotification();

  // Settings & Timezone
  const [selectedTimezone, setSelectedTimezone] = useState('browser');
  const [displayTimezone, setDisplayTimezone] = useState('browser');

  const timezoneOptions = [
    { value: 'browser', label: '🌍 Local Browser Time (' + Intl.DateTimeFormat().resolvedOptions().timeZone + ')', tzName: Intl.DateTimeFormat().resolvedOptions().timeZone },
    { value: 'Asia/Kolkata', label: '🇮🇳 India (IST)', tzName: 'Asia/Kolkata' },
    { value: 'America/New_York', label: '🇺🇸 USA - East (EST/EDT)', tzName: 'America/New_York' },
    { value: 'America/Los_Angeles', label: '🇺🇸 USA - West (PST/PDT)', tzName: 'America/Los_Angeles' },
    { value: 'America/Chicago', label: '🇺🇸 USA - Central (CST/CDT)', tzName: 'America/Chicago' },
    { value: 'Europe/London', label: '🇬🇧 United Kingdom (GMT/BST)', tzName: 'Europe/London' },
    { value: 'Asia/Dubai', label: '🇦🇪 Dubai (GST)', tzName: 'Asia/Dubai' },
    { value: 'Asia/Singapore', label: '🇸🇬 Singapore (SGT)', tzName: 'Asia/Singapore' },
    { value: 'Australia/Sydney', label: '🇦🇺 Australia (AEST/AEDT)', tzName: 'Australia/Sydney' },
    { value: 'Europe/Paris', label: '🇪🇺 Europe (CET/CEST)', tzName: 'Europe/Paris' }
  ];

  const handleTimezoneChange = (tzValue) => {
    setSelectedTimezone(tzValue);
    const newLocalTime = getCurrentTimeInTimezone(tzValue);
    setNewPost(prev => ({
      ...prev,
      scheduledFor: newLocalTime
    }));
    notify(`Time synchronized to ${tzValue === 'browser' ? 'local browser timezone' : tzValue}!`, 'info');
  };

  // Caption State
  const [savedCaptions, setSavedCaptions] = useState([]);
  const [showCaptionsModal, setShowCaptionsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const popularEmojis = ['🔥', '🚀', '❤️', '✨', '😍', '👇', '📸', '💬', '🌟', '🎯', '💡', '👑', '🤩', '✅', '💯', '👏'];

  const applyFormatting = (formatType) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    if (formatType === 'bold') {
      if (!selectedText) {
        notify("Please highlight/select text first to make it Bold!", "info");
        return;
      }
      const formatted = toUnicodeBold(selectedText);
      const newCaption = text.substring(0, start) + formatted + text.substring(end);
      setNewPost(prev => ({ ...prev, caption: newCaption }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formatted.length);
      }, 0);
    } else if (formatType === 'italic') {
      if (!selectedText) {
        notify("Please highlight/select text first to make it Italic!", "info");
        return;
      }
      const formatted = toUnicodeItalic(selectedText);
      const newCaption = text.substring(0, start) + formatted + text.substring(end);
      setNewPost(prev => ({ ...prev, caption: newCaption }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + formatted.length);
      }, 0);
    } else if (formatType === 'mention') {
      const newCaption = text.substring(0, start) + '@' + text.substring(end);
      setNewPost(prev => ({ ...prev, caption: newCaption }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);
    } else if (formatType === 'hashtag') {
      const newCaption = text.substring(0, start) + '#' + text.substring(end);
      setNewPost(prev => ({ ...prev, caption: newCaption }));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newCaption = text.substring(0, start) + emoji + text.substring(end);
    setNewPost(prev => ({ ...prev, caption: newCaption }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // New Post State
  const [postType, setPostType] = useState('image');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const [newPost, setNewPost] = useState({
    caption: '',
    scheduledFor: '',
    mediaUrl: '',
    triggerKeyword: '',
    autoResponse: '',
    coverUrl: '',
    // Advanced Automation Fields
    requireFollow: true,
    unfollowedResponse: "Hey! Please follow our account first to get the link! 😊",
    openingMessage: false,
    openingMessageText: "Hey there! I'm so happy you're here, thanks so much for your interest 😊\n\nClick below and I'll send you the link in just a sec 🚀",
    openingMessageButton: "click the button",
    buttons: [{ text: 'click the button', url: '' }],
    anyKeyword: false,
    publicReply: "Check your DMs! 🚀 I've sent you the info."
  });

  const chatRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchCaptions();
    fetchSettings();
    // Initialize schedule time to browser's current local time
    setNewPost(prev => ({
      ...prev,
      scheduledFor: getCurrentTimeInTimezone('browser')
    }));

    // ── Background Scheduler Trigger ──────────────────────────────────────
    // Vercel serverless = no persistent setInterval on server.
    // While this page is open, silently ping the cron endpoint every 60s
    // so due posts get published without needing an external cron service.
    const token = localStorage.getItem('insta_agent_token');
    const triggerCron = () => {
      fetch(`${API_BASE_URL}/api/cron/publish`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).catch(() => {}); // Silent fail — fire and forget
    };

    // Trigger once immediately on page load (catches any overdue posts)
    triggerCron();

    // Then every 15 seconds while page is open for high precision
    const cronInterval = setInterval(triggerCron, 15000);

    // Auto-refresh post list every 20s so status updates (Scheduled → Posted) show live
    const refreshInterval = setInterval(fetchPosts, 20000);

    // ── Supabase Realtime Subscription ───────────────────────────────────
    // Listen for real-time updates to scheduled_posts status
    const channel = supabase
      .channel('scheduled_posts_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'scheduled_posts' },
        (payload) => {
          console.log('🔔 [Realtime] Post Update Received:', payload.new);
          setPosts(currentPosts => 
            currentPosts.map(post => 
              (post._id === payload.new.id || post.id === payload.new.id) 
                ? { ...post, ...payload.new, _id: payload.new.id } 
                : post
            )
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scheduled_posts' },
        (payload) => {
          console.log('🔔 [Realtime] New Post Inserted:', payload.new);
          // Only add if it belongs to current user (though table level RLS should handle this)
          fetchPosts(); 
        }
      )
      .subscribe();

    return () => {
      clearInterval(cronInterval);
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [newPost?.autoResponse, newPost?.buttons, newPost?.requireFollow]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data) setSettings(data);
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchPosts = async () => {
    const token = localStorage.getItem('insta_agent_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/scheduling`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaptions = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setSavedCaptions(data);
    } catch (err) {
      console.error("Error fetching captions:", err);
    }
  };

  const handleSaveCaption = async () => {
    if (!newPost.caption.trim()) return;
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/captions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newPost.caption.substring(0, 20) + '...',
          content: newPost.caption
        })
      });
      if (res.ok) {
        notify("Caption saved!", "success");
        fetchCaptions();
      }
    } catch (err) {
      notify("Failed to save caption", "error");
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 10 files for carousel
    const totalFiles = [...selectedFiles, ...files].slice(0, 10);

    // Create previews ONLY for the NEW files to avoid re-generating existing ones
    const newPreviews = [...previews];
    files.forEach(file => {
      if (newPreviews.length < 10) {
        newPreviews.push(URL.createObjectURL(file));
      }
    });

    setSelectedFiles(totalFiles);
    setPreviews(newPreviews);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];

    // Revoke the URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('insta_agent_token');
    if (!token) {
      notify("Session expired. Please log in again.", "error");
      return;
    }

    if (!newPost.scheduledFor) {
      notify("Please select a date and time", "error");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('insta_agent_token');
      
      // --- STEP 1: Process Files via Signed URL (Bypasses Vercel Limit) ---
      let mediaUrls = [];
      if (selectedFiles.length > 0) {
        notify(`Optimizing ${selectedFiles.length} file(s) for large upload...`, "info");
        
        const uploadPromises = selectedFiles.map(async (file) => {
          const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          
          // A. Ask backend for a Signed URL (Uses Service Key, so no RLS issues)
          const signRes = await fetch(`${API_BASE_URL}/api/storage/sign`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName, contentType: file.type })
          });
          
          if (!signRes.ok) throw new Error("Failed to secure upload channel.");
          const { uploadUrl, publicUrl } = await signRes.json();

          // B. Direct upload to the signed URL (No Vercel limits here!)
          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
          });

          if (!uploadRes.ok) throw new Error(`Network failed during large file upload.`);
          return publicUrl;
        });

        mediaUrls = await Promise.all(uploadPromises);
      }

      // --- STEP 2: Send Metadata to Backend (Lightweight JSON) ---
      const payload = {
        caption: newPost.caption,
        scheduledFor: newPost.scheduledFor ? convertLocalToUTC(newPost.scheduledFor, selectedTimezone) : '',
        triggerKeyword: newPost.triggerKeyword,
        autoResponse: newPost.autoResponse,
        type: postType,
        mediaUrl: mediaUrls.length > 0 ? mediaUrls[0] : newPost.mediaUrl,
        carouselItems: mediaUrls.length > 0 ? mediaUrls : [],
        requireFollow: newPost.requireFollow,
        unfollowedResponse: newPost.unfollowedResponse,
        publicReply: newPost.publicReply,
        automationStatus: newPost.automationStatus,
        anyKeyword: newPost.anyKeyword,
        openingMessage: newPost.openingMessage,
        openingMessageText: newPost.openingMessageText,
        openingMessageButton: newPost.openingMessageButton,
        buttons: JSON.stringify(newPost.buttons || [])
      };

      const res = await fetch(`${API_BASE_URL}/api/scheduling`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setPosts(prev => [data, ...prev]);
        setCreatedPost({ ...data, anyKeyword: data.triggerKeyword === '*' });
        
        setTimeout(() => {
          setShowSuccess(true);
          fetchPosts();
        }, 100);

        setNewPost({ 
          caption: '', scheduledFor: getCurrentTimeInTimezone('browser'), mediaUrl: '', 
          triggerKeyword: '', autoResponse: '', coverUrl: '',
          requireFollow: true, unfollowedResponse: "Hey! Please follow our account first to get the link! 😊",
          publicReply: "Check your DMs! 🚀 I've sent you the info.",
          automationStatus: 'Active'
        });
        setSelectedFiles([]);
        setPreviews([]);
      } else {
        notify(data.error || "Failed to schedule post", "error");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      notify(err.message || "Network error during upload", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const [previewMode, setPreviewMode] = useState('post');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isPreviewMuted, setIsPreviewMuted] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState(null);
  const [tempLinkTitle, setTempLinkTitle] = useState('Open Link');
  const [tempLinkUrl, setTempLinkUrl] = useState('https://example.com');
  const [keywordInput, setKeywordInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const openAddLinkModal = () => {
    setEditingLinkIndex(null);
    setTempLinkTitle('Open Link');
    setTempLinkUrl('https://example.com');
    setShowLinkModal(true);
  };

  const openEditLinkModal = (index) => {
    setEditingLinkIndex(index);
    setTempLinkTitle(createdPost.buttons[index].text);
    setTempLinkUrl(createdPost.buttons[index].url);
    setShowLinkModal(true);
  };

  const handleSaveLink = () => {
    if (!tempLinkTitle.trim() || !tempLinkUrl.trim()) return;
    const newButtons = [...(createdPost.buttons || [])];
    if (editingLinkIndex !== null) {
      newButtons[editingLinkIndex] = { text: tempLinkTitle, url: tempLinkUrl };
    } else {
      if (newButtons.length >= 3) return;
      newButtons.push({ text: tempLinkTitle, url: tempLinkUrl });
    }
    setCreatedPost({ ...createdPost, buttons: newButtons });
    setShowLinkModal(false);
  };

  const removeLink = (index) => {
    const newButtons = (createdPost.buttons || []).filter((_, i) => i !== index);
    setCreatedPost({ ...createdPost, buttons: newButtons });
  };

  const toggleAutomationStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      // Optimistic Update
      setPosts(prev => prev.map(p => p._id === id ? { ...p, automationStatus: newStatus } : p));

      const res = await fetch(`${API_BASE_URL}/api/scheduling/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ automationStatus: newStatus })
      });
      if (!res.ok) {
        fetchPosts(); // Rollback
        notify("Failed to update status", "error");
      }
    } catch (err) {
      fetchPosts();
      notify("Network error", "error");
    }
  };

  const deletePost = async (id) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/scheduling/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p._id !== id));
        notify("Post deleted successfully!", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        notify(errData.error || "Failed to delete post", "error");
      }
    } catch (err) {
      notify("Error deleting post", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleAIGenerate = async (field, prompt) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const originalValue = createdPost[field];
      setCreatedPost(prev => ({ ...prev, [field]: "🤖 AI is thinking..." }));

      const res = await fetch(`${API_BASE_URL}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.response) {
        setCreatedPost(prev => ({ ...prev, [field]: data.response }));
        notify("AI content generated!", "success");
      } else {
        setCreatedPost(prev => ({ ...prev, [field]: originalValue }));
        notify("AI failed to generate", "error");
      }
    } catch (err) {
      notify("Network error", "error");
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your schedule...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.4s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Content <span style={{ color: '#7c3aed' }}>Scheduler</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', fontWeight: '500' }}>
            Plan, Manage and Automate your Instagram content effortlessly.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', padding: '16px 28px', borderRadius: '16px',
            fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(124,58,237,0.3)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', fontSize: '0.95rem'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(124,58,237,0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(124,58,237,0.3)';
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Schedule New Post</span>
        </button>
      </div>

      {/* Timezone Switcher */}
      <div style={{
        background: 'white', padding: '16px 24px', borderRadius: '20px',
        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="#7c3aed" />
          <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1e1b4b' }}>Display Timezone:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { value: 'browser', label: '🌍 Local' },
            { value: 'Asia/Kolkata', label: '🇮🇳 India' },
            { value: 'America/New_York', label: '🇺🇸 New York' },
            { value: 'America/Los_Angeles', label: '🇺🇸 Los Angeles' },
            { value: 'Asia/Dubai', label: '🇦🇪 Dubai' },
            { value: 'Asia/Singapore', label: '🇸🇬 Singapore' }
          ].map(tz => (
            <button
              key={tz.value}
              onClick={() => setDisplayTimezone(tz.value)}
              style={{
                padding: '8px 16px', borderRadius: '12px',
                border: displayTimezone === tz.value ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                background: displayTimezone === tz.value ? '#f5f3ff' : 'white',
                color: displayTimezone === tz.value ? '#7c3aed' : '#64748b',
                fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {tz.label}
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '100px 40px',
          background: 'white',
          borderRadius: '32px',
          border: '2px dashed #e2e8f0',
          animation: 'slideUp 0.6s ease-out'
        }}>
          <div style={{ width: '80px', height: '80px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <Calendar size={40} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '12px' }}>No content in the queue</h3>
          <p style={{ color: '#64748b', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px auto' }}>Plan your marketing strategy ahead of time. Schedule your first post now!</p>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              background: '#0f172a', color: 'white', padding: '16px 40px', borderRadius: '16px',
              fontWeight: '800', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}
          >
            Start Scheduling
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {posts.map(post => {
            // Smart Media Parser
            let mediaData = { type: 'image', mediaUrl: post.mediaUrl };
            try {
              if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
                mediaData = JSON.parse(post.mediaUrl);
              }
            } catch (e) { }

            const finalMediaUrl = mediaData.mediaUrl && mediaData.mediaUrl.startsWith('http')
              ? mediaData.mediaUrl
              : (mediaData.mediaUrl ? `${API_BASE_URL}${mediaData.mediaUrl}` : '/placeholder-ig.png');

            return (
              <div
                key={post._id}
                className="scheduling-card"
                style={{
                  background: 'white', borderRadius: '24px', padding: '16px',
                  border: '1.5px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px'
                }}
              >
                {/* Image/Video Preview Header (takes full width of card) */}
                <div style={{ width: '100%', height: '180px', borderRadius: '16px', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
                  {mediaData.type === 'reel' || (finalMediaUrl && finalMediaUrl.match(/\.(mp4|mov|webm)$/i)) ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <video src={finalMediaUrl} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                        <Film size={28} color="white" />
                      </div>
                    </div>
                  ) : (
                    <img src={finalMediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}

                  {/* Overlays inside media preview */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Status Badge */}
                    <div style={{
                      background: post.status === 'Posted' ? '#10b981' : (post.status === 'Failed' ? '#ef4444' : (post.status === 'Processing' ? '#3b82f6' : '#7c3aed')),
                      color: 'white', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.65rem', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {(post.status === 'Retrying' || post.status === 'Processing') ? (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'white' }} />
                      )}
                      <span>{post.status === 'Retrying' ? `Retrying` : (post.status || 'SCHEDULED')}</span>
                    </div>

                    {/* Post Type Badge */}
                    <div style={{
                      fontSize: '0.65rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase',
                      background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}>
                      {post.type || 'IMAGE'}
                    </div>
                  </div>

                  {/* Automation Toggle Overlay on Bottom-Right */}
                  {(post.autoResponse || post.triggerKeyword) && (
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStatus = post.automationStatus === 'Paused' ? 'Active' : 'Paused';
                          toggleAutomationStatus(post._id, newStatus);
                        }}
                        style={{
                          background: post.automationStatus === 'Paused' ? 'rgba(241, 245, 249, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                          color: post.automationStatus === 'Paused' ? '#64748b' : 'white',
                          padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                          cursor: 'pointer', fontSize: '0.65rem', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          backdropFilter: 'blur(4px)'
                        }}
                        title="Toggle Automation"
                      >
                        <Zap size={10} fill={post.automationStatus === 'Paused' ? 'none' : 'white'} />
                        <span>{post.automationStatus === 'Paused' ? 'Paused' : 'Active'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '0.9rem', fontWeight: '800', color: '#1e1b4b', margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', height: '36px', lineHeight: '1.25'
                  }}>
                    {post.caption || 'No caption provided.'}
                  </h4>

                  {(() => {
                    const tzData = formatInTimezone(post.scheduledFor, displayTimezone);
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.75rem', fontWeight: '600', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          <span>{tzData.date}</span>
                        </div>
                        <span>•</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          <span>{tzData.time}</span>
                        </div>
                        {tzData.abbr && (
                          <>
                            <span>•</span>
                            <span style={{ color: '#7c3aed', background: '#f5f3ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>
                              {tzData.abbr}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button
                    onClick={() => {
                      setCreatedPost({
                        ...post,
                        anyKeyword: post.triggerKeyword === '*',
                        automationStatus: post.automationStatus || 'Active'
                      });
                      setShowAdvanced(true);
                    }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px 14px', borderRadius: '12px', border: '1px solid #f5f3ff',
                      background: '#f5f3ff', color: '#7c3aed', fontWeight: '800', cursor: 'pointer',
                      transition: 'all 0.2s', fontSize: '0.8rem'
                    }}
                  >
                    <Zap size={14} /> <span>Automation</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteConfirmId(post._id);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '38px', height: '38px', borderRadius: '12px', border: '1px solid #fee2e2',
                      background: 'white', color: '#ef4444', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                    title="Cancel/Delete Post"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- CREATE MODAL (NEW) --- */}
      {showCreate && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px'
        }}>
          <div style={{
            background: '#f8fafc', borderRadius: '32px', width: '100%', maxWidth: '1200px', height: '90vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 50px 100px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{ padding: '24px 32px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>New Schedule</h3>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{ padding: '10px 20px', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubmit}
                  disabled={submitting}
                  style={{ padding: '10px 32px', borderRadius: '12px', background: '#7c3aed', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Schedule'}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
                {/* Left Side: Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* Post Type Selector */}
                  <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '16px' }}>Post Type</label>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[
                        { id: 'image', label: 'Image', icon: <ImageIcon size={18} /> },
                        { id: 'carousel', label: 'Carousel', icon: <Layers size={18} /> },
                        { id: 'reel', label: 'Reel', icon: <Film size={18} /> },
                        { id: 'story', label: 'Story', icon: <Zap size={18} /> }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => { setPostType(type.id); setSelectedFiles([]); setPreviews([]); }}
                          style={{
                            flex: 1, padding: '12px', borderRadius: '12px', border: postType === type.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                            background: postType === type.id ? '#f5f3ff' : 'white',
                            color: postType === type.id ? '#7c3aed' : '#64748b',
                            fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
                          }}
                        >
                          {type.icon} {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Story Info Box */}
                  {postType === 'story' && (
                    <div style={{ background: '#ecf9ff', padding: '20px', borderRadius: '20px', border: '1px solid #bae6fd', display: 'flex', gap: '16px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0ea5e9', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '800', color: '#0369a1' }}>Story Upload</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#0369a1', lineHeight: '1.5' }}>
                          Upload an image or video for your story. No caption needed. Stickers and links are not supported via scheduling platforms.
                        </p>
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', fontWeight: '700', color: '#0369a1' }}>
                          💡 Quick Tip: Use <a href="https://www.canva.com/templates/" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Canva</a> to add music, stickers, and text to your stories before uploading!
                        </p>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                    {/* Schedule Time */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '12px' }}>* Schedule Time</label>
                      <input
                        type="datetime-local"
                        value={newPost.scheduledFor}
                        onChange={e => setNewPost({ ...newPost, scheduledFor: e.target.value })}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', fontWeight: '600' }}
                        required
                      />
                    </div>
                    {/* Target Timezone / Country */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#64748b', marginBottom: '12px' }}>🌐 Target Country / Timezone</label>
                      <select
                        value={selectedTimezone}
                        onChange={e => handleTimezoneChange(e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.95rem', fontWeight: '600', background: 'white' }}
                      >
                        {timezoneOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Caption Section (Hidden for Story) */}
                  {postType !== 'story' && (
                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b' }}>Caption</label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <button onClick={() => setShowCaptionsModal(true)} type="button" style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer' }}>
                            Saved Captions
                          </button>
                        </div>
                      </div>

                      {/* Professional Social Formatting Toolbar */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                        background: '#f8fafc', borderRadius: '12px 12px 0 0', border: '1.5px solid #e2e8f0',
                        borderBottom: 'none', flexWrap: 'wrap'
                      }}>
                        <button
                          type="button"
                          onClick={() => applyFormatting('bold')}
                          style={{
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '8px', border: 'none', background: 'white', color: '#0f172a',
                            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: '0.9rem'
                          }}
                          title="Convert selected text to Bold"
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('italic')}
                          style={{
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '8px', border: 'none', background: 'white', color: '#0f172a',
                            fontStyle: 'italic', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: '0.9rem'
                          }}
                          title="Convert selected text to Italic"
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('mention')}
                          style={{
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '8px', border: 'none', background: 'white', color: '#7c3aed',
                            fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: '0.85rem'
                          }}
                          title="Add @mention"
                        >
                          @
                        </button>
                        <button
                          type="button"
                          onClick={() => applyFormatting('hashtag')}
                          style={{
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '8px', border: 'none', background: 'white', color: '#7c3aed',
                            fontWeight: '800', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: '0.85rem'
                          }}
                          title="Add #hashtag"
                        >
                          #
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          style={{
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '8px', border: 'none', background: 'white', cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)', fontSize: '0.95rem'
                          }}
                          title="Insert Emoji"
                        >
                          😊
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveCaption}
                          style={{
                            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px',
                            background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px',
                            padding: '6px 12px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer'
                          }}
                        >
                          <Save size={12} /> Save
                        </button>
                      </div>

                      {/* Emoji Selector Panel */}
                      {showEmojiPicker && (
                        <div style={{
                          display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '12px',
                          background: 'white', border: '1.5px solid #e2e8f0', borderTop: 'none',
                          borderBottom: 'none', animation: 'fadeIn 0.2s ease'
                        }}>
                          {popularEmojis.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              style={{
                                width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderRadius: '6px', border: '1px solid #f1f5f9', background: '#f8fafc',
                                cursor: 'pointer', fontSize: '1.05rem', transition: '0.15s'
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      <textarea
                        ref={textareaRef}
                        value={newPost.caption}
                        onChange={e => setNewPost({ ...newPost, caption: e.target.value })}
                        placeholder="Write your caption... Tip: Select text to make it Bold or Italic!"
                        style={{
                          width: '100%', height: '110px', padding: '16px',
                          borderRadius: '0 0 14px 14px', border: '1.5px solid #e2e8f0',
                          outline: 'none', fontSize: '0.95rem', resize: 'none',
                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        required
                      />
                    </div>
                  )}

                  {/* Upload Area */}
                  <div style={{
                    background: 'white', padding: previews.length > 0 ? '12px' : '40px', borderRadius: '24px', border: '2px dashed #e2e8f0',
                    textAlign: 'center', cursor: previews.length > 0 ? 'default' : 'pointer', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                  }}
                    onClick={() => previews.length === 0 && fileInputRef.current.click()}>
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple={postType === 'carousel'} accept={postType === 'reel' ? 'video/*' : 'image/*,video/*'} onChange={handleFileChange} />

                    {previews.length > 0 ? (
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', padding: '8px' }}>
                          {previews.map((src, idx) => (
                            <div key={idx} style={{ aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9', position: 'relative' }}>
                              {selectedFiles[idx]?.type.startsWith('video') ? (
                                <video src={src} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}

                          {/* Add More Button for Carousel */}
                          {postType === 'carousel' && previews.length < 10 && (
                            <div
                              onClick={() => fileInputRef.current.click()}
                              style={{
                                aspectRatio: '1/1', borderRadius: '12px', border: '2px dashed #7c3aed',
                                background: '#f5f3ff', display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                color: '#7c3aed', gap: '4px', transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#ede9fe'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#f5f3ff'}
                            >
                              <Plus size={20} strokeWidth={3} />
                              <span style={{ fontSize: '0.65rem', fontWeight: '800' }}>ADD MORE</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={32} color="#7c3aed" style={{ marginBottom: '12px' }} />
                        <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>
                          {postType === 'story' ? 'Click or drag to upload image or video for story' : 'Click to upload media'}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Premium Simulation Preview */}
                <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '800', color: '#64748b' }}>Live Simulation</label>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                      <button 
                        onClick={() => setPreviewMode('post')}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: previewMode === 'post' ? 'white' : 'transparent', color: previewMode === 'post' ? '#7c3aed' : '#64748b', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', boxShadow: previewMode === 'post' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                      >
                        Post
                      </button>
                      <button 
                        onClick={() => setPreviewMode('dm')}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: previewMode === 'dm' ? 'white' : 'transparent', color: previewMode === 'dm' ? '#7c3aed' : '#64748b', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', boxShadow: previewMode === 'dm' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
                      >
                        DM
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const previewData = newPost;
                    return (
                  <div style={{
                    width: '320px', height: '640px', background: '#000', borderRadius: '48px', border: '12px solid #1e1b4b',
                    position: 'relative', overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)',
                    margin: '0 auto', display: 'flex', flexDirection: 'column'
                  }}>
                    <style>{`
                      .custom-ig-scroller::-webkit-scrollbar { width: 4px; }
                      .custom-ig-scroller::-webkit-scrollbar-track { background: #000; }
                      .custom-ig-scroller::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                    `}</style>

                    {/* Realistic Notch */}
                    <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '20px', background: '#000', borderRadius: '20px', zIndex: 100 }}></div>

                    {/* Status Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 24px 8px', fontSize: '0.65rem', fontWeight: '800', color: '#FFF', zIndex: 50 }}>
                      <span>9:41</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Zap size={10} fill="white" />
                        <div style={{ width: '14px', height: '7px', border: '1px solid #FFF', borderRadius: '2px' }}></div>
                      </div>
                    </div>

                    {/* Instagram Header */}
                    <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: '#000', zIndex: 10, borderBottom: '1px solid #1a1a1a' }}>
                      <ChevronLeft size={20} color="white" />
                      <div style={{ 
                        width: '28px', height: '28px', borderRadius: '50%', 
                        background: user?.profilePhoto ? `url(${user.profilePhoto})` : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                        backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0
                      }}></div>
                      <div style={{ color: 'white', fontSize: '0.8rem', fontWeight: '700' }}>
                        {settings?.connectedInstagramName || user?.username || 'instagram_user'}
                      </div>
                    </div>

                    <div style={{ flex: 1, background: '#000', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      {previewMode === 'post' ? (
                        <div ref={chatRef} className="custom-ig-scroller" style={{ flex: 1, overflowY: 'auto' }}>
                          {/* Main Media Display */}
                          <div style={{ width: '100%', aspectRatio: '1/1', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {previews.length > 0 ? (
                                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                  {previews[currentPreviewIndex] && (
                                    (selectedFiles[currentPreviewIndex]?.type?.startsWith('video') || (typeof previews[currentPreviewIndex] === 'string' && (previews[currentPreviewIndex].includes('.mp4') || previews[currentPreviewIndex].includes('.mov')))) ? (
                                      <video src={previews[currentPreviewIndex]} autoPlay muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <img src={previews[currentPreviewIndex]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )
                                  )}
                                  {previews.length > 1 && (
                                    <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                                      {previews.map((_, i) => <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: i === currentPreviewIndex ? '#7c3aed' : 'rgba(255,255,255,0.5)' }} />)}
                                    </div>
                                  )}
                                </div>
                            ) : (
                              <ImageIcon size={40} color="#333" />
                            )}
                          </div>
                          {/* Post Actions */}
                          <div style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
                              <Heart size={20} color="white" />
                              <MessageCircle size={20} color="white" />
                              <Send size={20} color="white" />
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'white', lineHeight: '1.4' }}>
                              <span style={{ fontWeight: '800', marginRight: '6px' }}>{user?.username || 'user'}</span>
                              {newPost.caption || '...'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          ref={chatRef} className="custom-ig-scroller"
                          style={{ 
                            flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', 
                            overflowY: 'auto', background: '#000', minHeight: 0,
                            scrollBehavior: 'smooth'
                          }}
                        >
                          <div style={{ color: '#8e8e8e', fontSize: '0.72rem', textAlign: 'center', padding: '4px 0' }}>
                            Automated DM Preview
                          </div>

                          {/* 1. User's triggering Comment */}
                          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', maxWidth: '85%' }}>
                            <div style={{ background: '#3b82f6', color: '#FFF', padding: '10px 14px', borderRadius: '18px 18px 4px 18px', fontSize: '0.85rem', fontWeight: '500' }}>
                              💬 Comment: "{previewData?.triggerKeyword ? `Comment matching "${previewData.triggerKeyword}"` : "Comment matching trigger keyword"}"
                            </div>
                          </div>

                          {/* 2. Bot's Public Comment Reply */}
                          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start', maxWidth: '85%' }}>
                            <div style={{ 
                              width: '24px', height: '24px', borderRadius: '50%', 
                              background: user?.profilePhoto ? `url(${user.profilePhoto})` : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                              backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, fontSize: '0.55rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
                            }}>
                              {!user?.profilePhoto && "IG"}
                            </div>
                            <div style={{ background: '#262626', color: '#a3a3a3', padding: '10px 14px', borderRadius: '18px 18px 18px 4px', fontSize: '0.85rem', border: '1px solid #333' }}>
                              💬 Reply: "{previewData?.publicReply || "Check your DMs! 🚀"}"
                            </div>
                          </div>

                          {/* 3. System Notification */}
                          <div style={{ color: '#8e8e8e', fontSize: '0.72rem', textAlign: 'center', padding: '8px 12px', background: '#121212', borderRadius: '12px', border: '1px solid #222', lineHeight: '1.4', fontWeight: '500' }}>
                            ⚙️ <span style={{ color: '#4f95ff', fontWeight: '700' }}>System Automation</span>: Sent DM because user commented on your post.
                          </div>

                          {/* 4. Bot Message Card Bubble (Integrated - Dark Mode Card) */}
                          <div style={{ alignSelf: 'flex-start', maxWidth: '90%', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <div style={{ 
                              width: '28px', height: '28px', borderRadius: '50%', 
                              background: user?.profilePhoto ? `url(${user.profilePhoto})` : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                              backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 
                            }}></div>
                            <div style={{ 
                              background: '#262626', color: '#FFF', borderRadius: '18px 18px 18px 4px', 
                              overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid #333', boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                            }}>
                              <div style={{ padding: '12px 14px', fontSize: '0.85rem', fontWeight: '500', lineHeight: '1.4' }}>
                                {previewData?.autoResponse || "Here is your requested link! 👇"}
                              </div>
                            </div>
                          </div>

                          {/* 5. User Reply Bubble (Signature Purple Gradient) */}
                          <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#FFF', padding: '12px 16px', borderRadius: '18px 18px 4px 18px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 4px 15px rgba(124, 58, 237, 0.2)' }}>
                            Checking it out! 👍
                          </div>

                          <div style={{ height: '10px' }} ref={el => { if (el && previewMode === 'dm') el.scrollIntoView({ behavior: 'smooth' }); }}></div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Tab Bar Mockup */}
                    <div style={{ height: '40px', background: '#000', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      <Home size={18} color="white" />
                      <ImageIcon size={18} color="white" />
                      <Plus size={18} color="white" />
                      <Zap size={18} color="white" />
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#333' }}></div>
                    </div>
                  </div>
                  );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Captions Modal */}
      {showCaptionsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Saved Captions</h3>
              <button onClick={() => setShowCaptionsModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
              {savedCaptions.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center' }}>No saved captions found.</p> : savedCaptions.map(cap => (
                <div
                  key={cap._id}
                  onClick={() => { setNewPost({ ...newPost, caption: cap.content }); setShowCaptionsModal(false); }}
                  style={{ padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: '700', marginBottom: '4px' }}>{cap.title}</div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>{cap.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS MODAL WITH ADVANCED AUTOMATION LINK --- */}
      {showSuccess && createdPost && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px'
        }}>
          <div style={{
            background: 'white', borderRadius: '28px', width: '95%', maxWidth: '400px',
            maxHeight: '90vh', overflowY: 'auto',
            padding: '32px 24px', textAlign: 'center', boxShadow: '0 40px 80px rgba(0,0,0,0.2)',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Check size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '8px' }}>Post Scheduled!</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginBottom: '24px' }}>
              Your content is ready to go live on Instagram. Now, set up your marketing automation!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setShowSuccess(false); setPreviews([]); }}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#7c3aed', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)' }}
              >
                Close
              </button>

              <button
                onClick={() => { setShowSuccess(false); setShowAdvanced(true); }}
                style={{
                  width: '100%', padding: '14px', borderRadius: '14px', background: '#f5f3ff',
                  color: '#7c3aed', border: 'none', fontWeight: '800', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                <Zap size={16} /> Advanced Automation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADVANCED AUTOMATION EDITOR (SIDE DRAWER/MODAL) --- */}
      {showAdvanced && createdPost && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white', 
            width: '100%', 
            maxWidth: '800px', 
            height: isMobile ? '100%' : '90vh', 
            borderRadius: isMobile ? '0' : '40px',
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden', 
            position: 'relative',
            animation: 'modalSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Config Steps (Premium Builder) */}
            <div style={{ padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Advanced <span style={{ color: '#7c3aed' }}>Automation</span></h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <div
                      onClick={() => setCreatedPost({ ...createdPost, automationStatus: createdPost.automationStatus === 'Active' ? 'Paused' : 'Active' })}
                      style={{
                        width: '40px', height: '20px', borderRadius: '10px',
                        background: createdPost.automationStatus === 'Active' ? '#10b981' : '#cbd5e1',
                        position: 'relative', cursor: 'pointer', transition: '0.3s'
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                        position: 'absolute', top: '2px', left: createdPost.automationStatus === 'Active' ? '22px' : '2px',
                        transition: '0.3s'
                      }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: createdPost.automationStatus === 'Active' ? '#10b981' : '#64748b' }}>
                      Automation {createdPost.automationStatus === 'Active' ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowAdvanced(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Visual Workflow Map (Blueprint) */}
              <div style={{
                background: '#faf5ff',
                borderRadius: '24px',
                padding: '24px',
                border: '1.5px dashed #d8b4fe',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Layers size={16} color="#7c3aed" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#7c3aed', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Live Automation Blueprint</span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  position: 'relative',
                  gap: '8px',
                  flexWrap: isMobile ? 'wrap' : 'nowrap'
                }}>
                  {/* Step 1: Post */}
                  <div style={{ 
                    flex: 1, 
                    minWidth: '70px',
                    background: 'white', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Trigger Post</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <ImageIcon size={12} color="#7c3aed" />
                      <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#1e1b4b' }}>This Post</span>
                    </div>
                  </div>

                  {/* Arrow 1 */}
                  <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                    <ArrowRight size={14} />
                  </div>

                  {/* Step 2: Comment */}
                  <div style={{ 
                    flex: 1.2, 
                    minWidth: '85px',
                    background: 'white', 
                    border: '1.5px solid #3b82f6', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.05)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>User Comment</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', overflow: 'hidden' }}>
                      <MessageCircle size={12} color="#3b82f6" />
                      <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#1e1b4b', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                        {createdPost.anyKeyword ? 'Any Comment' : (createdPost.triggerKeyword ? `"${createdPost.triggerKeyword.split(',')[0]}"` : 'Keyword')}
                      </span>
                    </div>
                  </div>

                  {/* Arrow 2 */}
                  <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                    <ArrowRight size={14} />
                  </div>

                  {/* Step 3: Gating (Optional) */}
                  <div style={{ 
                    flex: 1, 
                    minWidth: '70px',
                    background: createdPost.requireFollow ? '#f0fdf4' : 'white', 
                    border: createdPost.requireFollow ? '1.5px solid #10b981' : '1.5px dashed #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: createdPost.requireFollow ? '0 4px 10px rgba(16, 185, 129, 0.05)' : 'none',
                    opacity: createdPost.requireFollow ? 1 : 0.6,
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: createdPost.requireFollow ? '#10b981' : '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Follow check</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Lock size={12} color={createdPost.requireFollow ? '#10b981' : '#64748b'} />
                      <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#1e1b4b' }}>
                        {createdPost.requireFollow ? 'Active' : 'Skipped'}
                      </span>
                    </div>
                  </div>

                  {/* Arrow 3 */}
                  <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                    <ArrowRight size={14} />
                  </div>

                  {/* Step 3.5: Greeting (Optional) */}
                  {createdPost.openingMessage && (
                    <>
                      <div style={{ 
                        flex: 1.1, 
                        minWidth: '80px',
                        background: 'white', 
                        border: '1.5px solid #3b82f6', 
                        borderRadius: '12px', 
                        padding: '10px 6px', 
                        textAlign: 'center',
                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.02)',
                        zIndex: 2
                      }}>
                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>Greeting</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <MessageCircle size={12} color="#3b82f6" />
                          <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#1e1b4b' }}>Greeting Msg</span>
                        </div>
                      </div>

                      {/* Arrow 3.5 */}
                      <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', zIndex: 1 }}>
                        <ArrowRight size={14} />
                      </div>
                    </>
                  )}

                  {/* Step 4: Actions */}
                  <div style={{ 
                    flex: 1.2, 
                    minWidth: '85px',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                    border: 'none', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginBottom: '4px' }}>Bot Response</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <Zap size={11} fill="white" />
                      <span style={{ fontSize: '0.7rem', fontWeight: '900' }}>DM & Reply</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Follower Growth Gating */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>1</div>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Follower Growth Gating</h4>
                </div>

                <div style={{ border: '1.5px solid #d1fae5', borderRadius: '20px', padding: '20px', background: '#f0fdf4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '800', color: '#065f46', fontSize: '0.95rem' }}>Require Follow to Trigger</div>
                    <div
                      onClick={() => setCreatedPost({ ...createdPost, requireFollow: !createdPost.requireFollow })}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.requireFollow ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: createdPost.requireFollow ? '23px' : '3px', transition: '0.3s' }}></div>
                    </div>
                  </div>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.8rem', color: '#059669', lineHeight: '1.5' }}>
                    Only people who follow you will receive your link. Non-followers will get a request to follow you first. 🚀
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#059669' }}>Follow Request Message</label>
                    <button
                      onClick={() => handleAIGenerate('unfollowedResponse', `Write a polite Instagram DM asking someone to follow me before I can send them the link they requested. Keep it short.`)}
                      style={{ background: 'none', border: 'none', color: '#059669', fontWeight: '800', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles size={12} /> AI Write
                    </button>
                  </div>
                  <textarea
                    value={createdPost.unfollowedResponse}
                    onChange={(e) => setCreatedPost({ ...createdPost, unfollowedResponse: e.target.value })}
                    style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '16px', border: '1.5px solid #10b981', outline: 'none', fontSize: '0.9rem', resize: 'none', background: 'white' }}
                  />
                </div>
              </div>

              {/* 2. Select a Post */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>2</div>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Select a Post</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '800', color: '#475569', fontSize: '0.9rem' }}>Any post</div>
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: '#cbd5e1', position: 'relative', cursor: 'not-allowed' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: '3px' }}></div>
                  </div>
                </div>
              </div>

              {/* 3. Comment Trigger */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>3</div>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Comment Trigger</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontWeight: '800', color: '#475569', fontSize: '0.9rem' }}>Any keyword</div>
                  <div
                    onClick={() => setCreatedPost({ ...createdPost, anyKeyword: !createdPost.anyKeyword })}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.anyKeyword ? '#3b82f6' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: createdPost.anyKeyword ? '23px' : '3px', transition: '0.3s' }}></div>
                  </div>
                </div>

                {!createdPost.anyKeyword && (
                  <>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Type & Hit ↵ Enter to add Keyword"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (keywordInput.trim()) {
                              const kws = (createdPost.triggerKeyword || '').split(',').map(s => s.trim()).filter(k => k);
                              if (!kws.includes(keywordInput.trim())) kws.push(keywordInput.trim());
                              setCreatedPost({ ...createdPost, triggerKeyword: kws.join(', ') });
                              setKeywordInput('');
                            }
                          }
                        }}
                        style={{ width: '100%', padding: '14px 50px 14px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '0.9rem', fontWeight: '600' }}
                      />
                      <button
                        onClick={() => {
                          if (keywordInput.trim()) {
                            const kws = (createdPost.triggerKeyword || '').split(',').map(s => s.trim()).filter(k => k);
                            if (!kws.includes(keywordInput.trim())) kws.push(keywordInput.trim());
                            setCreatedPost({ ...createdPost, triggerKeyword: kws.join(', ') });
                            setKeywordInput('');
                          }
                        }}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Plus size={18} />
                      </button>
                    </div>

                    {createdPost.triggerKeyword && createdPost.triggerKeyword !== '*' && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {createdPost.triggerKeyword.split(',').filter(k => k.trim()).map((kw, i) => (
                          <div key={i} style={{ background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #dbeafe' }}>
                            {kw.trim()}
                            <X
                              size={14}
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const kws = createdPost.triggerKeyword.split(',').map(s => s.trim()).filter((_, idx) => idx !== i);
                                setCreatedPost({ ...createdPost, triggerKeyword: kws.join(', ') });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>              {/* 4. Opening Message */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>4</div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Advanced: Opening Message</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>Send a greeting button before the final response.</p>
                    </div>
                  </div>
                  <div
                    onClick={() => setCreatedPost({ ...createdPost, openingMessage: !createdPost.openingMessage })}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.openingMessage ? '#3b82f6' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: createdPost.openingMessage ? '23px' : '3px', transition: '0.3s' }}></div>
                  </div>
                </div>

                {createdPost.openingMessage && (
                  <div style={{ border: '1.5px solid #dbeafe', borderRadius: '20px', padding: '20px', background: '#f0f9ff', marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0369a1' }}>GREETING TEXT</label>
                      <button
                        onClick={() => handleAIGenerate('openingMessageText', `Write a friendly Instagram DM greeting message thanking someone for interest and telling them to click the button below to get the link.`)}
                        style={{ background: 'none', border: 'none', color: '#0369a1', fontWeight: '800', fontSize: '0.7rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Sparkles size={12} /> AI Write
                      </button>
                    </div>
                    <textarea
                      value={createdPost.openingMessageText || ''}
                      onChange={(e) => setCreatedPost({ ...createdPost, openingMessageText: e.target.value })}
                      style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '16px', border: '1.5px solid #3b82f6', outline: 'none', fontSize: '0.9rem', resize: 'none', background: 'white', marginBottom: '16px' }}
                    />

                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', marginBottom: '8px' }}>BUTTON TEXT</label>
                    <input
                      type="text"
                      value={createdPost.openingMessageButton || ''}
                      onChange={(e) => setCreatedPost({ ...createdPost, openingMessageButton: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #3b82f6', outline: 'none', fontSize: '0.9rem', fontWeight: '800', background: 'white' }}
                    />
                  </div>
                )}
              </div>

              {/* 5. Send a DM */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>5</div>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Send a DM</h4>
                </div>

                <div style={{ border: '1.5px solid #e2e8f0', borderRadius: '20px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                      <Send size={14} /> <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>DM Response Text</span>
                    </div>
                    <button
                      onClick={() => handleAIGenerate('autoResponse', `Write a high-converting Instagram DM response for my automation. It should be exciting and mention that the link is below. Use emojis.`)}
                      style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles size={14} /> AI Write
                    </button>
                  </div>
                  <textarea
                    value={createdPost.autoResponse || ''}
                    onChange={(e) => setCreatedPost({ ...createdPost, autoResponse: e.target.value })}
                    placeholder="Enter your final message here... (e.g. Here is your link!)"
                    style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', border: 'none', background: '#f8fafc', outline: 'none', fontSize: '0.95rem', resize: 'none' }}
                  />

                  <div style={{ marginTop: '20px', borderTop: '1.5px solid #f1f5f9', paddingTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                        <LinkIcon size={14} /> <span style={{ fontSize: '0.8rem', fontWeight: '800' }}>Link & Call to Action</span>
                      </div>
                      <button onClick={openAddLinkModal} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        + Add Link
                      </button>
                    </div>

                    {/* Added Buttons List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                      {(createdPost.buttons || []).map((btn, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <LinkIcon size={14} color="#3b82f6" />
                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>{btn.text}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <Pencil size={16} onClick={() => openEditLinkModal(idx)} style={{ cursor: 'pointer', color: '#64748b' }} />
                            <Trash2 size={16} onClick={() => removeLink(idx)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                          </div>
                        </div>
                      ))}
                      {(createdPost.buttons || []).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                          No buttons added yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Automations: Public Comment Reply */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Advanced Automations</h4>
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: '#3b82f6', position: 'relative' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', right: '3px' }}></div>
                  </div>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '24px' }}>Grow your audience faster — with smart, hands-free engagement.</p>

                <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: '20px', padding: '24px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#7c3aed', textTransform: 'uppercase' }}>PUBLIC COMMENT REPLY (RECOMMENDED)</label>
                    <button
                      onClick={() => handleAIGenerate('publicReply', `Write a short, friendly Instagram comment reply to someone who commented on my post. Mention that I've sent them a DM with the details. Use emojis.`)}
                      style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Sparkles size={14} /> AI Write
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={createdPost.publicReply || ''}
                      onChange={(e) => setCreatedPost({ ...createdPost, publicReply: e.target.value })}
                      placeholder="e.g. Check your DMs! 🚀"
                      style={{ width: '100%', padding: '16px 50px 16px 16px', borderRadius: '16px', border: '1.5px solid #ddd6fe', outline: 'none', fontSize: '0.95rem', fontWeight: '600', background: 'white' }}
                    />
                  </div>
                </div>

                {/* Sticky Action Button Container */}
                <div style={{
                  position: 'sticky',
                  bottom: '-40px',
                  left: 0,
                  right: 0,
                  background: 'white',
                  padding: '24px 0 0 0',
                  borderTop: '1.5px solid #f1f5f9',
                  marginTop: '20px',
                  zIndex: 10
                }}>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('insta_agent_token');
                        const targetId = createdPost._id || createdPost.id;
                        if (!targetId) {
                          notify("Error: Post ID not found", "error");
                          return;
                        }

                        const res = await fetch(`${API_BASE_URL}/api/scheduling/${targetId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                          body: JSON.stringify({
                            ...createdPost,
                            triggerKeyword: createdPost.anyKeyword ? '*' : createdPost.triggerKeyword,
                            automationStatus: createdPost.automationStatus || 'Active'
                          })
                        });
                        if (res.ok) {
                          notify("✅ Automation created successfully!", "success");
                          setShowAdvanced(false);
                          fetchPosts();
                        } else {
                          const errData = await res.json();
                          notify(errData.error || "Failed to save", "error");
                        }
                      } catch (err) { notify("Network error while saving", "error"); }
                    }}
                    style={{ width: '100%', padding: '18px', borderRadius: '20px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)' }}
                  >
                    <Zap size={24} fill="white" /> Create Automation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- LINK MODAL --- */}
      {showLinkModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px'
        }}>
          <div style={{
            background: 'white', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px',
            boxShadow: '0 30px 70px rgba(0,0,0,0.3)', animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>{editingLinkIndex !== null ? 'Edit Button' : 'Add Link Button'}</h3>
              <button onClick={() => setShowLinkModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>BUTTON TEXT</label>
              <input
                value={tempLinkTitle}
                onChange={(e) => setTempLinkTitle(e.target.value)}
                placeholder="e.g. Visit Website"
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px' }}>URL LINK</label>
              <input
                value={tempLinkUrl}
                onChange={(e) => setTempLinkUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600', color: '#7c3aed' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveLink}
                style={{ flex: 1.5, padding: '16px', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)' }}
              >
                Save Button
              </button>
              <button onClick={() => setShowLinkModal(false)} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div
          onClick={() => setDeleteConfirmId(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '28px',
              padding: '36px 32px',
              maxWidth: '380px',
              width: '100%',
              boxShadow: '0 30px 60px rgba(0,0,0,0.18)',
              animation: 'modalSlideUp 0.25s ease-out',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#fef2f2', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 20px auto'
            }}>
              <Trash2 size={28} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: '#1e1b4b', margin: '0 0 10px 0' }}>
              Delete Scheduled Post?
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', margin: '0 0 28px 0', lineHeight: '1.5' }}>
              This will permanently cancel and remove this scheduled post. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  flex: 1, padding: '14px', background: '#f1f5f9', color: '#64748b',
                  border: 'none', borderRadius: '14px', fontWeight: '800',
                  cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                Cancel
              </button>
              <button
                onClick={() => deletePost(deleteConfirmId)}
                style={{
                  flex: 1, padding: '14px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', border: 'none', borderRadius: '14px',
                  fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(239,68,68,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(239,68,68,0.3)'; }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Animations */}
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
