import Cookies from 'js-cookie';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || Cookies.get('token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function setAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  Cookies.set('token', token, { expires: 7 });
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  Cookies.remove('token');
}

export function isAuthenticated() {
  return !!getToken();
}
