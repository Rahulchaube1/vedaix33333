import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home - Vedaix',
  description: 'Ask Vedaix anything and explore the web with cited answers.',
};

const Home = () => {
  return <ChatWindow />;
};

export default Home;
