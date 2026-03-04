import React, { useEffect, useState } from "react";

import styles from "./Drivers.module.scss";
import axios from "axios";
import { IDriver } from "../../@types/drivers.types";

const Drivers = () => {
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const response = await axios.get<IDriver[]>(
          "https://api.openf1.org/v1/drivers",
          {
            params: {
              session_key: "latest",
            },
          },
        );

        console.log("OpenF1 Latest Drivers:", response.data);

        setDrivers(response.data);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);
  if (loading) return <div className={styles.loading}>Loading drivers...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>F1 Drivers</h1>

      <div className={styles.wrapper}>
        {drivers.map((driver) => (
          <div
            key={driver.driver_number}
            className={styles.card}
            style={{
              borderColor: driver.team_colour
                ? `#${driver.team_colour}`
                : "#e10600",
            }}
          >
            {driver.headshot_url && (
              <img
                src={driver.headshot_url}
                alt={driver.full_name}
                className={styles.image}
              />
            )}

            <div className={styles.info}>
              <span
                className={styles.number}
                style={{
                  color: driver.team_colour
                    ? `#${driver.team_colour}`
                    : "#e10600",
                }}
              >
                #{driver.driver_number}
              </span>

              <h3>{driver.full_name}</h3>
              <p>{driver.team_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Drivers;
