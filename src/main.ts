import './ui/styles.css';
import { Game } from './core/Game';

const root = document.getElementById('app');

if (!root) {
  document.body.textContent = 'UMBRAL DE ACERO could not start: the page is missing its #app container.';
} else {
  const game = new Game(root);
  void game.start();
}
