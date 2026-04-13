import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Instagram, Twitter, MessageSquare } from 'lucide-react';
import { blogPosts } from './blogData';
import Footer from '../components/Footer';

export default function BlogPost() {
  const { id } = useParams();
  const post = blogPosts.find(p => p.id === parseInt(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (!post) {
    return (
      <div className="error-container">
        <h2>Post Not Found</h2>
        <Link to="/blog">Back to Blog</Link>
      </div>
    );
  }

  const relatedPosts = blogPosts.filter(p => p.id !== post.id).slice(0, 2);

  return (
    <div className="article-page-container">
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

      {/* Article Hero */}
      <section className="article-hero" style={{ backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url(${post.image})` }}>
        <div className="article-hero-content">
          <Link to="/blog" className="back-link">
            <ArrowLeft size={18} /> Back to Blog
          </Link>
          <span className={`post-category ${post.color}`}>{post.category}</span>
          <h1 className="animate-slide-up">{post.title}</h1>
          <div className="post-meta animate-fade-in">
            <div className="author-info">
              <div className="author-avatar">{post.author.charAt(0)}</div>
              <span>{post.author}</span>
            </div>
            <div className="meta-sep"></div>
            <span><Calendar size={16} /> {post.date}</span>
            <div className="meta-sep"></div>
            <span><Clock size={16} /> {post.readTime}</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="article-main">
        <div className="article-layout">
          {/* Share Sidebar */}
          <aside className="share-sidebar">
            <div className="sticky-share">
              <span>Share</span>
              <button className="share-btn"><Share2 size={18} /></button>
              <button className="share-btn"><Facebook size={18} /></button>
              <button className="share-btn"><Twitter size={18} /></button>
              <button className="share-btn"><Instagram size={18} /></button>
            </div>
          </aside>

          {/* Article Full Content */}
          <article className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />

          {/* Sidebar Widgets */}
          <aside className="article-widgets">
            <div className="widget newsletter-widget glass-morphism">
              <h4>Weekly Insights</h4>
              <p>Join 5,000+ creators getting AI strategies every week.</p>
              <input type="email" placeholder="Your email" />
              <button>Subscribe</button>
            </div>
          </aside>
        </div>
      </main>

      {/* Related Posts Section */}
      <section className="related-section">
        <div className="related-container">
          <h3>Continue Reading</h3>
          <div className="related-grid">
            {relatedPosts.map(p => (
              <Link key={p.id} to={`/blog/${p.id}`} className="related-card glass-morphism">
                <div className="related-thumb">
                  <img src={p.image} alt={p.title} />
                </div>
                <div className="related-info">
                  <h4>{p.title}</h4>
                  <div className="related-meta">
                    <span>{p.date}</span>
                    <span>{p.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Post CTA Section */}
      <section className="article-cta">
        <div className="cta-content glass-morphism">
          <div className="cta-logo">
            <img src="/zenxchat-logo.png" alt="ZenXchat" />
            <span>ZenXchat</span>
          </div>
          <h2>Ready to transform your social presence?</h2>
          <p>Join thousands of creators using ZenXchat to automate their engagement and grow their business.</p>
          <Link to="/signup" className="cta-button pulse-animation">
            Get Started Now
          </Link>
        </div>
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        .article-page-container {
          background: #ffffff;
          min-height: 100vh;
        }

        .article-hero {
          height: 60vh;
          min-height: 450px;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: white;
          padding: 100px 20px 40px;
        }

        .article-hero-content {
          max-width: 900px;
          width: 100%;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          margin-bottom: 30px;
          font-size: 0.9rem;
          transition: color 0.3s;
        }

        .back-link:hover { color: white; }

        .article-hero-content h1 {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 20px 0 30px;
          line-height: 1.1;
        }

        .post-category {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
        }
        .post-category.purple { background: #8b5cf6; }
        .post-category.blue { background: #3b82f6; }
        .post-category.pink { background: #d946ef; }

        .post-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .author-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .author-avatar {
          width: 36px;
          height: 36px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .meta-sep {
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
        }

        .article-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 20px;
        }

        .article-layout {
          display: grid;
          grid-template-columns: 80px 1fr 300px;
          gap: 60px;
        }

        .sticky-share {
          position: sticky;
          top: 120px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }

        .sticky-share span {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 5px;
        }

        .share-btn {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          transition: all 0.3s;
        }

        .share-btn:hover {
          background: #f8fafc;
          color: #8b5cf6;
          border-color: #8b5cf6;
        }

        .article-content {
          font-size: 1.15rem;
          line-height: 1.8;
          color: #334155;
        }

        .article-content h2 {
          font-size: 2rem;
          color: #0f172a;
          margin: 50px 0 25px;
        }

        .article-content h3 {
          font-size: 1.5rem;
          color: #0f172a;
          margin: 40px 0 20px;
        }

        .article-content p {
          margin-bottom: 25px;
        }

        .article-content ul, .article-content ol {
          margin: 30px 0;
          padding-left: 20px;
        }

        .article-content li {
          margin-bottom: 15px;
        }

        .highlight-box {
          margin: 40px 0;
          padding: 40px;
          background: #f5f3ff;
          border-left: 5px solid #8b5cf6;
          border-radius: 0 16px 16px 0;
          font-size: 1.4rem;
          font-style: italic;
          font-weight: 600;
          color: #4c1d95;
          line-height: 1.4;
        }

        .article-widgets {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .widget {
          padding: 30px;
          border-radius: 20px;
        }

        .newsletter-widget {
          background: #f8fafc;
          text-align: center;
        }

        .newsletter-widget h4 {
          font-size: 1.25rem;
          margin-bottom: 10px;
        }

        .newsletter-widget p {
          font-size: 0.9rem;
          color: #64748b;
          margin-bottom: 20px;
        }

        .newsletter-widget input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 12px;
          outline: none;
        }

        .newsletter-widget button {
          width: 100%;
          padding: 12px;
          background: #8b5cf6;
          color: white;
          border-radius: 8px;
          font-weight: 600;
        }

        .related-section {
          background: #f8fafc;
          padding: 100px 20px;
        }

        .related-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .related-container h3 {
          font-size: 2rem;
          margin-bottom: 40px;
          text-align: center;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
        }

        .related-card {
          display: flex;
          gap: 20px;
          padding: 20px;
          border-radius: 20px;
          background: white;
          transition: transform 0.3s;
        }

        .related-card:hover {
          transform: translateY(-5px);
        }

        .related-thumb {
          width: 150px;
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .related-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .related-info h4 {
          font-size: 1.1rem;
          margin-bottom: 10px;
          line-height: 1.4;
        }

        .related-meta {
          font-size: 0.8rem;
          color: #94a3b8;
          display: flex;
          gap: 15px;
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
          .article-layout {
            grid-template-columns: 1fr;
          }
          .share-sidebar { display: none; }
          .article-hero-content h1 { font-size: 2.5rem; }
          .related-grid { grid-template-columns: 1fr; }
        }
      `}} />
    </div>
  );
}
