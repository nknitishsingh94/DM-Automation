import { useState, useEffect, useRef } from 'react';
import {
  Plus, Calendar, Clock, Video, Image as ImageIcon, Send, X, Check, ChevronLeft, ChevronRight,
  ChevronDown, Trash2, Globe, AlertCircle, Info, Sparkles, Zap, Heart, MessageCircle, Home,
  Instagram, Facebook, Film, Save, Layers, UploadCloud, Loader2, Link as LinkIcon, Pencil
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

// --- UTILITIES ---
const convertLocalToUTC = (localDateTimeStr, targetTimezone) => {
  if (!localDateTimeStr) return '';
  
  const [datePart, timePart] = localDateTimeStr.split('T');
  if (!datePart || !timePart) return new Date(localDateTimeStr).toISOString();
  
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  if (targetTimezone === 'browser' || !targetTimezone) {
    const d = new Date(year, month - 1, day, hour, minute);
    return d.toISOString();
  }

  try {
    const d = new Date(Date.UTC(year, month - 1, day, hour, minute));
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    const parts = formatter.formatToParts(d);
    const p = {};
    parts.forEach(part => { p[part.type] = part.value; });
    
    const localOfTest = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute));
    const offset = d.getTime() - localOfTest.getTime();
    
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

const compressImage = (file) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      return resolve(file);
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        let origWidth = img.width;
        let origHeight = img.height;
        let ratio = origWidth / origHeight;
        
        let targetWidth = origWidth;
        let targetHeight = origHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (ratio < 0.8) {
          targetWidth = origHeight * 0.8;
          offsetX = (targetWidth - origWidth) / 2;
        } else if (ratio > 1.91) {
          targetHeight = origWidth / 1.91;
          offsetY = (targetHeight - origHeight) / 2;
        }

        const MAX_WIDTH = 1440;
        const MAX_HEIGHT = 1440;
        if (targetWidth > MAX_WIDTH || targetHeight > MAX_HEIGHT) {
          const scale = Math.min(MAX_WIDTH / targetWidth, MAX_HEIGHT / targetHeight);
          targetWidth *= scale;
          targetHeight *= scale;
          origWidth *= scale;
          origHeight *= scale;
          offsetX *= scale;
          offsetY *= scale;
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, offsetX, offsetY, origWidth, origHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_ig_ready.jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
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
      if (char === 'h') return 'h';
      return String.fromCodePoint(0x1D44E + (code - 97));
    }
    return char;
  }).join('');
};

function ThreadsIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10H12Z" />
      <path d="M12 12a4 4 0 1 0 4 4h-4Z" />
    </svg>
  );
}

