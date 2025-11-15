import api from "../../api/api.js";
import useSWR from "swr";

const fetcher = (url) => api.get(url).then((res) => res.data);

export function useAdminDashboard() {
  const { data, error, isLoading } = useSWR(
    "/admin-dashboard/summary",
    fetcher,
    {
      refreshInterval: 60000, //60s
      revalidateOnFocus: true,
    }
  );

  return {
    dashboardData: data,
    isLoading,
    isError: error,
  };
}