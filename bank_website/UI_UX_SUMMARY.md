# Bank Sentinel - UI/UX Summary & Operator Journey
**Generated:** January 31, 2026  
**Purpose:** Comprehensive UI documentation for UX review and improvement recommendations

---

## 🎯 **Application Overview**

**Bank Sentinel** is a multi-agent AI system that monitors social media sentiment, analyzes banking data, and generates PR responses with human-in-the-loop approval.

### **Core Value Proposition**
- **Automated Sentiment Analysis**: AI agents detect and analyze social media signals
- **Data-Driven Insights**: Correlates sentiment with real transactions and customer reviews
- **PR Response Automation**: Generates professional PR posts with human oversight
- **Real-time Monitoring**: Live dashboard with streaming AI analysis

---

## 📊 **Application Architecture**

### **Tech Stack**
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS 3.4 (dark theme)
- **State Management**: TanStack Query v5
- **Real-time**: Native WebSocket
- **Backend**: FastAPI (Python) + SQLAlchemy
- **AI**: Ollama LLM (ministral-3:3b model)

### **Navigation Structure**
```
┌─────────────────────────────────────────────────────┐
│  Bank Sentinel - Multi-Agent Control Panel         │
│  [●] Connected                                      │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  Dashboard │ PR Posts │ Database │ Settings         │
└─────────────────────────────────────────────────────┘
```

---

## 🗺️ **Page-by-Page Breakdown**

### **1. Dashboard (Home)**
**Route:** `/`  
**Purpose:** Real-time monitoring of the multi-agent workflow

#### **Layout Structure**
```
┌──────────────────────────────────────────┐
│  Real-time Agent Workflow               │
│  ┌────────────────────────────────────┐ │
│  │  Workflow Status                   │ │
│  │  • WF-ABC123                       │ │
│  │  • Status: EBA Processing          │ │
│  │  • Last Update: 2s ago             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  FDA Signal Received ✓             │ │
│  │  Signal: Positive                  │ │
│  │  Confidence: 87%                   │ │
│  │  Drivers:                          │ │
│  │  • Mobile app improvements         │ │
│  │  • Fast loan approvals             │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  IAA Analysis ⏳                   │ │
│  │  [Character-by-character streaming]│ │
│  │  • Analyzing transactions...       │ │
│  │  • Matched 12 transactions         │ │
│  │  • Matched 5 reviews               │ │
│  │  [Auto-scrolling content]          │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  EBA Post Generation ✓             │ │
│  │  [Formatted markdown rendering]    │ │
│  │  Post ready for approval           │ │
│  └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

#### **Key Features**
✅ **Real-time Updates**: WebSocket connection with live status indicator  
✅ **Streaming Display**: Character-by-character AI output (10ms intervals)  
✅ **Markdown Rendering**: Styled markdown with custom components  
✅ **Auto-scroll**: Smooth scrolling to latest content  
✅ **Workflow Tracking**: Visual progression through FDA → IAA → EBA pipeline  

#### **UI Components**
- **Workflow Card**: Displays current workflow ID and status
- **FDA Card**: Shows received sentiment signal details
- **IAA Card**: Streaming analysis with transaction/review matches
- **EBA Card**: Final generated PR post with markdown formatting

#### **Color Coding**
- 🟢 **Green**: Completed stages
- 🟡 **Yellow**: In-progress stages  
- 🔵 **Blue**: Information cards
- 🔴 **Red**: Errors/failures

---

### **2. PR Posts Management**
**Route:** `/posts`  
**Purpose:** Human-in-the-loop approval workflow for AI-generated posts

#### **Page Structure**
```
┌──────────────────────────────────────────────────────┐
│  PR Posts Management                                 │
│  Review, edit, and approve AI-generated PR posts     │
├──────────────────────────────────────────────────────┤
│  [Awaiting Approval (3)] │ [Approved Posts (12)]    │
└──────────────────────────────────────────────────────┘
```

#### **Tab 1: Awaiting Approval**

##### **Approver Input Section**
```
┌──────────────────────────────────────────┐
│  Your Name (Approver):                   │
│  [Enter your name...            ]        │
│  ┌────────────────────────────────────┐  │
│  │ 💡 Enter your name above to enable │  │
│  │    approval buttons                │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

