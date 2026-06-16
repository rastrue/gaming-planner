import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUnauthorizedHandler } from '../../services/sessionManager';
import { clearCurrentUser } from '../../store/authSlice';
import type { AppDispatch } from '../../store/store';

export default function SessionExpiryHandler() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    return registerUnauthorizedHandler(() => {
      dispatch(clearCurrentUser());

      const path = window.location.pathname;
      if (path === '/login' || path === '/register') {
        return;
      }

      navigate('/login', {
        replace: true,
        state: { from: path, sessionExpired: true },
      });
    });
  }, [dispatch, navigate]);

  return null;
}
