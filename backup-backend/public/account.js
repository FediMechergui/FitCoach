const params = new URLSearchParams(location.hash.slice(1));
const confirmation = params.get('confirmation_token');
const recovery = params.get('recovery_token');
history.replaceState(null, '', location.pathname);
const status = document.getElementById('status');
async function verify(type, token, password) {
  const response = await fetch('/.netlify/identity/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, token, password }) });
  if (!response.ok) throw new Error('The link has expired or could not be verified. Request a new link from FitCoach.');
  // Do not store access tokens in the browser; sign in on the phone.
  status.textContent = type === 'signup' ? 'Email verified. You can now sign in in FitCoach.' : 'Password reset. Sign in in FitCoach with your new password.';
}
if (confirmation) verify('signup', confirmation).catch(e => { status.textContent = e.message; });
if (recovery) {
  const form = document.getElementById('recovery'); form.hidden = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    try { await verify('recovery', recovery, document.getElementById('password').value); form.hidden = true; }
    catch (e) { status.textContent = e.message; }
  });
}
