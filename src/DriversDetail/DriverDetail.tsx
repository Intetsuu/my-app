import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

import { IDriver } from "../@types/drivers.types";
import { IPixabayImage } from "../@types/PixabayImage.types";

import { fetchDriverByNumber } from "../api/driversApi";
import { fetchImages } from "../api/pixabayApi";

import styles from "./DriversDetail.module.scss";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const DriverDetail = () => {
  const { number } = useParams();

  const [driver, setDriver] = useState<IDriver | null>(null);
  const [loading, setLoading] = useState(true);

  const [images, setImages] = useState<IPixabayImage[]>([]);
  const [helmets, setHelmets] = useState<IPixabayImage[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!number) return;

        const driverData = await fetchDriverByNumber(number);
        setDriver(driverData);

        const driverPhotos: any = await fetchImages(
          `${driverData.full_name} formula 1`,
          10,
        );

        const helmetPhotos: any = await fetchImages(
          `${driverData.full_name} formula 1 helmets head`,
          8,
        );

        setImages(driverPhotos.hits || []);
        setHelmets(helmetPhotos.hits || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [number]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!driver) return <div>Driver not found</div>;

  return (
    <div className={styles.container}>
      {/* HERO */}
      <div className={styles.hero}>
        {driver.headshot_url && (
          <img
            src={driver.headshot_url}
            alt={driver.full_name}
            className={styles.avatar}
          />
        )}

        <div className={styles.info}>
          <h1>{driver.full_name}</h1>
          <h2>#{driver.driver_number}</h2>
          <p>{driver.team_name}</p>
          <p>Country: {driver.country_code}</p>
        </div>
      </div>

      {/* BIO */}
      <div className={styles.bio}>
        <h3>Biography</h3>

        <p>
          {driver.full_name} is a Formula 1 driver competing for{" "}
          {driver.team_name}. He represents {driver.country_code}. This driver
          is part of the modern era of Formula 1 racing.
        </p>
      </div>

      {/* DRIVER PHOTOS */}
      <div className={styles.section}>
        <h2>Driver Photos</h2>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={3}
          navigation
          pagination={{ clickable: true }}
        >
          {images.map((img) => (
            <SwiperSlide key={img.id}>
              <img
                //@ts-ignore
                src={img.webformatURL}
                alt="driver"
                className={styles.slideImage}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* HELMET PHOTOS */}
      <div className={styles.section}>
        <h2>Helmet Gallery</h2>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={20}
          slidesPerView={3}
          navigation
          pagination={{ clickable: true }}
        >
          {helmets.map((img) => (
            <SwiperSlide key={img.id}>
              <img
                //@ts-ignore
                src={img.webformatURL}
                alt="helmet"
                className={styles.slideImage}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default DriverDetail;
