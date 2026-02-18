// ===========================
// Contact Component
// ===========================
function Contact({ isDark }) {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(false);
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
        if (typeof window.showAppNotice === "function") {
          window.showAppNotice({
            variant: "success",
            title: "Message Sent",
            message: "Thanks for reaching out. I will get back to you soon.",
            emoji: "\u2705",
            durationMs: 1800
          });
        } else if (typeof window.showLikeThankYouOverlay === "function") {
          window.showLikeThankYouOverlay({
            title: "Message Sent",
            message: "Thanks for reaching out. I will get back to you soon.",
            emoji: "\u2705",
            durationMs: 1800
          });
        }
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
    <section className={`${isDark ? 'bg-[linear-gradient(145deg,rgba(30,41,59,0.72),rgba(15,23,42,0.55),rgba(2,6,23,0.42))] shadow-[0_22px_60px_rgba(2,6,23,0.55)]' : 'contact-shell-light'} p-8 rounded-3xl shadow-2xl mb-10 max-w-lg mx-auto`}>
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
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition ${isDark ? 'bg-transparent border-white/20 text-slate-100 placeholder:text-slate-300/70' : 'bg-white/90 border-gray-400 text-gray-900'}`} 
            type="text" 
          />
        </div>
        <div>
          <label className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Your Email</label>
          <input 
            name="email" 
            required 
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition ${isDark ? 'bg-transparent border-white/20 text-slate-100 placeholder:text-slate-300/70' : 'bg-white/90 border-gray-400 text-gray-900'}`} 
            type="email" 
          />
        </div>
        <div>
          <label className={`block mb-1 font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Message</label>
          <textarea 
            name="message" 
            required 
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-900 focus:border-blue-700 transition ${isDark ? 'bg-transparent border-white/20 text-slate-100 placeholder:text-slate-300/70' : 'bg-white/90 border-gray-400 text-gray-900'}`} 
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
        {error && <p className="text-red-600 text-center mt-2">Sorry, something went wrong. Please try emailing me directly.</p>}
      </form>
      <div className={`mt-6 text-center ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
        <div className="mb-2">Or email directly:</div>
        <a href="mailto:contact.madhavkataria@gmail.com" aria-label="Email Madhav Kataria" className={`font-semibold hover:underline ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>Send an Email</a>
        <div className="mt-2">
          <a href="https://www.linkedin.com/in/madhav-k-804904262/" target="_blank" rel="noopener noreferrer" aria-label="Connect with Madhav Kataria on LinkedIn" className={`font-semibold hover:underline ${isDark ? 'text-sky-300' : 'text-blue-700'}`}>Connect on LinkedIn</a>
        </div>
      </div>
    </section>
  );
}
