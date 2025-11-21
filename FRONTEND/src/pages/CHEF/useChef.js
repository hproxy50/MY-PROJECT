import useSWR, { mutate } from "swr";
import api from "../../api/api.js";

const CHEF_ORDERS_URL = "/chef/orders/preparing";

const fetcher = (url) => api.get(url).then((res) => res.data);

export function useChefOrders() {
  const { data, error, isLoading } = useSWR(CHEF_ORDERS_URL, fetcher, {
    refreshInterval: 5000, 
    dedupingInterval: 5000, 
    revalidateOnFocus: true, 
  });

  return {
    orders: data?.orders || [],
    isLoading,
    isError: error,
  };
}

/**
 * @param {number} orderId
 */
export const approveChefOrder = async (orderId) => {
  try {
    const response = await api.patch("/chef/orders/approve", {
      order_id: orderId,
    });

    mutate(CHEF_ORDERS_URL);

    return response.data;
  } catch (error) {
    console.error("Error in approval:", error);
    throw error.response?.data || new Error("Unable to approve application");
  }
};

/**
 *
 * @param {number} orderId
 */
export const cancelChefOrder = async (orderId) => {
  try {
    const response = await api.post("/chef/orders/cancel", {
      order_id: orderId,
    });
    mutate(CHEF_ORDERS_URL);
    return response.data;
  } catch (error) {
    console.error("Error canceling order:", error);
    throw error.response?.data || new Error("Unable to cancel order");
  }
};
