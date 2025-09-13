(() => {
  const KEY = 'tp_user';

  const get = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  };

  const save = (u) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    window.dispatchEvent(new Event('tpuser'));
  };

  const isLogged = () => !!get();

  const register = ({ name, email, phone, address, password }) => {
    if (!name || !email || !password) throw new Error('Completá nombre, email y contraseña.');
    const user = {
      id: (crypto?.randomUUID?.() || String(Date.now())),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      address: (address || '').trim(),
      password: password, // Asegúrate de no guardar contraseñas en texto plano en producción
      createdAt: new Date().toISOString(),
    };
    save(user);
    return user;
  };

  const login = (email, pass) => {
    const u = get();
    if (!u) throw new Error('No hay usuario registrado en este dispositivo.');
    if (u.email !== email.trim().toLowerCase() || u.password !== pass) {
      throw new Error('Email o contraseña inválidos.');
    }
    return u;
  };

  const update = (partial) => {
    const u = get() || {};
    const next = { ...u, ...partial };
    save(next);
    return next;
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event('tpuser'));
  };

  window.tpUser = { get, save, isLogged, register, login, update, logout };
})();
