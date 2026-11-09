import ChatWindow from '@/components/ChatWindow';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research - Vedaix',
  description: 'Ask Vedaix anything and get a cited answer.',
};

const Home = () => {
  return <ChatWindow />;
};

export default Home;
