import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import VideosListResponse from "@api.video/nodejs-client/lib/model/VideosListResponse";

export default function Videos() {
  const [videosResponse, setVideosResponse] = useState<
    VideosListResponse | undefined
  >(undefined);
  const [error, setError] = useState<boolean>(false);
  useEffect(() => {
    fetch("/api/videos")
      .then((res) => res.json())
      .then((res: { videos: VideosListResponse }) =>
        setVideosResponse(res.videos),
      )
      .catch((_) => setError(true));
  }, []);

  return (
    <div className="global-container">
      <Head>
        <title>Videos List</title>
        <meta
          name="description"
          content="Generated by create next app & created by api.video"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <span>api.video videos list</span> 📚
      </header>

      <main>
        <div className="texts-container">
          <p>
            Welcome to this basic example of videos list provided by{" "}
            <a
              href="https://api.video"
              target="_blank"
              rel="noopener noreferrer"
            >
              api.video
            </a>
            .
          </p>
          <p>
            Please, add your api.video API key in your <i>.env</i> file and let
            the power of the API do the rest 🎩
          </p>
        </div>

        {!videosResponse && !error && <div>Loading...</div>}
        {error && (
          <div className="error">
            An error occurred trying to fetch your videos. Be sure to have you
            API key set in your .env file this way: <i>API_KEY=YOUR_API_KEY</i>
          </div>
        )}
        {videosResponse && videosResponse.data?.length > 0 && (
          <div className="videos-list">
            {videosResponse.data.map((video) => (
              <a
                className="video-card"
                href={`/videos/${video.videoId}`}
                key={video.videoId}
              >
                <h3>{video.title}</h3>
                <Image
                  src={video.assets?.thumbnail ?? "/vercel.svg"}
                  alt="Video thumbmail"
                  width={150}
                  height={80}
                />
              </a>
            ))}
          </div>
        )}
        {videosResponse && videosResponse.data?.length === 0 && (
          <>
            <p>You don't have any video yet 🧐</p>
            <a className="button" href="/uploader">
              Upload my first video
            </a>
          </>
        )}
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{" "}
          <span>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
        <span>and</span>
        <a href="https://api.video" target="_blank" rel="noopener noreferrer">
          api.video
        </a>
      </footer>
    </div>
  );
}
