import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Crown, Sparkles, Zap, Waypoints, Search, ArrowRight, 
  CheckCircle2, Flame, Layers, Bot, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const templatesData = [
  { id: "auto_dm_links", title: "Auto-DM links from comments", desc: "Send a direct message with your links whenever users comment on your posts or reels.", type: "Quick Automation", recommended: true, category: "quick" },
  { id: "gen_leads_stories", title: "Generate leads with stories", desc: "Capture qualified leads by sharing exclusive story deals and auto-messaging respondents.", type: "Quick Automation", category: "quick" },
  { id: "respond_all_dms", title: "Respond to all your DMs", desc: "Provide 24/7 instant smart replies to incoming Instagram and multi-channel DMs.", type: "Quick Automation", category: "quick" },
  { id: "grow_followers_comments_quick", title: "Grow followers from comments", desc: "Incentivize visitors to hit follow before receiving exclusive resources in DMs.", type: "Quick Automation", upgrade: true, category: "quick" },
  { id: "send_affiliate_links", title: "Send affiliate product links", desc: "Automatically share verified affiliate product cards and commission links.", type: "Quick Automation", category: "quick" },
  { id: "reply_story_mentions", title: "Reply to Story Mentions", desc: "Instantly thank users and send discount vouchers when they tag you in stories.", type: "Quick Automation", category: "quick" },

  { id: "follow_first_freebie", title: "Follow first, then freebie", desc: "Verify profile follow status automatically before sending the download link.", type: "Flow Builder", upgrade: true, category: "flows" },
  { id: "grow_email_list", title: "Grow your email list", desc: "Collect emails directly within Instagram DMs and sync them with your CRM.", type: "Flow Builder", upgrade: true, category: "flows" },
  { id: "run_giveaway", title: "Run a viral giveaway", desc: "Automate giveaway verification, comments tracking, and lucky draw selections.", type: "Flow Builder", upgrade: true, category: "flows" },
  { id: "grow_followers_comments_flow", title: "Grow followers from comments", desc: "Multi-step flow that checks follow status and provides tailored rewards.", type: "Flow Builder", category: "flows" },
  { id: "grow_youtube", title: "Grow your YouTube channel", desc: "Turn Instagram fans into loyal YouTube subscribers with direct smart links in DMs.", type: "Flow Builder", category: "flows" },
  { id: "recognize_questions_ai", title: "Recognize questions with AI", desc: "Use AI to understand inquiries, search your FAQs, and craft human-like answers.", type: "Flow Builder", ai: true, upgrade: true, category: "ai" },
  { id: "get_collabs_stories", title: "Get more collabs from Story replies", desc: "Qualify brand collaboration inquiries and collect budget details automatically.", type: "Flow Builder", category: "flows" },
  { id: "give_coupons_stories", title: "Give secret coupons in stories", desc: "Treat story viewers like VIPs with automated private promo codes.", type: "Flow Builder", category: "flows" },
  { id: "go_to_whatsapp", title: "Instagram to WhatsApp redirect", desc: "Seamlessly transition high-intent buyers from Instagram directly into WhatsApp.", type: "Flow Builder", category: "flows" },
  { id: "send_offers_live", title: "Send offers in DMs during Live", desc: "Capture real-time purchase intent during live streams and deliver checkout links.", type: "Flow Builder", category: "flows" },
  { id: "sell_reel_comments", title: "Sell directly from Reel comments", desc: "Trigger personalized DM checkouts when followers comment product keywords.", type: "Flow Builder", category: "flows" },
  { id: "dm_course", title: "DM your course like a closer", desc: "Give early-bird sneak peeks and enroll students on autopilot via Instagram DMs.", type: "Flow Builder", category: "flows" },
  { id: "grow_sms_list", title: "Grow an SMS phone list", desc: "Collect verified phone numbers for SMS marketing campaigns directly in chat.", type: "Flow Builder", category: "flows" },
  { id: "trigger_dms_live", title: "Trigger DMs during IG Live", desc: "Turn Live attendees into captured leads while engagement is at its peak.", type: "Flow Builder", category: "flows" },
  { id: "answer_faqs_stories", title: "Answer FAQs from story replies", desc: "Resolve common customer questions right inside their story replies.", type: "Flow Builder", category: "flows" },
  { id: "auto_thank_positive_comments", title: "Auto-thank positive comments", desc: "Delight your community by automatically acknowledging loving fan comments.", type: "Quick Automation", category: "quick" },
  { id: "auto_like_positive_messages", title: "Auto-like positive messages", desc: "Boost brand sentiment by automatically hearting positive incoming messages.", type: "Quick Automation", category: "quick" },

  { id: "get_event_signups", title: "Get event & webinar signups", desc: "Deliver webinar schedules, calendar invites, and reminder links via direct message.", type: "Flow Builder", category: "flows" },
  { id: "hide_negative_comments", title: "Hide negative / spam comments", desc: "AI sentiment filter that automatically hides toxic or spammy comments instantly.", type: "Flow Builder", ai: true, upgrade: true, category: "ai" },
  { id: "grow_ig_from_website", title: "Grow Instagram from website", desc: "Convert your website visitors into followers by sending customized follow links.", type: "Flow Builder", category: "flows" },
  { id: "grow_podcast", title: "Grow your podcast listeners", desc: "Automatically distribute latest episode links and platform subscription shortcuts.", type: "Flow Builder", category: "flows" },
  { id: "dm_new_follower", title: "DM to new followers", desc: "Welcome brand new followers warmly with your portfolio and featured resources.", type: "Flow Builder", category: "flows" },
  { id: "launch_new_product", title: "Launch a new product VIP", desc: "Build massive launch day momentum with exclusive VIP discount links.", type: "Flow Builder", category: "flows" },
  { id: "custom_flow", title: "Create custom automation", desc: "Design a fully bespoke automation journey from scratch with triggers and conditions.", type: "Flow Builder", category: "flows" },
].map((t, idx) => ({ ...t, comingSoon: idx >= 5 && t.id !== 'reply_story_mentions' }));

