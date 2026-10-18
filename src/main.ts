import './styles/main.css';
import { PlasmaSimulatorApp } from './ui/schedulerView';

document.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('app');
  if (!appRoot) {
    throw new Error('Missing #app root container');
  }
  new PlasmaSimulatorApp(appRoot);
});
