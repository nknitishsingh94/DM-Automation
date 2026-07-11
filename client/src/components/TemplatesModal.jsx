import React from 'react';
import { X, Crown, Sparkles, Zap, Waypoints } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const templatesData = [
  { id: "auto_dm_links", title: "Auto-DM links from comments", desc: "Send a link when people comment on a post or reel", type: "Quick Automation", recommended: true },
  { id: "gen_leads_stories", title: "Generate leads with stories", desc: "Use limited-time offers in your Stories to convert leads", type: "Quick Automation" },
  { id: "respond_all_dms", title: "Respond to all your DMs", desc: "Auto-send customized replies when people DM you", type: "Quick Automation" },
  { id: "grow_followers_comments_quick", title: "Grow followers from comments", desc: "Incentivize a follow to grow your account", type: "Quick Automation", upgrade: true },
  { id: "send_affiliate_links", title: "Send affiliate product links", desc: "Include product card with photos and links of your affiliate collabs", type: "Quick Automation" },
  { id: "reply_story_mentions", title: "Reply to Story Mentions", desc: "Automatically respond when someone mentions you in their story.", type: "Quick Automation" },

  { id: "follow_first_freebie", title: "Follow first, then freebie", desc: "Wanna freebie? Gotta follow first. Reward the fans, not the lurkers.", type: "Flow Builder", upgrade: true },
  { id: "grow_email_list", title: "Grow your email list", desc: "Collect emails on Instagram with a freebie offer", type: "Flow Builder", upgrade: true },
  { id: "run_giveaway", title: "Run a giveaway", desc: "Run a giveaway to grow Instagram followers. Want your IG comment section to look like a Black Friday line? Run a giveaway. People love free stuff, and they’ll happily engage with your content to get it", type: "Flow Builder", upgrade: true },
  { id: "grow_followers_comments_flow", title: "Grow followers from comments", desc: "Incentivize a follow to grow your account", type: "Flow Builder" },
  { id: "grow_youtube", title: "Grow your YouTube", desc: "Get YouTube subscribers via IG DMs. Turn your IG audience into YouTube subscribers without begging. Just sneak that subscribe CTA into your DMs like a smooth operator", type: "Flow Builder" },
  { id: "recognize_questions_ai", title: "Recognize questions in DM with AI", desc: "Identify and respond to common user inquiries", type: "Flow Builder", ai: true, upgrade: true },
  { id: "get_collabs_stories", title: "Get more collabs from Story replies", desc: "When your Story sparks collab requests, your automation’s got answers — so you don’t have to copy-paste all day", type: "Flow Builder" },
  { id: "give_coupons_stories", title: "Give coupons in stories", desc: "Someone watched your story? Treat ‘em like a VIP with a secret DM coupon", type: "Flow Builder" },
  { id: "go_to_whatsapp", title: "Go from Instagram to WhatsApp", desc: "Get Instagram followers to move to WhatsApp", type: "Flow Builder" },
  { id: "send_offers_live", title: "Send offers in DMs during Live", desc: "Every “WHERE IS THIS FROM?” moment is a missed sale — unless your automation’s on it. Catch ‘em while the vibes are hot", type: "Flow Builder" },
  { id: "sell_reel_comments", title: "Sell from Reel comments", desc: "A reel got people talking? Slide into their DMs with something worth buying", type: "Flow Builder" },
  { id: "dm_course", title: "DM your course like a closer", desc: "Give followers early access to a new launch. Instagram launch day chaos? Not anymore. Let followers DM you for a sneak peek and serve up your new product instantly", type: "Flow Builder" },
  { id: "grow_sms_list", title: "Grow an SMS list", desc: "Did we just become text friends? Get Instagram followers on your SMS list", type: "Flow Builder" },
  { id: "trigger_dms_live", title: "Trigger DMs during IG Live", desc: "Use Lives to spark DMs, drop links, and collect leads while eyeballs are actually on you", type: "Flow Builder" },
  { id: "answer_faqs_stories", title: "Answer FAQs from story replies", desc: "Reply to your followers’ questions ASAP", type: "Flow Builder" },
  { id: "auto_thank_positive_comments", title: "Auto Thank Positive Comments", desc: "Show appreciation by automatically thanking users who leave positive comments.", type: "Quick Automation" },
  { id: "auto_like_positive_messages", title: "Auto Like Positive Messages", desc: "Automatically like every positive message to show appreciation and boost engagement.", type: "Quick Automation" },

  { id: "get_event_signups", title: "Get Event Signups", desc: "Automatically send event details and registration links to interested users via DMs.", type: "Flow Builder" },
  { id: "hide_negative_comments", title: "Hide Negative Comments", desc: "Automatically hide or filter out negative comments to maintain a positive community.", type: "Flow Builder", ai: true, upgrade: true },
  { id: "grow_ig_from_website", title: "Grow Instagram from Website", desc: "Convert website visitors into Instagram followers by sending follow links via DMs.", type: "Flow Builder" },
  { id: "grow_podcast", title: "Grow Your Podcast", desc: "Expand your podcast audience by automatically sharing episodes and subscription links.", type: "Flow Builder" },
  { id: "dm_new_follower", title: "DM to New Follower", desc: "Automatically send a welcome message to new followers to build engagement and connection.", type: "Flow Builder" },
  { id: "launch_new_product", title: "Launch a New Product", desc: "Announce and promote new product launches by sending exclusive offers and links to your audience.", type: "Flow Builder" },
  { id: "custom_flow", title: "Create a Custom Flow", desc: "Create a completely custom automations flow from the ground up.", type: "Flow Builder" },
].map((t, idx) => ({ ...t, comingSoon: idx >= 5 && t.id !== 'reply_story_mentions' }));

