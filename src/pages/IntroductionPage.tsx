import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const IntroductionPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the dynamic content page
    navigate('/introduction', { replace: true });
  }, [navigate]);

  return null;
};

export default IntroductionPage;