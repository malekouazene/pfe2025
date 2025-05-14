

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

export const fetchEvaluations = async () => {
  const res = await axios.get(`${API_BASE}/evaluate`);
  return res.data;
};
