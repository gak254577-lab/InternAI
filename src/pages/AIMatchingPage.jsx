import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { matchResumeWithInternships } from '../utils/resumeMatcher';

// ── Domain / Track Metadata ──────────────────────────────────────────────────
export const DOMAIN_TRACKS = {
  fullstack: {
    id: 'fullstack',
    label: 'Full Stack Developer',
    icon: 'layers',
    color: 'blue',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    activeBg: 'bg-blue-600 text-white border-blue-600 shadow-md',
    keywords: ['react', 'node', 'express', 'mongodb', 'full stack', 'fullstack', 'typescript', 'javascript', 'sql', 'next.js', 'rest api', 'docker'],
    coreSkills: ['React', 'Node.js', 'TypeScript', 'JavaScript', 'Express', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Git', 'Docker'],
    roles: ['Full Stack Developer Intern', 'Full Stack Engineer Intern', 'Software Engineering Intern (Full Stack)'],
    searchKeyword: 'full stack intern',
  },
  frontend: {
    id: 'frontend',
    label: 'Frontend / UI',
    icon: 'desktop_windows',
    color: 'orange',
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    activeBg: 'bg-orange-600 text-white border-orange-600 shadow-md',
    keywords: ['frontend', 'front end', 'react', 'vue', 'angular', 'ui', 'ux', 'css', 'tailwind', 'html', 'javascript', 'typescript', 'figma', 'next'],
    coreSkills: ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind CSS', 'Next.js', 'Redux', 'Figma', 'Git'],
    roles: ['Frontend Developer Intern', 'React Developer Intern', 'UI Engineer Intern', 'Web Developer Intern'],
    searchKeyword: 'frontend intern',
  },
  backend: {
    id: 'backend',
    label: 'Backend / Systems',
    icon: 'dns',
    color: 'emerald',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeBg: 'bg-emerald-600 text-white border-emerald-600 shadow-md',
    keywords: ['backend', 'back end', 'node', 'python', 'java', 'go', 'golang', 'rust', 'c++', 'django', 'fastapi', 'spring', 'sql', 'postgres', 'redis', 'system design'],
    coreSkills: ['Python', 'Node.js', 'Java', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'REST APIs', 'System Design', 'Git'],
    roles: ['Backend Developer Intern', 'Python Developer Intern', 'Node.js Developer Intern', 'Software Engineer Intern (Backend)'],
    searchKeyword: 'backend intern',
  },
  ml: {
    id: 'ml',
    label: 'Machine Learning / AI',
    icon: 'psychology',
    color: 'purple',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    activeBg: 'bg-purple-600 text-white border-purple-600 shadow-md',
    keywords: ['machine learning', 'ml', 'ai', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'computer vision', 'data science', 'llm', 'transformers', 'pandas'],
    coreSkills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas', 'NumPy', 'Machine Learning', 'Deep Learning', 'NLP', 'SQL'],
    roles: ['Machine Learning Intern', 'AI Research Intern', 'Deep Learning Intern', 'GenAI Engineer Intern'],
    searchKeyword: 'machine learning intern',
  },
  'data-analyst': {
    id: 'data-analyst',
    label: 'Data Analyst',
    icon: 'bar_chart',
    color: 'teal',
    bg: 'bg-teal-50 text-teal-700 border-teal-200',
    activeBg: 'bg-teal-600 text-white border-teal-600 shadow-md',
    keywords: ['data analyst', 'analytics', 'tableau', 'power bi', 'sql', 'excel', 'pandas', 'bi', 'business intelligence', 'reporting', 'statistics'],
    coreSkills: ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'Pandas', 'Data Visualization', 'Statistics', 'ETL'],
    roles: ['Data Analyst Intern', 'Business Intelligence Intern', 'Analytics Intern'],
    searchKeyword: 'data analyst intern',
  },
  'data-scientist': {
    id: 'data-scientist',
    label: 'Data Scientist',
    icon: 'science',
    color: 'indigo',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    activeBg: 'bg-indigo-600 text-white border-indigo-600 shadow-md',
    keywords: ['data scientist', 'data science', 'statistics', 'statistical', 'pandas', 'scikit', 'machine learning', 'feature engineering', 'spark'],
    coreSkills: ['Python', 'Machine Learning', 'Statistics', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Data Modeling', 'Feature Engineering'],
    roles: ['Data Scientist Intern', 'Quantitative Research Intern', 'Decision Scientist Intern'],
    searchKeyword: 'data science intern',
  },
  cybersecurity: {
    id: 'cybersecurity',
    label: 'Cyber Security',
    icon: 'security',
    color: 'rose',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    activeBg: 'bg-rose-600 text-white border-rose-600 shadow-md',
    keywords: ['cyber', 'security', 'penetration', 'network security', 'owasp', 'ethical hacking', 'soc', 'siem', 'linux', 'burp', 'cryptography', 'bash'],
    coreSkills: ['Network Security', 'Linux', 'Python', 'OWASP Top 10', 'Penetration Testing', 'Cryptography', 'Wireshark', 'Bash', 'SIEM'],
    roles: ['Cyber Security Intern', 'Security Operations (SOC) Intern', 'Penetration Testing Intern', 'AppSec Intern'],
    searchKeyword: 'cyber security intern',
  },
  cloud: {
    id: 'cloud',
    label: 'Cloud & DevOps',
    icon: 'cloud',
    color: 'sky',
    bg: 'bg-sky-50 text-sky-700 border-sky-200',
    activeBg: 'bg-sky-600 text-white border-sky-600 shadow-md',
    keywords: ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes', 'k8s', 'terraform', 'ci/cd', 'jenkins', 'ansible', 'linux'],
    coreSkills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'Linux', 'Terraform', 'Git', 'Bash Scripting', 'Cloud Architecture'],
    roles: ['Cloud Engineer Intern', 'DevOps Intern', 'Site Reliability Engineer (SRE) Intern'],
    searchKeyword: 'devops intern',
  },
};

