import { BotShipData } from '../types/botTypes';

const getRandomPosition = () => {
  const x = Math.floor(Math.random() * 10);
  const y = Math.floor(Math.random() * 10);
  const direction = Math.random() < 0.5;

  return { position: { x, y }, direction };
};

const isShipValid = (ship: BotShipData, shipCoords: number[]): boolean => {
  for (let l = 0; l < ship.length; l++) {
    let { x, y } = ship.position;

    if (ship.direction) {
      y += l;
    } else {
      x += l;
    }

    if (x > 9 || y > 9) return false;

    if (shipCoords.includes(y * 10 + x)) return false;

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (x + i < 0 || x + i > 9 || y + j < 0 || y + j > 9) continue;

        if (shipCoords.includes((y + j) * 10 + (x + i))) return false;
      }
    }
  }

  return true;
};

export const getShips = (): Promise<BotShipData[] | null> => {
  const shipLength: {
    length: number;
    type: 'huge' | 'large' | 'medium' | 'small';
  }[] = [
    { length: 4, type: 'huge' },
    { length: 3, type: 'large' },
    { length: 3, type: 'large' },
    { length: 2, type: 'medium' },
    { length: 2, type: 'medium' },
    { length: 2, type: 'medium' },
    { length: 1, type: 'small' },
    { length: 1, type: 'small' },
    { length: 1, type: 'small' },
    { length: 1, type: 'small' },
  ];

  const timeEndLimit = Date.now() + 45000; //ms

  return new Promise<BotShipData[] | null>((resolve) => {
    const ships: BotShipData[] = [];
    const shipCoords: number[] = [];

    for (const length of shipLength) {
      if (Date.now() > timeEndLimit) resolve(null);

      let ship: BotShipData | null = null;

      while (!ship) {
        const { position, direction } = getRandomPosition();
        const tempShip = {
          position,
          direction,
          length: length.length,
          type: length.type,
        };

        if (isShipValid(tempShip, shipCoords)) {
          ship = tempShip;
        }
      }

      ships.push(ship);

      for (let l = 0; l < ship.length; l++) {
        let { x, y } = ship.position;

        if (ship.direction) {
          y += l;
        } else {
          x += l;
        }

        shipCoords.push(y * 10 + x);
      }
    }

    resolve(ships);
  });
};
