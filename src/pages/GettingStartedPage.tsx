import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GettingStartedPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the dynamic content page
    navigate('/getting-started', { replace: true });
  }, [navigate]);

  return null;
};

export default GettingStartedPage;