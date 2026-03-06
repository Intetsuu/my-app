import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Silverstone from "./img/Silverstone1.png"; // твоя трасса

interface ICar {
  driver_number: number;
  x: number;
  y: number;
}

const driverNumbers = [44, 16, 1, 81]; // номера пилотов
const API_UPDATE_INTERVAL = 5000; // запрос к API раз в 5 секунд
const ANIMATION_FRAMES = 60; // плавная анимация ~1 секунда

const TrackMap = () => {
  const [cars, setCars] = useState<ICar[]>([]);
  const carsRef = useRef<ICar[]>([]);

  // функция для анимации машин
  const animateCars = (oldCars: ICar[], newCars: ICar[]) => {
    let frame = 0;

    const animation = () => {
      frame++;
      const interpolated = newCars.map((car) => {
        const old = oldCars.find((c) => c.driver_number === car.driver_number);
        if (!old) return car;
        return {
          driver_number: car.driver_number,
          x: old.x + ((car.x - old.x) * frame) / ANIMATION_FRAMES,
          y: old.y + ((car.y - old.y) * frame) / ANIMATION_FRAMES,
        };
      });

      setCars(interpolated);

      if (frame < ANIMATION_FRAMES) {
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  };

  // функция получения данных с API
  const fetchLocations = async () => {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 500); // последние 0.5 сек
      const to = now;

      const promises = driverNumbers.map((num) =>
        axios.get<ICar[]>("https://api.openf1.org/v1/location", {
          params: {
            session_key: "9161",
            driver_number: num,
            "date>": from.toISOString(),
            "date<": to.toISOString(),
          },
        }),
      );

      const results = await Promise.all(promises);
      const latest: Record<number, ICar> = {};

      results.forEach((res) => {
        if (res.data.length > 0) {
          const item = res.data[res.data.length - 1]; // последняя точка
          latest[item.driver_number] = {
            driver_number: item.driver_number,
            x: item.x / 10 + 450, // масштабируем для SVG
            y: item.y / 10 + 300,
          };
        }
      });

      const newCars = Object.values(latest);
      animateCars(carsRef.current, newCars);
      carsRef.current = newCars;
    } catch {
      // fallback mock, если API недоступно
      const mockCars: ICar[] = [
        { driver_number: 44, x: 500, y: 200 },
        { driver_number: 16, x: 520, y: 210 },
        { driver_number: 1, x: 480, y: 220 },
        { driver_number: 81, x: 510, y: 230 },
      ];
      animateCars(carsRef.current, mockCars);
      carsRef.current = mockCars;
    }
  };

  useEffect(() => {
    // первый запрос
    fetchLocations();

    // обновление каждые 5 секунд
    const interval = setInterval(fetchLocations, API_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <svg width="900" height="600">
      {/* Трасса */}
      <image href={Silverstone} x="0" y="0" width="900" height="600" />

      {/* Машины */}
      {cars.map((car, idx) => (
        <g key={car.driver_number}>
          <circle
            cx={car.x}
            cy={car.y}
            r={7}
            fill={["red", "blue", "yellow", "green"][idx % 4]}
          />
          <text x={car.x + 10} y={car.y + 3} fontSize={10} fill="black">
            {car.driver_number}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default TrackMap;
