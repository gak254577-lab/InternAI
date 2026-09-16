export const initialStudentProfile = {
  id: "student_001",
  name: "Aanya Sharma",
  avatar: "/images/student_avatar.png",
  college: "Indian Institute of Technology, Roorkee",
  degree: "B.Tech Computer Science & Engineering",
  year: "3rd Year (Class of 2027)",
  cgpa: "9.12 / 10.0",
  status: "Ready to Apply",
  readinessScore: 86,
  email: "aanya.sharma@iitr.ac.in",
  phone: "+91 98765 43210",
  location: "Roorkee, Uttarakhand / New Delhi",
  github: "https://github.com/aanyasharma",
  linkedin: "https://linkedin.com/in/aanya-sharma",
  portfolio: "https://aanya.dev",
  bio: "Pre-final year CS undergraduate focused on high-performance distributed systems, modern web architecture, and developer platforms. Built and shipped 3 production full-stack systems with 10k+ interactions.",
  targetRoles: ["Full Stack Engineering Intern", "Frontend Systems Intern", "Backend Platform Intern"],
  verifiedCoursework: [
    "Data Structures & Algorithms (CS201 - Grade A)",
    "Operating Systems & Concurrency (CS301 - Grade A)",
    "Database Management Systems (CS304 - Grade A-)",
    "Computer Networks (CS306 - Grade A)",
    "Distributed Systems (CS402 - Ongoing)"
  ],
  skills: [
    { name: "React.js", level: 94, category: "Frontend", verified: true },
    { name: "TypeScript", level: 88, category: "Languages", verified: true },
    { name: "Node.js & Express", level: 86, category: "Backend", verified: true },
    { name: "Next.js", level: 82, category: "Frontend", verified: true },
    { name: "PostgreSQL", level: 85, category: "Database", verified: true },
    { name: "Redis & Invalidation", level: 78, category: "Backend", verified: true },
    { name: "Data Structures & Algos", level: 90, category: "CS Fundamentals", verified: true },
    { name: "Docker & Containerization", level: 70, category: "DevOps", verified: true },
    { name: "System Design", level: 74, category: "Architecture", verified: false },
    { name: "Python", level: 80, category: "Languages", verified: true },
    { name: "GraphQL", level: 65, category: "Backend", verified: false },
    { name: "Kubernetes", level: 50, category: "DevOps", verified: false }
  ],
  projects: [
    {
      id: "p1",
      title: "SyncFlow — Real-Time Collaborative Whiteboard",
      desc: "Architected a low-latency WebSockets drawing canvas with CRDT conflict-free resolution and Redis pub/sub. Handles 50+ concurrent editors with <15ms broadcast latency.",
      tags: ["React", "TypeScript", "WebSockets", "Redis", "TailwindCSS"],
      stars: 142,
      github: "https://github.com/aanyasharma/syncflow",
      demo: "https://syncflow.dev",
      verified: true
    },
    {
      id: "p2",
      title: "HyperCache — Distributed Cache Proxy",
      desc: "High-throughput in-memory cache proxy with consistent ring hashing, LRU eviction policy, and HTTP telemetry metrics endpoint.",
      tags: ["Go", "Distributed Systems", "Docker", "gRPC"],
      stars: 89,
      github: "https://github.com/aanyasharma/hypercache",
      demo: "https://hypercache.dev",
      verified: true
    },
    {
      id: "p3",
      title: "CampusCart — Peer-to-Peer Student Marketplace",
      desc: "Full-stack mobile web platform for university students to exchange textbooks and hardware with college SSO authentication.",
      tags: ["Next.js", "Prisma", "PostgreSQL", "TailwindCSS"],
      stars: 48,
      github: "https://github.com/aanyasharma/campuscart",
      demo: "https://campuscart.in",
      verified: true
    }
  ]
};

