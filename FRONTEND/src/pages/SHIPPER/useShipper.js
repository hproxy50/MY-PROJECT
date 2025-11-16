import useSWR, { mutate } from "swr";
import api from "../../api/api.js";

const SHIPPER_ORDERS_URL = "/shipper/orders";

const fetcher = (url) => api.get(url).then((res) => res.data);

export function useShipperOrders() {
  const { data, error, isLoading } = useSWR(SHIPPER_ORDERS_URL, fetcher, {
    refreshInterval: 10000,
    dedupingInterval: 10000,
    revalidateOnFocus: true,
  });

  return {
    orders: data?.orders || [],
    isLoading,
    isError: error,
  };
}

/**
 *
 * @param {number} orderId
 */
export const completeShipperOrder = async (orderId) => {
  try {
    const response = await api.post("/shipper/orders/complete", {
      order_id: orderId,
    });
    mutate(SHIPPER_ORDERS_URL);
    return response.data;
  } catch (error) {
    console.error("Error completing order:", error);
    throw error.response?.data || new Error("Unable to complete order");
  }
};

/**
 * 
 * @param {number} orderId
 */
export const cancelShipperOrder = async (orderId) => {
  try {
    const response = await api.post("/shipper/orders/cancel", {
      order_id: orderId,
    });
    mutate(SHIPPER_ORDERS_URL);
    return response.data;
  } catch (error) {
    console.error("Error canceling order:", error);
    throw error.response?.data || new Error("Unable to cancel order");
  }
};