export default function TemplatesModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleUseTemplate = (template) => {
    onClose();
    if (template.type === 'Quick Automation') {
      navigate(`/automation-editor/new?template=${template.id}`);
    } else {
      navigate(`/flow-builder/new?template=${template.id}`);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '16px', width: '100%', maxWidth: '1000px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>Templates Gallery</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Discover ready-to-use automations for your business</p>
          </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              onClose();
              navigate('/campaigns');
            }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid #7c3aed',
              color: 'var(--accent-color)',
              padding: '8px 16px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
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
            <Zap size={14} /> Active Automations
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-dark)'} onMouseOut={e => e.currentTarget.style.background = 'none'}>
            <X size={24} />
          </button>
        </div>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--sidebar-bg)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {templatesData.map((template, idx) => (
              <div key={idx} style={{
                border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '20px',
                display: 'flex', flexDirection: 'column', background: 'var(--bg-card)',
                transition: 'all 0.2s ease', cursor: template.comingSoon ? 'default' : 'pointer',
                opacity: template.comingSoon ? 0.7 : 1,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }} className={template.comingSoon ? '' : 'template-card-hover'} onClick={() => {
                if(!template.comingSoon) handleUseTemplate(template);
              }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {template.recommended && (
                      <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.05em' }}>
                        ★ RECOMMENDED
                      </span>
                    )}
                    {template.upgrade && (
                      <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#fce7f3', color: '#db2777', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.05em' }}>
                        <Crown size={10} /> UPGRADE
                      </span>
                    )}
                    {template.ai && (
                      <span style={{ fontSize: '10px', fontWeight: '800', backgroundColor: '#ede9fe', color: 'var(--accent-color)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', letterSpacing: '0.05em' }}>
                        <Sparkles size={10} /> AI
                      </span>
                    )}
                  </div>
                  
                  {template.type === 'Quick Automation' ? (
                    <div style={{ color: '#3b82f6', background: '#eff6ff', padding: '6px', borderRadius: '8px' }} title="Quick Automation"><Zap size={16} /></div>
                  ) : (
                    <div style={{ color: '#10b981', background: '#ecfdf5', padding: '6px', borderRadius: '8px' }} title="Flow Builder"><Waypoints size={16} /></div>
                  )}
                </div>

                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {template.title}
                </h3>
                
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5', flex: 1 }}>
                  {template.desc}
                </p>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {template.type}
                  </span>
                  <button 
                    disabled={template.comingSoon}
                    onClick={(e) => {
                      if(template.comingSoon) {
                        e.stopPropagation();
                        return;
                      }
                      handleUseTemplate(template);
                    }}
                    style={{
                    backgroundColor: template.comingSoon ? '#e2e8f0' : 'var(--accent-color)', 
                    color: template.comingSoon ? '#64748b' : '#fff', 
                    border: 'none', borderRadius: '8px',
                    padding: '8px 16px', fontSize: '12px', fontWeight: '700', 
                    cursor: template.comingSoon ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s'
                  }} onMouseOver={e => { if(!template.comingSoon) e.currentTarget.style.opacity = '0.9' }} onMouseOut={e => { if(!template.comingSoon) e.currentTarget.style.opacity = '1' }}>
                    {template.comingSoon ? 'Coming Soon' : 'Use'}
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .template-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>
    </div>
  );
}
