export const fetcher = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "API Error");
  }
  return res.json();
};

// Auth headers
export const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
