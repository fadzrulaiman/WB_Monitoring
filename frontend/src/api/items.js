import { useCallback } from 'react';
import useAxiosPrivate from '../hooks/useAxiosPrivate';

// Custom hook for item API operations
const useItemsAPI = () => {
  const axiosPrivate = useAxiosPrivate();

  const getItems = useCallback(async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await axiosPrivate.get(`/items?${queryParams.toString()}`);
    return response.data;
  }, [axiosPrivate]);

  const getItemById = useCallback(async (id) => {
    const response = await axiosPrivate.get(`/items/${id}`);
    return response.data;
  }, [axiosPrivate]);

  const createItem = useCallback(async (itemData) => {
    const response = await axiosPrivate.post('/items', itemData);
    return response.data;
  }, [axiosPrivate]);

  const updateItem = useCallback(async (id, itemData) => {
    const response = await axiosPrivate.put(`/items/${id}`, itemData);
    return response.data;
  }, [axiosPrivate]);

  const deleteItem = useCallback(async (id) => {
    const response = await axiosPrivate.delete(`/items/${id}`);
    return response.data;
  }, [axiosPrivate]);

  return {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
  };
};

export default useItemsAPI; 