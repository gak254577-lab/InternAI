import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// ─── Roadmap Templates by Track ────────────────────────────────────────────
const ROADMAP_TEMPLATES = {
  'fullstack': {
    label: 'Full Stack Developer',
    icon: 'layers',
    color: 'blue',
    milestones: [
      {
        week: 1, title: 'HTML, CSS & JS Fundamentals',
        description: 'Solidify core web foundations — semantic HTML5, CSS flexbox/grid, ES6+ JavaScript.',
        hours: '10–12 hrs',
        tasks: [
          'Complete 30 JS array/string coding challenges on LeetCode (Easy)',
          'Build a responsive portfolio page with CSS Grid & Flexbox',
          'Master ES6: destructuring, spread, async/await, modules',
          'Study DOM manipulation & event delegation patterns',
          'Submit solutions for 3 HackerRank Frontend challenges',
        ],
        resources: [
          { title: 'JavaScript.info', url: 'https://javascript.info', tag: 'Free Course' },
          { title: 'CSS Tricks – Flexbox Guide', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', tag: 'Reference' },
          { title: 'freeCodeCamp – Responsive Web Design', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', tag: 'Certificate' },
        ],
      },
      {
        week: 2, title: 'React & Component Architecture',
        description: 'Master modern React: hooks, state management, context API, and component patterns.',
        hours: '12–14 hrs',
        tasks: [
          'Build a Todo App with useState, useEffect, and useContext',
          'Implement custom hooks for data fetching and local storage',
          'Learn React Router v6 with protected routes',
          'Study prop drilling vs Context vs Zustand/Redux',
          'Build a GitHub profile viewer using the GitHub API',
        ],
        resources: [
          { title: 'React Official Docs – Learn React', url: 'https://react.dev/learn', tag: 'Official' },
          { title: 'React Router v6 Tutorial', url: 'https://reactrouter.com/en/main/start/tutorial', tag: 'Tutorial' },
          { title: 'Zustand – State Management', url: 'https://zustand-demo.pmnd.rs/', tag: 'Library' },
        ],
      },
      {
        week: 3, title: 'Node.js & REST APIs',
        description: 'Build production-grade backend services with Express.js, REST API design, and auth.',
        hours: '12–14 hrs',
        tasks: [
          'Create a RESTful API with Express: CRUD for a blog/notes app',
          'Implement JWT authentication with refresh tokens',
          'Design proper error handling middleware and input validation',
          'Use Postman / Thunder Client to test all endpoints',
          'Deploy your API to Render or Railway (free tier)',
        ],
        resources: [
          { title: 'Node.js Crash Course – Traversy', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', tag: 'Video' },
          { title: 'Express.js Docs', url: 'https://expressjs.com/en/guide/routing.html', tag: 'Official' },
          { title: 'JWT.io – Debugger', url: 'https://jwt.io/', tag: 'Tool' },
        ],
      },
      {
        week: 4, title: 'Databases: SQL & MongoDB',
        description: 'Design schemas, write queries, and integrate databases into your full stack projects.',
        hours: '10–12 hrs',
        tasks: [
          'Complete SQLZoo + Mode Analytics SQL practice (intermediate)',
          'Design a normalized relational schema for an e-commerce app',
          'Integrate MongoDB with Mongoose in your Node.js API',
          'Learn indexing, aggregation pipelines, and schema design tradeoffs',
          'Build a combined SQL + NoSQL project (e.g., a job board)',
        ],
        resources: [
          { title: 'SQLZoo – Interactive SQL', url: 'https://sqlzoo.net/', tag: 'Practice' },
          { title: 'MongoDB University – M001', url: 'https://learn.mongodb.com/learning-paths/mongodb-basics', tag: 'Free Course' },
          { title: 'Prisma ORM Docs', url: 'https://www.prisma.io/docs', tag: 'Tool' },
        ],
      },
      {
        week: 5, title: 'System Design Basics & DSA',
        description: 'Crack technical interviews with 2 weeks of DSA + foundational system design.',
        hours: '14–16 hrs',
        tasks: [
          'Solve 50 LeetCode problems: Arrays, Strings, HashMap, Two Pointer',
          'Study Big-O time/space complexity for all common patterns',
          'Learn system design: Load Balancer, CDN, Database Sharding',
          'Design a URL Shortener (Bit.ly clone) end-to-end',
          'Complete 3 mock interview sessions on Pramp or Exercism',
        ],
        resources: [
          { title: 'Neetcode.io – Roadmap', url: 'https://neetcode.io/roadmap', tag: 'DSA' },
          { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', tag: 'GitHub' },
          { title: 'Pramp – Mock Interviews', url: 'https://www.pramp.com/', tag: 'Free' },
        ],
      },
      {
        week: 6, title: 'Capstone Project & Portfolio Polish',
        description: 'Build an impressive full-stack capstone, write a strong README, and deploy publicly.',
        hours: '16–20 hrs',
        tasks: [
          'Build a full-stack capstone: e.g., Job Board, Chat App, or AI Tool',
          'Deploy frontend to Vercel and backend to Render',
          'Write a detailed README with architecture diagram and screenshots',
          'Record a 3-min demo video and publish to YouTube/LinkedIn',
          'Apply to 10+ internships with your updated resume and portfolio',
        ],
        resources: [
          { title: 'Vercel – Deploy in seconds', url: 'https://vercel.com/', tag: 'Deployment' },
          { title: 'Shields.io – README Badges', url: 'https://shields.io/', tag: 'Tool' },
          { title: 'Internshala – Apply Now', url: 'https://internshala.com/', tag: 'Apply' },
        ],
      },
    ],
  },
  'ml': {
    label: 'Machine Learning / AI',
    icon: 'psychology',
    color: 'purple',
    milestones: [
      {
        week: 1, title: 'Python & Math Foundations',
        description: 'Get comfortable with Python for data science and brush up on linear algebra and statistics.',
        hours: '10–12 hrs',
        tasks: [
          'Complete Python basics: NumPy, Pandas, Matplotlib crash course',
          'Review linear algebra: vectors, matrix multiplication, eigenvectors',
          'Study probability distributions: Normal, Binomial, Bayes Theorem',
          'Complete Kaggle\'s Python & Pandas micro-course',
          'Solve 20 LeetCode array/math problems in Python',
        ],
        resources: [
          { title: '3Blue1Brown – Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', tag: 'Video' },
          { title: 'Kaggle – Python Course', url: 'https://www.kaggle.com/learn/python', tag: 'Free' },
          { title: 'StatQuest – Statistics', url: 'https://www.youtube.com/c/joshstarmer', tag: 'YouTube' },
        ],
      },
      {
        week: 2, title: 'Classical ML Algorithms',
        description: 'Master core ML algorithms from scratch and understand when to use each one.',
        hours: '12–14 hrs',
        tasks: [
          'Implement Linear & Logistic Regression from scratch (no sklearn)',
          'Study Decision Trees, Random Forests, and Gradient Boosting (XGBoost)',
          'Build a complete ML pipeline: data cleaning → feature engineering → model → evaluation',
          'Compete in a Kaggle beginner competition (Titanic / House Prices)',
          'Learn cross-validation, bias-variance tradeoff, regularization (L1/L2)',
        ],
        resources: [
          { title: 'Scikit-learn – User Guide', url: 'https://scikit-learn.org/stable/user_guide.html', tag: 'Official' },
          { title: 'Kaggle – Intro to ML', url: 'https://www.kaggle.com/learn/intro-to-machine-learning', tag: 'Free' },
          { title: 'XGBoost Documentation', url: 'https://xgboost.readthedocs.io/', tag: 'Library' },
        ],
      },
      {
        week: 3, title: 'Deep Learning & Neural Networks',
        description: 'Build and train deep neural networks using PyTorch or TensorFlow.',
        hours: '14–16 hrs',
        tasks: [
          'Implement a multi-layer perceptron in PyTorch for MNIST classification',
          'Study CNNs: convolution, pooling, batch normalization — build an image classifier',
          'Understand backpropagation and gradient descent mathematically',
          'Fine-tune a pretrained ResNet/EfficientNet on a custom dataset',
          'Learn model debugging: overfitting, learning rate schedules, early stopping',
        ],
        resources: [
          { title: 'fast.ai – Practical Deep Learning', url: 'https://course.fast.ai/', tag: 'Free Course' },
          { title: 'PyTorch Tutorials', url: 'https://pytorch.org/tutorials/', tag: 'Official' },
          { title: 'Papers With Code', url: 'https://paperswithcode.com/', tag: 'Research' },
        ],
      },
      {
        week: 4, title: 'NLP & Transformers',
        description: 'Understand modern NLP with transformers, fine-tuning LLMs, and HuggingFace.',
        hours: '12–14 hrs',
        tasks: [
          'Study attention mechanism and transformer architecture (Attention Is All You Need)',
          'Fine-tune BERT for text classification on a sentiment dataset',
          'Build a chatbot or Q&A system using HuggingFace Inference API',
          'Experiment with LangChain for RAG (Retrieval-Augmented Generation)',
          'Deploy your NLP model as a FastAPI endpoint',
        ],
        resources: [
          { title: 'Illustrated Transformer – Jay Alammar', url: 'https://jalammar.github.io/illustrated-transformer/', tag: 'Blog' },
          { title: 'HuggingFace – NLP Course', url: 'https://huggingface.co/learn/nlp-course', tag: 'Free' },
          { title: 'LangChain Docs', url: 'https://python.langchain.com/', tag: 'Library' },
        ],
      },
      {
        week: 5, title: 'MLOps & Deployment',
        description: 'Learn to ship ML models to production with proper versioning, monitoring, and APIs.',
        hours: '10–12 hrs',
        tasks: [
          'Containerize your ML model with Docker and push to Docker Hub',
          'Deploy a model API on HuggingFace Spaces or GCP Vertex AI (free credits)',
          'Set up MLflow for experiment tracking and model registry',
          'Learn data versioning with DVC and model drift monitoring',
          'Build a Gradio/Streamlit demo for your best model',
        ],
        resources: [
          { title: 'MLflow Documentation', url: 'https://mlflow.org/docs/latest/index.html', tag: 'Tool' },
          { title: 'HuggingFace Spaces', url: 'https://huggingface.co/spaces', tag: 'Deploy' },
          { title: 'Full Stack Deep Learning', url: 'https://fullstackdeeplearning.com/', tag: 'Course' },
        ],
      },
      {
        week: 6, title: 'Capstone ML Project & Portfolio',
        description: 'Build an end-to-end ML project that stands out to top AI internship recruiters.',
        hours: '16–20 hrs',
        tasks: [
          'Build an end-to-end AI project: data collection → training → deployment',
          'Write a technical blog post on Medium or Towards Data Science',
          'Create a Kaggle notebook with EDA + modeling (aim for top 20%)',
          'Submit your project to Google Summer of Code or any open-source AI org',
          'Apply to AI/ML internships at startups (Unstop, Internshala, LinkedIn)',
        ],
        resources: [
          { title: 'Towards Data Science', url: 'https://towardsdatascience.com/', tag: 'Write' },
          { title: 'Google Summer of Code', url: 'https://summerofcode.withgoogle.com/', tag: 'Program' },
          { title: 'Unstop – AI Internships', url: 'https://unstop.com/', tag: 'Apply' },
        ],
      },
    ],
  },
  'backend': {
    label: 'Backend / Systems',
    icon: 'dns',
    color: 'green',
    milestones: [
      {
        week: 1, title: 'Core DSA & Problem Solving',
        description: 'Build a strong algorithmic foundation — the #1 filter for backend engineering roles.',
        hours: '12–14 hrs',
        tasks: [
          'Solve 60 LeetCode Easy problems (Arrays, Strings, HashMaps)',
          'Study time/space complexity deeply — memorize Big-O for all standard algorithms',
          'Master recursion and backtracking with 10 practice problems',
          'Practice two-pointer, sliding window, and binary search patterns',
          'Participate in 2 LeetCode Weekly Contests',
        ],
        resources: [
          { title: 'Neetcode 150 – Roadmap', url: 'https://neetcode.io/roadmap', tag: 'Must Do' },
          { title: 'LeetCode Patterns', url: 'https://leetcode.com/explore/', tag: 'Practice' },
          { title: 'AlgoExpert – Explanations', url: 'https://algoexpert.io/', tag: 'Paid' },
        ],
      },
      {
        week: 2, title: 'Advanced DSA: Trees, Graphs & DP',
        description: 'Conquer the hardest interview topics: trees, graphs, dynamic programming.',
        hours: '14–16 hrs',
        tasks: [
          'Master binary trees: DFS, BFS, LCA, diameter, path sum problems',
          'Study graph algorithms: DFS, BFS, Dijkstra, Topological Sort, Union-Find',
          'Solve 20 DP problems: knapsack, LCS, coin change, LIS patterns',
          'Complete the Blind 75 list on LeetCode',
          'Mock interview with a peer on Pramp (3 sessions)',
        ],
        resources: [
          { title: 'Blind 75 – LeetCode List', url: 'https://leetcode.com/discuss/general-discussion/460599/blind-75-leetcode-questions', tag: 'Must Do' },
          { title: 'Visualgo – Algorithm Visualizer', url: 'https://visualgo.net/', tag: 'Tool' },
          { title: 'DP for Beginners – patterns', url: 'https://leetcode.com/discuss/general-discussion/458695/dynamic-programming-patterns', tag: 'Guide' },
        ],
      },
      {
        week: 3, title: 'Systems Design – Fundamentals',
        description: 'Design scalable distributed systems — the core of senior backend interviews.',
        hours: '12–14 hrs',
        tasks: [
          'Study CAP theorem, eventual consistency, and BASE properties',
          'Design Twitter/Instagram Feed with feed fanout strategies',
          'Understand caching: Redis, Memcached, cache invalidation, CDN',
          'Study message queues: Kafka vs RabbitMQ use cases',
          'Practice 3 system design problems from System Design Primer',
        ],
        resources: [
          { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', tag: 'GitHub' },
          { title: 'ByteByteGo Newsletter', url: 'https://blog.bytebytego.com/', tag: 'Blog' },
          { title: 'Redis Documentation', url: 'https://redis.io/docs/', tag: 'Official' },
        ],
      },
      {
        week: 4, title: 'Databases & Query Optimization',
        description: 'Write complex SQL, optimize slow queries, and design schemas like a senior engineer.',
        hours: '10–12 hrs',
        tasks: [
          'Complete all 70 SQL problems on LeetCode (Medium + Hard)',
          'Study EXPLAIN ANALYZE, index types (B-tree, Hash, GiST), and query planning',
          'Design a relational schema for a complex domain (e.g., ride-sharing or e-commerce)',
          'Learn database partitioning, replication, and sharding patterns',
          'Experiment with PostgreSQL advanced features: CTEs, window functions, triggers',
        ],
        resources: [
          { title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/', tag: 'Indexing' },
          { title: 'PostgreSQL Docs', url: 'https://www.postgresql.org/docs/', tag: 'Official' },
          { title: 'LeetCode SQL – Study Plan', url: 'https://leetcode.com/study-plan/sql/', tag: 'Practice' },
        ],
      },
      {
        week: 5, title: 'APIs, Microservices & DevOps',
        description: 'Build production-grade microservices with Docker, CI/CD, and cloud deployment.',
        hours: '12–14 hrs',
        tasks: [
          'Build 3 REST APIs with proper status codes, pagination, rate limiting',
          'Containerize services with Docker Compose (API + DB + Redis)',
          'Set up a GitHub Actions CI/CD pipeline with automated tests',
          'Learn Kubernetes basics: pods, deployments, services, ingress',
          'Deploy a microservice to GCP or AWS (free tier)',
        ],
        resources: [
          { title: 'Docker – Get Started', url: 'https://docs.docker.com/get-started/', tag: 'Official' },
          { title: 'GitHub Actions Docs', url: 'https://docs.github.com/en/actions', tag: 'CI/CD' },
          { title: 'Kubernetes – Interactive Tutorial', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', tag: 'Tutorial' },
        ],
      },
      {
        week: 6, title: 'Open Source & Internship Applications',
        description: 'Contribute to real codebases and aggressively apply for backend internships.',
        hours: '14–18 hrs',
        tasks: [
          'Make 3+ merged PRs to a popular open-source backend project (FastAPI, Prisma, etc.)',
          'Write a technical blog post explaining a system you designed',
          'Complete a take-home assignment or submit a project to a company\'s coding challenge',
          'Apply to 15+ backend internships (LinkedIn, Wellfound, Internshala)',
          'Prepare your GitHub profile: pin best repos, write READMEs, add demo GIFs',
        ],
        resources: [
          { title: 'Good First Issues', url: 'https://goodfirstissues.com/', tag: 'Open Source' },
          { title: 'Wellfound (AngelList)', url: 'https://wellfound.com/', tag: 'Apply' },
          { title: 'GitHub Profile README Tips', url: 'https://github.com/abhisheknaiidu/awesome-github-profile-readme', tag: 'Portfolio' },
        ],
      },
    ],
  },
  'frontend': {
    label: 'Frontend / UI Engineering',
    icon: 'desktop_windows',
    color: 'orange',
    milestones: [
      {
        week: 1, title: 'Advanced CSS & Animations',
        description: 'Master the visual craft: CSS animations, design systems, accessibility, and responsiveness.',
        hours: '10–12 hrs',
        tasks: [
          'Build 5 UI components with pure CSS animations (cards, modals, dropdowns)',
          'Study CSS custom properties, container queries, and :has() selector',
          'Implement a design system with color tokens and typography scale',
          'Pass the WCAG 2.1 AA accessibility checklist on your portfolio',
          'Recreate 3 Dribbble/Figma designs pixel-perfectly in HTML/CSS',
        ],
        resources: [
          { title: 'CSS Tricks – Animation Guide', url: 'https://css-tricks.com/almanac/properties/a/animation/', tag: 'Guide' },
          { title: 'Every Layout – Reusable CSS', url: 'https://every-layout.dev/', tag: 'Book' },
          { title: 'web.dev – Accessibility', url: 'https://web.dev/accessibility/', tag: 'Google' },
        ],
      },
      {
        week: 2, title: 'React Performance & Architecture',
        description: 'Write production-grade React: performance, code splitting, design patterns.',
        hours: '12–14 hrs',
        tasks: [
          'Use React DevTools Profiler to identify and fix rendering bottlenecks',
          'Implement React.memo, useMemo, useCallback correctly in a large component tree',
          'Build a virtualized list with react-virtual for 10,000+ items',
          'Study React design patterns: compound components, render props, HOCs',
          'Implement route-based code splitting with React.lazy and Suspense',
        ],
        resources: [
          { title: 'React Docs – Performance', url: 'https://react.dev/reference/react/memo', tag: 'Official' },
          { title: 'TanStack Virtual', url: 'https://tanstack.com/virtual/latest', tag: 'Library' },
          { title: 'Patterns.dev – React Patterns', url: 'https://www.patterns.dev/', tag: 'Book' },
        ],
      },
      {
        week: 3, title: 'State Management & Data Fetching',
        description: 'Master modern state management and server state with React Query / SWR.',
        hours: '12–14 hrs',
        tasks: [
          'Migrate a prop-drilling mess to Zustand or Jotai',
          'Build a real-time dashboard with React Query (caching, polling, mutations)',
          'Implement optimistic updates for form submissions',
          'Study tRPC or GraphQL for type-safe API consumption',
          'Build a complex form with React Hook Form + Zod validation',
        ],
        resources: [
          { title: 'TanStack Query Docs', url: 'https://tanstack.com/query/latest', tag: 'Library' },
          { title: 'Zustand – State Management', url: 'https://zustand-demo.pmnd.rs/', tag: 'Library' },
          { title: 'React Hook Form', url: 'https://react-hook-form.com/', tag: 'Library' },
        ],
      },
      {
        week: 4, title: 'TypeScript & Testing',
        description: 'Write production-quality TypeScript and test your components properly.',
        hours: '10–12 hrs',
        tasks: [
          'Migrate a React project to TypeScript — type all props, context, and API responses',
          'Write unit tests with Vitest + React Testing Library for 3 complex components',
          'Set up E2E tests with Playwright for critical user flows',
          'Learn TypeScript generics, utility types, and conditional types',
          'Integrate ESLint + Prettier + Husky pre-commit hooks in a project',
        ],
        resources: [
          { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/', tag: 'Official' },
          { title: 'Testing Library Docs', url: 'https://testing-library.com/docs/react-testing-library/intro/', tag: 'Official' },
          { title: 'Playwright Docs', url: 'https://playwright.dev/', tag: 'E2E' },
        ],
      },
      {
        week: 5, title: 'Web Performance & Core Web Vitals',
        description: 'Optimize your apps to score 90+ on Lighthouse and pass Core Web Vitals.',
        hours: '10–12 hrs',
        tasks: [
          'Audit your portfolio with Lighthouse and achieve 90+ on all metrics',
          'Implement image optimization (WebP, lazy loading, blur-up placeholders)',
          'Reduce JS bundle size with tree shaking and dynamic imports',
          'Study LCP, FID/INP, CLS — the Core Web Vitals that affect SEO ranking',
          'Set up Web Vitals monitoring with Vercel Analytics or Sentry',
        ],
        resources: [
          { title: 'web.dev – Core Web Vitals', url: 'https://web.dev/vitals/', tag: 'Google' },
          { title: 'Lighthouse CI', url: 'https://github.com/GoogleChrome/lighthouse-ci', tag: 'Tool' },
          { title: 'Bundlephobia', url: 'https://bundlephobia.com/', tag: 'Tool' },
        ],
      },
      {
        week: 6, title: 'Portfolio & Applications',
        description: 'Assemble a stunning portfolio and apply to top frontend internship roles.',
        hours: '14–18 hrs',
        tasks: [
          'Build and deploy a standout portfolio with 3 featured case studies',
          'Add dark mode, smooth page transitions, and micro-animations to your portfolio',
          'Write a CSS/JavaScript technical blog post (dev.to or Medium)',
          'Apply to 15+ frontend internships including top product companies',
          'Contribute a UI component to an open-source design system (shadcn, Radix, etc.)',
        ],
        resources: [
          { title: 'Awwwards – Portfolio Inspiration', url: 'https://www.awwwards.com/', tag: 'Inspiration' },
          { title: 'shadcn/ui – Components', url: 'https://ui.shadcn.com/', tag: 'Library' },
          { title: 'Internshala – Frontend Jobs', url: 'https://internshala.com/internships/web-development-internship/', tag: 'Apply' },
        ],
      },
    ],
  },

  // ── DATA ANALYST ──────────────────────────────────────────────────────────
  'data-analyst': {
    label: 'Data Analyst',
    icon: 'bar_chart',
    color: 'teal',
    milestones: [
      {
        week: 1, title: 'Excel, SQL & Data Foundations',
        description: 'Master the bread-and-butter tools every data analyst uses daily.',
        hours: '10–12 hrs',
        tasks: [
          'Complete SQLZoo all sections including SELECT Within SELECT & SUM/COUNT',
          'Master Excel: VLOOKUP, XLOOKUP, pivot tables, conditional formatting',
          'Learn data types, NULL handling, GROUP BY, HAVING, and subqueries',
          'Solve 20 LeetCode SQL problems (Easy → Medium)',
          'Clean and analyze a real CSV dataset (e.g., Titanic or Netflix) in Excel',
        ],
        resources: [
          { title: 'SQLZoo – Interactive SQL', url: 'https://sqlzoo.net/', tag: 'Practice' },
          { title: 'Mode SQL Tutorial', url: 'https://mode.com/sql-tutorial/', tag: 'Free' },
          { title: 'Excel for Beginners – GFG', url: 'https://www.geeksforgeeks.org/advanced-excel/', tag: 'Guide' },
        ],
      },
      {
        week: 2, title: 'Python for Data Analysis',
        description: "Automate analysis and EDA with Python's data science stack.",
        hours: '12–14 hrs',
        tasks: [
          'Complete Kaggle Python + Pandas micro-courses (free certificates)',
          'Perform full EDA on a Kaggle dataset: missing values, outliers, distributions',
          'Master Pandas: merge, groupby, pivot_table, melt, apply',
          'Build 5 data visualizations with Matplotlib and Seaborn',
          'Automate an Excel report with openpyxl or xlsxwriter',
        ],
        resources: [
          { title: 'Kaggle – Pandas Course', url: 'https://www.kaggle.com/learn/pandas', tag: 'Free' },
          { title: 'Seaborn Gallery', url: 'https://seaborn.pydata.org/examples/', tag: 'Reference' },
          { title: 'Real Python – EDA Tutorial', url: 'https://realpython.com/pandas-dataframe/', tag: 'Tutorial' },
        ],
      },
      {
        week: 3, title: 'Data Visualization & Storytelling',
        description: 'Turn raw data into compelling visual stories that drive decisions.',
        hours: '10–12 hrs',
        tasks: [
          'Build an interactive dashboard in Power BI or Tableau Public (free)',
          'Create a Google Data Studio report connected to a Google Sheets dataset',
          'Study data storytelling principles: chart selection, color theory, annotation',
          'Recreate 3 professional charts from The Economist or FT in Python',
          'Publish a Tableau Public dashboard and share it on LinkedIn',
        ],
        resources: [
          { title: 'Tableau Public – Free', url: 'https://public.tableau.com/', tag: 'Tool' },
          { title: 'Storytelling with Data', url: 'https://www.storytellingwithdata.com/', tag: 'Book' },
          { title: 'Power BI Learning', url: 'https://learn.microsoft.com/en-us/power-bi/', tag: 'Official' },
        ],
      },
      {
        week: 4, title: 'Statistics & Probability',
        description: 'Develop the statistical intuition that separates great analysts from average ones.',
        hours: '10–12 hrs',
        tasks: [
          'Study descriptive statistics: mean, median, variance, standard deviation, IQR',
          'Learn hypothesis testing: t-test, chi-square, ANOVA — run them in Python',
          'Understand correlation vs causation with real-world examples',
          'Complete the Khan Academy Statistics and Probability course',
          'Run A/B test analysis on a sample dataset and write a report',
        ],
        resources: [
          { title: 'Khan Academy – Statistics', url: 'https://www.khanacademy.org/math/statistics-probability', tag: 'Free' },
          { title: 'StatQuest – Josh Starmer', url: 'https://www.youtube.com/@statquest', tag: 'YouTube' },
          { title: 'Think Stats – Free Book', url: 'https://greenteapress.com/thinkstats2/', tag: 'Book' },
        ],
      },
      {
        week: 5, title: 'Advanced SQL & Business Intelligence',
        description: 'Write complex analytical queries and work with BI-scale data.',
        hours: '12–14 hrs',
        tasks: [
          'Master window functions: ROW_NUMBER, RANK, LAG, LEAD, NTILE',
          'Write CTEs (WITH clauses) for complex multi-step analytical queries',
          'Build a data model in dbt (data build tool) on a sample warehouse',
          'Query Google BigQuery public datasets with standard SQL',
          'Solve 10 HackerRank SQL Hard challenges',
        ],
        resources: [
          { title: 'dbt Learn – Free', url: 'https://courses.getdbt.com/', tag: 'Course' },
          { title: 'BigQuery – Free Sandbox', url: 'https://console.cloud.google.com/bigquery', tag: 'Tool' },
          { title: 'HackerRank SQL', url: 'https://www.hackerrank.com/domains/sql', tag: 'Practice' },
        ],
      },
      {
        week: 6, title: 'Portfolio Projects & Applications',
        description: 'Build 2 end-to-end analyst portfolios and apply aggressively.',
        hours: '14–16 hrs',
        tasks: [
          'Build a full analyst project: SQL → Python EDA → Dashboard → Insight report',
          'Publish your analysis as a Kaggle notebook or Medium post',
          'Create a portfolio website listing all your dashboards and projects',
          'Apply to 15+ Data Analyst internships (LinkedIn, Internshala, Unstop)',
          'Prepare for case study interviews: product metrics, funnel analysis, SQL rounds',
        ],
        resources: [
          { title: 'Data Analyst Portfolio Guide', url: 'https://www.dataquest.io/blog/build-a-data-science-portfolio/', tag: 'Guide' },
          { title: 'Unstop – Data Internships', url: 'https://unstop.com/', tag: 'Apply' },
          { title: 'Ace the Data Science Interview', url: 'https://www.acethedatascienceinterview.com/', tag: 'Book' },
        ],
      },
    ],
  },

  // ── DATA SCIENTIST ────────────────────────────────────────────────────────
  'data-scientist': {
    label: 'Data Scientist',
    icon: 'science',
    color: 'indigo',
    milestones: [
      {
        week: 1, title: 'Python, NumPy & Statistics',
        description: 'Build the mathematical backbone every data scientist needs.',
        hours: '12–14 hrs',
        tasks: [
          'Complete NumPy and SciPy fundamentals: array operations, broadcasting, linear algebra',
          'Review probability: Bayes theorem, distributions, expected value, CLT',
          'Master pandas for data manipulation and cleaning (Kaggle micro-course)',
          'Solve 20 LeetCode Easy/Medium problems in Python',
          'Complete the Statistics chapter in Jake VanderPlas\'s Python Data Science Handbook',
        ],
        resources: [
          { title: 'Python Data Science Handbook', url: 'https://jakevdp.github.io/PythonDataScienceHandbook/', tag: 'Free Book' },
          { title: 'StatQuest – Probability', url: 'https://www.youtube.com/@statquest', tag: 'YouTube' },
          { title: 'Kaggle – NumPy', url: 'https://www.kaggle.com/learn', tag: 'Free' },
        ],
      },
      {
        week: 2, title: 'Machine Learning Fundamentals',
        description: 'Build and evaluate classical ML models correctly.',
        hours: '14–16 hrs',
        tasks: [
          'Implement Linear Regression and Logistic Regression from scratch',
          'Study bias-variance tradeoff, overfitting, regularization (L1/L2)',
          'Master cross-validation, GridSearchCV, and proper evaluation metrics',
          'Complete Kaggle Titanic competition (get >78% accuracy)',
          'Build a full pipeline with sklearn: preprocessing → model → evaluation',
        ],
        resources: [
          { title: 'Kaggle – Intermediate ML', url: 'https://www.kaggle.com/learn/intermediate-machine-learning', tag: 'Free' },
          { title: 'Hands-On ML with Sklearn', url: 'https://www.oreilly.com/library/view/hands-on-machine-learning/9781492032632/', tag: 'Book' },
          { title: 'Scikit-learn User Guide', url: 'https://scikit-learn.org/stable/user_guide.html', tag: 'Official' },
        ],
      },
      {
        week: 3, title: 'Advanced ML & Feature Engineering',
        description: 'Learn the techniques that actually win Kaggle competitions and real-world problems.',
        hours: '14–16 hrs',
        tasks: [
          'Master XGBoost, LightGBM, CatBoost — tune hyperparameters with Optuna',
          'Study advanced feature engineering: target encoding, feature interactions, embeddings',
          'Learn SHAP values for model interpretability and explainability',
          'Complete a Kaggle Tabular competition (aim for top 30%)',
          'Build an ensemble model combining 3+ different algorithms',
        ],
        resources: [
          { title: 'SHAP Documentation', url: 'https://shap.readthedocs.io/', tag: 'Library' },
          { title: 'Optuna – Hyperparameter Tuning', url: 'https://optuna.org/', tag: 'Tool' },
          { title: 'Feature Engineering – Kaggle', url: 'https://www.kaggle.com/learn/feature-engineering', tag: 'Free' },
        ],
      },
      {
        week: 4, title: 'Deep Learning & Neural Networks',
        description: 'Apply neural networks to real problems in vision, NLP, and tabular data.',
        hours: '14–16 hrs',
        tasks: [
          'Build and train a CNN on CIFAR-10 in PyTorch — achieve >85% accuracy',
          'Fine-tune a BERT model for sentiment classification (HuggingFace)',
          'Study attention mechanisms and transformer architecture in depth',
          'Implement a tabular deep learning model with PyTorch Lightning',
          'Run experiments with Weights & Biases for tracking and comparison',
        ],
        resources: [
          { title: 'fast.ai – Practical Deep Learning', url: 'https://course.fast.ai/', tag: 'Free Course' },
          { title: 'HuggingFace – NLP Course', url: 'https://huggingface.co/learn/nlp-course', tag: 'Free' },
          { title: 'Weights & Biases', url: 'https://wandb.ai/', tag: 'Tool' },
        ],
      },
      {
        week: 5, title: 'SQL, Data Pipelines & Cloud',
        description: 'Bridge data science with production-ready data engineering skills.',
        hours: '12–14 hrs',
        tasks: [
          'Master advanced SQL: window functions, CTEs, recursive queries',
          'Build an Apache Airflow DAG to automate a data pipeline',
          'Query Google BigQuery with Python (google-cloud-bigquery library)',
          'Learn Spark basics for large-scale data processing (PySpark)',
          'Deploy a ML model as a REST API using FastAPI + Docker',
        ],
        resources: [
          { title: 'Apache Airflow Docs', url: 'https://airflow.apache.org/docs/', tag: 'Official' },
          { title: 'PySpark Tutorial', url: 'https://spark.apache.org/docs/latest/api/python/', tag: 'Official' },
          { title: 'FastAPI – Build ML APIs', url: 'https://fastapi.tiangolo.com/', tag: 'Framework' },
        ],
      },
      {
        week: 6, title: 'Research Paper + Portfolio',
        description: 'Demonstrate depth through research reproduction and a published portfolio.',
        hours: '16–20 hrs',
        tasks: [
          'Reproduce a published ML paper on Papers With Code (with your own code)',
          'Write a technical blog post on your project (Towards Data Science or Medium)',
          'Build a portfolio site linking all Kaggle notebooks, GitHub repos, and dashboards',
          'Apply to 15+ Data Science internships (Google, startups, analytics firms)',
          'Prepare for case study rounds: A/B testing, metrics design, ML system design',
        ],
        resources: [
          { title: 'Papers With Code', url: 'https://paperswithcode.com/', tag: 'Research' },
          { title: 'Towards Data Science', url: 'https://towardsdatascience.com/', tag: 'Write' },
          { title: 'ML System Design – Educative', url: 'https://www.educative.io/courses/machine-learning-system-design', tag: 'Course' },
        ],
      },
    ],
  },

  // ── CYBER SECURITY ────────────────────────────────────────────────────────
  'cybersecurity': {
    label: 'Cyber Security',
    icon: 'security',
    color: 'red',
    milestones: [
      {
        week: 1, title: 'Networking & OS Fundamentals',
        description: 'You can\'t hack what you don\'t understand — master the basics of networking and OS.',
        hours: '10–12 hrs',
        tasks: [
          'Study OSI model and TCP/IP stack: how packets flow across the internet',
          'Learn IP addressing, subnetting, CIDR, NAT, DNS, DHCP, ARP',
          'Master Linux command line: permissions, processes, file system, bash scripting',
          'Practice Wireshark: capture and analyze HTTP, DNS, TCP handshake packets',
          'Complete TryHackMe "Pre-Security" learning path (free)',
        ],
        resources: [
          { title: 'TryHackMe – Pre-Security', url: 'https://tryhackme.com/path/outline/presecurity', tag: 'Free' },
          { title: 'Professor Messer – CompTIA Net+', url: 'https://www.professormesser.com/network-plus/n10-008/n10-008-video/n10-008-training-course/', tag: 'Video' },
          { title: 'Linux Journey', url: 'https://linuxjourney.com/', tag: 'Free' },
        ],
      },
      {
        week: 2, title: 'Web Application Security (OWASP)',
        description: 'Learn the OWASP Top 10 vulnerabilities and how to exploit and fix each one.',
        hours: '12–14 hrs',
        tasks: [
          'Study OWASP Top 10: SQLi, XSS, CSRF, IDOR, SSRF, XXE, Broken Auth',
          'Practice SQLi and XSS on DVWA (Damn Vulnerable Web App) locally',
          'Use Burp Suite Community to intercept and manipulate HTTP requests',
          'Complete TryHackMe "OWASP Top 10" room (free)',
          'Solve 5 web challenges on HackTheBox or PicoCTF',
        ],
        resources: [
          { title: 'OWASP Top 10', url: 'https://owasp.org/www-project-top-ten/', tag: 'Official' },
          { title: 'Burp Suite – PortSwigger Labs', url: 'https://portswigger.net/web-security', tag: 'Free Labs' },
          { title: 'PicoCTF', url: 'https://picoctf.org/', tag: 'CTF' },
        ],
      },
      {
        week: 3, title: 'Penetration Testing & Ethical Hacking',
        description: 'Learn the methodology professional pentesters use on real engagements.',
        hours: '14–16 hrs',
        tasks: [
          'Study pentesting phases: Recon → Scanning → Exploitation → Post-Exploitation → Reporting',
          'Learn Nmap for network scanning: host discovery, port scanning, OS detection',
          'Practice Metasploit on TryHackMe "Metasploit" room (free)',
          'Exploit a vulnerable VM from VulnHub (e.g., Mr Robot, Basic Pentesting)',
          'Write a professional pentest report for a practice machine',
        ],
        resources: [
          { title: 'TryHackMe – Jr Penetration Tester', url: 'https://tryhackme.com/path/outline/jrpenetrationtester', tag: 'Path' },
          { title: 'Hack The Box – Starting Point', url: 'https://www.hackthebox.com/hacker/starting-point', tag: 'Free' },
          { title: 'VulnHub – Practice VMs', url: 'https://www.vulnhub.com/', tag: 'Free VMs' },
        ],
      },
      {
        week: 4, title: 'Cryptography & Secure Coding',
        description: 'Understand cryptographic primitives and write secure code from the ground up.',
        hours: '10–12 hrs',
        tasks: [
          'Study symmetric (AES) and asymmetric (RSA, ECC) cryptography — how they work mathematically',
          'Learn hashing: SHA-256, bcrypt, scrypt — why MD5/SHA1 are broken',
          'Understand PKI, TLS handshake, certificate chains, and HTTPS internals',
          'Fix OWASP Top 10 vulnerabilities in a Python/Node.js web app (code review)',
          'Solve cryptography challenges on CryptoHack',
        ],
        resources: [
          { title: 'CryptoHack – Cryptography', url: 'https://cryptohack.org/', tag: 'Free CTF' },
          { title: 'Computerphile – Cryptography', url: 'https://www.youtube.com/@Computerphile', tag: 'YouTube' },
          { title: 'TLS 1.3 Explained', url: 'https://www.cloudflare.com/learning/ssl/what-is-tls/', tag: 'Article' },
        ],
      },
      {
        week: 5, title: 'SOC, SIEM & Incident Response',
        description: 'Learn what defenders do: monitoring, detection, and responding to attacks.',
        hours: '10–12 hrs',
        tasks: [
          'Set up Splunk Free and analyze security logs from a sample dataset',
          'Study the MITRE ATT&CK framework: tactics, techniques, and procedures',
          'Practice Splunk queries: SPL searches, dashboards, alert creation',
          'Complete TryHackMe "SOC Level 1" path',
          'Analyze a PCAP file from a malware infection and write a report',
        ],
        resources: [
          { title: 'TryHackMe – SOC Level 1', url: 'https://tryhackme.com/path/outline/soclevel1', tag: 'Path' },
          { title: 'MITRE ATT&CK Framework', url: 'https://attack.mitre.org/', tag: 'Official' },
          { title: 'Splunk Free Training', url: 'https://www.splunk.com/en_us/training/free-courses.html', tag: 'Free' },
        ],
      },
      {
        week: 6, title: 'CTF, Certifications & Applications',
        description: 'Validate your skills with CTF competitions and apply to security internships.',
        hours: '14–16 hrs',
        tasks: [
          'Complete HackTheBox "Easy" machines independently and write writeups',
          'Participate in a CTF competition (CTFtime.org)',
          'Earn CompTIA Security+ or eJPT certification (or start studying for it)',
          'Create a GitHub portfolio with tool scripts, CTF writeups, and security projects',
          'Apply to 10+ cybersecurity internships (SOC analyst, pentester, security engineer)',
        ],
        resources: [
          { title: 'CTFtime – Upcoming CTFs', url: 'https://ctftime.org/', tag: 'Compete' },
          { title: 'eJPT – eLearnSecurity', url: 'https://ine.com/learning/certifications/internal/elearnsecurity-junior-penetration-tester-cert', tag: 'Cert' },
          { title: 'LinkedIn Security Jobs', url: 'https://www.linkedin.com/jobs/cybersecurity-internship/', tag: 'Apply' },
        ],
      },
    ],
  },

  // ── CLOUD COMPUTING ───────────────────────────────────────────────────────
  'cloud': {
    label: 'Cloud Computing',
    icon: 'cloud',
    color: 'sky',
    milestones: [
      {
        week: 1, title: 'Cloud Fundamentals & Linux',
        description: 'Get your foundations right — cloud is built on networking, Linux, and virtualization.',
        hours: '10–12 hrs',
        tasks: [
          'Create a free AWS, GCP, and Azure account — explore the console',
          'Study cloud service models: IaaS, PaaS, SaaS, FaaS with real examples',
          'Master Linux administration: SSH, systemd, cron, firewalls (ufw/iptables)',
          'Complete AWS Cloud Practitioner Essentials (free on AWS Skill Builder)',
          'Set up a Linux VM on VirtualBox and host a static website on it',
        ],
        resources: [
          { title: 'AWS Skill Builder – Free', url: 'https://skillbuilder.aws/', tag: 'Official' },
          { title: 'Google Cloud Fundamentals', url: 'https://www.cloudskillsboost.google/', tag: 'Free' },
          { title: 'Linux Upskill Challenge', url: 'https://linuxupskillchallenge.org/', tag: 'Free' },
        ],
      },
      {
        week: 2, title: 'AWS Core Services',
        description: 'Hands-on mastery of the services every AWS cloud engineer uses daily.',
        hours: '14–16 hrs',
        tasks: [
          'Launch EC2 instances: AMIs, security groups, key pairs, elastic IPs',
          'Set up an S3 bucket with versioning, lifecycle policies, and static website hosting',
          'Configure VPC: subnets, route tables, internet gateway, NAT gateway',
          'Deploy a Node.js/Python app on EC2 with a load balancer (ALB)',
          'Use AWS IAM: create roles, policies, and practice least privilege',
        ],
        resources: [
          { title: 'AWS Free Tier', url: 'https://aws.amazon.com/free/', tag: 'Free' },
          { title: 'ACloudGuru – AWS SAA', url: 'https://acloudguru.com/', tag: 'Course' },
          { title: 'AWS Well-Architected', url: 'https://aws.amazon.com/architecture/well-architected/', tag: 'Official' },
        ],
      },
      {
        week: 3, title: 'Containers: Docker & Kubernetes',
        description: 'Master container orchestration — the foundation of modern cloud-native apps.',
        hours: '14–16 hrs',
        tasks: [
          'Containerize a multi-service app with Docker Compose (API + DB + Redis)',
          'Push images to Docker Hub and AWS ECR',
          'Set up a Kubernetes cluster with k3s or minikube locally',
          'Deploy an app on Kubernetes: Pods, Deployments, Services, Ingress, ConfigMaps',
          'Complete the Kubernetes "Hello Minikube" tutorial and scale a deployment',
        ],
        resources: [
          { title: 'Play with Kubernetes', url: 'https://labs.play-with-k8s.com/', tag: 'Free Lab' },
          { title: 'Kubernetes – Official Tutorial', url: 'https://kubernetes.io/docs/tutorials/', tag: 'Official' },
          { title: 'Docker – Get Started', url: 'https://docs.docker.com/get-started/', tag: 'Official' },
        ],
      },
      {
        week: 4, title: 'Infrastructure as Code (IaC)',
        description: 'Automate cloud infrastructure using code — the standard in every DevOps team.',
        hours: '12–14 hrs',
        tasks: [
          'Write Terraform configs to provision EC2, S3, VPC, and RDS on AWS',
          'Learn Terraform state management, remote backends (S3 + DynamoDB lock)',
          'Use Ansible to configure servers: install packages, manage files, deploy apps',
          'Study AWS CloudFormation vs Terraform — when to use which',
          'Practice with the Terraform AWS provider: destroy and recreate infra with one command',
        ],
        resources: [
          { title: 'Terraform Learn – HashiCorp', url: 'https://developer.hashicorp.com/terraform/tutorials', tag: 'Official' },
          { title: 'Ansible – Get Started', url: 'https://docs.ansible.com/ansible/latest/getting_started/', tag: 'Official' },
          { title: 'Gruntwork – Terraform Book', url: 'https://www.terraformupandrunning.com/', tag: 'Book' },
        ],
      },
      {
        week: 5, title: 'CI/CD, Monitoring & Security',
        description: 'Ship faster and safer with automated pipelines and observability.',
        hours: '12–14 hrs',
        tasks: [
          'Build a full CI/CD pipeline with GitHub Actions: test → build → push Docker → deploy to ECS',
          'Set up CloudWatch dashboards, alarms, and log groups for a running application',
          'Learn cloud security: S3 bucket policies, VPC security groups, AWS Config rules',
          'Configure AWS CloudTrail for audit logging and set up a security alert',
          'Implement auto-scaling on AWS: target tracking, scheduled, and step scaling',
        ],
        resources: [
          { title: 'GitHub Actions – AWS Deploy', url: 'https://github.com/marketplace/actions/configure-aws-credentials', tag: 'Tool' },
          { title: 'AWS CloudWatch Docs', url: 'https://docs.aws.amazon.com/cloudwatch/', tag: 'Official' },
          { title: 'Cloud Security Alliance', url: 'https://cloudsecurityalliance.org/research/guidance/', tag: 'Guide' },
        ],
      },
      {
        week: 6, title: 'Certification & Applications',
        description: 'Earn an industry-recognized cloud certification and land your internship.',
        hours: '14–18 hrs',
        tasks: [
          'Pass AWS Cloud Practitioner exam (₹9,000 or use free voucher programs)',
          'OR earn Google Cloud Associate Cloud Engineer certification',
          'Build a cloud portfolio project: serverless app or multi-tier architecture on AWS',
          'Write a detailed architecture diagram with cost estimation',
          'Apply to 15+ Cloud/DevOps internships on LinkedIn, Internshala, and Naukri',
        ],
        resources: [
          { title: 'AWS Certification – CLF-C02', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', tag: 'Cert' },
          { title: 'ExamTopics – Free Practice', url: 'https://www.examtopics.com/', tag: 'Practice' },
          { title: 'Naukri – Cloud Jobs', url: 'https://www.naukri.com/cloud-computing-internship-jobs', tag: 'Apply' },
        ],
      },
    ],
  },
};


const TRACK_COLORS = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-800',     icon: 'text-blue-600',   progress: 'bg-blue-500',   ring: 'ring-blue-200'   },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800',   icon: 'text-purple-600', progress: 'bg-purple-500', ring: 'ring-purple-200' },
  green:  { bg: 'bg-emerald-50',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-800', icon: 'text-emerald-600',progress: 'bg-emerald-500',ring: 'ring-emerald-200'},
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800',   icon: 'text-orange-600', progress: 'bg-orange-500', ring: 'ring-orange-200' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-800',       icon: 'text-teal-600',   progress: 'bg-teal-500',   ring: 'ring-teal-200'   },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800',   icon: 'text-indigo-600', progress: 'bg-indigo-500', ring: 'ring-indigo-200' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-800',         icon: 'text-red-600',    progress: 'bg-red-500',    ring: 'ring-red-200'    },
  sky:    { bg: 'bg-sky-50',    border: 'border-sky-200',    badge: 'bg-sky-100 text-sky-800',         icon: 'text-sky-600',    progress: 'bg-sky-500',    ring: 'ring-sky-200'    },
};

export default function PreparationRoadmapPage() {
  const { studentProfile, navigate } = useApp();
  const { userProfile } = useAuth();
  const profile = userProfile || studentProfile;

  const [selectedTrack, setSelectedTrack] = useState('fullstack');
  const [completedTasks, setCompletedTasks] = useState({});
  const [expandedWeek, setExpandedWeek] = useState(1);

  const template = ROADMAP_TEMPLATES[selectedTrack];
  const colors = TRACK_COLORS[template.color];

  // Compute progress
  const progress = useMemo(() => {
    const total = template.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
    const done = Object.keys(completedTasks).filter((k) => completedTasks[k]).length;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [completedTasks, selectedTrack, template]);

  const weekProgress = (weekNum) => {
    const m = template.milestones.find((m) => m.week === weekNum);
    if (!m) return 0;
    const done = m.tasks.filter((_, ti) => completedTasks[`${selectedTrack}-w${weekNum}-t${ti}`]).length;
    return Math.round((done / m.tasks.length) * 100);
  };

  const toggleTask = (weekNum, taskIdx) => {
    const key = `${selectedTrack}-w${weekNum}-t${taskIdx}`;
    setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isTaskDone = (weekNum, taskIdx) => !!completedTasks[`${selectedTrack}-w${weekNum}-t${taskIdx}`];

  const weekStatus = (weekNum) => {
    const pct = weekProgress(weekNum);
    if (pct === 100) return 'completed';
    if (pct > 0) return 'in_progress';
    return 'upcoming';
  };

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[14px]">route</span>
            6-Week Internship Sprint
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            Preparation Roadmap
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Select your track below. Check off tasks as you complete them — your progress is saved automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('mock-interview')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-all shadow-sm self-start"
        >
          <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">mic</span>
          Practice Mock Interview
        </button>
      </div>

      {/* ── Track Selector ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(ROADMAP_TEMPLATES).map(([key, tpl]) => {
          const c = TRACK_COLORS[tpl.color];
          const isActive = selectedTrack === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => { setSelectedTrack(key); setExpandedWeek(1); }}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center ${
                isActive
                  ? `${c.bg} ${c.border} ring-2 ${c.ring} shadow-sm`
                  : 'bg-surface-container-lowest border-surface-container-high hover:bg-surface-container-low'
              }`}
            >
              <span className={`material-symbols-outlined text-[28px] ${isActive ? c.icon : 'text-on-surface-variant'}`}>
                {tpl.icon}
              </span>
              <span className={`text-xs font-bold ${isActive ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {tpl.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Left: Milestones (8 cols) ── */}
        <div className="lg:col-span-8 space-y-4">
          {template.milestones.map((milestone) => {
            const status = weekStatus(milestone.week);
            const pct = weekProgress(milestone.week);
            const isOpen = expandedWeek === milestone.week;

            return (
              <div
                key={milestone.week}
                className={`rounded-2xl border bg-surface-container-lowest transition-all ${
                  status === 'in_progress'
                    ? `border-2 ${colors.border} shadow-md`
                    : 'border-surface-container-high'
                }`}
              >
                {/* Milestone Header */}
                <button
                  type="button"
                  onClick={() => setExpandedWeek(isOpen ? null : milestone.week)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    {/* Week Badge */}
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : status === 'in_progress'
                        ? `${colors.bg} ${colors.icon}`
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {status === 'completed'
                        ? <span className="material-symbols-outlined text-[18px]">check</span>
                        : `W${milestone.week}`}
                    </span>

                    <div>
                      <h3 className="font-bold text-on-surface text-sm leading-tight">{milestone.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-on-surface-variant">{milestone.hours}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : status === 'in_progress'
                            ? `${colors.badge}`
                            : 'bg-surface-container text-outline'
                        }`}>
                          {status === 'completed' ? 'Done' : status === 'in_progress' ? 'In Progress' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Progress ring */}
                    <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          stroke={status === 'completed' ? '#10b981' : status === 'in_progress' ? '#3b82f6' : '#cbd5e1'}
                          strokeWidth="3"
                          strokeDasharray={`${pct * 0.942} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-black text-on-surface">{pct}%</span>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      expand_more
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-5 border-t border-surface-container-high">
                    <p className="text-xs text-on-surface-variant leading-relaxed pt-4">{milestone.description}</p>

                    {/* Tasks */}
                    <div>
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-secondary">checklist</span>
                        Weekly Tasks
                      </h4>
                      <div className="space-y-2">
                        {milestone.tasks.map((task, ti) => {
                          const done = isTaskDone(milestone.week, ti);
                          return (
                            <div
                              key={ti}
                              onClick={() => toggleTask(milestone.week, ti)}
                              className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low cursor-pointer transition-colors group"
                            >
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center border flex-shrink-0 transition-all ${
                                done
                                  ? 'bg-emerald-500 border-emerald-500'
                                  : 'border-outline-variant bg-surface-container-lowest group-hover:border-secondary'
                              }`}>
                                {done && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                              </span>
                              <span className={`text-xs font-medium leading-relaxed ${done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                                {task}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Resources */}
                    <div>
                      <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-secondary">link</span>
                        Curated Resources
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {milestone.resources.map((res, ri) => (
                          <a
                            key={ri}
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col gap-1 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group border border-surface-container-high"
                          >
                            <span className="text-xs font-semibold text-primary group-hover:text-secondary leading-tight">{res.title}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full self-start ${colors.badge}`}>{res.tag}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right: Progress & Tips (4 cols) ── */}
        <div className="lg:col-span-4 space-y-5">

          {/* Overall Progress */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              Overall Progress
            </h3>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke={progress.pct === 100 ? '#10b981' : '#6366f1'}
                    strokeWidth="3.5"
                    strokeDasharray={`${progress.pct * 0.942} 100`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.5s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-black text-primary">{progress.pct}%</span>
                  <span className="text-[10px] text-on-surface-variant font-semibold">Complete</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant text-center mb-1">
              <strong className="text-on-surface">{progress.done}</strong> of <strong className="text-on-surface">{progress.total}</strong> tasks done
            </p>

            {/* Week-by-week bars */}
            <div className="mt-4 space-y-2">
              {template.milestones.map((m) => {
                const pct = weekProgress(m.week);
                return (
                  <div key={m.week} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant w-7 flex-shrink-0">W{m.week}</span>
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${colors.progress}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-on-surface-variant w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track Info */}
          <div className={`p-5 rounded-2xl ${colors.bg} border ${colors.border}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`material-symbols-outlined text-[22px] ${colors.icon}`}>{template.icon}</span>
              <h3 className="font-bold text-on-surface text-sm">{template.label} Track</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">schedule</span>
                6 weeks · ~70–90 hrs total
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">emoji_events</span>
                {template.milestones.reduce((sum, m) => sum + m.tasks.length, 0)} tasks · {template.milestones.length * 3} curated resources
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">target</span>
                Optimized for Indian tech internships
              </li>
            </ul>
          </div>

          {/* Quick Tips */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">lightbulb</span>
              Pro Tips
            </h3>
            <div className="space-y-3 text-xs text-on-surface-variant">
              {[
                { icon: 'today', text: 'Dedicate 1.5–2 hours every day. Consistency beats marathons.' },
                { icon: 'share', text: 'Build in public — tweet your progress, GitHub streak matters.' },
                { icon: 'group', text: 'Find an accountability partner or join a study Discord server.' },
                { icon: 'send', text: 'Apply while learning. Don\'t wait until you feel "ready".' },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[15px] text-secondary flex-shrink-0 mt-0.5">{tip.icon}</span>
                  <span className="leading-relaxed">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => navigate('resume-analyzer')}
              className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              Analyze My Resume
            </button>
            <button
              type="button"
              onClick={() => navigate('explore-internships')}
              className="w-full py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-bold hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">work</span>
              Explore Internships
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
