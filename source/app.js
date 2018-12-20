import 'bootstrap';
import './scss/main.scss';

const NameGame = require('./js/NameGame.js');

const nameGame = new NameGame();
nameGame.init();

console.log();