// ── Domain-Specific Fallback Internships ─────────────────────────────────────
const DOMAIN_FALLBACK_INTERNSHIPS = {
  fullstack: [
    {
      id: 'fs-1',
      domain: 'fullstack',
      title: 'Full Stack Engineering Intern',
      company: 'Zepto',
      location: 'Bengaluru, India (Hybrid)',
      description: 'Build fast full-stack services using React, TypeScript, Node.js, and PostgreSQL. Design high-throughput APIs for quick-commerce delivery dispatch.',
      stipend: 35000,
      tags: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker'],
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'Git'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'Z',
      logoBg: 'bg-purple-100 text-purple-700',
      applyUrl: 'https://internshala.com/internships/full-stack-development-internship',
    },
    {
      id: 'fs-2',
      domain: 'fullstack',
      title: 'Software Developer Intern (MERN)',
      company: 'Innovate Labs',
      location: 'Remote, India',
      description: 'Develop full-stack web applications using MongoDB, Express, React, and Node.js. Build scalable RESTful endpoints and interactive dashboards.',
      stipend: 30000,
      tags: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'REST API'],
      skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'Git'],
      roleType: 'Full-Time Intern',
      duration: '3-6 months',
      logoText: 'I',
      logoBg: 'bg-emerald-100 text-emerald-700',
      applyUrl: 'https://internshala.com/internships/full-stack-development-internship',
    },
    {
      id: 'fs-3',
      domain: 'fullstack',
      title: 'Full Stack Product Engineer Intern',
      company: 'CRED',
      location: 'Bengaluru, India (In-office)',
      description: 'Collaborate with frontend and backend platform teams to build consumer-facing workflows with Next.js, Node.js, and distributed microservices.',
      stipend: 40000,
      tags: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Microservices', 'Docker'],
      skills: ['Next.js', 'React', 'TypeScript', 'Node.js', 'Docker', 'REST APIs'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'C',
      logoBg: 'bg-slate-100 text-slate-800',
      applyUrl: 'https://internshala.com/internships/full-stack-development-internship',
    },
  ],
  frontend: [
    {
      id: 'fe-1',
      domain: 'frontend',
      title: 'Frontend Developer Intern (React)',
      company: 'Razorpay',
      location: 'Bengaluru, India (Hybrid)',
      description: 'Craft polished payment checkout interfaces using React, TypeScript, and modern CSS architecture. Optimize bundle sizes and client performance.',
      stipend: 35000,
      tags: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'CSS3', 'HTML5'],
      skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML5', 'CSS3', 'Git'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'R',
      logoBg: 'bg-blue-100 text-blue-700',
      applyUrl: 'https://internshala.com/internships/frontend-development-internship',
    },
    {
      id: 'fe-2',
      domain: 'frontend',
      title: 'UI Engineering Intern',
      company: 'Swiggy',
      location: 'Remote, India',
      description: 'Implement responsive design systems and motion components using Next.js, Tailwind CSS, and Figma specifications.',
      stipend: 32000,
      tags: ['Next.js', 'React', 'Tailwind CSS', 'Figma', 'JavaScript'],
      skills: ['Next.js', 'React', 'Tailwind CSS', 'Figma', 'JavaScript', 'HTML'],
      roleType: 'Full-Time Intern',
      duration: '3 months',
      logoText: 'S',
      logoBg: 'bg-orange-100 text-orange-700',
      applyUrl: 'https://internshala.com/internships/frontend-development-internship',
    },
    {
      id: 'fe-3',
      domain: 'frontend',
      title: 'Web Platform Developer Intern',
      company: 'TechCorp India',
      location: 'Hyderabad, India (Hybrid)',
      description: 'Build reusable UI component libraries with TypeScript, React, and storybook. Ensure web accessibility and cross-browser responsiveness.',
      stipend: 25000,
      tags: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Git'],
      skills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Git', 'HTML'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'T',
      logoBg: 'bg-blue-100 text-blue-600',
      applyUrl: 'https://internshala.com/internships/frontend-development-internship',
    },
  ],
  backend: [
    {
      id: 'be-1',
      domain: 'backend',
      title: 'Backend Systems Intern (Python / Django)',
      company: 'PhonePe',
      location: 'Bengaluru, India (In-office)',
      description: 'Design distributed transaction APIs, database migrations on PostgreSQL, and high-concurrency event handlers using Python and Redis.',
      stipend: 38000,
      tags: ['Python', 'PostgreSQL', 'Django', 'Redis', 'REST API', 'Docker'],
      skills: ['Python', 'PostgreSQL', 'Django', 'Redis', 'REST APIs', 'Docker', 'Git'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'P',
      logoBg: 'bg-purple-100 text-purple-700',
      applyUrl: 'https://internshala.com/internships/python-development-internship',
    },
    {
      id: 'be-2',
      domain: 'backend',
      title: 'Backend Node.js Developer Intern',
      company: 'DataFlow Systems',
      location: 'Hyderabad, India (Hybrid)',
      description: 'Architect scalable microservices with Node.js, Express, and PostgreSQL. Implement JWT authentication and RESTful service contracts.',
      stipend: 28000,
      tags: ['Node.js', 'Express', 'PostgreSQL', 'SQL', 'Docker', 'Git'],
      skills: ['Node.js', 'Express', 'PostgreSQL', 'SQL', 'Docker', 'Git', 'REST APIs'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'D',
      logoBg: 'bg-emerald-100 text-emerald-700',
      applyUrl: 'https://internshala.com/internships/backend-development-internship',
    },
    {
      id: 'be-3',
      domain: 'backend',
      title: 'Distributed Systems Intern (Go / Java)',
      company: 'Uber India',
      location: 'Hyderabad, India (Hybrid)',
      description: 'Optimize backend microservice routing, caching tiers, and gRPC endpoints handling live geolocation telemetry.',
      stipend: 45000,
      tags: ['Java', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'Microservices'],
      skills: ['Java', 'Go', 'PostgreSQL', 'Redis', 'Docker', 'System Design'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'U',
      logoBg: 'bg-black text-white',
      applyUrl: 'https://internshala.com/internships/backend-development-internship',
    },
  ],
  ml: [
    {
      id: 'ml-1',
      domain: 'ml',
      title: 'AI / Machine Learning Engineer Intern',
      company: 'NextGen Intelligence',
      location: 'Remote, India',
      description: 'Train deep learning architectures and RAG pipelines using Python, PyTorch, Hugging Face, and LangChain. Evaluate model accuracy and perplexity.',
      stipend: 35000,
      tags: ['Python', 'PyTorch', 'Machine Learning', 'NLP', 'LangChain', 'Docker'],
      skills: ['Python', 'PyTorch', 'Machine Learning', 'NLP', 'TensorFlow', 'Pandas'],
      roleType: 'Full-Time Intern',
      duration: '3-6 months',
      logoText: 'N',
      logoBg: 'bg-purple-100 text-purple-700',
      applyUrl: 'https://internshala.com/internships/machine-learning-internship',
    },
    {
      id: 'ml-2',
      domain: 'ml',
      title: 'Computer Vision & Deep Learning Intern',
      company: 'Glance AI',
      location: 'Bengaluru, India (Hybrid)',
      description: 'Develop real-time object detection and media recommendation algorithms using PyTorch, OpenCV, and CNN models.',
      stipend: 32000,
      tags: ['Python', 'PyTorch', 'OpenCV', 'Deep Learning', 'NumPy', 'Pandas'],
      skills: ['Python', 'PyTorch', 'Deep Learning', 'NumPy', 'Pandas', 'Scikit-learn'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'G',
      logoBg: 'bg-indigo-100 text-indigo-700',
      applyUrl: 'https://internshala.com/internships/machine-learning-internship',
    },
    {
      id: 'ml-3',
      domain: 'ml',
      title: 'GenAI & Applied ML Intern',
      company: 'Postman AI Labs',
      location: 'Bengaluru, India (Hybrid)',
      description: 'Build LLM-assisted API documentation agents, prompt evaluations, and semantic vector search engines.',
      stipend: 42000,
      tags: ['Python', 'LLM', 'Machine Learning', 'PyTorch', 'LangChain', 'SQL'],
      skills: ['Python', 'Machine Learning', 'PyTorch', 'LangChain', 'SQL', 'NLP'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'P',
      logoBg: 'bg-orange-100 text-orange-700',
      applyUrl: 'https://internshala.com/internships/machine-learning-internship',
    },
  ],
  'data-analyst': [
    {
      id: 'da-1',
      domain: 'data-analyst',
      title: 'Data Analytics Intern',
      company: 'Flipkart',
      location: 'Bengaluru, India (Hybrid)',
      description: 'Write complex SQL queries on BigQuery, build interactive Tableau executive dashboards, and track customer funnel conversion rates.',
      stipend: 30000,
      tags: ['SQL', 'Tableau', 'Python', 'Excel', 'Data Visualization', 'Pandas'],
      skills: ['SQL', 'Tableau', 'Python', 'Excel', 'Pandas', 'Data Visualization', 'Statistics'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'F',
      logoBg: 'bg-blue-100 text-blue-700',
      applyUrl: 'https://internshala.com/internships/data-analytics-internship',
    },
    {
      id: 'da-2',
      domain: 'data-analyst',
      title: 'Business Intelligence Intern',
      company: 'Fractal Analytics',
      location: 'Mumbai, India (In-office)',
      description: 'Analyze enterprise supply chain metrics using Power BI, SQL databases, and statistical data cleaning in Python.',
      stipend: 28000,
      tags: ['Power BI', 'SQL', 'Excel', 'Python', 'Statistics', 'ETL'],
      skills: ['Power BI', 'SQL', 'Excel', 'Python', 'Statistics', 'ETL'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'F',
      logoBg: 'bg-teal-100 text-teal-700',
      applyUrl: 'https://internshala.com/internships/data-analytics-internship',
    },
    {
      id: 'da-3',
      domain: 'data-analyst',
      title: 'Product Data Analyst Intern',
      company: 'Meesho',
      location: 'Remote, India',
      description: 'Analyze A/B experiment data, cohort retention rates, and daily transaction funnels with SQL, Python, and Metabase.',
      stipend: 32000,
      tags: ['SQL', 'Python', 'Excel', 'Data Analysis', 'Tableau', 'Pandas'],
      skills: ['SQL', 'Python', 'Excel', 'Pandas', 'Data Visualization'],
      roleType: 'Full-Time Intern',
      duration: '3 months',
      logoText: 'M',
      logoBg: 'bg-pink-100 text-pink-700',
      applyUrl: 'https://internshala.com/internships/data-analytics-internship',
    },
  ],
  'data-scientist': [
    {
      id: 'ds-1',
      domain: 'data-scientist',
      title: 'Data Science Intern',
      company: 'Mu Sigma',
      location: 'Bengaluru, India (Hybrid)',
      description: 'Build predictive statistical models, regression classifiers, and automated feature selection pipelines using Python and Scikit-learn.',
      stipend: 32000,
      tags: ['Python', 'Machine Learning', 'Statistics', 'Scikit-learn', 'Pandas', 'SQL'],
      skills: ['Python', 'Machine Learning', 'Statistics', 'Scikit-learn', 'Pandas', 'SQL'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'M',
      logoBg: 'bg-indigo-100 text-indigo-700',
      applyUrl: 'https://internshala.com/internships/data-science-internship',
    },
    {
      id: 'ds-2',
      domain: 'data-scientist',
      title: 'Quantitative Data Science Intern',
      company: 'Tiger Analytics',
      location: 'Chennai, India (Hybrid)',
      description: 'Develop time-series forecasting models and feature stores using Python, SQL, XGBoost, and statistical hypothesis testing.',
      stipend: 35000,
      tags: ['Python', 'Machine Learning', 'Statistics', 'NumPy', 'Pandas', 'SQL'],
      skills: ['Python', 'Machine Learning', 'Statistics', 'NumPy', 'Pandas', 'SQL'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'T',
      logoBg: 'bg-amber-100 text-amber-800',
      applyUrl: 'https://internshala.com/internships/data-science-internship',
    },
  ],
  cybersecurity: [
    {
      id: 'sec-1',
      domain: 'cybersecurity',
      title: 'Cyber Security Analyst Intern',
      company: 'QuickHeal Security',
      location: 'Pune, India (In-office)',
      description: 'Perform vulnerability scans, inspect malware behaviors in Linux sandbox environments, and monitor SIEM threat logs.',
      stipend: 28000,
      tags: ['Network Security', 'Linux', 'Python', 'OWASP', 'Wireshark', 'Bash'],
      skills: ['Network Security', 'Linux', 'Python', 'OWASP Top 10', 'Wireshark', 'Bash'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'Q',
      logoBg: 'bg-red-100 text-red-700',
      applyUrl: 'https://internshala.com/internships/cyber-security-internship',
    },
    {
      id: 'sec-2',
      domain: 'cybersecurity',
      title: 'Penetration Testing & AppSec Intern',
      company: 'SecOps Labs',
      location: 'Remote, India',
      description: 'Conduct OWASP Top 10 web application assessments, API security testing using Burp Suite, and review code for secure design.',
      stipend: 30000,
      tags: ['Penetration Testing', 'OWASP', 'Burp Suite', 'Python', 'Linux', 'Security'],
      skills: ['Penetration Testing', 'OWASP Top 10', 'Linux', 'Python', 'Cryptography'],
      roleType: 'Full-Time Intern',
      duration: '3-6 months',
      logoText: 'S',
      logoBg: 'bg-rose-100 text-rose-700',
      applyUrl: 'https://internshala.com/internships/cyber-security-internship',
    },
  ],
  cloud: [
    {
      id: 'cloud-1',
      domain: 'cloud',
      title: 'Cloud & DevOps Intern (AWS / Docker)',
      company: 'CloudNative Solutions',
      location: 'Pune, India (Hybrid)',
      description: 'Provision AWS infrastructure via Terraform, configure automated GitHub Actions CI/CD pipelines, and manage Docker containers.',
      stipend: 28000,
      tags: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux'],
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD Pipelines', 'Linux', 'Terraform', 'Git'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'C',
      logoBg: 'bg-sky-100 text-sky-700',
      applyUrl: 'https://internshala.com/internships/devops-internship',
    },
    {
      id: 'cloud-2',
      domain: 'cloud',
      title: 'Site Reliability Engineering (SRE) Intern',
      company: 'BrowserStack',
      location: 'Mumbai, India (Hybrid)',
      description: 'Monitor cloud reliability, configure Prometheus/Grafana alerts, and automate infrastructure deployments using Linux scripting and Python.',
      stipend: 38000,
      tags: ['Linux', 'Docker', 'Kubernetes', 'Python', 'Bash', 'AWS', 'Git'],
      skills: ['Linux', 'Docker', 'Kubernetes', 'Python', 'AWS', 'Git'],
      roleType: 'Full-Time Intern',
      duration: '6 months',
      logoText: 'B',
      logoBg: 'bg-blue-100 text-blue-700',
      applyUrl: 'https://internshala.com/internships/devops-internship',
    },
  ],
};

export default function AIMatchingPage() {
  const {
    internships,
    resumeAnalysis,
    studentProfile,
    bookmarks,
    toggleBookmark,
    navigate,
    openApplyAndTrack,
    navigateToInterview,
    selectedTrack,
    setSelectedTrack,
    fetchAllLiveInternships,
    adzunaLoading,
  } = useApp();
  const { userProfile } = useAuth();

  const profile = userProfile || studentProfile;

  // Active domain: use selectedTrack or default to 'fullstack'
  const activeTrackKey = DOMAIN_TRACKS[selectedTrack] ? selectedTrack : 'fullstack';
  const activeDomain = DOMAIN_TRACKS[activeTrackKey];

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(0); // 0, 70, 80, 90
  const [roleTypeFilter, setRoleTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('match-desc'); // 'match-desc', 'stipend-desc', 'fewest-missing'

  // Fetch live internships if empty
  useEffect(() => {
    if (!internships || internships.length === 0) {
      fetchAllLiveInternships({ keywords: activeDomain.searchKeyword, country: 'in' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When domain changes, trigger background fetch for that domain if needed
  const handleDomainSelect = (trackKey) => {
    if (setSelectedTrack) {
      setSelectedTrack(trackKey);
    }
  };

  // Determine candidate skills: prefer extracted resume skills, fallback to profile skills
  const candidateSkills = useMemo(() => {
    const resumeSkills = resumeAnalysis?.parsedData?.extractedSkills || [];
    if (resumeSkills.length > 0) return resumeSkills;

    const rawProfileSkills = profile?.skills || [];
    return rawProfileSkills.map((s) => (typeof s === 'string' ? s : s.name || '')).filter(Boolean);
  }, [resumeAnalysis, profile]);

  const hasResume = Boolean(resumeAnalysis && (resumeAnalysis.fileName || resumeAnalysis.atsScore > 0));

  // ── Calculate Domain Resume Compatibility ─────────────────────────────────
  // Evaluates candidate's resume specifically against the core required skills of the selected domain
  const domainResumeAnalysis = useMemo(() => {
    const coreSkills = activeDomain.coreSkills;
    const lowerCandidate = candidateSkills.map((s) => s.toLowerCase());

    const matchedInResume = [];
    const missingForDomain = [];

    coreSkills.forEach((skill) => {
      const isMatch = lowerCandidate.some(
        (cand) => cand.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cand)
      );
      if (isMatch) {
        matchedInResume.push(skill);
      } else {
        missingForDomain.push(skill);
      }
    });

    // Score calculation
    let domainScore = 65; // base
    if (coreSkills.length > 0) {
      domainScore = Math.round((matchedInResume.length / coreSkills.length) * 100);
      if (hasResume && domainScore > 0) {
        domainScore = Math.max(domainScore, 50);
      }
    }

    return {
      domainScore: Math.min(98, Math.max(25, domainScore)),
      matchedInResume,
      missingForDomain,
      coreSkillsCount: coreSkills.length,
    };
  }, [activeDomain, candidateSkills, hasResume]);

  // ── Pool of Internships for the Selected Domain ────────────────────────────
  const domainPool = useMemo(() => {
    // 1. Get domain fallbacks
    const fallbackList = DOMAIN_FALLBACK_INTERNSHIPS[activeTrackKey] || [];

    // 2. Filter existing live listings that match domain keywords
    const liveMatches = (internships || []).filter((job) => {
      const hay = `${job.title || ''} ${job.description || ''} ${(job.tags || []).join(' ')} ${(job.skills || []).join(' ')}`.toLowerCase();
      return activeDomain.keywords.some((kw) => hay.includes(kw.toLowerCase()));
    });

    // Merge and deduplicate by title + company
    const seen = new Set();
    const combined = [];

    [...liveMatches, ...fallbackList].forEach((job) => {
      const key = `${job.company || ''}__${job.title || ''}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(job);
      }
    });

    return combined.length > 0 ? combined : fallbackList;
  }, [internships, activeTrackKey, activeDomain]);

  // ── Compute Recommended Internships for Selected Domain ───────────────────
  const recommendedInternships = useMemo(() => {
    const candidateProfile = {
      extractedSkills: candidateSkills.length > 0 ? candidateSkills : activeDomain.coreSkills.slice(0, 5),
      targetRoles: activeDomain.roles,
    };

    return matchResumeWithInternships(candidateProfile, domainPool);
  }, [candidateSkills, activeDomain, domainPool]);

  // Apply filters and sorting
  const filteredInternships = useMemo(() => {
    return recommendedInternships.filter((job) => {
      const matchScore = job.resumeMatchScore || 70;
      if (minMatchScore > 0 && matchScore < minMatchScore) {
        return false;
      }

      if (roleTypeFilter !== 'all' && job.roleType !== roleTypeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matched =
          (job.title || '').toLowerCase().includes(q) ||
          (job.company || '').toLowerCase().includes(q) ||
          (job.location || '').toLowerCase().includes(q) ||
          (job.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (job.matchedSkills || []).some((s) => s.toLowerCase().includes(q));
        if (!matched) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'match-desc') {
        return (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0);
      }
      if (sortBy === 'stipend-desc') {
        const stipendA = typeof a.stipend === 'number' ? a.stipend : 0;
        const stipendB = typeof b.stipend === 'number' ? b.stipend : 0;
        return stipendB - stipendA;
      }
      if (sortBy === 'fewest-missing') {
        const missingA = a.missingSkills?.length || 0;
        const missingB = b.missingSkills?.length || 0;
        return missingA - missingB;
      }
      return 0;
    });
  }, [recommendedInternships, minMatchScore, roleTypeFilter, searchQuery, sortBy]);

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[30px] text-secondary">smart_toy</span>
              AI Matching
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold border border-secondary/20">
              Domain &amp; Resume Driven
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Internships filtered and ranked specifically for your <strong>{activeDomain.label}</strong> domain, cross-referenced with your analyzed resume skills.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('resume-analyzer')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">description</span>
          <span>{hasResume ? 'Re-Analyze / Update Resume' : 'Upload Resume for 95%+ Matching'}</span>
        </button>
      </div>

      {/* ── Domain Selector (8 Tracks) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">domain</span>
            Select Your Target Domain
          </span>
          <span className="text-[11px] text-on-surface-variant font-medium">
            Active: <strong className="text-primary">{activeDomain.label}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {Object.entries(DOMAIN_TRACKS).map(([key, track]) => {
            const isActive = activeTrackKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleDomainSelect(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                  isActive
                    ? `${track.activeBg} ring-2 ring-secondary/30 scale-[1.02]`
                    : `${track.bg} hover:bg-surface-container-low hover:border-secondary/40`
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{track.icon}</span>
                <span className="text-[11px] font-bold leading-tight">{track.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Domain-Related Resume Compatibility Card ── */}
      <div className="p-5 lg:p-6 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[26px]">{activeDomain.icon}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base font-extrabold text-primary">
                  Resume Alignment: {activeDomain.label}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-bold">
                  {domainResumeAnalysis.domainScore}% Compatible
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {hasResume
                  ? `Evaluated against extracted skills in "${resumeAnalysis.fileName || 'Your Resume'}"`
                  : 'Based on student profile skills. Upload a resume for deeper ATS keyword calibration.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate('preparation-roadmap')}
              className="px-3.5 py-1.5 rounded-xl border border-secondary/30 bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary/20 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">alt_route</span>
              <span>Open {activeDomain.label} Roadmap</span>
            </button>
          </div>
        </div>

        {/* Matched vs Missing Domain Skills Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Matched in Resume */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                Domain Skills in Your Resume ({domainResumeAnalysis.matchedInResume.length})
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">Ready for interviews</span>
            </div>
            {domainResumeAnalysis.matchedInResume.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {domainResumeAnalysis.matchedInResume.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 font-semibold text-[11px] border border-emerald-300/50"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">
                No matching skills found in resume for this domain yet. Add these core skills to boost your ATS match!
              </p>
            )}
          </div>

          {/* Missing in Resume */}
          <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span>
                Missing Skills for this Domain ({domainResumeAnalysis.missingForDomain.length})
              </span>
              <span className="text-[10px] text-rose-700 font-semibold">Add to resume</span>
            </div>
            {domainResumeAnalysis.missingForDomain.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {domainResumeAnalysis.missingForDomain.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-rose-100/80 text-rose-900 font-semibold text-[11px] border border-rose-300/50"
                  >
                    + {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-800 font-bold">
                Outstanding! You have all core skills covered for this domain.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeDomain.label} internships, companies, or skills...`}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Match Score Filter */}
          <select
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value={0}>All Match Scores</option>
            <option value={85}>85%+ High Match</option>
            <option value={75}>75%+ Strong Match</option>
            <option value={60}>60%+ Moderate Match</option>
          </select>

          {/* Role Type Filter */}
          <select
            value={roleTypeFilter}
            onChange={(e) => setRoleTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value="all">All Role Types</option>
            <option value="Full-Time Intern">Full-Time Intern</option>
            <option value="Part-Time Intern">Part-Time Intern</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value="match-desc">Sort by: Highest Match</option>
            <option value="stipend-desc">Sort by: Highest Stipend</option>
            <option value="fewest-missing">Sort by: Fewest Missing Skills</option>
          </select>
        </div>
      </div>

      {/* ── Recommended Internships for Domain Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-secondary">recommend</span>
            Recommended {activeDomain.label} Internships for Your Resume
          </h2>
          <span className="text-xs text-on-surface-variant font-medium">
            Showing {filteredInternships.length} of {recommendedInternships.length} roles
          </span>
        </div>

        {adzunaLoading ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-surface-container-high space-y-3">
            <span className="material-symbols-outlined text-[36px] text-secondary animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-primary">Searching live {activeDomain.label} listings…</p>
          </div>
        ) : filteredInternships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredInternships.map((internship) => {
              const matchScore = internship.resumeMatchScore || 75;
              const isBookmarked = bookmarks.includes(internship.id);
              const matchColor =
                matchScore >= 80
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : matchScore >= 60
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200';

              return (
                <div
                  key={internship.id}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary/50 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Header: Logo, Title, Bookmark, Match Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center flex-shrink-0 text-sm ${
                            internship.logoBg || 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {internship.logoText || (internship.company?.charAt(0) || 'C')}
                        </div>
                        <div className="min-w-0">
                          <h4
                            className="font-bold text-sm text-primary truncate hover:text-secondary cursor-pointer"
                            onClick={() => navigate('internship-details', internship.id)}
                          >
                            {internship.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {internship.company} • {internship.location || 'India'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleBookmark(internship.id)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isBookmarked
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'text-outline hover:text-on-surface border-transparent hover:bg-surface-container-low'
                          }`}
                          title={isBookmarked ? 'Remove Bookmark' : 'Save for Later'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isBookmarked ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>

                        <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${matchColor}`}>
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          {matchScore}% Match
                        </div>
                      </div>
                    </div>

                    {/* Stipend & Details */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
                      <span className="font-bold text-primary">
                        {internship.stipend
                          ? typeof internship.stipend === 'number'
                            ? `₹${internship.stipend.toLocaleString()}/mo`
                            : internship.stipend
                          : '₹25,000/mo'}
                      </span>
                      <span>•</span>
                      <span>{internship.roleType || 'Full-Time Intern'}</span>
                      <span>•</span>
                      <span>{internship.duration || '3-6 months'}</span>
                    </div>

                    {/* Matched Skills */}
                    {internship.matchedSkills && internship.matchedSkills.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                          Matched Skills ({internship.matchedSkills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {internship.matchedSkills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px] text-emerald-600">done</span>
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {internship.missingSkills && internship.missingSkills.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                          Missing Skills ({internship.missingSkills.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {internship.missingSkills.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[11px] font-semibold border border-rose-200 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[12px] text-rose-500">close</span>
                              {s}
                            </span>
                          ))}
                          {internship.missingSkills.length > 4 && (
                            <span className="text-[10px] text-on-surface-variant self-center">
                              +{internship.missingSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high/60">
                    <button
                      type="button"
                      onClick={() => navigate('internship-details', internship.id)}
                      className="flex-1 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold transition-all text-center cursor-pointer"
                    >
                      View Details
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToInterview(internship.id)}
                      className="py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Practice Mock Interview for this role"
                    >
                      <span className="material-symbols-outlined text-[15px]">mic</span>
                      <span>Interview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openApplyAndTrack(internship)}
                      className="flex-1 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all text-center flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <span>Apply Now</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-surface-container-high space-y-3">
            <span className="material-symbols-outlined text-[44px] text-on-surface-variant opacity-40">
              filter_list_off
            </span>
            <h3 className="font-bold text-sm text-primary">No matching {activeDomain.label} internships found</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Try adjusting your search query, lowering the minimum match score, or selecting another domain track above.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMinMatchScore(0);
                setRoleTypeFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
