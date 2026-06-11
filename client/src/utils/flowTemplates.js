export const getTemplateData = (templateId) => {
  switch (templateId) {
    case 'automate_conv_ai':
      return {
        name: 'AI Conversation Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'HI' } },
          { id: '2', type: 'ai', position: { x: 250, y: 200 }, data: { } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'auto_reply_dm':
      return {
        name: 'Auto-reply to DM',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'MENU' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Here is our product lineup! \n1. Product A\n2. Product B" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'auto_send_links_dm':
      return {
        name: 'Auto-send Website Link',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'LINK' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Hey! Here's the link to my website: https://example.com" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'follow_first_freebie':
      return {
        name: 'Follow for Freebie',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'FREEBIE' } },
          { id: '2', type: 'condition', position: { x: 250, y: 200 }, data: { condition: 'Is Follower' } },
          { id: '3', type: 'message', position: { x: 50, y: 350 }, data: { text: "Here is your freebie! Enjoy 🎁" } },
          { id: '4', type: 'message', position: { x: 450, y: 350 }, data: { text: "Please follow us first to get the freebie! 😊" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true' },
          { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false' }
        ]
      };
    case 'grow_email_list':
      return {
        name: 'Email List Builder',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'EMAIL' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Awesome! What's your best email address?" } },
          { id: '3', type: 'condition', position: { x: 250, y: 350 }, data: { condition: 'Wait for Reply' } },
          { id: '4', type: 'message', position: { x: 250, y: 500 }, data: { text: "Got it! We've sent the details to your inbox." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' }
        ]
      };
    case 'run_giveaway':
      return {
        name: 'Giveaway Automation',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'WIN' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "You're entered into the giveaway! 🎉 Want an extra entry? Share this to your story." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'grow_followers_comments_flow':
      return {
        name: 'Comment to Follow Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'GIFT', publicReplyText: 'Check DMs! 🚀' } },
          { id: '2', type: 'condition', position: { x: 250, y: 200 }, data: { condition: 'Is Follower' } },
          { id: '3', type: 'message', position: { x: 50, y: 350 }, data: { text: "Here is your gift! 🎁" } },
          { id: '4', type: 'message', position: { x: 450, y: 350 }, data: { text: "Please follow us to unlock the gift! 😊" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e2-4', source: '2', target: '4' }
        ]
      };
    case 'grow_youtube':
      return {
        name: 'YouTube Subscriber Growth',
        nodes: [
          { 
            id: '1', 
            type: 'trigger', 
            position: { x: 50, y: 150 }, 
            data: { 
              title: "When...",
              text: "User comments on your Post or Reel",
              noteBottom: "Your trigger here will be 'User comments on post or Reel'"
            } 
          },
          { 
            id: '2', 
            type: 'message', 
            position: { x: 450, y: 100 }, 
            data: { 
              title: "Instagram\nSend Message",
              text: "Hey! The full video is on my YouTube channel right now!\n\nTo watch it (and so you don't miss a new video drop), subscribe to my channel 👇",
              noteTop: "This is the first message a follower sees in their DMs. Personalize this message so your follower is excited to click to the next step.\nWe use a button here to open to your YouTube channel.",
              noteBottom: "Make sure you update this\n'Subscribe' button URL so it opens\nto your YouTube channel",
              buttons: [
                { id: 'b1', text: 'Subscribe 🔗', type: 'url' },
                { id: 'b2', text: 'Help! 🆘', type: 'reply' }
              ]
            } 
          },
          { 
            id: '3', 
            type: 'message', 
            position: { x: 800, y: 120 }, 
            data: { 
              title: "Instagram\nSend Message #1",
              text: "Did you have any trouble subscribing?\nLooking for another video? Let me know!",
              noteTop: "If they tap 'Help!', this is the\nmessage they'll receive. They can\ntype their message to you, and you\ncan reply when you're online."
            } 
          }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', sourceHandle: 'b2', target: '3' }
        ]
      };
    case 'recognize_questions_ai':
      return {
        name: 'AI FAQ Agent',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'QUESTION' } },
          { id: '2', type: 'ai', position: { x: 250, y: 200 }, data: { } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'get_collabs_stories':
      return {
        name: 'Story Collab Manager',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'COLLAB' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Hey! We'd love to chat about a collab. Please send your media kit to collab@example.com" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'give_coupons_stories':
      return {
        name: 'Story VIP Coupon',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'VIP' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Here is your secret VIP coupon code: VIP20 💸" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'go_to_whatsapp':
      return {
        name: 'Move to WhatsApp',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'WHATSAPP' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Let's chat on WhatsApp! Click here to message me: https://wa.me/..." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'send_offers_live':
      return {
        name: 'Live Offers',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'LIVE' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Thanks for joining the Live! Here is the special offer link as promised: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'sell_reel_comments':
      return {
        name: 'Sell from Reel',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'BUY', publicReplyText: 'Sent you a DM! 🛒' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Here is the link to purchase the item from the reel! 🛍️" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'dm_course':
      return {
        name: 'Course Launch Early Access',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'COURSE' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "You're in! Here is your exclusive early access link to the course: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'grow_sms_list':
      return {
        name: 'Grow SMS List',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'TEXT' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Awesome! What's your phone number so we can text you?" } },
          { id: '3', type: 'condition', position: { x: 250, y: 350 }, data: { condition: 'Wait for Reply' } },
          { id: '4', type: 'message', position: { x: 250, y: 500 }, data: { text: "Got it! You're added to our SMS list. 📱" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', target: '4' }
        ]
      };
    case 'trigger_dms_live':
      return {
        name: 'IG Live Lead Gen',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'JOIN' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Hey! Drop your email below to get the resources we're talking about on the Live." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'answer_faqs_stories':
      return {
        name: 'Story FAQ Bot',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'FAQ' } },
          { id: '2', type: 'ai', position: { x: 250, y: 200 }, data: { } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'sell_from_ads':
      return {
        name: 'Sell from Ads Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'AD' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Thanks for checking out our ad! Here's the link to buy with your exclusive discount: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'get_event_signups':
      return {
        name: 'Event Signups',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'EVENT' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "We're excited to see you! RSVP for the event here: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'hide_negative_comments':
      return {
        name: 'Hide Negative Comments',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: '*' } },
          { id: '2', type: 'ai', position: { x: 250, y: 200 }, data: { } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'grow_ig_from_website':
      return {
        name: 'Grow Instagram from Website',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'WEB' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Welcome from our website! Follow us here for daily updates." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'grow_podcast':
      return {
        name: 'Grow Podcast Audience',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'PODCAST' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Listen to our latest episode here on Spotify or Apple Podcasts: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'grow_tiktok':
      return {
        name: 'Grow TikTok',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'TIKTOK' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Catch behind the scenes on our TikTok! Follow us here: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'dm_new_follower':
      return {
        name: 'Welcome New Follower',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'START' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "Welcome to our page! Thanks for the follow. If you have any questions, feel free to ask." } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'launch_new_product':
      return {
        name: 'New Product Launch',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'LAUNCH' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: "It's finally here! Check out our new product and get 10% off with this link: [LINK]" } }
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
    case 'custom_flow':
      return {
        name: 'Custom Automation Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'START' } }
        ],
        edges: []
      };
    default:
      return {
        name: 'New Automation Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { keyword: 'START' } },
          { id: '2', type: 'message', position: { x: 250, y: 200 }, data: { text: 'Welcome to our automation!' } },
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
  }
};
