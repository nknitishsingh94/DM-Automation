import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Plus, Calendar, Clock, Video, Image as ImageIcon, Send, X, Check, ChevronLeft, ChevronRight,
  ChevronDown, Trash2, Globe, AlertCircle, Info, Sparkles, Zap, Heart, MessageCircle, Home,
  Instagram, Facebook, Film, Save, Layers, UploadCloud, Loader2, Link as LinkIcon, Pencil, MapPin
} from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useNotification } from '../App';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import EmojiPicker from 'emoji-picker-react';

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

function PinterestIcon({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.951-7.252 4.182 0 7.437 2.981 7.437 6.933 0 4.156-2.62 7.508-6.262 7.508-1.22 0-2.368-.636-2.763-1.385l-.754 2.878c-.274 1.042-1.016 2.348-1.513 3.141 1.144.336 2.347.514 3.585.514 6.62 0 11.988-5.367 11.988-11.988 0-6.62-5.368-11.987-11.988-11.987z"/>
    </svg>
  );
}

export default function Scheduling() {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState(null);
  const [pinterestBoards, setPinterestBoards] = useState([]);

  const getSafeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('cdninstagram.com') || url.includes('scontent-') || url.includes('fbcdn.net')) {
      const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'https://dm-automation-w9a4.vercel.app' 
        : 'https://dm-automation-w9a4.vercel.app';
      return API_BASE_URL + '/api/storage/proxy-external?url=' + encodeURIComponent(url);
    }
    return url;
  };
  const [showNewPinterestBoardInput, setShowNewPinterestBoardInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPost, setCreatedPost] = useState(null);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState(false);
  const [isPostNow, setIsPostNow] = useState(false);


  const [postStatusFilter, setPostStatusFilter] = useState('All posts');
  const [showPostStatusDropdown, setShowPostStatusDropdown] = useState(false);
  const [platformFilter, setPlatformFilter] = useState('All platforms');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [dateFilter, setDateFilter] = useState('All dates');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [scheduleMode, setScheduleMode] = useState('Schedule');
  const [sortFilter, setSortFilter] = useState('Scheduled (new)');
  const [showSortDropdown, setShowSortDropdown] = useState(false);


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

  const [savedCaptions, setSavedCaptions] = useState([]);
  const [showCaptionsModal, setShowCaptionsModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const popularEmojis = ['🔥', '🚀', '❤️', '✨', '😍', '👇', '📸', '💬', '🌟', '🎯', '💡', '👑', '🤩', '✅', '💯', '👏'];

  const [threadPosts, setThreadPosts] = useState([]);
  const [threadCustomCaption, setThreadCustomCaption] = useState('');
  const [isThreadMode, setIsThreadMode] = useState(false);

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
    setNewPost(prev => ({ ...prev, caption: (prev.caption || '') + emoji }));
  };

  const addThreadPost = () => {
    setThreadPosts(prev => [...prev, { caption: '', previews: [], files: [] }]);
  };

  const removeThreadPost = (index) => {
    setThreadPosts(prev => prev.filter((_, i) => i !== index));
  };

  const updateThreadPost = (index, field, value) => {
    setThreadPosts(prev => prev.map((post, i) => i === index ? { ...post, [field]: value } : post));
  };

  const handleThreadFileChange = (index, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const previews = files.map(file => URL.createObjectURL(file));
    setThreadPosts(prev => prev.map((post, i) => i === index ? { ...post, files: [...(post.files || []), ...files], previews: [...(post.previews || []), ...previews] } : post));
  };

  const removeThreadMedia = (index, mediaIndex) => {
    setThreadPosts(prev => prev.map((post, i) => {
      if (i === index) {
        if (post.previews && post.previews[mediaIndex]) {
          URL.revokeObjectURL(post.previews[mediaIndex]);
        }
        const newFiles = [...(post.files || [])];
        const newPreviews = [...(post.previews || [])];
        newFiles.splice(mediaIndex, 1);
        newPreviews.splice(mediaIndex, 1);
        return { ...post, files: newFiles, previews: newPreviews };
      }
      return post;
    }));
  };

  const [postType, setPostType] = useState('image');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [youtubeThumbnailPreview, setYoutubeThumbnailPreview] = useState(null);
  const [youtubeThumbnailFile, setYoutubeThumbnailFile] = useState(null);
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setYoutubeThumbnailFile(file);
      setYoutubeThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const [isGeneratingThumb, setIsGeneratingThumb] = useState(false);

  const generateAIThumbnail = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const promptText = newPost.youtubeTitle || newPost.caption;
    if (!promptText) {
      alert("Please enter a YouTube Title or Caption first so the AI knows what to generate!");
      return;
    }
    
    setIsGeneratingThumb(true);
    try {
      const enhancedPrompt = `High quality YouTube thumbnail, cinematic, highly engaging, vibrant colors, no text, related to: ${promptText}`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=1280&height=720&nologo=true`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to generate thumbnail");
      
      const blob = await response.blob();
      const file = new File([blob], `thumbnail-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      setYoutubeThumbnailFile(file);
      setYoutubeThumbnailPreview(URL.createObjectURL(file));
      notify("AI Thumbnail generated successfully!", "success");
    } catch (error) {
      console.error(error);
      alert("Failed to generate AI thumbnail. Please try again.");
    } finally {
      setIsGeneratingThumb(false);
    }
  };

  const [newPost, setNewPost] = useState({
    platform: 'instagram',
    caption: '',
    customCaption: '',
    scheduledFor: '',
    mediaUrl: '',
    triggerKeyword: '',
    autoResponse: '',
    coverUrl: '',
    requireFollow: true,
    unfollowedResponse: "Hey! Please follow our account first to get the link! 😍",
    openingMessage: false,
    openingMessageText: "",
    openingMessageButton: "",
    buttons: [],
    automationStatus: 'Active',
    anyKeyword: false,
    publicReply: "Check your DMs! 🚀",
    youtubeFirstComment: '',
    youtubeVisibility: 'Public',
    youtubeTitle: '',
    youtubeTags: '',
    gmbCtaEnabled: false,
    gmbActionType: 'LEARN_MORE',
    gmbSearchUrl: '',
    gmbCustomCaption: '',
    gmbTopicType: 'STANDARD',
    gmbEventTitle: '',
    gmbEventStartDate: '',
    gmbEventEndDate: '',
    gmbOfferCouponCode: '',
    gmbOfferRedeemUrl: '',
    gmbOfferTerms: '',
    gmbProductName: '',
    gmbProductPrice: '',
    whatsappNumbers: '',
    threadPosts: [],
    linkedinTargets: [],
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

  const fetchPinterestBoards = async () => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const wsId = localStorage.getItem('active_workspace_id');
      const res = await axios.get(`${API_BASE_URL}/api/pinterest/boards`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-workspace-id': wsId || '' }
      });
      if (res.data && res.data.boards) {
        setPinterestBoards(res.data.boards);
      }
    } catch (e) {
      console.warn("Failed to fetch Pinterest boards:", e);
    }
  };

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
        
        let defaultTargets = [];
        if (data.linkedinPages && Array.isArray(data.linkedinPages) && data.linkedinPages.length > 0) {
          defaultTargets = [data.linkedinPages[0].urn];
        }

        if (isIgConnected) {
          setNewPost(prev => ({ ...prev, platform: 'instagram', linkedinTargets: defaultTargets }));
        } else if (isFbConnected) {
          setNewPost(prev => ({ ...prev, platform: 'facebook', linkedinTargets: defaultTargets }));
        } else {
          setNewPost(prev => ({ ...prev, platform: '', linkedinTargets: defaultTargets }));
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

    const isMetaPlatform = (newPost.platforms || (newPost.platform ? [newPost.platform] : [])).some(p => ['instagram', 'facebook', 'threads', 'twitter'].includes(p));
    const isYoutubeOnly = (newPost.platforms || (newPost.platform ? [newPost.platform] : [])).includes('youtube') && !isMetaPlatform;

    if (isYoutubeOnly) {
      if (files.some(f => f.size > 5 * 1024 * 1024 * 1024)) {
        notify("For YouTube, maximum file size is 5GB.", "error");
        return;
      }
    } else {
      if (files.some(f => f.size > 100 * 1024 * 1024)) {
        notify("For Instagram/Facebook/Threads, maximum file size is 100MB.", "error");
        return;
      }
    }

    if (isMetaPlatform) {
      if (postType === 'video') {
        if (files.some(f => !f.type.startsWith('video/')) || (selectedFiles.length + files.length > 1)) {
          notify("Please select a single video file.", "error");
          return;
        }
      } else if (postType === 'image') {
        if (files.some(f => !f.type.startsWith('image/')) || (selectedFiles.length + files.length > 1)) {
          notify("Please select a single image file.", "error");
          return;
        }
      } else if (postType === 'carousel') {
        if (files.some(f => !f.type.startsWith('image/'))) {
          notify("Carousel only supports images.", "error");
          return;
        }
      }
    } else {
      if (files.length > 1 && postType !== 'carousel') {
        setPostType('carousel');
      } else if (files.length === 1 && files[0].type.startsWith('video/') && postType !== 'story') {
        setPostType('video');
      } else if (files.length === 1 && files[0].type.startsWith('image/') && postType === 'reel') {
        setPostType('image');
      }
    }

    const selectedPlatforms = newPost.platforms || (newPost.platform ? [newPost.platform] : []);
    const isTwitterIncluded = selectedPlatforms.includes('twitter');
    let maxFiles = 10;
    if (isTwitterIncluded && postType === 'carousel') {
      maxFiles = 5;
      if ([...selectedFiles, ...files].length > 5) {
        notify("For X (Twitter), maximum 5 images are allowed in a Carousel.", "warning");
      }
    }

    const totalFiles = [...selectedFiles, ...files].slice(0, maxFiles);

    const newPreviews = [...previews];
    files.forEach(file => {
      if (newPreviews.length < maxFiles) {
        newPreviews.push(URL.createObjectURL(file));
      }
    });

    setSelectedFiles(totalFiles);
    setPreviews(newPreviews);
    
    if (e.target) {
      e.target.value = null;
    }
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

const platformList = newPost.platforms || (newPost.platform ? [newPost.platform] : []);
    
    if (platformList.includes('pinterest')) {
      if (!newPost.pinterestBoard || newPost.pinterestBoard.trim() === '') {
        notify("Please select or create a Pinterest Board!", "error");
        return;
      }
      if (previews.length === 0 && !newPost.mediaUrl && (!newPost.carouselItems || newPost.carouselItems.length === 0)) {
        notify("An image is required for Pinterest Pins!", "error");
        return;
      }
    }
    
    if (platformList.includes('google-business')) {
      if (newPost.gmbCtaEnabled && newPost.gmbActionType !== 'CALL' && !newPost.gmbSearchUrl) {
        notify("URL required when CTA is enabled for Google Business!", "error");
        return;
      }
      if (newPost.gmbTopicType === 'EVENT' || newPost.gmbTopicType === 'OFFER') {
        if (!newPost.gmbEventTitle) {
          notify("Event/Offer Title is required for Google Business!", "error");
          return;
        }
        if (!newPost.gmbEventStartDate) {
          notify("Start Date is required for Google Business Event/Offer!", "error");
          return;
        }
        if (!newPost.gmbEventEndDate) {
          notify("End Date is required for Google Business Event/Offer!", "error");
          return;
        }
      }
      if (newPost.gmbTopicType === 'PRODUCT') {
        if (!newPost.gmbProductName) {
          notify("Product Name is required for Google Business Product!", "error");
          return;
        }
        if (!newPost.gmbProductPrice) {
          notify("Product Price is required for Google Business Product!", "error");
          return;
        }
      }
    }

    const payloadBase = { ...newPost };
    const currentFiles = [...selectedFiles];
    const currentPreviews = [...previews];
    const currentType = postType;
    const currentThreadPostsWithFiles = [...threadPosts];
      const currentThreadPosts = threadPosts.map(p => ({
      caption: p.caption,
      mediaUrl: p.preview || ''
    }));
    
    setShowCreate(false);
    setNewPost({ 
      platform: 'instagram',
      caption: '', customCaption: '', threadPosts: [], scheduledFor: getCurrentTimeInTimezone('browser'), mediaUrl: '', pinterestTitle: '', pinterestLink: '', pinterestBoard: '', pinterestIsAIModified: false, pinterestIsAIGeneratedPerson: false, pinterestAllowComments: true, pinterestShowSimilarProducts: true, pinterestAltText: '',
      triggerKeyword: '', autoResponse: '', coverUrl: '',
      requireFollow: true, unfollowedResponse: "Hey! Please follow our account first to get the link! 😍",
      publicReply: "Check your DMs! 🚀",
      automationStatus: 'Active',
      gmbCtaEnabled: false,
      gmbActionType: 'LEARN_MORE',
      gmbSearchUrl: '',
      gmbCustomCaption: '',
      gmbTopicType: 'STANDARD',
      gmbEventTitle: '',
      gmbEventStartDate: '',
      gmbEventEndDate: '',
      gmbOfferCouponCode: '',
      gmbOfferRedeemUrl: '',
      gmbOfferTerms: '',
      gmbProductName: '',
      gmbProductPrice: '',
      whatsappNumbers: '',
      linkedinTargets: []
    });
    setSelectedFiles([]);
    setPreviews([]);
    setPostType('image');
    setYoutubeThumbnailFile(null);
    setYoutubeThumbnailPreview(null);
    setThreadPosts([]);
    setThreadCustomCaption('');

    const selectedPlatformsList = newPost.platforms && newPost.platforms.length > 0 ? newPost.platforms : (newPost.platform ? [newPost.platform] : ['instagram']);
    const activePlatforms = [];
    selectedPlatformsList.forEach(plat => {
      if (plat === 'linkedin') {
        const selectedTargets = newPost.linkedinTargets || [];
        if (selectedTargets.length > 0) {
          selectedTargets.forEach(targetUrn => {
            activePlatforms.push({
              id: 'linkedin',
              targetUrn: targetUrn
            });
          });
        } else {
          activePlatforms.push({ id: 'linkedin', targetUrn: null });
        }
      } else {
        activePlatforms.push({ id: plat, targetUrn: null });
      }
});
    
    const tempPosts = activePlatforms.map((platObj, index) => {
      const targetName = platObj.targetUrn ? (settings.linkedinPages?.find(p => p.urn === platObj.targetUrn)?.name || '') : '';
      const previewUrl = currentPreviews.length > 0 ? currentPreviews[0] : payloadBase.mediaUrl;
      return {
        _id: 'temp-' + platObj.id + '-' + (platObj.targetUrn ? platObj.targetUrn.replace(/:/g, '_') : index) + '-' + Date.now(),
        status: 'Uploading',
        caption: payloadBase.caption,
        platform: platObj.id,
        type: currentType,
        scheduledFor: isPostNow ? '' : convertLocalToUTC(payloadBase.scheduledFor, selectedTimezone),
        mediaUrl: platObj.id === 'linkedin' ? JSON.stringify({
          type: currentType,
          mediaUrl: previewUrl || '',
          linkedinTarget: platObj.targetUrn,
          linkedinTargetName: targetName
        }) : (previewUrl || ''),
        isUploading: true
      };
    });
    
    setPosts(prev => [...tempPosts, ...prev]);
    setSubmitting(true);
    
    if (currentFiles.length > 0 && (currentType === 'reel' || currentType === 'video')) {
        notify("Video upload started in background! You can continue using the app.", "info");
    } else {
        notify("Upload started...", "info");
    }

    (async () => {
      let createdDbIds = [];
      try {
        const initialPayloadBase = {
            pinterestTitle: newPost.pinterestTitle,
            pinterestLink: newPost.pinterestLink,
            pinterestBoard: newPost.pinterestBoard,
            pinterestIsAIModified: newPost.pinterestIsAIModified,
            pinterestIsAIGeneratedPerson: newPost.pinterestIsAIGeneratedPerson,
            pinterestAllowComments: newPost.pinterestAllowComments,
            pinterestShowSimilarProducts: newPost.pinterestShowSimilarProducts,
            pinterestAltText: newPost.pinterestAltText,
          caption: payloadBase.caption,
          threadCustomCaption: threadCustomCaption,
          threadPosts: currentThreadPosts,
          scheduledFor: tempPosts[0].scheduledFor,
          status: 'Uploading',
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
          gmbCtaEnabled: payloadBase.gmbCtaEnabled,
          gmbActionType: payloadBase.gmbActionType,
          gmbSearchUrl: payloadBase.gmbSearchUrl,
          gmbCustomCaption: payloadBase.gmbCustomCaption,
          gmbTopicType: payloadBase.gmbTopicType || 'STANDARD',
          gmbEventTitle: payloadBase.gmbEventTitle || '',
          gmbEventStartDate: payloadBase.gmbEventStartDate || '',
          gmbEventEndDate: payloadBase.gmbEventEndDate || '',
          gmbOfferCouponCode: payloadBase.gmbOfferCouponCode || '',
          gmbOfferRedeemUrl: payloadBase.gmbOfferRedeemUrl || '',
          gmbOfferTerms: payloadBase.gmbOfferTerms || '',
          gmbProductName: payloadBase.gmbProductName || '',
          gmbProductPrice: payloadBase.gmbProductPrice || '',
          whatsappNumbers: payloadBase.whatsappNumbers || ''
        };

        for (let i = 0; i < activePlatforms.length; i++) {
          const platObj = activePlatforms[i];
          const tempId = tempPosts[i]._id;
          
          const createRes = await fetch(`${API_BASE_URL}/api/scheduling`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...initialPayloadBase,
              platform: platObj.id,
              mediaUrl: tempPosts[i].mediaUrl,
              status: 'Processing'  // 'Processing' is in DB constraint; worker has 2-min cooldown before picking it up, giving time for upload to finish
            })
          });
          
          const dbPost = await createRes.json();
          if (!createRes.ok) throw new Error(dbPost.error || `Failed to create placeholder for ${platObj.id}`);
          
          const dbId = dbPost._id || dbPost.id;
          createdDbIds.push({ dbId, tempId, plat: platObj.id });
          
          setPosts(prev => prev.map(p => p._id === tempId ? { ...p, _id: dbId, id: dbId, isUploading: true } : p));
        }

        let mediaUrls = [];
        const isMetaPlatform = activePlatforms.some(p => ['instagram', 'facebook', 'threads', 'twitter'].includes(p.id));
        const isYoutubeOnly = activePlatforms.some(p => p.id === 'youtube') && !isMetaPlatform;


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

        let thumbnailMediaUrl = null;
        if (youtubeThumbnailFile && activePlatforms.some(p => p.id === 'youtube')) {
          try {
            const thumbFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${youtubeThumbnailFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const thumbSignRes = await fetch(`${API_BASE_URL}/api/storage/sign`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileName: thumbFileName, contentType: youtubeThumbnailFile.type })
            });
            if (thumbSignRes.ok) {
              const { uploadUrl: thumbUploadUrl, publicUrl: thumbPublicUrl } = await thumbSignRes.json();
              const thumbUploadRes = await fetch(thumbUploadUrl, {
                method: 'PUT',
                body: youtubeThumbnailFile,
                headers: { 'Content-Type': youtubeThumbnailFile.type }
              });
              if (thumbUploadRes.ok) {
                thumbnailMediaUrl = thumbPublicUrl;
              }
            }
          } catch (thumbErr) {
            console.error("Thumbnail upload failed:", thumbErr);
          }
        }

          const finalThreadPosts = [...currentThreadPosts];
          if (currentThreadPosts && currentThreadPosts.length > 0) {
            const threadUploadPromises = currentThreadPosts.map(async (tPost, index) => {
              const originalThreadPost = currentThreadPostsWithFiles[index];
              if (originalThreadPost && originalThreadPost.files && originalThreadPost.files.length > 0) {
                const uploadedUrls = [];
                for (let i = 0; i < originalThreadPost.files.length; i++) {
                  const file = originalThreadPost.files[i];
                  const compressedFile = await compressImage(file);
                  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-thread-${index}-${i}-${compressedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                  
                  const signRes = await fetch(`${API_BASE_URL}/api/storage/sign`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileName, contentType: compressedFile.type })
                  });
                  if (!signRes.ok) throw new Error("Failed to secure upload channel for thread media.");
                  const { uploadUrl, publicUrl } = await signRes.json();
      
                  const uploadRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: compressedFile,
                    headers: { 'Content-Type': compressedFile.type }
                  });
                  if (!uploadRes.ok) throw new Error(`Network failed during thread file upload.`);
                  
                  uploadedUrls.push(publicUrl);
                }
                finalThreadPosts[index].mediaUrls = uploadedUrls;
              }
            });
            await Promise.all(threadUploadPromises);
          }

        const finalMediaUrl = mediaUrls.length > 0 ? mediaUrls[0] : payloadBase.mediaUrl;
        
        let finalPosts = [];
        for (const { dbId, plat, tempId } of createdDbIds) {
          let customMediaUrl = finalMediaUrl;
          let customVideoId = null;

          if (plat === 'youtube' && (currentType === 'video' || currentType === 'reel') && currentFiles.length > 0) {
            try {
               const ytFile = currentFiles[0];
               const ytUrlRes = await fetch(`${API_BASE_URL}/api/youtube/get-upload-url`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                 body: JSON.stringify({ 
                   fileSize: ytFile.size, 
                   contentType: ytFile.type, 
                   title: newPost.youtubeTitle || payloadBase.caption,
                   description: newPost.youtubeTags ? `${payloadBase.caption}\n\n${newPost.youtubeTags}` : payloadBase.caption
                 })
               });
               if (ytUrlRes.ok) {
                 const { uploadUrl } = await ytUrlRes.json();
                 const ytUploadRes = await fetch(uploadUrl, {
                   method: 'PUT',
                   headers: { 'Content-Type': ytFile.type },
                   body: ytFile
                 });
                 if (ytUploadRes.ok) {
                   const ytData = await ytUploadRes.json();
                   customVideoId = ytData.id;
                   console.log("Uploaded to YouTube directly! ID:", customVideoId);
                 }
               }
            } catch (ytErr) {
               console.error("Direct YouTube upload failed:", ytErr);
            }
          }

          let updateMediaUrl = customMediaUrl;
          if (plat === 'youtube' && thumbnailMediaUrl) {
            updateMediaUrl = JSON.stringify({
              type: currentType,
              mediaUrl: customMediaUrl,
              thumbnail: thumbnailMediaUrl,
              youtubeVideoId: customVideoId
            });
          } else {
            const tempPost = tempPosts.find(p => p._id === tempId);
            if (tempPost && tempPost.mediaUrl && tempPost.mediaUrl.startsWith('{')) {
              try {
                const parsed = JSON.parse(tempPost.mediaUrl);
                parsed.mediaUrl = customMediaUrl;
                updateMediaUrl = JSON.stringify(parsed);
              } catch (e) {}
            }
          }

          const updateRes = await fetch(`${API_BASE_URL}/api/scheduling/${dbId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ mediaUrl: updateMediaUrl, carouselItems: mediaUrls, status: 'Scheduled', youtubeVideoId: customVideoId, threadPosts: finalThreadPosts })
          });

          const updatedData = await updateRes.json();
          if (!updateRes.ok) throw new Error(updatedData.error || "Failed to finalize post");
          finalPosts.push(updatedData);
        }

        setPosts(prev => prev.map(p => {
          const finalPost = finalPosts.find(fp => (fp._id || fp.id) === (p._id || p.id));
          return finalPost ? finalPost : p;
        }));
        
        setCreatedPost(finalPosts[0]);
        setPreviews([]);
        notify("Posts scheduled successfully!", "success");
        
        fetch(`${API_BASE_URL}/api/cron/publish`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => {});

      } catch (err) {
        console.error("Background Upload Error:", err);
        
        const targetIds = createdDbIds.length > 0 ? createdDbIds.map(c => c.dbId) : tempPosts.map(t => t._id);
        
        setPosts(prev => prev.map(p => targetIds.includes(p._id || p.id) ? { ...p, status: 'Failed', lastError: err.message || "Network error during background upload", isUploading: false } : p));
        
        for (const { dbId } of createdDbIds) {
           fetch(`${API_BASE_URL}/api/scheduling/${dbId}`, {
             method: 'PUT',
             headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
             body: JSON.stringify({ status: 'Failed', lastError: err.message })
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
  const [showPinterestMoreOptions, setShowPinterestMoreOptions] = useState(false);
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

  const deletePost = async (id, deleteOnSocial = false) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/scheduling/${id}?deleteOnSocial=${deleteOnSocial}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p._id !== id));
        notify("Post deleted successfully!", "success");
        setDeleteConfirmId(null);
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

  const handleNewPostAIGenerate = async (field, prompt) => {
    try {
      const token = localStorage.getItem('insta_agent_token');
      const originalValue = newPost[field] || '';
      setNewPost(prev => ({ ...prev, [field]: "⏳ AI is thinking..." }));

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
        setNewPost(prev => ({ ...prev, [field]: data.response }));
        notify("AI content generated!", "success");
      } else {
        setNewPost(prev => ({ ...prev, [field]: originalValue }));
        notify("AI failed to generate", "error");
      }
    } catch (err) {
      notify("Network error", "error");
    }
  };

  const allPlatforms = (() => {
    const platforms = [
      { id: 'instagram', label: 'Instagram', icon: <Instagram size={14} />, color: '#e1306c', handle: '', connected: false },
      { id: 'facebook', label: 'Facebook', icon: <Facebook size={14} />, color: '#1877f2', handle: '', connected: false },
      { id: 'threads', label: 'Threads', icon: <ThreadsIcon size={14} />, color: 'var(--text-main)', handle: '', connected: false },
      { id: 'youtube', label: 'YouTube', icon: <Film size={14} />, color: '#ff0000', handle: '', connected: false },
      { id: 'linkedin', label: 'LinkedIn', icon: <Globe size={14} />, color: '#0a66c2', handle: '', connected: false },
      { id: 'twitter', label: 'Twitter/X', icon: <X size={14} />, color: 'var(--text-main)', handle: '', connected: false },
      { id: 'pinterest', label: 'Pinterest', icon: <PinterestIcon size={14} color="#E60023" />, color: '#E60023', handle: '', connected: false },
      { id: 'google-business', label: 'Google Business', icon: <MapPin size={14} />, color: '#4285f4', handle: '', connected: false },
      { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={14} />, color: '#25d366', handle: '', connected: false }
    ];

    if (!settings) return platforms;

    let parsedSettings = {};
    if (typeof settings.parsedSettings === 'string') {
      try { parsedSettings = JSON.parse(settings.parsedSettings); } catch(e) {}
    } else if (settings.parsedSettings) {
      parsedSettings = settings.parsedSettings;
    }

    platforms.forEach(p => {
      if (p.id === 'instagram' && (settings.isAccountConnected || (!!settings.instagramAccessToken && !!settings.businessAccountId))) {
        p.connected = true; p.handle = settings.connectedInstagramName || settings.instagramUsername || settings.connectedInstagramId || '';
      }
      if (p.id === 'facebook' && (settings.isFacebookConnected || (!!settings.facebookAccessToken && !!settings.facebookPageId))) {
        p.connected = true; p.handle = settings.connectedFacebookName || (settings.connectedPageName && !settings.connectedPageName.startsWith('{') ? settings.connectedPageName : '');
      }
      if (p.id === 'threads' && (parsedSettings.isThreadsConnected || settings.isThreadsConnected)) {
        p.connected = true; p.handle = parsedSettings.connectedThreadsName || settings.connectedThreadsName || '';
      }
      if (p.id === 'youtube' && (parsedSettings.isYouTubeConnected || settings.isYouTubeConnected || parsedSettings.isYoutubeConnected || settings.isYoutubeConnected)) {
        p.connected = true; p.handle = parsedSettings.connectedYouTubeName || settings.connectedYouTubeName || parsedSettings.youtubeChannelName || settings.youtubeChannelName || '';
      }
      if (p.id === 'linkedin' && (parsedSettings.isLinkedInConnected || settings.isLinkedInConnected)) {
        p.connected = true;
      }
      if (p.id === 'twitter' && (parsedSettings.isTwitterConnected || settings.isTwitterConnected)) {
        p.connected = true; p.handle = parsedSettings.connectedTwitterName || settings.connectedTwitterName || '';
      }
      if (p.id === 'pinterest' && (parsedSettings.isPinterestConnected || settings.isPinterestConnected)) {
        p.connected = true; p.handle = parsedSettings.connectedPinterestName || settings.connectedPinterestName || '';
      }
      if (p.id === 'google-business' && (parsedSettings.isGoogleBusinessConnected || settings.isGoogleBusinessConnected)) {
        p.connected = true; p.handle = settings.connectedGoogleBusinessName || parsedSettings.connectedGoogleBusinessName || '';
      }
      if (p.id === 'whatsapp' && (parsedSettings.isWhatsAppConnected || settings.isWhatsAppConnected)) {
        p.connected = true; p.handle = settings.whatsappDisplayName || parsedSettings.whatsappDisplayName || '';
      }
    });

    return platforms;
  })();

  const connectedPlatforms = allPlatforms.filter(p => p.connected);

  if (loading) return <LoadingSpinner />;

  const visiblePosts = posts.filter(post => {
    if (platformFilter !== 'All platforms') {
      const pLabel = platformFilter.toLowerCase();
      if (pLabel === 'instagram' && post.platform !== 'instagram' && post.platform) return false;
      if (pLabel === 'facebook' && post.platform !== 'facebook') return false;
      if (pLabel === 'threads' && post.platform !== 'threads') return false;
      if (pLabel === 'youtube' && post.platform !== 'youtube') return false;
      if (pLabel === 'linkedin' && post.platform !== 'linkedin') return false;
      if (pLabel === 'twitter/x' && post.platform !== 'twitter') return false;
      if (pLabel === 'pinterest' && post.platform !== 'pinterest') return false;
      if (pLabel === 'google business' && post.platform !== 'google-business') return false;
    }

    if (postStatusFilter !== 'All posts') {
      const statusLower = post.status ? post.status.toLowerCase() : 'scheduled';
      const filterLower = postStatusFilter.toLowerCase();
      if (filterLower === 'processing' && statusLower !== 'processing') return false;
      if (filterLower === 'scheduled' && statusLower !== 'scheduled') return false;
      if (filterLower === 'published' && statusLower !== 'posted' && statusLower !== 'published') return false;
      if (filterLower === 'failed' && statusLower !== 'failed') return false;
      if (filterLower === 'draft' && statusLower !== 'draft') return false;
    }

    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.scheduledFor || a.createdAt || Date.now()).getTime();
    const timeB = new Date(b.scheduledFor || b.createdAt || Date.now()).getTime();
    const createA = new Date(a.createdAt || a.scheduledFor || Date.now()).getTime();
    const createB = new Date(b.createdAt || b.scheduledFor || Date.now()).getTime();

    if (sortFilter === 'Scheduled (new)') return timeB - timeA;
    if (sortFilter === 'Scheduled (old)') return timeA - timeB;
    if (sortFilter === 'Recently created') return createB - createA;
    if (sortFilter === 'Oldest created') return createA - createB;
    return 0;
  });

  if (showCreate) {
    return (
      <div style={{
        padding: '16px 0 0 0', margin: '0', fontFamily: 'Inter, system-ui, sans-serif', height: '100%',
        display: 'flex', flexDirection: 'column', background: 'var(--sidebar-bg)', overflow: 'hidden'
      }}>
        <div style={{
          background: 'var(--sidebar-bg)', width: '100%', maxWidth: 'none', margin: '0',
          display: 'flex', flexDirection: 'column', height: '100%'
        }}>
          {/* Header */}
          <div style={{ padding: '24px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Create Post</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>create & publish content</p>
            </div>
            <button
              onClick={() => setShowCreate(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start', flex: 1, overflow: 'hidden' }}>
            
            {/* Left Column - Content & Media */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '12px', height: '100%' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>content</label>
                
                    {(newPost.platforms || (newPost.platform ? [newPost.platform] : [])).some(p => ['instagram', 'facebook', 'threads', 'twitter'].includes(p)) && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                        <div
                          onClick={() => {
                            setPostType('image');
                            if (selectedFiles.length > 1) {
                              setSelectedFiles([selectedFiles[0]]);
                              setPreviews([previews[0]]);
                              notify("Trimmed to a single image for Image post type.", "info");
                            }
                          }}
                          style={{
                            padding: '16px 12px', borderRadius: '12px',
                            background: postType === 'image' ? '#eef2ff' : 'var(--sidebar-bg)',
                            border: postType === 'image' ? '2px solid #6366f1' : '2px solid transparent',
                            color: postType === 'image' ? '#4f46e5' : 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s', textAlign: 'center',
                            boxShadow: postType === 'image' ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                          }}
                        >
                          <ImageIcon size={24} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: postType === 'image' ? '#312e81' : '#334155' }}>Image</div>
                          <div style={{ fontSize: '0.7rem', color: postType === 'image' ? '#4f46e5' : 'var(--text-muted)' }}>Single photo</div>
                        </div>

                        <div
                          onClick={() => {
                            setPostType('video');
                            if (selectedFiles.length > 1) {
                              setSelectedFiles([selectedFiles[0]]);
                              setPreviews([previews[0]]);
                              notify("Trimmed to a single video for Video post type.", "info");
                            }
                          }}
                          style={{
                            padding: '16px 12px', borderRadius: '12px',
                            background: postType === 'video' ? '#eef2ff' : 'var(--sidebar-bg)',
                            border: postType === 'video' ? '2px solid #6366f1' : '2px solid transparent',
                            color: postType === 'video' ? '#4f46e5' : 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s', textAlign: 'center',
                            boxShadow: postType === 'video' ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                          }}
                        >
                          <Film size={24} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: postType === 'video' ? '#312e81' : '#334155' }}>Video</div>
                          <div style={{ fontSize: '0.7rem', color: postType === 'video' ? '#4f46e5' : 'var(--text-muted)' }}>Reel or Video</div>
                        </div>

                        <div
                          onClick={() => setPostType('carousel')}
                          style={{
                            padding: '16px 12px', borderRadius: '12px',
                            background: postType === 'carousel' ? '#eef2ff' : 'var(--sidebar-bg)',
                            border: postType === 'carousel' ? '2px solid #6366f1' : '2px solid transparent',
                            color: postType === 'carousel' ? '#4f46e5' : 'var(--text-muted)',
                            cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s', textAlign: 'center',
                            boxShadow: postType === 'carousel' ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
                          }}
                        >
                          <Layers size={24} />
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: postType === 'carousel' ? '#312e81' : '#334155' }}>Carousel</div>
                          <div style={{ fontSize: '0.7rem', color: postType === 'carousel' ? '#4f46e5' : 'var(--text-muted)' }}>Multiple photos</div>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedCap = savedCaptions.find(c => c._id === e.target.value);
                            if (selectedCap) setNewPost({ ...newPost, caption: selectedCap.content });
                            e.target.value = "";
                          }
                        }}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', maxWidth: '60%'
                        }}
                      >
                        <option value="">Use saved caption...</option>
                        {savedCaptions && savedCaptions.map(cap => (
                          <option key={cap._id} value={cap._id}>{cap.title || cap.content.substring(0, 20)}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveCaption}
                        style={{
                          padding: '8px 16px', borderRadius: '8px', background: '#e0e7ff',
                          color: '#4338ca', border: 'none', fontWeight: '600', fontSize: '0.85rem',
                          cursor: 'pointer'
                        }}
                      >
                        Save Caption
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <textarea
                        ref={textareaRef}
                        value={newPost.caption}
                        onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                        placeholder="What do you want to share?"
                        style={{
                          width: '100%', minHeight: '120px', padding: '12px', paddingBottom: '40px',
                          borderRadius: '10px', border: '1px solid var(--border-subtle)',
                          background: 'var(--bg-card)', outline: 'none', fontSize: '0.9rem',
                          resize: 'vertical', color: 'var(--text-main)', lineHeight: '1.5'
                        }}
                      />
                      <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          style={{
                            background: 'transparent', border: 'none', fontSize: '1.2rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Add Emoji"
                        > 😊
                        </button>
                        <button
                          onClick={() => handleNewPostAIGenerate('caption', 'Write an engaging and highly converting caption for my social media post. Make it viral, use emojis, and space it out nicely.')}
                          style={{
                            background: 'none', border: 'none', color: '#8b5cf6', fontWeight: '800', fontSize: '0.8rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background='rgba(139, 92, 246, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.background='none'}
                          title="Auto-generate Caption with AI"
                        >
                          <Sparkles size={14} /> AI Auto-generate
                        </button>
                        <button
                          onClick={() => applyFormatting('mention')}
                          style={{
                            background: 'var(--bg-dark)', border: 'none', fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '4px 10px', borderRadius: '6px', fontWeight: '600', color: 'var(--text-muted)',
                            transition: 'all 0.2s'
                          }}
                          title="Mention (@)"
                          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-dark)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          @ Mention
                        </button>
                        <button
                          onClick={() => applyFormatting('hashtag')}
                          style={{
                            background: 'var(--bg-dark)', border: 'none', fontSize: '0.85rem',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '4px 10px', borderRadius: '6px', fontWeight: '600', color: 'var(--text-muted)',
                            transition: 'all 0.2s'
                          }}
                          title="Hashtag (#)"
                          onMouseOver={(e) => { e.currentTarget.style.background = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-main)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-dark)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          # Hashtag
                        </button>
                      </div>
                    </div>
                    {showEmojiPicker && (
                      <div style={{
                        marginTop: '12px',
                        borderRadius: '8px', overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        <EmojiPicker 
                           onEmojiClick={(emojiObj) => {
                             insertEmoji(emojiObj.emoji);
                             setShowEmojiPicker(false);
                           }} 
                           width={'100%'}
                           height={350}
                           previewConfig={{ showPreview: false }}
                           searchDisabled={false}
                           skinTonesDisabled={true}
                        />
                      </div>
                    )}
              </div>

              <div style={{ marginTop: '24px' }}>
                {!(selectedFiles.length >= 1 && postType !== 'carousel') && (
                  <div
                    onClick={() => fileInputRef.current.click()}
                    style={{
                      width: '100%', padding: '24px', border: '1.5px dashed #94a3b8', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      cursor: 'pointer', background: 'var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.95rem'
                    }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      style={{ display: 'none' }} 
                      multiple={(() => {
                        const isMeta = (newPost.platforms || (newPost.platform ? [newPost.platform] : [])).some(p => ['instagram', 'facebook', 'threads', 'twitter'].includes(p));
                        if (isMeta) return postType === 'carousel';
                        return true;
                      })()}
                      accept={(() => {
                        const isMeta = (newPost.platforms || (newPost.platform ? [newPost.platform] : [])).some(p => ['instagram', 'facebook', 'threads', 'twitter'].includes(p));
                        if (isMeta) {
                          if (postType === 'video') return 'video/*';
                          return 'image/*';
                        }
                        return 'video/*,image/*';
                      })()}
                      onChange={handleFileChange} 
                    />
                    <Plus size={18} /> Add media
                  </div>
                )}
                
                {/* Previews */}
                {(previews.length > 0 || (newPost.platforms && newPost.platforms.includes('threads'))) && (
                  <div style={{ marginTop: '16px', maxHeight: '200px', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                    {previews.length > 0 ? (
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '8px' }}>
                        {previews.map((src, idx) => (
                          <div key={idx} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-subtle)' }}>
                            {selectedFiles[idx]?.type?.startsWith('video') ? (
                              <video src={src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <img referrerPolicy="no-referrer" src={getSafeImageUrl(src)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/zenxchat-logo.png'; e.currentTarget.onerror = null; }} />
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
                    ) : (
                      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>No media added yet</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Click "Add media" to upload photos or videos</div>
                      </div>
                    )}
                  </div>
                )}

                {/* X (Twitter) Threads Specific Block */}
                {(newPost.platforms || (newPost.platform ? [newPost.platform] : [])).some(p => ['twitter'].includes(p)) && (
                  <div style={{ marginTop: '24px', background: 'var(--sidebar-bg)', borderRadius: '12px', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ background: '#000', color: '#fff', borderRadius: '4px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>@</div>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {(() => {
                            return 'X (Twitter) Threads';
                          })()}
                        </span>
                      </div>
                      <div 
                        onClick={() => setIsThreadMode(!isThreadMode)}
                        style={{ 
                          width: '36px', height: '20px', 
                          background: isThreadMode ? '#000' : 'var(--border-subtle)', 
                          borderRadius: '10px', position: 'relative', cursor: 'pointer',
                          transition: 'background 0.3s ease'
                        }}
                      >
                        <div style={{ 
                          width: '16px', height: '16px', background: 'var(--bg-card)', borderRadius: '50%', position: 'absolute', top: '2px', 
                          left: isThreadMode ? '18px' : '2px', transition: 'left 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                    {isThreadMode && (
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', fontWeight: '500' }}>
                        Main content + media become post 1. Add more below.
                      </div>
                      
                      {threadPosts.map((post, index) => (
                        <div key={index} style={{
                          background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-subtle)',
                          overflow: 'hidden', marginBottom: '16px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Post {index + 2}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button onClick={() => removeThreadPost(index)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' }}>remove</button>
                            </div>
                          </div>
                          <div style={{ padding: '12px' }}>
                            
                            {/* Thread Post Media */}
                            <div style={{ marginTop: '10px' }}>
                              {post.previews && post.previews.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                  {post.previews.map((prevImg, mIdx) => (
                                    <div key={mIdx} style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid var(--border-subtle)' }}>
                                      {post.files && post.files[mIdx]?.type?.startsWith('video') ? (
                                        <video src={prevImg} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                      ) : (
                                        <img referrerPolicy="no-referrer" src={getSafeImageUrl(prevImg)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/zenxchat-logo.png'; e.currentTarget.onerror = null; }} />
                                      )}
                                      <button
                                        onClick={() => removeThreadMedia(index, mIdx)}
                                        style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => {
                                      const input = document.createElement('input');
                                      input.type = 'file';
                                      input.accept = 'image/*,video/*';
                                      input.multiple = true;
                                      input.onchange = (e) => handleThreadFileChange(index, e);
                                      input.click();
                                    }}
                                    style={{ width: '80px', height: '80px', background: 'transparent', border: '1px dashed #cbd5e1', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: '500' }}
                                  >
                                    <Plus size={14} /> Add
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*,video/*';
                                    input.multiple = true;
                                    input.onchange = (e) => handleThreadFileChange(index, e);
                                    input.click();
                                  }}
                                  style={{ background: 'transparent', border: '1px dashed #cbd5e1', padding: '8px', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '500' }}
                                >
                                  <ImageIcon size={14} /> Add Media
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      <button onClick={addThreadPost} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '0', marginBottom: '24px' }}>
                        <Plus size={16} /> add post {threadPosts.length + 2}
                      </button>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>custom caption</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>{(threadCustomCaption || '').length}/500</span>
                        </div>
                        <textarea
                          value={threadCustomCaption}
                          onChange={(e) => { if (e.target.value.length <= 500) setThreadCustomCaption(e.target.value); }}
                          placeholder="Leave blank to use main content..."
                          style={{ width: '100%', minHeight: '60px', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.9rem', resize: 'vertical', color: 'var(--text-main)' }}
                        />
                      </div>
                    </div>
                    )}
                  </div>
                )}

                {/* YouTube Specific Settings */}
                {(newPost.platforms || (newPost.platform ? [newPost.platform] : [])).includes('youtube') && (
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ color: '#ef4444' }}><Film size={18} /></span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>YouTube Settings</span>
                    </div>

                    {/* YouTube Thumbnail Upload */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', margin: 0 }}>custom thumbnail (optional)</label>
                        <button 
                          type="button"
                          onClick={generateAIThumbnail}
                          disabled={isGeneratingThumb}
                          style={{ padding: '6px 12px', background: 'linear-gradient(135deg, #a855f7, #ec4899)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: '700', fontSize: '11px', cursor: isGeneratingThumb ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px', opacity: isGeneratingThumb ? 0.7 : 1, zIndex: 10 }}
                        >
                          <Sparkles size={12} /> {isGeneratingThumb ? 'Generating...' : 'AI Generate 🪄'}
                        </button>
                      </div>
                      <div
                        onClick={() => thumbnailInputRef.current.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file && file.type.startsWith('image/')) {
                            setYoutubeThumbnailFile(file);
                            setYoutubeThumbnailPreview(URL.createObjectURL(file));
                          }
                        }}
                        style={{
                          width: '100%', padding: '16px', border: '1.5px dashed #94a3b8', borderRadius: '12px',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          cursor: 'pointer', background: 'var(--border-subtle)', color: 'var(--text-muted)', fontWeight: '600', fontSize: '0.9rem',
                          position: 'relative', overflow: 'hidden'
                        }}
                      >
                        <input type="file" ref={thumbnailInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleThumbnailChange} />
                        {youtubeThumbnailPreview ? (
                          <>
                            <img referrerPolicy="no-referrer" src={getSafeImageUrl(youtubeThumbnailPreview)} alt="Thumbnail Preview" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '8px' }} />
                            <button
                              onClick={(e) => { e.stopPropagation(); setYoutubeThumbnailFile(null); setYoutubeThumbnailPreview(null); }}
                              style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={24} color="#64748b" />
                            <span>Drag & drop or click to upload thumbnail</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>title & description (optional)</label>
                      <input 
                        value={newPost.youtubeTitle || ''}
                        onChange={(e) => setNewPost({ ...newPost, youtubeTitle: e.target.value })}
                        placeholder="Custom title for your video..."
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: 'var(--border-subtle)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>tags (optional)</label>
                      <input 
                        value={newPost.youtubeTags || ''}
                        onChange={(e) => setNewPost({ ...newPost, youtubeTags: e.target.value })}
                        placeholder="Type a tag and press Enter..."
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: 'var(--border-subtle)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>visibility</label>
                        <select 
                          value={newPost.youtubeVisibility || 'Public'}
                          onChange={(e) => setNewPost({ ...newPost, youtubeVisibility: e.target.value })}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: 'var(--border-subtle)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                          <option value="Public">Public (Anyone)</option>
                          <option value="Unlisted">Unlisted (Link only)</option>
                          <option value="Private">Private (Only you)</option>
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>category</label>
                        <select 
                          value={newPost.youtubeCategory || 'People & Blogs'}
                          onChange={(e) => setNewPost({ ...newPost, youtubeCategory: e.target.value })}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: 'none', background: 'var(--border-subtle)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                          <option value="People & Blogs">People & Blogs</option>
                          <option value="Education">Education</option>
                          <option value="Entertainment">Entertainment</option>
                          <option value="Gaming">Gaming</option>
                          <option value="Music">Music</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pinterest Specific Settings */}
                  {(newPost.platforms || (newPost.platform ? [newPost.platform] : [])).includes('pinterest') && (
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <span style={{ color: '#E60023' }}><PinterestIcon size={18} color="#E60023" /></span>
                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Pinterest Settings</span>
                      </div>
  
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>pin title</label>
                        <input 
                          value={newPost.pinterestTitle || ''}
                          onChange={(e) => setNewPost({ ...newPost, pinterestTitle: e.target.value })}
                          placeholder="Enter Pin title..."
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '0.95rem' }}
                        />
                      </div>
  
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>destination link</label>
                        <input 
                          value={newPost.pinterestLink || ''}
                          onChange={(e) => setNewPost({ ...newPost, pinterestLink: e.target.value })}
                          placeholder="https://..."
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', outline: 'none', fontSize: '0.95rem' }}
                        />
                      </div>
  
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {showNewPinterestBoardInput ? 'new board name' : 'select board'} <span style={{ color: '#E60023' }}>*</span>
                          </label>
                          {!showNewPinterestBoardInput && (
                            <button
                              type="button"
                              onClick={fetchPinterestBoards}
                              style={{ fontSize: '0.75rem', color: '#E60023', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', padding: '2px 6px', borderRadius: '4px' }}
                            >
                              ↻ Refresh
                            </button>
                          )}
                        </div>

                        {!showNewPinterestBoardInput ? (
                          <>
                            <select
                              value={newPost.pinterestBoard || ''}
                              onChange={(e) => {
                                if (e.target.value === 'NEW_BOARD') {
                                  setShowNewPinterestBoardInput(true);
                                  setNewPost({ ...newPost, pinterestBoard: '' });
                                } else {
                                  setNewPost({ ...newPost, pinterestBoard: e.target.value });
                                }
                              }}
                              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${!newPost.pinterestBoard ? '#fca5a5' : 'var(--border-subtle)'}`, outline: 'none', fontSize: '0.95rem', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
                            >
                              <option value="" disabled>
                                {pinterestBoards.length === 0 ? '⏳ Loading boards...' : '— Select a Board —'}
                              </option>
                              {pinterestBoards.map((b, i) => (
                                <option key={b.id || i} value={b.name}>{b.name}</option>
                              ))}
                              <option value="NEW_BOARD">+ Create New Board</option>
                            </select>
                            {pinterestBoards.length === 0 && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                                No boards found. <button type="button" onClick={fetchPinterestBoards} style={{ color: '#E60023', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.75rem' }}>Click Refresh</button> or create a new one.
                              </p>
                            )}
                          </>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              autoFocus
                              value={newPost.pinterestBoard || ''}
                              onChange={(e) => setNewPost({ ...newPost, pinterestBoard: e.target.value })}
                              placeholder="e.g. My Awesome Board"
                              style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #E60023', outline: 'none', fontSize: '0.95rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => { setShowNewPinterestBoardInput(false); setNewPost({ ...newPost, pinterestBoard: '' }); }}
                              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--sidebar-bg)', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
                            >
                              ← Back
                            </button>
                          </div>
                        )}
                      </div>


                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            onClick={() => setNewPost({ ...newPost, pinterestIsAIModified: !newPost.pinterestIsAIModified })}
                            style={{ width: '44px', height: '24px', borderRadius: '12px', background: newPost.pinterestIsAIModified ? '#2563eb' : 'var(--border-subtle)', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: newPost.pinterestIsAIModified ? '23px' : '3px', transition: '0.3s' }}></div>
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Mark as AI-Modified</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Content that was made completely or partly with AI</div>
                          </div>
                        </div>
                        
                        {newPost.pinterestIsAIModified && (
                          <div style={{ marginLeft: '56px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input 
                              type="checkbox" 
                              checked={newPost.pinterestIsAIGeneratedPerson || false}
                              onChange={(e) => setNewPost({ ...newPost, pinterestIsAIGeneratedPerson: e.target.checked })}
                              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
                            />
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: '500' }}>This Pin includes an AI-generated person</span>
                       </div>
                      )}
                       </div>

                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                        <div 
                          onClick={() => setShowPinterestMoreOptions(!showPinterestMoreOptions)}
                          style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          More options <ChevronDown size={16} style={{ transform: showPinterestMoreOptions ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                        </div>

                        {showPinterestMoreOptions && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              onClick={() => setNewPost({ ...newPost, pinterestAllowComments: newPost.pinterestAllowComments === false ? true : false })}
                              style={{ width: '44px', height: '24px', borderRadius: '12px', background: newPost.pinterestAllowComments !== false ? '#2563eb' : 'var(--border-subtle)', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: newPost.pinterestAllowComments !== false ? '23px' : '3px', transition: '0.3s' }}></div>
                            </div>
                            <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Allow people to comment</div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div
                              onClick={() => setNewPost({ ...newPost, pinterestShowSimilarProducts: newPost.pinterestShowSimilarProducts === false ? true : false })}
                              style={{ width: '44px', height: '24px', borderRadius: '12px', background: newPost.pinterestShowSimilarProducts !== false ? '#2563eb' : 'var(--border-subtle)', position: 'relative', cursor: 'pointer', transition: '0.3s', flexShrink: 0 }}>
                              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: newPost.pinterestShowSimilarProducts !== false ? '23px' : '3px', transition: '0.3s' }}></div>
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '4px' }}>Show similar products</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                                People can shop products similar to what's shown in this Pin using visual search.<br/>
                                Shopping recommendations aren't available for Idea ads and Pins with tagged products or paid partnership label.
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: '8px' }}>
                            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px 16px', background: 'var(--sidebar-bg)' }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>Alt Text</label>
                              <textarea 
                                value={newPost.pinterestAltText || ''}
                                onChange={(e) => setNewPost({ ...newPost, pinterestAltText: e.target.value })}
                                placeholder="Describe your Pin's visual details"
                                rows={2}
                                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9rem', color: 'var(--text-main)', resize: 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Google Business Specific Settings */}
                {(newPost.platforms || (newPost.platform ? [newPost.platform] : [])).includes('google-business') && (
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <span style={{ color: '#4285f4' }}><MapPin size={18} /></span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Google Business</span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>post type</label>
                      <select 
                        value={newPost.gmbTopicType || 'STANDARD'}
                        onChange={(e) => setNewPost({ ...newPost, gmbTopicType: e.target.value })}
                        style={{ width: '100%', maxWidth: '280px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', cursor: 'pointer' }}
                      >
                        <option value="STANDARD">Update (Standard)</option>
                        <option value="EVENT">Event</option>
                        <option value="OFFER">Offer</option>
                        <option value="PRODUCT">Product</option>
                      </select>
                    </div>

                    {(newPost.gmbTopicType === 'EVENT' || newPost.gmbTopicType === 'OFFER') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--sidebar-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {newPost.gmbTopicType === 'EVENT' ? 'Event Details' : 'Offer Details'}
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>event/offer title</label>
                          <input 
                            value={newPost.gmbEventTitle || ''}
                            onChange={(e) => setNewPost({ ...newPost, gmbEventTitle: e.target.value })}
                            placeholder={newPost.gmbTopicType === 'EVENT' ? "e.g., Summer Special Gathering" : "e.g., 20% Off All Items"}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>start date & time</label>
                            <input 
                              type="datetime-local"
                              value={newPost.gmbEventStartDate || ''}
                              onChange={(e) => setNewPost({ ...newPost, gmbEventStartDate: e.target.value })}
                              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>end date & time</label>
                            <input 
                              type="datetime-local"
                              value={newPost.gmbEventEndDate || ''}
                              onChange={(e) => setNewPost({ ...newPost, gmbEventEndDate: e.target.value })}
                              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                            />
                          </div>
                        </div>
                        
                        {newPost.gmbTopicType === 'OFFER' && (
                          <>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>coupon code (optional)</label>
                              <input 
                                value={newPost.gmbOfferCouponCode || ''}
                                onChange={(e) => setNewPost({ ...newPost, gmbOfferCouponCode: e.target.value })}
                                placeholder="e.g., SUMMER20"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>redemption link (optional)</label>
                              <input 
                                value={newPost.gmbOfferRedeemUrl || ''}
                                onChange={(e) => setNewPost({ ...newPost, gmbOfferRedeemUrl: e.target.value })}
                                placeholder="https://example.com/redeem"
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>terms & conditions (optional)</label>
                              <textarea 
                                value={newPost.gmbOfferTerms || ''}
                                onChange={(e) => setNewPost({ ...newPost, gmbOfferTerms: e.target.value })}
                                placeholder="One coupon per customer. Cannot be combined with other offers."
                                style={{ width: '100%', padding: '12px 16px', minHeight: '60px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', resize: 'vertical' }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {newPost.gmbTopicType === 'PRODUCT' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--sidebar-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Product Details</div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>product name</label>
                          <input 
                            value={newPost.gmbProductName || ''}
                            onChange={(e) => setNewPost({ ...newPost, gmbProductName: e.target.value })}
                            placeholder="e.g., Deluxe Leather Wallet"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>product price</label>
                          <input 
                            value={newPost.gmbProductPrice || ''}
                            onChange={(e) => setNewPost({ ...newPost, gmbProductPrice: e.target.value })}
                            placeholder="e.g., $49.99"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        id="gmb-cta-enable"
                        checked={newPost.gmbCtaEnabled || false}
                        onChange={(e) => setNewPost({ ...newPost, gmbCtaEnabled: e.target.checked })}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#2563eb' }}
                      />
                      <label htmlFor="gmb-cta-enable" style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-main)', cursor: 'pointer' }}>
                        Add call-to-action button (optional)
                      </label>
                    </div>

                    {newPost.gmbCtaEnabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--sidebar-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>button type</label>
                          <select 
                            value={newPost.gmbActionType || 'LEARN_MORE'}
                            onChange={(e) => setNewPost({ ...newPost, gmbActionType: e.target.value })}
                            style={{ width: '100%', maxWidth: '280px', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', cursor: 'pointer' }}
                          >
                            <option value="LEARN_MORE">Learn More</option>
                            <option value="BOOK">Book</option>
                            <option value="ORDER">Order Online</option>
                            <option value="SHOP">Buy</option>
                            <option value="SIGN_UP">Sign Up</option>
                            <option value="CALL">Call</option>
                          </select>
                        </div>
                        {newPost.gmbActionType !== 'CALL' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>destination url</label>
                            <input 
                              value={newPost.gmbSearchUrl || ''}
                              onChange={(e) => setNewPost({ ...newPost, gmbSearchUrl: e.target.value })}
                              placeholder="https://example.com/book"
                              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }}
                            />
                            {!newPost.gmbSearchUrl && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px' }}>URL required when CTA is enabled</div>}
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>custom caption</label>
                      <textarea 
                        value={newPost.gmbCustomCaption || ''}
                        onChange={(e) => setNewPost({ ...newPost, gmbCustomCaption: e.target.value })}
                        placeholder="Leave blank to use main content..."
                        style={{ width: '100%', padding: '12px 16px', minHeight: '80px', borderRadius: '8px', border: 'none', background: 'var(--border-subtle)', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)', resize: 'vertical' }}
                      />
                    </div>
                  </div>
                )}
                
                {/* WHATSAPP SPECIFIC FIELDS */}
                {(newPost.platforms || (newPost.platform ? [newPost.platform] : [])).includes('whatsapp') && (
                  <div style={{ marginTop: '24px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <MessageCircle size={18} color="#16a34a" />
                       <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#166534' }}>WhatsApp Recipients</span>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                        Target Phone Numbers
                      </label>
                      <div style={{ fontSize: '0.75rem', color: '#15803d', marginBottom: '8px' }}>
                        Enter comma-separated numbers with country code (e.g. 919876543210, 1234567890).
                      </div>
                      <textarea
                        value={newPost.whatsappNumbers || ''}
                        onChange={(e) => setNewPost({...newPost, whatsappNumbers: e.target.value})}
                        placeholder="919876543210, 919876543211..."
                        style={{
                          width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #bbf7d0',
                          outline: 'none', fontSize: '0.85rem', minHeight: '80px', resize: 'vertical', background: 'var(--bg-card)', color: 'var(--text-main)'
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* LINKEDIN SPECIFIC TARGETS SELECTOR */}
                {(newPost.platforms || (newPost.platform ? [newPost.platform] : [])).includes('linkedin') && (
                  <div style={{ marginTop: '24px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={18} color="#1d4ed8" />
                      <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e40af' }}>LinkedIn Targets</span>
                    </div>
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#1e40af' }}>
                        Select publishing destinations:
                      </label>
                      {settings && settings.linkedinPages && Array.isArray(settings.linkedinPages) && settings.linkedinPages.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {settings.linkedinPages.map(target => {
                            const isChecked = (newPost.linkedinTargets || []).includes(target.urn);
                            return (
                              <label 
                                key={target.urn} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '10px', 
                                  padding: '10px 12px', 
                                  background: 'var(--bg-card)', 
                                  border: `1.5px solid ${isChecked ? '#3b82f6' : 'var(--border-subtle)'}`, 
                                  borderRadius: '8px', 
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => {
                                    setNewPost(prev => {
                                      const current = prev.linkedinTargets || [];
                                      if (current.includes(target.urn)) {
                                        return { ...prev, linkedinTargets: current.filter(u => u !== target.urn) };
                                      } else {
                                        return { ...prev, linkedinTargets: [...current, target.urn] };
                                      }
                                    });
                                  }}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>
                                    {target.name}
                                  </span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {target.type === 'profile' ? '👤 Personal Profile' : '🏢 Business Page'}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          No targets found. Please reconnect your LinkedIn account on the Connections page.
                        </div>
                      )}
                      {(!newPost.linkedinTargets || newPost.linkedinTargets.length === 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                          ⚠️ Please select at least one publishing target
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingRight: '12px' }}>
              
              {/* Platforms */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>platforms</label>
                  <div style={{
                    width: '100%', display: 'flex', flexWrap: 'wrap', gap: '12px'
                  }}>
                    {connectedPlatforms.map(plat => {
                      const isSelected = (newPost.platforms || (newPost.platform ? [newPost.platform] : [])).includes(plat.id);
                      return (
                        <div 
                          key={plat.id}
                          onClick={() => {
                            if (!plat.connected) {
                              notify(`Please connect your ${plat.label} account first.`, "info");
                              return;
                            }
                            setNewPost(prev => {
                              const current = prev.platforms || (prev.platform ? [prev.platform] : []);
                              const isNowSelected = !current.includes(plat.id);
                              const newPlatforms = isNowSelected
                                ? [...current, plat.id]
                                : current.filter(p => p !== plat.id);
                              if (plat.id === 'pinterest' && isNowSelected && pinterestBoards.length === 0) {
                                fetchPinterestBoards();
                              }
                              return { ...prev, platforms: newPlatforms };
                            });
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: isSelected ? `${plat.color}15` : 'var(--bg-card)',
                            border: `2px solid ${isSelected ? plat.color : 'var(--border-subtle)'}`,
                            padding: '10px 16px', borderRadius: '12px',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            opacity: plat.connected ? 1 : 0.5,
                            minWidth: '140px', flex: '1 1 calc(50% - 6px)',
                            position: 'relative'
                          }}
                        >
                          <div style={{ 
                            width: '28px', height: '28px', borderRadius: '8px', 
                            background: isSelected ? plat.color : 'var(--bg-dark)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isSelected ? 'var(--bg-card)' : plat.color
                          }}>
                            {plat.icon}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{plat.label}</span>
                            {plat.handle && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{plat.handle}</span>
                            )}
                          </div>
                          {isSelected && (
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', borderRadius: '50%', border: `4px solid ${plat.color}`, background: 'var(--bg-card)' }}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
              </div>

              {/* Date & Timezone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', margin: 0 }}>date & time</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <input 
                          type="checkbox" 
                          checked={isPostNow} 
                          onChange={(e) => setIsPostNow(e.target.checked)} 
                          style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4f46e5' }}
                        />
                        Post Immediately
                      </label>
                    </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="datetime-local"
                      value={newPost.scheduledFor || ''}
                      onChange={e => setNewPost({ ...newPost, scheduledFor: e.target.value })}
                      style={{
                        width: '100%', padding: '12px 14px', borderRadius: '8px',
                        border: 'none', outline: 'none', fontSize: '0.9rem',
                        color: 'var(--text-main)', background: 'var(--bg-card)'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>timezone</label>
                  <select
                    value={selectedTimezone}
                    onChange={e => handleTimezoneChange(e.target.value)}
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: '8px',
                      border: 'none', outline: 'none', fontSize: '0.9rem',
                      color: 'var(--text-main)', background: 'var(--bg-card)'
                    }}
                  >
                    {timezoneOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const selectedPlatforms = newPost.platforms || (newPost.platform ? [newPost.platform] : []);
                const hasThreads = selectedPlatforms.includes('threads');
                const isThreadsConnected = connectedPlatforms.some(p => p.id === 'threads');
                if (hasThreads && !isThreadsConnected) {
                  return (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fee2e2',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div>
                        <div style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.85rem', marginBottom: '4px' }}>Threads Not Connected</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
                          Please connect your Threads account in settings to create posts for this platform.
                        </div>
                        <button
                          onClick={() => navigate('/settings')}
                          style={{
                            padding: '8px 16px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Connect Threads
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setShowCreate(false)}
              style={{ 
                background: '#eff6ff', border: '1px solid #3b82f6', color: '#3b82f6', 
                padding: '14px 32px', borderRadius: '12px', fontSize: '1.05rem', 
                fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#dbeafe'; e.currentTarget.style.borderColor = '#2563eb'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubmit}
              disabled={submitting}
              style={{
                background: submitting ? 'var(--text-muted)' : '#3b82f6',
                color: 'white', border: 'none', padding: '14px 36px',
                borderRadius: '12px', fontSize: '1.05rem', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                boxShadow: submitting ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Scheduling...' : 'Schedule Post'} <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0 0 0', maxWidth: 'none', margin: '0', fontFamily: 'Inter, system-ui, sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }} onClick={() => {
      setShowPostStatusDropdown(false);
      setShowPlatformDropdown(false);
      setShowDateDropdown(false);
      setShowSortDropdown(false);
    }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 0 24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>Posts</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>Manage and schedule your social media content</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#3b82f6', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '8px', fontWeight: '600',
          fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
        }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.35)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.25)'; }}>
          <Plus size={16} /> Create post
        </button>
      </div>

      {/* Filters Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px', padding: '16px 24px 0 24px', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* All Posts Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPostStatusDropdown(!showPostStatusDropdown); setShowPlatformDropdown(false); setShowDateDropdown(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: postStatusFilter !== 'All posts' ? 'var(--sidebar-bg)' : 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              {postStatusFilter} <ChevronDown size={14} />
            </button>
            {showPostStatusDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '160px',
                padding: '4px 0'
              }}>
                {['All posts', 'Processing', 'Scheduled', 'Published', 'Failed'].map(status => (
                  <div 
                    key={status}
                    onClick={() => { setPostStatusFilter(status); setShowPostStatusDropdown(false); }}
                    style={{
                      padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: postStatusFilter === status ? 'var(--bg-dark)' : 'var(--bg-card)',
                      color: 'var(--text-main)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--sidebar-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.background = postStatusFilter === status ? 'var(--bg-dark)' : 'var(--bg-card)'}
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
                background: platformFilter !== 'All platforms' ? 'var(--sidebar-bg)' : 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              {platformFilter} <ChevronDown size={14} />
            </button>
            {showPlatformDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '160px',
                padding: '4px 0', maxHeight: '300px', overflowY: 'auto'
              }}>
                <div 
                  onClick={() => { setPlatformFilter('All platforms'); setShowPlatformDropdown(false); }}
                  style={{
                    padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: platformFilter === 'All platforms' ? 'var(--bg-dark)' : 'var(--bg-card)',
                    color: 'var(--text-main)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'var(--sidebar-bg)'}
                  onMouseOut={(e) => e.currentTarget.style.background = platformFilter === 'All platforms' ? 'var(--bg-dark)' : 'var(--bg-card)'}
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
                      background: platformFilter === plat.label ? 'var(--bg-dark)' : 'var(--bg-card)',
                      color: 'var(--text-main)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--sidebar-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.background = platformFilter === plat.label ? 'var(--bg-dark)' : 'var(--bg-card)'}
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
                background: dateFilter !== 'All dates' ? 'var(--sidebar-bg)' : 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
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
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
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
                      background: dateFilter === range ? 'var(--bg-dark)' : 'var(--bg-card)',
                      color: 'var(--text-main)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--sidebar-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.background = dateFilter === range ? 'var(--bg-dark)' : 'var(--bg-card)'}
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
          <div style={{ position: 'relative' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowSortDropdown(!showSortDropdown); setShowDateDropdown(false); setShowPostStatusDropdown(false); setShowPlatformDropdown(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: sortFilter !== 'Scheduled (new)' ? 'var(--sidebar-bg)' : 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)',
                padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem',
                fontWeight: '500', cursor: 'pointer'
              }}
            >
              {(sortFilter === 'Scheduled (new)' || sortFilter === 'Scheduled (old)') ? <Clock size={14} style={{ marginRight: '4px' }} /> : null}
              {sortFilter} <ChevronDown size={14} />
            </button>
            {showSortDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, minWidth: '180px',
                padding: '4px 0'
              }}>
                {['Scheduled (new)', 'Scheduled (old)', 'Recently created', 'Oldest created'].map(opt => (
                  <div 
                    key={opt}
                    onClick={() => { setSortFilter(opt); setShowSortDropdown(false); }}
                    style={{
                      padding: '8px 16px', fontSize: '0.85rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: sortFilter === opt ? 'var(--bg-dark)' : 'var(--bg-card)',
                      color: 'var(--text-main)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--sidebar-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.background = sortFilter === opt ? 'var(--bg-dark)' : 'var(--bg-card)'}
                  >
                    {opt}
                    {sortFilter === opt && <Check size={14} color="#0f172a" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Empty State or Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px 24px' }}>
      {visiblePosts.length === 0 ? (
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-subtle)', 
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
            width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px',
            boxShadow: '0 8px 16px rgba(124, 58, 237, 0.1)'
          }}>
            <Sparkles size={36} color="#3b82f6" />
          </div>
          
          <h2 style={{ margin: '0 0 12px 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)' }}>No posts yet</h2>
          <p style={{ margin: '0 0 32px 0', color: 'var(--text-muted)', fontSize: '1rem' }}>Create your first social media post</p>
          
          <button onClick={() => setShowCreate(true)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#3b82f6', color: 'white', border: 'none',
            padding: '14px 48px', borderRadius: '8px', fontWeight: '600',
            fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s',
            width: '300px', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
          }} onMouseOver={(e) => { e.currentTarget.style.background = '#6d28d9'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(124, 58, 237, 0.35)'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.25)'; }}>
            <Plus size={20} /> Create post
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
           {visiblePosts.map(post => {
            let mediaData = { type: post.type || 'image', mediaUrl: post.mediaUrl };
            try {
              if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
                mediaData = JSON.parse(post.mediaUrl);
              }
            } catch (e) { }

            const rawMediaSource = mediaData.thumbnail || mediaData.localMediaUrl || (mediaData.carouselItems && mediaData.carouselItems.length > 0 ? mediaData.carouselItems[0] : null) || mediaData.mediaUrl;

            const rewriteSupabasePublicToProxy = (url) => {
              if (!url || typeof url !== 'string') return url;
              const match = url.match(/https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/media\/(.+)/);
              if (match) return `${API_BASE_URL}/api/storage/view?path=${match[1]}`;
              return url;
            };

            let resolvedMedia = rewriteSupabasePublicToProxy(rawMediaSource);
            const resolvedCarouselItems = (mediaData.carouselItems || []).map(rewriteSupabasePublicToProxy);

            const finalMediaUrl = resolvedMedia && resolvedMedia.startsWith('http')
              ? resolvedMedia
              : (resolvedMedia ? `${API_BASE_URL}${resolvedMedia}` : null);

            return (
              <div
                key={post._id || post.id}
                style={{
                  background: 'var(--bg-card)', borderRadius: '24px', padding: '16px',
                  border: '1.5px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', gap: '16px'
                }}
              >
                {/* Media Preview Header */}
                <div style={{ width: '100%', height: '180px', borderRadius: '16px', background: 'var(--sidebar-bg)', overflow: 'hidden', position: 'relative' }}>
                  {!finalMediaUrl ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', color: 'var(--text-muted)', gap: '6px' }}>
                      <span style={{ fontSize: '2.5rem' }}>🖼️</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>No preview available</span>
                    </div>
                  ) : mediaData.type === 'reel' || (finalMediaUrl && finalMediaUrl.match(/\.(mp4|mov|webm)$/i) && !mediaData.thumbnail) ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <video src={finalMediaUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                        <Film size={28} color="white" />
                      </div>
                    </div>
                  ) : (
                    <img referrerPolicy="no-referrer" 
                      src={getSafeImageUrl(finalMediaUrl)} 
                      alt="Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentNode;
                        if (parent && !parent.querySelector('.img-expired-msg')) {
                          const msg = document.createElement('div');
                          msg.className = 'img-expired-msg';
                          msg.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f1f5f9;color:#94a3b8;font-size:0.8rem;gap:6px;';
                          msg.innerHTML = '<span style="font-size:2rem;">🖼️</span><span>Image preview expired</span>';
                          parent.appendChild(msg);
                        }
                      }}
                    />
                  )}

                  {/* Overlays inside media preview */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {/* Status Badge */}
                    <div style={{
                      background: post.status === 'Posted' ? '#10b981' : (post.status === 'Failed' ? '#ef4444' : ((post.status === 'Processing' || (post.status === 'Scheduled' && mediaData.igContainerId)) ? '#3b82f6' : '#3b82f6')),
                      color: 'white', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.65rem', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {(post.status === 'Retrying' || post.status === 'Processing' || (post.status === 'Scheduled' && mediaData.igContainerId)) ? (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid white', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--bg-card)' }} />
                      )}
                      <span>{post.status === 'Retrying' ? `Retrying` : ((post.status === 'Scheduled' && mediaData.igContainerId) ? 'Processing' : (post.status || 'SCHEDULED'))}</span>
                    </div>

                    {/* Platform Badge */}
                    <div style={{
                      fontSize: '0.65rem', fontWeight: '800', 
                      color: 'white',
                      background: post.platform === 'facebook' ? '#1877f2' : post.platform === 'threads' ? '#000000' : post.platform === 'pinterest' ? '#E60023' : post.platform === 'youtube' ? '#ff0000' : post.platform === 'google-business' ? '#4285f4' : post.platform === 'linkedin' ? '#0a66c2' : post.platform === 'twitter' ? '#000000' : post.platform === 'whatsapp' ? '#25d366' : '#e1306c',
                      padding: '4px 8px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {post.platform === 'facebook' ? <Facebook size={10} fill="white" /> : 
                       post.platform === 'threads' ? <ThreadsIcon size={10} color="white" /> :
                       post.platform === 'pinterest' ? <PinterestIcon size={10} color="white" /> :
                       post.platform === 'youtube' ? <Film size={10} color="white" /> :
                       post.platform === 'google-business' ? <MapPin size={10} color="white" /> :
                       post.platform === 'linkedin' ? <Globe size={10} color="white" /> :
                       post.platform === 'twitter' ? <X size={10} color="white" /> :
                       post.platform === 'whatsapp' ? <MessageCircle size={10} color="white" /> :
                       <Instagram size={10} color="white" />}
                      <span>{post.platform ? post.platform.replace('-', ' ').toUpperCase() : 'INSTAGRAM'}</span>
                    </div>
                     {/* Post Type Badge */}
                     <div style={{
                       fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-main)', textTransform: 'uppercase',
                       background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '8px',
                       boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                     }}>
                        {mediaData.type || 'IMAGE'}
                     </div>
                  </div>

                  {/* Automation Toggle Overlay on Bottom-Right */}
                  {post.platform !== 'threads' && post.platform !== 'linkedin' && (post.autoResponse || post.triggerKeyword) && (
                    <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const newStatus = post.automationStatus === 'Paused' ? 'Active' : 'Paused';
                          toggleAutomationStatus(post._id || post.id, newStatus);
                        }}
                        style={{
                          background: post.automationStatus === 'Paused' ? 'rgba(241, 245, 249, 0.95)' : 'rgba(16, 185, 129, 0.95)',
                          color: post.automationStatus === 'Paused' ? 'var(--text-muted)' : 'var(--bg-card)',
                          padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                          cursor: 'pointer', fontSize: '0.65rem', fontWeight: '800', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          backdropFilter: 'blur(4px)'
                        }}
                        title="Toggle Automation"
                      >
                        <Zap size={10} fill={post.automationStatus === 'Paused' ? 'none' : 'var(--bg-card)'} />
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600', flexWrap: 'wrap' }}>
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
                            <span style={{ color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '800' }}>
                              {tzData.abbr}
                            </span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  {post.platform !== 'threads' && post.platform !== 'linkedin' && (
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
                        padding: '10px 14px', borderRadius: '12px', border: '1px solid #eff6ff',
                        background: '#eff6ff', color: '#3b82f6', fontWeight: '800', cursor: 'pointer',
                        transition: 'all 0.2s', fontSize: '0.8rem'
                      }}
                    >
                      <Zap size={14} /> <span>Automation</span>
                    </button>
                  )}

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
                      background: 'var(--bg-card)', color: '#ef4444', cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-card)'}
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

        


      {/* --- ADVANCED AUTOMATION EDITOR DRAWER/MODAL --- */}
      {showAdvanced && createdPost && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)', 
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
                  <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>Advanced <span style={{ color: '#3b82f6' }}>Automation</span></h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <div
                      onClick={() => setCreatedPost({ ...createdPost, automationStatus: createdPost.automationStatus === 'Active' ? 'Paused' : 'Active' })}
                      style={{
                        width: '40px', height: '20px', borderRadius: '10px',
                        background: createdPost.automationStatus === 'Active' ? '#10b981' : 'var(--border-subtle)',
                        position: 'relative', cursor: 'pointer', transition: '0.3s'
                      }}
                    >
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-card)',
                        position: 'absolute', top: '2px', left: createdPost.automationStatus === 'Active' ? '22px' : '2px',
                        transition: '0.3s'
                      }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: createdPost.automationStatus === 'Active' ? '#10b981' : 'var(--text-muted)' }}>
                      Automation {createdPost.automationStatus === 'Active' ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setShowAdvanced(false)} style={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Visual Workflow Map */}
              <div style={{
                background: 'var(--bg-dark)',
                borderRadius: '24px',
                padding: '24px',
                border: '1.5px dashed #d8b4fe',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Layers size={16} color="#3b82f6" />
                  <span style={{ fontSize: '0.8rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Live Automation Blueprint</span>
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
                    background: 'var(--bg-card)', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Trigger Post</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <ImageIcon size={12} color="#3b82f6" />
                      <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#1e1b4b' }}>This Post</span>
                    </div>
                  </div>

                  <div style={{ color: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>→</div>

                  <div style={{ 
                    flex: 1.5, 
                    minWidth: '100px',
                    background: 'var(--bg-card)', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Comment Trigger</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#10b981' }}>
                      {createdPost.anyKeyword ? 'Any Comment' : `Word: "${createdPost.triggerKeyword || 'none'}"`}
                    </span>
                  </div>

                  <div style={{ color: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>→</div>

                  <div style={{ 
                    flex: 1.5, 
                    minWidth: '100px',
                    background: 'var(--bg-card)', 
                    border: '1.5px solid #cbd5e1', 
                    borderRadius: '12px', 
                    padding: '10px 6px', 
                    textAlign: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                    zIndex: 2
                  }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Public Reply</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#8b5cf6' }}>
                      "{createdPost.publicReply || 'Sent DM!'}"
                    </span>
                  </div>

                  <div style={{ color: 'var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>→</div>

                  <div style={{ 
                    flex: 2, 
                    minWidth: '120px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
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
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>User must follow you to receive the DM response automatically.</p>
                    </div>
                  </div>
                  <div
                    onClick={() => setCreatedPost({ ...createdPost, requireFollow: !createdPost.requireFollow })}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.requireFollow ? '#10b981' : 'var(--border-subtle)', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: createdPost.requireFollow ? '23px' : '3px', transition: '0.3s' }}></div>
                  </div>
                </div>

                <div style={{ border: '1.5px solid #bbf7d0', borderRadius: '20px', padding: '20px', background: 'var(--bg-card)', marginTop: '16px' }}>
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
                    style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '16px', border: '1.5px solid #10b981', outline: 'none', fontSize: '0.9rem', resize: 'none', background: 'var(--bg-card)' }}
                  />
                </div>
              </div>

              {/* 2. Select a Post */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>2</div>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Select a Post</h4>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Any post</div>
                  <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: 'var(--border-subtle)', position: 'relative', cursor: 'not-allowed' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: '3px' }}></div>
                  </div>
                </div>
              </div>

              {/* 3. Comment Trigger */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#1e1b4b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>3</div>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Comment Trigger</h4>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontWeight: '800', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Any keyword</div>
                  <div
                    onClick={() => setCreatedPost({ ...createdPost, anyKeyword: !createdPost.anyKeyword, triggerKeyword: !createdPost.anyKeyword ? '*' : '' })}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.anyKeyword ? '#3b82f6' : 'var(--border-subtle)', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: createdPost.anyKeyword ? '23px' : '3px', transition: '0.3s' }}></div>
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
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '900' }}>4</div>
                    <div>
                      <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Advanced: Opening Message</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Send a greeting button before the final response.</p>
                    </div>
                  </div>
                  <div
                    onClick={() => setCreatedPost({ ...createdPost, openingMessage: !createdPost.openingMessage })}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', background: createdPost.openingMessage ? '#3b82f6' : 'var(--border-subtle)', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--bg-card)', position: 'absolute', top: '3px', left: createdPost.openingMessage ? '23px' : '3px', transition: '0.3s' }}></div>
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
                      style={{ width: '100%', height: '80px', padding: '16px', borderRadius: '16px', border: '1.5px solid #3b82f6', outline: 'none', fontSize: '0.9rem', resize: 'none', background: 'var(--bg-card)', marginBottom: '16px' }}
                    />

                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#0369a1', marginBottom: '8px' }}>BUTTON TEXT</label>
                    <input
                      type="text"
                      value={createdPost.openingMessageButton || ''}
                      onChange={(e) => setCreatedPost({ ...createdPost, openingMessageButton: e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #3b82f6', outline: 'none', fontSize: '0.9rem', fontWeight: '800', background: 'var(--bg-card)' }}
                    />
                  </div>
                )}
              </div>

              {/* 5. Send a DM */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
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
                    style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--sidebar-bg)', outline: 'none', fontSize: '0.95rem', resize: 'none' }}
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
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: 'var(--sidebar-bg)', borderRadius: '16px', border: '1.5px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <LinkIcon size={14} color="#3b82f6" />
                            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>{btn.text}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <Pencil size={16} onClick={() => openEditLinkModal(idx)} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
                            <Trash2 size={16} onClick={() => removeLink(idx)} style={{ cursor: 'pointer', color: '#ef4444' }} />
                          </div>
                        </div>
                      ))}
                      {(createdPost.buttons || []).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                          No buttons added yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Public Comment Reply */}
              <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '24px', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontWeight: '900', color: '#1e1b4b', fontSize: '1rem' }}>Public Comment Reply</h4>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '24px' }}>Grow your audience faster — with smart, hands-free engagement.</p>

                <div style={{ background: '#eff6ff', border: '1.5px solid #ddd6fe', borderRadius: '20px', padding: '24px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase' }}>PUBLIC COMMENT REPLY (RECOMMENDED)</label>
                    <button
                      onClick={() => handleAIGenerate('publicReply', `Write a short, friendly Instagram comment reply to someone who commented on my post. Mention that I've sent them a DM with the details. Use emojis.`)}
                      style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
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
                      style={{ width: '100%', padding: '16px 50px 16px 16px', borderRadius: '16px', border: '1.5px solid #ddd6fe', outline: 'none', fontSize: '0.95rem', fontWeight: '600', background: 'var(--bg-card)' }}
                    />
                  </div>
                </div>

                <div style={{
                  position: 'sticky',
                  bottom: '-40px',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-card)',
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
                    style={{ width: '100%', padding: '18px', borderRadius: '20px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)' }}
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
            background: 'var(--bg-card)', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px',
            boxShadow: '0 30px 70px rgba(0,0,0,0.3)', animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1e1b4b', margin: 0 }}>{editingLinkIndex !== null ? 'Edit Button' : 'Add Link Button'}</h3>
              <button onClick={() => setShowLinkModal(false)} style={{ background: 'var(--bg-dark)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>BUTTON TEXT</label>
              <input
                value={tempLinkTitle}
                onChange={(e) => setTempLinkTitle(e.target.value)}
                placeholder="e.g. Visit Website"
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600' }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px' }}>URL LINK</label>
              <input
                value={tempLinkUrl}
                onChange={(e) => setTempLinkUrl(e.target.value)}
                placeholder="https://..."
                style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '1rem', fontWeight: '600', color: '#3b82f6' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveLink}
                style={{ flex: 1.5, padding: '16px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(124, 58, 237, 0.2)' }}
              >
                Save Button
              </button>
              <button onClick={() => setShowLinkModal(false)} style={{ flex: 1, padding: '16px', background: 'var(--bg-dark)', color: 'var(--text-muted)', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' }}>Cancel</button>
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
              background: 'var(--bg-card)',
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '500', margin: '0 0 28px 0', lineHeight: '1.5' }}>
              This will permanently cancel and remove this scheduled post. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => deletePost(deleteConfirmId, true)}
                style={{
                  width: '100%', padding: '14px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', border: 'none', borderRadius: '14px',
                  fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(239,68,68,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(239,68,68,0.3)'; }}
              >
                Delete from Dashboard & Social Media
              </button>
              
              <button
                onClick={() => deletePost(deleteConfirmId, false)}
                style={{
                  width: '100%', padding: '14px',
                  background: 'transparent',
                  color: '#ef4444', border: '2px solid #ef4444', borderRadius: '14px',
                  fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Delete from Dashboard Only
              </button>

              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{
                  width: '100%', padding: '14px', background: 'var(--bg-dark)', color: 'var(--text-muted)',
                  border: 'none', borderRadius: '14px', fontWeight: '800',
                  cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--border-subtle)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-dark)'}
              >
                Cancel
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