export const initialInternships = [
  {
    id: "int-1",
    company: "Razorpay",
    logoText: "R",
    logoBg: "bg-primary-container text-on-primary",
    title: "SDE Intern (Web Platforms)",
    team: "Foundational Engineering Team",
    location: "Bengaluru • Hybrid",
    roleType: "Full-Time Intern",
    stipend: 45000,
    duration: "6 Months",
    matchScore: 94,
    matchReason: "Matches 8 of 9 college curriculum prerequisites including React, TypeScript, and Redis caching.",
    isLiveMatch: true,
    tags: ["React.js", "TypeScript", "Node.js", "Redis", "Distributed Caching"],
    description: "Join Razorpay's Core Merchant Platform team to build ultra-reliable checkout experiences and payment dashboard interfaces handling 250M+ annual transactions. You will optimize web vitals, build micro-frontends, and construct high-throughput caching proxies.",
    responsibilities: [
      "Architect and ship merchant onboarding components using React 19 and Next.js.",
      "Collaborate with backend platform teams to design low-latency GraphQL schema.",
      "Reduce checkout latency by implementing client-side state caching with Service Workers.",
      "Participate in daily engineering scrums, pull request reviews, and canary deployments."
    ],
    prerequisites: [
      { name: "Strong proficiency in modern JavaScript / TypeScript & React hooks", status: "matched" },
      { name: "Solid grounding in Data Structures, Algorithms, and Time Complexity", status: "matched" },
      { name: "Hands-on experience with REST APIs and HTTP caching headers", status: "matched" },
      { name: "Familiarity with in-memory caching systems like Redis", status: "matched" },
      { name: "Understanding of containerization with Docker", status: "partial" },
      { name: "Experience with Kubernetes cluster orchestration", status: "gap" }
    ],
    deadline: "2026-10-15",
    applicantsCount: 342
  },
  {
    id: "int-2",
    company: "Swiggy",
    logoText: "S",
    logoBg: "bg-orange-600 text-white",
    title: "Frontend Engineering Intern",
    team: "Consumer Delivery Experience",
    location: "Bengaluru • On-site",
    roleType: "Summer Intern",
    stipend: 40000,
    duration: "3 Months",
    matchScore: 92,
    matchReason: "Matches modern reactive UI frameworks, performance profiling, and state management.",
    isLiveMatch: true,
    tags: ["React.js", "Next.js", "Web Performance", "State Machines"],
    description: "Work on Swiggy's consumer-facing food & grocery ordering journey. Enhance checkout conversion and optimize asset loading on lower-end mobile devices.",
    responsibilities: [
      "Build fluid animated UI for real-time order tracking and map integration.",
      "Audit and improve Core Web Vitals (LCP < 1.2s, CLS < 0.05).",
      "Write unit tests with Jest and React Testing Library maintaining 90%+ coverage."
    ],
    prerequisites: [
      { name: "Deep knowledge of React, DOM manipulation, and CSS animations", status: "matched" },
      { name: "Experience profiling memory and network waterfalls in Chrome DevTools", status: "matched" },
      { name: "Understanding of Redux or Zustand state architectures", status: "matched" }
    ],
    deadline: "2026-10-20",
    applicantsCount: 512
  },
  {
    id: "int-3",
    company: "Cred",
    logoText: "C",
    logoBg: "bg-black text-white",
    title: "Backend Platform Intern",
    team: "Core Ledger & Payments",
    location: "Bengaluru • On-site",
    roleType: "Full-Time Intern",
    stipend: 55000,
    duration: "6 Months",
    matchScore: 88,
    matchReason: "Matches concurrency, ACID transaction requirements, and database indexing concepts.",
    isLiveMatch: false,
    tags: ["Go", "Node.js", "PostgreSQL", "Kafka", "High Concurrency"],
    description: "Design fault-tolerant payment settlement workers, idempotency layers, and financial transaction pipelines processing millions of daily settlements.",
    responsibilities: [
      "Implement double-entry ledger settlement workers with strict idempotent guarantees.",
      "Build asynchronous event consumers on top of Apache Kafka.",
      "Optimize PostgreSQL query plans and partition multi-gigabyte financial audit tables."
    ],
    prerequisites: [
      { name: "Knowledge of relational databases, foreign keys, and ACID isolation levels", status: "matched" },
      { name: "Understanding of asynchronous programming and thread pools", status: "matched" },
      { name: "Familiarity with distributed message queues like Kafka or RabbitMQ", status: "partial" }
    ],
    deadline: "2026-10-30",
    applicantsCount: 620
  },
  {
    id: "int-4",
    company: "Zepto",
    logoText: "Z",
    logoBg: "bg-purple-700 text-white",
    title: "Full Stack Growth Intern",
    team: "Quick Commerce Growth & Retention",
    location: "Mumbai • Hybrid",
    roleType: "Full-Time Intern",
    stipend: 38000,
    duration: "6 Months",
    matchScore: 91,
    matchReason: "Matches full-stack Node/React stack and high velocity experiment frameworks.",
    isLiveMatch: false,
    tags: ["React", "Node.js", "Express", "Analytics", "Redis"],
    description: "Rapidly prototype, A/B test, and launch retention loops, personalized bundle recommendations, and localized promotional widgets across the Zepto web and mobile experiences.",
    responsibilities: [
      "Develop responsive feature experiments and measure conversion funnels.",
      "Build real-time promo code verification microservices.",
      "Maintain 99.9% uptime during peak flash sale delivery windows."
    ],
    prerequisites: [
      { name: "Experience developing full-stack web applications with React and Node.js", status: "matched" },
      { name: "Familiarity with MongoDB or PostgreSQL schemas", status: "matched" }
    ],
    deadline: "2026-11-05",
    applicantsCount: 289
  },
  {
    id: "int-5",
    company: "Google",
    logoText: "G",
    logoBg: "bg-blue-600 text-white",
    title: "Software Engineering Intern (Summer 2027)",
    team: "Core Infrastructure & Search Platforms",
    location: "Bengaluru / Hyderabad • Hybrid",
    roleType: "Summer Intern",
    stipend: 110000,
    duration: "2 Months",
    matchScore: 85,
    matchReason: "Matches strong algorithmic problem solving, trees/graphs, and OS concurrency.",
    isLiveMatch: false,
    tags: ["C++", "Java", "Distributed Systems", "Algorithms"],
    description: "Spend your summer at Google tackling fundamental challenges in scalability, large-scale distributed computing, storage, network virtualization, and machine learning infrastructure.",
    responsibilities: [
      "Write clean, readable, highly performant code in C++, Java, or Go.",
      "Analyze and solve complex algorithmic problems on petabyte-scale datasets.",
      "Work closely with a dedicated Google Host / Mentor on a production project."
    ],
    prerequisites: [
      { name: "Enrolled in a Bachelor's degree in CS or related technical field", status: "matched" },
      { name: "Excellent command of algorithms, complexity analysis, and graph theory", status: "matched" },
      { name: "Experience with C++, Java, Go, or Python", status: "matched" }
    ],
    deadline: "2026-11-15",
    applicantsCount: 1840
  },
  {
    id: "int-6",
    company: "Atlassian",
    logoText: "A",
    logoBg: "bg-blue-700 text-white",
    title: "Software Engineering Intern",
    team: "Jira Cloud Foundations",
    location: "Remote • India",
    roleType: "Full-Time Intern",
    stipend: 65000,
    duration: "6 Months",
    matchScore: 89,
    matchReason: "Matches enterprise React architecture, TypeScript, and micro-service integrations.",
    isLiveMatch: false,
    tags: ["TypeScript", "React", "AWS", "Microservices"],
    description: "Help build the next generation of Jira Cloud, empowering millions of agile developers around the globe to plan, track, and release world-class software.",
    responsibilities: [
      "Build modular, accessible UI widgets following Atlassian Design Guidelines.",
      "Integrate AWS Lambda event processors with Jira webhooks.",
      "Contribute to engineering design docs and peer code reviews."
    ],
    prerequisites: [
      { name: "Strong foundation in Object-Oriented or Functional programming", status: "matched" },
      { name: "Proficiency in JavaScript/TypeScript and web standards", status: "matched" }
    ],
    deadline: "2026-11-01",
    applicantsCount: 710
  }
];

