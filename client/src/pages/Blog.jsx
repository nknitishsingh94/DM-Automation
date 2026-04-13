import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, ArrowRight, Zap } from 'lucide-react';
import Footer from '../components/Footer';
import { blogPosts } from './blogData';

export default function Blog() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="blog-page-container">
      {/* Header Overlay */}
      <header className="landing-header">
        <div className="header-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-logo">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img src="/zenxchat-logo.png" alt="ZenXchat Logo" style={{ width: '32px', height: '32px' }} />
              <span className="logo-text" style={{ color: '#0f172a' }}>ZenXchat</span>
            </Link>
          </div>
          <nav className="header-nav">
            <Link to="/about">About</Link>
            <Link to="/resources">Resources</Link>
            <Link to="/#pricing">Pricing</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="blog-hero">
        <div className="blog-hero-content">
          <div className="hero-text-side">
            <span className="blog-badge animate-fade-in"><BookOpen size={16} /> ZenXchat Insights</span>
            <h1 className="animate-slide-up">The Future of <span>Conversational</span> Commerce</h1>
            <p className="animate-slide-up delay-1">
              Explore the latest trends in AI automation, social media growth strategies, and product updates from the ZenXchat team.
            </p>
          </div>
          <div className="hero-image-side animate-scale-in">
            <div className="blog-hero-img-wrapper">
              <img src="/blog-hero.png" alt="ZenXchat Blog Hero" className="blog-hero-main-img" />
              <div className="hero-img-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Stories Section */}
      <section className="featured-post-section">
        <div className="section-header">
          <h2>Latest Stories</h2>
          <div className="header-line"></div>
        </div>

        <div className="blog-grid">
          {blogPosts.map((post, index) => (
            <div key={post.id} className={`blog-card glass-morphism animate-slide-up delay-${index + 1}`}>
              <div className="card-image">
                <img src={post.image} alt={post.title} />
                <span className={`post-category ${post.color}`}>{post.category}</span>
              </div>
              <div className="card-content">
                <div className="post-meta">
                  <span><Calendar size={14} /> {post.date}</span>
                  <span><Clock size={14} /> {post.readTime}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="post-footer">
                  <div className="post-author">
                    <div className="author-avatar">{post.author.charAt(0)}</div>
                    <span>{post.author}</span>
                  </div>
                  <Link to={`/blog/${post.id}`} className="read-more-btn">
                    Read More <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories & Topics */}
      <section className="topics-section">
        <div className="topics-container glass-morphism">
          <h3>Browse by Topic</h3>
          <div className="topics-cloud">
            <button className="topic-tag">#AIautomation</button>
            <button className="topic-tag">#InstaGrowth</button>
            <button className="topic-tag">#CustomerSuccess</button>
            <button className="topic-tag">#ProductUpdates</button>
            <button className="topic-tag">#TechTrends</button>
            <button className="topic-tag">#SocialROI</button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="blog-newsletter">
        <div className="newsletter-box">
          <div className="newsletter-content">
            <div className="icon-badge"><Zap size={24} /></div>
            <h2>Stay ahead of the curve</h2>
            <p>Get the latest AI automation strategies delivered straight to your inbox.</p>
            <div className="newsletter-form">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe Now</button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog CTA Section */}
      <section className="article-cta">
        <div className="cta-content glass-morphism">
          <div className="cta-logo">
            <img src="/zenxchat-logo.png" alt="ZenXchat" />
            <span>ZenXchat</span>
          </div>
          <h2>Ready to automate your social growth?</h2>
          <p>Start your journey with ZenXchat today and see the results in real-time.</p>
          <Link to="/signup" className="cta-button pulse-animation">
            Get Started Now
          </Link>
        </div>
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .blog-page-container {
          background: #f8fafc;
          min-height: 100vh;
        }

        .blog-hero {
          padding: 160px 20px 80px;
          background: linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%);
          position: relative;
          overflow: hidden;
        }

        .blog-hero-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .hero-text-side h1 {
          font-size: 3.5rem;
          color: #0f172a;
          margin: 20px 0;
          line-height: 1.1;
          font-weight: 800;
        }

        .hero-text-side h1 span {
          background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-text-side p {
          font-size: 1.2rem;
          color: #475569;
          max-width: 500px;
        }

        .blog-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
          border-radius: 100px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .blog-hero-img-wrapper {
          position: relative;
          border-radius: 30px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.25);
        }

        .blog-hero-main-img {
          width: 100%;
          display: block;
          transition: transform 0.5s;
        }

        .blog-hero-img-wrapper:hover .blog-hero-main-img {
          transform: scale(1.05);
        }

        .featured-post-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px 100px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 50px;
        }

        .section-header h2 {
          font-size: 2rem;
          color: #0f172a;
          white-space: nowrap;
        }

        .header-line {
          height: 1px;
          background: #e2e8f0;
          flex: 1;
        }

        .blog-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
        }

        .blog-card {
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.5);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .blog-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
        }

        .card-image {
          height: 220px;
          position: relative;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-category {
          position: absolute;
          top: 20px;
          left: 20px;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }

        .post-category.purple { background: #8b5cf6; }
        .post-category.blue { background: #3b82f6; }
        .post-category.pink { background: #d946ef; }

        .card-content {
          padding: 30px;
        }

        .post-meta {
          display: flex;
          gap: 20px;
          color: #64748b;
          font-size: 0.85rem;
          margin-bottom: 15px;
        }

        .post-meta span {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .card-content h3 {
          font-size: 1.4rem;
          color: #0f172a;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .card-content p {
          color: #475569;
          font-size: 1rem;
          margin-bottom: 25px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .post-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
        }

        .post-author {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .author-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
          color: #64748b;
        }

        .read-more-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #8b5cf6;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .topics-section {
          max-width: 1200px;
          margin: 0 auto 100px;
          padding: 0 20px;
        }

        .topics-container {
          padding: 50px;
          text-align: center;
          border-radius: 30px;
        }

        .topics-container h3 {
          font-size: 1.8rem;
          margin-bottom: 30px;
          color: #0f172a;
        }

        .topics-cloud {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }

        .topic-tag {
          padding: 12px 24px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 100px;
          font-weight: 600;
          color: #475569;
          transition: all 0.3s;
        }

        .topic-tag:hover {
          border-color: #8b5cf6;
          color: #8b5cf6;
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -10px rgba(139, 92, 246, 0.2);
        }

        .blog-newsletter {
          max-width: 1200px;
          margin: 0 auto 100px;
          padding: 0 20px;
        }

        .newsletter-box {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border-radius: 40px;
          padding: 80px 20px;
          text-align: center;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .icon-badge {
          width: 60px;
          height: 60px;
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px;
        }

        .newsletter-box h2 {
          font-size: 2.5rem;
          margin-bottom: 15px;
        }

        .newsletter-box p {
          color: #94a3b8;
          font-size: 1.1rem;
          margin-bottom: 40px;
        }

        .newsletter-form {
          max-width: 500px;
          margin: 0 auto;
          display: flex;
          gap: 12px;
        }

        .newsletter-form input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px 20px;
          color: white;
          outline: none;
        }

        .newsletter-form button {
          background: #8b5cf6;
          color: white;
          padding: 16px 30px;
          border-radius: 12px;
          font-weight: 700;
          transition: background 0.3s;
        }

        .newsletter-form button:hover {
          background: #7c3aed;
        }

        /* Animations */
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.8s ease-out forwards; }
        .animate-scale-in { animation: scaleIn 0.8s ease-out forwards; }

        .delay-1 { animation-delay: 0.2s; opacity: 0; }
        .delay-2 { animation-delay: 0.4s; opacity: 0; }
        .delay-3 { animation-delay: 0.6s; opacity: 0; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .article-cta {
          max-width: 1200px;
          margin: 0 auto 100px;
          padding: 0 20px;
        }

        .cta-content {
          padding: 80px 40px;
          text-align: center;
          border-radius: 40px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(217, 70, 239, 0.05) 100%);
          border: 1px solid rgba(139, 92, 246, 0.2);
          position: relative;
          overflow: hidden;
        }

        .cta-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 25px;
        }

        .cta-logo img {
          width: 50px;
          height: 50px;
        }

        .cta-logo span {
          font-size: 2.2rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #0f172a 0%, #4c1d95 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          color: #0f172a;
          margin-bottom: 15px;
          font-weight: 800;
        }

        .cta-content p {
          color: #64748b;
          font-size: 1.2rem;
          max-width: 600px;
          margin: 0 auto 40px;
        }

        .cta-button {
          display: inline-block;
          padding: 18px 45px;
          background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
          color: white;
          border-radius: 100px;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 20px 40px -10px rgba(139, 92, 246, 0.4);
          transition: all 0.3s;
          text-decoration: none;
        }

        .cta-button:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -12px rgba(139, 92, 246, 0.5);
        }

        .pulse-animation {
          animation: pulseShadow 2s infinite;
        }

        @keyframes pulseShadow {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(139, 92, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }

        @media (max-width: 968px) {
          .blog-hero-content {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 40px;
          }
          .hero-text-side h1 { font-size: 2.5rem; }
          .hero-text-side p { margin: 0 auto; }
          .newsletter-form { flex-direction: column; }
        }
      `}} />
    </div>
  );
}
