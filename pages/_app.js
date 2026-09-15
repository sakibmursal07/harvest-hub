import "../styles/globals.css";
import ChatBot from "../components/ChatBot";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <ChatBot />
    </>
  );
}