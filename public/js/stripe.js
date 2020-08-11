import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe('pk_test_FUmya0AtR4zMfEOMhXeXp65Q00SuN9UkO5');

export const bookTour = async tourId => {
    try {
        // 1) Get stripe checkout session from back-end
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        // console.log(session);
        // 2) Call checkout form + charge the credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (err) {
        console.log(err);
        showAlert('error', err);
    }
}