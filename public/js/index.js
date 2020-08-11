import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

/* DOM ELEMENTS */
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');


/* DELEGATION */
// Mapbox display
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
};

// Login form
if (loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
};

// Logout
if (logOutBtn) logOutBtn.addEventListener('click', logout);

// Update user account's data
if (userDataForm) userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('userPhoto').files[0]);
    // console.log(form);
    updateSettings(form, 'data');
});

// Update user password's data
if (userPasswordForm) userPasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    // Change the button's text to let the user know that updating is in progress
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password').value;
    const newPasswordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({ passwordCurrent, newPassword, newPasswordConfirm }, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save Password';
    // Clear the field's value
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
});

// Stipe checkout & credit card payment
if (bookBtn) bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...'
    const { tourId } = e.target.dataset;
    bookTour(tourId);
});