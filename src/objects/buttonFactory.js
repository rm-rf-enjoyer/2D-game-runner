import { Button } from './button.js';

export function createMenuButton(scene, x, y, text, onClick) {
  const width = 400;
  const height = 100;

  const button = new Button(scene, x, y, width, height, onClick);
  button.setDepth(10);

  const label = scene.add.text(x, y, text, {
    fontFamily: 'Arial',
    fontSize: '36px',
    color: '#ffffff',
  }).setOrigin(0.5).setDepth(11);

  return { button, label };
}
