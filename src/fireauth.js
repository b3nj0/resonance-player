import fire from './fire';
import firebaseui from 'firebaseui';
import '../node_modules/firebaseui/dist/firebaseui.css';

const fireauth = new firebaseui.auth.AuthUI(fire.auth());

export default fireauth;