export const initialApplications = [
  {
    id: "app-1",
    internshipId: "int-1",
    company: "Razorpay",
    role: "SDE Intern (Web Platforms)",
    status: "interview",
    location: "Bengaluru • Hybrid",
    stipend: "₹45,000/mo",
    appliedDate: "Sep 02, 2026",
    nextEvent: "Round 2 Technical Interview • Tomorrow at 3:00 PM",
    notes: "Review Redis key eviction algorithms and Web Vitals metrics.",
    column: "interview"
  },
  {
    id: "app-2",
    internshipId: "int-5",
    company: "Google",
    role: "SWE Summer Intern 2027",
    status: "interview",
    location: "Hyderabad • Hybrid",
    stipend: "₹1,10,000/mo",
    appliedDate: "Aug 28, 2026",
    nextEvent: "Technical Coding Round 1 • Friday 11:30 AM",
    notes: "Focus on Dynamic Programming, Graph BFS/DFS, and Trie structures.",
    column: "interview"
  },
  {
    id: "app-3",
    internshipId: "int-6",
    company: "Atlassian",
    role: "Software Engineering Intern",
    status: "assessment",
    location: "Remote • India",
    stipend: "₹65,000/mo",
    appliedDate: "Sep 08, 2026",
    nextEvent: "HackerRank OA Due in 2 Days",
    notes: "3 coding questions: Arrays, Sliding Window, Greedy approach.",
    column: "assessment"
  },
  {
    id: "app-4",
    internshipId: "int-2",
    company: "Swiggy",
    role: "Frontend Engineering Intern",
    status: "assessment",
    location: "Bengaluru • On-site",
    stipend: "₹40,000/mo",
    appliedDate: "Sep 10, 2026",
    nextEvent: "Frontend Machine Coding Assignment",
    notes: "Build autocomplete debounced search with keyboard navigation.",
    column: "assessment"
  },
  {
    id: "app-5",
    internshipId: "int-4",
    company: "Zepto",
    role: "Full Stack Growth Intern",
    status: "applied",
    location: "Mumbai • Hybrid",
    stipend: "₹38,000/mo",
    appliedDate: "Sep 14, 2026",
    nextEvent: "Resume Under AI Review",
    notes: "Referred by senior college alumni.",
    column: "applied"
  },
  {
    id: "app-6",
    internshipId: "int-3",
    company: "Cred",
    role: "Backend Platform Intern",
    status: "saved",
    location: "Bengaluru • On-site",
    stipend: "₹55,000/mo",
    appliedDate: "Not Applied",
    nextEvent: "Application Closes Oct 30",
    notes: "Need to finish Redis caching roadmap milestone before applying.",
    column: "saved"
  }
];