##### **Post Card Structure**
```
┌──────────────────────────────────────────┐
│  WF-450DE1F4484D              [🗑️ Trash] │
│  Created 5 minutes ago                   │
│  ┌────────────────────────────────────┐  │
│  │  [Markdown-rendered PR post]       │  │
│  │  ## Excellent News for Customers   │  │
│  │  We're thrilled to announce...     │  │
│  │  • Faster approvals                │  │
│  │  • Enhanced mobile app             │  │
│  │  [Scrollable content]              │  │
│  └────────────────────────────────────┘  │
│  [Edit] [Approve ✓]                      │
└──────────────────────────────────────────┘
```

##### **Countdown Timer** (Active State)
```
┌──────────────────────────────────────────┐
│  ⏰ Posting in 3 seconds...    [Cancel]  │
└──────────────────────────────────────────┘
```

##### **Edit Mode**
```
┌──────────────────────────────────────────┐
│  WF-450DE1F4484D              [🗑️ Trash] │
│  ┌────────────────────────────────────┐  │
│  │ [Textarea - Full post content]     │  │
│  │                                    │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│  [Cancel] [Approve Edited ✓]             │
└──────────────────────────────────────────┘
```

#### **Tab 2: Approved Posts**

##### **Approved Post Card**
```
┌──────────────────────────────────────────┐
│  WF-F8D4F76F47A1  [✓ Posted] [✏️ Edited] │
│  👤 by John Smith  📅 Jan 31, 2026 15:28 │
│  ┌────────────────────────────────────┐  │
│  │  [Final approved post content]     │  │
│  │  [Markdown rendering]              │  │
│  └────────────────────────────────────┘  │
│  Published 10 minutes ago                │
└──────────────────────────────────────────┘
```

#### **Key Features**
✅ **Dual Tabs**: Separate workflows for pending vs. approved  
✅ **Badge Counts**: Live counts in tab headers  
✅ **Approver Identity**: Mandatory name input for accountability  
✅ **Edit Capability**: Full-text editing before approval  
✅ **Countdown Timer**: 5-second cancellable countdown (configurable in settings)  
✅ **Concurrent Approvals**: Independent timers for multiple posts  
✅ **Discard Option**: Delete unwanted posts with confirmation  
✅ **Status Badges**: Visual indicators (Posted, Approved, Edited)  
✅ **Instant Removal**: Approved posts disappear from Awaiting tab immediately  

#### **User Workflow**
1. Navigate to PR Posts page
2. See pending posts in "Awaiting Approval" tab
3. Enter approver name (enables buttons)
4. Choose action:
   - **Approve as-is**: Click "Approve" → 5-second countdown → Auto-post
   - **Edit first**: Click "Edit" → Modify text → "Approve Edited" → 5-second countdown → Auto-post
   - **Discard**: Click trash icon → Confirm deletion
5. During countdown: Can cancel to abort posting
6. After approval: Post moves to "Approved Posts" tab
7. View approved/posted history in second tab

---

### **3. Database Management**
**Route:** `/database`  
**Purpose:** CRUD operations for transactions and customer reviews

#### **Tab Structure**
```
┌──────────────────────────────────────────┐
│  [Transactions] │ [Customer Reviews]     │
└──────────────────────────────────────────┘
```