export default function TemplatesModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    return templatesData.filter((template) => {
      // Category filter
      if (activeTab === 'quick' && template.type !== 'Quick Automation') return false;
      if (activeTab === 'flows' && template.type !== 'Flow Builder') return false;
      if (activeTab === 'ai' && !template.ai) return false;
      if (activeTab === 'popular' && !template.recommended && !template.upgrade) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = template.title.toLowerCase().includes(query);
        const matchesDesc = template.desc.toLowerCase().includes(query);
        const matchesType = template.type.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesType;
      }

      return true;
    });
  }, [activeTab, searchQuery]);

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
      className="tm-backdrop"
      onClick={onClose}
    >
      <div
        className="tm-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Indicator */}
        <div className="tm-drag-handle" />

        {/* Header Section */}
        <div className="tm-header">
          <div className="tm-header-left">
            <div className="tm-title-badge-row">
              <h2 className="tm-title">Templates Gallery</h2>
              <span className="tm-count-chip">{templatesData.length} Ready</span>
            </div>
            <p className="tm-subtitle">
              Pre-built growth workflows tailored for Instagram & multi-channel automation
            </p>
          </div>

          <div className="tm-header-right">
            <button
              className="tm-campaigns-btn"
              onClick={() => {
                onClose();
                navigate('/campaigns');
              }}
              title="View your existing automations"
            >
              <Zap size={14} />
              <span>Active Flows</span>
            </button>

            <button
              className="tm-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="tm-controls-bar">
          <div className="tm-search-wrap">
            <Search size={16} className="tm-search-icon" />
            <input
              type="text"
              className="tm-search-input"
              placeholder="Search templates (e.g. DMs, story, comments)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="tm-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Horizontal Category Scroll Tabs */}
          <div className="tm-tabs-scroll">
            <button
              className={`tm-tab-pill ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <Layers size={13} /> All
            </button>
            <button
              className={`tm-tab-pill ${activeTab === 'popular' ? 'active' : ''}`}
              onClick={() => setActiveTab('popular')}
            >
              <Flame size={13} color="#f59e0b" /> Popular
            </button>
            <button
              className={`tm-tab-pill ${activeTab === 'quick' ? 'active' : ''}`}
              onClick={() => setActiveTab('quick')}
            >
              <Zap size={13} color="#3b82f6" /> Quick Auto
            </button>
            <button
              className={`tm-tab-pill ${activeTab === 'flows' ? 'active' : ''}`}
              onClick={() => setActiveTab('flows')}
            >
              <Waypoints size={13} color="#10b981" /> Flow Builder
            </button>
            <button
              className={`tm-tab-pill ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={13} color="#a855f7" /> AI Powered
            </button>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="tm-body">
          {filteredTemplates.length === 0 ? (
            <div className="tm-empty-state">
              <div className="tm-empty-icon">
                <Search size={28} />
              </div>
              <h4 className="tm-empty-title">No matching templates</h4>
              <p className="tm-empty-text">
                Try searching for different keywords or select another filter tab.
              </p>
              <button
                className="tm-empty-reset"
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="tm-grid">
              {filteredTemplates.map((template) => {
                const isQuick = template.type === 'Quick Automation';
                return (
                  <div
                    key={template.id}
                    className={`tm-card ${template.comingSoon ? 'is-coming-soon' : 'is-ready'}`}
                    onClick={() => {
                      if (!template.comingSoon) handleUseTemplate(template);
                    }}
                  >
                    {/* Top Row: Type Indicator & Badges */}
                    <div className="tm-card-top">
                      <div className="tm-card-type-tag">
                        <div className={`tm-icon-box ${isQuick ? 'icon-quick' : 'icon-flow'}`}>
                          {isQuick ? <Zap size={13} /> : <Waypoints size={13} />}
                        </div>
                        <span className="tm-type-text">{template.type}</span>
                      </div>

                      <div className="tm-badge-group">
                        {template.recommended && (
                          <span className="tm-badge badge-recommended">
                            ★ HOT
                          </span>
                        )}
                        {template.upgrade && (
                          <span className="tm-badge badge-pro">
                            <Crown size={9} /> PRO
                          </span>
                        )}
                        {template.ai && (
                          <span className="tm-badge badge-ai">
                            <Sparkles size={9} /> AI
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="tm-card-title">{template.title}</h3>

                    {/* Description */}
                    <p className="tm-card-desc">{template.desc}</p>

                    {/* Bottom Action Footer */}
                    <div className="tm-card-footer">
                      <div className="tm-meta-hint">
                        {template.comingSoon ? (
                          <span className="tm-status-soon">Coming Soon</span>
                        ) : (
                          <span className="tm-status-active">
                            <CheckCircle2 size={12} color="#10b981" /> 1-Click Launch
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={template.comingSoon}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!template.comingSoon) handleUseTemplate(template);
                        }}
                        className={`tm-use-btn ${template.comingSoon ? 'btn-disabled' : 'btn-active'}`}
                      >
                        <span>{template.comingSoon ? 'Soon' : 'Use'}</span>
                        {!template.comingSoon && <ArrowRight size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* ============================================================
           TEMPLATES GALLERY MODAL — ULTRA-PROFESSIONAL MOBILE-FIRST
           ============================================================ */

        .tm-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          box-sizing: border-box;
          animation: tmFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes tmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .tm-sheet {
          background: var(--bg-card);
          border-radius: 24px;
          width: 100%;
          max-width: 1040px;
          height: 88vh;
          max-height: 850px;
          display: flex;
          flex-direction: column;
          box-shadow: 
            0 25px 60px -15px rgba(0, 0, 0, 0.35),
            0 0 0 1px var(--border-subtle);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
          animation: tmSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes tmSlideUp {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }

        .tm-drag-handle {
          display: none;
        }

        /* --- Header --- */
        .tm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 28px 16px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-card);
          box-sizing: border-box;
        }

        .tm-header-left {
          flex: 1;
          min-width: 0;
        }

        .tm-title-badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tm-title {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: -0.025em;
          line-height: 1.25;
        }

        .tm-count-chip {
          display: inline-flex;
          align-items: center;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--accent-color);
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.25);
          padding: 3px 9px;
          border-radius: 20px;
          letter-spacing: 0.02em;
        }

        .tm-subtitle {
          margin: 5px 0 0 0;
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .tm-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .tm-campaigns-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          color: var(--text-main);
          padding: 8px 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .tm-campaigns-btn:hover {
          border-color: var(--accent-color);
          color: var(--accent-color);
          background: rgba(124, 58, 237, 0.06);
        }

        .tm-close-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .tm-close-btn:hover {
          background: var(--bg-dark);
          color: var(--text-main);
          border-color: #cbd5e1;
        }

        /* --- Search & Filter Bar --- */
        .tm-controls-bar {
          padding: 14px 28px;
          background: var(--sidebar-bg);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          gap: 16px;
          box-sizing: border-box;
          flex-wrap: wrap;
        }

        .tm-search-wrap {
          position: relative;
          flex: 1 1 240px;
          display: flex;
          align-items: center;
        }

        .tm-search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .tm-search-input {
          width: 100%;
          height: 38px;
          padding: 0 34px 0 36px;
          border-radius: 12px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-main);
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }
        .tm-search-input:focus {
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }

        .tm-search-clear {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tm-search-clear:hover {
          color: var(--text-main);
        }

        .tm-tabs-scroll {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 2px 0;
          flex-shrink: 0;
        }
        .tm-tabs-scroll::-webkit-scrollbar {
          display: none;
        }

        .tm-tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          border-radius: 10px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .tm-tab-pill:hover {
          border-color: #cbd5e1;
          color: var(--text-main);
        }
        .tm-tab-pill.active {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
        }

        /* --- Body & Grid --- */
        .tm-body {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          padding: 24px 28px;
          background: var(--sidebar-bg);
          box-sizing: border-box;
          -webkit-overflow-scrolling: touch;
        }

        .tm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          box-sizing: border-box;
        }

        /* --- Cards --- */
        .tm-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 18px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .tm-card.is-ready {
          cursor: pointer;
        }
        .tm-card.is-ready:hover {
          transform: translateY(-3px);
          border-color: #cbd5e1;
          box-shadow: 
            0 12px 28px -6px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(124, 58, 237, 0.2);
        }
        .tm-card.is-coming-soon {
          opacity: 0.68;
          cursor: default;
        }

        .tm-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .tm-card-type-tag {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .tm-icon-box {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tm-icon-box.icon-quick {
          background: #eff6ff;
          color: #2563eb;
        }
        .tm-icon-box.icon-flow {
          background: #ecfdf5;
          color: #059669;
        }

        .tm-type-text {
          font-size: 0.73rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .tm-badge-group {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .tm-badge {
          font-size: 0.68rem;
          font-weight: 800;
          padding: 3px 7px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 3px;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .badge-recommended {
          background: #fef3c7;
          color: #b45309;
        }
        .badge-pro {
          background: #fce7f3;
          color: #be185d;
        }
        .badge-ai {
          background: #ede9fe;
          color: #7c3aed;
        }

        .tm-card-title {
          margin: 0 0 8px 0;
          font-size: 1.02rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.35;
          letter-spacing: -0.015em;
        }

        .tm-card-desc {
          margin: 0;
          font-size: 0.83rem;
          color: var(--text-muted);
          line-height: 1.5;
          flex: 1;
        }

        .tm-card-footer {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .tm-status-active {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.74rem;
          font-weight: 700;
          color: #059669;
        }
        .tm-status-soon {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .tm-use-btn {
          border: none;
          border-radius: 10px;
          padding: 7px 15px;
          font-size: 0.8rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .tm-use-btn.btn-active {
          background: linear-gradient(135deg, var(--accent-color), #4f46e5);
          color: #ffffff;
          box-shadow: 0 3px 10px rgba(124, 58, 237, 0.28);
        }
        .tm-use-btn.btn-active:hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 14px rgba(124, 58, 237, 0.4);
        }
        .tm-use-btn.btn-disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* --- Empty State --- */
        .tm-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }
        .tm-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(124, 58, 237, 0.1);
          color: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }
        .tm-empty-title {
          margin: 0 0 6px 0;
          font-size: 1.1rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .tm-empty-text {
          margin: 0 0 18px 0;
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 320px;
        }
        .tm-empty-reset {
          background: var(--accent-color);
          color: #fff;
          border: none;
          padding: 8px 18px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
        }

        /* ============================================================
           MOBILE DEDICATED ARCHITECTURE & SCALING (<= 768px)
           ============================================================ */

        @media (max-width: 768px) {
          .tm-backdrop {
            padding: 0;
            align-items: flex-end; /* Mobile Bottom Sheet */
            background-color: rgba(15, 23, 42, 0.8);
          }

          .tm-sheet {
            height: 92vh;
            height: 92dvh;
            max-height: none;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-top-left-radius: 26px;
            border-top-right-radius: 26px;
            border-left: none;
            border-right: none;
            border-bottom: none;
            box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.35);
            animation: tmMobileSheetUp 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes tmMobileSheetUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }

          /* Native Mobile Drag Handle */
          .tm-drag-handle {
            display: block;
            width: 42px;
            height: 5px;
            background: #cbd5e1;
            border-radius: 10px;
            margin: 10px auto 2px;
            flex-shrink: 0;
          }

          /* Mobile Header */
          .tm-header {
            padding: 12px 18px 14px;
            gap: 12px;
          }

          .tm-title {
            font-size: 1.15rem;
          }

          .tm-count-chip {
            font-size: 0.68rem;
            padding: 2px 7px;
          }

          .tm-subtitle {
            font-size: 0.78rem;
            margin-top: 3px;
          }

          .tm-campaigns-btn {
            display: none; /* Hide secondary desktop action on mobile header to keep it clean */
          }

          .tm-close-btn {
            width: 32px;
            height: 32px;
          }

          /* Mobile Controls Bar */
          .tm-controls-bar {
            padding: 10px 18px 12px;
            gap: 10px;
          }

          .tm-search-wrap {
            flex: 1 1 100%;
          }

          .tm-search-input {
            height: 38px;
            font-size: 0.82rem;
            border-radius: 10px;
          }

          .tm-tabs-scroll {
            width: 100%;
            gap: 6px;
          }

          .tm-tab-pill {
            padding: 6px 11px;
            font-size: 0.75rem;
            border-radius: 8px;
          }

          /* Mobile Body & Grid */
          .tm-body {
            padding: 14px 18px 30px;
            padding-bottom: calc(30px + env(safe-area-inset-bottom));
          }

          .tm-grid {
            grid-template-columns: 1fr; /* Pure single column mobile layout */
            gap: 12px;
          }

          /* Mobile Card Sizing & Typography */
          .tm-card {
            padding: 15px 16px;
            border-radius: 16px;
            -webkit-tap-highlight-color: transparent;
          }

          .tm-card.is-ready:active {
            transform: scale(0.985); /* Touch tactile feedback */
            background: var(--bg-dark);
          }

          .tm-card-title {
            font-size: 0.96rem;
            margin-bottom: 6px;
          }

          .tm-card-desc {
            font-size: 0.8rem;
            line-height: 1.45;
            display: -webkit-box;
            -webkit-line-clamp: 2; /* Keep cards compact & uniform on mobile */
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .tm-card-footer {
            margin-top: 12px;
            padding-top: 10px;
          }

          .tm-status-active {
            font-size: 0.72rem;
          }

          .tm-use-btn {
            padding: 6px 13px;
            font-size: 0.76rem;
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalMarkup, document.body);
}