export const initialRoadmapMilestones = [
  {
    id: "m1",
    weekNumber: 1,
    title: "Modern React & Concurrent Architecture",
    status: "completed",
    completionPct: 100,
    estimatedHours: "12 Hours",
    description: "Master React 19 hooks, Fiber tree reconciliation, Server Components vs Client Boundaries, and custom hooks.",
    tasks: [
      { id: "t1-1", title: "Implement custom useDebounce and useThrottle with cleanup", completed: true },
      { id: "t1-2", title: "Build an optimistic UI update pattern using useOptimistic", completed: true },
      { id: "t1-3", title: "Analyze bundle size with SourceMapExplorer and code-split heavy routes", completed: true }
    ]
  },
  {
    id: "m2",
    weekNumber: 2,
    title: "Distributed Caching with Redis & Invalidation Strategies",
    status: "in_progress",
    completionPct: 65,
    estimatedHours: "16 Hours",
    description: "Key requirement for Razorpay, Zepto, and Cred. Understand Cache-Aside, Write-Through, Write-Behind, TTLs, and cache stampede prevention.",
    tasks: [
      { id: "t2-1", title: "Implement Cache-Aside pattern with Redis and Express", completed: true },
      { id: "t2-2", title: "Simulate Cache Stampede and mitigate using Mutex / Redis Lock", completed: true },
      { id: "t2-3", title: "Configure Redis LRU eviction policies and monitor memory fragmentation", completed: false },
      { id: "t2-4", title: "Design hierarchical cache invalidation via Redis Pub/Sub channels", completed: false }
    ],
    sandboxSnippet: `// Redis Cache-Aside with Distributed Lock Demo
const redis = require('redis').createClient();

async function getCachedMerchantProfile(merchantId) {
  const cacheKey = \`merchant:\${merchantId}:profile\`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached); // Cache Hit (2ms)
  }
  
  // Cache Miss: Query Database & Set with 1hr TTL
  const profile = await db.merchants.findById(merchantId);
  await redis.setEx(cacheKey, 3600, JSON.stringify(profile));
  return profile;
}`
  },
  {
    id: "m3",
    weekNumber: 3,
    title: "Relational Indexing & Query Plan Tuning in PostgreSQL",
    status: "upcoming",
    completionPct: 0,
    estimatedHours: "14 Hours",
    description: "Analyze EXPLAIN ANALYZE execution trees, B-Tree vs GIN/GiST indexes, foreign key indexing, and N+1 query elimination.",
    tasks: [
      { id: "t3-1", title: "Diagnose Sequential Scan bottlenecks on 500k rows using EXPLAIN ANALYZE", completed: false },
      { id: "t3-2", title: "Build multi-column composite index respecting Leftmost Prefix rule", completed: false },
      { id: "t3-3", title: "Benchmark batching queries with DataLoader to solve ORM N+1 leaks", completed: false }
    ]
  },
  {
    id: "m4",
    weekNumber: 4,
    title: "Microservices Communication with gRPC & Protocol Buffers",
    status: "upcoming",
    completionPct: 0,
    estimatedHours: "18 Hours",
    description: "Design strongly typed service contracts with Proto3, implement bi-directional streaming, and compare latency vs REST.",
    tasks: [
      { id: "t4-1", title: "Define proto schema for an Order Settlement Service", completed: false },
      { id: "t4-2", title: "Implement gRPC client-side load balancing and health checking", completed: false },
      { id: "t4-3", title: "Add OpenTelemetry distributed tracing across HTTP and gRPC boundaries", completed: false }
    ]
  },
  {
    id: "m5",
    weekNumber: 5,
    title: "End-to-End System Design Mock & Architecture Defense",
    status: "upcoming",
    completionPct: 0,
    estimatedHours: "20 Hours",
    description: "Practice whiteboarding design of URL Shortener, Notification Engine, and Real-Time Payment Gateway with trade-off analysis.",
    tasks: [
      { id: "t5-1", title: "Design a high-throughput webhook delivery system with exponential backoff", completed: false },
      { id: "t5-2", title: "Draft architectural capacity estimations for 10M daily active users", completed: false },
      { id: "t5-3", title: "Complete full AI Mock Interview with system design whiteboarding", completed: false }
    ]
  }
];

