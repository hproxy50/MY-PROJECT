import api from "../../api/api.js"; 
import useSWR from "swr";

const fetcher = (url) => api.get(url).then((res) => res.data);

export function useStaffDashboard() {
  const { data, error, isLoading } = useSWR(
    "/dashboard/summary",
    fetcher,
    {
      refreshInterval: 5000,
      dedupingInterval: 5000,
      revalidateOnFocus: true,
    }
  );

  return {
    dashboardData: data,
    isLoading,
    isError: error,
  };
}