import React, { useEffect, useState } from "react";
import axios from "axios";

import { IArticle, INewsApiResponse } from "../../@types/news.types";

import styles from "./Home.module.scss";
import Header from "../Header/Header";

const API_KEY = "617dfb9466ab412ab4bc6c62d99c446f";

interface IGoApiResponse {
  message: string;
  status: string;
}

const Home = () => {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [apiMessage, setApiMessage] = useState("");
  const [apiError, setApiError] = useState("");

  // Загружаем новости Формулы-1
  useEffect(() => {
    const fetchNews = async () => {
      const url = "https://newsapi.org/v2/everything";

      const params = {
        q: `"Formula 1"`,
        language: "en",
        sortBy: "publishedAt",
        apiKey: API_KEY,
      };

      try {
        const response = await axios.get<INewsApiResponse>(url, { params });
        setArticles(response.data.articles);
      } catch (err) {
        setError("Failed to fetch news");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Получаем сообщение от Go API
  useEffect(() => {
    const fetchGoApi = async () => {
      try {
        const response = await fetch("/api/hello");

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data: IGoApiResponse = await response.json();

        setApiMessage(data.message);
      } catch (err) {
        console.error("Go API error:", err);
        setApiError("Не удалось подключиться к Go API");
      }
    };

    fetchGoApi();
  }, []);

  return (
    <>
      <div>
        <h2>Проверка Go API</h2>

        {apiMessage ? (
          <p>{apiMessage}</p>
        ) : apiError ? (
          <p>{apiError}</p>
        ) : (
          <p>Подключаемся к Go API...</p>
        )}
      </div>

      {loading ? (
        <div>Loading news...</div>
      ) : error ? (
        <div>{error}</div>
      ) : (
        <div className={styles.container}>
          {articles.map((article, index) => (
            <div key={index} className={styles.newsCard}>
              {article.urlToImage && (
                <img src={article.urlToImage} alt={article.title} />
              )}

              <h3>{article.title}</h3>
              <p>{article.description}</p>

              <a href={article.url} target="_blank" rel="noopener noreferrer">
                Read more
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Home;