export const initialMockInterview = {
  currentRole: "Full Stack Engineering Intern (Razorpay)",
  topic: "React Reconciliation & Distributed Caching",
  timerSeconds: 525, // 8 min 45 sec
  questionNumber: 2,
  totalQuestions: 5,
  currentQuestion: {
    id: "q2",
    prompt: "In a high-throughput merchant dashboard, explain how React reconciles state updates in the Fiber architecture, and how you would prevent unnecessary re-renders when streaming real-time payment transactions via WebSockets.",
    idealPoints: [
      "Explain Fiber node structure (tag, key, child, sibling, return, memoizedState).",
      "Discuss the two phases: Render (reconciliation, asynchronous, interruptible) and Commit (synchronous DOM mutations).",
      "Highlight how WebSockets floods can cause state thrashing without batching or throttling (e.g. React 18 automatic batching, throttle/useTransition).",
      "Mention memoization strategies (React.memo with custom comparison, useMemo, ref-based mutable stores with useSyncExternalStore)."
    ]
  },
  realtimeEvaluation: {
    technicalAccuracy: 88,
    clarityScore: 92,
    architectureDepth: 85,
    confidenceIndex: 90,
    feedbackNotes: [
      "Accurately differentiated Fiber render vs commit phase.",
      "Good intuition regarding useSyncExternalStore for high-frequency WebSocket feeds.",
      "Opportunity: Explain how offscreen rendering or virtualized lists help when handling 1,000+ transaction rows."
    ]
  },
  transcriptLog: [
    {
      speaker: "ai_interviewer",
      timestamp: "08:12",
      text: "Welcome Aanya. Let's begin question two. In a high-throughput merchant dashboard, explain how React reconciles state updates in the Fiber architecture, and how you would prevent unnecessary re-renders when streaming real-time payment transactions via WebSockets."
    },
    {
      speaker: "student",
      timestamp: "08:35",
      text: "Sure! In React's Fiber architecture, reconciliation is split into two phases: the render phase and the commit phase. In the render phase, React creates or updates a work-in-progress Fiber tree representing the virtual hierarchy. Because this phase is cooperative and interruptible, React can prioritize urgent updates like user typing over non-urgent background stream updates using startTransition..."
    }
  ]
};

