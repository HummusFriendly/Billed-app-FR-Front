import { ROUTES_PATH } from '../constants/routes.js';
export let PREVIOUS_LOCATION = '';

export default class Login {
  constructor({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store }) {
    this.document = document;
    this.localStorage = localStorage;
    this.onNavigate = onNavigate;
    this.PREVIOUS_LOCATION = PREVIOUS_LOCATION;
    this.store = store;
    const formEmployee = this.document.querySelector(`form[data-testid="form-employee"]`);
    formEmployee.addEventListener('submit', this.handleSubmitEmployee);
    const formAdmin = this.document.querySelector(`form[data-testid="form-admin"]`);
    formAdmin.addEventListener('submit', this.handleSubmitAdmin);
  }

  handleSubmitEmployee = (e) => {
    e.preventDefault();
    const email = e.target.querySelector(`input[data-testid="employee-email-input"]`).value;
    const password = e.target.querySelector(`input[data-testid="employee-password-input"]`).value;

    if (!email || !password) {
      const errorElement = this.document.querySelector(`#error-message-employee`);
      if (errorElement) errorElement.textContent = 'Veuillez remplir tous les champs.';
      return;
    }

    const user = {
      type: 'Employee',
      email,
      password,
      status: 'connected',
    };

    this.login(user)
      .then(({ jwt }) => {
        this.localStorage.setItem('user', JSON.stringify(user));
        this.localStorage.setItem('jwt', jwt);
        this.onNavigate(ROUTES_PATH['Bills']);
        this.PREVIOUS_LOCATION = ROUTES_PATH['Bills'];
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION;
        this.document.body.style.backgroundColor = '#fff';
      })
      .catch((err) => {
        console.error(err);
        const errorElement = this.document.querySelector(`#error-message-employee`);
        if (errorElement) errorElement.textContent = err.message || 'Erreur de connexion';
      });
  };

  handleSubmitAdmin = (e) => {
    e.preventDefault();
    const email = e.target.querySelector(`input[data-testid="admin-email-input"]`).value;
    const password = e.target.querySelector(`input[data-testid="admin-password-input"]`).value;

    if (!email || !password) {
      const errorElement = this.document.querySelector(`#error-message-admin`);
      if (errorElement) errorElement.textContent = 'Veuillez remplir tous les champs.';
      return;
    }

    const user = {
      type: 'Admin',
      email,
      password,
      status: 'connected',
    };

    this.login(user)
      .then(({ jwt }) => {
        this.localStorage.setItem('user', JSON.stringify(user));
        this.localStorage.setItem('jwt', jwt);
        this.onNavigate(ROUTES_PATH['Dashboard']);
        this.PREVIOUS_LOCATION = ROUTES_PATH['Dashboard'];
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION;
        this.document.body.style.backgroundColor = '#fff';
      })
      .catch((err) => {
        console.error(err);
        const errorElement = this.document.querySelector(`#error-message-admin`);
        if (errorElement) errorElement.textContent = err.message || 'Erreur de connexion';
      });
  };

  login = (user) => {
    if (this.store) {
      return this.store
        .login(
          JSON.stringify({
            email: user.email,
            password: user.password,
          })
        )
        .then(({ jwt }) => ({ jwt }));
    }
    return Promise.reject(new Error('Store non disponible'));
  };

  createUser = (user) => {
    if (this.store) {
      return this.store
        .users()
        .create({
          data: JSON.stringify({
            type: user.type,
            name: user.email.split('@')[0],
            email: user.email,
            password: user.password,
          }),
        })
        .then(() => {
          console.log(`User with ${user.email} is created`);
          return this.login(user);
        });
    }
    return Promise.reject(new Error('Store non disponible'));
  };
}