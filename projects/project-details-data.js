// Shared data source for all /projects/<slug>/ detail pages.
// Add new entries here using the folder name as the key.
window.PROJECT_DETAILS = {
  AutomationDashboard: {
    title: "Automation Dashboard",
    subtitle: "Power BI reporting suite for IT infrastructure health, SLA trends, and operational KPIs.",
    createdOn: "November 2025",
    visibility: "Public",
    status: "Active",
    likes: 8,
    heroImage: "../../assets/images/dashboard.png",
    heroFit: "contain",
    logoImage: "../../assets/images/logoo.webp",
    overview:
      "This dashboard centralizes operational metrics and highlights trends that help teams take faster, data-driven decisions.",
    requirements: [
      "Power BI access with workspace permissions",
      "Structured KPI source data (Excel/SharePoint/API)",
      "Defined SLA/KPI definitions for each team"
    ],
    highlights: [
      "Unified KPI view for performance and SLA adherence",
      "Trend analysis to identify recurring operational bottlenecks",
      "Interactive filtering by process, team, and timeline",
      "Executive-friendly snapshots for quick decision-making"
    ],
    mvp: [
      "One-screen visibility of SLA health and risk trends for faster leadership decisions",
      "Operational bottlenecks become action-ready with interactive drilldowns"
    ],
    techStack: ["Power BI", "Power Query", "DAX", "Excel", "SharePoint"],
    gallery: [
      { src: "../../assets/images/dashboard.png", alt: "Automation dashboard overview" },
      { src: "../../assets/images/hcl.webp", alt: "Operational context visual" }
    ],
    links: [
      { label: "See Demo", href: "https://youtube.com/", external: true },
      { label: "Back to Projects", href: "../../#projects", external: false }
    ]
  },

  AttendanceTracker: {
    title: "Attendance Tracker App",
    subtitle: "Power Apps and Power Automate workflow for attendance and reporting automation.",
    createdOn: "August 2025",
    visibility: "Internal",
    status: "Active",
    likes: 16,
    heroImage: "../../assets/images/Mondelez.webp",
    heroFit: "contain",
    logoImage: "../../assets/images/logoo.webp",
    overview:
      "This project streamlines daily attendance operations, reduces manual edits, and provides clean reporting for managers and stakeholders.",
    requirements: [
      "Microsoft 365 tenant access",
      "SharePoint list setup for attendance source",
      "Power Apps and Power Automate environment permissions"
    ],
    highlights: [
      "Automated attendance capture and validation flows",
      "Role-based views for team leads and managers",
      "Data quality checks with archival automation",
      "Dashboard-ready output for quick operational insights"
    ],
    mvp: [
      "Cuts manual attendance effort by automating capture, validation, and reporting",
      "Delivers manager-ready insights with cleaner data quality and role-based access"
    ],
    techStack: ["Power Apps", "Power Automate", "Power BI", "SharePoint"],
    gallery: [
      { src: "../../assets/images/dashboard.png", alt: "Attendance dashboard preview" },
      { src: "../../assets/images/Mondelez.webp", alt: "Project context visual" }
    ],
    links: [
      { label: "See Demo Video", href: "https://youtube.com/", external: true },
      { label: "Back to Projects", href: "../../#projects", external: false }
    ]
  },

  "sursight-studio": {
    title: "SurSight Studio",
    subtitle: "A next-generation riyaz and pitch intelligence studio where musicians can see, train, and improve intonation with real-time visual feedback.",
    createdOn: "January 2026",
    visibility: "Public",
    status: "Live",
    likes: 12,
    heroImage: "../../assets/images/pitch1.webp",
    heroFit: "contain",
    logoImage: "../../assets/images/logoo.webp",
    overview:
      "SurSight Studio (v2) is a musician-focused web app for real-time pitch training and Sargam practice. It captures microphone input, tracks note stability live, maps frequencies to both Western notes and Indian swaras relative to the selected Sa, and visualizes progress across timeline, cent deviation, and advanced analysis views. The latest version adds stronger practice syncing (Sa + octave), richer guided exercises, compact mobile workflows, and polished onboarding so learners can start faster and practice with more precision.",
    requirements: [
      "Modern browser with microphone access (Chrome, Edge, or Safari)",
      "Headphones or a quiet environment for cleaner pitch detection",
      "Basic understanding of Sa/Re/Ga or Western notes for better exercise flow"
    ],
    highlights: [
      "Real-time pitch timeline with target-note guidance and cent-level tuning feedback",
      "Dual mapping engine: Western notes + Sargam aligned to selected Sa",
      "Exercise engine synced with live settings (Sa and octave) for consistent targets",
      "Practice-focused modules: chromatic flow, Sargam drills, interval and octave exercises",
      "Advanced analysis views with pre-start empty state and cleaner light/dark readability",
      "Smart controls for noisy spaces: low-cut, gate, clarity, and adjustable FPS performance",
      "Mobile-compact UI with redesigned exercise mode, quick controls, and onboarding hints"
    ],
    mvp: [
      "Turns every riyaz session into measurable progress with real-time visual intonation feedback",
      "Bridges Western notes and Indian swaras around user-selected Sa for practical instrument/vocal training"
    ],
    techStack: ["JavaScript", "Web Audio API", "Canvas", "CSS", "Music Pedagogy"],
    gallery: [
      { src: "../../assets/images/pitch2.webp", alt: "Pitch-Sargam controls and live readouts" },
      { src: "../../assets/images/pitch3.webp", alt: "Pitch-Sargam timeline and practice visuals" }
    ],
    links: [
      { label: "Try Now", href: "../sursight-studio-app/", external: false },
      { label: "Back to Projects", href: "../../#projects", external: false }
    ]
  },

  liteedit: {
    title: "LiteEdit",
    subtitle: "A local-first image editing studio with pro export workflows, camera import, and mobile-optimized controls.",
    createdOn: "February 2026",
    visibility: "Public",
    status: "Live",
    likes: 0,
    heroImage: "../../assets/images/dashboard.png",
    heroFit: "contain",
    logoImage: "../../assets/images/logoo.webp",
    overview:
      "LiteEdit Pro runs entirely in the browser and keeps every edit on-device for privacy. It now supports simple and advanced workflows, multi-source import (file, folder, camera photo, and document scan), brush-based editing tools, export progress with size-savings insights, and advanced output modes including single exports, bulk ZIP, and PDF (combined or separate).",
    requirements: [
      "Modern browser with JavaScript enabled",
      "Image files (JPG, PNG, WebP, AVIF, BMP, GIF, TIFF)",
      "Sufficient local memory for processing up to 20 images"
    ],
    highlights: [
      "Simple and Advanced modes for beginner-friendly and power-user workflows",
      "Import from image, folder, camera photo, or document scan with optional auto-optimization",
      "Pro editing tools: crop, pen, highlighter, blur brush, resize, rotate, flip, brightness, contrast, and saturation",
      "Dedicated export center with format, quality, metadata strip, progress bar, and size-saving comparison",
      "Bulk export supports ZIP and PDF modes (single combined PDF or separate PDFs in ZIP)",
      "Compact mobile experience with floating actions, collapsible controls, and live adjustment preview overlay"
    ],
    mvp: [
      "Privacy-first editing with full on-device processing, no server uploads required",
      "Fast import-to-export workflow optimized for both single edits and bulk output production"
    ],
    techStack: ["HTML", "CSS", "JavaScript", "Canvas API", "JSZip", "FileSaver.js", "jsPDF"],
    gallery: [
      { src: "../../assets/images/dashboard.png", alt: "LiteEdit workspace preview" },
      { src: "../../assets/images/pitch2.webp", alt: "LiteEdit controls and workflow context" }
    ],
    links: [
      { label: "Try Now", href: "../liteedit-app/", external: false },
      { label: "Back to Projects", href: "../../#projects", external: false }
    ]
  }
};