#### **Transactions Tab**
```
┌──────────────────────────────────────────────────────────┐
│  Status Filter: [All ▼]        [+ Add Transaction]       │
├──────────────────────────────────────────────────────────┤
│  TXN-001  John Doe      $1,250.00  ✓ Completed          │
│  TXN-002  Jane Smith    $5,000.00  ⚠️ Flagged            │
│  TXN-003  Mike Johnson  $750.00    ⏳ Pending            │
│  [Edit] [Delete]                                         │
└──────────────────────────────────────────────────────────┘
```

#### **Customer Reviews Tab**
```
┌──────────────────────────────────────────────────────────┐
│  Sentiment Filter: [All ▼]    [+ Add Review]             │
├──────────────────────────────────────────────────────────┤
│  REV-001  ⭐⭐⭐⭐⭐  Mobile App  😊 Positive              │
│  "Excellent service! Fast approval process..."           │
│  [Edit] [Delete]                                         │
└──────────────────────────────────────────────────────────┘
```

#### **Key Features**
✅ **Filtering**: Status/sentiment-based filtering  
✅ **CRUD Operations**: Full create, read, update, delete  
✅ **Modal Forms**: Overlay forms for add/edit  
✅ **Data Validation**: Input validation and error handling  
✅ **Real-time Updates**: TanStack Query auto-refetch  

---

### **4. Settings**
**Route:** `/settings`  
**Purpose:** User-configurable application preferences

#### **Settings Layout**
```
┌──────────────────────────────────────────────────┐
│  ⚙️ Settings                                     │
│  Configure your application preferences          │
├──────────────────────────────────────────────────┤
│  Approval Workflow                               │
│  ┌──────────────────────────────────────────┐    │
│  │  Countdown Duration                      │    │
│  │  [5 seconds ▼]                           │    │
│  │  0-30 seconds range                      │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  Dashboard                                       │
│  ┌──────────────────────────────────────────┐    │
│  │  ✓ Auto-refresh every 5 seconds          │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  Notifications                                   │
│  ┌──────────────────────────────────────────┐    │
│  │  ☐ Enable browser notifications          │    │
│  │  [Request Permission]                    │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  Appearance                                      │
│  ┌──────────────────────────────────────────┐    │
│  │  ☑ Dark mode                             │    │
│  └──────────────────────────────────────────┘    │
│                                                   │
│  System Information                              │
│  ┌──────────────────────────────────────────┐    │
│  │  API: http://localhost:8000              │    │
│  │  WebSocket: ws://localhost:8000          │    │
│  │  Version: 1.0.0                          │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

#### **Key Features**
✅ **Countdown Configuration**: Adjust approval timer (0-30 seconds)  
✅ **Auto-refresh Toggle**: Enable/disable dashboard polling  
✅ **Browser Notifications**: Permission management  
✅ **Dark Mode**: Theme toggle  
✅ **System Info**: API endpoints and version display  
✅ **LocalStorage Persistence**: Settings saved to browser  

---

## 👤 **Operator Journey: Complete Workflow**

### **Scenario: Responding to Positive Social Media Sentiment**

#### **Phase 1: Monitoring (Dashboard)**
1. **Operator logs in** → Lands on Dashboard
2. **FDA Agent detects positive sentiment** on Twitter about mobile app
3. **Dashboard shows**:
   - ✅ FDA Signal Received (Green card)
   - Signal: Positive (87% confidence)
   - Drivers: Mobile app improvements, Fast loan approvals
4. **IAA Agent activates** → Status changes to "IAA Processing"
5. **Operator watches streaming analysis**:
   - Character-by-character text appears
   - "Analyzing 247 transactions... Found 12 matches"
   - "Analyzing 89 reviews... Found 5 matches"
   - Analysis text scrolls automatically
6. **EBA Agent activates** → Status: "EBA Processing"
7. **PR post generates** → Markdown-formatted post appears
8. **Status updates** → "Awaiting Approval"

**Operator Action**: Navigate to PR Posts → Awaiting Approval tab

---

#### **Phase 2: Review & Approval (PR Posts)**

##### **Scenario A: Approve as-is**
1. **Operator sees post card** with workflow ID and timestamp
2. **Reads generated post** (markdown rendering, scrollable)
3. **Enters name** in approver field → Buttons enable
4. **Clicks "Approve"** → 5-second countdown starts
5. **Countdown displays**: "⏰ Posting in 5 seconds... [Cancel]"
6. **Operator waits** (or can cancel if needed)
7. **Countdown reaches 0** → Post submits automatically
8. **Post disappears from Awaiting tab** → Moves to Approved tab
9. **Success**: Green notification/status update

##### **Scenario B: Edit before approving**
1. **Operator reads post** → Identifies minor wording issue
2. **Clicks "Edit"** → Textarea appears with full content
3. **Makes changes** to post text
4. **Clicks "Approve Edited"** → 5-second countdown
5. **Post submits** with edited content
6. **Badge shows "Edited"** in Approved Posts tab

##### **Scenario C: Discard unwanted post**
1. **Operator determines post is unnecessary**
2. **Clicks trash icon** → Confirmation dialog
3. **Confirms deletion** → Post removed from database
4. **Card disappears** immediately

---

#### **Phase 3: History Review (Approved Posts Tab)**
1. **Operator switches to "Approved Posts" tab**
2. **Views all approved posts** with metadata:
   - Workflow ID
   - Status badge (Posted/Approved)
   - Edited badge (if modified)
   - Approver name
   - Approval timestamp
   - Publication timestamp
3. **Reviews final content** (markdown rendering)
4. **Confirms successful posting**

---

#### **Phase 4: Configuration (Settings)**
1. **Operator navigates to Settings**
2. **Adjusts countdown timer** to 10 seconds (prefer more review time)
3. **Enables browser notifications** for new posts
4. **Settings save automatically** to localStorage
5. **Changes apply immediately** on next approval

---

## 🎨 **Design System**

### **Color Palette**
```
Background:    #0f172a (slate-900)
Cards:         #1e293b (slate-800)
Borders:       #334155 (slate-700)
Text Primary:  #f1f5f9 (slate-100)
Text Secondary:#94a3b8 (slate-400)

