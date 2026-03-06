import React, { useEffect, useState } from "react";
import styles from "./LiveTiming.module.scss";
import TrackMap from "../TrackMap/TrackMap";
import { IDriverTiming } from "../@types/driverTiming.types";
import { fetchLiveTiming } from "../api/openF1Api";

const LiveTiming = () => {
  const [timing, setTiming] = useState<IDriverTiming[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTiming = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const data = await fetchLiveTiming();
      setTiming(data);
    } catch {
      // Если API не доступен, используем mock
      setTiming([
        { driver_number: 44, position: 1, gap_to_leader: null },
        { driver_number: 16, position: 2, gap_to_leader: 1.234 },
        { driver_number: 1, position: 3, gap_to_leader: 2.567 },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTiming();
    const interval = setInterval(loadTiming, 40000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      {/* Левая колонка с таймингом */}
      <div className={styles.timingTable}>
        <h2>Live Timing</h2>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Driver</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {timing.map((driver) => (
              <tr key={driver.driver_number}>
                <td>{driver.position}</td>
                <td>{driver.driver_number}</td>
                <td>
                  {driver.gap_to_leader === null
                    ? "Leader"
                    : `+${driver.gap_to_leader.toFixed(3)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Правая колонка с картой трассы */}
      <div className={styles.trackMap}>
        <TrackMap />
      </div>
    </div>
  );
};

export default LiveTiming;
