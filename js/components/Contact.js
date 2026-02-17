// ===========================
// Contact Component
// ===========================
function Contact({ isDark }) {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setSent(false);
    const form = e.target;
    const formData = new FormData(form);

    try {
      const response = await fetch("https://formspree.io/f/myzjynok", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData
      });
      const data = await response.json();
      if (data.ok) {
        setSent(true);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 1800);
        form.reset();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  }

  return (
    <section className={`${isDark ? 'bg-[linear-gradient(145deg,rgba(30,41,59,0.72),rgba(15,23,42,0.55),rgba(2,6,23,0.42))] shadow-[0_22px_60px_rgba(2,6,23,0.55)]' : 'bg-gradient-to-br from-indigo-50/80 via-blue-50/80 to-white'} p-8 rounded-3xl shadow-2xl mb-10 max-w-lg mx-auto`}>
      <h2 className={`text-3xl font-extrabold text-center mb-6 tracking-tight drop-shadow-sm ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Contact Me</h2>
      <p className={`text-center mb-6 flex items-center justify-center ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
        This isn't just a form — it's the start of a good conversation. &nbsp; <span className="text-4xl animate-bounce">😉</span>
      </p>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Your Name</label>
          <input 
            name="name" 
            required 
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition ${isDark ? 'bg-white/10 border-white/10 text-slate-100 placeholder:text-slate-300/70' : 'bg-white/90 border-gray-400 text-gray-900'}`} 
            type="text" 
          />
        </div>
        <div>
          <label className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Your Email</label>
          <input 
            name="email" 
            required 
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition ${isDark ? 'bg-white/10 border-white/10 text-slate-100 placeholder:text-slate-300/70' : 'bg-white/90 border-gray-400 text-gray-900'}`} 
            type="email" 
          />
        </div>
        <div>
          <label className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Message</label>
          <textarea 
            name="message" 
            required 
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition ${isDark ? 'bg-white/10 border-white/10 text-slate-100 placeholder:text-slate-300/70' : 'bg-white/90 border-gray-400 text-gray-900'}`} 
            rows="4" 
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full contact-send-btn text-white py-3 rounded-full font-semibold shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Message"}
        </button>
        {sent && <p className="text-emerald-700 text-center mt-2 contact-success-text">Thank you! Your message has been sent.</p>}
        {error && <p className="text-red-600 text-center mt-2">Sorry, something went wrong. Please try emailing me directly.</p>}
      </form>
      <div className={`mt-6 text-center ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
        <div className="mb-2">Or email directly:</div>
        <a href="mailto:contact.madhavkataria@gmail.com" aria-label="Email Madhav Kataria" className={`font-semibold hover:underline ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>Send an Email</a>
        <div className="mt-2">
          <a href="https://www.linkedin.com/in/madhav-k-804904262/" target="_blank" rel="noopener noreferrer" aria-label="Connect with Madhav Kataria on LinkedIn" className={`font-semibold hover:underline ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>Connect on LinkedIn</a>
        </div>
      </div>
      {showSuccessOverlay && (
        <div className="contact-success-overlay">
          <div className="contact-success-box">
            <span className="contact-confetti c1"></span>
            <span className="contact-confetti c2"></span>
            <span className="contact-confetti c3"></span>
            <span className="contact-confetti c4"></span>
            <span className="contact-confetti c5"></span>
            <span className="contact-confetti c6"></span>
            <div className="contact-success-emoji">{"\u2705"}</div>
            <div className="contact-success-title">Message Sent</div>
            <div className="contact-success-subtitle">Thanks for reaching out. I will get back to you soon.</div>
          </div>
        </div>
      )}
    </section>
  );
}