Primary:       #3b82f6 (blue-500/600)
Success:       #22c55e (green-500/600)
Warning:       #eab308 (yellow-500)
Error:         #ef4444 (red-500/600)
Info:          #06b6d4 (cyan-500)
```

### **Typography**
- **Headers**: Bold, white text (slate-100)
- **Body**: Medium weight, light gray (slate-300)
- **Labels**: Small, medium gray (slate-400)
- **Code**: Monospace, cyan (primary-400)

### **Spacing**
- **Card Padding**: 24px (p-6)
- **Section Gaps**: 32px (space-y-8)
- **Element Gaps**: 12px (space-y-3)

### **Components**
- **Buttons**: Rounded (8px), primary/secondary variants, disabled states
- **Cards**: Rounded (8px), border hover effects
- **Inputs**: Dark background, primary focus ring
- **Badges**: Rounded full, color-coded by status

---

## 🚨 **Pain Points & Improvement Opportunities**

### **Current Issues**

#### **1. Dashboard**
❌ **No error recovery**: If workflow fails, no retry mechanism  
❌ **Limited history**: Only shows current workflow, no archive  
❌ **No filtering**: Can't filter workflows by status/date  
❌ **Connection loss**: No automatic reconnection with user feedback  

#### **2. PR Posts**
❌ **No preview mode**: Can't preview edited post before submitting  
❌ **No undo**: Once approved, can't retract or edit  
❌ **Limited metadata**: No sentiment data visible in post card  
❌ **No bulk actions**: Can't approve/discard multiple posts  
❌ **No search**: Can't search posts by content/workflow ID  

#### **3. Database**
❌ **No pagination**: All records load at once (performance issue)  
❌ **No bulk import**: Can't upload CSV/JSON of transactions  
❌ **No export**: Can't download data for external analysis  
❌ **Limited validation**: Minimal input constraints  

#### **4. Settings**
❌ **No user profiles**: Single global settings for all operators  
❌ **No notification customization**: Can't set notification rules  
❌ **No theme options**: Only dark mode available  
❌ **No keyboard shortcuts**: All actions require mouse  

---

## 💡 **UX Improvement Recommendations**

### **Priority 1: Critical Improvements**

#### **1.1 Dashboard Enhancements**
```
Recommendation: Workflow History Panel
┌──────────────────────────────────────┐
│  Recent Workflows      [View All →]  │
│  ┌────────────────────────────────┐  │
│  │ ✓ WF-ABC123  Posted  5m ago   │  │
│  │ ✓ WF-DEF456  Posted  12m ago  │  │
│  │ ⏳ WF-GHI789  Pending  now     │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```
**Impact**: Operators can track multiple workflows, see completion rates

#### **1.2 Error Recovery**
```
Recommendation: Retry Failed Workflows
┌──────────────────────────────────────┐
│  ❌ Workflow Failed                  │
│  Error: LLM timeout                  │
│  [Retry] [View Details] [Discard]   │
└──────────────────────────────────────┘
```
**Impact**: Reduces manual intervention, improves reliability

#### **1.3 Post Preview**
```
Recommendation: Edit Mode Preview
┌──────────────────────────────────────┐
│  [Edit] [Preview]                    │
│  ┌────────────────────────────────┐  │
│  │  [Live markdown preview]       │  │
│  │  Shows formatted output        │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```
**Impact**: Prevents formatting errors, improves confidence

---

### **Priority 2: Enhanced Functionality**

#### **2.1 Bulk Operations**
```
┌──────────────────────────────────────────┐
│  [☑] Select All  [Approve Selected]     │
│  ☑ WF-ABC123  Post about mobile app     │
│  ☑ WF-DEF456  Post about loan rates     │
│  ☐ WF-GHI789  Post about branch hours   │
└──────────────────────────────────────────┘
```
**Impact**: Faster processing during high-volume periods

#### **2.2 Advanced Filtering**
```
┌──────────────────────────────────────────┐
│  Filter: [Status ▼] [Date ▼] [Search 🔍]│
│  Status: Awaiting, Approved, Posted      │
│  Date: Today, Last 7 days, Custom        │
│  Search: Keyword in post content         │
└──────────────────────────────────────────┘
```
**Impact**: Easier to find specific posts, better organization

#### **2.3 Sentiment Context**
```
┌──────────────────────────────────────────┐
│  WF-450DE1F4484D              [🗑️]      │
│  📊 Sentiment: Positive (87%)           │
│  🎯 Drivers: Mobile app, Loan approvals │
│  📈 12 transactions, 5 reviews analyzed │
│  ┌────────────────────────────────────┐  │
│  │  [Post content]                    │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```
**Impact**: Better context for approval decisions

---

### **Priority 3: User Experience Polish**

#### **3.1 Keyboard Shortcuts**
```
Dashboard:
  R - Refresh workflows
  N - Navigate to next workflow

