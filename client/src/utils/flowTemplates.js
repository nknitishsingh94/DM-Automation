export const getTemplateData = (templateId) => {
  switch (templateId) {
    // LEAD GENERATION
    case 'gen_leads_stories':
      return {
        name: 'Generate Leads with Stories',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User replies to your Story" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Message", text: "Hey there! Thanks for replying to our story. Would you like to get access to our exclusive resource?", buttons: [{id: 'b1', text: 'Yes, please!', type: 'reply'}, {id: 'b2', text: 'No thanks', type: 'reply'}] } },
          { id: '3', type: 'message', position: { x: 700, y: 50 }, data: { title: "Send Message", text: "Awesome! What's your best email address so we can send it over?" } },
          { id: '4', type: 'condition', position: { x: 700, y: 200 }, data: { condition: 'Wait for Email Reply' } },
          { id: '5', type: 'message', position: { x: 1000, y: 200 }, data: { title: "CRM Action", text: "Got it! Your email has been saved to our CRM. Sending the resource now... 🚀", noteTop: "CRM Update & Notify Team simulated here." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', sourceHandle: 'b1', target: '3' },
          { id: 'e3-4', source: '3', target: '4' },
          { id: 'e4-5', source: '4', target: '5', sourceHandle: 'true' }
        ]
      };
    case 'grow_email_list':
      return {
        name: 'Grow Email List',
        nodes: [
          { 
            id: '1', 
            type: 'trigger', 
            position: { x: 50, y: 200 }, 
            data: { 
              title: "When...", 
              triggers: [
                { title: 'User sends a message', subtext: 'Message contains ebook' },
                { title: 'User comments on your Post or Reel', subtext: 'Post or Reel Comments #6' }
              ] 
            } 
          },
          { 
            id: '2', 
            type: 'message', 
            position: { x: 450, y: 150 }, 
            data: { 
              title: "Instagram\nSend Message", 
              text: "Hi! Thanks for reaching out 👋\n\nWe are excited you are interested in our content and the ebook, and we would LOVE to send you more!\n\nTo get a free ebook, please leave us your email below 👇", 
              waitAction: "Waiting for Email from contact...",
              customHandles: [
                {id: 'action', text: 'Action on reply', color: '#f59e0b'}, 
                {id: 'no_response', text: 'If contact has not responded', color: '#ef4444'}, 
                {id: 'next', text: 'Next step', color: '#3b82f6'}
              ] 
            } 
          },
          { 
            id: '3', 
            type: 'message', 
            position: { x: 950, y: 50 }, 
            data: { 
              title: "Instagram\nSend Message #2", 
              text: "Awesome!\n\nYou are all set.\n\nClick the link to grab your ebook 👇🚀", 
              buttons: [{id: 'b1', text: 'Grab the book! 📦', type: 'url'}] 
            } 
          },
          { 
            id: '4', 
            type: 'message', 
            position: { x: 950, y: 400 }, 
            data: { 
              title: "Instagram\nSend Message #3", 
              text: "Hi! Are you still here? 💙\n\nIf you are still interested in getting a free ebook, please leave us your email below 👇",
              waitAction: "Waiting for Email from contact...",
              customHandles: [
                {id: 'action', text: 'Action on reply', color: '#f59e0b', disabled: true}, 
                {id: 'no_response', text: 'If contact has not responded', color: '#ef4444', disabled: true}
              ] 
            } 
          }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', type: 'default', animated: false, style: { stroke: '#475569', strokeWidth: 2 } },
          { id: 'e2-3', source: '2', sourceHandle: 'next', target: '3', type: 'smoothstep', animated: false, style: { stroke: '#3b82f6', strokeWidth: 2 } },
          { id: 'e2-4', source: '2', sourceHandle: 'no_response', target: '4', type: 'smoothstep', animated: false, style: { stroke: '#ef4444', strokeWidth: 2 } }
        ]
      };
    case 'grow_sms_list':
      return {
        name: 'Grow an SMS List',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User messages keyword: TEXT" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Ask Phone", text: "Awesome! What's your phone number so we can text you updates?" } },
          { id: '3', type: 'condition', position: { x: 650, y: 150 }, data: { condition: 'Wait for Phone Number' } },
          { id: '4', type: 'message', position: { x: 950, y: 150 }, data: { title: "Confirm SMS", text: "You're added to our SMS list! 📱 Keep an eye out for our first text." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' },
          { id: 'e3-4', source: '3', sourceHandle: 'true', target: '4' }
        ]
      };
    case 'get_event_signups':
      return {
        name: 'Get Event Signups',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User messages keyword: EVENT" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Details", text: "We're excited to see you! RSVP for the event here and grab your ticket:", buttons: [{id: 'b1', text: 'Register Now', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'get_collabs_stories':
      return {
        name: 'Collabs from Story Replies',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User replies to Story with Collab intent" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Ask Details", text: "Hey! We'd love to chat about a collab. Could you share your brand name and roughly your budget for this campaign?" } },
          { id: '3', type: 'message', position: { x: 650, y: 150 }, data: { title: "Create Opportunity", text: "Perfect! Our team has been notified and we'll reach out shortly. 🤝", noteTop: "Team notified and lead created in CRM." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' }
        ]
      };
    case 'trigger_dms_live':
      return {
        name: 'Trigger DMs During IG Live',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments during IG Live" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send DM", text: "Hey! Thanks for joining the Live. Here is the special link we were talking about:", buttons: [{id: 'b1', text: 'View Offer', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'auto_reply_comment_dm':
      return {
        name: 'Auto-Reply to Comment in DM',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments on Post" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Catalog", text: "Hey! Here is our latest product catalog. Check out the collections below:", buttons: [{id: 'b1', text: 'Summer Sale', type: 'url'}, {id: 'b2', text: 'New Arrivals', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };

    // SALES & OFFERS
    case 'sell_reel_comments':
      return {
        name: 'Sell from Reel Comments',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments BUY on Reel", publicReplyText: 'Sent you a DM with the link! 🛒' } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "Here is the link to purchase the item you saw in the reel! 🛍️", buttons: [{id: 'b1', text: 'Buy Now', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'send_affiliate_links':
      return {
        name: 'Send Affiliate Links',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User requests affiliate link" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Show Products", text: "Which tool were you looking to get a discount on?", buttons: [{id: 'b1', text: 'Tool A', type: 'reply'}, {id: 'b2', text: 'Tool B', type: 'reply'}] } },
          { id: '3', type: 'message', position: { x: 650, y: 50 }, data: { title: "Send Tool A", text: "Here is my affiliate link for Tool A to get 20% off!", buttons: [{id: 'b3', text: 'Get Tool A', type: 'url'}] } },
          { id: '4', type: 'message', position: { x: 650, y: 250 }, data: { title: "Send Tool B", text: "Here is my affiliate link for Tool B to get a free trial!", buttons: [{id: 'b4', text: 'Get Tool B', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', sourceHandle: 'b1', target: '3' },
          { id: 'e2-4', source: '2', sourceHandle: 'b2', target: '4' }
        ]
      };
    case 'sell_from_ads':
      return {
        name: 'Sell from Ads',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User clicks Ad to DM" } },
          { id: '2', type: 'ai', position: { x: 350, y: 150 }, data: { } },
          { id: '3', type: 'message', position: { x: 650, y: 150 }, data: { title: "Send Offer", text: "Here is the exclusive offer from the ad: [LINK]" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3' }
        ]
      };
    case 'send_offers_live':
      return {
        name: 'Send Offers During Live',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments during Live" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Checkout", text: "Thanks for joining the Live! Here is the special checkout link as promised:", buttons: [{id: 'b1', text: 'Checkout', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'give_coupons_stories':
      return {
        name: 'Give Coupons in Stories',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User reacts to Story" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Coupon", text: "Thanks for watching! Here is your secret VIP coupon code: VIP20 💸", buttons: [{id: 'b1', text: 'Shop Now', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'dm_course':
      return {
        name: 'DM Your Course',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User messages keyword COURSE" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Details", text: "You're in! Here is all the info about the course and your exclusive early access link:", buttons: [{id: 'b1', text: 'View Course', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'launch_new_product':
      return {
        name: 'Launch a New Product',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User messages LAUNCH" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "It's finally here! Check out our new product and get 10% off using this link:", buttons: [{id: 'b1', text: 'Buy Now', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };

   
    // AUDIENCE GROWTH
    case 'grow_followers_comments_flow':
      return {
        name: 'Grow Followers from Comments',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments on Post" } },
          { id: '2', type: 'condition', position: { x: 350, y: 150 }, data: { condition: 'Is Follower' } },
          { id: '3', type: 'message', position: { x: 650, y: 50 }, data: { title: "Send Reward", text: "Thanks for following us! Here is your special reward! 🎁", buttons: [{id: 'b1', text: 'Claim', type: 'url'}] } },
          { id: '4', type: 'message', position: { x: 650, y: 250 }, data: { title: "Ask to Follow", text: "Please follow us first to unlock the reward! 😊 Let me know once you followed." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true' },
          { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false' }
        ]
      };
    case 'follow_first_freebie':
      return {
        name: 'Follow First Then Freebie',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User DMs FREEBIE" } },
          { id: '2', type: 'condition', position: { x: 350, y: 150 }, data: { condition: 'Is Follower' } },
          { id: '3', type: 'message', position: { x: 650, y: 50 }, data: { title: "Send Freebie", text: "Here is your freebie! Enjoy 🎁", buttons: [{id: 'b1', text: 'Download', type: 'url'}] } },
          { id: '4', type: 'message', position: { x: 650, y: 250 }, data: { title: "Ask to Follow", text: "Please follow our page first to get the freebie! 😊" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true' },
          { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false' }
        ]
      };
    case 'run_giveaway':
      return {
        name: 'Run a Giveaway',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments WIN" } },
          { id: '2', type: 'condition', position: { x: 350, y: 150 }, data: { condition: 'Is Follower' } },
          { id: '3', type: 'message', position: { x: 650, y: 50 }, data: { title: "Enter Participant", text: "You're successfully entered into the giveaway! 🎉 We'll announce the winner soon." } },
          { id: '4', type: 'message', position: { x: 650, y: 250 }, data: { title: "Ask to Follow", text: "You must follow us to enter the giveaway! Click follow and try again." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' },
          { id: 'e2-3', source: '2', target: '3', sourceHandle: 'true' },
          { id: 'e2-4', source: '2', target: '4', sourceHandle: 'false' }
        ]
      };
    case 'grow_youtube':
      return {
        name: 'Grow Your YouTube',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments YOUTUBE" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "Hey! The full video is on my YouTube channel right now!\\n\\nSubscribe to my channel 👇", buttons: [{id: 'b1', text: 'Subscribe 🔗', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };

    case 'grow_podcast':
      return {
        name: 'Grow Your Podcast',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments PODCAST" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "Listen to our latest episode here on Spotify or Apple Podcasts:", buttons: [{id: 'b1', text: 'Listen Now', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'grow_ig_from_website':
      return {
        name: 'Grow Instagram from Website',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User visits Website CTA" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "Welcome from our website! Follow us here for daily updates.", buttons: [{id: 'b1', text: 'Follow IG', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'dm_new_follower':
      return {
        name: 'DM to New Follower',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "New Follower joins" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Welcome Msg", text: "Welcome to our page! Thanks for the follow. Here's a quick intro to what we do.", buttons: [{id: 'b1', text: 'Learn More', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'go_to_whatsapp':
      return {
        name: 'Instagram to WhatsApp',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments WHATSAPP" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "Let's chat on WhatsApp! Click here to message me directly:", buttons: [{id: 'b1', text: 'Open WhatsApp', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };

    // AI & SUPPORT
    case 'all_dms':
      return {
        name: 'Respond to All DMs',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User sends any DM" } },
          { id: '2', type: 'ai', position: { x: 350, y: 150 }, data: { } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'recognize_questions_ai':
      return {
        name: 'Recognize Questions with AI',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User asks a Question" } },
          { id: '2', type: 'ai', position: { x: 350, y: 150 }, data: { } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'answer_faqs_stories':
      return {
        name: 'Answer FAQs from Stories',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User replies to Story with a question" } },
          { id: '2', type: 'ai', position: { x: 350, y: 150 }, data: { } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'automate_conv_ai':
      return {
        name: 'Automate Conversations',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User initiates chat" } },
          { id: '2', type: 'ai', position: { x: 350, y: 150 }, data: { } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'hide_negative_comments':
      return {
        name: 'Hide Negative Comments',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User posts any comment" } },
          { id: '2', type: 'ai', position: { x: 350, y: 150 }, data: { } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'auto_thank_positive':
      return {
        name: 'Auto-Thank Positive Comments',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "Positive comment detected" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Reply", text: "Thank you so much! We really appreciate your kind words ❤️" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'auto_like_positive_dms':
      return {
        name: 'Auto-Like Positive Messages',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "Positive DM received" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Like & Reply", text: "Glad you liked it! Let us know if you need anything else." } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'reply_story_mentions':
      return {
        name: 'Reply to Story Mentions',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User mentions you in Story" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Say Thanks", text: "Thanks for the mention! Here's a special offer just for you: [LINK]" } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };

    // ADVANCED
    case 'comments':
      return {
        name: 'Auto-DM Links from Comments',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User comments on Post" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "Here is the link you requested!", buttons: [{id: 'b1', text: 'Open Link', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'auto_send_links_dm':
      return {
        name: 'Auto-Send Links in DM',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User messages keyword" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Send Link", text: "Here is the link to my website!", buttons: [{id: 'b1', text: 'Visit Website', type: 'url'}] } }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2' }
        ]
      };
    case 'custom_flow':
      return {
        name: 'Custom Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 250, y: 50 }, data: { title: "When...", text: "Start" } }
        ],
        edges: []
      };

    default:
      return {
        name: 'New Automation Flow',
        nodes: [
          { id: '1', type: 'trigger', position: { x: 50, y: 150 }, data: { title: "When...", text: "User interacts" } },
          { id: '2', type: 'message', position: { x: 350, y: 150 }, data: { title: "Reply", text: "Welcome to our automation!" } },
        ],
        edges: [{ id: 'e1-2', source: '1', target: '2' }]
      };
  }
};
