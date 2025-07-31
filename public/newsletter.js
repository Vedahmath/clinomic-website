console.log('newsletter.js loaded!');

function initNewsletterFormHandler() {
  console.log('initNewsletterFormHandler called!');
  const form = document.getElementById('newsletter-form');
  if (form) {
    console.log('Newsletter form found.');
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      const messageDiv = document.getElementById('newsletter-message');
      const email = emailInput.value;
      try {
        const res = await fetch('http://localhost:5500/api/subscribe', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          messageDiv.textContent = data.message;
          messageDiv.style.color = 'green';
          emailInput.value = '';
        } else {
          messageDiv.textContent = data.message;
          messageDiv.style.color = 'red';
        }
      } catch (err) {
        messageDiv.textContent = 'Something went wrong. Please try again!';
        messageDiv.style.color = 'red';
      }
    });
  } else {
    console.log('Newsletter form NOT found.');
  }
}
