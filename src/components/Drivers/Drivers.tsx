import React, { useEffect, useState } from "react";
import styles from "./Drivers.module.scss";
import { fetchDrivers } from "../../api/driversApi";
import { IDriver } from "../../@types/drivers.types";
import { useNavigate } from "react-router";

const Drivers = () => {
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const getDrivers = async () => {
      try {
        const data = await fetchDrivers();
        setDrivers(data);
      } catch (err) {
        setError("Failed to load drivers");
      } finally {
        setLoading(false);
      }
    };

    getDrivers();
  }, []);

  if (loading) return <div className={styles.loading}>Loading drivers...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>F1 Drivers</h1>

      <div className={styles.wrapper}>
        {drivers.map((driver) => (
          <div
            key={driver.driver_number}
            className={styles.card}
            onClick={() => navigate(`/drivers/${driver.driver_number}`)}
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