export default function Scheduling() {
  const { user } = useAuth();
  const { notify } = useNotification();

  // High-level States
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPost, setCreatedPost] = useState(null);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);

  // Filters State
  const [postStatusFilter, setPostStatusFilter] = useState('All posts');
  const [showPostStatusDropdown, setShowPostStatusDropdown] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('All platforms');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState('All dates');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [scheduleMode, setScheduleMode] = useState('Schedule');


  // Settings & Timezone
  const [selectedTimezone, setSelectedTimezone] = useState('browser');
  const [displayTimezone] = useState('browser');

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
    platform: 'instagram',
    caption: '',
    scheduledFor: '',
    mediaUrl: '',
    triggerKeyword: '',
    autoResponse: '',
    coverUrl: '',
    requireFollow: true,
    unfollowedResponse: "Hey! Please follow our account first to get the link! 😍",
    openingMessage: false,
    openingMessageText: "Hey there! I'm so happy you're here, thanks so much for your interest 😍\n\nClick below and I'll send you the link in just a sec 🚀",
    openingMessageButton: "click the button",
    buttons: [],
    anyKeyword: false,
    publicReply: "Check your DMs! 🚀 I've sent you the info.",
    youtubeFirstComment: '',
    youtubeVisibility: 'Public',
    youtubeTitle: '',
    youtubeTags: ''
  });

  const chatRef = useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchCaptions();
    fetchSettings();
    setNewPost(prev => ({
      ...prev,
      scheduledFor: getCurrentTimeInTimezone('browser')
    }));

    const token = localStorage.getItem('insta_agent_token');
    const triggerCron = () => {
      fetch(`${API_BASE_URL}/api/cron/publish`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      }).catch(() => {});
    };

    triggerCron();

    const cronInterval = setInterval(triggerCron, 15000);
    const refreshInterval = setInterval(fetchPosts, 20000);

    const channel = supabase
      .channel('scheduled_posts_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'scheduled_posts' },
        (payload) => {
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
      if (data) {
        setSettings(data);
        const isIgConnected = data.isAccountConnected || (!!data.instagramAccessToken && !!data.businessAccountId);
        const isFbConnected = data.isFacebookConnected || (!!data.facebookAccessToken && !!data.facebookPageId);
        if (isIgConnected) {
          setNewPost(prev => ({ ...prev, platform: 'instagram' }));
        } else if (isFbConnected) {
          setNewPost(prev => ({ ...prev, platform: 'facebook' }));
        } else {
          setNewPost(prev => ({ ...prev, platform: '' }));
        }
      }
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
        setPosts(prevPosts => {
          const uploadingPosts = prevPosts.filter(p => p.isUploading);
          const uploadingIds = new Set(uploadingPosts.map(p => p._id || p.id));
          const filteredData = data.filter(p => !uploadingIds.has(p._id) && !uploadingIds.has(p.id));
          return [...uploadingPosts, ...filteredData];
        });
      } else {
        setPosts(prevPosts => prevPosts.filter(p => p.isUploading));
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.alreadySaved) {
          notify(data.message || "Already caption is saved", "warning");
        } else {
          notify("Caption saved!", "success");
          fetchCaptions();
        }
      } else {
        notify(data.error || "Failed to save caption", "error");
      }
    } catch (err) {
      notify("Failed to save caption", "error");
    }
  };

  const handleDeleteCaption = async (id) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/captions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        notify("Caption deleted successfully", "success");
        fetchCaptions();
      } else {
        const data = await res.json().catch(() => ({}));
        notify(data.error || "Failed to delete caption", "error");
      }
    } catch (err) {
      notify("Error deleting caption", "error");
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > 1 && postType !== 'carousel') {
      setPostType('carousel');
    } else if (files.length === 1 && files[0].type.startsWith('video/') && postType !== 'story') {
      setPostType('reel');
    } else if (files.length === 1 && files[0].type.startsWith('image/') && postType === 'reel') {
      setPostType('image');
    }

    const totalFiles = [...selectedFiles, ...files].slice(0, 10);

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

    const payloadBase = { ...newPost };
    const currentFiles = [...selectedFiles];
    const currentPreviews = [...previews];
    const currentType = postType;
    
    setShowCreate(false);
    setNewPost({ 
      platform: 'instagram',
      caption: '', scheduledFor: getCurrentTimeInTimezone('browser'), mediaUrl: '', 
      triggerKeyword: '', autoResponse: '', coverUrl: '',
      requireFollow: true, unfollowedResponse: "Hey! Please follow our account first to get the link! 😍",
      publicReply: "Check your DMs! 🚀",
      automationStatus: 'Active'
    });
    setSelectedFiles([]);
    setPreviews([]);
    setPostType('image');

    const tempId = 'temp-' + Date.now();
    const tempPost = {
      _id: tempId,
      status: 'Uploading',
      caption: payloadBase.caption,
      platform: payloadBase.platform || 'instagram',
      type: currentType,
      scheduledFor: convertLocalToUTC(payloadBase.scheduledFor, selectedTimezone),
      mediaUrl: JSON.stringify({
        type: currentType,
        mediaUrl: currentPreviews.length > 0 ? currentPreviews[0] : payloadBase.mediaUrl
      }),
      isUploading: true
    };
    
    setPosts(prev => [tempPost, ...prev]);
    setSubmitting(true);
    
    if (currentFiles.length > 0 && (currentType === 'reel' || currentType === 'video')) {
        notify("Video upload started in background! You can continue using the app.", "info");
    } else {
        notify("Upload started...", "info");
    }

    (async () => {
      let dbId = null;
      try {
        const initialPayload = {
          caption: payloadBase.caption,
          scheduledFor: tempPost.scheduledFor,
          triggerKeyword: payloadBase.triggerKeyword,
          autoResponse: payloadBase.autoResponse,
          type: currentType,
          mediaUrl: payloadBase.mediaUrl || '',
          carouselItems: [],
          requireFollow: payloadBase.requireFollow,
          unfollowedResponse: payloadBase.unfollowedResponse,
          publicReply: payloadBase.publicReply,
          automationStatus: payloadBase.automationStatus || 'Active',
          anyKeyword: payloadBase.anyKeyword,
          openingMessage: payloadBase.openingMessage,
          openingMessageText: payloadBase.openingMessageText,
          openingMessageButton: payloadBase.openingMessageButton,
          buttons: JSON.stringify(payloadBase.buttons || []),
          platform: payloadBase.platform || 'instagram'
        };

        const createRes = await fetch(`${API_BASE_URL}/api/scheduling`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...initialPayload, status: 'Scheduled' })
        });
        
        const dbPost = await createRes.json();
        if (!createRes.ok) throw new Error(dbPost.error || "Failed to create placeholder");
        
        dbId = dbPost._id || dbPost.id;
        
        setPosts(prev => prev.map(p => p._id === tempId ? { ...p, _id: dbId, id: dbId, isUploading: true } : p));

        let mediaUrls = [];
        if (currentFiles.length > 0) {
          const uploadPromises = currentFiles.map(async (originalFile) => {
            const file = await compressImage(originalFile);
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            
            const signRes = await fetch(`${API_BASE_URL}/api/storage/sign`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileName, contentType: file.type })
            });
            if (!signRes.ok) throw new Error("Failed to secure upload channel.");
            const { uploadUrl, publicUrl } = await signRes.json();

            const uploadRes = await fetch(uploadUrl, {
              method: 'PUT',
              body: file,
              headers: { 'Content-Type': file.type }
            });
            if (!uploadRes.ok) throw new Error(`Network failed during file upload.`);
            return publicUrl;
          });
          mediaUrls = await Promise.all(uploadPromises);
        }

        const finalMediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : payloadBase.mediaUrl;
        const updateRes = await fetch(`${API_BASE_URL}/api/scheduling/${dbId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaUrl: finalMediaUrl, carouselItems: mediaUrls, status: 'Scheduled' })
        });

        const updatedData = await updateRes.json();
        if (updateRes.ok) {
          setPosts(prev => prev.map(p => p._id === dbId ? updatedData : p));
          setCreatedPost(updatedData);
          setShowSuccess(true);
          notify("Post scheduled successfully!", "success");
        } else {
          throw new Error(updatedData.error || "Failed to finalize post");
        }
      } catch (err) {
        console.error("Background Upload Error:", err);
        const targetId = dbId || tempId;
        setPosts(prev => prev.map(p => p._id === targetId ? { ...p, status: 'Failed', lastError: err.message || "Network error during background upload", isUploading: false } : p));
        
        if (dbId) {
           fetch(`${API_BASE_URL}/api/scheduling/${dbId}`, {
             method: 'PUT',
             headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ status: 'Failed' })
           }).catch(() => {});
        }
        
        notify(err.message || "Network error during upload", "error");
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const [previewMode, setPreviewMode] = useState('post');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentPreviewIndex] = useState(0);
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
      setPosts(prev => prev.map(p => p._id === id ? { ...p, automationStatus: newStatus } : p));

      const res = await fetch(`${API_BASE_URL}/api/scheduling/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ automationStatus: newStatus })
      });
      if (!res.ok) {
        fetchPosts();
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

  const connectedPlatforms = (() => {
    if (!settings) return [];
    const platforms = [];
    if (settings.isAccountConnected || (!!settings.instagramAccessToken && !!settings.businessAccountId)) {
      platforms.push({ id: 'instagram', label: 'Instagram', icon: <Instagram size={14} />, color: '#e1306c' });
    }
    if (settings.isFacebookConnected || (!!settings.facebookAccessToken && !!settings.facebookPageId)) {
      platforms.push({ id: 'facebook', label: 'Facebook', icon: <Facebook size={14} />, color: '#1877f2' });
    }
    let parsedSettings = {};
    if (settings.connectedPageName) {
      try { parsedSettings = JSON.parse(settings.connectedPageName); } catch(e) {}
    }
    if (parsedSettings.isThreadsConnected || settings.isThreadsConnected) {
      platforms.push({ id: 'threads', label: 'Threads', icon: <ThreadsIcon size={14} />, color: '#000000' });
    }
    if (parsedSettings.isYouTubeConnected || settings.isYouTubeConnected) {
      platforms.push({ id: 'youtube', label: 'YouTube', icon: <Film size={14} />, color: '#ff0000' });
    }
    if (parsedSettings.isLinkedInConnected || settings.isLinkedInConnected) {
      platforms.push({ id: 'linkedin', label: 'LinkedIn', icon: <Globe size={14} />, color: '#0a66c2' });
    }
    if (parsedSettings.isTwitterConnected || settings.isTwitterConnected) {
      platforms.push({ id: 'twitter', label: 'Twitter/X', icon: <X size={14} />, color: '#000000' });
    }
    return platforms;
  })();
  
  const visiblePosts = posts.filter(post => {
    // Check connected status
    if (post.platform === 'facebook') {
      if (!connectedPlatforms.some(p => p.id === 'facebook')) return false;
    } else if (post.platform === 'instagram' || !post.platform) {
      if (!connectedPlatforms.some(p => p.id === 'instagram')) return false;
    } else {
      if (!connectedPlatforms.some(p => p.id === post.platform)) return false;
    }
    
    // Apply Platform Filter
    if (platformFilter !== 'All platforms') {
      const pLabel = platformFilter.toLowerCase();
      if (pLabel === 'instagram' && post.platform !== 'instagram' && post.platform) return false;
      if (pLabel === 'facebook' && post.platform !== 'facebook') return false;
      if (pLabel === 'threads' && post.platform !== 'threads') return false;
      if (pLabel === 'youtube' && post.platform !== 'youtube') return false;
      if (pLabel === 'linkedin' && post.platform !== 'linkedin') return false;
      if (pLabel === 'twitter/x' && post.platform !== 'twitter') return false;
    }

    // Apply Post Status Filter
    if (postStatusFilter !== 'All posts') {
      const statusLower = post.status ? post.status.toLowerCase() : 'scheduled';
      const filterLower = postStatusFilter.toLowerCase();
      if (filterLower === 'scheduled' && statusLower !== 'scheduled') return false;
      if (filterLower === 'published' && statusLower !== 'posted') return false;
      if (filterLower === 'failed' && statusLower !== 'failed') return false;
      if (filterLower === 'draft' && statusLower !== 'draft') return false;
    }

    return true;
  });

  if (showCreate) {
    return (
      <div style={{
        padding: '0', margin: '0', fontFamily: 'Inter, system-ui, sans-serif', height: '100vh',
        display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto'
      }}>
        <div style={{
          background: '#f8fafc', width: '100%', maxWidth: '1000px', margin: '0 auto',
          display: 'flex', flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ padding: '24px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', margin: '0 0 4px 0' }}>Create Post</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>create & publish content</p>
            </div>
            <button
              onClick={() => setShowCreate(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            
            {/* Left Column - Content & Media */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>content</label>
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={newPost.caption || ''}
                    onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                    placeholder="what's on your mind..."
                    style={{
                      width: '100%', height: '160px', padding: '16px', borderRadius: '12px',
                      border: 'none', background: '#e2e8f0', outline: 'none',
                      fontSize: '0.95rem', resize: 'none', color: '#334155'
                    }}
                  />
                  <div style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                    {(newPost.caption || '').length} chars
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '8px' }}>
                <div
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: '100%', padding: '24px', border: '1.5px dashed #94a3b8', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    cursor: 'pointer', background: '#e2e8f0', color: '#475569', fontWeight: '600', fontSize: '0.95rem'
                  }}
                >
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} multiple accept="image/*,video/*" onChange={handleFileChange} />
                  <Plus size={18} /> Add media
                </div>
                
                {/* Previews */}
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                    {previews.map((src, idx) => (
                      <div key={idx} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #e2e8f0' }}>
                        {selectedFiles[idx]?.type?.startsWith('video') ? (
                          <video src={src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Platforms */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>platforms</label>
                {connectedPlatforms.length === 0 ? (
                  <div style={{
                    width: '100%', padding: '32px', border: 'none', borderRadius: '12px',
                    background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <Plus size={14} />
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#334155' }}>no connected accounts</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>select a profile and connect accounts first</div>
                  </div>
                ) : (
                  <div style={{
                    width: '100%', padding: '16px', border: 'none', borderRadius: '12px',
                    background: '#e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '12px'
                  }}>
                    {connectedPlatforms.map(plat => (
                      <div 
                        key={plat.id}
                        onClick={() => setNewPost(prev => ({ ...prev, platform: plat.id }))}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                          border: newPost.platform === plat.id ? `2px solid ${plat.color}` : '1px solid transparent',
                          borderRadius: '8px', background: newPost.platform === plat.id ? 'white' : 'transparent',
                          cursor: 'pointer', opacity: newPost.platform === plat.id ? 1 : 0.6
                        }}
                      >
                        <span style={{ color: plat.color }}>{plat.icon}</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>{plat.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Publishing Options */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>publishing</label>
                <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '12px', padding: '4px', gap: '4px' }}>
                  {['Schedule', 'Now', 'Queue', 'Draft'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setScheduleMode(mode)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: '8px', border: 'none',
                        background: scheduleMode === mode ? 'white' : 'transparent',
                        color: scheduleMode === mode ? '#334155' : '#64748b',
                        fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer',
                        boxShadow: scheduleMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Timezone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>date & time</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="datetime-local"
                      value={newPost.scheduledFor || ''}
                      onChange={e => setNewPost({ ...newPost, scheduledFor: e.target.value })}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '8px',
                        border: 'none', outline: 'none', fontSize: '0.9rem',
                        color: '#334155', background: 'white'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>timezone</label>
                  <select
                    value={selectedTimezone}
                    onChange={e => handleTimezoneChange(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: 'none', outline: 'none', fontSize: '0.9rem',
                      color: '#334155', background: 'white'
                    }}
                  >
                    {timezoneOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
            <button
              onClick={() => setShowCreate(false)}
              style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' }}
            >
              cancel
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={submitting}
              style={{
                background: '#94a3b8', color: 'white', border: 'none', padding: '12px 28px',
                borderRadius: '8px', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              {submitting ? 'scheduling...' : 'schedule post'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0', maxWidth: 'none', margin: '0', fontFamily: 'Inter, system-ui, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }} onClick={() => {
      setShowPostStatusDropdown(false);
      setShowPlatformDropdown(false);
      setShowDateDropdown(false);
    }}>
      
      {/* Filters Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', padding: '16px 24px 0 24px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* All Posts Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPostStatusDropdown(!showPostStatusDropdown); setShowPlatformDropdown(false); setShowDateDropdown(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: postStatusFilter !== 'All posts' ? '#f8fafc' : 'white', color: '#475569', border: '1px solid #cbd5e1',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              {postStatusFilter} <ChevronDown size={14} />
            </button>
            {showPostStatusDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '160px',
                padding: '4px 0'
              }}>
                {['All posts', 'Draft', 'Scheduled', 'Published', 'Failed'].map(status => (
                  <div 
                    key={status}
                    onClick={() => { setPostStatusFilter(status); setShowPostStatusDropdown(false); }}
                    style={{
                      padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: postStatusFilter === status ? '#f1f5f9' : 'white',
                      color: '#334155'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = postStatusFilter === status ? '#f1f5f9' : 'white'}
                  >
                    {status}
                    {postStatusFilter === status && <Check size={14} color="#0f172a" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Platforms Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPlatformDropdown(!showPlatformDropdown); setShowPostStatusDropdown(false); setShowDateDropdown(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: platformFilter !== 'All platforms' ? '#f8fafc' : 'white', color: '#475569', border: '1px solid #cbd5e1',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              {platformFilter} <ChevronDown size={14} />
            </button>
            {showPlatformDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '160px',
                padding: '4px 0', maxHeight: '300px', overflowY: 'auto'
              }}>
                <div 
                  onClick={() => { setPlatformFilter('All platforms'); setShowPlatformDropdown(false); }}
                  style={{
                    padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: platformFilter === 'All platforms' ? '#f1f5f9' : 'white',
                    color: '#334155'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={(e) => e.currentTarget.style.background = platformFilter === 'All platforms' ? '#f1f5f9' : 'white'}
                >
                  All platforms
                  {platformFilter === 'All platforms' && <Check size={14} color="#0f172a" />}
                </div>
                {connectedPlatforms.map(plat => (
                  <div 
                    key={plat.id}
                    onClick={() => { setPlatformFilter(plat.label); setShowPlatformDropdown(false); }}
                    style={{
                      padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: platformFilter === plat.label ? '#f1f5f9' : 'white',
                      color: '#334155'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = platformFilter === plat.label ? '#f1f5f9' : 'white'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: plat.color, display: 'flex', alignItems: 'center' }}>{plat.icon}</span>
                      {plat.label}
                    </div>
                    {platformFilter === plat.label && <Check size={14} color="#0f172a" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Dates Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDateDropdown(!showDateDropdown); setShowPostStatusDropdown(false); setShowPlatformDropdown(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: dateFilter !== 'All dates' ? '#f8fafc' : 'white', color: '#475569', border: '1px solid #cbd5e1',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              <Calendar size={14} style={{ marginRight: '2px' }} />
              {dateFilter} <ChevronDown size={14} />
            </button>
            {showDateDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '160px',
                padding: '4px 0'
              }}>
                {['All dates', 'Today', 'Tomorrow', 'This week', 'This month'].map(range => (
                  <div 
                    key={range}
                    onClick={() => { setDateFilter(range); setShowDateDropdown(false); notify("Date filtering is simulated", "info"); }}
                    style={{
                      padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: dateFilter === range ? '#f1f5f9' : 'white',
                      color: '#334155'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = dateFilter === range ? '#f1f5f9' : 'white'}
                  >
                    {range}
                    {dateFilter === range && <Check size={14} color="#0f172a" />}
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Scheduled filter button */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'white', color: '#475569', border: '1px solid #cbd5e1',
            padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
            fontWeight: '500', cursor: 'pointer'
          }}>
            <Clock size={14} style={{ marginRight: '4px' }} />
            Scheduled (new) <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Empty State or Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px 24px' }}>
      {visiblePosts.length === 0 ? (
        <div style={{ 
          background: 'white', 
          border: '1px solid #e2e8f0', 
          borderRadius: '12px', 
          height: '100%',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', background: '#f1f5f9', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' 
          }}>
            <Pencil size={32} color="#64748b" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: '800', color: '#1e293b' }}>No posts yet</h2>
          <p style={{ margin: '0 0 32px 0', color: '#64748b', fontSize: '1rem' }}>Create your first social media post</p>
          
          <button onClick={() => setShowCreate(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#ea4335', color: 'white', border: 'none',
            padding: '14px 48px', borderRadius: '8px', fontWeight: '600',
            fontSize: '1rem', cursor: 'pointer', transition: 'background 0.2s',
            width: '300px', justifyContent: 'center'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#d33828'} onMouseOut={(e) => e.currentTarget.style.background = '#ea4335'}>
            <Plus size={20} /> Create post
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
          {visiblePosts.map(post => {
            let mediaData = { type: post.type || 'image', mediaUrl: post.mediaUrl };
            try {
              if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
                mediaData = JSON.parse(post.mediaUrl);
              }
            } catch (e) { }

            const rawMediaSource = mediaData.localMediaUrl || (mediaData.carouselItems && mediaData.carouselItems.length > 0 ? mediaData.carouselItems[0] : null) || mediaData.mediaUrl;

            const finalMediaUrl = rawMediaSource && rawMediaSource.startsWith('http')
              ? rawMediaSource
              : (rawMediaSource ? `${API_BASE_URL}${rawMediaSource}` : '/placeholder-ig.png');

            return (
              <div
                key={post._id || post.id}
                style={{
                  background: 'white', borderRadius: '24px', padding: '16px',
                  border: '1.5px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px'
                }}
              >
                {/* Media Preview Header */}
                <div style={{ width: '100%', height: '180px', borderRadius: '16px', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
                  {mediaData.type === 'reel' || (finalMediaUrl && finalMediaUrl.match(/\.(mp4|mov|webm)$/i)) ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <video src={finalMediaUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      background: post.status === 'Posted' ? '#10b981' : (post.status === 'Failed' ? '#ef4444' : ((post.status === 'Processing' || (post.status === 'Scheduled' && mediaData.igContainerId)) ? '#3b82f6' : '#7c3aed')),
                      color: 'white', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.65rem', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {(post.status === 'Retrying' || post.status === 'Processing' || (post.status === 'Scheduled' && mediaData.igContainerId)) ? (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'white' }} />
                      )}
                      <span>{post.status === 'Retrying' ? `Retrying` : ((post.status === 'Scheduled' && mediaData.igContainerId) ? 'Processing' : (post.status || 'SCHEDULED'))}</span>
                    </div>

                    {/* Platform Badge */}
                    <div style={{
                      fontSize: '0.65rem', fontWeight: '800', 
                      color: 'white',
                      background: (post.platform === 'facebook') ? '#1877f2' : '#e1306c',
                      padding: '4px 8px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {post.platform === 'facebook' ? <Facebook size={10} fill="white" /> : <Instagram size={10} />}
                      <span>{post.platform === 'facebook' ? 'FACEBOOK' : 'INSTAGRAM'}</span>
                    </div>

                    {/* Post Type Badge */}
                    <div style={{
                      fontSize: '0.65rem', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase',
                      background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                    }}>
                      {mediaData.type || 'IMAGE'}
                    </div>
                  </div>

                  {/* Automation Toggle Overlay on Bottom-Right */}
                  {(post.autoResponse || post.triggerKeyword) && (
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStatus = post.automationStatus === 'Paused' ? 'Active' : 'Paused';
                          toggleAutomationStatus(post._id || post.id, newStatus);
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
                      let loadedButtons = [];
                      try {
                        if (typeof mediaData.buttons === 'string') {
                          loadedButtons = JSON.parse(mediaData.buttons);
                        } else if (Array.isArray(mediaData.buttons)) {
                          loadedButtons = mediaData.buttons;
                        } else if (post.buttons) {
                          loadedButtons = typeof post.buttons === 'string' ? JSON.parse(post.buttons) : post.buttons;
                        }
                      } catch (e) {
                        console.error("Error parsing buttons:", e);
                      }

                      if (loadedButtons.length === 1 && loadedButtons[0].text === 'click the button' && loadedButtons[0].url === '') {
                        loadedButtons = [];
                      }

                      setCreatedPost({
                        ...post,
                        ...mediaData,
                        buttons: loadedButtons,
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
                      setDeleteConfirmId(post._id || post.id);
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
      <div style={{ flex: 1 }}></div>
    </div>

        
      {/* --- SUCCESS MODAL --- */}
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
                style={{ width: '100%', padding: '14px', borderRadius: '14px', background: '#ea4335', color: 'white', border: 'none', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 67, 53, 0.2)' }}
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

      {/* --- ADVANCED AUTOMATION EDITOR DRAWER/MODAL --- */}
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
                      Automation {createdPost.automationStatus === 'Active' ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowAdvanced(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Visual Workflow Map */}
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

                  <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>→</div>

                  <div style={{ 
                    flex: 1.5, 
                    minWidth: '100px',
                    background: 'white', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Comment Trigger</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#10b981' }}>
                      {createdPost.anyKeyword ? 'Any Comment' : `Word: "${createdPost.triggerKeyword || 'none'}"`}
                    </span>
                  </div>

                  <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>→</div>

                  <div style={{ 
                    flex: 1.5, 
                    minWidth: '100px',
                    background: 'white', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Public Reply</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#8b5cf6' }}>
                      "{createdPost.publicReply || 'Sent DM!'}"
                    </span>
                  </div>

                  <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>→</div>

                  <div style={{ 
                    flex: 2, 
                    minWidth: '120px',
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                    color: 'white',
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: '4px' }}>Private DM Response</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block', padding: '0 4px' }}>
                      {createdPost.autoResponse || 'Visit link below'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. Follow gate */}
              <div style={{ background: '#f0fdf4', padding: '24px', borderRadius: '24px', border: '1.5px solid #bbf7d0', boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>1</div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Require Follow (Recommended)</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>User must follow you to receive the DM response automatically.</p>
                    </div>
                  </div>
                  <div
                    onClick={() => setCreatedPost({ ...createdPost, requireFollow: !createdPost.requireFollow })}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.requireFollow ? '#10b981' : '#cbd5e1', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: createdPost.requireFollow ? '23px' : '3px', transition: '0.3s' }}></div>
                  </div>
                </div>

                <div style={{ border: '1.5px solid #bbf7d0', borderRadius: '20px', padding: '20px', background: 'white', marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981' }}>UNFOLLOWED MESSAGE</label>
                    <button
                      onClick={() => handleAIGenerate('unfollowedResponse', `Write a short, friendly Instagram DM message politely asking the user to follow our profile first so I can send them the links. Add emojis.`)}
                      style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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
                    onClick={() => setCreatedPost({ ...createdPost, anyKeyword: !createdPost.anyKeyword, triggerKeyword: !createdPost.anyKeyword ? '*' : '' })}
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
                              const kws = (createdPost.triggerKeyword || '').split(',').map(s => s.trim()).filter(k => k && k !== '*');
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
                            const kws = (createdPost.triggerKeyword || '').split(',').map(s => s.trim()).filter(k => k && k !== '*');
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
              </div>

              {/* 4. Opening Message */}
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
                        style={{ background: 'none', border: 'none', color: '#0369a1', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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

              {/* Public Comment Reply */}
              <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Public Comment Reply</h4>
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

      {/* --- Delete Confirmation Modal --- */}
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
