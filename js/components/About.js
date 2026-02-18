// ===========================
// About Component
// ===========================
function About({ showSection, isDark }) {
  return (
    <section className={`${isDark ? 'about-bg' : 'about-light'} p-8 rounded-3xl shadow-2xl mb-10 relative overflow-hidden`} style={{ minHeight: '60vh' }}>
      <div className="relative z-10 flex about-flex-mobile md:flex-row flex-col items-center md:items-start space-y-6 md:space-y-0 md:space-x-10">
        <div className="flex-shrink-0 flex flex-col items-center md:items-start about-photo-mobile">
          <div className="about-photo-bg mb-3 mt-2 shadow-lg hover:scale-105 transition-transform duration-500">
            <img src="assets/images/Madhav-kataria.webp" alt="Madhav Kataria" className="rounded-2xl w-36 h-44 sm:w-40 sm:h-48 md:w-44 md:h-52 object-cover shadow-xl border-4 border-white" />
          </div>
        </div>

        <div className="flex-grow about-text-mobile">
          <h2 className={`text-4xl font-extrabold mb-3 tracking-tight drop-shadow-sm ${isDark ? 'about-main-title' : 'text-slate-900'}`}>
            Hello, I'm <span>Madhav Kataria!</span>
          </h2>
          <p className={`text-lg leading-relaxed mb-2 card-float-in ${isDark ? 'text-gray-100' : 'text-slate-700'}`}>
            Currently pursuing Bachelor's in Data Science and AI from IIT Guwahati.🎓
          </p>
          <p className={`text-lg leading-relaxed mb-3 card-float-in ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
            I am a passionate and results-driven professional with expertise in <strong className="about-strong">Robotic Process Automation (RPA), Power Platform development (Power Apps, Power BI), and IT Infrastructure management</strong>. My journey is driven by a desire to <strong className="about-strong">build innovative solutions that enhance efficiency and reduce human errors</strong>, and continuously learn and grow. I thrive on challenges and am always seeking new opportunities to make a meaningful impact.
          </p>
          <p className={`text-md mb-3 card-float-in ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
            My unique value proposition lies in my ability to <strong className="about-strong">leverage AI, Data insights and automation to optimize organizational processes, specifically in the IT Infra Domain</strong>. I am motivated by <strong className="about-strong">solving complex problems, fostering collaborative environments, and pushing creative boundaries to deliver tangible improvements.</strong>
          </p>
          <div className="space-y-2 mb-6 card-float-in">
            <h3 className={`text-xl font-semibold ${isDark ? 'about-value' : 'text-slate-800'}`}>My Values:</h3>
            <ul className={`list-disc list-inside ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>
              <li>Innovation &amp; Continuous Learning</li>
              <li>Collaboration &amp; Teamwork</li>
              <li>Integrity &amp; Transparency</li>
              <li>User-Centric Approach</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <button
          onClick={() => showSection('contact', 'click')}
          className={`${isDark
            ? 'bg-gradient-to-r from-sky-900 to-blue-950 hover:from-blue-800 hover:to-blue-900'
            : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-[0_10px_22px_rgba(37,99,235,0.28)]'} text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105`}
        >
          Get in Touch!
        </button>
        
        <button
          onClick={() => showSection('journey', 'click')}
          className={`${isDark
            ? 'bg-gradient-to-r from-sky-900 to-blue-950 hover:from-blue-800 hover:to-blue-900'
            : 'bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 shadow-[0_10px_22px_rgba(37,99,235,0.28)]'} text-white font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105`}
        >
          🚀 Explore My Journey
        </button>
      </div>
      <p className={`text-center mt-4 text-sm italic ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
        "Driven by curiosity. Inspired by innovation. Always learning." ✨
      </p>
    </section>
  );
}
