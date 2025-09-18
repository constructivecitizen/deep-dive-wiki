import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HierarchySystemsPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the dynamic content page
    navigate('/hierarchy-systems', { replace: true });
  }, [navigate]);

  return null;
};

export default HierarchySystemsPage;