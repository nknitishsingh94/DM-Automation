import React from 'react';
import { createPortal } from 'react-dom';
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
  { id: "run_giveaway", title: "Run a giveaway", desc: "Run a giveaway to grow Instagram followers. People love free stuff, and they'll happily engage with your content to get it", type: "Flow Builder", upgrade: true },
  { id: "grow_followers_comments_flow", title: "Grow followers from comments", desc: "Incentivize a follow to grow your account", type: "Flow Builder" },
  { id: "grow_youtube", title: "Grow your YouTube", desc: "Get YouTube subscribers via IG DMs. Turn your IG audience into YouTube subscribers without begging. Just sneak that subscribe CTA into your DMs", type: "Flow Builder" },
  { id: "recognize_questions_ai", title: "Recognize questions in DM with AI", desc: "Identify and respond to common user inquiries", type: "Flow Builder", ai: true, upgrade: true },
  { id: "get_collabs_stories", title: "Get more collabs from Story replies", desc: "When your Story sparks collab requests, your automation's got answers so you don't have to copy-paste all day", type: "Flow Builder" },
  { id: "give_coupons_stories", title: "Give coupons in stories", desc: "Someone watched your story? Treat 'em like a VIP with a secret DM coupon", type: "Flow Builder" },
  { id: "go_to_whatsapp", title: "Go from Instagram to WhatsApp", desc: "Get Instagram followers to move to WhatsApp", type: "Flow Builder" },
  { id: "send_offers_live", title: "Send offers in DMs during Live", desc: "Every missed moment is a missed sale - catch 'em while the vibes are hot", type: "Flow Builder" },
  { id: "sell_reel_comments", title: "Sell from Reel comments", desc: "A reel got people talking? Slide into their DMs with something worth buying", type: "Flow Builder" },
  { id: "dm_course", title: "DM your course like a closer", desc: "Give followers early access to a new launch. Let followers DM you for a sneak peek and serve your product instantly", type: "Flow Builder" },
  { id: "grow_sms_list", title: "Grow an SMS list", desc: "Did we just become text friends? Get Instagram followers on your SMS list", type: "Flow Builder" },
  { id: "trigger_dms_live", title: "Trigger DMs during IG Live", desc: "Use Lives to spark DMs, drop links, and collect leads while eyeballs are on you", type: "Flow Builder" },
  { id: "answer_faqs_stories", title: "Answer FAQs from story replies", desc: "Reply to your followers' questions ASAP", type: "Flow Builder" },
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

  const modalMarkup = (
    <div
      className="templates-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="templates-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="templates-modal-header">
          <div className="templates-modal-title-area">
            <h2 className="templates-modal-title">Templates Gallery</h2>
            <p className="templates-modal-subtitle">
              Discover ready-to-use automations for your business
            </p>
          </div>
          <div className="templates-modal-actions">
            <button
              className="templates-active-btn"
              onClick={() => {
                onClose();
                navigate('/campaigns');
              }}
            >
              <Zap size={14} /> <span>Active Automations</span>
            </button>
            <button
              className="templates-close-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="templates-modal-body">
          <div className="templates-grid">
            {templatesData.map((template, idx) => (
              <div
                key={idx}
                className={`template-item-card ${template.comingSoon ? 'coming-soon' : 'template-card-hover'}`}
                onClick={() => {
                  if (!template.comingSoon) handleUseTemplate(template);
                }}
              >
                <div className="template-card-top">
                  <div className="template-badges-wrap">
                    {template.recommended && (
                      <span className="badge-item badge-recommended">
                        ★ RECOMMENDED
                      </span>
                    )}
                    {template.upgrade && (
                      <span className="badge-item badge-upgrade">
                        <Crown size={10} /> UPGRADE
                      </span>
                    )}
                    {template.ai && (
                      <span className="badge-item badge-ai">
                        <Sparkles size={10} /> AI
                      </span>
                    )}
                  </div>

                  <div className={`template-type-icon ${template.type === 'Quick Automation' ? 'icon-quick' : 'icon-flow'}`}>
                    {template.type === 'Quick Automation' ? (
                      <Zap size={16} />
                    ) : (
                      <Waypoints size={16} />
                    )}
                  </div>
                </div>

                <h3 className="template-card-title">
                  {template.title}
                </h3>

                <p className="template-card-desc">
                  {template.desc}
                </p>

                <div className="template-card-bottom">
                  <span className="template-type-tag">
                    {template.type}
                  </span>
                  <button
                    disabled={template.comingSoon}
                    onClick={(e) => {
                      if (template.comingSoon) {
                        e.stopPropagation();
                        return;
                      }
                      handleUseTemplate(template);
                    }}
                    className={`template-action-btn ${template.comingSoon ? 'btn-disabled' : 'btn-use'}`}
                  >
                    {template.comingSoon ? 'Coming Soon' : 'Use'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .templates-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          animation: templatesFadeIn 0.2s ease-out;
        }

        @keyframes templatesFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        .templates-modal-card {
          background: var(--bg-card);
          border-radius: 20px;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          max-height: 90dvh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
        }

        .templates-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
          flex-wrap: wrap;
          box-sizing: border-box;
        }

        .templates-modal-title-area {
          flex: 1 1 220px;
          min-width: 0;
        }

        .templates-modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.3;
          letter-spacing: -0.02em;
        }

        .templates-modal-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.84rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .templates-modal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .templates-active-btn {
          background: var(--bg-card);
          border: 1px solid #7c3aed;
          color: var(--accent-color);
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .templates-active-btn:hover {
          background: var(--accent-color);
          color: #ffffff;
        }

        .templates-close-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          padding: 6px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease, color 0.2s ease;
        }
        .templates-close-btn:hover {
          background: var(--bg-dark);
          color: var(--text-main);
        }

        .templates-modal-body {
          padding: 24px;
          overflow-y: auto;
          overflow-x: hidden;
          flex: 1;
          min-height: 0;
          background: var(--sidebar-bg);
          -webkit-overflow-scrolling: touch;
          box-sizing: border-box;
        }

        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
          width: 100%;
          box-sizing: border-box;
        }

        .template-item-card {
          border: 1px solid var(--border-subtle);
          border-radius: 14px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          background: var(--bg-card);
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          box-sizing: border-box;
        }
        .template-item-card.coming-soon {
          cursor: default;
          opacity: 0.7;
        }
        .template-item-card.template-card-hover {
          cursor: pointer;
        }
        .template-item-card.template-card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.12);
          border-color: #cbd5e1;
        }

        .template-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
        }

        .template-badges-wrap {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex: 1;
          min-width: 0;
        }

        .badge-item {
          font-size: 10px;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .badge-recommended {
          background-color: #fef3c7;
          color: #d97706;
        }
        .badge-upgrade {
          background-color: #fce7f3;
          color: #db2777;
        }
        .badge-ai {
          background-color: #ede9fe;
          color: var(--accent-color);
        }

        .template-type-icon {
          padding: 6px;
          border-radius: 8px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .icon-quick {
          color: #3b82f6;
          background: #eff6ff;
        }
        .icon-flow {
          color: #10b981;
          background: #ecfdf5;
        }

        .template-card-title {
          margin: 0 0 8px 0;
          font-size: 15px;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.35;
          word-break: break-word;
        }

        .template-card-desc {
          margin: 0;
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
          flex: 1;
          word-break: break-word;
        }

        .template-card-bottom {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .template-type-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .template-action-btn {
          border: none;
          border-radius: 8px;
          padding: 7px 16px;
          font-size: 12px;
          font-weight: 700;
          transition: opacity 0.2s ease, transform 0.1s ease;
        }
        .template-action-btn.btn-use {
          background-color: var(--accent-color);
          color: #ffffff;
          cursor: pointer;
        }
        .template-action-btn.btn-use:hover {
          opacity: 0.92;
          transform: scale(1.02);
        }
        .template-action-btn.btn-disabled {
          background-color: #e2e8f0;
          color: #64748b;
          cursor: not-allowed;
        }

        /* --- Mobile Optimization --- */
        @media (max-width: 640px) {
          .templates-modal-backdrop {
            padding: 8px;
            align-items: center;
          }
          .templates-modal-card {
            max-height: 94vh;
            max-height: 94dvh;
            border-radius: 16px;
            width: 100%;
          }
          .templates-modal-header {
            padding: 14px 16px;
            gap: 10px;
          }
          .templates-modal-title {
            font-size: 1.1rem;
          }
          .templates-modal-subtitle {
            font-size: 0.78rem;
          }
          .templates-active-btn {
            padding: 6px 10px;
            font-size: 0.76rem;
          }
          .templates-modal-body {
            padding: 12px;
          }
          .templates-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .template-item-card {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalMarkup, document.body);
}
