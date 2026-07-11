import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageCircle, MessageSquare, Instagram, Zap, Sparkles, X, 
  Users, Gift, Trophy, Youtube, Smartphone, Headphones, Globe, UserPlus,
  Bot, HelpCircle, ShieldAlert, Heart, ThumbsUp, AtSign, Link as LinkIcon, 
  Send, PlusCircle, ShoppingBag, Megaphone, Tag, Ticket, BookOpen, Rocket,
  Phone, Calendar, Handshake, Video, Cpu
} from 'lucide-react';

export default function TemplateSelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const channel = params.get('channel');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Lead Generation', 'Sales & Offers', 'Audience Growth', 'AI & Support', 'Advanced'];

  const templates = [
    { id: 'gen_leads_stories', category: 'Lead Generation', title: 'Generate Leads with Stories', desc: 'Ask qualifying questions and collect emails/phones from story replies', icon: 'Story' },
    { id: 'grow_email_list', category: 'Lead Generation', title: 'Grow Email List', desc: 'Ask for email to send a resource and save to CRM', icon: 'Email' },
    { id: 'grow_sms_list', category: 'Lead Generation', title: 'Grow an SMS List', desc: 'Collect phone numbers for text updates', icon: 'Phone' },
    { id: 'get_event_signups', category: 'Lead Generation', title: 'Get Event Signups', desc: 'Send registration links when users DM EVENT', icon: 'Calendar' },
    { id: 'get_collabs_stories', category: 'Lead Generation', title: 'Collabs from Story Replies', desc: 'Detect collaboration intent, collect brand details and budget', icon: 'Handshake' },
    { id: 'trigger_dms_live', category: 'Lead Generation', title: 'Trigger DMs During IG Live', desc: 'Collect leads directly from live video comments', icon: 'Video' },
    { id: 'auto_reply_comment_dm', category: 'Lead Generation', title: 'Auto-Reply to Comment in DM', desc: 'Send product catalog & buttons in DM after comment', icon: 'MessageCircle' },

    { id: 'sell_reel_comments', category: 'Sales & Offers', title: 'Sell from Reel Comments', desc: 'Match keywords on Reels to send checkout links', icon: 'ShoppingBag' },
    { id: 'send_affiliate_links', category: 'Sales & Offers', title: 'Send Affiliate Links', desc: 'Show product cards and send affiliate links on request', icon: 'Link' },

    { id: 'send_offers_live', category: 'Sales & Offers', title: 'Send Offers During Live', desc: 'Detect purchase intent on live comments and send checkout', icon: 'Tag' },
    { id: 'give_coupons_stories', category: 'Sales & Offers', title: 'Give Coupons in Stories', desc: 'Generate and send coupons for story interactions', icon: 'Ticket' },
    { id: 'dm_course', category: 'Sales & Offers', title: 'DM Your Course', desc: 'Send course details and pricing when users DM COURSE', icon: 'BookOpen' },
    { id: 'launch_new_product', category: 'Sales & Offers', title: 'Launch a New Product', desc: 'Send announcements and purchase links for a launch', icon: 'Rocket' },

    { id: 'grow_followers_comments_flow', category: 'Audience Growth', title: 'Grow Followers from Comments', desc: 'Verify follow status before giving a reward', icon: 'Users' },
    { id: 'follow_first_freebie', category: 'Audience Growth', title: 'Follow First Then Freebie', desc: 'Require a follow before sending a free resource', icon: 'Gift' },
    { id: 'run_giveaway', category: 'Audience Growth', title: 'Run a Giveaway', desc: 'Verify follows and comments for giveaway entries', icon: 'Trophy' },
    { id: 'grow_youtube', category: 'Audience Growth', title: 'Grow Your YouTube', desc: 'Send YouTube links and track subscriptions', icon: 'Youtube' },
    { id: 'grow_podcast', category: 'Audience Growth', title: 'Grow Your Podcast', desc: 'Send podcast links and track listeners', icon: 'Headphones' },
    { id: 'grow_ig_from_website', category: 'Audience Growth', title: 'Grow Instagram from Website', desc: 'Show CTA on website to track Instagram follows', icon: 'Globe' },
    { id: 'dm_new_follower', category: 'Audience Growth', title: 'DM to New Follower', desc: 'Welcome new followers with a brand intro and resource', icon: 'UserPlus' },
    { id: 'go_to_whatsapp', category: 'Audience Growth', title: 'Instagram to WhatsApp', desc: 'Send WhatsApp button and track clicks', icon: 'MessageCircle' },

    { id: 'all_dms', category: 'AI & Support', title: 'Respond to All DMs', desc: 'AI intent detection, FAQ matching, and agent handoff', icon: 'Bot' },
    { id: 'recognize_questions_ai', category: 'AI & Support', title: 'Recognize Questions with AI', desc: 'Search knowledge base and generate answers', icon: 'HelpCircle' },
    { id: 'answer_faqs_stories', category: 'AI & Support', title: 'Answer FAQs from Stories', desc: 'AI detects questions from story replies and answers', icon: 'MessageSquare' },
    { id: 'automate_conv_ai', category: 'AI & Support', title: 'Automate Conversations', desc: 'AI understands intent, collects info, and recommends', icon: 'Cpu' },
    { id: 'hide_negative_comments', category: 'AI & Support', title: 'Hide Negative Comments', desc: 'AI sentiment analysis to hide negative comments', icon: 'ShieldAlert' },
    { id: 'auto_thank_positive', category: 'AI & Support', title: 'Auto-Thank Positive Comments', desc: 'Like and thank positive comments automatically', icon: 'Heart' },
    { id: 'auto_like_positive_dms', category: 'AI & Support', title: 'Auto-Like Positive Messages', desc: 'Sentiment analysis to like positive DMs', icon: 'ThumbsUp' },
    { id: 'reply_story_mentions', category: 'AI & Support', title: 'Reply to Story Mentions', desc: 'Send thank you DMs and offers for mentions', icon: 'AtSign' },

    { id: 'comments', category: 'Advanced', title: 'Auto-DM Links from Comments', desc: 'Classic trigger to send links and track clicks from comments', icon: 'Link' },
    { id: 'auto_send_links_dm', category: 'Advanced', title: 'Auto-Send Links in DM', desc: 'Keyword trigger to send website links in DM', icon: 'Send' },
    { id: 'custom_flow', category: 'Advanced', title: 'Create a Custom Flow', desc: 'Start from scratch with triggers, conditions, and actions', icon: 'PlusCircle' }
  ].map((t, index) => ({ ...t, comingSoon: index >= 5 && t.id !== 'reply_story_mentions' }));

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'Story': return <Instagram size={18} />;
      case 'Email': return <Send size={18} />;
      case 'Phone': return <Phone size={18} />;
      case 'Calendar': return <Calendar size={18} />;
      case 'Handshake': return <Handshake size={18} />;
      case 'Video': return <Video size={18} />;
      case 'ShoppingBag': return <ShoppingBag size={18} />;
      case 'Link': return <LinkIcon size={18} />;
      case 'Megaphone': return <Megaphone size={18} />;
      case 'Tag': return <Tag size={18} />;
      case 'Ticket': return <Ticket size={18} />;
      case 'BookOpen': return <BookOpen size={18} />;
      case 'Rocket': return <Rocket size={18} />;
      case 'Users': return <Users size={18} />;
      case 'Gift': return <Gift size={18} />;
      case 'Trophy': return <Trophy size={18} />;
      case 'Youtube': return <Youtube size={18} />;
      case 'Smartphone': return <Smartphone size={18} />;
      case 'Headphones': return <Headphones size={18} />;
      case 'Globe': return <Globe size={18} />;
      case 'UserPlus': return <UserPlus size={18} />;
      case 'MessageCircle': return <MessageCircle size={18} />;
      case 'Bot': return <Bot size={18} />;
      case 'HelpCircle': return <HelpCircle size={18} />;
      case 'MessageSquare': return <MessageSquare size={18} />;
      case 'Cpu': return <Cpu size={18} />;
      case 'ShieldAlert': return <ShieldAlert size={18} />;
      case 'Heart': return <Heart size={18} />;
      case 'ThumbsUp': return <ThumbsUp size={18} />;
      case 'AtSign': return <AtSign size={18} />;
      case 'Send': return <Send size={18} />;
      case 'PlusCircle': return <PlusCircle size={18} />;
      default: return <Zap size={18} />;
    }
  };

  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--sidebar-bg)', fontFamily: "'Outfit', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Template Library</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Choose a pre-built automation to get started quickly.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/campaigns')}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid #7c3aed',
              color: 'var(--accent-color)',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.backgroundColor = 'var(--accent-color)';
              e.currentTarget.style.color = 'var(--bg-card)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              e.currentTarget.style.color = 'var(--accent-color)';
            }}
          >
            <Zap size={16} /> Active Automations
          </button>
          <button 
            onClick={() => navigate('/select-channel')}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Sidebar Categories */}
        <div style={{ width: '250px', padding: '32px 24px', borderRight: '1px solid var(--border-subtle)', height: 'calc(100vh - 85px)', position: 'sticky', top: '85px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeCategory === cat ? '#f3e8ff' : 'transparent',
                  color: activeCategory === cat ? 'var(--accent-color)' : 'var(--text-muted)',
                  fontWeight: activeCategory === cat ? '700' : '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                {cat}
                {cat !== 'All' && (
                  <span style={{ 
                    fontSize: '11px', 
                    background: activeCategory === cat ? '#e9d5ff' : 'var(--bg-dark)', 
                    color: activeCategory === cat ? 'var(--accent-color)' : 'var(--text-muted)',
                    padding: '2px 8px', borderRadius: '10px' 
                  }}>
                    {templates.filter(t => t.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div style={{ flex: 1, padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  if (template.comingSoon) return;
                  if (template.id === 'faqs') {
                    navigate('/ai-studio');
                  } else if (template.id === 'all_dms') {
                    navigate(`/dm-automation-editor?channel=${channel}&template=${template.id}`);
                  } else {
                    navigate(`/automation-editor?channel=${channel}&template=${template.id}`);
                  }
                }}
                style={{
                  background: 'var(--bg-card)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  cursor: template.comingSoon ? 'default' : 'pointer',
                  opacity: template.comingSoon ? 0.7 : 1,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                }}
                onMouseEnter={(e) => {
                  if (template.comingSoon) return;
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                }}
                onMouseLeave={(e) => {
                  if (template.comingSoon) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '12px', 
                    background: template.category === 'AI & Support' ? '#faf5ff' : 'var(--sidebar-bg)',
                    color: template.category === 'AI & Support' ? '#a855f7' : '#3b82f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {getIcon(template.icon)}
                  </div>
                  <span style={{ 
                    fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', 
                    padding: '4px 8px', borderRadius: '6px',
                    background: 'var(--bg-dark)', color: 'var(--text-muted)', marginLeft: 'auto'
                  }}>
                    {template.category}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 8px 0' }}>
                    {template.title}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '0.9rem', margin: 0 }}>
                    {template.desc}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'center' }}>
                  <button 
                    disabled={template.comingSoon}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', 
                      background: template.comingSoon ? '#e2e8f0' : 'var(--accent-color)', 
                      color: template.comingSoon ? '#64748b' : '#fff', 
                      border: 'none', borderRadius: '8px',
                      padding: '10px 20px', fontSize: '13px', fontWeight: '700', 
                      cursor: template.comingSoon ? 'not-allowed' : 'pointer',
                      width: '100%', justifyContent: 'center', transition: 'opacity 0.2s'
                    }} 
                    onMouseOver={e => { if(!template.comingSoon) e.currentTarget.style.opacity = '0.9' }} 
                    onMouseOut={e => { if(!template.comingSoon) e.currentTarget.style.opacity = '1' }}
                  >
                    {template.comingSoon ? 'Coming Soon' : (
                      <>Use Template <Zap size={14} /></>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
