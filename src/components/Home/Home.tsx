import React, { useEffect, useState } from "react";
import axios from "axios";

import { IArticle, INewsApiResponse } from "../../@types/news.types";

import styles from "./Home.module.scss";
import Header from "../Header/Header";

const API_KEY = "617dfb9466ab412ab4bc6c62d99c446f";

const Home = () => {
  const [articles, setArticles] = useState<IArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      const url = "https://newsapi.org/v2/everything";
      const params = {
        q: `"Formula 1"`,
        language: "en",
        sortBy: "publishedAt",
        apiKey: API_KEY,
      };

      console.log("🔹 Fetching news with params:", params);

      try {
        const response = await axios.get<INewsApiResponse>(url, { params });
        console.log(response.data);

        setArticles(response.data.articles);
      } catch (err) {
        setError("Failed to fetch news");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) return <div>Loading news...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
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
    </>
  );
};

export default Home;
