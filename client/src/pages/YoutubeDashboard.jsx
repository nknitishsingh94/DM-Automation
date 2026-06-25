import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Youtube, Upload, Calendar, Search, 
  BarChart2, MessageCircle, Settings, Play, 
  Sparkles, Clock, CheckCircle, Image as ImageIcon,
  MoreVertical, ThumbsUp, Eye, FileVideo
} from 'lucide-react';
import { useNotification } from '../App';
import Campaigns from './Campaigns';
import { API_BASE_URL } from '../config';

export default function YoutubeDashboard() {
  const navigate = useNavigate();
  const { notify } = useNotification();
  
  const [activeTab, setActiveTab] = useState('library');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [channelStats, setChannelStats] = useState([
    { label: 'Subscribers', value: '0', increase: '', color: '#ff0000', icon: Youtube },
    { label: 'Total Views', value: '0', increase: '', color: '#3b82f6', icon: Eye },
    { label: 'Total Videos', value: '0', increase: '', color: '#10b981', icon: FileVideo },
    { label: 'Avg Engagement', value: '8.4%', increase: '+0.5%', color: '#8b5cf6', icon: BarChart2 }
  ]);

  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [videoLibrary, setVideoLibrary] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rawVideoFile, setRawVideoFile] = useState(null);
  const [rawThumbFile, setRawThumbFile] = useState(null);
  const [scheduleData, setScheduleData] = useState({ title: '', description: '', date: '', time: '', mediaUrl: '', thumbnail: '' });
  const fileInputRef = React.useRef(null);
  const thumbInputRef = React.useRef(null);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedThumb, setGeneratedThumb] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);

  const handleDragOverThumb = (e) => {
    e.preventDefault();
    setIsDraggingThumb(true);
  };
  const handleDragLeaveThumb = (e) => {
    e.preventDefault();
    setIsDraggingThumb(false);
  };
  const handleDropThumb = (e) => {
    e.preventDefault();
    setIsDraggingThumb(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleThumbFile(e.dataTransfer.files[0]);
    }
  };
  const handleThumbFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleThumbFile(e.target.files[0]);
    }
  };
  const handleThumbFile = (file) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setGeneratedThumb(url);
    } else {
      notify("Please upload an image file for thumbnail", "error");
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('insta_agent_token');
        const res = await fetch(`${API_BASE_URL}/api/youtube/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok && !data.notConnected && !data.error) {
          // Helper to format large numbers
          const formatNum = (num) => {
            if (!num) return '0';
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
          };

          setChannelStats([
            { label: 'Subscribers', value: formatNum(data.subscriberCount), increase: 'Live', color: '#ff0000', icon: Youtube },
            { label: 'Total Views', value: formatNum(data.viewCount), increase: 'Live', color: '#3b82f6', icon: Eye },
            { label: 'Total Videos', value: formatNum(data.videoCount), increase: 'Live', color: '#10b981', icon: FileVideo },
            { label: 'Avg Engagement', value: '8.4%', increase: '+0.5%', color: '#8b5cf6', icon: BarChart2 }
          ]);
        }
        const videoRes = await fetch(`${API_BASE_URL}/api/youtube/videos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (videoRes.ok) {
          const videoData = await videoRes.json();
          if (!videoData.notConnected && !videoData.error && Array.isArray(videoData)) {
            setVideoLibrary(videoData);
          }
        }

      } catch (err) {
        console.error('Error fetching YouTube stats/videos:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const handleFileUpload = (e, type = 'video') => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'video') {
      setRawVideoFile(file);
      setScheduleData(s => ({ ...s, mediaUrl: URL.createObjectURL(file) }));
    } else {
      setRawThumbFile(file);
      setScheduleData(s => ({ ...s, thumbnail: URL.createObjectURL(file) }));
    }
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleData.title || !scheduleData.date || !scheduleData.time || (!rawVideoFile && !scheduleData.mediaUrl)) {
      return notify('Title, Date, Time, and Video are required!', 'error');
    }

    const scheduledDate = new Date(`${scheduleData.date}T${scheduleData.time}`).toISOString();
    
    // If we only have mediaUrl and no rawVideoFile, it might be a mock or already uploaded. 
    // But for this new direct upload architecture, rawVideoFile is mandatory unless we are mocking.
    if (!rawVideoFile) {
      return notify('Please select a local video file to upload directly to YouTube.', 'error');
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('insta_agent_token');
      // 1. Get YouTube Access Token
      const tokenRes = await fetch(`${API_BASE_URL}/api/youtube/access-token`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenRes.ok || !tokenData.accessToken) {
        setIsUploading(false);
        return notify('Failed to get YouTube access token. Please reconnect YouTube.', 'error');
      }

      const ytToken = tokenData.accessToken;

      // 2. Initiate Resumable Upload Session
      const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ytToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': rawVideoFile.size.toString(),
          'X-Upload-Content-Type': rawVideoFile.type || 'video/mp4'
        },
        body: JSON.stringify({
          snippet: {
            title: scheduleData.title,
            description: scheduleData.description,
            categoryId: "22"
          },
          status: {
            privacyStatus: 'private',
            publishAt: scheduledDate
          }
        })
      });

      if (!initRes.ok) {
        setIsUploading(false);
        console.error("Init error", await initRes.text());
        return notify('Failed to initiate YouTube upload.', 'error');
      }

      const uploadUrl = initRes.headers.get('Location');
      if (!uploadUrl) {
        setIsUploading(false);
        return notify('No upload URL returned from YouTube.', 'error');
      }

      // 3. Upload actual file using XMLHttpRequest to track progress
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', rawVideoFile.type || 'video/mp4');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const ytResponse = JSON.parse(xhr.responseText);
          const videoId = ytResponse.id;

          // 4. Upload custom thumbnail if exists
          if (rawThumbFile || (scheduleData.thumbnail && !scheduleData.thumbnail.startsWith('blob:'))) {
             try {
                let thumbBlob = rawThumbFile;
                if (!thumbBlob && scheduleData.thumbnail) {
                   const r = await fetch(scheduleData.thumbnail);
                   thumbBlob = await r.blob();
                }
                
                if (thumbBlob) {
                  await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${ytToken}`,
                      'Content-Type': thumbBlob.type || 'image/png'
                    },
                    body: thumbBlob
                  });
                }
             } catch(err) {
               console.error("Thumb error", err);
             }
          }

          notify('Video Uploaded & Scheduled on YouTube!', 'success');
          setShowScheduleModal(false);
          setScheduleData({ title: '', description: '', date: '', time: '', mediaUrl: '', thumbnail: '' });
          setRawVideoFile(null);
          setRawThumbFile(null);
          setUploadProgress(0);
          setIsUploading(false);
        } else {
          setIsUploading(false);
          notify('Error uploading video file to YouTube.', 'error');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        notify('Network error during YouTube upload.', 'error');
      };

      xhr.send(rawVideoFile);

    } catch (err) {
      console.error(err);
      setIsUploading(false);
      notify('An unexpected error occurred.', 'error');
    }
  };

  const generateAIThumbnail = async () => {
    if (!aiPrompt) return notify('Please enter a video title or prompt!', 'error');
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/youtube/generate-thumbnail`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedThumb(data.imageUrl);
        notify('Thumbnail generated!', 'success');
      } else {
        notify(data.error || 'Generation failed', 'error');
      }
    } catch (err) {
      notify('Network error', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAISuggest = async () => {
    if (!scheduleData.title) {
      return notify('Please enter a rough title or idea first!', 'error');
    }
    notify('AI is analyzing and generating metadata...', 'info');
    setIsGenerating(true);
    try {
      const token = localStorage.getItem('insta_agent_token');
      const res = await fetch(`${API_BASE_URL}/api/youtube/generate-metadata`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prompt: scheduleData.title,
          options: { titles: true, description: true, tags: true }
        })
      });

      const data = await res.json();
      if (res.ok) {
        setScheduleData(s => ({
          ...s,
          title: data.titles[0], // Pick the first suggested title
          description: data.description + '\n\n#Tags:\n' + data.tags
        }));
        notify('AI metadata applied successfully!', 'success');
        setShowAIModal(false);
      } else {
        notify(data.error || 'Failed to generate metadata', 'error');
      }
    } catch (err) {
      notify('Network error during AI generation', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '20px', fontFamily: 'Inter, system-ui, sans-serif', animation: 'fadeIn 0.5s ease-out', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/hub')}
            style={{ 
              background: '#f1f5f9', border: 'none', borderRadius: '12px', padding: '10px', 
              cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255, 0, 0, 0.1)', color: '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Youtube size={28} />
          </div>
          
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              YouTube Studio
              <span style={{ fontSize: '0.7rem', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid #a7f3d0' }}>PRO</span>
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Manage, schedule, and optimize your channel</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowScheduleModal(true)} style={{ background: '#ff0000', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(255, 0, 0, 0.2)' }}>
            <Upload size={18} /> Upload Video
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {channelStats.map((stat, i) => (
          <div key={i} style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>{stat.label}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={16} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>{stat.value}</h2>
              <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: '700' }}>{stat.increase}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', gap: '24px' }}>
        {['library', 'comments', 'automation', 'thumbnails'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              background: 'none', border: 'none', padding: '12px 4px', fontSize: '1rem', fontWeight: '600', 
              color: activeTab === tab ? '#0f172a' : '#64748b', 
              borderBottom: activeTab === tab ? '3px solid #ff0000' : '3px solid transparent',
              cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s'
            }}
          >
            {tab === 'library' ? 'Video Library' : tab === 'thumbnails' ? 'Thumbnail AI' : tab}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1 }}>
        {activeTab === 'library' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                <input type="text" placeholder="Search videos..." style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.9rem' }} />
              </div>
              <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <Calendar size={16} /> Filter by Date
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {videoLibrary.map(video => (
                <div key={video.id} style={{ background: '#ffffff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ position: 'relative', height: '170px', background: '#f1f5f9' }}>
                    <img referrerPolicy="no-referrer" src={video.thumbnail} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', color: 'white', background: video.status === 'Published' ? '#10b981' : video.status === 'Scheduled' ? '#3b82f6' : '#64748b' }}>
                      {video.status}
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>{video.title}</h3>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} /> {video.date}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: '16px', color: '#475569', fontSize: '0.85rem', fontWeight: '600' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={15} /> {video.views}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ThumbsUp size={15} /> {video.likes}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={15} /> {video.comments}</span>
                      </div>
                      <MoreVertical size={18} color="#94a3b8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'thumbnails' && (
          <div 
            onDragEnter={handleDragOverThumb}
            onDragOver={handleDragOverThumb}
            onDragLeave={handleDragLeaveThumb}
            onDrop={handleDropThumb}
            onClick={() => { if (!generatedThumb && !isGenerating) thumbInputRef.current?.click(); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', background: isDraggingThumb ? '#eff6ff' : '#f8fafc', borderRadius: '16px', border: `2px dashed ${isDraggingThumb ? '#3b82f6' : '#cbd5e1'}`, padding: '32px', cursor: !generatedThumb ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
          >
            <input type="file" accept="image/*" ref={thumbInputRef} style={{ display: 'none' }} onChange={handleThumbFileChange} />
            {!generatedThumb ? (
              <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px', pointerEvents: isDraggingThumb ? 'none' : 'auto' }}>
                <div style={{ width: '64px', height: '64px', background: '#ffedd5', color: '#ea580c', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', cursor: 'pointer' }} onClick={() => thumbInputRef.current?.click()}>
                  <ImageIcon size={32} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', textAlign: 'center' }}>AI Thumbnail Generator</h2>
                <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '24px' }}>Let our AI analyze your video title and generate a high-converting thumbnail, or drag and drop your own image here.</p>
                <input 
                  type="text" 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Enter video title or idea..." 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', marginBottom: '16px' }} 
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); generateAIThumbnail(); }} 
                  disabled={isGenerating}
                  style={{ background: '#ea580c', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: isGenerating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)', opacity: isGenerating ? 0.7 : 1, width: '100%', justifyContent: 'center' }}
                >
                  <Sparkles size={18} /> {isGenerating ? 'Generating...' : 'Generate AI Thumbnail'}
                </button>
                <div style={{ margin: '16px 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: '600' }}>OR</div>
                <button 
                  onClick={(e) => { e.stopPropagation(); thumbInputRef.current?.click(); }}
                  style={{ background: '#f1f5f9', color: '#475569', padding: '12px 24px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'center' }}
                >
                  <Upload size={18} /> Upload Custom Thumbnail
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <img referrerPolicy="no-referrer" src={generatedThumb} alt="Generated Thumbnail" style={{ width: '100%', maxWidth: '500px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button onClick={() => setGeneratedThumb('')} style={{ background: '#f1f5f9', color: '#475569', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}>Generate Another</button>
                  <a href={generatedThumb} download="thumbnail.png" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', background: '#10b981', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>Download HD</a>
                  <button 
                    onClick={() => {
                      setScheduleData(s => ({ ...s, thumbnail: generatedThumb }));
                      setActiveTab('library');
                      setShowScheduleModal(true);
                      notify('AI Thumbnail applied! You can now schedule your video.', 'success');
                    }} 
                    style={{ background: '#ff0000', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(255, 0, 0, 0.2)' }}
                  >
                    <Upload size={18} /> Use for Scheduling
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'automation' && (
          <div style={{ marginTop: '20px' }}>
            <Campaigns platformFilter="youtube" />
          </div>
        )}
      </div>

      {/* SCHEDULE MODAL (MOCK) */}
      {showScheduleModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={24} color="#ff0000" /> Upload & Schedule
              </h2>
              <button onClick={() => setShowScheduleModal(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* File Upload Area */}
              <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'video')} accept="video/*" style={{ display: 'none' }} />
              <input type="file" ref={thumbInputRef} onChange={e => handleFileUpload(e, 'thumbnail')} accept="image/*" style={{ display: 'none' }} />
              
              <div 
                onClick={() => fileInputRef.current.click()} 
                style={{ border: scheduleData.mediaUrl ? '2px solid #10b981' : '2px dashed #cbd5e1', borderRadius: '16px', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', cursor: 'pointer' }}
                onMouseOver={e => !scheduleData.mediaUrl && (e.currentTarget.style.borderColor = '#ff0000')} 
                onMouseOut={e => !scheduleData.mediaUrl && (e.currentTarget.style.borderColor = '#cbd5e1')}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: scheduleData.mediaUrl ? '#10b98115' : '#ff000015', color: scheduleData.mediaUrl ? '#10b981' : '#ff0000', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  {scheduleData.mediaUrl ? <CheckCircle size={28} /> : <FileVideo size={28} />}
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0f172a' }}>
                  {isUploading ? 'Uploading...' : scheduleData.mediaUrl ? 'Video Ready for Schedule' : 'Select video files to upload'}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                  {scheduleData.mediaUrl ? 'You can change the video by clicking here.' : 'Your videos will be private until you publish them.'}
                </p>
              </div>

              {/* Title & Description with AI button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>Title (required)</label>
                    <button onClick={() => setShowAIModal(true)} style={{ background: 'none', border: 'none', color: '#8b5cf6', fontSize: '0.85rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <Sparkles size={14} /> AI Assist
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={scheduleData.title}
                    onChange={e => setScheduleData({...scheduleData, title: e.target.value})}
                    placeholder="Add a title that describes your video" 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'block' }}>Description</label>
                  <textarea 
                    value={scheduleData.description}
                    onChange={e => setScheduleData({...scheduleData, description: e.target.value})}
                    placeholder="Tell viewers about your video" 
                    rows="4" 
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Thumbnail <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px' }}>Optional</span>
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => thumbInputRef.current.click()} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ImageIcon size={16} /> {scheduleData.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </button>
                    {scheduleData.thumbnail && <div style={{ width: '40px', height: '40px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}><img referrerPolicy="no-referrer" src={scheduleData.thumbnail.startsWith('/uploads') ? `${API_BASE_URL}${scheduleData.thumbnail}` : scheduleData.thumbnail} alt="thumb" style={{width:'100%', height:'100%', objectFit:'cover'}} /></div>}
                  </div>
                </div>
              </div>

              {/* Scheduling Section */}
              <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> Visibility & Schedule</h4>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Date</label>
                    <input 
                      type="date" 
                      value={scheduleData.date}
                      onChange={e => setScheduleData({...scheduleData, date: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Time</label>
                    <input 
                      type="time" 
                      value={scheduleData.time}
                      onChange={e => setScheduleData({...scheduleData, time: e.target.value})}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {isUploading && (
              <div style={{ padding: '0 24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '600', color: '#64748b' }}>
                  <span>Uploading directly to YouTube... Do not close tab.</span>
                  <span style={{ color: '#ff0000' }}>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${uploadProgress}%`, height: '100%', background: '#ff0000', transition: 'width 0.2s ease-out' }}></div>
                </div>
              </div>
            )}
            <div style={{ padding: '20px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fafaf9', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
              <button onClick={() => setShowScheduleModal(false)} disabled={isUploading} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: isUploading ? 'not-allowed' : 'pointer' }}>Cancel</button>
              <button onClick={handleScheduleSubmit} disabled={isUploading} style={{ background: '#ff0000', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: '700', cursor: isUploading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 4px rgba(255, 0, 0, 0.2)', opacity: isUploading ? 0.7 : 1 }}>
                {isUploading ? 'Uploading...' : 'Schedule Video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI ASSIST MODAL */}
      {showAIModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'white', borderRadius: '20px', width: '400px', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Sparkles size={24} />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#0f172a' }}>AI Content Optimizer</h3>
            <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>Our AI will analyze your video content to generate SEO-optimized titles, descriptions, and high-ranking tags.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                <input type="checkbox" defaultChecked /> Generate Catchy Titles (3 options)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                <input type="checkbox" defaultChecked /> Write SEO Description
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#334155' }}>
                <input type="checkbox" defaultChecked /> Extract Trending Tags
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowAIModal(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAISuggest} style={{ flex: 2, background: '#8b5cf6', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Generate Magic
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
