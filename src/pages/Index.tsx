import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const IndexPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the dynamic content page
    navigate('/', { replace: true });
  }, [navigate]);

  return null;
};

export default IndexPage;