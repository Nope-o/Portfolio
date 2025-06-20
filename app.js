// Define navigation tabs
const NAV_TABS = [
  { id: 'about', label: 'About' },
  { id: 'journey', label: 'Life Journey', mobileLabel: 'Life' },
  { id: 'resume', label: 'Resume', mobileLabel: 'Resume' },
  { id: 'contact', label: 'Contact', mobileLabel: 'Contact' },
  { id: 'privacy', label: 'Privacy Policy', mobileLabel: 'Privacy' }
];

/**
 * Navbar Component: Handles navigation, mobile responsiveness, and logo animation.
 * @param {object} props - Component props.
 * @param {string} props.activeTab - The currently active tab.
 * @param {function} props.setActiveTab - Function to set the active tab.
 */
function Navbar({ activeTab, setActiveTab }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [animateLogo, setAnimateLogo] = React.useState(false); // State for logo animation
  const [isScrolledDown, setIsScrolledDown] = React.useState(false); // State for scroll detection for header
  const lastScrollY = React.useRef(0); // Ref to store last scroll position

  // Effect to handle window resize and scroll for header compact/detailed view
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    const handleScroll = () => {
      if (isMobile) { // Only apply this behavior on mobile
        const currentScrollY = window.scrollY;

        // Define scroll thresholds for hysteresis to prevent flickering
        const scrollDownThreshold = 80; // User scrolls down past this to become compact
        const scrollUpThreshold = 60; // User scrolls up past this to revert to expanded

        // Only change state if scrolling past a threshold AND the state is different
        if (currentScrollY > lastScrollY.current && currentScrollY > scrollDownThreshold && !isScrolledDown) {
          setIsScrolledDown(true);
        } else if (currentScrollY < lastScrollY.current && currentScrollY < scrollUpThreshold && isScrolledDown) {
          setIsScrolledDown(false);
        }
        lastScrollY.current = currentScrollY;
      } else {
        // Ensure it's never compact on desktop
        setIsScrolledDown(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    // Initial check on mount
    handleResize();
    handleScroll(); // Call once on mount to set initial state

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMobile, isScrolledDown]); // Added isScrolledDown to dependency array for reliable updates

  // Handle logo click to trigger animation and navigate to About section
  const handleLogoClick = () => {
    setAnimateLogo(true); // Trigger animation
    setTimeout(() => setAnimateLogo(false), 1000); // Reset after 1 second
    setActiveTab('about', 'click'); // Navigate to About section
  };

  // Determine header classes based on scroll state for mobile
  const headerClasses = `bg-white/75 backdrop-blur shadow sticky top-0 z-50 transition-all duration-300 ease-in-out
                         ${isMobile && isScrolledDown ? 'header-compact' : 'header-expanded'}`;

  // Conditional classes for the main content wrapper (logo and nav)
  const mainContentWrapperClasses = `container mx-auto px-4 md:px-8
                                     flex ${isMobile && isScrolledDown ? 'flex-row items-center justify-between py-2' : 'flex-col items-center justify-center py-3 md:flex-row md:justify-between md:items-center'}`;

  // Conditional classes for logo frame
  const logoFrameClasses = `logo-frame group cursor-pointer select-none
                            ${isMobile && isScrolledDown ? 'flex-shrink-0' : 'w-full text-center mb-4 md:w-auto md:text-left md:mb-0'}
                            ${animateLogo ? "logo-burst" : ""}`;

  // Conditional classes for logo text
  const logoTextClasses = `logo-text group-hover:tracking-widest transition-all
                           ${isMobile && isScrolledDown ? 'hidden' : ''}`; // Hidden when compact

  // Conditional classes for navigation container
  const navContainerClasses = `w-full ${isMobile && isScrolledDown ? 'block' : 'block md:block'} md:w-auto`;

  // Conditional classes for navigation list
  const navListClasses = `flex flex-row items-center gap-1 w-full
                          ${isMobile && isScrolledDown ? 'justify-end' : 'justify-center'}`; // Tabs to right on compact, centered otherwise

  return (
    <header className={headerClasses}>
      <div className={mainContentWrapperClasses}>
        <span
          className={logoFrameClasses}
          onClick={handleLogoClick}
        >
          <img
            src="logoo.webp"
            alt="Madhav Kataria"
            className="h-6 sm:h-8 w-auto inline-block mr-2 -mt-[0.1rem]"
          />
          <span className={logoTextClasses}>Madhav Kataria</span>
          <span className="absolute -top-3 -right-6 hidden md:inline-block animate-bounce text-2xl text-blue-900">★</span>
        </span>
        <nav className={navContainerClasses}>
          <ul className={navListClasses}>
            {NAV_TABS.map(tab => (
              (isMobile && tab.id === 'privacy') ? null : (
                <li key={tab.id} className="relative">
                  <button
                    className={"nav-link" + (activeTab === tab.id ? " active" : "") + " px-3 py-2 rounded-md transition-all duration-300"}
                    onClick={() => setActiveTab(tab.id, 'click')}
                  >
                    {isMobile && tab.mobileLabel ? tab.mobileLabel : tab.label}
                    <span className="nav-underline"></span>
                  </button>
                </li>
              )
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

/**
 * About Component: Displays introductory information about Madhav Kataria.
 * @param {object} props - Component props.
 * @param {function} props.showSection - Function to navigate to a specific section.
 */
function About({ showSection }) {
  return (
    <section className="about-bg p-8 rounded-3xl shadow-2xl mb-10 relative overflow-hidden" style={{ minHeight: '60vh' }}>
      <div className="relative z-10 flex about-flex-mobile md:flex-row flex-col items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
        <div className="flex-shrink-0 flex flex-col items-center md:items-start about-photo-mobile">
          <div className="about-photo-bg mb-3 mt-2 shadow-lg hover:scale-105 transition-transform duration-500">
            <img src="Madhav-kataria.webp" alt="Madhav Kataria" className="rounded-full w-40 h-40 object-cover shadow-xl border-4 border-white" />
          </div>
        </div>
        <div className="flex-grow about-text-mobile">
          <h2 className="text-4xl font-extrabold about-main-title mb-3 tracking-tight drop-shadow-sm">
            Hello, I'm <span>Madhav Kataria!</span>
          </h2>
          <p className="text-lg text-gray-100 leading-relaxed mb-2 card-float-in">
            Currently pursuing Bachelor's in Data Science and AI from IIT Guwahati.
          </p>
          <p className="text-lg text-gray-200 leading-relaxed mb-3 card-float-in">
            I am a passionate and results-oriented professional with expertise in <strong className="about-strong">Robotic Process Automation (RPA), Power Platform development (Power Apps, Power BI), and IT Infrastructure management</strong>. My journey began with a desire to <strong className="about-strong">build innovative solutions that boost efficiency, minimize human errors, and foster continuous learning and growth.</strong>, and continuously learn and grow. I thrive on challenges and am always seeking new opportunities to make a meaningful impact.
          </p>
          <p className="text-md text-gray-300 mb-3 card-float-in">
            My unique value proposition lies in my ability to <strong className="about-strong">leverage AI, Data insights and automation to optimize organizational processes, specifically in the IT Infra Domain</strong>. I am motivated by <strong className="about-strong">solving complex problems, fostering collaborative environments, and pushing creative boundaries to deliver tangible improvements.</strong>
          </p>
          <div className="space-y-2 mb-6 card-float-in">
            <h3 className="text-xl font-semibold about-value">My Values:</h3>
            <ul className="list-disc list-inside text-gray-200">
              <li>Innovation &amp; Continuous Learning</li>
              <li>Collaboration &amp; Teamwork</li>
              <li>Integrity &amp; Transparency</li>
              <li>User-Centric Approach</li>
            </ul>
          </div>
          <button onClick={() => showSection('contact', 'click')}
            className="bg-gradient-to-r from-sky-900 to-blue-950 hover:from-blue-800 hover:to-blue-900 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 pulse"
          >
            Get in Touch!
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Journey Component: Displays a timeline of life experiences.
 */
function Journey() {
  const [showDetails, setShowDetails] = React.useState({});
  // New state to track which icon is animating
  const [animatingIcon, setAnimatingIcon] = React.useState(null); 

  const toggleDetails = (index) => {
    // Trigger animation
    setAnimatingIcon(index);
    setTimeout(() => setAnimatingIcon(null), 300); // Reset animation after its duration

    setShowDetails(prev => ({
      ...prev,
      [index]: !prev[index] 
    }));
  };
  // Timeline items data
  const timelineItems = [
    {
      title: "Started Bachelor's Degree at IIT Guwahati",
      time: "Year of Enrollment - Present",
      desc: "Began my Bachelor's in Data Science and AI from IIT Guwahati, diving deep into cutting-edge technologies and foundational concepts.",
      fullDesc: `Commenced a rigorous Bachelor's program in Data Science and AI at IIT Guwahati, one of India's premier technical institutions. This program has provided a strong foundation in algorithms, machine learning, artificial intelligence, and data analytics. Actively involved in various academic projects and research initiatives, exploring advanced topics and developing practical skills in data manipulation, model building, and system optimization. My coursework includes subjects like advanced statistics, deep learning, natural language processing, and big data technologies, preparing me for a career at the forefront of data innovation.`,
      logoUrl: "IITG_logo.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/4341/4341160.png"
    },
    {
      title: "Training at HCL TechBee Program",
      time: "Sept 2022 - Mar 2023",
      desc: "Completed intensive 6-month training focusing on Data Centre Operations, Linux CLI, networking, AWS, and basic programming.",
      fullDesc: `Underwent comprehensive 6-month training through the HCL TechBee Program, designed to equip me with essential IT skills. The curriculum covered Data Centre Operations, providing insights into managing and maintaining critical IT infrastructure. Gained practical experience with Linux CLI, network configuration, and DHCP/IP setup. Acquired fundamental knowledge in networking concepts using Cisco VLANs, routing protocols, and SSH. Understood Windows Server administration, including Active Directory and RAID setup. Received hands-on training in Amazon Web Services (AWS), focusing on cloud services like EC2, S3, and VPC, and Elastic Beanstalk. Additionally, I was introduced to basic programming concepts in Python, C, SQL, and Oracle, laying a strong foundation for future development roles. This program fostered a practical, problem-solving approach to IT challenges.`,
      logoUrl: "hcl.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/1376/1376421.png"
    },
    {
      title: "Internship at HCL - Technical Support Engineer",
      time: "Mar 2023 - Sept 2023",
      desc: "Served as Technical Support Engineer for Ericsson Global Organization, achieving high resolve counts and contributing to knowledge base articles.",
      fullDesc: `Worked as a Technical Support Engineer intern for Ericsson Global Organization, providing first-line and second-line support for complex technical issues. My responsibilities included diagnosing and resolving hardware and software problems, troubleshooting network connectivity, and assisting users with various IT-related queries. Consistently achieved high resolve count and received user satisfaction certificates, demonstrating effective problem-solving skills. Received recognition from the Global Quality and Process Head at Ericsson for contributions. Actively contributed to the internal knowledge base by drafting detailed technical articles for new technologies and solutions, improving efficiency for the support team and self-service options for users. Participated in the Skill India platform under managerial guidance, showcasing technical abilities in a competitive environment.`,
      logoUrl: "ericsson.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/10822/10822222.png"
    },
    {
      title: "Full-Time Role & Automation Specialist",
      time: "Sept 2023 - Present",
      desc: "Transitioned to a full-time role, focusing on automation with Power Apps and Power Automate, and developing Power BI reports.",
      fullDesc: `Transitioned into a full-time role as a Technical Support Engineer and Automation Specialist. A significant portion of my role involves developing and implementing automation solutions using Microsoft Power Platform. This includes creating robust applications with Power Apps to streamline business processes, automating repetitive tasks with Power Automate flows, and designing interactive Power BI reports to provide data-driven insights. I am responsible for identifying automation opportunities, gathering requirements from stakeholders, and delivering solutions that enhance operational efficiency, reduce manual effort, and improve accuracy across various IT infrastructure domains. I collaborate closely with cross-functional teams to ensure seamless integration and deployment of automation initiatives. Developed an attendance tracker application on the Power Apps platform to streamline project resource management. Implemented automated data archiving processes, including duplication removal, improving data integrity. Created a KBA-review application and Power BI reports to enhance knowledge management and data-driven insights. Developed scripts for browser cache and cookies management to improve system performance and user experience.`,
      logoUrl: "hcl.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/4300/4300059.png"
    },
    {
      title: "Developed Key Power Platform Applications",
      time: "Ongoing",
      desc: "Successfully developed and deployed the Attendance Tracker and KBA Review applications, significantly improving operational efficiency.",
      fullDesc: `Led the development and deployment of critical applications using the Microsoft Power Platform, resulting in significant operational improvements. The 'Attendance Tracker' application, built with Power Apps and Power Automate, centralized resource management, tracked daily attendance, calculated absenteeism percentage calculation by role/location/Manager, automated data archiving using Power Automate, automated correction of incorrect attendance records, and real-time Power BI reporting and analytics. Technologies used: Power Apps, Power BI, Power Automate, SharePoint.

The 'KBA Review' application, also on Power Apps, transformed knowledge article quality management. It enabled structured reviews, integrated Gen-AI Bot optimization formatting, automated dynamic email notifications to L2 teams, and facilitated a ticketing tool-like workflow for knowledge base article updates. This includes a knowledge article quality review system, Gen-AI Bot optimization formatting, dashboards to track ongoing activities, automated dynamic email system to different L2 teams after KBA review, automated assignment to L2 groups, automated feedback to SD when changes are completed, and ticketing tool-like workflow management. Technologies used: Power Apps, Power BI, Power Automate, AI Integration.

Both projects involved end-to-end development, from requirements gathering to deployment and post-launch support, demonstrating my ability to deliver high-impact solutions. Leveraging the Microsoft Power Platform to automate processes and provide data-driven solutions for HCL and Ericsson: developed tools for attendance tracking with role-based access and automated shift reminders; integrated Power Apps with ticketing systems to streamline workflows; created and delivered data reports using Power BI for Mondelez EUC and EUC Tech departments, providing valuable insights.`,
      logoUrl: "hcl.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/8899/8899687.png"
    },
    {
      title: "Recognized for Automation & Quality",
      time: "Ongoing",
      desc: "Received multiple HCL certificates and client appreciation for automation, reports, highest resolve count and user satisfaction, with work recognized by Ericsson's Global Quality Head.",
      fullDesc: `Consistently recognized for outstanding contributions to automation and quality initiatives. Received various motivating certificates by HCL including the certificate for Automation and creating Power BI Reports, developing applications using Power Apps and USATs etc. Consistently achieved the highest resolve count among peers and garnered widespread user satisfaction, evidenced by over 50 positive client feedback instances. My work has been specifically acknowledged by the Global Quality and Process Head of Ericsson, highlighting the significant impact of my automation efforts on their global operations. Additionally, I contributed to drafting numerous useful Knowledge-Based Articles (KBAs), further enhancing knowledge management. I was also proud to represent at the State Level for Cloud Computing at Skill India in Bangalore, showcasing my technical expertise. Recognized Performing Artist on All India Radio (Nationally Broadcasted).`,
      logoUrl: "ericsson.webp",
      iconUrl: "https://cdn-icons-png.flaticon.com/128/9961/9961540.png"
    }
  ];

  return (
    <section className="bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-white p-7 rounded-3xl shadow-2xl mb-10">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight drop-shadow-sm">My Life Journey &amp; Experiences</h2>

      <p className="text-center text-gray-700 mb-6">Explore the significant milestones, professional growth, and personal experiences that have shaped my journey.</p>
      <div className="mt-10">
        <h3 className="text-xl font-bold text-blue-950 mb-2">Timeline....</h3>
        <ol className="timeline-list">
          {timelineItems.map((item, i) => (
            <li key={i} className="timeline-item">
              <span className="timeline-dot">
                <img 
                  src={item.iconUrl} 
                  alt="icon" 
                  className={`timeline-icon ${animatingIcon === i ? 'animate-jiggle' : ''}`} // Apply animation class conditionally
                />
              </span>
              <div className="flex-1">
                <div className="timeline-content cursor-pointer flex justify-between items-start" onClick={() => toggleDetails(i)}>
                  <div className="flex-grow">
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <span className="block text-gray-500 text-xs mb-1">{item.time}</span>
                    <p className="text-slate-700">{item.desc}</p>
                  </div>
                  {item.logoUrl && (
                    <img src={item.logoUrl} alt={`${item.title} logo`} className="w-10 h-10 object-contain ml-4 mt-1 flex-shrink-0" onError="this.onerror=null;this.src='https://placehold.co/40x40/f1f5f9/1e293b?text=Logo';" />
                  )}
                  {!showDetails[i] && (
                    <div className="absolute bottom-2 right-2">
                      <svg className="w-6 h-6 text-gray-400 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7-7-7"></path>
                      </svg>
                    </div>
                  )}
                </div>
                <div className={`timeline-details mt-2${showDetails[i] ? ' open' : ''}`} onClick={() => toggleDetails(i)}>
                  {showDetails[i] && (
                    <p>{item.fullDesc}</p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="text-center text-gray-700 mt-8 text-lg font-semibold">Learning and developing skills to contribute and make a meaningful impact!</p>
      </div>
    </section>
  );
}

/**
 * Resume Component: Displays resume content and provides a download option.
 */
function Resume() {
  function downloadResume() {
    const element = document.getElementById('resume-content');
    if (!element) return;
    const opt = {
      margin: 0.3,
      filename: 'Madhav_Kataria_Resume.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, backgroundColor: "#fff" },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  }
  return (
    <section className="bg-white p-7 rounded-3xl shadow-2xl mb-10 relative resume-section"> {/* Added resume-section class */}
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight drop-shadow-sm">Resume</h2>
      {/* Download button moved to top right corner */}
      <div className="absolute top-4 right-4">
        <button onClick={downloadResume} className="text-blue-700 font-semibold text-sm hover:underline flex items-center"> Download <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /> </svg> </button>
      </div>
      <div id="resume-content" className="card-float-in mb-6 bg-gradient-to-br from-slate-100 via-gray-50 to-white rounded-xl p-6 shadow-md">
        <div className="text-lg font-semibold text-gray-800 mb-2">Professional Summary</div>
        <p className="text-gray-700 mb-2">Currently pursuing a Bachelor’s in <strong>Data Science and Artificial Intelligence from IIT Guwahati</strong>, offering a solid academic grounding in analytics and machine learning alongside practical industry exposure. Having nearly <strong>3 years</strong> of experience at <strong>HCL Technologies</strong>, 2+ years as a consultant for <strong>Ericsson Global</strong>, delivering end-to-end solutions in RPA using <strong>Microsoft Power Automate</strong>, custom business applications via <strong>Power Apps</strong>, and enterprise-grade Dashboards and Reports with <strong>Power BI</strong>.</p>
        <p className="text-gray-700 mb-2">Demonstrated ability to analyze complex organizational data within the IT Infrastructure domain, with a consistent focus on identifying patterns, improving processes, and monitoring SLA and KPI performance.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="font-bold text-lg text-blue-900 mb-2">Core Expertise</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li>Experience in Developing RPA (Robotic Process Automation) using Microsoft Power Automate Platform</li>
              <li>Experience in Developing Custom Applications via Power Apps Platform to make the process efficient and reduce human errors</li>
              <li>Experience in Developing industry level Power BI Dashboards & Reports for Data Analysis & Visualization</li>
              <li>Proficiency in Python, SQL, C Programming, and Oracle Database Management</li>
              <li>Deep understanding of IT Infrastructure concepts including Data Centers, Servers, Networking, and Cloud Services (AWS)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg text-blue-900 mb-2">Tools & Technologies</h3>
            <ul className="list-disc ml-6 text-gray-700">
              <li><strong>RPA/Low-Code:</strong> Microsoft Power Automate, Power Apps, Power BI</li>
              <li><strong>Cloud Platforms:</strong> Amazon Web Services (AWS)</li>
              <li><strong>Operating Systems:</strong> Windows Server, Linux (CLI)</li>
              <li><strong>Databases:</strong> SQL, Oracle</li>
              <li><strong>Networking:</strong> Cisco VLANs, DHCP, SSH</li>
              <li><strong>Programming Languages:</strong> Python, C, SQL</li>
              <li><strong>Others:</strong> Active Directory, RAID, ServiceNow, SharePoint</li>
            </ul>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg text-blue-900 mb-2">Professional Experience</h3>
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800">Technical Support Engineer & Automation Specialist</h4>
            <p className="text-gray-600 text-sm">HCL Technologies | Sept 2023 – Present</p>
            <ul className="list-disc ml-6 text-gray-700 mt-1">
              <li>Developed and deployed key automation solutions using <strong>Microsoft Power Platform (Power Apps, Power Automate, Power BI)</strong>, optimizing IT infrastructure processes for Ericsson Global.</li>
              <li>Created an advanced <strong>Attendance Tracker application</strong> on Power Apps with real-time Power BI analytics, streamlining project resource management and automating data archiving.</li>
              <li>Designed and implemented a <strong>KBA Review application</strong> to enhance knowledge article quality, featuring structured reviews, AI integration for optimization, and automated dynamic email notifications.</li>
              <li>Contributed to data-driven decision-making by delivering comprehensive <strong>Power BI reports</strong> for Mondelez EUC and EUC Tech departments, providing valuable insights.</li>
              <li>Implemented automated scripts for browser cache and cookies management, improving system performance and user experience across client environments.</li>
            </ul>
          </div>
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800">Technical Support Engineer (Internship)</h4>
            <p className="text-gray-600 text-sm">HCL Technologies (Consultant for Ericsson Global Organization) | Mar 2023 – Sept 2023</p>
            <ul className="list-disc ml-6 text-gray-700 mt-1">
              <li>Provided first and second-line technical support for complex IT issues, achieving a high resolve count and consistently positive user satisfaction.</li>
              <li>Received official recognition from Ericsson's Global Quality and Process Head for exceptional contributions to support and efficiency.</li>
              <li>Authored and updated detailed technical knowledge base articles, enhancing self-service capabilities and team efficiency.</li>
              <li>Participated in the Skill India platform under managerial guidance, demonstrating technical abilities in competitive scenarios.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">HCL TechBee Scholar (IT Infrastructure Management)</h4>
            <p className="text-gray-600 text-sm">HCL Technologies | Sept 2022 – Mar 2023</p>
            <ul className="list-disc ml-6 text-gray-700 mt-1">
              <li>Completed intensive 6-month training in Data Centre Operations, Linux CLI, networking fundamentals (Cisco VLANs, DHCP), and Windows Server administration (Active Directory, RAID).</li>
              <li>Gained foundational knowledge and practical skills in AWS cloud services (EC2, S3, VPC, Elastic Beanstalk).</li>
              <li>Received introductory training in Python, C, SQL, and Oracle, building a versatile programming base.</li>
            </ul>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg text-blue-900 mb-2">Education</h3>
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800">Bachelor of Science in Data Science and Artificial Intelligence</h4>
            <p className="text-gray-600 text-sm">Indian Institute of Technology Guwahati | Expected Graduation: 2027</p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="font-bold text-lg text-blue-900 mb-2">Awards & Recognition</h3>
          <ul className="list-disc ml-6 text-gray-700">
            <li>Multiple HCL Certificates for Automation, Power Apps, Power BI, and User Satisfaction.</li>
            <li>Client appreciation and recognition from Ericsson's Global Quality and Process Head.</li>
            <li>Highest resolve count among peers in technical support.</li>
            <li>Represented at State Level for Cloud Computing at Skill India, Bangalore.</li>
            <li>Recognized Performing Artist on All India Radio (Nationally Broadcasted).</li>
          </ul>
        </div>
      </div>
      <div className="flex justify-center mt-8">
        <button onClick={downloadResume}
          className="bg-gradient-to-r from-blue-900 to-sky-950 hover:from-sky-800 hover:to-blue-900 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 pulse"
        >
          Download Full Resume
        </button>
      </div>
    </section>
  );
}

/**
 * Contact Component: Provides contact information and a contact form.
 */
function Contact() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = React.useState(''); // 'sending', 'sent', 'error'

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      // Replace with your actual API endpoint for sending emails
      const response = await fetch('YOUR_EMAIL_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('sent');
        setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus('error');
    }
  };

  return (
    <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-7 rounded-3xl shadow-2xl mb-10">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2 tracking-tight drop-shadow-sm">Get in Touch!</h2>
      <p className="text-center text-gray-700 mb-6">Have a project in mind, a question, or just want to say hello? Fill out the form below or connect with me through my social channels!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact Form */}
        <div className="bg-white p-6 rounded-xl shadow-lg transition-transform duration-300 hover:shadow-xl hover:scale-[1.005]">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Send a Message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="subject" className="block text-gray-700 text-sm font-semibold mb-2">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-gray-700 text-sm font-semibold mb-2">Message</label>
              <textarea
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
            {status === 'sent' && <p className="text-green-600 mt-2">Message sent successfully!</p>}
            {status === 'error' && <p className="text-red-600 mt-2">Failed to send message. Please try again later.</p>}
          </form>
        </div>

        {/* Contact Info and Socials */}
        <div className="bg-white p-6 rounded-xl shadow-lg transition-transform duration-300 hover:shadow-xl hover:scale-[1.005]">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">My Details & Socials</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800">Email:</h4>
              <p className="text-blue-600 break-words">madhavkataria.work@gmail.com</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">Phone:</h4>
              <p className="text-gray-700">+91 9779958055</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Connect with me:</h4>
              <div className="flex space-x-4">
                <a href="https://linkedin.com/in/madhav-kataria" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 transition-colors text-3xl">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://github.com/madhav-kataria" target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-600 transition-colors text-3xl">
                  <i className="fab fa-github"></i>
                </a>
                <a href="https://twitter.com/yourusername" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors text-3xl">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://wa.me/9779958055" target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-colors text-3xl">
                  <i className="fab fa-whatsapp"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Privacy Policy Component: Displays the privacy policy.
 */
function PrivacyPolicy({ setActiveTab }) {
  const lastActiveTab = React.useRef('about'); // Default to 'about'

  // Effect to capture the last active tab before navigating to privacy
  React.useEffect(() => {
    // This effect runs on mount and every update.
    // We only want to capture the previous tab *before* privacy policy is active.
    // The activeTab prop changes *after* the navigation happens.
    // A better approach would be to pass the previous tab as a prop or use a more robust routing solution.
    // For this simple case, we'll assume the back button is the only way to leave privacy,
    // and it should go to 'about' unless explicitly set otherwise.
    // We don't have a direct way to know the "previous" tab within this component's render cycle
    // without more sophisticated state management in the parent App.
    // So, we'll just set it to 'about' when navigating back.
  }, []);

  const handleBackToPrevious = () => {
    setActiveTab(lastActiveTab.current, 'click');
  };

  return (
    <section className="bg-white p-7 rounded-3xl shadow-2xl mb-10">
      <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-6 tracking-tight drop-shadow-sm">Privacy Policy</h2>

      <div className="prose max-w-none text-gray-700 space-y-4">
        <p>This Privacy Policy describes how Madhav Kataria ("I", "me", "my") collects, uses, and discloses your information when you visit and interact with my personal website (the "Service").</p>

        <h3>1. Information Collection and Use</h3>
        <p>I do not directly collect any personally identifiable information from visitors to this website. This website is primarily a static portfolio and information hub. I do not use cookies for tracking or analytics.</p>

        <h3>2. Contact Form</h3>
        <p>If you choose to use the contact form on this website, the information you provide (your name, email address, subject, and message) will be sent directly to my email address (madhavkataria.work@gmail.com). This information is used solely to respond to your inquiry and will not be stored on the website's server or used for marketing purposes. I will not share this information with any third parties.</p>

        <h3>3. Third-Party Services</h3>
        <p>This website may include links to third-party websites or services (e.g., LinkedIn, GitHub, Twitter, WhatsApp). These third-party services have their own privacy policies, and I am not responsible for their practices. I encourage you to review the privacy policies of any third-party sites you visit.</p>
        <p>Specifically, this site uses:</p>
        <ul>
          <li><strong>Cloudflare Insights:</strong> This service may collect anonymous usage data (e.g., page views, unique visitors) for performance and security monitoring. This data is aggregated and does not identify individual users. You can learn more about Cloudflare's privacy practices <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">here</a>.</li>
          <li><strong>Font Awesome:</strong> Used for icons. It may make requests to their servers to load icon fonts, which may involve some data collection as per their privacy policy.</li>
          <li><strong>Google Fonts:</strong> Used for custom fonts. Requests for fonts may involve Google collecting data as per their privacy policy.</li>
          <li><strong>cdnjs.cloudflare.com:</strong> For html2pdf.js library. Content delivery networks may log requests as per their privacy policies.</li>
        </ul>

        <h3>4. Data Security</h3>
        <p>I take reasonable measures to protect the information transmitted through the contact form. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure. While I strive to use commercially acceptable means to protect your information, I cannot guarantee its absolute security.</p>

        <h3>5. Changes to This Privacy Policy</h3>
        <p>I may update my Privacy Policy from time to time. I will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

        <h3>6. Your Consent</h3>
        <p>By using my Service, you hereby consent to my Privacy Policy and agree to its terms.</p>

        <h3>7. Contact Me</h3>
        <p>If you have any questions about this Privacy Policy, please contact me:</p>
        <ul>
          <li>By email: <a href="mailto:madhavkataria.work@gmail.com" className="text-blue-700 hover:underline">madhavkataria.work@gmail.com</a></li>
        </ul>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={handleBackToPrevious}
          className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-full shadow-md transition-all duration-300 hover:bg-gray-300 hover:shadow-lg"
        >
          Back to previous section
        </button>
      </div>
    </section>
  );
}

/**
 * BackToTopButton Component: Displays a scroll-to-top button.
 * @param {object} props - Component props.
 * @param {boolean} props.isVisible - Controls overall visibility (display: block/none).
 * @param {boolean} props.isFaded - Controls opacity for fading.
 * @param {function} props.onClick - Handler for button click.
 */
function BackToTopButton({ isVisible, isFaded, onClick }) {
  const buttonClasses = `back-to-top ${isVisible ? 'show' : ''} ${isFaded ? 'fade-out' : ''}`;
  return (
    <button
      className={buttonClasses}
      onClick={onClick}
      aria-label="Scroll to top"
      style={{ display: isVisible ? 'block' : 'none' }} // Control display based on isVisible
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    </button>
  );
}

// Function to smoothly scroll to the top of the page
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

/**
 * Main App Component: Manages global state and renders different sections based on active tab.
 */
function App() {
  const [activeTab, setActiveTabState] = React.useState('about');
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [showBackToTop, setShowBackToTop] = React.useState(false);
  const [lastInteraction, setLastInteraction] = React.useState(Date.now());
  const [transitionDirection, setTransitionDirection] = React.useState('slide-in-left');
  const [isFadedOut, setIsFadedOut] = React.useState(false); // New state to control fade-out
  const fadeTimeoutRef = React.useRef(null); // Use a ref to store the timeout ID

  const setActiveTab = (tabId, trigger = 'click') => {
    setTransitionDirection(activeTab === 'privacy' && tabId !== 'privacy' ? 'slide-in-right' : 'slide-in-left');
    setActiveTabState(tabId);
    if (trigger === 'click') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Effect to handle window resize for mobile detection
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to handle scroll for BackToTop button visibility and interaction
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
        setLastInteraction(Date.now()); // Update interaction on scroll
        setIsFadedOut(false); // Ensure it's not faded when scrolling
      } else {
        setShowBackToTop(false);
        setIsFadedOut(false); // Reset fade when button is hidden
      }
    };

    const handleInteraction = () => {
      setLastInteraction(Date.now());
      setIsFadedOut(false); // Ensure it's not faded on any interaction
    };

    // Attach event listeners for user interaction
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction); // Handle touch start as interaction
    window.addEventListener('touchend', handleInteraction); // Handle touch end as interaction


    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('touchend', handleInteraction);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Effect to manage the fade-out timer
  React.useEffect(() => {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
    }

    if (showBackToTop && isMobile) { // Only set timeout if button is visible and on mobile
      fadeTimeoutRef.current = setTimeout(() => {
        setIsFadedOut(true);
      }, 2000); // 2 seconds
    }

    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [lastInteraction, showBackToTop, isMobile]); // Re-run when these dependencies change

  const components = {
    about: <About showSection={setActiveTab} />,
    journey: <Journey />,
    resume: <Resume />,
    contact: <Contact />,
    privacy: <PrivacyPolicy setActiveTab={setActiveTab} />
  };

  return (
    <>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main
        className="container mx-auto max-w-3xl px-4 py-8 overflow-hidden" /* Re-added overflow-hidden to main */
      >
        {/* Conditional rendering with animation class and key for re-render */}
        <div key={activeTab} className={transitionDirection}>
          {components[activeTab]}
        </div>
      </main>
      <footer className="w-full text-center py-4 text-gray-600 text-sm bg-white/75 backdrop-blur shadow-inner mt-auto">
        © 2025 - Crafted with ❤️ and lots of ☕
        <span className="mx-2">|</span>
        <button onClick={() => setActiveTab('privacy', 'click')} className="text-blue-700 font-semibold hover:underline">Privacy Policy</button>
      </footer>
      {/* Pass isFaded prop here */}
      <BackToTopButton isVisible={showBackToTop} isFaded={isFadedOut} onClick={scrollToTop} />
    </>
  );
}

// Render the main App component into the 'root' div
ReactDOM.render(<App />, document.getElementById('root'));
// Fetch IP logger (moved from original HTML)
fetch("https://ip-logger.madhavkataria000.workers.dev/").catch(console.error);
