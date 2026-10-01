import Head from "next/head";
import "../styles/globals.css";
import ChatBot from "../components/ChatBot";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Harvest Hub | Fresh Produce From Local Farmers</title>
        <meta name="description" content="Connect directly with local farmers and buy farm-fresh vegetables, fruits, and grains with local delivery." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌾</text></svg>" />
      </Head>
      <Component {...pageProps} />
      <ChatBot />
    </>
  );
}