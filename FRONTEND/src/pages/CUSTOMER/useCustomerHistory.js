// src/hooks/useCustomerHistory.js
import useSWR, { mutate } from "swr";
import API from "../../api/api.js"; 


const fetcher = async (url) => {
  const res = await API.get(url);
  const ordersData = res.data.orders || [];

  const updatedOrders = await Promise.all(
    ordersData.map(async (order) => {
      try {
        const check = await API.get(`/ratings/check/${order.order_id}`);
        return {
          ...order,
          isRated: check.data.rated,
          ratingData: check.data 
        };
      } catch {
        return { ...order, isRated: false };
      }
    })
  );
  return updatedOrders;
};

export function useCustomerHistory(showAllBranches) {
  const currentBranchId = localStorage.getItem("currentBranchId");
  
  let url = "/history";
  if (!showAllBranches && currentBranchId) {
    url = `/history?branch_id=${currentBranchId}`;
  }

  const { data, error, isLoading } = useSWR(url, fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  return {
    orders: data || [],
    isLoading,
    isError: error,
    mutate, 
    key: url 
  };
}