export const initialResumeAnalysis = {
  fileName: "Aanya_Sharma_SDE_Resume_2026.pdf",
  uploadDate: "Sep 15, 2026",
  atsScore: 89,
  parsedData: {
    name: "Aanya Sharma",
    degree: "B.Tech Computer Science (IIT Roorkee)",
    cgpa: "9.12 / 10.0",
    workExperienceYears: "0.5 (Open Source & Project Lead)",
    extractedSkills: [
      "JavaScript (ES6+)", "TypeScript", "React.js", "Next.js", "Node.js",
      "Express", "PostgreSQL", "Redis", "WebSockets", "Docker", "Git", "Algorithms"
    ],
    missingKeywordsForTargetRole: [
      "CI/CD Pipeline Automation", "Kubernetes", "gRPC", "Prometheus / Grafana", "Kafka"
    ]
  },
  recommendations: [
    {
      type: "quantify_impact",
      title: "Quantify Latency Improvement on SyncFlow",
      current: "Architected a low-latency WebSockets drawing canvas with Redis pub/sub.",
      suggested: "Architected a WebSockets drawing canvas with Redis pub/sub, cutting broadcast latency by 42% (<15ms) across 50 concurrent editors.",
      impact: "+4 ATS points for metrics-driven bullet"
    },
    {
      type: "keyword_addition",
      title: "Add In-Memory Cache Invalidation Keywords",
      current: "Created backend API in Express with Redis caching.",
      suggested: "Implemented Cache-Aside pattern with Redis and TTL invalidation, reducing database load by 60% during peak stress tests.",
      impact: "+5 ATS points for platform alignment"
    },
    {
      type: "format_enhancement",
      title: "Standardize Coursework Section",
      current: "Relevant classes: DSA, OS, DBMS.",
      suggested: "Coursework: Data Structures & Algorithms (Grade A), Operating Systems & Concurrency (Grade A), Database Systems.",
      impact: "+2 ATS points for verified academic rigor"
    }
  ],
  matchBreakdown: {
    sdeInternRazorpay: 94,
    sweInternGoogle: 85,
    backendInternCred: 88,
    frontendInternSwiggy: 92
  }
};
