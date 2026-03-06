import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { IDriver } from "../@types/drivers.types";
import { fetchDriverByNumber } from "../api/driversApi";

import styles from "./DriversDetail.module.scss";

const DriverDetail = () => {
  const { number } = useParams();

  const [driver, setDriver] = useState<IDriver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDriver = async () => {
      try {
        if (!number) return;

        const data = await fetchDriverByNumber(number);
        setDriver(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    getDriver();
  }, [number]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!driver) return <div>Driver not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        {driver.headshot_url && (
          <img src={driver.headshot_url} alt={driver.full_name} />
        )}

        <div className={styles.info}>
          <h1>{driver.full_name}</h1>
          <h2>#{driver.driver_number}</h2>
          <p>{driver.team_name}</p>
          <p>Country: {driver.country_code}</p>
        </div>
      </div>

      <div className={styles.bio}>
        <h3>Biography</h3>
        <p>dfgdsgf</p>
      </div>
    </div>
  );
};

export default DriverDetail;