PR Posts:
  E - Edit selected post
  A - Approve (with countdown)
  D - Discard
  Tab - Switch between tabs
  Esc - Cancel edit/countdown
```
**Impact**: Power users work faster, reduced mouse dependency

#### **3.2 Toast Notifications**
```
┌──────────────────────────────────┐
│  ✅ Post approved successfully   │
│  Published to social media       │
└──────────────────────────────────┘
```
**Impact**: Clear feedback, improved user confidence

#### **3.3 Loading States**
```
┌──────────────────────────────────┐
│  ⏳ Generating post...            │
│  [████████░░] 80%                │
│  ETA: 5 seconds                  │
└──────────────────────────────────┘
```
**Impact**: Reduces perceived wait time, manages expectations

#### **3.4 Empty States**
```
Current:
  "No posts awaiting approval"

Improved:
  "🎉 All caught up!"
  "No posts need your attention right now"
  [View Approved Posts] [Simulate Test Post]
```
**Impact**: More engaging, actionable empty states

---

### **Priority 4: Data & Analytics**

#### **4.1 Analytics Dashboard**
```
┌──────────────────────────────────────────┐
│  📊 Performance Metrics (Last 7 Days)   │
│  ┌────────────────────────────────────┐  │
│  │  Total Workflows: 147              │  │
│  │  Approved: 132 (89.8%)             │  │
│  │  Discarded: 15 (10.2%)             │  │
│  │  Avg Approval Time: 3m 42s         │  │
│  └────────────────────────────────────┘  │
│  [Chart: Posts per day]                 │
│  [Chart: Sentiment distribution]        │
└──────────────────────────────────────────┘
```
**Impact**: Data-driven decisions, performance tracking

#### **4.2 Export Functionality**
```
┌──────────────────────────────────────┐
│  Export Data                         │
│  Format: [CSV ▼] [JSON] [PDF]       │
│  Range: [Last 7 days ▼]             │
│  Include: ☑ Posts ☑ Sentiment       │
│  [Download]                          │
└──────────────────────────────────────┘
```
**Impact**: External analysis, reporting, compliance

---

## 🔍 **Competitive Analysis**

### **Similar Systems**
- **Hootsuite**: Social media management (lacks AI agents)
- **Sprinklr**: Enterprise social listening (expensive, complex)
- **Buffer**: Post scheduling (no sentiment analysis)

### **Unique Differentiators**
✅ **Multi-agent architecture**: Modular AI workflow  
✅ **Human-in-the-loop**: Maintains control with automation  
✅ **Real-time streaming**: Live AI processing visibility  
✅ **Banking-specific**: Tailored for financial institutions  

---

## 📝 **Operator Feedback Questions**

To validate UX improvements, ask operators:

1. **Workflow Efficiency**
   - How long does it take to approve a post?
   - Do you often edit posts before approving?
   - How many posts do you handle per day?

2. **Pain Points**
   - What's the most frustrating part of the approval process?
   - Do you ever miss posts that need approval?
   - Have you ever approved a post by mistake?

3. **Feature Requests**
   - What would make approvals faster?
   - What information is missing from post cards?
   - Would you use bulk operations?

4. **Dashboard Usage**
   - Do you watch workflows in real-time?
   - Do you use the dashboard or go straight to PR Posts?
   - Is the streaming analysis useful or distracting?

---

## 🎯 **Next Steps for UX Optimization**

### **Immediate Actions**
1. ✅ **Implement post preview** in edit mode
2. ✅ **Add keyboard shortcuts** for power users
3. ✅ **Improve empty states** with actionable CTAs
4. ✅ **Add toast notifications** for all actions

### **Short-term (1-2 weeks)**
1. 🔄 **Workflow history panel** on dashboard
2. 🔄 **Advanced filtering** in PR Posts
3. 🔄 **Sentiment context** in post cards
4. 🔄 **Bulk operations** for multiple posts

### **Long-term (1-2 months)**
1. 📊 **Analytics dashboard** with metrics
2. 📊 **Export functionality** for data analysis
3. 📊 **User profiles** with role-based permissions
4. 📊 **A/B testing** for post variations

---

## 📞 **Contact & Collaboration**

**For UX Review:**  
Share this document with UX designers, product managers, and operators for feedback.

**Key Questions to Answer:**
- Is the operator journey clear and efficient?
- Are there missing features or workflows?
- What are the biggest usability issues?
- How can we reduce cognitive load?

**Output:** Prioritized roadmap for UX improvements based on user research and analytics.

---

**Document Version:** 1.0  
**Last Updated:** January 31, 2026  
**Status:** Ready for UX review and operator testing
